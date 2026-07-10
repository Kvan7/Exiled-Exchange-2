import * as cv from "@u4/opencv4nodejs";
import {
  createBgMask,
  cropToTopLeft,
  drawRects,
  filterMultiple,
} from "./utils";
import assert from "node:assert";
import {
  EXPECTED_SLOP_X,
  EXPECTED_SLOP_Y,
  NORMAL_TOME_FILTER,
  PREPROCESSED_MATCH_LIST,
  RECIPE_HEIGHT_RATIO,
  RECIPE_LEFT_RATIO,
  RECIPE_TOP_RATIO,
  RECIPE_WIDTH_RATIO,
  TOMES,
} from "../constants";
import { getImageScale } from "./scale";
import { getFirstRealXY, getTomePxSize } from "../common";
import { getActiveTomeBg, getTomeBg, preprocess } from "./image";

function getXY(needle: cv.Mat, haystack: cv.Mat) {
  const rects = filterRectsWithMask(needle, haystack);

  return getFirstRealXY(rects);
}

function filterRectsWithMask(needle: cv.Mat, haystack: cv.Mat) {
  const [needleH, needleW] = needle.sizes;
  assert(needleH === needleW);
  const [haystackH] = haystack.sizes;

  const bgMask = createBgMask(needleH);

  const resizedHaystack = haystack.getRegion(
    new cv.Rect(0, 0, Math.floor(needleH * 7), haystackH),
  );

  const rects = filterMultiple(
    resizedHaystack,
    needle,
    0.6,
    needleW,
    needleH,
    bgMask,
  );
  return rects;
}

export function findBBox(
  haystack: cv.Mat,
  scale: number,
  original: { w: number; h: number },
): cv.Rect {
  const needle = getTomeBg(getTomePxSize(scale, original.h));
  const { minX, minY } = getXY(needle, haystack);

  let topRecipe =
    Math.floor((original.h * scale) / RECIPE_TOP_RATIO) - EXPECTED_SLOP_Y;
  let leftRecipe =
    Math.floor((original.h * scale) / RECIPE_LEFT_RATIO) - EXPECTED_SLOP_X;
  let recipeHeight =
    Math.floor((original.h * scale) / RECIPE_HEIGHT_RATIO) + EXPECTED_SLOP_Y;
  let recipeWidth =
    Math.floor((original.h * scale) / RECIPE_WIDTH_RATIO) + EXPECTED_SLOP_X;

  if (topRecipe < 0) {
    topRecipe = 0;
  }
  if (leftRecipe < 0) {
    leftRecipe = 0;
  }
  if (recipeHeight > original.h) {
    recipeHeight = original.h;
  }
  if (recipeWidth > original.w) {
    recipeWidth = original.w;
  }

  if (topRecipe < minY - 5) {
    topRecipe = minY - EXPECTED_SLOP_Y;
  }
  if (leftRecipe < minX - 5) {
    leftRecipe = minX - EXPECTED_SLOP_X;
  }

  return new cv.Rect(leftRecipe, topRecipe, recipeWidth, recipeHeight);
}

export function findHighlightedTome(haystack: cv.Mat, tomeSize: number) {
  const needle = getActiveTomeBg(tomeSize);
  const needleMask = createBgMask(tomeSize);

  const matched = haystack.matchTemplate(
    needle,
    cv.TM_CCOEFF_NORMED,
    needleMask,
  );

  const { maxLoc: topLeft } = cv.minMaxLoc(matched);

  return new cv.Rect(topLeft.x, topLeft.y, tomeSize, tomeSize);
}

export function calibrateBBox(img: cv.Mat): {
  scale: number;
  recipeBBox: cv.Rect;
} {
  const originalSizes = { w: img.sizes[1], h: img.sizes[0] };
  const cropped = cropToTopLeft(img);

  const processedScreenshot = preprocess(cropped, NORMAL_TOME_FILTER);

  let scale = 1;
  let hasError = false;
  try {
    scale = getImageScale(processedScreenshot, originalSizes);
  } catch (error) {
    console.log(error);
    hasError = true;
  }

  let firstRecipeBBox = defaultRecipeBox(originalSizes.h);
  try {
    if (!hasError) {
      firstRecipeBBox = findBBox(processedScreenshot, scale, originalSizes);
    }
  } catch (error) {
    console.log(error);
    hasError = true;
  }
  if (hasError) {
    console.log("error");
  }
  const withBox = drawRects(processedScreenshot, [firstRecipeBBox]);
  cv.imshow("withBox", withBox);
  cv.waitKey(0);
  cv.destroyAllWindows();

  // just go all the way to left border, since no real reason to crop it out
  return {
    scale,
    recipeBBox: new cv.Rect(
      0,
      firstRecipeBBox.y,
      firstRecipeBBox.width + firstRecipeBBox.x,
      firstRecipeBBox.height,
    ),
  };
}

function defaultRecipeBox(originalHeight: number) {
  return new cv.Rect(
    0,
    originalHeight / RECIPE_TOP_RATIO - EXPECTED_SLOP_Y,
    originalHeight / RECIPE_WIDTH_RATIO +
      originalHeight / RECIPE_LEFT_RATIO +
      EXPECTED_SLOP_X,
    originalHeight / RECIPE_HEIGHT_RATIO + EXPECTED_SLOP_Y * 4,
  );
}

export function determineTomeType(
  highlightedTomeImg: cv.Mat,
  tomeSize: number,
) {
  const imgStrip = cv.imread(PREPROCESSED_MATCH_LIST, cv.IMREAD_UNCHANGED);
  const imgStripResized = imgStrip.resize(tomeSize, tomeSize * TOMES.length);

  const matched = imgStripResized.matchTemplate(
    highlightedTomeImg,
    cv.TM_CCOEFF_NORMED,
  );
  const { maxLoc } = cv.minMaxLoc(matched);
  const foundIndex = Math.floor(maxLoc.x / tomeSize);
  return TOMES[foundIndex];
}

export function getNormalRects(haystack: cv.Mat, tomeSize: number): cv.Rect[] {
  const bgImg = getTomeBg(tomeSize);
  const bgMask = createBgMask(tomeSize);

  const matches = filterMultiple(
    haystack,
    bgImg,
    0.6,
    tomeSize,
    tomeSize,
    bgMask,
  );

  return matches;
}
