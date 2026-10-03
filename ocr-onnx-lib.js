/* 优记 BestNote · ONNX PP-OCR 后处理纯函数库
 * 不依赖浏览器 / ORT，可在 Node 中直接 require 做单元测试。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BestNoteOnnxLib = api;
})(typeof self !== 'undefined' ? self : this, function () {
  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  // 概率图 -> 0/1 掩码
  function binarizeProb(prob, width, height, threshold = 0.3) {
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < mask.length; i += 1) mask[i] = prob[i] > threshold ? 1 : 0;
    return mask;
  }

  // 水平方向膨胀，把字符连成文本行
  function dilateHorizontal(mask, width, height, radius = 6) {
    if (radius <= 0) return mask.slice();
    const out = new Uint8Array(mask.length);
    for (let y = 0; y < height; y += 1) {
      const row = y * width;
      for (let x = 0; x < width; x += 1) {
        if (mask[row + x]) {
          const from = Math.max(0, x - radius);
          const to = Math.min(width - 1, x + radius);
          for (let k = from; k <= to; k += 1) out[row + k] = 1;
        }
      }
    }
    return out;
  }

  // 连通域（4 邻域，迭代式栈，避免递归爆栈）
  function connectedComponents(mask, width, height, minArea = 4) {
    const labels = new Int32Array(width * height).fill(-1);
    const boxes = [];
    const stack = new Int32Array(width * height);
    let next = 0;
    for (let start = 0; start < mask.length; start += 1) {
      if (!mask[start] || labels[start] !== -1) continue;
      let top = 0;
      stack[top] = start;
      top += 1;
      labels[start] = next;
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      let area = 0;
      while (top > 0) {
        top -= 1;
        const index = stack[top];
        const x = index % width;
        const y = (index - x) / width;
        area += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x > 0 && mask[index - 1] && labels[index - 1] === -1) {
          labels[index - 1] = next;
          stack[top] = index - 1;
          top += 1;
        }
        if (x < width - 1 && mask[index + 1] && labels[index + 1] === -1) {
          labels[index + 1] = next;
          stack[top] = index + 1;
          top += 1;
        }
        if (y > 0 && mask[index - width] && labels[index - width] === -1) {
          labels[index - width] = next;
          stack[top] = index - width;
          top += 1;
        }
        if (y < height - 1 && mask[index + width] && labels[index + width] === -1) {
          labels[index + width] = next;
          stack[top] = index + width;
          top += 1;
        }
      }
      if (area >= minArea) boxes.push({ minX, minY, maxX, maxY, area, label: next });
      next += 1;
    }
    return boxes;
  }

  function boxMeanProb(prob, width, height, box) {
    let sum = 0;
    let count = 0;
    for (let y = box.minY; y <= box.maxY; y += 1) {
      for (let x = box.minX; x <= box.maxX; x += 1) {
        sum += prob[y * width + x];
        count += 1;
      }
    }
    return count ? sum / count : 0;
  }

  // 合并垂直重叠、水平相邻的框（同一行的碎片）
  function mergeBoxes(boxes, gap = 8, overlapRatio = 0.5) {
    const merged = [];
    const sorted = boxes.slice().sort((a, b) => a.minX - b.minX);
    for (const box of sorted) {
      const last = merged[merged.length - 1];
      if (last) {
        const overlap = Math.min(last.maxY, box.maxY) - Math.max(last.minY, box.minY);
        const minHeight = Math.min(last.maxY - last.minY + 1, box.maxY - box.minY + 1);
        const sameRow = overlap > 0 && overlap / minHeight >= overlapRatio;
        const close = box.minX - last.maxX <= gap;
        if (sameRow && close) {
          last.maxX = Math.max(last.maxX, box.maxX);
          last.minX = Math.min(last.minX, box.minX);
          last.maxY = Math.max(last.maxY, box.maxY);
          last.minY = Math.min(last.minY, box.minY);
          last.area += box.area;
          continue;
        }
      }
      merged.push({ ...box });
    }
    return merged;
  }

  function filterBoxes(boxes, prob, width, height, opts = {}) {
    const minHeight = opts.minHeight ?? 6;
    const minWidth = opts.minWidth ?? 4;
    const maxHeightRatio = opts.maxHeightRatio ?? 0.9;
    const maxWidthRatio = opts.maxWidthRatio ?? 0.98;
    const minScore = opts.minScore ?? 0.4;
    return boxes.filter((box) => {
      const w = box.maxX - box.minX + 1;
      const h = box.maxY - box.minY + 1;
      if (h < minHeight || w < minWidth) return false;
      if (h / height > maxHeightRatio) return false;
      if (w / width > maxWidthRatio) return false;
      const score = boxMeanProb(prob, width, height, box);
      box.score = score;
      return score >= minScore;
    });
  }

  // 按阅读顺序排序：先上下，再左右
  function sortBoxesReadingOrder(boxes) {
    return boxes.slice().sort((a, b) => {
      const aMid = (a.minY + a.maxY) / 2;
      const bMid = (b.minY + b.maxY) / 2;
      const aH = a.maxY - a.minY + 1;
      const bH = b.maxY - b.minY + 1;
      const rowTol = Math.min(aH, bH) * 0.6;
      if (Math.abs(aMid - bMid) > rowTol) return aMid - bMid;
      return a.minX - b.minX;
    });
  }

  // 等比缩放到目标高度，宽度裁剪到 [minWidth, maxWidth]
  function computeResize(srcWidth, srcHeight, targetHeight = 48, maxWidth = 320, minWidth = 16) {
    const ratio = targetHeight / Math.max(srcHeight, 1);
    const width = clamp(Math.round(srcWidth * ratio), minWidth, maxWidth);
    return { width, height: targetHeight };
  }

  // CTC 贪心解码：index 0 = blank，其余映射到 dict[index-1]
  function ctcDecode(indices, dict) {
    let out = '';
    let prev = -1;
    for (let i = 0; i < indices.length; i += 1) {
      const index = indices[i];
      if (index > 0 && index !== prev) {
        const ch = dict[index - 1];
        if (ch !== undefined) out += ch;
      }
      prev = index;
    }
    return out;
  }

  // 从扁平 logits 的某一行取 argmax
  function argmaxRow(data, offset, count) {
    let best = 0;
    let bestValue = -Infinity;
    for (let i = 0; i < count; i += 1) {
      const value = data[offset + i];
      if (value > bestValue) {
        bestValue = value;
        best = i;
      }
    }
    return best;
  }

  // logits [T, C] 扁平化 -> 索引序列
  function argmaxSequence(data, steps, classes) {
    const out = new Int32Array(steps);
    for (let t = 0; t < steps; t += 1) out[t] = argmaxRow(data, t * classes, classes);
    return out;
  }

  return {
    clamp,
    binarizeProb,
    dilateHorizontal,
    connectedComponents,
    boxMeanProb,
    mergeBoxes,
    filterBoxes,
    sortBoxesReadingOrder,
    computeResize,
    ctcDecode,
    argmaxRow,
    argmaxSequence
  };
});
