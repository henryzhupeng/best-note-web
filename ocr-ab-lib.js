/* 优记 BestNote · OCR A/B 对比 · 纯函数库
 * 该文件不依赖浏览器 API，可在 Node 中直接 require 做单元测试。
 * 浏览器中通过 <script> 加载后挂在 window.BestNoteAbLib。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BestNoteAbLib = api;
})(typeof self !== 'undefined' ? self : this, function () {
  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  // RGBA -> 灰度数组（长度 = w*h）
  function toGrayscale(imageData) {
    const { data } = imageData;
    const out = new Uint8ClampedArray(data.length / 4);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
      out[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }
    return out;
  }

  // 灰度数组 -> RGBA（用于回写到 canvas）
  function grayscaleToRgba(gray) {
    const out = new Uint8ClampedArray(gray.length * 4);
    for (let i = 0, j = 0; i < gray.length; i += 1, j += 4) {
      out[j] = out[j + 1] = out[j + 2] = gray[i];
      out[j + 3] = 255;
    }
    return out;
  }

  function percentile(sorted, ratio) {
    if (!sorted.length) return 0;
    const index = clamp(Math.round((sorted.length - 1) * ratio), 0, sorted.length - 1);
    return sorted[index];
  }

  // 对比度拉伸：把 [lowPct, highPct] 区间拉到 0~255
  function contrastStretch(gray, lowPct = 0.02, highPct = 0.98) {
    const sorted = Array.from(gray).sort((a, b) => a - b);
    const low = percentile(sorted, lowPct);
    const high = percentile(sorted, highPct);
    const out = new Uint8ClampedArray(gray.length);
    if (high <= low) {
      out.set(gray);
      return out;
    }
    const scale = 255 / (high - low);
    for (let i = 0; i < gray.length; i += 1) {
      out[i] = clamp(Math.round((gray[i] - low) * scale), 0, 255);
    }
    return out;
  }

  // Otsu 自动阈值
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

  function binarize(gray, threshold) {
    const t = typeof threshold === 'number' ? threshold : otsuThreshold(gray);
    const out = new Uint8ClampedArray(gray.length);
    for (let i = 0; i < gray.length; i += 1) out[i] = gray[i] > t ? 255 : 0;
    return out;
  }

  // 文本清洗：去掉首尾空白，折叠连续空白，丢弃空行
  function normalizeText(text) {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
  const PRINTER_FRIENDLY = /[\u3001\u3002\uff0c\uff1a\uff1b\uff01\uff1f\u201c\u201d\u2018\u2019\uff08\uff09\u3010\u3011,.:;!?()\[\]【】]/;

  function textStats(text) {
    const normalized = normalizeText(text);
    const lines = normalized ? normalized.split('\n') : [];
    const chars = normalized.replace(/\n/g, '').length;
    let cjk = 0;
    let punctuation = 0;
    let alnum = 0;
    for (const ch of normalized) {
      if (ch === '\n') continue;
      if (CJK.test(ch)) cjk += 1;
      else if (PRINTER_FRIENDLY.test(ch)) punctuation += 1;
      else if (/[A-Za-z0-9]/.test(ch)) alnum += 1;
    }
    return { chars, lines: lines.length, cjk, punctuation, alnum };
  }

  // 质量分：可读字符越多、乱码占比越低，分数越高
  function qualityScore(text) {
    const stats = textStats(text);
    if (!stats.chars) return 0;
    const readable = stats.cjk + stats.alnum;
    const readableRatio = readable / stats.chars;
    // 平均行长（过短的行往往是噪点碎片）
    const avgLine = readable / Math.max(stats.lines, 1);
    const density = clamp(avgLine / 12, 0, 1);
    const score = readable * (0.5 + 0.5 * readableRatio) * (0.6 + 0.4 * density);
    return Math.round(score * 100) / 100;
  }

  // 简单 LCS 行对齐，用于并排差异展示
  function diffLines(a, b) {
    const left = normalizeText(a) ? normalizeText(a).split('\n') : [];
    const right = normalizeText(b) ? normalizeText(b).split('\n') : [];
    const n = left.length;
    const m = right.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        dp[i][j] = left[i] === right[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const rows = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (left[i] === right[j]) {
        rows.push({ left: left[i], right: right[j], tag: 'same' });
        i += 1;
        j += 1;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        rows.push({ left: left[i], right: '', tag: 'only-left' });
        i += 1;
      } else {
        rows.push({ left: '', right: right[j], tag: 'only-right' });
        j += 1;
      }
    }
    while (i < n) {
      rows.push({ left: left[i], right: '', tag: 'only-left' });
      i += 1;
    }
    while (j < m) {
      rows.push({ left: '', right: right[j], tag: 'only-right' });
      j += 1;
    }
    const same = rows.filter((row) => row.tag === 'same').length;
    const total = Math.max(n, m, 1);
    return { rows, agreement: Math.round((same / total) * 100) };
  }

  return {
    clamp,
    toGrayscale,
    grayscaleToRgba,
    contrastStretch,
    otsuThreshold,
    binarize,
    normalizeText,
    textStats,
    qualityScore,
    diffLines
  };
});
