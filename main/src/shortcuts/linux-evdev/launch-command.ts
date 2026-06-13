import type { LinuxEvdevHelperConfig } from "./types";

export function buildHelperSpawnCommand(
  helperPath: string,
  elevation: LinuxEvdevHelperConfig["elevation"],
) {
  if (elevation === "none") {
    return { command: helperPath, args: ["--replace-existing"] };
  }

  if (elevation === "sudo") {
    return { command: "sudo", args: ["-A", helperPath, "--replace-existing"] };
  }

  return { command: "pkexec", args: [helperPath, "--replace-existing"] };
}
