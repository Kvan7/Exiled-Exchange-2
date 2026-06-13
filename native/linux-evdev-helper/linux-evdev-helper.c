#define _POSIX_C_SOURCE 200809L

#include <errno.h>
#include <fcntl.h>
#include <linux/input.h>
#include <dirent.h>
#include <limits.h>
#include <poll.h>
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/ioctl.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>

#define MAX_DEVICES 32
#define MAX_HOTKEYS 128
#define MAX_STRING 256
#define CONFIG_LIMIT (128 * 1024)

typedef struct {
  bool ctrl;
  bool shift;
  bool alt;
  bool meta;
} ModState;

typedef struct {
  char id[MAX_STRING];
  char accelerator[MAX_STRING];
  int key_code;
  ModState mods;
} Hotkey;

typedef struct {
  pid_t parent_pid;
  char devices[MAX_DEVICES][MAX_STRING];
  size_t device_count;
  Hotkey hotkeys[MAX_HOTKEYS];
  size_t hotkey_count;
} Config;

static volatile sig_atomic_t should_stop = 0;
#ifdef EE2_HELPER_DEBUG_EVENTS
static bool debug_events = false;
#endif

static void on_signal(int signo) {
  (void)signo;
  should_stop = 1;
}

static void json_escape(FILE *out, const char *s) {
  for (; *s; s++) {
    if (*s == '"' || *s == '\\') {
      fputc('\\', out);
      fputc(*s, out);
    } else if (*s == '\n') {
      fputs("\\n", out);
    } else if (*s == '\r') {
      fputs("\\r", out);
    } else if (*s == '\t') {
      fputs("\\t", out);
    } else {
      fputc(*s, out);
    }
  }
}

static void emit_error(const char *code, const char *message, const char *device) {
  printf("{\"type\":\"error\",\"code\":\"");
  json_escape(stdout, code);
  printf("\",\"message\":\"");
  json_escape(stdout, message);
  if (device != NULL) {
    printf("\",\"device\":\"");
    json_escape(stdout, device);
  }
  printf("\"}\n");
  fflush(stdout);
}

static bool parse_pid_name(const char *name, pid_t *pid) {
  char *end = NULL;
  errno = 0;
  long value = strtol(name, &end, 10);
  if (errno != 0 || end == name || *end != '\0' || value <= 0) return false;
  *pid = (pid_t)value;
  return true;
}

static bool read_proc_exe_basename(pid_t pid, char *out, size_t out_len) {
  char path[64];
  char target[PATH_MAX];
  snprintf(path, sizeof(path), "/proc/%ld/exe", (long)pid);

  ssize_t len = readlink(path, target, sizeof(target) - 1);
  if (len < 0) return false;
  target[len] = '\0';

  const char *base = strrchr(target, '/');
  base = base == NULL ? target : base + 1;
  if (strlen(base) + 1 > out_len) return false;
  strcpy(out, base);
  return true;
}

static bool is_process_alive(pid_t pid) {
  return kill(pid, 0) == 0 || errno == EPERM;
}

static void sleep_ms(long ms) {
  struct timespec delay;
  delay.tv_sec = ms / 1000;
  delay.tv_nsec = (ms % 1000) * 1000000L;
  while (nanosleep(&delay, &delay) != 0 && errno == EINTR) {
  }
}

