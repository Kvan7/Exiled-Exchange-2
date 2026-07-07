import * as cv from "@u4/opencv4nodejs";
import {
  MISSING_TOME_TOLERANCE,
  PREPROCESSED_ACTIVE_TOME_BG,
  PREPROCESSED_TOME_BG,
  ROW_TOLERANCE,
  TOME_SIZE_RATIO,
} from "../constants";

export function cropToTopLeft(img: cv.Mat) {
  const [screenshotH, screenshotW] = img.sizes;
  return img.getRegion(
    new cv.Rect(
      0,
      0,
      Math.floor(screenshotW * 0.25),
      Math.floor(screenshotH * 0.5),
    ),
  );
}

export function drawRects(img: cv.Mat, rects: cv.Rect[]) {
  // these colors are actually BGR
  const lineColor = new cv.Vec3(0, 255, 0);
  const lineType = cv.LINE_4;

  const imgCopy = img.copy();

  for (const rect of rects) {
    imgCopy.drawRectangle(rect, lineColor, 1, lineType);
  }

  return imgCopy;
}

function thresholdResults(
  results: cv.Mat,
  threshold: number,
  needleWidth: number,
  needleHeight: number,
) {
  const matches = [];
  const scores = [];
  for (let y = 0; y < results.rows; y++) {
    for (let x = 0; x < results.cols; x++) {
      const match = results.at(y, x);
      if (match >= threshold) {
        matches.push(new cv.Rect(x, y, needleWidth, needleHeight));
        scores.push(match);
      }
    }
  }

  return { matches, scores };
}

export function filterMultiple(
  haystack: cv.Mat,
  needle: cv.Mat,
  threshold: number,
  needleWidth: number,
  needleHeight: number,
  mask?: cv.Mat,
) {
  const matched = mask
    ? haystack.matchTemplate(needle, cv.TM_CCOEFF_NORMED, mask)
    : haystack.matchTemplate(needle, cv.TM_CCOEFF_NORMED);

  const { matches: filtered, scores } = thresholdResults(
    matched,
    threshold,
    needleWidth,
    needleHeight,
  );

  const keepIndices = new Set(cv.NMSBoxes(filtered, scores, threshold, 0));
  const remainingBoxes = filtered.filter((_, i) => keepIndices.has(i));

  return remainingBoxes;
}

export function getTomePxSize(scale: number, originalH: number) {
  return Math.floor((originalH * scale) / TOME_SIZE_RATIO);
}

export function createBgMask(num: number) {
  const border = Math.round(num * 0.15);
  const innerSize = num - border * 2;
  const zeros = new cv.Mat(innerSize, innerSize, cv.CV_8UC1, 0);
  return zeros.copyMakeBorder(
    border,
    border,
    border,
    border,
    cv.BORDER_CONSTANT,
    1,
  );
}

export function getActiveTomeBg(requestedSize?: number) {
  return getFixedSize(PREPROCESSED_ACTIVE_TOME_BG, requestedSize);
}

export function getTomeBg(requestedSize?: number) {
  return getFixedSize(PREPROCESSED_TOME_BG, requestedSize);
}

function getFixedSize(path: string, requestedSize?: number) {
  const img = cv.imread(path, cv.IMREAD_UNCHANGED);
  if (requestedSize) {
    return img.resize(requestedSize, requestedSize);
  }
  return img;
}

