/* 优记 BestNote · 拼长图「重复头部 / 底部」检测纯函数库
 * 不依赖浏览器 API，可在 Node 中直接 require 做单元测试。
 * 浏览器中通过 <script> 加载后挂在 window.BestNoteStitchLib。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BestNoteStitchLib = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const EPS = 1e-3;

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  // Otsu 自动阈值，用来区分“墨迹”和背景
  function otsuThreshold(gray) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < gray.length; i += 1) histogram[gray[i]] += 1;
    const total = gray.length;
    if (!total) return 128;
    let sum = 0;
    for (let t = 0; t < 256; t += 1) sum += t * histogram[t];
    let sumB = 0;
    let weightB = 0;
    let best = 0;
    let threshold = 128;
    for (let t = 0; t < 256; t += 1) {
      weightB += histogram[t];
      if (!weightB) continue;
      const weightF = total - weightB;
      if (!weightF) break;
      sumB += t * histogram[t];
      const meanB = sumB / weightB;
      const meanF = (sum - sumB) / weightF;
      const between = weightB * weightF * (meanB - meanF) * (meanB - meanF);
      if (between > best) {
        best = between;
        threshold = t;
      }
    }
    return threshold;
  }

  // 灰度图 -> 每行 buckets 个「墨迹占比」（0~1），比单纯亮度均值更能区分文字行
  function rowSignature(gray, width, height, buckets = 24) {
    const sig = new Float32Array(height * buckets);
    if (width <= 0 || height <= 0 || buckets <= 0) return sig;
    const threshold = otsuThreshold(gray);
    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * width;
      for (let b = 0; b < buckets; b += 1) {
        const from = Math.floor((b * width) / buckets);
        const to = Math.max(from + 1, Math.floor(((b + 1) * width) / buckets));
        let dark = 0;
        let count = 0;
        for (let x = from; x < to && x < width; x += 1) {
          if (gray[rowOffset + x] <= threshold) dark += 1;
          count += 1;
        }
        sig[y * buckets + b] = count ? dark / count : 0;
      }
    }
    return sig;
  }

  // 逐行做 z-score 归一化，抵消整体亮度差异
  function normalizeSignatures(sig, buckets, height) {
    const out = new Float32Array(sig.length);
    for (let y = 0; y < height; y += 1) {
      const offset = y * buckets;
      let mean = 0;
      for (let b = 0; b < buckets; b += 1) mean += sig[offset + b];
      mean /= buckets;
      let variance = 0;
      for (let b = 0; b < buckets; b += 1) {
        const diff = sig[offset + b] - mean;
        variance += diff * diff;
      }
      const std = Math.sqrt(variance / buckets) + EPS;
      for (let b = 0; b < buckets; b += 1) {
        out[offset + b] = clamp((sig[offset + b] - mean) / std, -3, 3);
      }
    }
    return out;
  }

  // 单行相似度 0~1
  function rowSim(sigA, rowA, sigB, rowB, buckets) {
    const offsetA = rowA * buckets;
    const offsetB = rowB * buckets;
    let sum = 0;
    for (let b = 0; b < buckets; b += 1) {
      const diff = Math.abs(sigA[offsetA + b] - sigB[offsetB + b]);
      sum += 1 - Math.min(1, diff / 3);
    }
    return sum / buckets;
  }

  // 连续 rows 行的平均相似度 0~1
  function blockSim(sigA, startA, sigB, startB, rows, buckets) {
    if (rows <= 0) return 0;
    let sum = 0;
    for (let i = 0; i < rows; i += 1) sum += rowSim(sigA, startA + i, sigB, startB + i, buckets);
    return sum / rows;
  }

  // 所有图片共有的固定顶部 / 底部条带（状态栏、导航栏）
  // 逐行向下（或向上）扩展，遇到不匹配的行就停止，避免把正文也算进条带。
  function detectFixedBand(signatures, heights, buckets, edge = 'top', opts = {}) {
    const minRows = opts.minRows ?? 6;
    const maxRows = opts.maxRows ?? 240;
    const rowThreshold = opts.rowThreshold ?? 0.9;
    const missRatio = opts.missRatio ?? 0.12;
    if (!Array.isArray(signatures) || signatures.length < 2) return { rows: 0, score: 0, perImage: [] };
    const limit = Math.min(maxRows, ...heights);
    const rowOf = (height, index) => (edge === 'bottom' ? height - 1 - index : index);
    let rows = 0;
    let misses = 0;
    for (let index = 0; index < limit; index += 1) {
      let worstRow = Infinity;
      for (let image = 1; image < signatures.length; image += 1) {
        const score = rowSim(
          signatures[0], rowOf(heights[0], index),
          signatures[image], rowOf(heights[image], index),
          buckets
        );
        worstRow = Math.min(worstRow, score);
      }
      if (worstRow < rowThreshold) {
        misses += 1;
        // 允许少量噪声行（例如状态栏里的时间变化），但超出预算就停止
        const budget = Math.max(1, Math.floor((index + 1) * missRatio));
        if (misses > budget) break;
        continue;
      }
      rows = index + 1;
    }
    if (rows < minRows) return { rows: 0, score: 0, perImage: [] };
    let worst = Infinity;
    for (let image = 1; image < signatures.length; image += 1) {
      const score = blockSim(
        signatures[0], edge === 'bottom' ? heights[0] - rows : 0,
        signatures[image], edge === 'bottom' ? heights[image] - rows : 0,
        rows, buckets
      );
      worst = Math.min(worst, score);
    }
    return { rows, score: Number((worst === Infinity ? 0 : worst).toFixed(4)), perImage: signatures.map(() => rows) };
  }

  // 相邻两张的重叠：A 的尾部区间与 B 的头部区间相同的行数
  // 区间为左闭右开：[aFrom, aTo) / [bFrom, bTo)
  function detectOverlap(sigA, aFrom, aTo, sigB, bFrom, bTo, buckets, opts = {}) {
    const minRows = opts.minRows ?? 6;
    const available = Math.min(aTo - aFrom, bTo - bFrom);
    const maxRows = Math.min(opts.maxRows ?? 400, available);
    const threshold = opts.threshold ?? 0.9;
    let best = { rows: 0, score: 0 };
    for (let rows = minRows; rows <= maxRows; rows += 1) {
      const score = blockSim(sigA, aTo - rows, sigB, bFrom, rows, buckets);
      if (score >= threshold && (score > best.score + 1e-4 || (Math.abs(score - best.score) <= 1e-4 && rows > best.rows))) {
        best = { rows, score: Number(score.toFixed(4)) };
      }
    }
    return best;
  }

  // 综合建议：固定头 / 脚 + 相邻重叠
  function suggestCrops(signatures, heights, buckets, options = {}) {
    const topBand = detectFixedBand(signatures, heights, buckets, 'top', options);
    const bottomBand = detectFixedBand(signatures, heights, buckets, 'bottom', options);
    const crops = heights.map(() => ({ top: topBand.rows, bottom: bottomBand.rows }));
    const overlaps = [];
    for (let index = 0; index < signatures.length - 1; index += 1) {
      const aFrom = crops[index].top;
      const aTo = heights[index] - crops[index].bottom;
      const bFrom = crops[index + 1].top;
      const bTo = heights[index + 1] - crops[index + 1].bottom;
      const overlap = detectOverlap(signatures[index], aFrom, aTo, signatures[index + 1], bFrom, bTo, buckets, options);
      overlaps.push(overlap.rows);
      // B 的内容开头与 A 的结尾重复 -> 从 B 的顶部再多裁掉这些行
      if (overlap.rows > 0) crops[index + 1].top = bFrom + overlap.rows;
    }
    return {
      crops: crops.map((crop, index) => clampCrop(crop, heights[index])),
      topRows: topBand.rows,
      bottomRows: bottomBand.rows,
      topScore: topBand.score,
      bottomScore: bottomBand.score,
      overlaps
    };
  }

  function clampCrop(crop, height) {
    const maxSide = Math.max(0, Math.floor(height) - 1);
    const top = clamp(Math.round(crop?.top || 0), 0, maxSide);
    const bottom = clamp(Math.round(crop?.bottom || 0), 0, Math.max(0, maxSide - top));
    return { top, bottom };
  }

  return {
    clamp,
    otsuThreshold,
    rowSignature,
    normalizeSignatures,
    rowSim,
    blockSim,
    detectFixedBand,
    detectOverlap,
    suggestCrops,
    clampCrop
  };
});