static void kill_existing_helpers(void) {
  DIR *proc = opendir("/proc");
  if (proc == NULL) {
    emit_error("replace-scan-failed", strerror(errno), NULL);
    return;
  }

  pid_t self = getpid();
  pid_t victims[256];
  size_t victim_count = 0;
  struct dirent *entry;

  while ((entry = readdir(proc)) != NULL) {
    pid_t pid;
    char exe_name[64];
    if (!parse_pid_name(entry->d_name, &pid)) continue;
    if (pid == self) continue;
    if (!read_proc_exe_basename(pid, exe_name, sizeof(exe_name))) continue;
    if (strcmp(exe_name, "linux-evdev-helper") != 0) continue;
    if (victim_count < sizeof(victims) / sizeof(victims[0])) {
      victims[victim_count++] = pid;
    }
  }
  closedir(proc);

  for (size_t i = 0; i < victim_count; i++) {
    if (kill(victims[i], SIGTERM) != 0 && errno != ESRCH) {
      emit_error("replace-sigterm-failed", strerror(errno), NULL);
    }
  }

  for (int attempt = 0; attempt < 20; attempt++) {
    bool any_alive = false;
    for (size_t i = 0; i < victim_count; i++) {
      if (is_process_alive(victims[i])) {
        any_alive = true;
        break;
      }
    }
    if (!any_alive) return;
    sleep_ms(50);
  }

  for (size_t i = 0; i < victim_count; i++) {
    if (is_process_alive(victims[i])) {
      if (kill(victims[i], SIGKILL) != 0 && errno != ESRCH) {
        emit_error("replace-sigkill-failed", strerror(errno), NULL);
      }
    }
  }
}

static int key_code_for_name(const char *name) {
  if (strlen(name) == 1) {
    char c = name[0];
    if (c >= 'A' && c <= 'Z') {
      static const int letters[] = {
        KEY_A, KEY_B, KEY_C, KEY_D, KEY_E, KEY_F, KEY_G, KEY_H, KEY_I,
        KEY_J, KEY_K, KEY_L, KEY_M, KEY_N, KEY_O, KEY_P, KEY_Q, KEY_R,
        KEY_S, KEY_T, KEY_U, KEY_V, KEY_W, KEY_X, KEY_Y, KEY_Z,
      };
      return letters[c - 'A'];
    }
    if (c >= '0' && c <= '9') {
      static const int digits[] = {
        KEY_0, KEY_1, KEY_2, KEY_3, KEY_4,
        KEY_5, KEY_6, KEY_7, KEY_8, KEY_9,
      };
      return digits[c - '0'];
    }
  }

  if (strncmp(name, "F", 1) == 0) {
    char *end = NULL;
    long n = strtol(name + 1, &end, 10);
    if (end != name + 1 && *end == '\0' && n >= 1 && n <= 24) {
      if (n <= 10) return KEY_F1 + (int)n - 1;
      if (n == 11) return KEY_F11;
      if (n == 12) return KEY_F12;
      return KEY_F13 + (int)n - 13;
    }
  }

  if (strcmp(name, "Space") == 0) return KEY_SPACE;
  if (strcmp(name, "Enter") == 0) return KEY_ENTER;
  if (strcmp(name, "Tab") == 0) return KEY_TAB;
  if (strcmp(name, "Escape") == 0) return KEY_ESC;
  if (strcmp(name, "Backspace") == 0) return KEY_BACKSPACE;
  if (strcmp(name, "Delete") == 0) return KEY_DELETE;
  if (strcmp(name, "Insert") == 0) return KEY_INSERT;
  if (strcmp(name, "Home") == 0) return KEY_HOME;
  if (strcmp(name, "End") == 0) return KEY_END;
  if (strcmp(name, "PageUp") == 0) return KEY_PAGEUP;
  if (strcmp(name, "PageDown") == 0) return KEY_PAGEDOWN;
  if (strcmp(name, "ArrowLeft") == 0) return KEY_LEFT;
  if (strcmp(name, "ArrowRight") == 0) return KEY_RIGHT;
  if (strcmp(name, "ArrowUp") == 0) return KEY_UP;
  if (strcmp(name, "ArrowDown") == 0) return KEY_DOWN;
  if (strcmp(name, "Minus") == 0) return KEY_MINUS;
  if (strcmp(name, "Equal") == 0) return KEY_EQUAL;
  if (strcmp(name, "BracketLeft") == 0) return KEY_LEFTBRACE;
  if (strcmp(name, "BracketRight") == 0) return KEY_RIGHTBRACE;
  if (strcmp(name, "Backslash") == 0) return KEY_BACKSLASH;
  if (strcmp(name, "Semicolon") == 0) return KEY_SEMICOLON;
  if (strcmp(name, "Quote") == 0) return KEY_APOSTROPHE;
  if (strcmp(name, "Backquote") == 0) return KEY_GRAVE;
  if (strcmp(name, "Comma") == 0) return KEY_COMMA;
  if (strcmp(name, "Period") == 0) return KEY_DOT;
  if (strcmp(name, "Slash") == 0) return KEY_SLASH;
  return -1;
}

