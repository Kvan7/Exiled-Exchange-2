import * as cv from "@u4/opencv4nodejs";

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
