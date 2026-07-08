import {
  MISSING_TOME_TOLERANCE,
  ROW_TOLERANCE,
  TOME_SIZE_RATIO,
} from "./constants";

interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getTomePxSize(scale: number, originalH: number) {
  return Math.floor((originalH * scale) / TOME_SIZE_RATIO);
}

export function filterRecipeRects(rects: IRect[], originalHeight: number) {
  const tomeCount = countTomes(rects);
  return tomeCount;
}

export function getFirstRealXY(rects: IRect[]) {
  const sortedRects = rects.toSorted((a, b) => a.y - b.y);

  const rows: Array<{ ySum: number; rects: IRect[] }> = [];
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

export function countTomes(rects: IRect[]) {
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
  const sortedRects = newRects.toSorted((a: IRect, b: IRect) => a.x - b.x);
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

export function closestRectPos1(rects: IRect[], x: number, y: number): number {
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
