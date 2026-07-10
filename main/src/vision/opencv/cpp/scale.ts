import type * as cv from "@u4/opencv4nodejs";
import { createBgMask, filterMultiple } from "./utils";
import {
  FINE_TUNE_SCALES,
  ULTRA_FINE_TUNE_SCALES,
  USUAL_SCALES,
} from "../constants";
import { getTomePxSize } from "../common";
import { getTomeBg } from "./image";

function bestScale(
  img: cv.Mat,
  needle: cv.Mat,
  originalH: number,
  scales: number[],
  threshold: number,
  startingScale = 1,
) {
  let bestScale = startingScale;
  let bestFound: cv.Rect[] = [];
  for (const testScale of scales) {
    const size = getTomePxSize(testScale, originalH);

    const scaledNeedle = needle.resize(size, size);
    const mask = createBgMask(size);
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
  }
  return { scale: bestScale, rects: bestFound };
}

export function getImageScale(img: cv.Mat, original: { w: number; h: number }) {
  const needle = getTomeBg();
  const { scale: firstScale, rects: firstRects } = bestScale(
    img,
    needle,
    original.h,
    USUAL_SCALES,
    0.7,
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

  return thirdScale;
}