export function preprocess(
  img: cv.Mat,
  {
    blur = 0,
    hueMin = 0,
    hueMax = 180,
    saturationMin = 0,
    saturationMax = 255,
    valueMin = 0,
    valueMax = 255,
    hueAdd = 0,
    saturationAdd = 0,
    valueAdd = 0,
  }: {
    blur?: number;
    hueMin?: number;
    hueMax?: number;
    saturationMin?: number;
    saturationMax?: number;
    valueMin?: number;
    valueMax?: number;
    hueAdd?: number;
    saturationAdd?: number;
    valueAdd?: number;
  },
) {
  const hsv = img.cvtColor(cv.COLOR_BGR2HSV);

  const [h, s, v] = hsv.split();
  const nh = shiftChannel(h, hueAdd);
  const ns = shiftChannel(s, saturationAdd);
  const nv = shiftChannel(v, valueAdd);
  const hsv2 = new cv.Mat([nh, ns, nv]);

  const lower = new cv.Vec3(hueMin, saturationMin, valueMin);
  const upper = new cv.Vec3(hueMax, saturationMax, valueMax);

  const mask = hsv2.inRange(lower, upper);
  const result = new cv.Mat(hsv2.rows, hsv2.cols, hsv2.type);
  hsv2.copyTo(result, mask);

  const img2 = result.cvtColor(cv.COLOR_HSV2BGR);

  if (blur) {
    img2.gaussianBlur(new cv.Size(blur, blur), 0);
  }

  return img2;
}

export function shiftChannel(c: cv.Mat, amount: number) {
  // mat * alpha + beta
  // mat * 1     + amount
  return c.convertTo(cv.CV_8UC1, 1, amount);
}

export function filterRecipeRects(rects: cv.Rect[], originalHeight: number) {
  const tomeCount = countTomes(rects);
  return tomeCount;
}

export function countTomes(rects: cv.Rect[]) {
  if (rects.length < 2) {
    return { realRects: rects, tomeCount: rects.length };
  }

  // assuming no overlapping rects here...

  // find most likely ones to consider/keep
  const bestY = rects
    .map((rect) => {
      const y = rect.y;
      let count = 0;
      for (const otherRect of rects) {
        if (Math.abs(y - otherRect.y) <= ROW_TOLERANCE) {
          count++;
        }
      }
      return { y, count };
    })
    .reduce((a, b) => {
      if (a.count > b.count) {
        return a;
      }
      return b;
    });

  // filter to the ones we want to keep
  const newRects = rects.filter(
    (rect) => Math.abs(rect.y - bestY.y) <= ROW_TOLERANCE,
  );

  // now determine if we are skipping/missed any
  const sortedRects = newRects.toSorted((a: cv.Rect, b: cv.Rect) => a.x - b.x);
  // const firstX = sortedRects[0].x;
  // const normalizedXs = sortedRects.map((rect) => rect.x - firstX);

  const gapDistancesAll = sortedRects.map((rect, i) => {
    if (i === 0) {
      return { gap: 0, rect };
    }
    return { gap: rect.x - sortedRects[i - 1].x, rect };
  });

  const gapDistances = gapDistancesAll.slice(1);
  const medianGap = gapDistances.toSorted((a, b) => a.gap - b.gap)[
    Math.floor(gapDistances.length / 2)
  ].gap;

  const normalizedGaps = gapDistances.map((gapObj) => ({
    gap: gapObj.gap / medianGap,
    rect: gapObj.rect,
  }));

  return {
    tomeCount:
      normalizedGaps.length +
      normalizedGaps.filter((gapObj) => gapObj.gap > 1 + MISSING_TOME_TOLERANCE)
        .length -
      normalizedGaps.filter((gapObj) => gapObj.gap < 1 - MISSING_TOME_TOLERANCE)
        .length +
      1,
    realRects: [
      sortedRects[0],
      ...normalizedGaps
        .filter((g) => g.gap <= 3 && g.gap >= 1 - MISSING_TOME_TOLERANCE)
        .map((gapObj) => gapObj.rect),
    ],
  };
}

export function closestRectPos1(
  rects: cv.Rect[],
  x: number,
  y: number,
): number {
  let closest = 0;
  let closestDist = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    const dist = Math.abs(rect.x - x) + Math.abs(rect.y - y);
    if (dist < closestDist) {
      closest = i;
      closestDist = dist;
    }
  }
  return closest + 1;
}
