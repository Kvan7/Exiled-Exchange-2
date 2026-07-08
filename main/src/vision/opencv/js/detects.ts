/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- library */
import { createBgMask, cropToTopLeft, filterMultiple } from "./utils";
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
import { getActiveTomeBg, getImage, getTomeBg, preprocess } from "./image";
import { Mat, Rect } from "@techstark/opencv-js";

function filterRectsWithMask(needle: Mat, haystack: Mat) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const needleH = needle.rows;
  const needleW = needle.cols;
  assert(needleH === needleW);
  const haystackH = haystack.rows;

  const bgMask = createBgMask(needleH); // deleted

  const resizedHaystack = haystack.roi(
    new cv.Rect(0, 0, Math.floor(needleH * 7), haystackH),
  ); // deleted

  const rects = filterMultiple(
    resizedHaystack,
    needle,
    0.6,
    needleW,
    needleH,
    bgMask,
  );

  bgMask.delete();
  resizedHaystack.delete();
  return rects;
}

function getXY(needle: Mat, haystack: Mat) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const rects = filterRectsWithMask(needle, haystack);

  return getFirstRealXY(rects);
}

export async function findBBox(
  haystack: Mat,
  scale: number,
  original: { w: number; h: number },
): Promise<Rect> {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const needle = await getTomeBg(getTomePxSize(scale, original.h)); // deleted
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

  needle.delete();

  return new Rect(leftRecipe, topRecipe, recipeWidth, recipeHeight);
}

export async function findHighlightedTome(
  haystack: Mat,
  tomeSize: number,
): Promise<Rect> {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const needle = await getActiveTomeBg(tomeSize);
  const needleMask = createBgMask(tomeSize);

  const matched = new Mat();
  cv.matchTemplate(
    haystack,
    needle,
    matched,
    cv.TM_CCOEFF_NORMED as number,
    needleMask,
  );

  const { maxLoc: topLeft } = cv.minMaxLoc(matched, needleMask);

  needle.delete();
  needleMask.delete();

  return new cv.Rect(topLeft.x, topLeft.y, tomeSize, tomeSize);
}

export async function calibrateBBox(img: Mat): Promise<{
  scale: number;
  recipeBBox: Rect;
}> {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const originalSizes = { w: img.cols, h: img.rows };
  const cropped = cropToTopLeft(img); // deleted

  const processedScreenshot = preprocess(cropped, NORMAL_TOME_FILTER); // deleted

  let scale = 1;
  try {
    scale = await getImageScale(processedScreenshot, originalSizes);
  } catch (error) {
    console.log(error);
  }

  let firstRecipeBBox = defaultRecipeBox(originalSizes.h);
  try {
    firstRecipeBBox = await findBBox(processedScreenshot, scale, originalSizes);
  } catch (error) {
    console.log(error);
  }

  cropped.delete();
  processedScreenshot.delete();

  // just go all the way to left border, since no real reason to crop it out
  return {
    scale,
    recipeBBox: new Rect(
      0,
      firstRecipeBBox.y,
      firstRecipeBBox.width + firstRecipeBBox.x,
      firstRecipeBBox.height,
    ),
  };
}

function defaultRecipeBox(originalHeight: number) {
  return new Rect(
    0,
    originalHeight / RECIPE_TOP_RATIO - EXPECTED_SLOP_Y,
    originalHeight / RECIPE_WIDTH_RATIO +
      originalHeight / RECIPE_LEFT_RATIO +
      EXPECTED_SLOP_X,
    originalHeight / RECIPE_HEIGHT_RATIO + EXPECTED_SLOP_Y * 4,
  );
}

export async function determineTomeType(
  highlightedTomeImg: Mat,
  tomeSize: number,
) {
  const imgStrip = await getImage(PREPROCESSED_MATCH_LIST);
  const imgStripResized = new Mat();
  cv.resize(
    imgStrip,
    imgStripResized,
    new cv.Size(tomeSize * TOMES.length, tomeSize),
  );

  const matched = new Mat();
  cv.matchTemplate(
    imgStripResized,
    highlightedTomeImg,
    matched,
    cv.TM_CCOEFF_NORMED as number,
  );
  const { maxLoc } = cv.minMaxLoc(matched, null);
  const foundIndex = Math.floor(maxLoc.x / tomeSize);

  imgStrip.delete();
  imgStripResized.delete();
  matched.delete();

  return TOMES[foundIndex];
}

export async function getNormalRects(
  haystack: Mat,
  tomeSize: number,
): Promise<Rect[]> {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const bgImg = await getTomeBg(tomeSize); // deleted
  const bgMask = createBgMask(tomeSize); // deleted

  const matches = filterMultiple(
    haystack,
    bgImg,
    0.6,
    tomeSize,
    tomeSize,
    bgMask,
  );

  bgImg.delete();
  bgMask.delete();

  return matches;
}
