import { ITEM_BY_REF } from "@/assets/data";
import { AppConfig } from "@/web/Config";

function cmtHantBaseType(name: string) {
  for (const sp of ["之", "的"]) {
    const elems = name.split(sp);
    if (elems.length > 1) {
      return elems.pop();
    }
  }

  return name;
}

export function magicBasetype(name: string) {
  const separator = " ";
  if (AppConfig().language === "cmn-Hant") {
    if (/[\u4e00-\u9fa5]/.test(name)) {
      return cmtHantBaseType(name);
    }
  }
  const words = name.split(separator);

  const perm: string[] = words.flatMap((_, start) =>
    Array(words.length - start)
      .fill(undefined)
      .map((_, idx) => words.slice(start, start + idx + 1).join(separator)),
  );

  const result = perm
    .map((name) => {
      const result = ITEM_BY_REF("ITEM", name);
      return { name, found: result && result[0].craftable };
    })
    .filter((res) => res.found)
    .sort((a, b) => b.name.length - a.name.length);

  return result.length ? result[0].name : undefined;
}
