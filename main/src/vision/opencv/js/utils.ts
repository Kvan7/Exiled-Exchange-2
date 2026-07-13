/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- a */
import cv from "@techstark/opencv-js";
import assert from "node:assert";
import { saveImage } from "./image";

export function cropToTopLeft(img: cv.Mat) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  // caller owns both img and result
  const screenshotH = img.rows;
  const screenshotW = img.cols;
  return img.roi(
    new cv.Rect(
      0,
      0,
      Math.floor(screenshotW * 0.25),
      Math.floor(screenshotH * 0.5),
    ),
  );
}

function thresholdResults(
  results: cv.Mat,
  threshold: number,
  needleWidth: number,
  needleHeight: number,
) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const matches = new cv.RectVector();
  const weights = new cv.IntVector();
  const channels = results.channels();
  assert(channels === 1);
  for (let y = 0; y < results.rows; y++) {
    for (let x = 0; x < results.cols; x++) {
      const match = results.floatAt(y, x);
      if (match >= threshold) {
        matches.push_back(new cv.Rect(x, y, needleWidth, needleHeight));
        matches.push_back(new cv.Rect(x, y, needleWidth, needleHeight));
        weights.push_back(match);
        weights.push_back(match);
      }
    }
  }

  return { matches, weights };
}

export function dumpMat(name: string, mat: cv.Mat) {
  console.log(name, {
    rows: mat.rows,
    cols: mat.cols,
    type: matTypeToString(mat),
    channels: mat.channels(),
    depth: mat.depth(),
    empty: mat.empty(),
  });
}

export function filterMultiple(
  haystack: cv.Mat,
  needle: cv.Mat,
  threshold: number,
  needleWidth: number,
  needleHeight: number,
  mask?: cv.Mat,
) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const matched = new cv.Mat(); // deleted

  // dumpMat("haystack", haystack);
  // saveImage(haystack, "./haystack.png");
  // dumpMat("needle", needle);
  // saveImage(needle, "./needle.png");
  if (mask) {
    // dumpMat("mask", mask);
    // saveImage(mask, "./mask.png");

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
  // dumpMat("matched", matched);

  const { matches, weights } = thresholdResults(
    matched,
    threshold,
    needleWidth,
    needleHeight,
  );
  cv.groupRectangles(matches, weights, 1, 0.5);

  const filtered = [];
  for (let i = 0; i < matches.size(); i++) {
    filtered.push(matches.get(i));
  }

  matched.delete();
  weights.delete();
  matches.delete();

  return filtered;
}

export function createBgMask(num: number) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const border = Math.round(num * 0.15);
  const innerSize = num - border * 2;
  const zeros = cv.Mat.zeros(innerSize, innerSize, cv.CV_8UC1 as number); // deleted
  const res = new cv.Mat(); // returned
  cv.copyMakeBorder(
    zeros,
    res,
    border,
    border,
    border,
    border,
    cv.BORDER_CONSTANT as number,
    [255, 255, 255, 255],
  );

  zeros.delete();

  return res;
}

export function matTypeToString(mat: cv.Mat) {
  const depthNames = [
    "CV_8U",
    "CV_8S",
    "CV_16U",
    "CV_16S",
    "CV_32S",
    "CV_32F",
    "CV_64F",
    "CV_16F",
  ];

  const type = mat.type();
  return `${depthNames[type & 7]}C${(type >> 3) + 1}`;
}
