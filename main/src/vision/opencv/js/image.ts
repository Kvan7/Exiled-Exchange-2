/* eslint-disable @typescript-eslint/no-unsafe-type-assertion -- dont care */
import {
  PREPROCESSED_ACTIVE_TOME_BG,
  PREPROCESSED_TOME_BG,
} from "../constants";
import cv from "@techstark/opencv-js";
import fs from "node:fs/promises";
import { Jimp } from "jimp";
import { matTypeToString } from "./utils";

export async function getActiveTomeBg(requestedSize?: number) {
  return await getFixedSize(PREPROCESSED_ACTIVE_TOME_BG, requestedSize);
}

export async function getTomeBg(requestedSize?: number) {
  return await getFixedSize(PREPROCESSED_TOME_BG, requestedSize);
}

export async function getImage(
  input: string | { data: Buffer; width: number; height: number },
) {
  let img: cv.Mat;

  if (typeof input === "string") {
    const image = await Jimp.read(input);
    img = cv.matFromArray(
      image.height,
      image.width,
      cv.CV_8UC4,
      image.bitmap.data,
    );
    cv.cvtColor(img, img, cv.COLOR_RGBA2BGR as number);
    // if (input.includes("bg.png")) {
    //   saveImage(img, "./BGBGBG.png");
    // }
    // console.log(`DATA FOR ${input} at x0y0`);
    // console.log(img.ucharPtr(0, 0));
  } else {
    img = cv.matFromArray(input.height, input.width, cv.CV_8UC4, input.data);
  }

  // const rgb = new cv.Mat();
  // cv.cvtColor(img, rgb, cv.COLOR_BGRA2BGR as number);
  // img.delete();
  // dumpMat("img", img);

  return img;
}

export async function saveImage(img: cv.Mat, path: string) {
  const rgba = new cv.Mat(); // deleted
  // console.log(`${path} as ${matTypeToString(img)}`);

  if (img.channels() === 4) {
    cv.cvtColor(img, rgba, cv.COLOR_BGRA2RGBA as number);
  } else {
    cv.cvtColor(img, rgba, cv.COLOR_BGR2RGBA as number);
  }

  const image = new Jimp({
    width: rgba.cols,
    height: rgba.rows,
    data: Buffer.from(rgba.data),
  });

  rgba.delete();

  const buffer = await image.getBuffer("image/png");
  await fs.writeFile(path, buffer);
}

async function getFixedSize(path: string, requestedSize?: number) {
  // REVIEW: ALL ALLOCATIONS MUST BE DELETED AFTER USE
  const img = await getImage(path);
  // drop alpha channel
  // cv.cvtColor(img, img, cv.COLOR_BGRA2BGR as number);

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
  console.log(
    `h: ${matTypeToString(h)}, s: ${matTypeToString(s)}, v: ${matTypeToString(v)}`,
  );

  h.convertTo(h, h.type(), 1, hueAdd);
  s.convertTo(s, s.type(), 1, saturationAdd);
  v.convertTo(v, v.type(), 1, valueAdd);

  const hsv2 = new cv.Mat(); // deleted
  cv.merge(hsvPlanes, hsv2);

  const lower = new cv.Mat(hsv2.rows, hsv2.cols, hsv2.type(), [
    hueMin,
    saturationMin,
    valueMin,
    1,
  ]); // deleted
  const upper = new cv.Mat(hsv2.rows, hsv2.cols, hsv2.type(), [
    hueMax,
    saturationMax,
    valueMax,
    1,
  ]); // deleted

  const mask = new cv.Mat(); // deleted
  cv.inRange(hsv2, lower, upper, mask);

  let result = new cv.Mat(); // returned

  hsv2.copyTo(result, mask);
  cv.cvtColor(result, result, cv.COLOR_HSV2BGR as number);

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
