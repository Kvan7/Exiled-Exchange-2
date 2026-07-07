import fs from "node:fs/promises";

export async function guessFileLocation(
  entries: Iterable<string>,
): Promise<string | null | undefined> {
  let found: string | null | undefined = undefined;
  for (const path of entries) {
    try {
      // eslint-disable-next-line no-await-in-loop -- not here
      await fs.access(path, fs.constants.R_OK);
      if (!found) {
        // don't allow multiple matches (i.e. standalone + Steam)
        return null;
      }
      found = path;
    } catch {}
  }
  return found;
}
