/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- a */
import * as cv from "@techstark/opencv-js";
import { Rect, Mat } from "@techstark/opencv-js";
import assert from "node:assert";

export function cropToTopLeft(img: Mat) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  // caller owns both img and result
  const screenshotH = img.rows;
  const screenshotW = img.cols;
  return img.roi(
    new Rect(
      0,
      0,
      Math.floor(screenshotW * 0.25),
      Math.floor(screenshotH * 0.5),
    ),
  );
}

function thresholdResults(
  results: Mat,
  threshold: number,
  needleWidth: number,
  needleHeight: number,
) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const matches = [];
  const channels = results.channels();
  assert(channels === 1);
  for (let y = 0; y < results.rows; y++) {
    for (let x = 0; x < results.cols; x++) {
      const match = results.ucharAt(y, x);
      if (match >= threshold) {
        matches.push(new Rect(x, y, needleWidth, needleHeight));
        matches.push(new Rect(x, y, needleWidth, needleHeight));
      }
    }
  }

  return matches;
}

export function filterMultiple(
  haystack: Mat,
  needle: Mat,
  threshold: number,
  needleWidth: number,
  needleHeight: number,
  mask?: Mat,
) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const matched = new Mat(); // deleted
  if (mask) {
    cv.matchTemplate(
      haystack,
      needle,
      matched,
      cv.TM_CCOEFF_NORMED as number,
      mask,
    );
  } else {
    cv.matchTemplate(haystack, needle, matched, cv.TM_CCOEFF_NORMED as number);
  }

  const filtered = thresholdResults(
    matched,
    threshold,
    needleWidth,
    needleHeight,
  );
  cv.groupRectangles(filtered, 1, 0.5);

  matched.delete();

  return filtered;
}

export function createBgMask(num: number) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const border = Math.round(num * 0.15);
  const innerSize = num - border * 2;
  const zeros = cv.Mat.zeros(innerSize, innerSize, cv.CV_8UC1 as number); // deleted
  const res = new Mat(); // returned
  cv.copyMakeBorder(
    zeros,
    res,
    border,
    border,
    border,
    border,
    cv.BORDER_CONSTANT as number,
    1,
  );

  zeros.delete();

  return res;
}