static char *read_stdin_config(void) {
  size_t cap = 4096;
  size_t len = 0;
  char *buf = malloc(cap);
  if (buf == NULL) return NULL;

  for (;;) {
    if (len + 1024 + 1 > cap) {
      cap *= 2;
      if (cap > CONFIG_LIMIT) {
        free(buf);
        return NULL;
      }
      char *next = realloc(buf, cap);
      if (next == NULL) {
        free(buf);
        return NULL;
      }
      buf = next;
    }

    size_t n = fread(buf + len, 1, 1024, stdin);
    len += n;
    if (n < 1024) {
      if (ferror(stdin)) {
        free(buf);
        return NULL;
      }
      break;
    }
  }

  buf[len] = '\0';
  return buf;
}

static const char *skip_ws(const char *p) {
  while (*p == ' ' || *p == '\n' || *p == '\r' || *p == '\t') p++;
  return p;
}

static const char *parse_json_string(const char *p, char *out, size_t out_len) {
  p = skip_ws(p);
  if (*p != '"') return NULL;
  p++;

  size_t n = 0;
  while (*p && *p != '"') {
    char c = *p++;
    if (c == '\\') {
      c = *p++;
      if (c == 'n') c = '\n';
      else if (c == 'r') c = '\r';
      else if (c == 't') c = '\t';
      else if (c == '\0') return NULL;
    }
    if (n + 1 >= out_len) return NULL;
    out[n++] = c;
  }

  if (*p != '"') return NULL;
  out[n] = '\0';
  return p + 1;
}

static const char *find_key(const char *json, const char *key) {
  char needle[64];
  snprintf(needle, sizeof(needle), "\"%s\"", key);
  return strstr(json, needle);
}

static bool parse_bool_after_key(const char *object, const char *key) {
  const char *p = find_key(object, key);
  if (p == NULL) return false;
  p = strchr(p, ':');
  if (p == NULL) return false;
  p = skip_ws(p + 1);
  return strncmp(p, "true", 4) == 0;
}

static bool parse_string_after_key(const char *object, const char *key, char *out, size_t out_len) {
  const char *p = find_key(object, key);
  if (p == NULL) return false;
  p = strchr(p, ':');
  if (p == NULL) return false;
  return parse_json_string(p + 1, out, out_len) != NULL;
}

static bool parse_pid_after_key(const char *object, const char *key, pid_t *out) {
  const char *p = find_key(object, key);
  if (p == NULL) return false;
  p = strchr(p, ':');
  if (p == NULL) return false;
  p = skip_ws(p + 1);

  char *end = NULL;
  errno = 0;
  long value = strtol(p, &end, 10);
  if (errno != 0 || end == p || value <= 0) return false;
  *out = (pid_t)value;
  return true;
}

static bool parse_devices(const char *json, Config *config) {
  const char *p = find_key(json, "devices");
  if (p == NULL) return false;
  p = strchr(p, '[');
  if (p == NULL) return false;
  p++;

  while (*p && *p != ']') {
    if (config->device_count >= MAX_DEVICES) return false;
    p = parse_json_string(p, config->devices[config->device_count], MAX_STRING);
    if (p == NULL) return false;
    config->device_count++;
    p = skip_ws(p);
    if (*p == ',') p++;
  }

  return config->device_count > 0;
}

