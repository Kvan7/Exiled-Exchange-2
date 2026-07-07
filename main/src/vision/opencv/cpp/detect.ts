import * as cv from "@u4/opencv4nodejs";
import {
  countTomes,
  createBgMask,
  cropToTopLeft,
  filterMultiple,
  getActiveTomeBg,
  getTomeBg,
  getTomePxSize,
  preprocess,
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
  ROW_TOLERANCE,
  TOMES,
} from "../constants";
import { getImageScale } from "./scale";

function getXY(needle: cv.Mat, haystack: cv.Mat) {
  const [needleH, needleW] = needle.sizes;
  assert(needleH === needleW);
  const [haystackW] = haystack.sizes;

  const bgMask = createBgMask(needleH);

  const resizedHaystack = haystack.getRegion(
    new cv.Rect(0, 0, Math.floor(needleH * 7), haystackW),
  );

  const rects = filterMultiple(
    resizedHaystack,
    needle,
    0.6,
    needleW,
    needleH,
    bgMask,
  );

  const sortedRects = rects.toSorted((a, b) => a.y - b.y);

  const rows: Array<{ ySum: number; rects: cv.Rect[] }> = [];
  let likelyFirstRowIndex = 0;
  let withThreeIndex = -1;
  let withThreeAvgY = Number.MAX_SAFE_INTEGER;

  for (const p of sortedRects) {
    const y = p.y;
    let matched = false;
    for (const [index, row] of rows.entries()) {
      if (Math.abs(y - row.ySum / row.rects.length) <= ROW_TOLERANCE) {
        row.rects.push(p);
        row.ySum += p.y;
        matched = true;
        if (row.rects.length > rows[likelyFirstRowIndex].rects.length) {
          likelyFirstRowIndex = index;
        }
        if (
          row.rects.length >= 3 &&
          row.ySum / row.rects.length < withThreeAvgY
        ) {
          withThreeIndex = index;
          withThreeAvgY = row.ySum / row.rects.length;
        }
        break;
      }
    }

    if (!matched) {
      rows.push({ ySum: p.y, rects: [p] });
    }
  }

  // find a possible first row
  if (
    withThreeIndex > -1 &&
    withThreeAvgY <
      rows[likelyFirstRowIndex].ySum / rows[likelyFirstRowIndex].rects.length
  ) {
    likelyFirstRowIndex = withThreeIndex;
  }

  const recountedRows = rows.map((row) => {
    return {
      ...row,
      len: row.rects.length,
      count: countTomes(row.rects).tomeCount,
    };
  });

  // find this index, another possible first row
  let maxI = 0;
  for (let i = 0; i < recountedRows.length; i++) {
    if (recountedRows[i].count > recountedRows[maxI].count) {
      maxI = i;
    }
  }
  if (
    recountedRows[maxI].ySum / recountedRows[maxI].len >
    rows[likelyFirstRowIndex].ySum / rows[likelyFirstRowIndex].rects.length
  ) {
    likelyFirstRowIndex = maxI;
  }

  const firstRow = rows[likelyFirstRowIndex].rects;
  const firstElement = firstRow.toSorted((a, b) => a.x - b.x)[0];

  return { minX: firstElement.x, minY: firstElement.y };
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
  try {
    scale = getImageScale(processedScreenshot, originalSizes);
  } catch (error) {
    console.log(error);
  }

  let firstRecipeBBox = new cv.Rect(
    0,
    originalSizes.h / RECIPE_TOP_RATIO - EXPECTED_SLOP_Y,
    originalSizes.h / RECIPE_WIDTH_RATIO +
      originalSizes.h / RECIPE_LEFT_RATIO +
      EXPECTED_SLOP_X,
    originalSizes.h / RECIPE_HEIGHT_RATIO + EXPECTED_SLOP_Y * 4,
  );
  try {
    firstRecipeBBox = findBBox(processedScreenshot, scale, originalSizes);
  } catch (error) {
    console.log(error);
  }

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
