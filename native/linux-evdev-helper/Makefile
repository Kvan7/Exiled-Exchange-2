CC ?= cc
CFLAGS ?= -std=c11 -Wall -Wextra -Werror -O2
PREFIX ?= /usr/local

BIN := linux-evdev-helper
DEBUG_BIN := linux-evdev-helper-debug
SRC := linux-evdev-helper.c

.PHONY: all clean debug install

all: $(BIN)

$(BIN): $(SRC)
	$(CC) $(CFLAGS) -o $@ $<

debug: $(DEBUG_BIN)

$(DEBUG_BIN): $(SRC)
	$(CC) $(CFLAGS) -DEE2_HELPER_DEBUG_EVENTS -o $@ $<

install: $(BIN)
	install -Dm755 $(BIN) "$(DESTDIR)$(PREFIX)/bin/$(BIN)"

clean:
	rm -f $(BIN) $(DEBUG_BIN)