static bool parse_hotkeys(const char *json, Config *config) {
  const char *p = find_key(json, "hotkeys");
  if (p == NULL) return false;
  p = strchr(p, '[');
  if (p == NULL) return false;
  p++;

  while (*p && *p != ']') {
    p = skip_ws(p);
    if (*p == ',') {
      p++;
      continue;
    }
    if (*p != '{') return false;

    const char *end = strchr(p, '}');
    if (end == NULL || config->hotkey_count >= MAX_HOTKEYS) return false;

    char object[2048];
    size_t len = (size_t)(end - p + 1);
    if (len >= sizeof(object)) return false;
    memcpy(object, p, len);
    object[len] = '\0';

    Hotkey *hotkey = &config->hotkeys[config->hotkey_count];
    char key[MAX_STRING];
    if (!parse_string_after_key(object, "id", hotkey->id, sizeof(hotkey->id)) ||
        !parse_string_after_key(object, "accelerator", hotkey->accelerator, sizeof(hotkey->accelerator)) ||
        !parse_string_after_key(object, "key", key, sizeof(key))) {
      return false;
    }
    hotkey->key_code = key_code_for_name(key);
    if (hotkey->key_code < 0) return false;
    hotkey->mods.ctrl = parse_bool_after_key(object, "ctrl");
    hotkey->mods.shift = parse_bool_after_key(object, "shift");
    hotkey->mods.alt = parse_bool_after_key(object, "alt");
    hotkey->mods.meta = parse_bool_after_key(object, "meta");
    config->hotkey_count++;

    p = end + 1;
  }

  return config->hotkey_count > 0;
}

static bool parse_config(const char *json, Config *config) {
  memset(config, 0, sizeof(*config));
  return parse_pid_after_key(json, "parentPid", &config->parent_pid) &&
         parse_devices(json, config) &&
         parse_hotkeys(json, config);
}

static bool is_ctrl_key(int code) {
  return code == KEY_LEFTCTRL || code == KEY_RIGHTCTRL;
}

static bool is_shift_key(int code) {
  return code == KEY_LEFTSHIFT || code == KEY_RIGHTSHIFT;
}

static bool is_alt_key(int code) {
  return code == KEY_LEFTALT || code == KEY_RIGHTALT;
}

static bool is_meta_key(int code) {
  return code == KEY_LEFTMETA || code == KEY_RIGHTMETA;
}

static bool mods_match(const ModState *actual, const ModState *wanted) {
  return actual->ctrl == wanted->ctrl &&
         actual->shift == wanted->shift &&
         actual->alt == wanted->alt &&
         actual->meta == wanted->meta;
}

static bool bit_is_set(const unsigned long *bits, int bit) {
  return (bits[bit / (int)(8 * sizeof(unsigned long))] &
          (1UL << (bit % (int)(8 * sizeof(unsigned long))))) != 0;
}

#ifdef EE2_HELPER_DEBUG_EVENTS
static bool device_has_key(int fd, int key) {
  unsigned long keys[(KEY_MAX + 8 * sizeof(unsigned long)) / (8 * sizeof(unsigned long))];
  memset(keys, 0, sizeof(keys));
  if (ioctl(fd, EVIOCGBIT(EV_KEY, sizeof(keys)), keys) < 0) return false;
  return bit_is_set(keys, key);
}
#endif

static bool read_mod_state(int fd, ModState *mods) {
  unsigned long keys[(KEY_MAX + 8 * sizeof(unsigned long)) / (8 * sizeof(unsigned long))];
  memset(keys, 0, sizeof(keys));
  if (ioctl(fd, EVIOCGKEY(sizeof(keys)), keys) < 0) return false;

  mods->ctrl = bit_is_set(keys, KEY_LEFTCTRL) || bit_is_set(keys, KEY_RIGHTCTRL);
  mods->shift = bit_is_set(keys, KEY_LEFTSHIFT) || bit_is_set(keys, KEY_RIGHTSHIFT);
  mods->alt = bit_is_set(keys, KEY_LEFTALT) || bit_is_set(keys, KEY_RIGHTALT);
  mods->meta = bit_is_set(keys, KEY_LEFTMETA) || bit_is_set(keys, KEY_RIGHTMETA);
  return true;
}

