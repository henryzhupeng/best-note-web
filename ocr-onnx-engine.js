/* 优记 BestNote · ONNX Runtime Web + PP-OCRv4 本地引擎
 *
 * 全程在浏览器本地运行：模型从 CDN 下载一次并由浏览器缓存，图片不上传、不调用任何 API。
 * 对外接口：window.BestNoteOnnxOcr = { available(), load(), recognize(input) }
 *   input: HTMLImageElement | HTMLCanvasElement | { url } | { dataUrl }
 *   返回: { text, lines: [{ text, box, score }], elapsedMs }
 *
 * 该文件同时兼容 A/B 页的 window.BestNoteAltOcr 约定（recognize 返回纯文本由调用方处理）。
 */
(function (root) {
  const LIB = root.BestNoteOnnxLib || (typeof require === 'function' ? require('./ocr-onnx-lib.js') : null);

  const DEFAULTS = {
    ortUrl: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/ort.min.js',
    ortWasmPath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/',
    fetchTimeoutMs: 25000,
    detLimit: 960,
    detThreshold: 0.3,
    boxMinScore: 0.45,
    recHeight: 48,
    recMaxWidth: 320,
    // 国内网络优先走 hf-mirror / jsDelivr，huggingface.co 放最后；每个来源超时后自动换下一个
    detSources: [
      'https://hf-mirror.com/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_infer.onnx',
      'https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_det_infer.onnx'
    ],
    recSources: [
      'https://hf-mirror.com/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_rec_infer.onnx',
      'https://huggingface.co/SWHL/RapidOCR/resolve/main/PP-OCRv4/ch_PP-OCRv4_rec_infer.onnx'
    ],
    dictSources: [
      'https://cdn.jsdelivr.net/gh/PaddlePaddle/PaddleOCR@release/2.7/ppocr/utils/ppocr_keys_v1.txt',
      'https://hf-mirror.com/SWHL/RapidOCR/resolve/main/PP-OCRv4/ppocr_keys_v1.txt',
      'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/release/2.7/ppocr/utils/ppocr_keys_v1.txt'
    ]
  };

  const config = Object.assign({}, DEFAULTS, root.BESTNOTE_ONNX_CONFIG || {});
  const state = { status: 'idle', error: '', det: null, rec: null, dict: null, loading: null };

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`脚本加载失败：${url}`));
      document.head.appendChild(script);
    });
  }

  async function loadOrt() {
    if (root.ort?.InferenceSession) return root.ort;
    await loadScript(config.ortUrl);
    if (!root.ort?.InferenceSession) throw new Error('onnxruntime-web 初始化失败');
    root.ort.env.wasm.wasmPaths = config.ortWasmPath;
    root.ort.env.wasm.numThreads = 1;
    root.ort.env.logLevel = 'error';
    return root.ort;
  }

  function fetchWithTimeout(url, timeoutMs) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), timeoutMs);
    return fetch(url, controller ? { signal: controller.signal } : undefined).finally(() => clearTimeout(timer));
  }

  // 依次尝试多个来源，返回第一个成功的 ArrayBuffer / 文本；每个来源都有超时，避免无限期卡住
  async function fetchFirst(urls, mode) {
    const errors = [];
    for (const url of urls) {
      try {
        const response = await fetchWithTimeout(url, config.fetchTimeoutMs || 45000);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return mode === 'text' ? await response.text() : await response.arrayBuffer();
      } catch (error) {
        errors.push(`${url} -> ${error.name === 'AbortError' ? '超时' : error.message}`);
      }
    }
    throw new Error(`所有来源均失败：\n${errors.join('\n')}`);
  }

  function parseDict(text) {
    return text.replace(/\r\n?/g, '\n').split('\n').filter((line, index, all) => !(index === all.length - 1 && line === ''));
  }

  async function load() {
    if (state.status === 'ready') return state;
    if (state.loading) return state.loading;
    state.status = 'loading';
    state.error = '';
    state.loading = (async () => {
      try {
        const ort = await loadOrt();
        const [detBuf, recBuf, dictText] = await Promise.all([
          fetchFirst(config.detSources, 'buffer'),
          fetchFirst(config.recSources, 'buffer'),
          fetchFirst(config.dictSources, 'text')
        ]);
        state.det = await ort.InferenceSession.create(detBuf, { executionProviders: ['wasm'] });
        state.rec = await ort.InferenceSession.create(recBuf, { executionProviders: ['wasm'] });
        state.dict = parseDict(dictText);
        state.status = 'ready';
        return state;
      } catch (error) {
        state.status = 'error';
        state.error = error.message;
        throw error;
      } finally {
        state.loading = null;
      }
    })();
    return state.loading;
  }

  function toCanvas(source) {
    if (source instanceof HTMLCanvasElement) return Promise.resolve(source);
    if (source instanceof HTMLImageElement) {
      return Promise.resolve(source);
    }
    const url = typeof source === 'string' ? source : source?.url || source?.dataUrl;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片读取失败'));
      img.src = url;
    });
  }

  function drawScaled(image, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
    return canvas;
  }

  function roundUp32(value) {
    return Math.max(32, Math.ceil(value / 32) * 32);
  }

  // 检出预处理：RGB，缩放到 32 的倍数，归一化到 [0,1]，NCHW
  function detectionTensor(canvas) {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, width, height);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];
    const plane = width * height;
    const out = new Float32Array(plane * 3);
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      for (let c = 0; c < 3; c += 1) {
        out[c * plane + p] = (data[i + c] / 255 - mean[c]) / std[c];
      }
    }
    return { data: out, dims: [1, 3, height, width] };
  }

  // 识别预处理：RGB，缩放高度 48，归一化到 [-1,1]，NCHW
  function recognitionTensor(canvas) {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, width, height);
    const plane = width * height;
    const out = new Float32Array(plane * 3);
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      for (let c = 0; c < 3; c += 1) out[c * plane + p] = data[i + c] / 127.5 - 1;
    }
    return { data: out, dims: [1, 3, height, width] };
  }

  function softmaxRow(data, offset, count) {
    let max = -Infinity;
    for (let i = 0; i < count; i += 1) max = Math.max(max, data[offset + i]);
    let sum = 0;
    const exp = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      exp[i] = Math.exp(data[offset + i] - max);
      sum += exp[i];
    }
    let best = 0;
    let bestValue = -1;
    for (let i = 0; i < count; i += 1) {
      const value = exp[i] / sum;
      if (value > bestValue) {
        bestValue = value;
        best = i;
      }
    }
    return { index: best, score: bestValue };
  }

  async function detectBoxes(image) {
    const ort = root.ort;
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const scale = Math.min(1, config.detLimit / Math.max(naturalWidth, naturalHeight));
    const rw = roundUp32(Math.round(naturalWidth * scale));
    const rh = roundUp32(Math.round(naturalHeight * scale));
    const canvas = drawScaled(image, rw, rh);

    const tensor = detectionTensor(canvas);
    const feeds = {};
    feeds[state.det.inputNames[0]] = new ort.Tensor('float32', tensor.data, tensor.dims);
    const outputs = await state.det.run(feeds);
    const output = outputs[state.det.outputNames[0]];
    const dims = output.dims;
    const mapHeight = dims[dims.length - 2];
    const mapWidth = dims[dims.length - 1];
    const prob = output.data.length === mapWidth * mapHeight
      ? output.data
      : output.data.subarray(0, mapWidth * mapHeight);

    const mask = LIB.binarizeProb(prob, mapWidth, mapHeight, config.detThreshold);
    const radius = Math.max(2, Math.round(mapWidth / 120));
    const dilated = LIB.dilateHorizontal(mask, mapWidth, mapHeight, radius);
    let boxes = LIB.connectedComponents(dilated, mapWidth, mapHeight, 6);
    boxes = LIB.mergeBoxes(boxes, Math.max(6, radius * 2), 0.4);
    boxes = LIB.filterBoxes(boxes, prob, mapWidth, mapHeight, {
      minHeight: 5,
      minWidth: 4,
      maxHeightRatio: 0.92,
      maxWidthRatio: 0.995,
      minScore: config.boxMinScore
    });
    boxes = LIB.sortBoxesReadingOrder(boxes);

    const sx = naturalWidth / mapWidth;
    const sy = naturalHeight / mapHeight;
    return boxes.map((box) => ({
      minX: Math.max(0, Math.floor(box.minX * sx) - 2),
      minY: Math.max(0, Math.floor(box.minY * sy) - 2),
      maxX: Math.min(naturalWidth - 1, Math.ceil(box.maxX * sx) + 2),
      maxY: Math.min(naturalHeight - 1, Math.ceil(box.maxY * sy) + 2),
      score: box.score
    }));
  }

  function cropBox(image, box) {
    const width = Math.max(1, box.maxX - box.minX + 1);
    const height = Math.max(1, box.maxY - box.minY + 1);
    const size = LIB.computeResize(width, height, config.recHeight, config.recMaxWidth, 16);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(image, box.minX, box.minY, width, height, 0, 0, size.width, size.height);
    return canvas;
  }

  async function recognizeBox(image, box) {
    const ort = root.ort;
    const canvas = cropBox(image, box);
    const tensor = recognitionTensor(canvas);
    const feeds = {};
    feeds[state.rec.inputNames[0]] = new ort.Tensor('float32', tensor.data, tensor.dims);
    const outputs = await state.rec.run(feeds);
    const output = outputs[state.rec.outputNames[0]];
    const dims = output.dims;
    const steps = dims[dims.length - 2];
    const classes = dims[dims.length - 1];
    const indices = new Int32Array(steps);
    let scoreSum = 0;
    for (let t = 0; t < steps; t += 1) {
      const { index, score } = softmaxRow(output.data, t * classes, classes);
      indices[t] = index;
      if (index !== 0) scoreSum += score;
    }
    const text = LIB.ctcDecode(indices, state.dict);
    return { text, score: steps ? scoreSum / steps : 0 };
  }

  async function recognize(input) {
    const startedAt = (root.performance || Date).now();
    await load();
    const image = await toCanvas(input);
    const boxes = await detectBoxes(image);
    const lines = [];
    for (const box of boxes) {
      try {
        const result = await recognizeBox(image, box);
        if (result.text.trim()) lines.push({ text: result.text, box, score: result.score });
      } catch (error) {
        console.warn('ONNX 单行识别失败：', error);
      }
    }
    return {
      text: lines.map((line) => line.text).join('\n'),
      lines,
      elapsedMs: (root.performance || Date).now() - startedAt
    };
  }

  root.BestNoteOnnxOcr = {
    config,
    status: () => state.status,
    error: () => state.error,
    load,
    recognize,
    available: () => typeof document !== 'undefined' && typeof WebAssembly === 'object'
  };

})(typeof window !== 'undefined' ? window : globalThis);
