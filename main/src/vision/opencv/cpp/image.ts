import {
  PREPROCESSED_ACTIVE_TOME_BG,
  PREPROCESSED_TOME_BG,
} from "../constants";
import * as cv from "@u4/opencv4nodejs";

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