static int open_devices(const Config *config, int fds[MAX_DEVICES], struct pollfd polls[MAX_DEVICES]) {
  for (size_t i = 0; i < config->device_count; i++) {
    if (strncmp(config->devices[i], "/dev/input/event", 16) != 0 ||
        config->devices[i][16] < '0' ||
        config->devices[i][16] > '9') {
      emit_error("invalid-device", "device path must start with /dev/input/event", config->devices[i]);
      for (size_t j = 0; j < i; j++) close(fds[j]);
      return -1;
    }

    int fd = open(config->devices[i], O_RDONLY | O_CLOEXEC);
    if (fd < 0) {
      emit_error("open-device-failed", strerror(errno), config->devices[i]);
      for (size_t j = 0; j < i; j++) close(fds[j]);
      return -1;
    }
#ifdef EE2_HELPER_DEBUG_EVENTS
    if (debug_events) {
      char name[256] = {0};
      if (ioctl(fd, EVIOCGNAME(sizeof(name)), name) < 0) {
        snprintf(name, sizeof(name), "unknown: %s", strerror(errno));
      }
      fprintf(
        stderr,
        "opened device=%s name=\"%s\" has_keys={ctrl:%d d:%d n:%d period:%d space:%d}\n",
        config->devices[i],
        name,
        device_has_key(fd, KEY_LEFTCTRL) || device_has_key(fd, KEY_RIGHTCTRL),
        device_has_key(fd, KEY_D),
        device_has_key(fd, KEY_N),
        device_has_key(fd, KEY_DOT),
        device_has_key(fd, KEY_SPACE)
      );
      fflush(stderr);
    }
#endif
    fds[i] = fd;
    polls[i].fd = fd;
    polls[i].events = POLLIN;
    polls[i].revents = 0;
  }

  return 0;
}

static int check_permissions(const Config *config) {
  if (geteuid() != 0) {
    emit_error("not-root", "linux-evdev-helper must run as root", NULL);
    return 1;
  }

  int fds[MAX_DEVICES];
  struct pollfd polls[MAX_DEVICES];
  if (open_devices(config, fds, polls) != 0) return 1;
  for (size_t i = 0; i < config->device_count; i++) close(fds[i]);
  printf("{\"type\":\"permissions\",\"ok\":true,\"devices\":%zu}\n", config->device_count);
  return 0;
}

static void emit_ready(const Config *config) {
  printf("{\"type\":\"ready\",\"devices\":[");
  for (size_t i = 0; i < config->device_count; i++) {
    if (i) printf(",");
    printf("\"");
    json_escape(stdout, config->devices[i]);
    printf("\"");
  }
  printf("],\"hotkeys\":%zu}\n", config->hotkey_count);
  fflush(stdout);
}

static void emit_hotkey(const Hotkey *hotkey, const struct input_event *event) {
  long long ts = ((long long)event->time.tv_sec * 1000LL) + ((long long)event->time.tv_usec / 1000LL);
  printf("{\"type\":\"hotkey\",\"id\":\"");
  json_escape(stdout, hotkey->id);
  printf("\",\"accelerator\":\"");
  json_escape(stdout, hotkey->accelerator);
  printf("\",\"ts\":%lld}\n", ts);
  fflush(stdout);
}

#ifdef EE2_HELPER_DEBUG_EVENTS
static void debug_raw_key_event(
  const char *device,
  const struct input_event *event
) {
  if (!debug_events) return;
  fprintf(
    stderr,
    "raw-key device=%s code=%u value=%d\n",
    device,
    event->code,
    event->value
  );
  fflush(stderr);
}
#endif

#ifdef EE2_HELPER_DEBUG_EVENTS
static void debug_key_event(
  const char *device,
  const struct input_event *event,
  const ModState *mods
) {
  if (!debug_events) return;
  fprintf(
    stderr,
    "event device=%s type=%u code=%u value=%d mods={ctrl:%d shift:%d alt:%d meta:%d}\n",
    device,
    event->type,
    event->code,
    event->value,
    mods->ctrl,
    mods->shift,
    mods->alt,
    mods->meta
  );
  fflush(stderr);
}
#endif

#ifdef EE2_HELPER_DEBUG_EVENTS
static void debug_match_attempt(const Hotkey *hotkey, const struct input_event *event, const ModState *mods) {
  if (!debug_events) return;
  fprintf(
    stderr,
    "match? id=%s accelerator=%s event_code=%u wanted_code=%d wanted_mods={ctrl:%d shift:%d alt:%d meta:%d} actual_mods={ctrl:%d shift:%d alt:%d meta:%d}\n",
    hotkey->id,
    hotkey->accelerator,
    event->code,
    hotkey->key_code,
    hotkey->mods.ctrl,
    hotkey->mods.shift,
    hotkey->mods.alt,
    hotkey->mods.meta,
    mods->ctrl,
    mods->shift,
    mods->alt,
    mods->meta
  );
  fflush(stderr);
}
#endif

