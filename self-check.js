(() => {
  'use strict';

  const resultsRoot = document.getElementById('results');
  const totalRoot = document.getElementById('total');
  const passedRoot = document.getElementById('passed');
  const failedRoot = document.getElementById('failed');
  const frame = document.getElementById('app-frame');

  const waitForApi = () => new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const api = frame.contentWindow?.BestNoteTestApi;
      if (api) {
        clearInterval(timer);
        resolve(api);
      } else if (Date.now() - started > 12000) {
        clearInterval(timer);
        reject(new Error('应用自检接口加载超时。'));
      }
    }, 80);
  });

  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  const tests = [
    {
      name: 'Markdown 表格可解析',
      run(api) {
        const blocks = api.parseBlocks('| 时间 | 内容 |\n| --- | --- |\n| 3天 | 恢复肌肉 |\n| 7天 | 体能下降 |');
        const table = blocks.find((block) => block.type === 'table');
        assert(table, '没有解析出表格块');
        assert(table.headers?.[0] === '时间' && table.headers?.[1] === '内容', '表头不正确');
        assert(table.rows?.length >= 2, '表格正文行不足');
      }
    },
    {
      name: '健身内容生成健身相关标题',
      run(api) {
        const text = '停止健身多久掉肌肉？\n3天不会掉肌肉。\n7天体能下降，重启训练容易心慌气短。\n30天肌肉围度下降。';
        const title = api.titles(text)[0]?.title || '';
        assert(/健身|肌肉|训练/.test(title), `标题与健身主题不相关：${title}`);
      }
    },
    {
      name: '股票内容生成股票相关标题',
      run(api) {
        const text = 'AI 算力板块观察\n股票代码 600519\n关注订单增速、毛利率和估值风险。\n机构调研纪要显示需求增长。';
        const title = api.titles(text)[0]?.title || '';
        assert(/股票|板块|市场|投资|算力/.test(title), `标题与股票主题不相关：${title}`);
      }
    },
    {
      name: '健身标签自动识别',
      run(api) {
        const tags = api.inferTags('停止健身多久掉肌肉，训练和恢复很重要。', '健身恢复');
        assert(tags.includes('健身'), `未生成健身标签：${tags.join('、')}`);
      }
    },
    {
      name: '学习内容推荐学习模板',
      run(api) {
        const template = api.recommendTemplate('概率论知识点复习\n考试重点和练习题\n背诵公式');
        assert(template === 'study', `推荐为 ${template}，期望 study`);
      }
    },
    {
      name: '会议内容推荐会议模板',
      run(api) {
        const template = api.recommendTemplate('项目周会纪要\n会议结论\n负责人和截止时间\n行动项');
        assert(template === 'meeting', `推荐为 ${template}，期望 meeting`);
      }
    },
    {
      name: '健身内容推荐健身模板',
      run(api) {
        const template = api.recommendTemplate('健身训练计划\n深蹲组数和卧推重量\n饮食与恢复');
        assert(template === 'fitness', `推荐为 ${template}，期望 fitness`);
      }
    },
    {
      name: '时间 OCR 常见错误纠正',
      run(api) {
        assert(api.correctTime('WO. 天') === '30天', `WO. 天 纠正错误：${api.correctTime('WO. 天')}`);
        assert(api.correctTime('3.') === '3天', `3. 纠正错误：${api.correctTime('3.')}`);
      }
    },
    {
      name: '时间序列保持递增',
      run(api) {
        const values = api.normalizeTimes(['3天', '7天', '131天', '180天']);
        const third = Number(String(values[2]).replace(/\D/g, ''));
        assert(third > 7 && third < 180, `异常时间没有纠偏：${values.join(', ')}`);
      }
    },
    {
      name: 'HTML 清理移除脚本',
      run(api) {
        const clean = api.sanitizeHtml('<h3>标题</h3><script>alert(1)</script><p onclick="x()">正文</p>');
        assert(!/script|onclick/i.test(clean), `危险内容未清理：${clean}`);
        assert(clean.includes('正文'), '安全正文被误删');
      }
    },
    {
      name: '真实示例数量和表格完整',
      run(api) {
        const examples = api.examples();
        assert(examples.length >= 8, `示例数量不足：${examples.length}`);
        assert(examples.some((note) => /健身/.test(note.title) && /<table/i.test(note.contentHtml)), '缺少健身表格示例');
        assert(examples.some((note) => /学习|概率/.test(note.title)), '缺少学习示例');
        assert(examples.some((note) => /会议/.test(note.title)), '缺少会议示例');
      }
    },
    {
      name: '表格 HTML 生成稳定',
      run(api) {
        const html = api.matrixToHtml([['名称', '数值'], ['训练', '30']]);
        assert(/<table>/.test(html) && /<th>名称<\/th>/.test(html) && /<td>30<\/td>/.test(html), `表格 HTML 不正确：${html}`);
      }
    },
    {
      name: '合并单元格可生成 colspan / rowspan',
      run(api) {
        const html = api.matrixToHtml([
          [{ text: '合并标题', rowSpan: 1, colSpan: 2 }, { text: '', hidden: true }],
          ['A', 'B']
        ]);
        assert(/colspan="2"/.test(html), `没有输出 colspan：${html}`);
        const matrix = api.matrixFromHtml('<table><tr><th colspan="2">合并</th></tr><tr><td>A</td><td>B</td></tr></table>');
        assert(matrix[0][0].colSpan === 2, '合并单元格回读失败');
        assert(matrix[0][1].hidden === true, '合并区域没有生成占位单元格');
      }
    },
    {
      name: 'IndexedDB 数据层可用',
      run(api) {
        assert(api.supportsIndexedDb, '当前浏览器未开放 IndexedDB');
      }
    },
    {
      name: '合并章节保持指定顺序',
      run(api) {
        const html = api.mergeSectionsHtml([
          { id: 'first', title: '第一章', contentHtml: '<p>第一段</p>' },
          { id: 'second', title: '第二章', contentHtml: '<p>第二段</p>' }
        ]);
        assert(html.includes('data-section-id="first"'), '缺少第一章节标识');
        assert(html.indexOf('第一章') < html.indexOf('第二章'), '章节顺序不正确');
      }
    },
    {
      name: '应用版本为 v7.12',
      run(api) {
        assert(api.version === '7.12', `版本为 ${api.version}`);
      }
    }
  ];

  function createRow(test) {
    const row = document.createElement('article');
    row.className = 'test running';
    row.innerHTML = `<span class="status">…</span><div><strong>${test.name}</strong><p>正在运行</p></div><small>待完成</small>`;
    resultsRoot.appendChild(row);
    return row;
  }

  async function run() {
    resultsRoot.innerHTML = '';
    totalRoot.textContent = '0';
    passedRoot.textContent = '0';
    failedRoot.textContent = '0';
    let passed = 0;
    let failed = 0;

    let api;
    try {
      api = await waitForApi();
    } catch (error) {
      const row = createRow({ name: '加载应用自检接口' });
      row.className = 'test fail';
      row.innerHTML = `<span class="status">!</span><div><strong>加载应用自检接口</strong><p>${error.message}</p></div><small>失败</small>`;
      totalRoot.textContent = '1';
      failedRoot.textContent = '1';
      return;
    }

    const started = performance.now();
    for (const test of tests) {
      const row = createRow(test);
      try {
        await test.run(api);
        row.className = 'test pass';
        row.innerHTML = `<span class="status">✓</span><div><strong>${test.name}</strong><p>通过</p></div><small>pass</small>`;
        passed += 1;
      } catch (error) {
        row.className = 'test fail';
        row.innerHTML = `<span class="status">!</span><div><strong>${test.name}</strong><p>${error.message}</p></div><small>fail</small>`;
        failed += 1;
      }
    }
    totalRoot.textContent = String(tests.length);
    passedRoot.textContent = String(passed);
    failedRoot.textContent = String(failed);
    const banner = document.createElement('div');
    banner.className = 'note';
    banner.textContent = failed ? `自检未全部通过：${failed} 项失败，请先修复再交付。耗时 ${Math.round(performance.now() - started)}ms。` : `全部 ${passed} 项通过，耗时 ${Math.round(performance.now() - started)}ms。`;
    resultsRoot.appendChild(banner);
  }

  let hasStarted = false;
  const startOnce = () => {
    if (hasStarted) return;
    hasStarted = true;
    run();
  };

  document.getElementById('rerun').addEventListener('click', run);
  frame.addEventListener('load', startOnce, { once: true });
  window.addEventListener('load', () => {
    if (frame.contentDocument?.readyState === 'complete') startOnce();
  });
})();
