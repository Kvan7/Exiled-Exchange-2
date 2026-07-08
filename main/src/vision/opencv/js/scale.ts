import { createBgMask, filterMultiple } from "./utils";
import {
  FINE_TUNE_SCALES,
  ULTRA_FINE_TUNE_SCALES,
  USUAL_SCALES,
} from "../constants";
import { getTomePxSize } from "../common";
import { Mat, type Rect } from "@techstark/opencv-js";
import { getTomeBg } from "./image";

function bestScale(
  img: Mat,
  needle: Mat,
  originalH: number,
  scales: number[],
  threshold: number,
  startingScale = 1,
) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  let bestScale = startingScale;
  let bestFound: Rect[] = [];
  for (const testScale of scales) {
    const size = getTomePxSize(testScale, originalH);

    const scaledNeedle = new Mat(); // deleted, in loop
    cv.resize(needle, scaledNeedle, new cv.Size(size, size));
    const mask = createBgMask(size); // deleted, in loop
    const found = filterMultiple(
      img,
      scaledNeedle,
      threshold,
      size,
      size,
      mask,
    );
    if (found.length > bestFound.length) {
      bestScale = testScale;
      bestFound = found;
    }

    mask.delete();
    scaledNeedle.delete();
  }
  return { scale: bestScale, rects: bestFound };
}

export async function getImageScale(
  img: Mat,
  original: { w: number; h: number },
) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const needle = await getTomeBg(); // deleted
  const { scale: firstScale, rects: firstRects } = bestScale(
    img,
    needle,
    original.h,
    USUAL_SCALES,
    0.65,
  );
  console.log(`First scale guess: ${firstScale} [${firstRects.length}]`);

  const { scale: secondScale, rects: secondRects } = bestScale(
    img,
    needle,
    original.h,
    FINE_TUNE_SCALES.map((s) => firstScale + s / 100),
    0.75,
    firstScale,
  );
  console.log(`Second scale guess: ${secondScale} [${secondRects.length}]`);

  const { scale: thirdScale, rects: thirdRects } = bestScale(
    img,
    needle,
    original.h,
    ULTRA_FINE_TUNE_SCALES.map((s) => secondScale + s / 100),
    0.8,
    secondScale,
  );
  console.log(`Third scale guess: ${thirdScale} [${thirdRects.length}]`);

  needle.delete();
  return thirdScale;
}