static int run_helper(const Config *config) {
  if (geteuid() != 0) {
    emit_error("not-root", "linux-evdev-helper must run as root", NULL);
    return 1;
  }

  int fds[MAX_DEVICES];
  struct pollfd polls[MAX_DEVICES];
  if (open_devices(config, fds, polls) != 0) return 1;

  signal(SIGTERM, on_signal);
  signal(SIGINT, on_signal);
  emit_ready(config);

  while (!should_stop) {
    if (!is_process_alive(config->parent_pid)) {
      break;
    }

    int ready = poll(polls, (nfds_t)config->device_count, 500);
    if (ready < 0) {
      if (errno == EINTR) continue;
      emit_error("poll-failed", strerror(errno), NULL);
      break;
    }
    if (ready == 0) continue;

    for (size_t i = 0; i < config->device_count; i++) {
      if ((polls[i].revents & POLLIN) == 0) continue;

      struct input_event event;
      ssize_t n = read(fds[i], &event, sizeof(event));
      if (n != (ssize_t)sizeof(event)) continue;
      if (event.type != EV_KEY) continue;
#ifdef EE2_HELPER_DEBUG_EVENTS
      debug_raw_key_event(config->devices[i], &event);
#endif
      if (event.value != 1) continue;
      if (is_ctrl_key(event.code) || is_shift_key(event.code) || is_alt_key(event.code) || is_meta_key(event.code)) {
        continue;
      }

      ModState mods = {0};
      if (!read_mod_state(fds[i], &mods)) {
        emit_error("read-key-state-failed", strerror(errno), config->devices[i]);
        continue;
      }
#ifdef EE2_HELPER_DEBUG_EVENTS
      debug_key_event(config->devices[i], &event, &mods);
#endif

      for (size_t j = 0; j < config->hotkey_count; j++) {
        const Hotkey *hotkey = &config->hotkeys[j];
#ifdef EE2_HELPER_DEBUG_EVENTS
        debug_match_attempt(hotkey, &event, &mods);
#endif
        if (event.code == hotkey->key_code && mods_match(&mods, &hotkey->mods)) {
          emit_hotkey(hotkey, &event);
        }
      }
    }
  }

  for (size_t i = 0; i < config->device_count; i++) close(fds[i]);
  return 0;
}

int main(int argc, char **argv) {
  if (argc > 1 && strcmp(argv[1], "--version") == 0) {
    printf("linux-evdev-helper 0.1.0\n");
    return 0;
  }

  bool replace_existing = false;
  bool check_permissions_mode = false;
  for (int i = 1; i < argc; i++) {
    if (strcmp(argv[i], "--replace-existing") == 0) {
      replace_existing = true;
    } else if (strcmp(argv[i], "--check-permissions") == 0) {
      check_permissions_mode = true;
#ifdef EE2_HELPER_DEBUG_EVENTS
    } else if (strcmp(argv[i], "--debug-events") == 0) {
      debug_events = true;
#endif
    } else {
      emit_error("invalid-argument", "unsupported command-line argument", argv[i]);
      return 1;
    }
  }

  char *json = read_stdin_config();
  if (json == NULL) {
    emit_error("read-config-failed", "failed to read helper configuration from stdin", NULL);
    return 1;
  }

  Config config;
  if (!parse_config(json, &config)) {
    free(json);
    emit_error("invalid-config", "helper configuration is invalid or unsupported", NULL);
    return 1;
  }
  free(json);

  if (check_permissions_mode) {
    return check_permissions(&config);
  }

  if (replace_existing) {
    if (geteuid() != 0) {
      emit_error("not-root", "linux-evdev-helper must run as root", NULL);
      return 1;
    }
    kill_existing_helpers();
  }

  return run_helper(&config);
}
