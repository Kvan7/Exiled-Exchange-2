/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- dont care */
import { loadImage } from "canvas";
import {
  PREPROCESSED_ACTIVE_TOME_BG,
  PREPROCESSED_TOME_BG,
} from "../constants";
import cv from "@techstark/opencv-js";

export async function getActiveTomeBg(requestedSize?: number) {
  return await getFixedSize(PREPROCESSED_ACTIVE_TOME_BG, requestedSize);
}

export async function getTomeBg(requestedSize?: number) {
  return await getFixedSize(PREPROCESSED_TOME_BG, requestedSize);
}

export async function getImage(input: string | Buffer) {
  const image = await loadImage(input);

  const img = cv.imread(image as unknown as HTMLImageElement);
  return img;
}

async function getFixedSize(path: string, requestedSize?: number) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const img = await getImage(path);

  if (requestedSize) {
    const resized = new cv.Mat();
    cv.resize(img, resized, new cv.Size(requestedSize, requestedSize));
    // clean since returning different one
    img.delete();
    return resized;
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
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const hsv = new cv.Mat(); // deleted
  cv.cvtColor(img, hsv, cv.COLOR_BGR2HSV as number);
  const hsvPlanes = new cv.MatVector(); // deleted
  cv.split(hsv, hsvPlanes);
  const h = hsvPlanes.get(0);
  const s = hsvPlanes.get(1);
  const v = hsvPlanes.get(2);

  h.convertTo(h, h.type(), 1, hueAdd);
  s.convertTo(s, s.type(), 1, saturationAdd);
  v.convertTo(v, v.type(), 1, valueAdd);

  const hsv2 = new cv.Mat(); // deleted
  cv.merge(hsvPlanes, hsv2);

  const lower = new cv.Mat(hsv2.rows, hsv2.cols, hsv2.type(), [
    hueMin,
    saturationMin,
    valueMin,
  ]); // deleted
  const upper = new cv.Mat(hsv2.rows, hsv2.cols, hsv2.type(), [
    hueMax,
    saturationMax,
    valueMax,
  ]); // deleted

  const mask = new cv.Mat(); // deleted
  cv.inRange(hsv2, lower, upper, mask);

  let result = new cv.Mat(); // returned
  cv.copyTo(hsv2, result, mask);

  if (blur) {
    const temp = new cv.Mat(); // deleted
    cv.GaussianBlur(result, temp, new cv.Size(blur, blur), 0, 0);
    result.delete();
    result = temp;
  }

  hsv.delete();
  hsvPlanes.delete();
  hsv2.delete();
  lower.delete();
  upper.delete();
  mask.delete();

  return result;
}
