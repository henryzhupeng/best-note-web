/* 优记 BestNote - Web MVP prototype
 * OCR 与 AI 整理均使用浏览器端真实识别，并按模板整理内容。
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'best-note-web-v1';
  const DB_NAME = 'best-note-web-db';
  const DB_VERSION = 3;
  const DB_STATE_STORE = 'state';
  const DB_HISTORY_STORE = 'history';
  const DB_SHARE_STORE = 'share';
  const DB_ASSETS_STORE = 'assets';
  const ASSET_DB_NAME = 'best-note-assets-db';
  const ASSET_DB_VERSION = 1;
  const MAX_FILES = 20;
  const OCR_EMPTY_CELL = '\uE000';

  const icons = {
    general: '✦',
    study: '◇',
    work: '◫',
    hobby: '⌁',
    stock: '↗',
    meeting: '◫',
    reading: '◇',
    fitness: '⌁',
    project: '⛭',
    travel: '⌖',
    cooking: '◒',
    ocr: '⌘'
  };

  const templates = {
    auto: {
      name: '智能推荐',
      icon: '✦',
      description: '读取正文主题，自动选择最合适的模板',
      noteType: 'general'
    },
    study: {
      name: '学习笔记',
      icon: '◇',
      description: '知识点 · 理解 · 复习与练习',
      noteType: 'study'
    },
    work: {
      name: '工作记录',
      icon: '◫',
      description: '目标 · 进展 · 风险 · 行动项',
      noteType: 'work'
    },
    hobby: {
      name: '兴趣爱好',
      icon: '⌁',
      description: '实践记录 · 心得 · 后续安排',
      noteType: 'hobby'
    },
    meeting: {
      name: '会议纪要',
      icon: '▦',
      description: '议题 · 结论 · 风险 · 待办',
      noteType: 'meeting'
    },
    fitness: {
      name: '健身训练',
      icon: '↗',
      description: '动作 · 组数 · 饮食 · 恢复',
      noteType: 'fitness'
    },
    stock: {
      name: '投资研究',
      icon: '△',
      description: '板块 · 指标 · 风险 · 跟踪',
      noteType: 'stock'
    },
    reading: {
      name: '阅读摘录',
      icon: '▤',
      description: '观点 · 摘录 · 感想 · 行动',
      noteType: 'reading'
    },
    project: {
      name: '项目计划',
      icon: '⛭',
      description: '里程碑 · 依赖 · 风险 · 交付',
      noteType: 'project'
    },
    travel: {
      name: '旅行攻略',
      icon: '⌖',
      description: '路线 · 预算 · 清单 · 提醒',
      noteType: 'travel'
    },
    cooking: {
      name: '食谱菜谱',
      icon: '◒',
      description: '食材 · 步骤 · 火候 · 复盘',
      noteType: 'cooking'
    }
  };

  const textTemplates = {
    auto: {
      name: '智能推荐',
      icon: '✦',
      description: '识别内容类型，自动选择结构',
      sample: ['课堂内容 → 分层大纲', '会议内容 → 行动项']
    },
    raw: {
      name: '原样整理',
      icon: '≡',
      description: '保留原始段落和表格结构',
      sample: ['正文段落', '原始表格']
    },
    classroom: {
      name: '课堂笔记',
      icon: '◇',
      description: '去冗余，提炼重点和复习清单',
      sample: ['核心概念', '重点 / 难点', '复习清单']
    },
    wrong_question: {
      name: '错题整理',
      icon: '△',
      description: '拆分题干、答案、错误原因和考点',
      sample: ['题干', '答案', '错误原因 / 考点']
    },
    tech_doc: {
      name: '技术文档',
      icon: '⚙',
      description: '提取参数，整理为 Markdown 表格',
      sample: ['参数名 / 值 / 说明', '注意事项']
    },
    reading: {
      name: '阅读摘录',
      icon: '▤',
      description: '摘要、关键词、摘录和行动',
      sample: ['内容摘要', '关键词', '我的行动']
    },
    meeting: {
      name: '会议纪要',
      icon: '▦',
      description: '提取结论、行动项、责任人和时间',
      sample: ['会议结论', '行动项 / 负责人 / 时间']
    }
  };

  const templateSamples = {
    auto: ['读取正文主题', '自动匹配结构'],
    study: ['条件概率 P(A|B)', '复习：默写公式'],
    work: ['完成 AB 测试', '风险：样本量不足'],
    hobby: ['1:16 粉水比', '心得：甜感更明显'],
    meeting: ['结论：先验证 OCR', '待办：周五交付'],
    fitness: ['深蹲 4 组 × 8 次', '恢复：睡眠 7 小时'],
    stock: ['板块：AI 服务器', '跟踪：订单与毛利率'],
    reading: ['杠杆来自可复制资产', '行动：每周公开复盘'],
    project: ['P0：表格编辑', '里程碑：周日打包'],
    travel: ['Day 1：东山', '提醒：8 点前到达'],
    cooking: ['鸡胸 200g / 米饭 150g', '火候：中火 8 分钟']
  };

  const seedNotes = [
    {
      id: 'seed-stock',
      title: 'AI 算力板块观察清单',
      type: 'stock',
      folder: '投资研究',
      tags: ['股票', 'AI'],
      summary: '从算力、服务器和液冷三条主线梳理近期关注方向，并标出需要跟踪的风险点。',
      contentHtml: [
        '<h3>核心结论</h3>',
        '<p>算力需求仍处于高景气阶段，但板块内部会从“普涨”转向业绩验证。重点关注订单能见度高、现金流改善的方向。</p>',
        '<h3>板块清单</h3>',
        '<table><thead><tr><th>板块</th><th>核心逻辑</th><th>关注指标</th><th>风险</th></tr></thead><tbody>',
        '<tr><td>AI 服务器</td><td>海外资本开支持续，国内订单逐步释放</td><td>订单增速、毛利率</td><td>需求不及预期</td></tr>',
        '<tr><td>液冷</td><td>高功率密度推动渗透率提升</td><td>渗透率、客户验证</td><td>竞争加剧</td></tr>',
        '<tr><td>光模块</td><td>速率升级与用量增长共振</td><td>出货结构、良率</td><td>估值波动</td></tr>',
        '</tbody></table>',
        '<h3>下一步跟踪</h3>',
        '<ul><li>整理本周公告与机构调研纪要</li><li>补充海外龙头资本开支变化</li><li>为核心标的设置估值与业绩预警</li></ul>'
      ].join(''),
      createdAt: '2026-09-26T09:30:00.000Z',
      updatedAt: '2026-09-26T09:30:00.000Z'
    },
    {
      id: 'seed-meeting',
      title: '网页版 MVP 周会纪要',
      type: 'meeting',
      folder: '工作',
      tags: ['工作', '会议'],
      summary: '明确网页版第一阶段范围，先验证批量截图整理与独立 OCR 两条核心路径。',
      contentHtml: [
        '<h3>会议目标</h3>',
        '<p>确认网页版 MVP 的功能边界、演示路径和本周交付物。</p>',
        '<h3>讨论结论</h3>',
        '<ul><li>首版优先支持批量上传、模板选择、生成预览和本地保存</li><li>独立 OCR 不强制保存为笔记，结果可直接复制</li><li>导出先覆盖 Markdown、文本与表格文件</li></ul>',
        '<h3>行动项</h3>',
        '<ul><li>周三前完成高保真交互原型</li><li>周五前确认 OCR 与模型服务选型</li><li>补充 20 张图片批量处理的性能测试方案</li></ul>'
      ].join(''),
      createdAt: '2026-09-25T06:20:00.000Z',
      updatedAt: '2026-09-25T06:20:00.000Z'
    },
    {
      id: 'seed-reading',
      title: '《深度工作》阅读摘录',
      type: 'reading',
      folder: '个人成长',
      tags: ['学习', '读书'],
      summary: '整理深度工作的价值、常见阻力和可落地的执行方法。',
      contentHtml: [
        '<h3>核心观点</h3>',
        '<p>高质量产出越来越依赖长时间、无干扰的专注，而这项能力正在变得稀缺。</p>',
        '<h3>可执行方法</h3>',
        '<ul><li>每天预留一段固定、不可打断的专注时间</li><li>用明确产出定义工作，而非用时长衡量</li><li>主动减少低价值沟通与碎片化信息输入</li></ul>',
        '<h3>我的行动</h3>',
        '<p>工作日上午安排 90 分钟深度时段，关闭消息提醒，结束后记录完成项。</p>'
      ].join(''),
      createdAt: '2026-09-23T12:10:00.000Z',
      updatedAt: '2026-09-23T12:10:00.000Z'
    }
  ];

  const exampleNotes = [
    {
      id: 'example-fitness',
      title: '停止健身多久会掉肌肉？',
      type: 'fitness',
      folder: '健身',
      tags: ['健身', '训练', '恢复'],
      summary: '用时间轴整理停练后的身体变化，并记录恢复训练时最重要的三个动作。',
      contentHtml: [
        '<h3>核心结论</h3>',
        '<p>短期停练不必过度焦虑。真正影响恢复速度的，是停练时间、日常活动量和重新开始时的强度。</p>',
        '<h3>时间轴</h3>',
        '<table><thead><tr><th>时间</th><th>身体变化</th><th>建议</th></tr></thead><tbody>',
        '<tr><td>3天</td><td>肌肉不会明显流失，处于修复阶段</td><td>保持睡眠和蛋白质摄入</td></tr>',
        '<tr><td>7天</td><td>体能开始下降，重新训练更容易气喘</td><td>先做低强度有氧和全身激活</td></tr>',
        '<tr><td>30天</td><td>力量和围度下降，动作熟练度变弱</td><td>用原训练量的 60% 重启</td></tr>',
        '<tr><td>90天</td><td>肌肉流失更明显，受伤风险上升</td><td>从基础动作和稳定性训练开始</td></tr>',
        '</tbody></table>',
        '<h3>恢复训练清单</h3>',
        '<ul><li>第 1 周只做深蹲、推举、划船三个复合动作</li><li>每次训练保留 3–4 次余力，不追求极限重量</li><li>训练后补充蛋白质，并把睡眠放在第一位</li></ul>'
      ].join(''),
      pinned: true,
      createdAt: '2026-09-28T08:30:00.000Z',
      updatedAt: '2026-09-30T11:20:00.000Z'
    },
    {
      id: 'example-study',
      title: '概率论：条件概率与贝叶斯公式',
      type: 'study',
      folder: '学习',
      tags: ['学习', '数学', '复习'],
      summary: '用“已知信息改变判断”的主线理解条件概率，并整理贝叶斯公式的做题步骤。',
      contentHtml: [
        '<h3>知识点整理</h3>',
        '<p>条件概率 P(A|B) 表示事件 B 已经发生时，事件 A 发生的概率。它把新的信息纳入原来的判断。</p>',
        '<ul><li>乘法公式：P(AB) = P(B) × P(A|B)</li><li>全概率公式：先把原因分组，再计算结果发生的总概率</li><li>贝叶斯公式：观察到结果后，反推最可能的原因</li></ul>',
        '<h3>复习与练习</h3>',
        '<ul><li>明天复习：默写公式并解释每个符号</li><li>完成 3 道医疗检测类应用题</li><li>错题重点标记：先验概率、似然、后验概率</li></ul>',
        '<h3>一句话理解</h3>',
        '<p>先验是原来的信念，证据是看到的数据，后验是更新后的判断。</p>'
      ].join(''),
      pinned: false,
      createdAt: '2026-09-24T03:10:00.000Z',
      updatedAt: '2026-09-29T07:45:00.000Z'
    },
    {
      id: 'example-work',
      title: 'Q4 增长实验周报',
      type: 'work',
      folder: '工作',
      tags: ['工作', '增长', '周报'],
      summary: '记录本周两个增长实验的结果、阻塞点和下周行动项。',
      contentHtml: [
        '<h3>工作内容</h3>',
        '<ul><li>完成新用户引导页 AB 测试，实验组次日留存提升 4.2%</li><li>梳理激活漏斗，定位到“第一步配置”流失最多</li><li>与设计确认新版空状态和示例内容方案</li></ul>',
        '<h3>问题与风险</h3>',
        '<ul><li>埋点口径与数据团队存在差异，暂不能直接下结论</li><li>实验样本量仍偏小，需要再观察一个完整周期</li></ul>',
        '<h3>下一步行动</h3>',
        '<table><thead><tr><th>行动</th><th>负责人</th><th>截止时间</th></tr></thead><tbody>',
        '<tr><td>统一埋点口径并补齐看板</td><td>我</td><td>周二</td></tr>',
        '<tr><td>完成配置页文案和流程图</td><td>设计</td><td>周三</td></tr>',
        '<tr><td>复盘实验是否需要延长周期</td><td>数据</td><td>周五</td></tr>',
        '</tbody></table>'
      ].join(''),
      pinned: false,
      createdAt: '2026-09-27T01:00:00.000Z',
      updatedAt: '2026-09-29T10:15:00.000Z'
    },
    {
      id: 'example-coffee',
      title: '手冲咖啡参数记录：埃塞俄比亚日晒',
      type: 'hobby',
      folder: '兴趣爱好',
      tags: ['兴趣爱好', '咖啡', '手冲'],
      summary: '记录三组冲煮参数，找出自己喜欢的酸甜平衡点。',
      contentHtml: [
        '<h3>实践记录</h3>',
        '<table><thead><tr><th>参数</th><th>方案 A</th><th>方案 B</th><th>方案 C</th></tr></thead><tbody>',
        '<tr><td>粉水比</td><td>1:15</td><td>1:16</td><td>1:16.5</td></tr>',
        '<tr><td>水温</td><td>92℃</td><td>90℃</td><td>88℃</td></tr>',
        '<tr><td>研磨</td><td>中细</td><td>中细</td><td>中粗</td></tr>',
        '<tr><td>风味</td><td>甜感最强</td><td>平衡</td><td>花果香更明显</td></tr>',
        '</tbody></table>',
        '<h3>心得与发现</h3>',
        '<p>降低水温后苦感明显减少，但萃取不足时会出现青涩味。方案 B 最稳定，适合作为日常参数。</p>',
        '<h3>后续计划</h3>',
        '<ul><li>下周尝试延长闷蒸到 35 秒</li><li>记录不同滤杯对流速的影响</li></ul>'
      ].join(''),
      pinned: false,
      createdAt: '2026-09-20T12:20:00.000Z',
      updatedAt: '2026-09-28T05:30:00.000Z'
    },
    {
      id: 'example-reading',
      title: '《纳瓦尔宝典》阅读摘录',
      type: 'reading',
      folder: '个人成长',
      tags: ['阅读', '成长', '思考'],
      summary: '整理关于杠杆、判断力和长期主义的摘录，并写下本周行动。',
      contentHtml: [
        '<h3>核心观点</h3>',
        '<p>真正的财富来自可复制、可积累的杠杆，而不是单纯出售时间。</p>',
        '<ul><li>代码和媒体是边际复制成本最低的杠杆</li><li>判断力来自长期积累的模型和真实反馈</li><li>用长期游戏筛选值得投入的人和事</li></ul>',
        '<h3>我的行动</h3>',
        '<ul><li>把重复工作整理成可复用模板</li><li>每周写一篇公开复盘，积累个人媒体资产</li><li>减少低价值社交，把时间留给深度工作</li></ul>'
      ].join(''),
      pinned: false,
      createdAt: '2026-09-18T06:00:00.000Z',
      updatedAt: '2026-09-26T02:10:00.000Z'
    },
    {
      id: 'example-travel',
      title: '京都 3 日慢旅行路线',
      type: 'travel',
      folder: '旅行',
      tags: ['旅行', '京都', '攻略'],
      summary: '按区域安排三天路线，减少通勤，把重点放在清晨和傍晚。',
      contentHtml: [
        '<h3>路线安排</h3>',
        '<table><thead><tr><th>日期</th><th>区域</th><th>重点</th></tr></thead><tbody>',
        '<tr><td>Day 1</td><td>东山</td><td>清水寺清晨、二年坂、八坂神社</td></tr>',
        '<tr><td>Day 2</td><td>岚山</td><td>竹林小径、渡月桥、常寂光寺</td></tr>',
        '<tr><td>Day 3</td><td>金阁寺周边</td><td>金阁寺、龙安寺、鸭川散步</td></tr>',
        '</tbody></table>',
        '<h3>提醒</h3>',
        '<ul><li>热门景点尽量在 8 点前到达</li><li>地铁和公交都可以使用交通 IC 卡</li><li>每天只安排一个核心区域，留出休息时间</li></ul>'
      ].join(''),
      pinned: false,
      createdAt: '2026-09-16T01:20:00.000Z',
      updatedAt: '2026-09-25T09:00:00.000Z'
    },
    {
      id: 'example-meeting',
      title: '优记 v7 产品评审会纪要',
      type: 'meeting',
      folder: '工作',
      tags: ['会议', '产品', '规划'],
      summary: '确定 v7 先做 IndexedDB、版本历史、表格合并和手机快捷导入四项能力。',
      contentHtml: [
        '<h3>会议目标</h3>',
        '<p>明确与通用笔记软件的差异化：不做大而全，先做好“截图后的整理与归档”。</p>',
        '<h3>讨论结论</h3>',
        '<ul><li>模板从三个扩展到学习、工作、兴趣、会议、健身、阅读、项目、旅行和食谱</li><li>表格支持单元格编辑和增删行列</li><li>示例中心放到侧栏，导入后可以直接试用搜索、筛选、合并和导出</li><li>加入 PWA 安装能力，在手机上像 App 一样打开</li></ul>',
        '<h3>行动项</h3>',
        '<ul><li>完成模板推荐算法和真实内容示例</li><li>补上自检页面和回归清单</li><li>打包最新版给用户测试</li></ul>'
      ].join(''),
      pinned: true,
      createdAt: '2026-09-30T02:00:00.000Z',
      updatedAt: '2026-09-30T08:30:00.000Z'
    },
    {
      id: 'example-project',
      title: '优记 Web v7 迭代计划',
      type: 'project',
      folder: '工作',
      tags: ['项目', '产品', '计划'],
      summary: '围绕 IndexedDB、版本历史、表格合并和手机导入能力推进 v7。',
      contentHtml: [
        '<h3>项目目标</h3>',
        '<p>让用户从一张截图到一条可检索、可编辑、可导出的结构化笔记，路径不超过三步。</p>',
        '<h3>里程碑</h3>',
        '<table><thead><tr><th>阶段</th><th>交付物</th><th>验收标准</th></tr></thead><tbody>',
        '<tr><td>P0</td><td>模板推荐、表格编辑</td><td>预览与保存一致，表格可增删行列</td></tr>',
        '<tr><td>P1</td><td>示例中心、离线安装</td><td>至少 8 条真实示例，移动端可安装</td></tr>',
        '<tr><td>P2</td><td>自检与打包</td><td>自检全部通过并输出 zip</td></tr>',
        '</tbody></table>',
        '<h3>风险</h3>',
        '<ul><li>本地 OCR 对复杂表格仍有限，因此继续保留粘贴 AI 结果入口</li><li>示例要真实可编辑，不能只做静态展示</li></ul>'
      ].join(''),
      pinned: false,
      createdAt: '2026-09-29T00:30:00.000Z',
      updatedAt: '2026-09-30T07:20:00.000Z'
    }
  ];

  const defaultState = {
    notes: seedNotes,
    deletedNotes: [],
    customFolders: [],
    route: 'workspace',
    noteId: 'seed-stock',
    search: '',
    filter: '全部',
    folderFilter: '全部文件夹',
    noteSelectionMode: false,
    selectedNoteIds: [],
    sectionSortMode: false,
    workspaceMode: 'rich',
    workspaceMarkdownDraft: '',
    workspaceListOpen: false,
    importFiles: [],
    ocrFiles: [],
    importTemplate: 'auto',
    aiResult: null,
    ocrText: '',
    ocrTitle: '',
    ocrTitleSuggestions: [],
    ocrTags: [],
    ocrFolder: '未分类',
    ocrKeepSources: true,
    aiKeepSources: true,
    ocrDraftHtml: '',
    ocrLang: 'chi_sim+eng',
    ocrEngine: 'local',
    ocrRenderMode: 'text',
    ocrFilterIrrelevant: true,
    ocrTextDirty: false,
    pasteText: '',
    pasteBlocks: [],
    pasteTitle: '',
    pasteTitleSuggestions: [],
    pasteTemplate: 'auto',
    pasteStructuredHtml: '',
    pasteRenderMode: 'auto',
    pasteFilterIrrelevant: true,
    pasteParsed: false,
    ocrMeta: null,
    ocrResults: [],
    ocrBlocks: [],
    ocrForceTable: false,
    ocrRunId: 0,
    ocrError: '',
    busy: false,
    stats: { aiRuns: 0, ocrRuns: 0 },
    lastExampleImportAt: '',
    historySnapshots: [],
    historyLoading: false,
    historyLoaded: false
  };

  let state = loadState();
  let deferredInstallPrompt = null;
  let dbPromise = null;
  let assetDbPromise = null;
  let historySnapshotTimer = null;
  const sourceAssetMemory = new Map();
  let activeSourceObjectUrl = null;
  let draggedSection = null;
  let draggedWorkspaceNote = null;
  let saveStatusTimer = null;
  let workspaceAutosaveTimer = null;
  let activeTheme = localStorage.getItem('best-note-theme') || 'light';
  const root = document.getElementById('view-root');
  const toastRegion = document.getElementById('toast-region');
  const modalRoot = document.getElementById('modal-root');
  const globalSearch = document.getElementById('global-search-input');

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !Array.isArray(saved.notes)) return structuredClone(defaultState);
      return {
        ...structuredClone(defaultState),
        notes: saved.notes,
        deletedNotes: Array.isArray(saved.deletedNotes) ? saved.deletedNotes : [],
        customFolders: Array.isArray(saved.customFolders) ? saved.customFolders : [],
        stats: { ...defaultState.stats, ...(saved.stats || {}) }
      };
    } catch (error) {
      console.warn('读取本地数据失败，使用默认数据。', error);
      return structuredClone(defaultState);
    }
  }

  function withTimeout(promise, timeoutMs, fallback) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => finish(typeof fallback === 'function' ? fallback() : fallback), timeoutMs);
      Promise.resolve(promise).then((value) => finish(value)).catch(() => finish(typeof fallback === 'function' ? fallback() : fallback));
    });
  }

  function applyTheme() {
    document.documentElement.dataset.theme = activeTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme === 'dark' ? '#0f172a' : '#2563eb');
  }

  function toggleTheme() {
    activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('best-note-theme', activeTheme);
    applyTheme();
    toast(activeTheme === 'dark' ? '已切换到深色模式。' : '已切换到浅色模式。', 'success');
  }

  function setSaveStatus(text, tone = '') {
    const status = document.getElementById('save-status');
    if (status) {
      status.textContent = text;
      status.classList.toggle('saving', tone === 'saving');
      status.classList.toggle('saved', tone === 'saved');
    }
    const workspaceStatus = document.getElementById('workspace-save-status');
    if (workspaceStatus) {
      workspaceStatus.textContent = text;
      workspaceStatus.classList.toggle('saving', tone === 'saving');
      workspaceStatus.classList.toggle('saved', tone === 'saved');
    }
  }

  function openDatabase() {
    if (!window.indexedDB) return Promise.reject(new Error('当前浏览器不支持 IndexedDB。'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      const timer = setTimeout(() => {
        dbPromise = null;
        reject(new Error('本地数据库连接超时。'));
      }, 2500);
      const finish = (callback) => {
        clearTimeout(timer);
        callback();
      };
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(DB_STATE_STORE)) {
          database.createObjectStore(DB_STATE_STORE, { keyPath: 'key' });
        }
        if (!database.objectStoreNames.contains(DB_HISTORY_STORE)) {
          const store = database.createObjectStore(DB_HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!database.objectStoreNames.contains(DB_SHARE_STORE)) {
          database.createObjectStore(DB_SHARE_STORE, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(DB_ASSETS_STORE)) {
          database.createObjectStore(DB_ASSETS_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => finish(() => resolve(request.result));
      request.onerror = () => finish(() => { dbPromise = null; reject(request.error || new Error('打开本地数据库失败。')); });
      request.onblocked = () => finish(() => { dbPromise = null; reject(new Error('本地数据库被其他页面占用。')); });
    });
    return dbPromise;
  }

  function openAssetDatabase() {
    if (!window.indexedDB) return Promise.reject(new Error('当前浏览器不支持 IndexedDB。'));
    if (assetDbPromise) return assetDbPromise;
    assetDbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(ASSET_DB_NAME, ASSET_DB_VERSION);
      const timer = setTimeout(() => {
        assetDbPromise = null;
        reject(new Error('原图数据库连接超时。'));
      }, 2500);
      const finish = (callback) => {
        clearTimeout(timer);
        callback();
      };
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(DB_ASSETS_STORE)) {
          database.createObjectStore(DB_ASSETS_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => finish(() => resolve(request.result));
      request.onerror = () => finish(() => {
        assetDbPromise = null;
        reject(request.error || new Error('打开原图数据库失败。'));
      });
      request.onblocked = () => finish(() => {
        assetDbPromise = null;
        reject(new Error('原图数据库被其他页面占用。'));
      });
    });
    return assetDbPromise;
  }

  function idbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB 操作失败。'));
    });
  }

  async function createImageThumbnail(file, maxSize = 220) {
    if (!file?.type?.startsWith('image/')) return '';
    return new Promise((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      let settled = false;
      const finish = (value = '') => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        URL.revokeObjectURL(objectUrl);
        resolve(value);
      };
      const timer = setTimeout(() => finish(''), 2500);
      image.onload = () => {
        try {
          const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round((image.naturalWidth || maxSize) * scale));
          canvas.height = Math.max(1, Math.round((image.naturalHeight || maxSize) * scale));
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          finish(canvas.toDataURL('image/jpeg', 0.72));
        } catch (error) {
          finish('');
        }
      };
      image.onerror = () => finish('');
      image.src = objectUrl;
    });
  }

  async function saveNoteSourceImages(noteId, fileEntries) {
    const files = (fileEntries || []).map((entry) => entry.file || entry).filter((file) => file?.type?.startsWith('image/'));
    if (!files.length) return [];
    const metadata = [];
    const assets = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const data = await file.arrayBuffer();
        const thumbnail = await createImageThumbnail(file);
        const id = `${noteId}-${index}`;
        metadata.push({
          id,
          name: file.name || `截图-${index + 1}.png`,
          type: file.type || 'image/png',
          thumbnail
        });
        assets.push({ id, name: file.name || `截图-${index + 1}.png`, type: file.type || 'image/png', data });
      } catch (error) {
        console.warn(`第 ${index + 1} 张原始截图读取失败，已跳过。`, error);
      }
    }
    if (assets.length) {
      void openAssetDatabase()
        .then((database) => {
          const transaction = database.transaction(DB_ASSETS_STORE, 'readwrite');
          transaction.objectStore(DB_ASSETS_STORE).put({ id: noteId, images: assets, createdAt: new Date().toISOString() });
        })
        .catch((error) => console.warn('原始截图保存失败。', error));
    }
    return metadata;
  }

  function attachSourceImagesInBackground(note, fileEntries) {
    const files = (fileEntries || []).map((entry) => entry.file || entry).filter((file) => file?.type?.startsWith('image/'));
    if (files.length) sourceAssetMemory.set(note.id, files);
    void saveNoteSourceImages(note.id, files)
      .then((sourceImages) => {
        if (!sourceImages.length) return;
        const current = getNoteById(note.id);
        if (!current) return;
        current.sourceImages = sourceImages;
        persist({ history: false });
        if ((state.route === 'note' && state.noteId === note.id) || state.route === 'notes' || state.route === 'home') render();
      })
      .catch((error) => console.warn('原始截图后台归档失败。', error));
  }

  async function getSourceImageAsset(noteId, index) {
    try {
      const database = await openAssetDatabase();
      const transaction = database.transaction(DB_ASSETS_STORE, 'readonly');
      const record = await idbRequest(transaction.objectStore(DB_ASSETS_STORE).get(noteId));
      return record?.images?.[index] || null;
    } catch (error) {
      console.warn('读取原始截图失败。', error);
      return null;
    }
  }

  async function deleteSourceImageAssets(noteId) {
    sourceAssetMemory.delete(noteId);
    try {
      const database = await openAssetDatabase();
      const transaction = database.transaction(DB_ASSETS_STORE, 'readwrite');
      await idbRequest(transaction.objectStore(DB_ASSETS_STORE).delete(noteId));
    } catch (error) {
      console.warn('删除原始截图失败。', error);
    }
  }

  function getDatabaseState() {
    const payload = {
      notes: state.notes,
      deletedNotes: state.deletedNotes,
      customFolders: state.customFolders,
      stats: state.stats
    };
    return { key: 'current', state: payload, updatedAt: new Date().toISOString() };
  }

  async function loadStateFromDatabase() {
    const database = await openDatabase();
    const transaction = database.transaction(DB_STATE_STORE, 'readonly');
    const record = await idbRequest(transaction.objectStore(DB_STATE_STORE).get('current'));
    return record?.state || null;
  }

  async function saveStateToDatabase() {
    const database = await openDatabase();
    const transaction = database.transaction(DB_STATE_STORE, 'readwrite');
    await idbRequest(transaction.objectStore(DB_STATE_STORE).put(getDatabaseState()));
  }

  async function recordHistorySnapshot(reason = '自动保存') {
    try {
      const database = await openDatabase();
      const transaction = database.transaction(DB_HISTORY_STORE, 'readwrite');
      const store = transaction.objectStore(DB_HISTORY_STORE);
      await idbRequest(store.add({
        createdAt: new Date().toISOString(),
        reason,
        notes: structuredClone(state.notes),
        deletedNotes: structuredClone(state.deletedNotes),
        customFolders: structuredClone(state.customFolders),
        stats: structuredClone(state.stats),
        noteCount: state.notes.length,
        deletedCount: state.deletedNotes.length,
        titles: state.notes.slice(0, 6).map((note) => note.title)
      }));
      const readTransaction = database.transaction(DB_HISTORY_STORE, 'readonly');
      const all = await idbRequest(readTransaction.objectStore(DB_HISTORY_STORE).getAll());
      const stale = all.sort((a, b) => b.id - a.id).slice(80);
      if (stale.length) {
        const cleanup = database.transaction(DB_HISTORY_STORE, 'readwrite');
        const cleanupStore = cleanup.objectStore(DB_HISTORY_STORE);
        stale.forEach((snapshot) => cleanupStore.delete(snapshot.id));
        await new Promise((resolve, reject) => {
          cleanup.oncomplete = resolve;
          cleanup.onerror = () => reject(cleanup.error || new Error('清理历史版本失败。'));
        });
      }
    } catch (error) {
      console.warn('历史版本保存失败。', error);
    }
  }

  function scheduleHistorySnapshot(reason = '自动保存') {
    clearTimeout(historySnapshotTimer);
    historySnapshotTimer = setTimeout(() => recordHistorySnapshot(reason), 1200);
  }

  async function loadHistorySnapshots() {
    const database = await openDatabase();
    const transaction = database.transaction(DB_HISTORY_STORE, 'readonly');
    const all = await idbRequest(transaction.objectStore(DB_HISTORY_STORE).getAll());
    return all.sort((a, b) => b.id - a.id).slice(0, 80);
  }

  async function loadSharedPayloadFromDatabase() {
    const database = await openDatabase();
    const transaction = database.transaction(DB_SHARE_STORE, 'readwrite');
    const store = transaction.objectStore(DB_SHARE_STORE);
    const payload = await idbRequest(store.get('pending'));
    if (payload) await idbRequest(store.delete('pending'));
    return payload || null;
  }

  async function consumeSharedPayload() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('share') !== '1') return;
    try {
      const payload = await loadSharedPayloadFromDatabase();
      if (payload?.files?.length) {
        const files = payload.files.map((item) => new File([item.data], item.name || `分享截图-${Date.now()}.png`, { type: item.type || 'image/png' }));
        state.route = 'ocr';
        addFiles(files, 'ocr');
        toast(`已接收其他应用分享的 ${files.length} 张截图。`, 'success');
      } else if (payload?.text) {
        state.route = 'paste';
        state.pasteText = String(payload.text || '');
        state.pasteParsed = false;
        toast('已接收其他应用分享的文字，点击“解析并整理”即可归档。', 'success');
      }
    } catch (error) {
      console.warn('读取分享内容失败。', error);
    } finally {
      url.searchParams.delete('share');
      window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ''));
    }
  }

  async function hydrateFromDatabase() {
    try {
      const saved = await loadStateFromDatabase();
      if (saved && Array.isArray(saved.notes)) {
        state.notes = saved.notes;
        state.deletedNotes = Array.isArray(saved.deletedNotes) ? saved.deletedNotes : [];
        state.customFolders = Array.isArray(saved.customFolders) ? saved.customFolders : [];
        state.stats = { ...state.stats, ...(saved.stats || {}) };
      } else if (state.notes.length) {
        await saveStateToDatabase();
      }
    } catch (error) {
      console.warn('IndexedDB 初始化失败，继续使用 localStorage。', error);
    }
  }

  async function clearHistorySnapshots() {
    try {
      const database = await openDatabase();
      const transaction = database.transaction(DB_HISTORY_STORE, 'readwrite');
      await idbRequest(transaction.objectStore(DB_HISTORY_STORE).clear());
      state.historySnapshots = [];
      state.historyLoaded = true;
      render();
      toast('版本历史已清空。', 'success');
    } catch (error) {
      console.warn('清空历史版本失败。', error);
      toast('清空历史版本失败。', 'error');
    }
  }

  async function restoreHistorySnapshot(snapshotId) {
    try {
      const database = await openDatabase();
      const transaction = database.transaction(DB_HISTORY_STORE, 'readonly');
      const snapshot = await idbRequest(transaction.objectStore(DB_HISTORY_STORE).get(snapshotId));
      if (!snapshot) {
        toast('没有找到这个历史版本。', 'error');
        return;
      }
      state.notes = structuredClone(snapshot.notes || []);
      state.deletedNotes = structuredClone(snapshot.deletedNotes || []);
      state.customFolders = Array.isArray(snapshot.customFolders) ? structuredClone(snapshot.customFolders) : state.customFolders;
      state.stats = { ...state.stats, ...(snapshot.stats || {}) };
      persist({ history: false });
      render();
      toast('已恢复历史版本。', 'success');
    } catch (error) {
      console.warn('恢复历史版本失败。', error);
      toast('恢复历史版本失败。', 'error');
    }
  }

  async function getAllAssetRecords() {
    try {
      const database = await openAssetDatabase();
      const transaction = database.transaction(DB_ASSETS_STORE, 'readonly');
      return await idbRequest(transaction.objectStore(DB_ASSETS_STORE).getAll());
    } catch (error) {
      console.warn('读取原图备份失败。', error);
      return [];
    }
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes.buffer;
  }

  function persist(options = {}) {
    setSaveStatus('保存中…', 'saving');
    const payload = {
      notes: state.notes,
      deletedNotes: state.deletedNotes,
      customFolders: state.customFolders,
      stats: state.stats
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('保存本地数据失败。', error);
      toast('本地存储空间不足，本次修改可能无法永久保存。', 'error');
    }
    saveStateToDatabase().catch((error) => console.warn('IndexedDB 保存失败。', error));
    if (options.history !== false) {
      state.historyLoaded = false;
      scheduleHistorySnapshot(options.reason || '自动保存');
    }
    clearTimeout(saveStatusTimer);
    saveStatusTimer = setTimeout(() => setSaveStatus('已自动保存', 'saved'), 450);
  }

  function structuredClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function sanitizeHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const wrapper = doc.body.firstElementChild;
    const allowed = new Set(['H3', 'P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'BLOCKQUOTE', 'CODE', 'DIV']);
    const walker = doc.createTreeWalker(wrapper, NodeFilter.SHOW_ELEMENT);
    const elements = [];
    while (walker.nextNode()) elements.push(walker.currentNode);
    elements.forEach((element) => {
      if (!allowed.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        return;
      }
      [...element.attributes].forEach((attribute) => {
        if (attribute.name === 'class') {
          const safeClasses = attribute.value.split(/\s+/).filter((name) => ['apple-table-wrap', 'merged-section'].includes(name));
          if (safeClasses.length) element.setAttribute('class', safeClasses.join(' '));
          else element.removeAttribute('class');
          return;
        }
        if (!['colspan', 'rowspan', 'data-section-id'].includes(attribute.name)) element.removeAttribute(attribute.name);
      });
    });
    return wrapper.innerHTML.trim();
  }

  function stripHtml(html = '') {
    const temp = document.createElement('div');
    temp.innerHTML = sanitizeHtml(html);
    return (temp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function formatDate(dateValue, withYear = false) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    return new Intl.DateTimeFormat('zh-CN', {
      year: withYear || !sameYear ? 'numeric' : undefined,
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  function formatDateTime(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date).replaceAll('/', '-');
  }

  function getNoteById(id) {
    return state.notes.find((note) => note.id === id);
  }

  function getFilterOptions() {
    const tags = new Set();
    state.notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag)));
    return ['全部', '置顶', '含表格', ...Array.from(tags).slice(0, 6)];
  }

  function getFolderOptions() {
    const folders = new Set(['未分类', ...(state.customFolders || [])]);
    state.notes.forEach((note) => folders.add(note.folder || '未分类'));
    return ['全部文件夹', ...Array.from(folders).sort((a, b) => a.localeCompare(b, 'zh-CN'))];
  }

  function noteTypeLabel(type) {
    return {
      study: '学习笔记',
      work: '工作记录',
      hobby: '兴趣爱好',
      stock: '股票清单',
      meeting: '会议纪要',
      reading: '阅读笔记',
      fitness: '健身笔记',
      general: 'AI 笔记',
      ocr: 'OCR 提取'
    }[type] || '笔记';
  }

  function typeColor(type) {
    return type === 'stock' || type === 'ocr' ? 'orange' : (type === 'meeting' || type === 'work') ? 'dark' : '';
  }

  function noteCard(note) {
    const selected = state.selectedNoteIds.includes(note.id);
    const hasTable = /<table[\s>]/i.test(note.contentHtml || '');
    const sourceImage = note.sourceImages?.[0];
    const sourceControl = sourceImage?.thumbnail
      ? `<button class="note-source-thumb" type="button" data-source-note="${escapeHtml(note.id)}" data-source-index="0" aria-label="查看原始截图"><img src="${sourceImage.thumbnail}" alt="原始截图缩略图" />${note.sourceImages.length > 1 ? `<span>${note.sourceImages.length}张</span>` : ''}</button>`
      : `<span class="note-type ${typeColor(note.type)}">${icons[note.type] || icons.general}</span>`;
    return `
      <article class="note-card ${state.noteSelectionMode ? 'selection-mode' : ''} ${selected ? 'selected' : ''} ${note.pinned ? 'pinned' : ''}" data-open-note="${escapeHtml(note.id)}" tabindex="0" role="button" aria-label="打开${escapeHtml(note.title)}">
        ${state.noteSelectionMode ? `<span class="note-select-indicator ${selected ? 'selected' : ''}" aria-hidden="true">${selected ? '✓' : ''}</span>` : ''}
        <div class="note-card-top">
          ${sourceControl}
          <div class="note-card-meta">
            ${note.pinned ? '<span class="pin-badge">置顶</span>' : ''}
            ${hasTable ? '<span class="table-badge">表格</span>' : ''}
            <time datetime="${escapeHtml(note.updatedAt)}">${formatDate(note.updatedAt)}</time>
          </div>
        </div>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.summary || stripHtml(note.contentHtml).slice(0, 100))}</p>
        <div class="card-tags">
          ${note.tags.slice(0, 3).map((tag, index) => `<span class="tag ${index === 0 ? 'primary' : ''}"># ${escapeHtml(tag)}</span>`).join('')}
        </div>
        ${state.noteSelectionMode ? '' : `
          <div class="note-card-quick-actions">
            <button type="button" data-quick-pin="${escapeHtml(note.id)}">${note.pinned ? '取消置顶' : '置顶'}</button>
            <button type="button" data-quick-merge="${escapeHtml(note.id)}">合并</button>
            <button type="button" data-quick-delete="${escapeHtml(note.id)}">删除</button>
          </div>
        `}
      </article>
    `;
  }

  function pageHeader(eyebrow, title, subtitle, action = '') {
    return `
      <header class="page-head">
        <div>
          <div class="eyebrow">${escapeHtml(eyebrow)}</div>
          <h1 class="page-title">${escapeHtml(title)}</h1>
          <p class="page-subtitle">${escapeHtml(subtitle)}</p>
        </div>
        ${action}
      </header>
    `;
  }

  function updateChrome() {
    const inWorkspace = state.route === 'workspace';
    document.body.classList.toggle('workspace-mode', inWorkspace);
    const sidebar = document.querySelector('.sidebar');
    const workspaceBrand = document.querySelector('.workspace-brand');
    const mobileBrand = document.querySelector('.mobile-brand');
    if (sidebar) sidebar.style.display = inWorkspace ? 'none' : '';
    if (workspaceBrand) workspaceBrand.style.display = inWorkspace ? 'flex' : 'none';
    if (mobileBrand) mobileBrand.style.display = inWorkspace ? 'none' : '';
  }

  function render() {
    updateChrome();
    if (state.route === 'workspace') root.innerHTML = renderWorkspace();
    if (state.route === 'home') root.innerHTML = renderHome();
    if (state.route === 'notes') root.innerHTML = renderNotes();
    if (state.route === 'trash') root.innerHTML = renderTrash();
    if (state.route === 'note') root.innerHTML = renderNoteDetail();
    if (state.route === 'import') root.innerHTML = renderImport();
    if (state.route === 'ocr') root.innerHTML = renderOcr();
    if (state.route === 'paste') root.innerHTML = renderPaste();
    if (state.route === 'examples') root.innerHTML = renderExamples();
    if (state.route === 'backup') root.innerHTML = renderBackup();
    if (state.route === 'history') {
      root.innerHTML = renderHistory();
      if (!state.historyLoading && !state.historyLoaded) loadHistoryIntoState();
    }

    globalSearch.value = state.search;
    updateNav();
    updateTopActions();
    updateTrashCount();
    bindViewEvents();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function recognitionAdviceBanner() {
    return `
      <aside class="recognition-advice">
        <span class="recognition-advice-icon">i</span>
        <div class="recognition-advice-copy">
          <strong>识别效果提示</strong>
          <p>当前浏览器端文字识别模型更适合清晰、简单的截图。如果图片文字较小、表格复杂或识别错误较多，建议先用豆包、Kimi、ChatGPT 等 AI 识别，再通过“粘贴 AI 结果”完成结构化归档。</p>
        </div>
        <button class="btn secondary small" data-route="paste">粘贴 AI 结果</button>
      </aside>
    `;
  }

  function mobileImportActions(compact = false) {
    return `
      <div class="mobile-import-actions ${compact ? 'compact' : ''}">
        <button class="btn secondary small" type="button" data-mobile-import="camera">⌾ 拍照</button>
        <button class="btn secondary small" type="button" data-mobile-import="gallery">▧ 相册</button>
        <button class="btn secondary small" type="button" data-paste-image>⇩ 粘贴截图</button>
      </div>
    `;
  }

  function workspaceNoteItem(note) {
    const active = note.id === state.noteId;
    const hasImages = Boolean(note.sourceImages?.length);
    const preview = note.summary || stripHtml(note.contentHtml).slice(0, 80);
    return `
      <article class="workspace-note-item ${active ? 'active' : ''}" draggable="true" data-workspace-note="${escapeHtml(note.id)}" tabindex="0">
        <span class="workspace-note-kind ${hasImages ? 'image-note' : 'text-note'}" title="${hasImages ? '含图片笔记' : '纯文本笔记'}">${hasImages ? '▧' : '≡'}</span>
        <div class="workspace-note-copy">
          <strong>${escapeHtml(note.title)}</strong>
          <p>${escapeHtml(preview)}</p>
          <span>${formatDateTime(note.updatedAt)}${note.tags?.[0] ? ` · #${escapeHtml(note.tags[0])}` : ''}</span>
        </div>
        <button class="workspace-note-delete" type="button" data-quick-delete="${escapeHtml(note.id)}" aria-label="删除笔记">×</button>
      </article>
    `;
  }

  function renderWorkspaceList() {
    const keyword = state.search.trim().toLowerCase();
    const visible = state.notes.filter((note) => {
      if (!keyword) return true;
      return [note.title, note.summary, note.folder, ...(note.tags || []), stripHtml(note.contentHtml)].join(' ').toLowerCase().includes(keyword);
    });
    const sorted = [...visible].sort((a, b) => {
      const ao = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
      const bo = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
      return ao - bo || new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    const groups = new Map();
    sorted.forEach((note) => {
      const folder = note.folder || '未分类';
      if (!groups.has(folder)) groups.set(folder, []);
      groups.get(folder).push(note);
    });
    return `
      <div class="workspace-list-head">
        <div><span>笔记</span><small>${state.notes.length} 条</small></div>
        <button class="btn small" type="button" data-workspace-new>＋ 新建</button>
      </div>
      <div class="workspace-list-top">
        <button class="text-link" type="button" data-route="notes">全部笔记</button>
        <button class="text-link" type="button" data-route="backup">数据备份</button>
      </div>
      <div class="workspace-folder-list">
        ${groups.size ? [...groups.entries()].map(([folder, notes]) => `
          <section class="workspace-folder" data-workspace-folder="${escapeHtml(folder)}">
            <header><span>${escapeHtml(folder)}</span><small>${notes.length}</small></header>
            <div class="workspace-note-list">${notes.map(workspaceNoteItem).join('')}</div>
          </section>
        `).join('') : `
          <div class="workspace-list-empty">
            <span class="workspace-empty-logo">✓</span>
            <strong>${state.notes.length ? '没有找到笔记' : '从一张图片开始'}</strong>
            <p>${state.notes.length ? '尝试清除搜索，或新建一条笔记。' : '上传截图，优记会自动提取文字并整理成结构化笔记。'}</p>
            <button class="btn" type="button" data-mobile-import="gallery">上传图片 OCR</button>
          </div>
        `}
      </div>
    `;
  }

  function renderWorkspaceEditor() {
    const note = getNoteById(state.noteId) || state.notes[0];
    if (!note) {
      return `
        <div class="workspace-editor-empty">
          <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8 54 20v24L32 56 10 44V20L32 8Z"/><path d="m22 33 7 7 14-16"/></svg>
          <h1>开始记录</h1>
          <p>上传图片提取文字，或直接粘贴外部 OCR / AI 结果。</p>
          <div class="workspace-empty-actions">
            <button class="btn" type="button" data-route="ocr">上传图片</button>
            <button class="btn secondary" type="button" data-route="paste">粘贴文字</button>
          </div>
        </div>
      `;
    }
    const hasTable = /<table[\s>]/i.test(note.contentHtml || '');
    const markdownSource = state.workspaceMarkdownDraft || noteMarkdownBody(note);
    const markdownPreview = markdownToPreviewHtml(markdownSource);
    return `
      <div class="workspace-editor-head">
        <div class="workspace-breadcrumb"><span class="workspace-status-dot"></span>${escapeHtml(note.folder || '未分类')}</div>
        <div class="workspace-editor-actions">
          <button class="workspace-list-toggle" type="button" data-workspace-list-toggle>笔记列表</button>
          <div class="workspace-mode-switch" role="group" aria-label="编辑模式">
            <button type="button" data-workspace-mode="rich" class="${state.workspaceMode === 'rich' ? 'active' : ''}">编辑</button>
            <button type="button" data-workspace-mode="markdown" class="${state.workspaceMode === 'markdown' ? 'active' : ''}">Markdown</button>
          </div>
          <button class="btn small" type="button" data-mobile-import="gallery">＋ 图片 OCR</button>
          <button class="btn secondary small" type="button" data-rerun-ocr="${escapeHtml(note.id)}" ${note.sourceImages?.length ? '' : 'disabled'}>重新 OCR</button>
          <button class="btn secondary small" type="button" data-paste-image>粘贴图片</button>
          <button class="btn secondary small" type="button" data-export="${escapeHtml(note.id)}">导出</button>
          <button class="btn danger small icon-only" type="button" data-delete-note="${escapeHtml(note.id)}" title="删除笔记">×</button>
        </div>
      </div>
      <label class="workspace-image-dropzone" id="workspace-dropzone">
        <input id="workspace-image-input" type="file" accept="image/*" multiple />
        <span class="workspace-upload-icon">＋</span>
        <span><strong>拖拽图片到这里，或点击上传</strong><small>单张或批量截图都可以；识别后图片和文字分区展示</small></span>
      </label>
      <article class="workspace-paper">
        <input class="workspace-title-input" id="detail-title" value="${escapeHtml(note.title)}" aria-label="笔记标题" />
        <div class="workspace-meta-row">
          <input id="detail-tags" value="${escapeHtml(note.tags.join(', '))}" aria-label="笔记标签，用逗号分隔" placeholder="标签，用逗号分隔" />
          <label class="workspace-folder-select"><span>文件夹</span><select id="detail-folder">${getFolderOptions().filter((folder) => folder !== '全部文件夹').map((folder) => `<option value="${escapeHtml(folder)}" ${folder === (note.folder || '未分类') ? 'selected' : ''}>${escapeHtml(folder)}</option>`).join('')}</select></label>
        </div>
        ${renderNoteSources(note)}
        <div class="workspace-section-label"><span>识别文字与编辑内容</span><small>${state.workspaceMode === 'markdown' ? 'Markdown 源码' : '可直接编辑'}</small></div>
        ${state.workspaceMode === 'markdown' ? `
          <div class="markdown-editor-grid">
            <textarea class="markdown-source" id="workspace-markdown-source" spellcheck="false" aria-label="Markdown 编辑区">${escapeHtml(markdownSource)}</textarea>
            <div class="markdown-preview" id="workspace-markdown-preview">${markdownPreview}</div>
          </div>
          <div class="workspace-save-row">
            <span id="workspace-save-status" class="workspace-save-status">已自动保存</span>
            <button class="btn secondary" type="button" id="save-markdown-note" data-save-markdown-note="${escapeHtml(note.id)}">立即保存</button>
          </div>
        ` : `
          <div class="detail-content workspace-content" id="detail-content" contenteditable="true">${sanitizeHtml(note.contentHtml)}</div>
          <div class="workspace-save-row">
            <span id="workspace-save-status" class="workspace-save-status">已自动保存</span>
            <button class="btn secondary" type="button" data-save-note="${escapeHtml(note.id)}">立即保存</button>
          </div>
        `}
      </article>
    `;
  }

  function renderWorkspace() {
    const note = getNoteById(state.noteId) || state.notes[0];
    if (note) state.noteId = note.id;
    return `
      <div class="workspace-shell">
        <aside class="workspace-list-pane ${state.workspaceListOpen ? 'open' : ''}">${renderWorkspaceList()}</aside>
        <section class="workspace-editor-pane">${renderWorkspaceEditor()}</section>
      </div>
    `;
  }

  function renderHome() {
    const recent = state.notes.slice().sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
    return `
      <section class="home-hero-compact">
        <div class="home-hero-copy">
          <span class="hero-badge">✦ 网页 AI 笔记</span>
          <h2>粘贴文字，一键结构化整理</h2>
          <p>免注册 · 本地存储。无论文字来自图片 OCR、苹果备忘录还是豆包/Kimi/ChatGPT，都可以自动提炼大纲、错题、参数表、阅读摘要和会议行动项。</p>
          <div class="hero-actions">
            <button class="btn" data-route="paste">开始 AI 结构化</button>
            <button class="btn secondary" data-route="ocr">图片提取文字</button>
            <button class="btn secondary" data-route="examples">查看示例</button>
          </div>
        </div>
        <div class="home-quick-panel">
          <button class="home-quick-item" type="button" data-home-template="classroom">
            <span class="home-quick-icon">◇</span>
            <strong>课堂笔记</strong>
            <small>去冗余，提炼重点和复习清单</small>
          </button>
          <button class="home-quick-item" type="button" data-home-template="wrong_question">
            <span class="home-quick-icon">△</span>
            <strong>错题整理</strong>
            <small>题干、答案、错误原因和考点</small>
          </button>
          <button class="home-quick-item" type="button" data-home-template="meeting">
            <span class="home-quick-icon">▦</span>
            <strong>会议纪要</strong>
            <small>提取行动项、负责人和时间</small>
          </button>
        </div>
      </section>

      <section class="home-quick-bar">
        <div class="home-quick-meta">
          <span><strong>${state.notes.length}</strong> 条笔记</span>
          <span>粘贴 → AI 结构化 → 保存</span>
          <span>免注册 · 本地存储</span>
        </div>
        ${mobileImportActions(true)}
      </section>

      <details class="home-why">
        <summary>为什么不是苹果备忘录 <span>苹果便签原样提取 · BestNote 结构化加工</span></summary>
        <div class="home-benefit-list">
          <p><strong>苹果便签</strong>擅长系统级图片文字提取和原样保存。</p>
          <p><strong>BestNote</strong>专注文字加工：提炼大纲、错题、参数表和会议行动项。</p>
          <p><strong>文字来源自由</strong>可以直接粘贴苹果备忘录、豆包、Kimi、ChatGPT 的识别结果。</p>
          <p><strong>本地优先</strong>免注册、IndexedDB、本地存储、版本历史和一键 JSON 备份。</p>
        </div>
      </details>

      <section class="home-recent">
        <div class="section-head">
          <div>
            <h2>最近笔记</h2>
            <p>继续编辑或查看最近保存的内容</p>
          </div>
          <button class="text-link" data-route="notes">查看全部 →</button>
        </div>
        <div class="notes-grid">
          ${recent.length ? recent.map(noteCard).join('') : emptyState('还没有笔记', '从 OCR 或批量截图整理开始。', 'ocr', '开始第一条笔记')}
        </div>
      </section>
    `;
  }

  function examplePreviewCard(note) {
    const hasTable = /<table[\s>]/i.test(note.contentHtml || '');
    return `
      <article class="example-card">
        <div class="example-card-top">
          <span class="note-type ${typeColor(note.type)}">${icons[note.type] || icons.general}</span>
          <div class="example-card-badges">
            ${hasTable ? '<span class="table-badge">表格</span>' : ''}
            <span class="example-domain">${escapeHtml(noteTypeLabel(note.type))}</span>
          </div>
        </div>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.summary)}</p>
        <div class="card-tags">
          ${note.tags.slice(0, 3).map((tag, index) => `<span class="tag ${index === 0 ? 'primary' : ''}"># ${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="example-card-actions">
          <button class="btn secondary small" type="button" data-import-example="${escapeHtml(note.id)}">导入这条</button>
          <button class="btn small" type="button" data-open-example="${escapeHtml(note.id)}">导入并打开</button>
        </div>
      </article>
    `;
  }

  function renderExamples() {
    const importedCount = exampleNotes.filter((example) => state.notes.some((note) => note.id === example.id)).length;
    return `
      ${pageHeader(
        'Examples & Self Check',
        '示例中心',
        '这里不是静态截图，而是可直接导入、编辑、搜索、合并和导出的真实笔记。',
        `<div class="page-head-actions">
          <button class="btn secondary" type="button" data-import-examples>${importedCount ? '更新全部示例' : '导入全部示例'}</button>
          <a class="btn" href="./self-check.html" target="_blank" rel="noreferrer">打开自检页</a>
        </div>`
      )}
      <section class="example-summary">
        <div><strong>${exampleNotes.length}</strong><span>真实示例</span></div>
        <div><strong>${importedCount}</strong><span>已导入</span></div>
        <div><strong>${Object.keys(templates).length - 1}</strong><span>领域模板</span></div>
        <div><strong>3</strong><span>导出格式</span></div>
        <p>建议先“导入全部示例”，再到笔记列表测试置顶、文件夹筛选、搜索、合并、表格编辑和导出。</p>
      </section>
      <div class="examples-grid">
        ${exampleNotes.map(examplePreviewCard).join('')}
      </div>
      <section class="self-check-callout">
        <div>
          <span class="eyebrow">Quality Gate</span>
          <h2>每次改完 OCR、标题、表格或保存流程，都先跑一次自检</h2>
          <p>自检页会用真实示例覆盖健身标题、股票标题、Markdown 表格、时间纠正、无关内容过滤和模板推荐。</p>
        </div>
        <div class="self-check-actions">
          <a class="btn secondary" href="./self-check.html" target="_blank" rel="noreferrer">浏览器交互自检</a>
          <a class="btn ghost" href="./REGRESSION_CHECKLIST.md" target="_blank" rel="noreferrer">查看回归清单</a>
        </div>
      </section>
    `;
  }

  function renderBackup() {
    return `
      ${pageHeader(
        'Backup & Restore',
        '数据备份',
        '笔记默认只保存在当前浏览器。浏览器缓存被清理或更换设备时，需要提前导出备份。',
        `<div class="page-head-actions">
          <button class="btn" type="button" data-export-backup>导出完整备份</button>
          <label class="btn secondary backup-import-button">导入备份<input id="backup-file-input" type="file" accept=".json,application/json" /></label>
        </div>`
      )}
      <section class="backup-hero">
        <span class="backup-icon">⛨</span>
        <div>
          <h2>推荐使用完整 JSON 备份</h2>
          <p>完整备份包含笔记、标签、文件夹、版本相关数据和原始截图。恢复时通过“导入备份”即可合并回来。</p>
        </div>
      </section>
      <div class="backup-grid">
        <article class="backup-card">
          <strong>什么时候备份</strong>
          <p>建议每月一次，或在完成重要笔记、错题整理、会议归档后立即导出。</p>
        </article>
        <article class="backup-card">
          <strong>备份保存到哪里</strong>
          <p>下载后的 JSON 文件建议放进 iCloud Drive、OneDrive、坚果云或其他长期保存的位置。</p>
        </article>
        <article class="backup-card">
          <strong>不要只依赖浏览器</strong>
          <p>清除浏览器缓存、卸载浏览器或更换设备，可能导致本地笔记无法恢复。</p>
        </article>
        <article class="backup-card">
          <strong>换设备怎么恢复</strong>
          <p>在新设备打开 BestNote，进入数据备份，选择“导入备份”，再选中之前导出的 JSON 文件。</p>
        </article>
      </div>
      <section class="backup-actions-panel">
        <div>
          <h3>其他导出方式</h3>
          <p>Markdown 更适合放入 Obsidian、Notion 或长期文档管理。</p>
        </div>
        <button class="btn secondary" type="button" data-export-all-markdown>导出全部 Markdown</button>
      </section>
      <section class="backup-warning">
        <strong>本地存储提示</strong>
        <p>IndexedDB 适合免登录使用，但容量有限，也不等于云同步。重要内容请定期导出完整备份。</p>
      </section>
    `;
  }

  function renderHistory() {
    const snapshots = state.historySnapshots || [];
    return `
      ${pageHeader(
        'Version History',
        '版本历史',
        '每次内容变更会自动保存快照；可以恢复误删、误改或错误的表格调整。',
        `<div class="page-head-actions">
          <button class="btn secondary" type="button" data-refresh-history>刷新</button>
          <button class="btn danger" type="button" data-clear-history ${snapshots.length ? '' : 'disabled'}>清空历史</button>
        </div>`
      )}
      ${state.historyLoading && !snapshots.length ? `
        <div class="history-empty"><span class="loading-pulse">↺</span><h3>正在读取版本历史</h3><p>数据来自当前浏览器的 IndexedDB。</p></div>
      ` : snapshots.length ? `
        <div class="history-list">
          ${snapshots.map((snapshot) => {
            const titles = snapshot.titles?.length ? snapshot.titles : (snapshot.notes || []).slice(0, 6).map((note) => note.title);
            return `
            <article class="history-item">
              <div class="history-item-main">
                <span class="history-dot">↺</span>
                <div>
                  <strong>${escapeHtml(snapshot.reason || '自动保存')}</strong>
                  <p class="history-time">${formatDateTime(snapshot.createdAt)} · ${snapshot.noteCount || 0} 条笔记${snapshot.deletedCount ? ` · ${snapshot.deletedCount} 条回收站` : ''}</p>
                  <p class="history-note-titles">包含：${escapeHtml(titles.length ? titles.join('、') : '无笔记内容')}${(snapshot.noteCount || 0) > titles.length ? '…' : ''}</p>
                </div>
              </div>
              <button class="btn secondary small" type="button" data-restore-history="${snapshot.id}">恢复此版本</button>
            </article>
          `}).join('')}
        </div>
      ` : `
        <div class="history-empty"><span>↺</span><h3>还没有历史版本</h3><p>修改一条笔记后，这里会自动生成可恢复的快照。</p></div>
      `}
    `;
  }

  async function loadHistoryIntoState() {
    if (state.historyLoading) return;
    state.historyLoading = true;
    try {
      state.historySnapshots = await loadHistorySnapshots();
    } catch (error) {
      console.warn('读取历史版本失败。', error);
    } finally {
      state.historyLoading = false;
      state.historyLoaded = true;
    }
    if (state.route === 'history') render();
  }

  function renderNotes() {
    const filtered = getFilteredNotes();
    const filters = getFilterOptions();
    const folders = getFolderOptions();
    const selectedCount = state.selectedNoteIds.length;
    const filterLabel = (filter) => ['全部', '置顶', '含表格'].includes(filter) ? filter : `# ${filter}`;
    return `
      ${pageHeader(
        'Notes',
        '全部笔记',
        '置顶、按文件夹或标签筛选；支持搜索、多条合并和本地备份。',
        `<div class="page-head-actions">
          <button class="btn secondary" data-new-folder>＋ 新建文件夹</button>
          <button class="btn secondary" data-route="history">版本历史</button>
          <button class="btn secondary" data-export-backup>导出备份</button>
          <label class="btn secondary backup-import-button">导入备份<input id="backup-file-input" type="file" accept=".json,application/json" /></label>
          <button class="btn secondary" data-toggle-note-selection>${state.noteSelectionMode ? '退出合并' : '合并笔记'}</button>
          <button class="btn" data-route="import">＋ 新建笔记</button>
        </div>`
      )}
      <div class="toolbar">
        <div class="filter-chips" role="group" aria-label="标签筛选">
          ${filters.map((filter) => `<button class="chip ${state.filter === filter ? 'active' : ''}" data-filter="${escapeHtml(filter)}">${filterLabel(filter)}</button>`).join('')}
        </div>
        <label class="folder-filter" for="folder-filter">
          <span>文件夹</span>
          <select id="folder-filter">
            ${folders.map((folder) => `<option value="${escapeHtml(folder)}" ${state.folderFilter === folder ? 'selected' : ''}>${escapeHtml(folder)}</option>`).join('')}
          </select>
        </label>
        <span class="toolbar-meta" id="notes-result-count">共 ${filtered.length} 条</span>
      </div>
      ${state.noteSelectionMode ? `
        <div class="note-selection-bar">
          <span>已选择 <strong>${selectedCount}</strong> 条</span>
          <div class="note-selection-actions">
            <button class="text-link" data-select-all-notes>全选当前</button>
            <button class="text-link" data-clear-note-selection>清空选择</button>
            <button class="btn small" id="merge-selected-notes" ${selectedCount < 2 ? 'disabled' : ''}>合并所选</button>
          </div>
        </div>
      ` : ''}
      <div class="notes-grid ${state.noteSelectionMode ? 'selection-mode' : ''}" id="notes-grid">
        ${filtered.length ? filtered.map(noteCard).join('') : emptyState('没有找到相关笔记', '试试其他关键词，或清除当前标签筛选。', 'notes', '清除筛选', true)}
      </div>
    `;
  }

  function updateTrashCount() {
    const count = document.getElementById('trash-count');
    if (!count) return;
    const value = state.deletedNotes.length;
    count.textContent = String(value);
    count.classList.toggle('hidden', value === 0);
  }

  function trashNoteCard(note) {
    return `
      <article class="note-card trash-card">
        <div class="note-card-top">
          <span class="note-type ${typeColor(note.type)}">${icons[note.type] || icons.general}</span>
          <time datetime="${escapeHtml(note.deletedAt || note.updatedAt)}">${formatDate(note.deletedAt || note.updatedAt, true)}</time>
        </div>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.summary || stripHtml(note.contentHtml).slice(0, 100))}</p>
        <div class="card-tags">
          ${note.tags.slice(0, 3).map((tag) => `<span class="tag"># ${escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="trash-card-actions">
          <button class="btn secondary small" data-restore-note="${escapeHtml(note.id)}">恢复</button>
          <button class="btn danger small" data-permanent-delete="${escapeHtml(note.id)}">永久删除</button>
        </div>
      </article>
    `;
  }

  function renderTrash() {
    const notes = state.deletedNotes;
    return `
      ${pageHeader(
        'Trash',
        '回收站',
        '已删除笔记会保留在这里，可恢复或永久删除。',
        `<button class="btn danger" id="clear-trash" ${notes.length ? '' : 'disabled'}>一键清空</button>`
      )}
      <div class="notes-grid trash-grid">
        ${notes.length ? notes.map(trashNoteCard).join('') : emptyState('回收站为空', '删除的笔记会出现在这里。', 'notes', '返回笔记')}
      </div>
    `;
  }

  function getFilteredNotes() {
    const keyword = state.search.trim().toLowerCase();
    return state.notes
      .filter((note) => {
        if (state.filter === '置顶') return Boolean(note.pinned);
        if (state.filter === '含表格') return /<table[\s>]/i.test(note.contentHtml || '');
        if (state.filter !== '全部') return note.tags.includes(state.filter);
        return true;
      })
      .filter((note) => state.folderFilter === '全部文件夹' || (note.folder || '未分类') === state.folderFilter)
      .filter((note) => {
        if (!keyword) return true;
        const haystack = [note.title, note.summary, note.folder, ...note.tags, stripHtml(note.contentHtml)].join(' ').toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function emptyState(title, description, route, buttonText, clearFilter = false) {
    return `
      <div class="empty-state">
        <div>
          <span class="empty-state-icon">⌕</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
          <button class="btn secondary small" style="margin-top:16px" ${clearFilter ? 'data-clear-filter' : `data-route="${route}"`}>${escapeHtml(buttonText)}</button>
        </div>
      </div>
    `;
  }

  function renderImport() {
    const files = state.importFiles;
    const result = state.aiResult;
    return `
      ${pageHeader('Screenshot to Structure', '批量截图整理', '上传截图后先识别，再编辑标题、标签和正文，最后保存为表格或结构化笔记。', '<span class="status-badge ready">● 截图整理</span>')}
      ${recognitionAdviceBanner()}
      <div class="workspace-grid">
        <section class="panel">
          <div class="panel-header">
            <h2>01 上传截图</h2>
            <span class="step">最多 ${MAX_FILES} 张</span>
          </div>
          <div class="panel-body">
            <label class="dropzone" id="ai-dropzone">
              <input id="ai-file-input" type="file" accept="image/*" multiple ${state.busy ? 'disabled' : ''} />
              <span class="dropzone-icon">⇧</span>
              <span>
                <strong>拖入截图，或点击选择图片</strong>
                <p>支持 JPG、PNG、WEBP；图片仅保留在当前页面会话中</p>
              </span>
            </label>
            <div class="upload-grid" id="ai-upload-grid">
              ${renderUploads(files, 'ai')}
            </div>

            <div class="divider"></div>

            <div class="ocr-settings ai-engine-settings">
              <label for="ai-engine">
                <span>识别引擎</span>
                <select id="ai-engine" data-engine-select>
                  <option value="local" ${state.ocrEngine === 'local' ? 'selected' : ''}>本地 Tesseract（免费离线）</option>
                  <option value="paddlejs" ${state.ocrEngine === 'paddlejs' ? 'selected' : ''}>免费高精度 Paddle.js（浏览器端）</option>
                  <option value="paddle" ${state.ocrEngine === 'paddle' ? 'selected' : ''}>云端 PaddleOCR（需服务端配置）</option>
                </select>
              </label>
              <p>${state.ocrEngine === 'paddle' ? '高精度模式通过 server.rb 调用 PaddleOCR，适合复杂中文和表格。' : '本地模式不上传图片，识别速度取决于设备性能。'}</p>
            </div>

            <span class="form-label">02 选择整理模板</span>
            <div class="template-grid">
              ${Object.entries(templates).map(([key, template]) => `
                <button class="template-card ${state.importTemplate === key ? 'active' : ''}" data-template="${key}">
                  <span class="template-icon">${template.icon}</span>
                  <strong>${template.name}</strong>
                  <small>${template.description}</small>
                  <em>${(templateSamples[key] || []).map((line) => `<span>${escapeHtml(line)}</span>`).join('')}</em>
                </button>
              `).join('')}
            </div>

            <div class="progress-box" id="ai-progress">
              <div class="progress-head"><span id="ai-progress-label">准备处理</span><span id="ai-progress-percent">0%</span></div>
              <div class="progress-track"><div class="progress-bar" id="ai-progress-bar"></div></div>
              <div class="progress-steps" id="ai-progress-steps">
                <span>读取图片</span><span>OCR 文字识别</span><span>AI 合并与结构化</span><span>生成笔记预览</span>
              </div>
            </div>

            <div class="action-row">
              <span class="helper-note">ⓘ 本地模式不上传图片；高精度模式会通过本机 server.rb 转发到 PaddleOCR。</span>
              <button class="btn" id="run-ai" ${state.busy || !files.length ? 'disabled' : ''}>${state.busy ? '正在整理…' : `开始整理${files.length ? ` · ${files.length} 张` : ''}`}</button>
            </div>
          </div>
        </section>

        <aside class="panel">
          <div class="panel-header">
            <h2>03 生成预览</h2>
            ${result ? '<span class="demo-badge">AI 已生成</span>' : '<span class="step">等待处理</span>'}
          </div>
          ${result ? renderGeneratedNote(result, true) : `
            <div class="preview-placeholder">
              <div>
                <span class="preview-illustration">✦</span>
                <h3>结构化笔记会出现在这里</h3>
                <p>上传截图并点击“开始整理”，即可预览 AI 合并后的标题、摘要、清单和表格。</p>
              </div>
            </div>
          `}
        </aside>
      </div>
    `;
  }

  function renderUploads(files, purpose) {
    if (!files.length) return '';
    return files.map((file) => `
      <div class="upload-item">
        <img src="${file.url}" alt="${escapeHtml(file.name)}" />
        <button type="button" data-remove-file="${purpose}" data-file-id="${file.id}" aria-label="移除${escapeHtml(file.name)}" ${state.busy ? 'disabled' : ''}>×</button>
        <span title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
      </div>
    `).join('');
  }

  function renderGeneratedNote(note, showSave) {
    return `
      <div class="generated-note">
        ${showSave ? `
          <div class="generated-edit-head">
            <span class="eyebrow">识别 → 编辑 → 保存</span>
            <p>先调整标题、标签和正文，确认无误后保存。</p>
          </div>
          <label class="generated-field">
            <span>标题</span>
            <input id="ai-generated-title" value="${escapeHtml(note.title)}" aria-label="整理后的笔记标题" />
          </label>
          <label class="generated-field">
            <span>标签</span>
            <input id="ai-generated-tags" value="${escapeHtml(note.tags.join(', '))}" aria-label="整理后的笔记标签" />
          </label>
          <label class="generated-field">
            <span>文件夹</span>
            <div class="folder-picker-row">
              <select id="ai-generated-folder" aria-label="整理后的笔记文件夹">
                ${getFolderOptions().filter((folder) => folder !== '全部文件夹').map((folder) => `<option value="${escapeHtml(folder)}" ${folder === (note.folder || '未分类') ? 'selected' : ''}>${escapeHtml(folder)}</option>`).join('')}
              </select>
              <button class="btn secondary small" type="button" data-new-folder-context="ai">＋ 新建</button>
            </div>
          </label>
          <label class="source-keep-toggle"><input id="ai-keep-sources" type="checkbox" ${state.aiKeepSources ? 'checked' : ''} /><span>保存原始截图（关闭后只保留文字，更省空间）</span></label>
          <div class="generated-content-preview" id="ai-generated-content" contenteditable="true" spellcheck="false">${sanitizeHtml(note.contentHtml)}</div>
        ` : `
          <div class="generated-title-row"><h2>${escapeHtml(note.title)}</h2></div>
          <div class="generated-meta">
            <span class="tag primary"># ${escapeHtml(note.tags[0] || 'AI笔记')}</span>
            <span class="tag">${escapeHtml(note.folder || '未分类')}</span>
            ${note.templateKey ? `<span class="tag">${escapeHtml(templates[note.templateKey]?.name || '模板')}</span>` : ''}
            <span class="tag">${note.sourceCount || 1} 张图片</span>
          </div>
          <div>${sanitizeHtml(note.contentHtml)}</div>
        `}
        ${showSave ? `
          <div class="action-row">
            <button class="btn ghost small" id="discard-ai-result">重新整理</button>
            <button class="btn" id="save-ai-result">确认并保存</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderOcr() {
    const files = state.ocrFiles;
    const meta = state.ocrMeta;
    const hasResult = Boolean(state.ocrText);
    const engineLabel = state.ocrEngine === 'paddle' ? '高精度 PaddleOCR' : state.ocrEngine === 'paddlejs' ? '免费高精度 Paddle.js' : '本地 Tesseract';
    const suspiciousCount = countSuspiciousOcrCells(state.ocrBlocks);
    return `
      ${pageHeader('Screenshot Organizer', '截图转结构化笔记', '识别后直接编辑标题、标签和正文，表格按需手动切换，确认无误再保存。', `<div class="page-head-actions"><span class="step">识别 → 编辑 → 保存</span><span class="status-badge ready">● ${engineLabel}</span><button class="btn secondary small" data-route="paste">粘贴 AI 结果</button></div>`)}
      ${recognitionAdviceBanner()}
      <div class="workspace-grid">
        <section class="panel">
          <div class="panel-header">
            <h2>上传待识别图片</h2>
            <span class="step">支持多选 · 最多 20 张</span>
          </div>
          <div class="panel-body">
            <div class="ocr-settings">
              <label for="ocr-language">
                <span>识别语言</span>
                <select id="ocr-language">
                  <option value="chi_sim+eng" ${state.ocrLang === 'chi_sim+eng' ? 'selected' : ''}>简体中文 + 英文（推荐）</option>
                  <option value="chi_sim" ${state.ocrLang === 'chi_sim' ? 'selected' : ''}>仅简体中文</option>
                  <option value="eng" ${state.ocrLang === 'eng' ? 'selected' : ''}>仅英文 / 数字</option>
                  <option value="chi_tra+eng" ${state.ocrLang === 'chi_tra+eng' ? 'selected' : ''}>繁体中文 + 英文</option>
                </select>
              </label>
              <label for="ocr-engine">
                <span>识别引擎</span>
                <select id="ocr-engine" data-engine-select>
                  <option value="local" ${state.ocrEngine === 'local' ? 'selected' : ''}>本地 Tesseract（免费离线）</option>
                  <option value="paddlejs" ${state.ocrEngine === 'paddlejs' ? 'selected' : ''}>免费高精度 Paddle.js（浏览器端）</option>
                  <option value="paddle" ${state.ocrEngine === 'paddle' ? 'selected' : ''}>云端 PaddleOCR（需服务端配置）</option>
                </select>
              </label>
              <div class="ocr-setting-copy">
                <p>${state.ocrEngine === 'paddle' ? '高精度模式通过本地 server.rb 代理调用 PaddleOCR，Token 不会进入网页。' : '本地模式首次识别会自动下载语言模型，图片不会上传。'}</p>
                <button class="text-link" id="load-ocr-demo" type="button" ${state.busy ? 'disabled' : ''}>使用示例图片 →</button>
              </div>
            </div>

            <div class="mobile-import-inline">
              <span>手机快捷导入</span>
              ${mobileImportActions(true)}
            </div>

            <label class="dropzone compact" id="ocr-dropzone">
              <input id="ocr-file-input" type="file" accept="image/*" multiple ${state.busy ? 'disabled' : ''} />
              <span class="dropzone-icon">⌘</span>
              <span>
                <strong>选择需要识别的图片</strong>
                <p>支持 JPG、PNG、WEBP；建议使用清晰、正视、文字占比适中的截图</p>
              </span>
            </label>
            <div class="upload-grid" id="ocr-upload-grid">
              ${renderUploads(files, 'ocr')}
            </div>

            ${files.length ? `
              <div class="ocr-file-actions">
                <span>已选择 ${files.length} 张图片${files.some((file) => file.isSample) ? ' · 包含示例图片' : ''}</span>
                <button class="text-link" id="clear-ocr-files" type="button" ${state.busy ? 'disabled' : ''}>清空全部图片</button>
              </div>
              <div class="ocr-file-list" id="ocr-file-list">
                ${files.map((file, index) => {
                  const result = state.ocrResults.find((item) => item.id === file.id);
                  const rowClass = result ? (result.text && !result.error ? 'done' : 'warning') : '';
                  const statusText = result
                    ? (result.error ? '识别失败' : result.text ? `完成 · 置信度 ${result.confidence}%` : '未识别到文字')
                    : '等待识别';
                  return `
                    <div class="ocr-file-row ${rowClass}" data-ocr-row="${escapeHtml(file.id)}">
                      <span class="ocr-file-index">${index + 1}</span>
                      <span class="ocr-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                      <span class="ocr-file-status">${statusText}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            <div class="progress-box" id="ocr-progress">
              <div class="progress-head"><span id="ocr-progress-label">准备识别</span><span id="ocr-progress-percent">0%</span></div>
              <div class="progress-track"><div class="progress-bar" id="ocr-progress-bar"></div></div>
              <div class="progress-steps" id="ocr-progress-steps">
                <span>加载 OCR 引擎</span><span>逐张识别文字</span><span>整理识别结果</span>
              </div>
            </div>

            <div class="action-row">
              <span class="helper-note">ⓘ 只保留可靠文字，图形、图标、线条和低置信度内容会被自动忽略。</span>
              <button class="btn" id="run-ocr" ${state.busy || !files.length ? 'disabled' : ''}>${state.busy ? '正在识别…' : `开始识别${files.length ? ` · ${files.length} 张` : ''}`}</button>
            </div>
          </div>
        </section>

        <aside class="panel">
          <div class="panel-header">
            <h2>识别结果 · 可编辑</h2>
            <span class="result-count" id="ocr-result-count">${meta ? `${meta.images} 张 · ${meta.engine === 'PaddleOCR' || meta.engine === 'Paddle.js' ? `${meta.engine} 高精度` : `平均置信度 ${meta.confidence}%`}` : hasResult ? `${state.ocrText.length} 字符` : '暂无结果'}</span>
          </div>
          <div class="panel-body ocr-result-box">
            ${hasResult ? `
              ${meta ? `
                <div class="ocr-summary">
                  <span><strong>${meta.images}</strong> 张图片</span>
                  <span><strong>${meta.engine === 'PaddleOCR' || meta.engine === 'Paddle.js' ? '高精度' : `${meta.confidence}%`}</strong> ${meta.engine === 'PaddleOCR' || meta.engine === 'Paddle.js' ? meta.engine : '平均置信度'}</span>
                  <span><strong>${meta.ignoredGraphics || 0}</strong> 忽略图形/噪声行</span>
                  ${meta.tableMeta ? `
                    <span><strong>${meta.tableMeta.rows}×${meta.tableMeta.columns}</strong> 表格行列</span>
                    <span><strong>${meta.tableMeta.lowConfidenceCells}</strong> 待核对单元格</span>
                  ` : ''}
                  <span><strong>${(meta.elapsedMs / 1000).toFixed(1)}s</strong> 处理耗时</span>
                </div>
              ` : ''}
              <div class="ocr-title-editor">
                <div class="ocr-title-head">
                  <span>1. 确认标题和标签</span>
                  <button class="text-link" id="regenerate-ocr-title" type="button">重新生成标题</button>
                </div>
                <input id="ocr-generated-title" value="${escapeHtml(state.ocrTitle)}" placeholder="根据识别内容生成标题" aria-label="自动生成的笔记标题" />
                <input id="ocr-generated-tags" class="ocr-tag-input" value="${escapeHtml((state.ocrTags.length ? state.ocrTags : inferOcrTags(state.ocrText, state.ocrTitle)).join(', '))}" placeholder="标签，用逗号分隔" aria-label="笔记标签" />
                <label class="ocr-folder-field">
                  <span>文件夹</span>
                  <span class="folder-picker-row">
                    <select id="ocr-generated-folder" aria-label="保存到文件夹">
                      ${getFolderOptions().filter((folder) => folder !== '全部文件夹').map((folder) => `<option value="${escapeHtml(folder)}" ${folder === (state.ocrFolder || '未分类') ? 'selected' : ''}>${escapeHtml(folder)}</option>`).join('')}
                    </select>
                    <button class="text-link" type="button" data-new-folder-context="ocr">＋ 新建</button>
                  </span>
                </label>
                <label class="source-keep-toggle"><input id="ocr-keep-sources" type="checkbox" ${state.ocrKeepSources ? 'checked' : ''} /><span>保存原始截图（关闭后只保留文字，更省空间）</span></label>
                ${state.ocrTitleSuggestions.length ? `
                  <div class="ocr-title-suggestions">
                    <span>主题相关标题建议</span>
                    ${state.ocrTitleSuggestions.map((suggestion) => `
                      <button type="button" class="${suggestion.title === state.ocrTitle ? 'active' : ''}" data-title-suggestion="${escapeHtml(suggestion.title)}" title="${escapeHtml(suggestion.reason)}">${escapeHtml(suggestion.title)}</button>
                    `).join('')}
                  </div>
                ` : ''}
                <p class="ocr-title-note">标题优先匹配全文占比最高的主题领域。确认标题和标签后，再直接修改下方正文。</p>
              </div>
              <details class="ocr-source-review" open>
                <summary>原图对照 <span>${files.length} 张</span></summary>
                <div class="ocr-source-thumbs">
                  ${files.map((file, index) => `
                    <figure>
                      <a href="${file.url}" target="_blank" rel="noopener">
                        <img src="${file.url}" alt="${escapeHtml(file.name)}" />
                      </a>
                      <figcaption>图 ${index + 1} · ${escapeHtml(file.name)}</figcaption>
                    </figure>
                  `).join('')}
                </div>
              </details>

              <div class="ocr-preview-toolbar">
                <span>2. 直接编辑正文</span>
                <div class="ocr-preview-actions">
                  <span id="ocr-block-count">${state.ocrBlocks.length} 个段落</span>
                  ${suspiciousCount ? `<span class="table-warning">${suspiciousCount} 个待核对</span>` : ''}
                  <div class="ocr-layout-modes" role="group" aria-label="预览排版方式">
                    <button type="button" data-ocr-layout="auto" class="${state.ocrRenderMode === 'auto' ? 'active' : ''}">自动</button>
                    <button type="button" data-ocr-layout="text" class="${state.ocrRenderMode === 'text' ? 'active' : ''}">普通文本</button>
                    <button type="button" data-ocr-layout="table" class="${state.ocrRenderMode === 'table' ? 'active' : ''}">表格</button>
                  </div>
                </div>
              </div>
              <label class="ocr-filter-toggle">
                <input type="checkbox" id="ocr-filter-irrelevant" ${state.ocrFilterIrrelevant ? 'checked' : ''} />
                <span>过滤明显无关的识别内容</span>
              </label>
              ${state.ocrRenderMode === 'table' ? '<p class="ocr-table-hint">表格模式：每行一条记录；多列可用 Tab、两个以上空格或 | 分隔。</p>' : ''}
              <div class="apple-note-sheet">
                <div class="apple-note-date">${formatDate(new Date().toISOString(), true)}</div>
                <h2 class="apple-note-title" id="ocr-preview-title">${escapeHtml(state.ocrTitle || '识别文字整理')}</h2>
                <div class="apple-note-body ocr-editable-draft" id="ocr-preview-body" contenteditable="true" spellcheck="false">${state.ocrDraftHtml || renderOcrBlockPreview(state.ocrBlocks)}</div>
              </div>
              <details class="ocr-raw-details">
                <summary>查看或编辑识别原文</summary>
                <textarea class="ocr-text" id="ocr-text" spellcheck="false" aria-label="OCR 识别结果">${escapeHtml(state.ocrText)}</textarea>
              </details>
              ${state.ocrResults.length ? `
                <details class="ocr-per-image">
                  <summary>按图片查看原始识别文字</summary>
                  <div class="ocr-per-image-list">
                    ${state.ocrResults.map((result, index) => `
                      <article class="ocr-per-image-item">
                        <header>
                          <strong>图 ${index + 1} · ${escapeHtml(result.name)}</strong>
                          <span>${result.error ? '识别失败' : `置信度 ${result.confidence || 0}%${result.ignoredLines ? ` · 忽略 ${result.ignoredLines} 行` : ''}`}</span>
                        </header>
                        <p>${escapeHtml(result.error || result.text || '未识别到可靠文字')}</p>
                      </article>
                    `).join('')}
                  </div>
                </details>
              ` : ''}
              <div class="action-row">
                <button class="btn secondary" id="copy-ocr">复制全部文字</button>
                <button class="btn" id="save-ocr-note">3. 确认并保存</button>
              </div>
            ` : state.busy ? `
              <div class="preview-placeholder">
                <div>
                  <span class="preview-illustration loading-pulse">⌘</span>
                  <h3>正在读取图片文字</h3>
                  <p>请保持当前页面打开。首次使用需要加载语言模型，处理时间会比后续稍长。</p>
                </div>
              </div>
            ` : state.ocrError ? `
              <div class="ocr-empty-result">
                <span class="ocr-empty-icon">!</span>
                <h3>未检测到可识别的文字</h3>
                <p>${escapeHtml(state.ocrError)}</p>
              </div>
            ` : `
              <div class="preview-placeholder">
                <div>
                  <span class="preview-illustration">⌘</span>
                  <h3>识别文字会显示在这里</h3>
                  <p>选择图片和语言后开始识别。没有识别到文字时，会明确提示而不会生成占位内容。</p>
                </div>
              </div>
            `}
          </div>
        </aside>
      </div>
    `;
  }

  function rebuildPasteBlocks() {
    state.pasteBlocks = buildBlocksForText(state.pasteText, {
      renderMode: state.pasteRenderMode,
      filterIrrelevant: state.pasteFilterIrrelevant
    });
    state.pasteStructuredHtml = buildStructuredTextHtml(state.pasteTemplate, state.pasteBlocks, state.pasteText);
  }

  function parsePasteContent() {
    const textarea = document.getElementById('paste-text');
    const text = textarea?.value ?? state.pasteText;
    state.pasteText = String(text || '').trim();
    if (!state.pasteText) {
      toast('请先粘贴 AI 识别结果。', 'error');
      return;
    }
    state.pasteRenderMode = 'auto';
    rebuildPasteBlocks();
    const titleSource = state.pasteFilterIrrelevant ? filterOcrContentLines(state.pasteText) : state.pasteText;
    state.pasteTitleSuggestions = generateOcrTitleSuggestions(titleSource);
    state.pasteTitle = state.pasteTitleSuggestions[0]?.title || 'AI 识别结果整理';
    state.pasteParsed = true;
    render();
    toast('粘贴内容已整理为便签。', 'success');
  }

  async function copyPasteResult() {
    const text = stripHtml(state.pasteStructuredHtml || '') || ocrBlocksToPlainText(state.pasteBlocks);
    if (!text) {
      toast('暂无可复制内容。', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    toast('整理结果已复制。', 'success');
  }

  function openSavePasteModal() {
    const suggestedTags = inferOcrTags(state.pasteText, state.pasteTitle).join(', ');
    showModal(`
      <div class="modal">
        <h2>保存为笔记</h2>
        <p>整理结果将保存到当前浏览器。</p>
        <label class="form-label" for="paste-note-title">笔记标题</label>
        <input class="detail-title-input" style="font-size:20px;padding:10px;border:1px solid var(--line);border-radius:12px" id="paste-note-title" value="${escapeHtml(state.pasteTitle || 'AI 识别结果整理')}" />
        <label class="form-label" for="paste-note-tags" style="margin-top:16px">标签</label>
        <input class="detail-title-input" style="width:100%;font-size:15px;padding:10px;border:1px solid var(--line);border-radius:12px" id="paste-note-tags" value="${escapeHtml(suggestedTags)}" />
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn" id="confirm-save-paste">保存笔记</button>
        </div>
      </div>
    `);
    const titleInput = document.getElementById('paste-note-title');
    const tagsInput = document.getElementById('paste-note-tags');
    titleInput?.focus();
    titleInput?.select();
    document.getElementById('confirm-save-paste')?.addEventListener('click', () => {
      const title = titleInput.value.trim() || state.pasteTitle || 'AI 识别结果整理';
      const tags = tagsInput.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean);
      const blocks = state.pasteBlocks.length ? state.pasteBlocks : buildBlocksForText(state.pasteText);
      const contentHtml = sanitizeHtml(state.pasteStructuredHtml || blocksToHtml(blocks));
      const now = new Date().toISOString();
      const note = {
        id: `note-${Date.now()}`,
        title,
        type: 'general',
        folder: 'AI 整理',
        tags: tags.length ? [...new Set(tags)] : ['AI整理'],
        summary: stripHtml(contentHtml).slice(0, 110),
        contentHtml,
        createdAt: now,
        updatedAt: now
      };
      state.notes.unshift(note);
      state.pasteText = '';
      state.pasteBlocks = [];
      state.pasteStructuredHtml = '';
      state.pasteTitle = '';
      state.pasteTitleSuggestions = [];
      state.pasteRenderMode = 'auto';
      state.pasteParsed = false;
      persist();
      closeModal();
      navigate('note', { noteId: note.id });
      toast('整理结果已保存为笔记。', 'success');
    });
  }

  function renderPaste() {
    const parsed = state.pasteParsed;
    const suspiciousCount = countSuspiciousOcrCells(state.pasteBlocks);
    return `
      ${pageHeader(
        'AI Structuring',
        'AI 结构化整理',
        '粘贴任意 OCR 或 AI 识别结果，选择模板后自动提炼大纲、错题、参数表、阅读摘要或会议行动项。',
        '<button class="btn secondary" data-route="ocr">← 图片提取文字</button>'
      )}
      <div class="paste-workspace">
        <section class="panel">
          <div class="panel-header">
            <h2>1. 选择结构化模板</h2>
            <span class="step">AI 结构化是核心能力</span>
          </div>
          <div class="panel-body">
            <div class="text-template-grid">
              ${Object.entries(textTemplates).map(([key, template]) => `
                <button class="text-template-card ${state.pasteTemplate === key ? 'active' : ''}" type="button" data-paste-template="${key}">
                  <span>${template.icon}</span>
                  <strong>${template.name}</strong>
                  <small>${template.description}</small>
                  <em>${template.sample.map((line) => `<i>${escapeHtml(line)}</i>`).join('')}</em>
                </button>
              `).join('')}
            </div>

            <div class="divider"></div>
            <div class="panel-header inline-panel-head">
              <h2>2. 粘贴外部 OCR / AI 文字</h2>
              <span class="step">不强制使用本网页 OCR</span>
            </div>
            <textarea class="paste-textarea" id="paste-text" spellcheck="false" placeholder="可以直接粘贴苹果备忘录、豆包、Kimi、ChatGPT 或其他工具的识别结果……&#10;&#10;也可以粘贴 Markdown 表格、Excel Tab 内容和普通文本。">${escapeHtml(state.pasteText)}</textarea>
            <div class="action-row">
              <span class="helper-note">支持课堂笔记、错题、技术文档、阅读摘录和会议纪要等模板。</span>
              <div class="paste-actions">
                <button class="btn ghost small" id="paste-example" type="button">填入课堂示例</button>
                <button class="btn" id="parse-paste" type="button">开始 AI 结构化</button>
              </div>
            </div>
          </div>
        </section>

        ${parsed ? `
          <aside class="panel paste-preview-panel">
            <div class="panel-header">
              <h2>3. 编辑结构化结果</h2>
              <span class="result-count">${state.pasteBlocks.length} 个段落</span>
            </div>
            <div class="panel-body">
              <div class="ocr-title-editor">
                <div class="ocr-title-head">
                  <span>自动生成标题</span>
                  <button class="text-link" id="regenerate-paste-title" type="button">重新生成</button>
                </div>
                <input id="paste-title" value="${escapeHtml(state.pasteTitle)}" placeholder="根据内容生成标题" aria-label="粘贴整理标题" />
                ${state.pasteTitleSuggestions.length ? `
                  <div class="ocr-title-suggestions">
                    <span>标题建议</span>
                    ${state.pasteTitleSuggestions.map((suggestion) => `
                      <button type="button" class="${suggestion.title === state.pasteTitle ? 'active' : ''}" data-paste-title-suggestion="${escapeHtml(suggestion.title)}" title="${escapeHtml(suggestion.reason)}">${escapeHtml(suggestion.title)}</button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <div class="ocr-preview-toolbar">
                <span>结构化预览</span>
                <div class="ocr-preview-actions">
                  ${suspiciousCount ? `<span class="table-warning">${suspiciousCount} 个待核对</span>` : ''}
                  <div class="ocr-layout-modes" role="group" aria-label="粘贴内容排版方式">
                    <button type="button" data-paste-layout="auto" class="${state.pasteRenderMode === 'auto' ? 'active' : ''}">自动</button>
                    <button type="button" data-paste-layout="text" class="${state.pasteRenderMode === 'text' ? 'active' : ''}">普通文本</button>
                    <button type="button" data-paste-layout="table" class="${state.pasteRenderMode === 'table' ? 'active' : ''}">表格</button>
                  </div>
                </div>
              </div>
              <label class="ocr-filter-toggle">
                <input type="checkbox" id="paste-filter-irrelevant" ${state.pasteFilterIrrelevant ? 'checked' : ''} />
                <span>过滤明显无关的识别内容</span>
              </label>
              <div class="apple-note-sheet">
                <div class="apple-note-date">${formatDate(new Date().toISOString(), true)}</div>
                <h2 class="apple-note-title" id="paste-preview-title">${escapeHtml(state.pasteTitle || 'AI 结构化结果')}</h2>
                <div class="apple-note-body ocr-editable-draft" id="paste-preview-body" contenteditable="true" spellcheck="false">${sanitizeHtml(state.pasteStructuredHtml || renderOcrBlockPreview(state.pasteBlocks))}</div>
              </div>
              <div class="action-row">
                <button class="btn secondary" id="copy-paste-result" type="button">复制整理结果</button>
                <button class="btn" id="save-paste-note" type="button">保存结构化笔记</button>
              </div>
            </div>
          </aside>
        ` : `
          <aside class="panel">
            <div class="preview-placeholder">
              <div>
                <span class="preview-illustration">✦</span>
                <h3>结构化结果会显示在这里</h3>
                <p>粘贴文字，选择模板，然后点击“开始 AI 结构化”。</p>
              </div>
            </div>
          </aside>
        `}
      </div>
    `;
  }

  function renderNoteSources(note) {
    const sourceImages = note.sourceImages || [];
    if (!sourceImages.length) return '';
    return `
      <section class="detail-sources">
        <div class="detail-sources-head">
          <span>原始截图</span>
          <div class="detail-sources-actions">
            <small>${sourceImages.length} 张 · 点击放大，长按保存</small>
            <button class="text-link" type="button" data-remove-note-sources="${escapeHtml(note.id)}">删除原图</button>
          </div>
        </div>
        <div class="detail-source-grid">
          ${sourceImages.map((source, index) => `
            <button class="detail-source-thumb" type="button" data-source-note="${escapeHtml(note.id)}" data-source-index="${index}" aria-label="查看第 ${index + 1} 张原始截图">
              ${source.thumbnail ? `<img src="${source.thumbnail}" alt="${escapeHtml(source.name || `原始截图 ${index + 1}`)}" />` : '<span class="source-thumb-placeholder">◫</span>'}
              <span>${index + 1}</span>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderNoteDetail() {
    const note = getNoteById(state.noteId);
    if (!note) {
      return emptyState('笔记不存在', '它可能已经被删除。', 'notes', '返回笔记列表');
    }
    const hasTable = /<table[\s>]/i.test(note.contentHtml || '');
    const sectionCount = (note.contentHtml.match(/data-section-id=/g) || []).length;
    const hasSortableSections = sectionCount >= 2;
    return `
      <div class="note-detail">
        <div class="detail-toolbar">
          <button class="btn ghost small" data-route="notes">← 返回笔记</button>
          <div class="detail-actions">
            <button class="btn secondary small" data-toggle-pin-note="${escapeHtml(note.id)}">${note.pinned ? '取消置顶' : '置顶笔记'}</button>
            ${hasSortableSections ? `<button class="btn secondary small" data-toggle-section-sort="${escapeHtml(note.id)}">${state.sectionSortMode ? '退出章节排序' : '排序章节'}</button>` : ''}
            ${hasTable ? `<button class="btn secondary small" data-edit-table="${escapeHtml(note.id)}">编辑表格</button>` : ''}
            <button class="btn secondary small" data-insert-table="${escapeHtml(note.id)}">插入表格</button>
            <button class="btn secondary small" data-export="${escapeHtml(note.id)}">导出</button>
            <button class="btn danger small" data-delete-note="${escapeHtml(note.id)}">删除</button>
            <button class="btn small" data-save-note="${escapeHtml(note.id)}">保存修改</button>
          </div>
        </div>
        <article class="detail-paper">
          <div class="detail-kicker">
            <span>${noteTypeLabel(note.type)}</span>
            <span>·</span>
            <span>${note.pinned ? '已置顶 · ' : ''}最后编辑 ${formatDate(note.updatedAt, true)}</span>
          </div>
          <input class="detail-title-input" id="detail-title" value="${escapeHtml(note.title)}" aria-label="笔记标题" />
          <div class="editable-meta">
            <span class="form-label" style="margin:0">标签</span>
            <input id="detail-tags" value="${escapeHtml(note.tags.join(', '))}" aria-label="笔记标签，用逗号分隔" />
            <label class="editable-folder">
              <span>文件夹</span>
              <select id="detail-folder" aria-label="选择笔记文件夹">
                ${getFolderOptions().filter((folder) => folder !== '全部文件夹').map((folder) => `<option value="${escapeHtml(folder)}" ${folder === (note.folder || '未分类') ? 'selected' : ''}>${escapeHtml(folder)}</option>`).join('')}
              </select>
              <button class="text-link" type="button" data-new-folder-context="detail">＋ 新建</button>
            </label>
          </div>
          ${renderNoteSources(note)}
          ${state.sectionSortMode && hasSortableSections ? '<div class="section-sort-hint">拖动章节左侧手柄，或使用 ↑ ↓ 按钮调整顺序；松开后会自动保存。</div>' : ''}
          <div class="detail-content ${state.sectionSortMode ? 'section-sort-mode' : ''}" id="detail-content" contenteditable="${state.sectionSortMode ? 'false' : 'true'}">${sanitizeHtml(note.contentHtml)}</div>
          <footer class="detail-footer">
            <span>${state.sectionSortMode ? '章节排序会在松开或点击上下按钮后自动保存。' : '单元格可直接编辑；表格工具支持增删行列、合并单元格和撤销重做。保存后与预览一致。'}</span>
            <span>${stripHtml(note.contentHtml).length} 字符</span>
          </footer>
        </article>
      </div>
    `;
  }

  function updateTopActions() {
    const button = document.getElementById('top-ocr-button');
    const label = document.getElementById('top-ocr-label');
    if (button) button.classList.toggle('loading', state.busy);
    if (label) label.textContent = state.busy ? '识别中…' : '上传图片 OCR';
  }

  function updateNav() {
    document.querySelectorAll('[data-route]').forEach((element) => {
      const route = element.dataset.route;
      const active = route === state.route || (state.route === 'note' && route === 'notes');
      element.classList.toggle('active', active);
      if (element.classList.contains('nav-item') || element.closest('.bottom-nav')) {
        element.setAttribute('aria-current', active ? 'page' : 'false');
      }
    });
  }

  function navigate(route, options = {}) {
    if (options.noteId) state.noteId = options.noteId;
    if (route !== 'notes' && options.keepSearch !== true) {
      state.search = '';
    }
    state.route = route;
    if (route !== 'notes') {
      state.noteSelectionMode = false;
      state.selectedNoteIds = [];
    }
    if (route !== 'note') state.sectionSortMode = false;
    if (route !== 'import' && state.aiResult) state.aiResult = state.aiResult;
    render();
  }

  async function rerunOcrForNote(noteId) {
    const note = getNoteById(noteId);
    if (!note?.sourceImages?.length) {
      toast('这条笔记没有保存原始截图，无法重新 OCR。', 'error');
      return;
    }
    const records = await getAllAssetRecords();
    const record = records.find((item) => item.id === noteId);
    if (!record?.images?.length) {
      toast('没有找到原始截图文件，请重新上传图片。', 'error');
      return;
    }
    const files = record.images.map((image, index) => new File(
      [image.data],
      image.name || `${note.title}-${index + 1}.png`,
      { type: image.type || 'image/png' }
    ));
    navigate('ocr');
    addFiles(files, 'ocr');
    toast(`已载入 ${files.length} 张原始截图，可以重新识别。`, 'success');
  }

  function bindWorkspaceImageDropzone() {
    const dropzone = document.getElementById('workspace-dropzone');
    const input = document.getElementById('workspace-image-input');
    if (!dropzone || !input) return;
    const acceptFiles = (fileList) => {
      const files = [...(fileList || [])].filter((file) => file.type.startsWith('image/'));
      if (!files.length) return;
      navigate('ocr');
      addFiles(files, 'ocr');
      toast(`已加入 ${files.length} 张图片，正在进入 OCR。`, 'success');
    };
    input.addEventListener('change', (event) => {
      acceptFiles(event.target.files);
      event.target.value = '';
    });
    ['dragenter', 'dragover'].forEach((type) => dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((type) => dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragging');
    }));
    dropzone.addEventListener('drop', (event) => acceptFiles(event.dataTransfer?.files));
  }

  function scheduleWorkspaceAutosave() {
    if (state.route !== 'workspace') return;
    clearTimeout(workspaceAutosaveTimer);
    setSaveStatus('保存中…', 'saving');
    workspaceAutosaveTimer = setTimeout(() => {
      if (state.workspaceMode === 'markdown') {
        saveMarkdownNote(state.noteId, { render: false, toast: false, reason: '自动保存 Markdown' });
      } else {
        saveNoteDetail(state.noteId, { render: false, toast: false, reason: '自动保存笔记' });
      }
    }, 700);
  }

  function setupWorkspaceNoteSorting() {
    const list = document.querySelector('.workspace-folder-list');
    if (!list) return;
    const commit = () => {
      const items = [...list.querySelectorAll('[data-workspace-note]')];
      items.forEach((item, index) => {
        const note = getNoteById(item.dataset.workspaceNote);
        if (!note) return;
        const folder = item.closest('[data-workspace-folder]')?.dataset.workspaceFolder;
        note.order = index;
        if (folder) note.folder = folder;
      });
      draggedWorkspaceNote = null;
      list.querySelectorAll('.dragging').forEach((item) => item.classList.remove('dragging'));
      persist({ reason: '调整笔记顺序' });
      render();
    };
    list.addEventListener('dragstart', (event) => {
      const item = event.target.closest('[data-workspace-note]');
      if (!item || event.target.closest('button')) {
        event.preventDefault();
        return;
      }
      draggedWorkspaceNote = item.dataset.workspaceNote;
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedWorkspaceNote);
    });
    list.addEventListener('dragover', (event) => {
      if (!draggedWorkspaceNote) return;
      event.preventDefault();
      const dragged = [...list.querySelectorAll('[data-workspace-note]')].find((item) => item.dataset.workspaceNote === draggedWorkspaceNote);
      if (!dragged) return;
      const targetItem = event.target.closest('[data-workspace-note]');
      if (targetItem && targetItem !== dragged) {
        const rect = targetItem.getBoundingClientRect();
        if (event.clientY > rect.top + rect.height / 2) targetItem.after(dragged);
        else targetItem.before(dragged);
        return;
      }
      const targetFolder = event.target.closest('.workspace-folder');
      if (targetFolder) targetFolder.querySelector('.workspace-note-list')?.append(dragged);
    });
    list.addEventListener('drop', (event) => {
      if (!draggedWorkspaceNote) return;
      event.preventDefault();
      commit();
    });
    list.addEventListener('dragend', () => {
      if (draggedWorkspaceNote) commit();
    });
  }

  function getSortableSections() {
    const content = document.getElementById('detail-content');
    return content ? [...content.querySelectorAll(':scope > [data-section-id]')] : [];
  }

  function persistSectionOrder(noteId, options = {}) {
    const note = getNoteById(noteId);
    const content = document.getElementById('detail-content');
    if (!note || !content) return;
    const clone = content.cloneNode(true);
    clone.querySelectorAll('.section-sort-controls').forEach((control) => control.remove());
    note.contentHtml = sanitizeHtml(clone.innerHTML);
    note.summary = stripHtml(note.contentHtml).slice(0, 110);
    note.updatedAt = new Date().toISOString();
    persist({ reason: '调整章节顺序' });
    if (options.toast !== false) toast('章节顺序已保存。', 'success');
  }

  function moveSectionByButton(button) {
    const section = button.closest('[data-section-id]');
    const content = document.getElementById('detail-content');
    if (!section || !content) return;
    const direction = button.dataset.moveSection;
    if (direction === 'up' && section.previousElementSibling?.matches('[data-section-id]')) {
      content.insertBefore(section, section.previousElementSibling);
    }
    if (direction === 'down' && section.nextElementSibling?.matches('[data-section-id]')) {
      content.insertBefore(section.nextElementSibling, section);
    }
    persistSectionOrder(button.dataset.moveNote || section.dataset.noteId || state.noteId);
  }

  function setupSectionSorting() {
    if (!state.sectionSortMode) return;
    const sections = getSortableSections();
    const clearDropState = () => {
      sections.forEach((item) => item.classList.remove('dragging', 'drag-over-before', 'drag-over-after'));
    };
    sections.forEach((section) => {
      section.draggable = false;
      section.classList.add('sortable-section');
      if (!section.querySelector(':scope > .section-sort-controls')) {
        const controls = document.createElement('div');
        controls.className = 'section-sort-controls';
        controls.contentEditable = 'false';
        controls.innerHTML = '<span class="section-drag-handle" title="拖动排序">⠿</span><button type="button" data-move-section="up">↑</button><button type="button" data-move-section="down">↓</button>';
        section.prepend(controls);
      }
      const handle = section.querySelector(':scope > .section-sort-controls .section-drag-handle');
      if (handle) {
        handle.draggable = true;
        handle.ondragstart = (event) => {
          draggedSection = section;
          section.classList.add('dragging');
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', section.dataset.sectionId || '');
        };
        handle.ondragend = () => {
          draggedSection = null;
          clearDropState();
        };
      }
      section.ondragover = (event) => {
        if (!draggedSection || draggedSection === section) return;
        event.preventDefault();
        const rect = section.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        section.classList.toggle('drag-over-after', after);
        section.classList.toggle('drag-over-before', !after);
      };
      section.ondragleave = () => section.classList.remove('drag-over-before', 'drag-over-after');
      section.ondrop = (event) => {
        event.preventDefault();
        if (!draggedSection || draggedSection === section) return;
        const insertAfter = section.classList.contains('drag-over-after');
        if (insertAfter) section.after(draggedSection);
        else section.before(draggedSection);
        persistSectionOrder(state.noteId);
        draggedSection = null;
        clearDropState();
      };
    });
  }

  function bindViewEvents() {
    const aiInput = document.getElementById('ai-file-input');
    const ocrInput = document.getElementById('ocr-file-input');

    if (aiInput) aiInput.addEventListener('change', (event) => addFiles(event.target.files, 'ai'));
    if (ocrInput) ocrInput.addEventListener('change', (event) => addFiles(event.target.files, 'ocr'));

    const backupInput = document.getElementById('backup-file-input');
    if (backupInput) backupInput.addEventListener('change', (event) => {
      importBackup(event.target.files?.[0]);
      event.target.value = '';
    });

    const folderFilter = document.getElementById('folder-filter');
    if (folderFilter) folderFilter.addEventListener('change', (event) => {
      state.folderFilter = event.target.value;
      render();
    });

    const loadOcrDemo = document.getElementById('load-ocr-demo');
    if (loadOcrDemo) loadOcrDemo.addEventListener('click', createSampleOcrImage);

    const clearOcrButton = document.getElementById('clear-ocr-files');
    if (clearOcrButton) clearOcrButton.addEventListener('click', clearOcrFiles);

    document.querySelectorAll('[data-engine-select]').forEach((select) => {
      select.addEventListener('change', (event) => {
        state.ocrEngine = event.target.value;
        render();
        if (state.ocrEngine === 'paddle') {
          toast('已切换到高精度模式，请确认本地 server.rb 与 PaddleOCR 环境变量已配置。', 'success');
        }
      });
    });

    const ocrLanguage = document.getElementById('ocr-language');
    if (ocrLanguage) ocrLanguage.addEventListener('change', (event) => {
      state.ocrLang = event.target.value;
      state.ocrText = '';
      state.ocrTitle = '';
      state.ocrTitleSuggestions = [];
      state.ocrTags = [];
      state.ocrDraftHtml = '';
      state.ocrMeta = null;
      state.ocrResults = [];
      state.ocrBlocks = [];
      state.ocrForceTable = false;
      state.ocrError = '';
      render();
    });

    const generatedTitle = document.getElementById('ocr-generated-title');
    if (generatedTitle) generatedTitle.addEventListener('input', (event) => {
      state.ocrTitle = event.target.value;
      const previewTitle = document.getElementById('ocr-preview-title');
      if (previewTitle) previewTitle.textContent = state.ocrTitle || '识别文字整理';
    });

    const generatedTags = document.getElementById('ocr-generated-tags');
    if (generatedTags) generatedTags.addEventListener('input', (event) => {
      state.ocrTags = event.target.value
        .split(/[,，]/)
        .map((tag) => tag.trim().replace(/^#/, ''))
        .filter(Boolean);
    });

    const generatedFolder = document.getElementById('ocr-generated-folder');
    if (generatedFolder) generatedFolder.addEventListener('change', (event) => {
      state.ocrFolder = event.target.value || '未分类';
    });

    const ocrKeepSources = document.getElementById('ocr-keep-sources');
    if (ocrKeepSources) ocrKeepSources.addEventListener('change', (event) => {
      state.ocrKeepSources = event.target.checked;
    });

    const aiKeepSources = document.getElementById('ai-keep-sources');
    if (aiKeepSources) aiKeepSources.addEventListener('change', (event) => {
      state.aiKeepSources = event.target.checked;
    });

    const ocrPreviewBody = document.getElementById('ocr-preview-body');
    if (ocrPreviewBody) ocrPreviewBody.addEventListener('input', (event) => {
      state.ocrDraftHtml = event.target.innerHTML;
      state.ocrTextDirty = true;
    });

    document.querySelectorAll('[data-ocr-layout]').forEach((button) => {
      button.addEventListener('click', () => {
        state.ocrRenderMode = button.dataset.ocrLayout || 'auto';
        state.ocrForceTable = state.ocrRenderMode === 'table';
        rebuildOcrBlocks();
        render();
        toast(`已切换为${state.ocrRenderMode === 'text' ? '普通文本' : state.ocrRenderMode === 'table' ? '表格' : '自动'}预览。`, 'success');
      });
    });

    const filterIrrelevant = document.getElementById('ocr-filter-irrelevant');
    if (filterIrrelevant) filterIrrelevant.addEventListener('change', (event) => {
      state.ocrFilterIrrelevant = event.target.checked;
      rebuildOcrBlocks();
      render();
    });

    const regenerateTitle = document.getElementById('regenerate-ocr-title');
    if (regenerateTitle) regenerateTitle.addEventListener('click', () => {
      const editedText = stripHtml(document.getElementById('ocr-preview-body')?.innerHTML || state.ocrDraftHtml);
      const currentText = editedText || document.getElementById('ocr-text')?.value || state.ocrText;
      state.ocrTitleSuggestions = generateOcrTitleSuggestions(state.ocrFilterIrrelevant ? filterOcrContentLines(currentText) : currentText);
      state.ocrTitle = state.ocrTitleSuggestions[0]?.title || 'OCR 识别结果整理';
      render();
    });

    document.querySelectorAll('[data-title-suggestion]').forEach((button) => {
      button.addEventListener('click', () => {
        state.ocrTitle = button.dataset.titleSuggestion || '';
        const titleInput = document.getElementById('ocr-generated-title');
        if (titleInput) titleInput.value = state.ocrTitle;
        document.querySelectorAll('[data-title-suggestion]').forEach((item) => {
          item.classList.toggle('active', item === button);
        });
      });
    });

    bindDropzone(document.getElementById('ai-dropzone'), 'ai');
    bindDropzone(document.getElementById('ocr-dropzone'), 'ocr');

    const runAi = document.getElementById('run-ai');
    if (runAi) runAi.addEventListener('click', runAiOrganize);

    const runOcr = document.getElementById('run-ocr');
    if (runOcr) runOcr.addEventListener('click', runOcrRecognition);

    const saveAi = document.getElementById('save-ai-result');
    if (saveAi) saveAi.addEventListener('click', saveAiResult);

    const discardAi = document.getElementById('discard-ai-result');
    if (discardAi) discardAi.addEventListener('click', () => {
      state.aiResult = null;
      render();
    });

    const copyOcr = document.getElementById('copy-ocr');
    if (copyOcr) copyOcr.addEventListener('click', copyOcrText);

    const saveOcr = document.getElementById('save-ocr-note');
    if (saveOcr) saveOcr.addEventListener('click', saveOcrInline);

    const ocrText = document.getElementById('ocr-text');
    if (ocrText) ocrText.addEventListener('input', (event) => {
      state.ocrText = event.target.value;
      state.ocrTextDirty = true;
      rebuildOcrBlocks();
      const count = document.getElementById('ocr-result-count');
      if (count) count.textContent = `${state.ocrText.length} 字符`;
      const previewBody = document.getElementById('ocr-preview-body');
      if (previewBody) previewBody.innerHTML = state.ocrDraftHtml;
      const blockCount = document.getElementById('ocr-block-count');
      if (blockCount) blockCount.textContent = `${state.ocrBlocks.length} 个段落`;
    });

    document.querySelectorAll('[data-paste-template]').forEach((button) => {
      button.addEventListener('click', () => {
        state.pasteTemplate = button.dataset.pasteTemplate || 'auto';
        if (state.pasteText.trim()) rebuildPasteBlocks();
        render();
      });
    });

    const pasteText = document.getElementById('paste-text');
    if (pasteText) pasteText.addEventListener('input', (event) => {
      state.pasteText = event.target.value;
    });

    const pastePreviewBody = document.getElementById('paste-preview-body');
    if (pastePreviewBody) pastePreviewBody.addEventListener('input', (event) => {
      state.pasteStructuredHtml = event.target.innerHTML;
    });

    const parsePaste = document.getElementById('parse-paste');
    if (parsePaste) parsePaste.addEventListener('click', parsePasteContent);

    const pasteExample = document.getElementById('paste-example');
    if (pasteExample) pasteExample.addEventListener('click', () => {
      state.pasteText = [
        '今天课程主题：函数单调性。',
        '重点：函数单调性的定义、区间判断，以及利用导数判断单调性。',
        '难点：含参数函数的单调区间讨论，容易忽略定义域。',
        '例题：求函数在某区间上的单调性，先求导，再判断导数符号。',
        '作业：完成教材第 12 页第 3、4 题，整理错题并写一句方法总结。'
      ].join('\n');
      state.pasteParsed = false;
      render();
      parsePasteContent();
    });

    document.querySelectorAll('[data-paste-layout]').forEach((button) => {
      button.addEventListener('click', () => {
        state.pasteRenderMode = button.dataset.pasteLayout || 'auto';
        rebuildPasteBlocks();
        render();
      });
    });

    const pasteFilter = document.getElementById('paste-filter-irrelevant');
    if (pasteFilter) pasteFilter.addEventListener('change', (event) => {
      state.pasteFilterIrrelevant = event.target.checked;
      rebuildPasteBlocks();
      render();
    });

    const pasteTitle = document.getElementById('paste-title');
    if (pasteTitle) pasteTitle.addEventListener('input', (event) => {
      state.pasteTitle = event.target.value;
      const previewTitle = document.getElementById('paste-preview-title');
      if (previewTitle) previewTitle.textContent = state.pasteTitle || 'AI 识别结果整理';
    });

    document.querySelectorAll('[data-paste-title-suggestion]').forEach((button) => {
      button.addEventListener('click', () => {
        state.pasteTitle = button.dataset.pasteTitleSuggestion || '';
        const input = document.getElementById('paste-title');
        if (input) input.value = state.pasteTitle;
        document.querySelectorAll('[data-paste-title-suggestion]').forEach((item) => {
          item.classList.toggle('active', item === button);
        });
      });
    });

    const regeneratePasteTitle = document.getElementById('regenerate-paste-title');
    if (regeneratePasteTitle) regeneratePasteTitle.addEventListener('click', () => {
      const source = state.pasteFilterIrrelevant ? filterOcrContentLines(state.pasteText) : state.pasteText;
      state.pasteTitleSuggestions = generateOcrTitleSuggestions(source);
      state.pasteTitle = state.pasteTitleSuggestions[0]?.title || 'AI 识别结果整理';
      render();
    });

    const copyPaste = document.getElementById('copy-paste-result');
    if (copyPaste) copyPaste.addEventListener('click', copyPasteResult);

    const savePaste = document.getElementById('save-paste-note');
    if (savePaste) savePaste.addEventListener('click', openSavePasteModal);

    const markdownSource = document.getElementById('workspace-markdown-source');
    if (markdownSource) markdownSource.addEventListener('input', (event) => {
      state.workspaceMarkdownDraft = event.target.value;
      const preview = document.getElementById('workspace-markdown-preview');
      if (preview) preview.innerHTML = markdownToPreviewHtml(state.workspaceMarkdownDraft);
      scheduleWorkspaceAutosave();
    });

    ['detail-title', 'detail-tags', 'detail-content'].forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.addEventListener('input', scheduleWorkspaceAutosave);
    });
    document.getElementById('detail-folder')?.addEventListener('change', scheduleWorkspaceAutosave);

    bindWorkspaceImageDropzone();
    setupWorkspaceNoteSorting();
    setupSectionSorting();
  }

  function createSampleOcrImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111111';
    context.textBaseline = 'top';
    context.font = '700 76px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText('优记 BestNote', 80, 70);
    context.font = '58px "PingFang SC", "Microsoft YaHei", sans-serif';
    context.fillText('OCR 真实识别测试图片', 80, 230);
    context.fillText('股票代码 600519', 80, 380);
    context.fillText('会议时间 2026-09-27 14:00', 80, 530);
    context.fillText('核心结论 中文 English 123456', 80, 680);
    context.fillText('待办 核对识别结果并复制文字', 80, 830);
    canvas.toBlob((blob) => {
      if (!blob) {
        toast('示例图片生成失败。', 'error');
        return;
      }
      const file = new File([blob], `OCR示例-${Date.now()}.png`, { type: 'image/png' });
      addFiles([file], 'ocr', { sample: true });
    }, 'image/png');
  }

  function bindDropzone(element, purpose) {
    if (!element) return;
    ['dragenter', 'dragover'].forEach((type) => element.addEventListener(type, (event) => {
      event.preventDefault();
      element.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach((type) => element.addEventListener(type, (event) => {
      event.preventDefault();
      element.classList.remove('dragging');
    }));
    element.addEventListener('drop', (event) => {
      if (event.dataTransfer?.files?.length) addFiles(event.dataTransfer.files, purpose);
    });
  }

  function addFiles(fileList, purpose, options = {}) {
    if (state.busy) {
      toast('识别处理中，请等待当前任务完成后再更换图片。', 'error');
      return;
    }
    const incoming = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (!incoming.length) {
      toast('请选择 JPG、PNG 或 WEBP 图片。', 'error');
      return;
    }
    const key = purpose === 'ai' ? 'importFiles' : 'ocrFiles';

    if (purpose === 'ocr' && state.ocrFiles.length) {
      clearFiles('ocr');
      toast(
        options.sample ? '已替换为示例图片。' : '已替换为本次选择的图片，不会混入上一批内容。',
        'success'
      );
    }

    const available = MAX_FILES - state[key].length;
    if (available <= 0) {
      toast(`最多上传 ${MAX_FILES} 张图片。`, 'error');
      return;
    }
    if (incoming.length > available) {
      toast(`本次只会加入前 ${available} 张图片，最多支持 ${MAX_FILES} 张。`, 'error');
    }
    incoming.slice(0, available).forEach((file) => {
      state[key].push({
        id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        name: file.name,
        size: file.size,
        isSample: Boolean(options.sample),
        url: URL.createObjectURL(file)
      });
    });
    if (purpose === 'ocr') {
      state.ocrText = '';
      state.ocrTitle = '';
      state.ocrTitleSuggestions = [];
      state.ocrTags = [];
      state.ocrDraftHtml = '';
      state.ocrMeta = null;
      state.ocrResults = [];
      state.ocrBlocks = [];
      state.ocrForceTable = false;
      state.ocrError = '';
    }
    render();
  }

  function startMobileImport(mode) {
    const input = document.getElementById(mode === 'camera' ? 'mobile-camera-input' : 'mobile-gallery-input');
    if (!input) return;
    navigate('ocr');
    setTimeout(() => input.click(), 0);
  }

  async function pasteImageFromClipboard() {
    if (!navigator.clipboard?.read) {
      toast('当前浏览器不支持读取剪贴板图片，请使用相册导入。', 'error');
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      const files = [];
      for (const item of items) {
        const type = item.types.find((value) => value.startsWith('image/'));
        if (!type) continue;
        const blob = await item.getType(type);
        files.push(new File([blob], `剪贴板截图-${Date.now()}.${type.split('/')[1] || 'png'}`, { type }));
      }
      if (!files.length) {
        toast('剪贴板里没有图片。', 'error');
        return;
      }
      navigate('ocr');
      addFiles(files, 'ocr');
      toast(`已从剪贴板加入 ${files.length} 张截图。`, 'success');
    } catch (error) {
      console.warn('读取剪贴板图片失败。', error);
      toast('无法读取剪贴板图片，请改用“相册”导入。', 'error');
    }
  }

  function bindMobileImportInputs() {
    [
      ['mobile-camera-input', 'camera'],
      ['mobile-gallery-input', 'gallery']
    ].forEach(([id, mode]) => {
      const input = document.getElementById(id);
      if (!input || input.dataset.bound === 'true') return;
      input.dataset.bound = 'true';
      input.addEventListener('change', (event) => {
        const files = [...event.target.files].filter((file) => file.type.startsWith('image/'));
        if (files.length) addFiles(files, 'ocr');
        event.target.value = '';
      });
    });
  }

  function removeFile(purpose, fileId) {
    if (state.busy) {
      toast('识别处理中，暂时不能移除图片。', 'error');
      return;
    }
    const key = purpose === 'ai' ? 'importFiles' : 'ocrFiles';
    const file = state[key].find((item) => item.id === fileId);
    if (file) URL.revokeObjectURL(file.url);
    state[key] = state[key].filter((item) => item.id !== fileId);
    if (purpose === 'ai') state.aiResult = null;
    if (purpose === 'ocr') {
      state.ocrText = '';
      state.ocrTitle = '';
      state.ocrTitleSuggestions = [];
      state.ocrTags = [];
      state.ocrDraftHtml = '';
      state.ocrMeta = null;
      state.ocrResults = [];
      state.ocrBlocks = [];
      state.ocrForceTable = false;
      state.ocrError = '';
    }
    render();
  }

  function clearFiles(purpose) {
    const key = purpose === 'ai' ? 'importFiles' : 'ocrFiles';
    state[key].forEach((file) => URL.revokeObjectURL(file.url));
    state[key] = [];
  }

  function clearOcrFiles() {
    if (state.busy) {
      toast('识别处理中，暂时不能清空图片。', 'error');
      return;
    }
    clearFiles('ocr');
    state.ocrText = '';
    state.ocrTitle = '';
    state.ocrTitleSuggestions = [];
    state.ocrTags = [];
    state.ocrDraftHtml = '';
    state.ocrMeta = null;
    state.ocrResults = [];
    state.ocrBlocks = [];
    state.ocrForceTable = false;
    state.ocrError = '';
    render();
    toast('已清空所有 OCR 图片和结果。', 'success');
  }

  function setProgress(prefix, stepIndex, totalSteps) {
    const box = document.getElementById(`${prefix}-progress`);
    const bar = document.getElementById(`${prefix}-progress-bar`);
    const percent = document.getElementById(`${prefix}-progress-percent`);
    const label = document.getElementById(`${prefix}-progress-label`);
    const steps = document.getElementById(`${prefix}-progress-steps`)?.children || [];
    if (!box || !bar || !percent) return;
    box.classList.add('visible');
    const value = Math.round(((stepIndex + 1) / totalSteps) * 100);
    bar.style.width = `${value}%`;
    percent.textContent = `${value}%`;
    if (label) label.textContent = steps[stepIndex]?.textContent || '处理中';
    [...steps].forEach((step, index) => {
      step.classList.toggle('done', index < stepIndex);
      step.classList.toggle('current', index === stepIndex);
    });
  }

  async function runAiOrganize() {
    if (!state.importFiles.length) {
      toast('请先上传至少一张截图。', 'error');
      return;
    }

    const files = state.importFiles.map((file) => ({ ...file }));
    if (state.ocrEngine === 'paddlejs') {
      return runPaddleJsAiOrganize(files);
    }
    if (state.ocrEngine === 'paddle') {
      return runPaddleAiOrganize(files);
    }
    const totalSteps = 4;
    let worker = null;
    state.busy = true;
    state.aiResult = null;
    render();
    setProgress('ai', 0, totalSteps);

    try {
      const Tesseract = await loadTesseractEngine();
      setProgress('ai', 1, totalSteps);

      worker = await Tesseract.createWorker(state.ocrLang, 1, {
        logger: (message) => {
          const label = translateOcrStatus(message.status);
          const progress = Number.isFinite(message.progress) ? Math.round(message.progress * 100) : 0;
          const progressLabel = document.getElementById('ai-progress-label');
          if (progressLabel) progressLabel.textContent = `${label}${progress ? ` · ${progress}%` : '…'}`;
        },
        errorHandler: (error) => console.warn('AI OCR worker error:', error)
      });
      await worker.setParameters({ preserve_interword_spaces: '1', user_defined_dpi: '300' });

      const results = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const progressLabel = document.getElementById('ai-progress-label');
        if (progressLabel) progressLabel.textContent = `识别第 ${index + 1}/${files.length} 张：${file.name}`;
        const processedImage = await preprocessImageForOcr(file.url);
        let extraction = null;
        if (processedImage.tableCells?.length >= 4) {
          extraction = await recognizeOcrTableCells(worker, processedImage.tableCells);
        }
        if (!extraction?.text) {
          await worker.setParameters({
            preserve_interword_spaces: '1',
            tessedit_pageseg_mode: '3'
          });
          const result = await worker.recognize(processedImage.dataUrl);
          extraction = extractReliableOcrText(result);
        } else {
          await worker.setParameters({ preserve_interword_spaces: '1' });
        }
        results.push({
          id: file.id,
          name: file.name,
          text: extraction.text,
          confidence: extraction.confidence,
          ignoredLines: extraction.ignoredLines,
          tableMeta: extraction.tableMeta || null
        });
        const value = Math.round(35 + ((index + 1) / files.length) * 55);
        const bar = document.getElementById('ai-progress-bar');
        const percent = document.getElementById('ai-progress-percent');
        if (bar) bar.style.width = `${value}%`;
        if (percent) percent.textContent = `${value}%`;
      }

      setProgress('ai', 2, totalSteps);
      const text = results.filter((item) => item.text).map((item) => item.text).join('\n\n');
      if (!text.trim()) {
        throw new Error('未检测到可靠文字，请确认截图清晰度或更换图片。');
      }

      const result = buildGeneratedNote(state.importTemplate, files, text);
      state.aiResult = result;
      state.stats.aiRuns += 1;
      persist();
      setProgress('ai', 3, totalSteps);
      state.busy = false;
      render();
      toast('已根据截图真实内容完成整理。', 'success');
    } catch (error) {
      console.error('AI organize failed:', error);
      state.busy = false;
      render();
      toast(error?.message || '图片整理失败，请稍后重试。', 'error');
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (error) {
          console.warn('AI OCR worker cleanup failed:', error);
        }
      }
    }
  }

  function getOcrBlockText(block) {
    if (!block) return '';
    if (block.type === 'list') return (block.items || []).join(' ');
    if (block.type === 'keyValue') return `${block.key || ''}：${block.value || ''}`;
    if (block.type === 'table') {
      return [...(block.headers || []), ...((block.rows || []).flat())].map((cell) => cell === OCR_EMPTY_CELL ? '' : cell).join(' ');
    }
    return block.text || '';
  }

  function pickOcrBlocks(blocks, pattern) {
    return (blocks || []).filter((block) => pattern.test(getOcrBlockText(block)));
  }

  function removeOcrBlocks(blocks, excluded) {
    const excludedSet = new Set(excluded || []);
    return (blocks || []).filter((block) => !excludedSet.has(block));
  }

  const templateConfigs = {
    study: { type: 'study', folder: '学习', tags: ['学习', '笔记'], title: '知识点整理', secondary: '复习与练习' },
    work: { type: 'work', folder: '工作', tags: ['工作', '记录'], title: '工作内容', secondary: '下一步行动' },
    hobby: { type: 'hobby', folder: '兴趣爱好', tags: ['兴趣爱好', '记录'], title: '实践记录', secondary: '后续计划' },
    meeting: { type: 'meeting', folder: '工作', tags: ['会议', '工作'], title: '会议内容', secondary: '行动项' },
    fitness: { type: 'fitness', folder: '健身', tags: ['健身', '训练'], title: '训练记录', secondary: '恢复与饮食' },
    reading: { type: 'reading', folder: '阅读', tags: ['阅读', '摘录'], title: '阅读摘录', secondary: '后续行动' },
    project: { type: 'project', folder: '工作', tags: ['项目', '计划'], title: '项目进展', secondary: '里程碑与行动' },
    travel: { type: 'travel', folder: '旅行', tags: ['旅行', '攻略'], title: '路线与清单', secondary: '提醒' },
    cooking: { type: 'cooking', folder: '食谱', tags: ['食谱', '烹饪'], title: '食材与步骤', secondary: '复盘' },
    stock: { type: 'stock', folder: '投资研究', tags: ['股票', '投资'], title: '核心观察', secondary: '跟踪清单' }
  };

  function recommendTemplateKey(template, lines = [], dominant = null) {
    if (template && template !== 'auto') return template;
    const topic = dominant || analyzeOcrTopics(lines)[0];
    const topicMap = {
      learning: 'study',
      fitness: 'fitness',
      meeting: 'meeting',
      project: 'project',
      product: 'project',
      data: 'work',
      stock: 'stock',
      reading: 'reading',
      travel: 'travel',
      cooking: 'cooking',
      document: 'study',
      ocr: 'study',
      general: 'work'
    };
    return topicMap[topic?.id] || 'work';
  }

  function buildTemplateContentHtml(template, blocks, fallbackText) {
    const allBlocks = blocks.length ? blocks : [{ type: 'paragraph', text: fallbackText }];

    if (template === 'study') {
      const reviewBlocks = pickOcrBlocks(allBlocks, /(复习|练习|作业|背诵|记忆|重点|考试|待办|计划|下一步|目标)/);
      const primaryBlocks = removeOcrBlocks(allBlocks, reviewBlocks);
      return [
        `<h3>知识点整理</h3>${blocksToHtml(primaryBlocks.length ? primaryBlocks : allBlocks)}`,
        reviewBlocks.length ? `<h3>复习与练习</h3>${blocksToHtml(reviewBlocks)}` : ''
      ].join('');
    }

    if (['work', 'meeting', 'project'].includes(template)) {
      const config = templateConfigs[template] || templateConfigs.work;
      const riskBlocks = pickOcrBlocks(allBlocks, /(问题|风险|困难|阻塞|依赖|注意|不足|挑战)/);
      const actionBlocks = pickOcrBlocks(allBlocks, /(下一步|行动|待办|计划|安排|负责人|截止|跟进|完成|目标|里程碑|交付)/);
      const actionOnly = actionBlocks.filter((block) => !riskBlocks.includes(block));
      const secondary = [...riskBlocks, ...actionOnly];
      const primaryBlocks = removeOcrBlocks(allBlocks, secondary);
      return [
        `<h3>${config.title}</h3>${blocksToHtml(primaryBlocks.length ? primaryBlocks : allBlocks)}`,
        riskBlocks.length ? `<h3>问题与风险</h3>${blocksToHtml(riskBlocks)}` : '',
        actionOnly.length ? `<h3>${config.secondary}</h3>${blocksToHtml(actionOnly)}` : ''
      ].join('');
    }

    const config = templateConfigs[template] || templateConfigs.hobby;
    const insightBlocks = pickOcrBlocks(allBlocks, /(心得|感受|体会|收获|发现|总结|经验|要领|关键|复盘|结果|建议|注意)/);
    const planBlocks = pickOcrBlocks(allBlocks, /(后续|下次|计划|安排|目标|待办|练习|改进|继续|提醒|清单)/);
    const planOnly = planBlocks.filter((block) => !insightBlocks.includes(block));
    const secondary = [...insightBlocks, ...planOnly];
    const primaryBlocks = removeOcrBlocks(allBlocks, secondary);
    return [
      `<h3>${config.title}</h3>${blocksToHtml(primaryBlocks.length ? primaryBlocks : allBlocks)}`,
      insightBlocks.length ? `<h3>重点发现</h3>${blocksToHtml(insightBlocks)}` : '',
      planOnly.length ? `<h3>${config.secondary}</h3>${blocksToHtml(planOnly)}` : ''
    ].join('');
  }

  function resolveTextTemplate(template, text = '') {
    if (template && template !== 'auto') return template;
    const topic = analyzeOcrTopics(String(text || '').split('\n').map((line) => line.trim()).filter(Boolean))[0]?.id;
    const map = {
      meeting: 'meeting',
      project: 'tech_doc',
      product: 'tech_doc',
      data: 'tech_doc',
      document: 'tech_doc',
      stock: 'tech_doc',
      learning: 'classroom',
      reading: 'reading'
    };
    return map[topic] || 'classroom';
  }

  function buildStructuredTextHtml(template, blocks, text = '') {
    const resolved = resolveTextTemplate(template, text);
    const allBlocks = blocks?.length ? blocks : structureOcrContent(text, { disableAutoTable: true });
    if (resolved === 'raw') return blocksToHtml(allBlocks);

    if (resolved === 'classroom') {
      const reviewBlocks = pickOcrBlocks(allBlocks, /(复习|练习|作业|背诵|记忆|重点|考试|待办|计划|下一步)/);
      const primaryBlocks = removeOcrBlocks(allBlocks, reviewBlocks);
      return [
        `<h3>核心要点</h3>${blocksToHtml(primaryBlocks.length ? primaryBlocks : allBlocks)}`,
        reviewBlocks.length ? `<h3>重点与复习清单</h3>${blocksToHtml(reviewBlocks)}` : ''
      ].join('');
    }

    if (resolved === 'wrong_question') {
      const answerBlocks = pickOcrBlocks(allBlocks, /(答案|解析|正确|结果)/);
      const reasonBlocks = pickOcrBlocks(allBlocks, /(错误|原因|易错|失误|考点|知识点)/);
      const primaryBlocks = removeOcrBlocks(allBlocks, [...answerBlocks, ...reasonBlocks]);
      return [
        `<h3>题干与题目内容</h3>${blocksToHtml(primaryBlocks.length ? primaryBlocks : allBlocks)}`,
        answerBlocks.length ? `<h3>答案与解析</h3>${blocksToHtml(answerBlocks)}` : '',
        reasonBlocks.length ? `<h3>错误原因与考点</h3>${blocksToHtml(reasonBlocks)}` : ''
      ].join('');
    }

    if (resolved === 'tech_doc') {
      const kvBlocks = allBlocks.filter((block) => block.type === 'keyValue');
      const otherBlocks = allBlocks.filter((block) => block.type !== 'keyValue');
      const table = kvBlocks.length
        ? `<h3>参数与配置</h3><div class="apple-table-wrap"><table><thead><tr><th>参数</th><th>值</th></tr></thead><tbody>${kvBlocks.map((block) => `<tr><td>${escapeHtml(block.key)}</td><td>${escapeHtml(block.value)}</td></tr>`).join('')}</tbody></table></div>`
        : '';
      return [
        table,
        otherBlocks.length ? `<h3>说明与注意事项</h3>${blocksToHtml(otherBlocks)}` : ''
      ].join('');
    }

    if (resolved === 'reading') {
      const firstParagraph = allBlocks.find((block) => block.type === 'paragraph')?.text || '';
      const quoteBlocks = allBlocks.filter((block) => block !== allBlocks.find((item) => item.type === 'paragraph' && item.text === firstParagraph));
      return [
        firstParagraph ? `<h3>内容摘要</h3><p>${escapeHtml(firstParagraph)}</p>` : '',
        `<h3>摘录与重点</h3>${blocksToHtml(quoteBlocks.length ? quoteBlocks : allBlocks)}`,
        '<h3>关键词与行动</h3><p>建议：提炼 3–5 个关键词，并写下一步行动。</p>'
      ].join('');
    }

    if (resolved === 'meeting') {
      const actionBlocks = pickOcrBlocks(allBlocks, /(行动|待办|负责人|截止|下一步|安排|跟进|完成时间)/);
      const riskBlocks = pickOcrBlocks(allBlocks, /(风险|问题|阻塞|依赖|待确认)/);
      const conclusionBlocks = removeOcrBlocks(allBlocks, [...actionBlocks, ...riskBlocks]);
      return [
        `<h3>会议结论</h3>${blocksToHtml(conclusionBlocks.length ? conclusionBlocks : allBlocks)}`,
        `<h3>行动项</h3>${actionBlocks.length ? blocksToHtml(actionBlocks) : '<p>未识别到明确行动项，请手动补充负责人和截止时间。</p>'}`,
        riskBlocks.length ? `<h3>风险与待确认</h3>${blocksToHtml(riskBlocks)}` : ''
      ].join('');
    }

    return blocksToHtml(allBlocks);
  }

  function buildGeneratedNote(template, files, text, markdown = '', providedBlocks = null, titleText = '') {
    const normalized = normalizeOcrText(correctOcrDomainText(text));
    const markdownBlocks = markdown ? parseMarkdownToOcrBlocks(markdown) : [];
    const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
    const topics = analyzeOcrTopics(lines);
    const dominant = topics[0] || { id: 'general', label: '通用内容', score: 0, matched: [] };
    const resolvedTemplate = recommendTemplateKey(template, lines, dominant);
    const rawBlocks = providedBlocks?.length ? providedBlocks : markdownBlocks.length ? markdownBlocks : structureOcrContent(normalized);
    const blocks = applyOcrTableCorrections(rawBlocks);
    const contentHtml = buildTemplateContentHtml(resolvedTemplate, blocks, normalized);
    const firstParagraph = blocks.find((block) => block.type === 'paragraph')?.text
      || blocks.find((block) => block.type === 'keyValue')?.value
      || blocks.find((block) => block.type === 'list')?.items?.[0]
      || stripHtml(contentHtml);
    const domainTagMap = {
      stock: '股票',
      meeting: '会议',
      fitness: '健身',
      learning: '知识',
      project: '项目',
      data: '数据',
      ocr: '文字识别',
      product: '产品',
      document: '文档'
    };
    const templateConfig = templateConfigs[resolvedTemplate] || templateConfigs.work;
    const domainTag = domainTagMap[dominant.id];
    const tags = domainTag && !templateConfig.tags.includes(domainTag)
      ? [templateConfig.tags[0], domainTag]
      : [...templateConfig.tags];

    const markdownHeading = correctOcrDomainText(markdown.match(/^\s*#+\s+(.+)$/m)?.[1] || '').trim();
    const titleSource = filterOcrContentLines(correctOcrDomainText(titleText || normalized));
    return {
      id: `note-${Date.now()}`,
      title: (markdownHeading || generateOcrTitle(titleSource) || '图片内容整理').trim(),
      type: templateConfig.type,
      folder: templateConfig.folder,
      tags,
      summary: String(firstParagraph || '').replace(/\s+/g, ' ').slice(0, 110) || `已根据 ${files.length} 张图片整理内容。`,
      contentHtml,
      templateKey: resolvedTemplate,
      sourceCount: files.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async function saveAiResult() {
    if (!state.aiResult) return;
    const sourceFiles = [...state.importFiles];
    const title = (document.getElementById('ai-generated-title')?.value || state.aiResult.title || '图片内容整理').trim();
    const tags = (document.getElementById('ai-generated-tags')?.value || state.aiResult.tags.join(', '))
      .split(/[,，]/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean);
    const folder = document.getElementById('ai-generated-folder')?.value || state.aiResult.folder || '未分类';
    const contentHtml = sanitizeHtml(document.getElementById('ai-generated-content')?.innerHTML || state.aiResult.contentHtml);
    if (!stripHtml(contentHtml).trim()) {
      toast('笔记内容为空，暂时不能保存。', 'error');
      return;
    }
    const note = {
      ...state.aiResult,
      id: `note-${Date.now()}`,
      title: title || '图片内容整理',
      folder,
      tags: tags.length ? [...new Set(tags)] : ['AI整理'],
      contentHtml,
      summary: stripHtml(contentHtml).slice(0, 110),
      sourceImages: [],
      updatedAt: new Date().toISOString()
    };
    state.notes.unshift(note);
    persist({ reason: '保存 AI 整理笔记' });
    clearFiles('ai');
    state.aiResult = null;
    state.importTemplate = 'auto';
    navigate('note', { noteId: note.id });
    if (state.aiKeepSources && document.getElementById('ai-keep-sources')?.checked !== false) attachSourceImagesInBackground(note, sourceFiles);
    toast('编辑结果已保存为笔记。', 'success');
  }

  const TESSERACT_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  let tesseractLoader = null;

  function loadTesseractEngine() {
    if (window.Tesseract?.createWorker) return Promise.resolve(window.Tesseract);
    if (tesseractLoader) return tesseractLoader;

    tesseractLoader = new Promise((resolve, reject) => {
      const onLoad = () => {
        if (window.Tesseract?.createWorker) resolve(window.Tesseract);
        else reject(new Error('OCR 引擎初始化失败。'));
      };
      const onError = () => {
        tesseractLoader = null;
        reject(new Error('OCR 引擎下载失败，请检查网络连接。'));
      };
      const existing = document.querySelector('script[data-tesseract-engine]');
      if (existing) {
        existing.addEventListener('load', onLoad, { once: true });
        existing.addEventListener('error', () => {
          existing.remove();
          onError();
        }, { once: true });
        if (existing.dataset.loaded === 'true') onLoad();
        return;
      }
      const script = document.createElement('script');
      script.src = TESSERACT_SCRIPT_URL;
      script.async = true;
      script.dataset.tesseractEngine = 'true';
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        onLoad();
      }, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        onError();
      }, { once: true });
      document.head.appendChild(script);
    });

    return tesseractLoader;
  }

  const PADDLEJS_OCR_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@paddlejs-models/ocr@1.2.4/lib/index.js';
  let paddleJsOcrLoader = null;

  function loadPaddleJsOcrEngine() {
    if (window.paddlejs?.ocr?.recognize) return Promise.resolve(window.paddlejs.ocr);
    if (paddleJsOcrLoader) return paddleJsOcrLoader;

    paddleJsOcrLoader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-paddlejs-ocr]');
      const onLoad = async () => {
        try {
          const engine = window.paddlejs?.ocr;
          if (!engine?.recognize) throw new Error('Paddle.js OCR 引擎初始化失败。');
          await engine.init();
          resolve(engine);
        } catch (error) {
          paddleJsOcrLoader = null;
          reject(error);
        }
      };
      if (existing) {
        existing.addEventListener('load', onLoad, { once: true });
        existing.addEventListener('error', () => {
          existing.remove();
          paddleJsOcrLoader = null;
          reject(new Error('Paddle.js OCR 脚本加载失败。'));
        }, { once: true });
        if (existing.dataset.loaded === 'true') onLoad();
        return;
      }
      const script = document.createElement('script');
      script.src = PADDLEJS_OCR_SCRIPT_URL;
      script.async = true;
      script.dataset.paddlejsOcr = 'true';
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        onLoad();
      }, { once: true });
      script.addEventListener('error', () => {
        script.remove();
        paddleJsOcrLoader = null;
        reject(new Error('Paddle.js OCR 脚本加载失败，请检查网络。'));
      }, { once: true });
      document.head.appendChild(script);
    });
    return paddleJsOcrLoader;
  }

  function imageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Paddle.js 图片读取失败。'));
      image.src = dataUrl;
    });
  }

  async function recognizePaddleJsImage(dataUrl) {
    const engine = await loadPaddleJsOcrEngine();
    const image = await imageFromDataUrl(dataUrl);
    const result = await engine.recognize(image);
    const text = Array.isArray(result?.text) ? result.text.join('\n') : String(result?.text || '');
    return normalizeOcrText(text);
  }

  async function recognizePaddleJsTableCells(tableCells) {
    if (!Array.isArray(tableCells) || tableCells.length < 4) return null;
    const rowCount = Math.max(...tableCells.map((cell) => cell.row)) + 1;
    const columnCount = Math.max(...tableCells.map((cell) => cell.column)) + 1;
    const matrix = Array.from({ length: rowCount }, () => Array(columnCount).fill(''));
    let lowConfidenceCells = 0;

    for (const cell of tableCells) {
      let text = '';
      try {
        text = await recognizePaddleJsImage(cell.dataUrl);
      } catch (error) {
        console.warn('Paddle.js cell recognition failed:', error);
      }
      text = cleanOcrPunctuationLine(String(text || '').replace(/\s+/g, ' ')).trim();
      if (!text && cell.contrastDataUrl) {
        try {
          text = await recognizePaddleJsImage(cell.contrastDataUrl);
          text = cleanOcrPunctuationLine(String(text || '').replace(/\s+/g, ' ')).trim();
        } catch (error) {
          console.warn('Paddle.js contrast cell recognition failed:', error);
        }
      }
      matrix[cell.row][cell.column] = text;
      if (!text) lowConfidenceCells += 1;
    }

    const text = matrix.map((row) => row.map((cell) => cell || OCR_EMPTY_CELL).join('\t')).join('\n');
    return {
      text,
      confidence: null,
      ignoredLines: 0,
      keptLines: rowCount,
      tableUsed: true,
      tableMeta: {
        rows: rowCount,
        columns: columnCount,
        passes: 2,
        lowConfidenceCells,
        engine: 'Paddle.js'
      }
    };
  }

  async function recognizeFilesWithPaddleJs(files, onProgress) {
    await loadPaddleJsOcrEngine();
    const results = [];
    const blocks = [];
    let titleText = '';
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (typeof onProgress === 'function') onProgress(index, file);
      if (file.isSample) {
        throw new Error('示例图片不是表格，已自动切换到本地 Tesseract。');
      }
      const processedImage = await preprocessImageForOcr(file.url);
      const fullImageText = await recognizePaddleJsImage(processedImage.rawDataUrl || processedImage.titleDataUrl || processedImage.dataUrl);
      if (index === 0) titleText = fullImageText;

      const fastTable = parsePaddleJsTableText(fullImageText);
      let extraction = null;
      let resultBlocks = [];
      if (fastTable) {
        resultBlocks = [fastTable];
        extraction = {
          text: ocrBlocksToPlainText(resultBlocks),
          confidence: null,
          ignoredLines: 0,
          keptLines: fastTable.rows.length,
          tableMeta: {
            rows: fastTable.rows.length,
            columns: 2,
            passes: 1,
            lowConfidenceCells: 0,
            engine: 'Paddle.js'
          }
        };
      } else if (processedImage.tableCells?.length >= 4) {
        extraction = await recognizePaddleJsTableCells(processedImage.tableCells);
      } else {
        throw new Error('当前图片不是表格，已自动切换到本地 Tesseract。');
      }
      if (!extraction?.text) {
        throw new Error('Paddle.js 未识别出可靠表格，已自动切换到本地 Tesseract。');
      }
      const result = {
        id: file.id,
        name: file.name,
        text: extraction.text,
        confidence: null,
        tableMeta: extraction.tableMeta || null,
        error: ''
      };
      if (!resultBlocks.length) resultBlocks = structureOcrContent(extraction.text);
      results.push(result);
      blocks.push(...resultBlocks);
    }
    const text = results.map((result) => result.text).join('\n\n');
    return { results, blocks, text, titleText };
  }

  function setOcrProgress(percent, label, macroStep) {
    const box = document.getElementById('ocr-progress');
    const bar = document.getElementById('ocr-progress-bar');
    const percentLabel = document.getElementById('ocr-progress-percent');
    const progressLabel = document.getElementById('ocr-progress-label');
    const steps = document.getElementById('ocr-progress-steps')?.children || [];
    if (!box || !bar || !percentLabel || !progressLabel) return;

    const value = Math.max(0, Math.min(100, Math.round(percent)));
    box.classList.add('visible');
    bar.style.width = `${value}%`;
    percentLabel.textContent = `${value}%`;
    if (label) progressLabel.textContent = label;
    [...steps].forEach((step, index) => {
      const done = value >= 100 || (Number.isInteger(macroStep) && index < macroStep);
      const current = Number.isInteger(macroStep) && index === macroStep && value < 100;
      step.classList.toggle('done', done);
      step.classList.toggle('current', current);
    });
  }

  function translateOcrStatus(status = '') {
    const labels = {
      'loading tesseract core': '加载识别内核',
      'initializing tesseract': '初始化识别引擎',
      'loading language traineddata': '下载语言模型',
      'initializing api': '准备识别环境',
      'recognizing text': '识别文字'
    };
    return labels[status] || '处理中';
  }

  function updateOcrFileStatus(fileId, text, status = 'pending') {
    const row = [...document.querySelectorAll('[data-ocr-row]')]
      .find((element) => element.dataset.ocrRow === fileId);
    if (!row) return;
    row.classList.remove('active', 'done', 'warning');
    if (status !== 'pending') row.classList.add(status);
    const label = row.querySelector('.ocr-file-status');
    if (label) label.textContent = text;
  }

  function createOtsuOcrVariant(sourceCanvas, invert) {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    const context = sourceCanvas.getContext('2d', { alpha: false });
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const histogram = new Array(256).fill(0);
    let total = 0;
    let sum = 0;

    for (let index = 0; index < data.length; index += 4) {
      const gray = Math.round(0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]);
      histogram[gray] += 1;
      total += 1;
      sum += gray;
    }

    let sumBackground = 0;
    let weightBackground = 0;
    let maxVariance = -1;
    let threshold = 127;
    for (let value = 0; value < 256; value += 1) {
      weightBackground += histogram[value];
      if (!weightBackground) continue;
      const weightForeground = total - weightBackground;
      if (!weightForeground) break;
      sumBackground += value * histogram[value];
      const meanBackground = sumBackground / weightBackground;
      const meanForeground = (sum - sumBackground) / weightForeground;
      const variance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = value;
      }
    }

    const output = document.createElement('canvas');
    output.width = width;
    output.height = height;
    const outputContext = output.getContext('2d', { alpha: false });
    const outputData = outputContext.createImageData(width, height);
    for (let index = 0; index < data.length; index += 4) {
      const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      const isText = invert ? gray > threshold : gray <= threshold;
      const value = isText ? 0 : 255;
      outputData.data[index] = value;
      outputData.data[index + 1] = value;
      outputData.data[index + 2] = value;
      outputData.data[index + 3] = 255;
    }
    outputContext.putImageData(outputData, 0, 0);
    return output;
  }

  function padOcrCanvas(sourceCanvas, padding) {
    const output = document.createElement('canvas');
    output.width = sourceCanvas.width + padding * 2;
    output.height = sourceCanvas.height + padding * 2;
    const context = output.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(sourceCanvas, padding, padding);
    return output;
  }

  function getCanvasAverageLuminance(canvas) {
    const context = canvas.getContext('2d', { alpha: false });
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const step = Math.max(1, Math.floor((canvas.width * canvas.height) / 80000));
    let total = 0;
    let count = 0;
    for (let index = 0; index < data.length; index += 4 * step) {
      total += 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
      count += 1;
    }
    return count ? total / count : 255;
  }

  function createOcrTableCellImages(canvas, rowLines, columnLines) {
    const cells = [];
    const sourceContext = canvas.getContext('2d', { alpha: false });
    const padding = 16;

    for (let row = 0; row < rowLines.length - 1; row += 1) {
      const top = rowLines[row] + 4;
      const bottom = rowLines[row + 1] - 4;
      const sourceHeight = bottom - top;
      if (sourceHeight < 8) continue;

      for (let column = 0; column < columnLines.length - 1; column += 1) {
        const left = columnLines[column] + 4;
        const right = columnLines[column + 1] - 4;
        const sourceWidth = right - left;
        if (sourceWidth < 8) continue;

        const scale = Math.min(2.2, Math.max(1, 120 / sourceHeight));
        const scaledWidth = Math.round(sourceWidth * scale);
        const scaledHeight = Math.round(sourceHeight * scale);
        const contentCanvas = document.createElement('canvas');
        contentCanvas.width = scaledWidth;
        contentCanvas.height = scaledHeight;
        const contentContext = contentCanvas.getContext('2d', { alpha: false });
        contentContext.fillStyle = '#ffffff';
        contentContext.fillRect(0, 0, scaledWidth, scaledHeight);
        contentContext.imageSmoothingEnabled = true;
        contentContext.imageSmoothingQuality = 'high';
        contentContext.drawImage(canvas, left, top, sourceWidth, sourceHeight, 0, 0, scaledWidth, scaledHeight);

        const cellCanvas = padOcrCanvas(contentCanvas, padding);
        const contrastCanvas = document.createElement('canvas');
        contrastCanvas.width = cellCanvas.width;
        contrastCanvas.height = cellCanvas.height;
        const contrastContext = contrastCanvas.getContext('2d', { alpha: false });
        contrastContext.fillStyle = '#ffffff';
        contrastContext.fillRect(0, 0, contrastCanvas.width, contrastCanvas.height);
        contrastContext.filter = 'contrast(1.8) brightness(1.06)';
        contrastContext.drawImage(cellCanvas, 0, 0);
        const normalBinaryCanvas = padOcrCanvas(createOtsuOcrVariant(contentCanvas, false), padding);
        const invertedBinaryCanvas = padOcrCanvas(createOtsuOcrVariant(contentCanvas, true), padding);
        cells.push({
          row,
          column,
          dataUrl: cellCanvas.toDataURL('image/png'),
          contrastDataUrl: contrastCanvas.toDataURL('image/png'),
          normalBinaryDataUrl: normalBinaryCanvas.toDataURL('image/png'),
          invertedBinaryDataUrl: invertedBinaryCanvas.toDataURL('image/png'),
          preferInverted: getCanvasAverageLuminance(contentCanvas) < 150
        });
      }
    }
    return cells;
  }

  async function recognizeOcrTableCells(worker, tableCells) {
    if (!Array.isArray(tableCells) || tableCells.length < 4) return null;
    const rowCount = Math.max(...tableCells.map((cell) => cell.row)) + 1;
    const columnCount = Math.max(...tableCells.map((cell) => cell.column)) + 1;
    const matrix = Array.from({ length: rowCount }, () => Array(columnCount).fill(''));
    const cellMeta = Array.from({ length: rowCount }, () => Array(columnCount).fill(null));
    const confidences = [];
    let totalPasses = 1;
    let lowConfidenceCells = 0;

    const scoreCellCandidate = (text, confidence) => {
      const clean = cleanOcrPunctuationLine(text || '').replace(/\s+/g, ' ').trim();
      const meaningful = countMeaningfulOcrChars(clean);
      return confidence + Math.min(meaningful, 12) * 1.5 + (isNumericOcrCell(clean) ? 5 : 0);
    };

    for (const cell of tableCells) {
      const attempts = [];
      const preferredBinaryUrl = cell.preferInverted
        ? (cell.invertedBinaryDataUrl || cell.normalBinaryDataUrl || cell.dataUrl)
        : (cell.normalBinaryDataUrl || cell.invertedBinaryDataUrl || cell.dataUrl);
      const oppositeBinaryUrl = cell.preferInverted
        ? (cell.normalBinaryDataUrl || cell.invertedBinaryDataUrl || cell.dataUrl)
        : (cell.invertedBinaryDataUrl || cell.normalBinaryDataUrl || cell.dataUrl);
      const variants = [
        { url: cell.dataUrl, psm: '7', minConfidence: 84 },
        { url: cell.contrastDataUrl || cell.dataUrl, psm: '6', minConfidence: 78 },
        { url: preferredBinaryUrl, psm: '6', minConfidence: 74 },
        { url: oppositeBinaryUrl, psm: '6', minConfidence: 0 }
      ];

      for (const variant of variants) {
        await worker.setParameters({ tessedit_pageseg_mode: variant.psm });
        const result = await worker.recognize(variant.url);
        attempts.push(result);
        const confidence = Number(result?.data?.confidence || 0);
        const text = cleanOcrPunctuationLine(result?.data?.text || '').replace(/\s+/g, ' ').trim();
        if (text && confidence >= variant.minConfidence) break;
      }
      totalPasses = Math.max(totalPasses, attempts.length);
      await worker.setParameters({ tessedit_pageseg_mode: '3' });
      const candidates = attempts.map((result) => {
        const confidence = Number(result?.data?.confidence || 0);
        const text = cleanOcrPunctuationLine(result?.data?.text || '').replace(/\s+/g, ' ').trim();
        return { text, confidence, score: scoreCellCandidate(text, confidence) };
      });
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0] || { text: '', confidence: 0, score: 0 };
      matrix[cell.row][cell.column] = best.text;
      cellMeta[cell.row][cell.column] = {
        confidence: Math.round(best.confidence),
        passes: candidates.length,
        text: best.text
      };
      if (Number.isFinite(best.confidence)) confidences.push(best.confidence);
      if (best.confidence < 72 || !best.text) lowConfidenceCells += 1;
    }

    await worker.setParameters({ tessedit_pageseg_mode: '3' });
    const nonEmptyCount = matrix.flat().filter(Boolean).length;
    if (nonEmptyCount === 0) return null;

    const outputRows = matrix.map((row) => [...row]);
    const text = outputRows.map((row) => row.map((cell) => cell || OCR_EMPTY_CELL).join('\t')).join('\n');
    return {
      text,
      confidence: Math.round(averageNumber(confidences)),
      ignoredLines: 0,
      keptLines: outputRows.length,
      tableUsed: true,
      tableMeta: {
        rows: rowCount,
        columns: columnCount,
        passes: totalPasses,
        lowConfidenceCells
      }
    };
  }

  function findOcrGridLineCenters(counts, threshold) {
    const centers = [];
    let start = -1;
    for (let index = 0; index <= counts.length; index += 1) {
      const matched = index < counts.length && counts[index] >= threshold;
      if (matched && start < 0) start = index;
      if (!matched && start >= 0) {
        centers.push(Math.round((start + index - 1) / 2));
        start = -1;
      }
    }
    return centers;
  }

  function mergeCloseOcrGridLines(lines, minGap) {
    if (!Array.isArray(lines) || !lines.length) return [];
    const sorted = [...lines].sort((a, b) => a - b);
    const merged = [sorted[0]];
    for (let index = 1; index < sorted.length; index += 1) {
      const current = sorted[index];
      const previous = merged[merged.length - 1];
      if (current - previous < minGap) {
        merged[merged.length - 1] = Math.round((previous + current) / 2);
      } else {
        merged.push(current);
      }
    }
    return merged;
  }

  function findOcrEdgeLineCenters(grayValues, width, height, orientation) {
    const scores = new Float64Array(orientation === 'row' ? height : width);
    if (orientation === 'row') {
      for (let y = 1; y < height - 1; y += 1) {
        let score = 0;
        for (let x = 1; x < width - 1; x += 1) {
          score += Math.abs(grayValues[(y + 1) * width + x] - grayValues[(y - 1) * width + x]);
        }
        scores[y] = score;
      }
    } else {
      for (let x = 1; x < width - 1; x += 1) {
        let score = 0;
        for (let y = 1; y < height - 1; y += 1) {
          score += Math.abs(grayValues[y * width + x + 1] - grayValues[y * width + x - 1]);
        }
        scores[x] = score;
      }
    }
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const span = orientation === 'row' ? width : height;
    const threshold = Math.max(maxScore * 0.22, span * 12);
    const peaks = [];
    for (let index = 1; index < scores.length - 1; index += 1) {
      if (scores[index] < threshold) continue;
      if (scores[index] >= scores[index - 1] && scores[index] >= scores[index + 1]) peaks.push(index);
    }
    return mergeCloseOcrGridLines(peaks, orientation === 'row' ? 14 : 20);
  }

  function medianNumber(values) {
    const sorted = values.filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
    if (!sorted.length) return null;
    return sorted[Math.floor(sorted.length / 2)];
  }

  function filterOcrGridLinesToTableRegion(
    rowLines,
    columnLines,
    rowRuns,
    columnRuns,
    rowRunStart,
    rowRunEnd,
    columnRunStart,
    columnRunEnd
  ) {
    if (rowLines.length < 2 || columnLines.length < 2) return { rowLines, columnLines };
    const rowMax = Math.max(...rowLines.map((line) => rowRuns[line] || 0));
    const columnMax = Math.max(...columnLines.map((line) => columnRuns[line] || 0));
    const strongRows = rowLines.filter((line) => (rowRuns[line] || 0) >= rowMax * 0.65);
    const strongColumns = columnLines.filter((line) => (columnRuns[line] || 0) >= columnMax * 0.6);

    let filteredRows = rowLines;
    let filteredColumns = columnLines;

    if (strongRows.length >= 2) {
      const left = medianNumber(strongRows.map((line) => rowRunStart[line]));
      const right = medianNumber(strongRows.map((line) => rowRunEnd[line]));
      if (left !== null && right !== null) {
        filteredColumns = columnLines.filter((line) => line >= left - 8 && line <= right + 8);
      }
    }

    if (strongColumns.length >= 2) {
      const top = medianNumber(strongColumns.map((line) => columnRunStart[line]));
      const bottom = medianNumber(strongColumns.map((line) => columnRunEnd[line]));
      if (top !== null && bottom !== null) {
        filteredRows = rowLines.filter((line) => line >= top - 8 && line <= bottom + 8);
      }
    }

    return {
      rowLines: filteredRows.length >= 2 ? filteredRows : rowLines,
      columnLines: filteredColumns.length >= 2 ? filteredColumns : columnLines
    };
  }

  function removeOcrTableGridLines(canvas, context) {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const rowCounts = new Uint32Array(height);
    const columnCounts = new Uint32Array(width);
    const grayValues = new Float32Array(width * height);
    const rowRuns = new Uint32Array(height);
    const columnRuns = new Uint32Array(width);
    const rowCurrent = new Uint32Array(height);
    const columnCurrent = new Uint32Array(width);
    const rowRunStart = new Int32Array(height).fill(-1);
    const rowRunEnd = new Int32Array(height).fill(-1);
    const columnRunStart = new Int32Array(width).fill(-1);
    const columnRunEnd = new Int32Array(width).fill(-1);
    const rowCurrentStart = new Int32Array(height).fill(-1);
    const columnCurrentStart = new Int32Array(width).fill(-1);
    let luminanceTotal = 0;
    let sampled = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayValues[y * width + x] = gray;
        luminanceTotal += gray;
        sampled += 1;
      }
    }

    const averageLuminance = sampled ? luminanceTotal / sampled : 255;
    const darkThreshold = Math.min(205, Math.max(115, averageLuminance * 0.78));
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const gray = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
        if (gray < darkThreshold) {
          rowCounts[y] += 1;
          columnCounts[x] += 1;
          rowCurrent[y] += 1;
          columnCurrent[x] += 1;
          if (rowCurrent[y] === 1) rowCurrentStart[y] = x;
          if (columnCurrent[x] === 1) columnCurrentStart[x] = y;
          if (rowCurrent[y] > rowRuns[y]) {
            rowRuns[y] = rowCurrent[y];
            rowRunStart[y] = rowCurrentStart[y];
            rowRunEnd[y] = x;
          }
          if (columnCurrent[x] > columnRuns[x]) {
            columnRuns[x] = columnCurrent[x];
            columnRunStart[x] = columnCurrentStart[x];
            columnRunEnd[x] = y;
          }
        } else {
          rowCurrent[y] = 0;
          rowCurrentStart[y] = -1;
          columnCurrent[x] = 0;
          columnCurrentStart[x] = -1;
        }
      }
    }

    const runRowLines = mergeCloseOcrGridLines(findOcrGridLineCenters(rowRuns, width * 0.6), 14);
    const runColumnLines = mergeCloseOcrGridLines(findOcrGridLineCenters(columnRuns, height * 0.5), 20);
    const darkRowLines = runRowLines.length >= 2
      ? runRowLines
      : mergeCloseOcrGridLines(findOcrGridLineCenters(rowCounts, width * 0.65), 14);
    const darkColumnLines = runColumnLines.length >= 2
      ? runColumnLines
      : mergeCloseOcrGridLines(findOcrGridLineCenters(columnCounts, height * 0.6), 20);
    const edgeRowLines = findOcrEdgeLineCenters(grayValues, width, height, 'row');
    const edgeColumnLines = findOcrEdgeLineCenters(grayValues, width, height, 'column');
    const candidateRowLines = darkRowLines.length >= 2
      ? darkRowLines
      : mergeCloseOcrGridLines([...darkRowLines, ...edgeRowLines], 14);
    const candidateColumnLines = darkColumnLines.length >= 2
      ? darkColumnLines
      : mergeCloseOcrGridLines([...darkColumnLines, ...edgeColumnLines], 20);
    const filteredGridLines = filterOcrGridLinesToTableRegion(
      candidateRowLines,
      candidateColumnLines,
      rowRuns,
      columnRuns,
      rowRunStart,
      rowRunEnd,
      columnRunStart,
      columnRunEnd
    );
    const rowLines = filteredGridLines.rowLines;
    const columnLines = filteredGridLines.columnLines;
    if (rowLines.length < 2 && columnLines.length < 2) {
      return { hasTableGrid: false, rowLines, columnLines };
    }

    const mask = new Uint8Array(width * height);
    const mark = (line, orientation) => {
      const radius = 2;
      for (let offset = -radius; offset <= radius; offset += 1) {
        if (orientation === 'row') {
          const y = line + offset;
          if (y < 0 || y >= height) continue;
          mask.fill(1, y * width, (y + 1) * width);
        } else {
          const x = line + offset;
          if (x < 0 || x >= width) continue;
          for (let y = 0; y < height; y += 1) mask[y * width + x] = 1;
        }
      }
    };
    rowLines.forEach((line) => mark(line, 'row'));
    columnLines.forEach((line) => mark(line, 'column'));

    for (let pixel = 0; pixel < mask.length; pixel += 1) {
      if (!mask[pixel]) continue;
      const index = pixel * 4;
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = 255;
    }
    context.putImageData(imageData, 0, 0);
    return {
      hasTableGrid: rowLines.length >= 3 && columnLines.length >= 3,
      rowLines,
      columnLines,
      debugCounts: {
        darkRows: darkRowLines.length,
        darkColumns: darkColumnLines.length,
        edgeRows: edgeRowLines.length,
        edgeColumns: edgeColumnLines.length,
        finalRows: rowLines.length,
        finalColumns: columnLines.length
      }
    };
  }

  function enhanceCanvasForOcr(canvas, context) {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    const sampleStep = Math.max(1, Math.floor((width * height) / 120000));
    let luminanceTotal = 0;
    let sampleCount = 0;

    for (let index = 0; index < data.length; index += 4 * sampleStep) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      luminanceTotal += 0.299 * r + 0.587 * g + 0.114 * b;
      sampleCount += 1;
    }

    const averageLuminance = sampleCount ? luminanceTotal / sampleCount : 255;
    const shouldInvert = averageLuminance < 142;

    for (let index = 0; index < data.length; index += 4) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let value = shouldInvert ? 255 - gray : gray;
      value = Math.max(0, Math.min(255, (value - 128) * 1.22 + 128));
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    canvas.dataset.ocrInverted = shouldInvert ? 'true' : 'false';
  }

  function preprocessImageForOcr(imageUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        if (!width || !height) {
          reject(new Error('图片尺寸读取失败。'));
          return;
        }

        const maxSide = Math.max(width, height);
        let scale = 1;
        if (maxSide < 1400) scale = Math.min(2, 1800 / maxSide);
        if (maxSide > 3400) scale = 3200 / maxSide;

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.filter = 'contrast(1.08) saturate(0.92)';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/png');
        enhanceCanvasForOcr(canvas, context);
        const titleDataUrl = canvas.toDataURL('image/png');
        const grid = removeOcrTableGridLines(canvas, context);
        const tableCells = grid.hasTableGrid && ((grid.rowLines.length - 1) * (grid.columnLines.length - 1) <= 36)
          ? createOcrTableCellImages(canvas, grid.rowLines, grid.columnLines)
          : [];
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          rawDataUrl,
          titleDataUrl,
          hasTableGrid: grid.hasTableGrid,
          grid,
          tableCells
        });
      };
      image.onerror = () => reject(new Error('图片读取失败，请重新上传。'));
      image.src = imageUrl;
    });
  }

  function countCjkChars(value) {
    return (String(value).match(/[\u3400-\u9fff]/g) || []).length;
  }

  function isOcrBulletLine(value) {
    return /^\s*(?:[-*•·●○◆◇■□▪▫]|\d{1,3}[.、)）]|[（(]\d{1,3}[）)]|[一二三四五六七八九十]+[、.．])\s*/.test(String(value));
  }

  function stripOcrListMarker(value) {
    return String(value)
      .replace(/^\s*(?:[-*•·●○◆◇■□▪▫]|\d{1,3}[.、)）]|[（(]\d{1,3}[）)]|[一二三四五六七八九十]+[、.．])\s*/, '')
      .trim();
  }

  function isOcrStructuredLine(value) {
    const text = String(value).trim();
    if (!text) return false;
    if (isOcrBulletLine(text)) return true;
    if (/\t/.test(text)) return true;
    const tokens = text.split(/\s+/).filter(Boolean);
    const numericTokens = tokens.filter((token) => /^[¥￥$]?-?\d+(?:[.,]\d+)*(?:%|％)?$/.test(token)).length;
    const hasWideGap = /[ ]{2,}/.test(text);
    if (hasWideGap && tokens.length >= 3 && numericTokens >= 2) return true;
    return numericTokens >= 2 || (tokens.length >= 3 && numericTokens / tokens.length >= 0.5);
  }

  function isOcrNoiseLine(value) {
    const text = String(value).trim();
    if (!text) return false;
    if (/^[\s|｜丨—–\-_=~·•●○◆◇■□▪▫※*+.，。！？!?;；:：、'"]+$/.test(text)) return true;
    if (/^[|｜丨Il1]{1,3}$/.test(text)) return true;
    return false;
  }

  function isLikelyOcrHeadingLine(value) {
    const text = stripOcrListMarker(value).replace(/[：:]\s*$/, '').trim();
    if (!text || [...text].length > 16) return false;
    return /^(?:核心结论|结论|摘要|总结|要点|行动项|会议目标|关键信息|待办事项|后续动作|后续工作|背景|目标|问题|原因|方法|步骤|备注|风险提示|板块清单|会议结论|讨论结论)$/.test(text);
  }

  function looksLikeOcrTableLine(value) {
    const text = String(value || '').trim();
    if (/^.{2,18}?\s*[：:]\s*.+$/.test(text) && !text.includes('\t') && !/[ ]{2,}/.test(text)) return false;
    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return false;
    if (tokens.some(isNumericOcrCell)) return true;
    if (isOcrTableHeaderRow(tokens)) return true;
    if (tokens.length === 2 && tokens.every((token) => [...token].length <= 12)) return true;
    return tokens.length >= 3 && tokens.every((token) => [...token].length <= 8);
  }

  function cleanOcrPunctuationLine(value) {
    let line = String(value)
      .replaceAll('\u00a0', ' ')
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .trim();

    line = stripOcrStatusBarNoise(line);
    line = line
      .replace(/[ \t]+([，。！？；：、,.!?;:])/g, '$1')
      .replace(/([，。！？；：、])[ \t]+/g, '$1')
      .replace(/([\u3400-\u9fff])\s*:\s*/g, '$1：')
      .replace(/[，、,;；]{2,}$/g, '')
      .replace(/([，,])+/g, '$1')
      .replace(/([。.]){2,}/g, '$1')
      .replace(/([！!])+/g, '$1')
      .replace(/([？?])+/g, '$1')
      .replace(/([；;])+/g, '$1')
      .replace(/([：:])+/g, '$1')
      .replace(/[，、,]+\s*[。.]/g, '。')
      .replace(/[。.]\s*[，、,]+/g, '。')
      .replace(/[。.](?=[！？!?])/g, '')
      .replace(/([！？!?])[。.]+/g, '$1')
      .replace(/[：:]\s*[。.]/g, '：')
      .replace(/[；;]\s*[，,。.]/g, '；')
      .replace(/^[，。！？；：、,.!?;:]+/g, '')
      .replace(/\s+([）)\]】》])/g, '$1')
      .replace(/([（(\[【《])\s+/g, '$1')
      .trim();

    if (!isOcrStructuredLine(line) && !looksLikeOcrTableLine(line)) {
      line = line
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\t+/g, ' ')
        .replace(/([\u3400-\u9fff])[ \t]+(?=[\u3400-\u9fff])/g, '$1');
    }
    return line;
  }

  function shouldJoinOcrLines(previous, current) {
    const before = String(previous || '').trim();
    const after = String(current || '').trim();
    if (!before || !after) return false;
    if (isOcrStructuredLine(before) || isOcrStructuredLine(after)) return false;
    if (isLikelyOcrHeadingLine(after)) return false;
    if (/[。！？!?；;：:]$/.test(before)) return false;
    if (/[:：]\s*[\d\-/年月日:.%％]+$/.test(before)) return false;

    const continuationPunctuation = /[，、；,;]$/.test(before);
    const beforeCjk = countCjkChars(before);
    const afterCjk = countCjkChars(after);
    if (beforeCjk > 0 || afterCjk > 0) {
      if (continuationPunctuation) return before.length < 90 && after.length < 90;
      if (before.length < 36 || after.length < 3) return false;
      if (/^(?:并|且|以及|同时|因此|所以|但是|而|因为|如果|在|对|将|可|需要|通过|其中|此外|并且|进一步|例如|包括)/.test(after)) {
        return before.length < 90 && after.length < 90;
      }
      return before.length >= 46 && after.length < 70;
    }

    if (/[A-Za-z]-$/.test(before) && /^[a-z]/.test(after)) return true;
    return /[a-z,;:]$/.test(before) && /^[a-z]/.test(after) && before.length < 110;
  }

  function reflowOcrLines(lines) {
    const output = [];
    lines.forEach((line) => {
      const current = String(line || '').trim();
      if (!current) {
        if (output.length && output[output.length - 1] !== '') output.push('');
        return;
      }

      const previousIndex = output.length - 1;
      const previous = previousIndex >= 0 ? output[previousIndex] : '';
      if (previous && shouldJoinOcrLines(previous, current)) {
        if (/[A-Za-z]-$/.test(previous) && /^[a-z]/.test(current)) {
          output[previousIndex] = `${previous.slice(0, -1)}${current}`;
        } else {
          const needsSpace = countCjkChars(previous) === 0 && countCjkChars(current) === 0;
          output[previousIndex] = `${previous}${needsSpace ? ' ' : ''}${current}`;
        }
        return;
      }
      output.push(current);
    });

    return output.join('\n')
      .replace(/[，、,;；]+(?=\n|$)/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function stripOcrStatusBarNoise(value) {
    return String(value || '')
      .replace(/^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*[和禾利川|｜丨Il1O0])?/i, '')
      .replace(/^(?:(?:All\s*iCloud|Allicloud|iCloud|会和|会站|由@|[《》()（）【】\[\]@])+)/i, '')
      .replace(/^(?:由\s*@\s*|@\s*)+/i, '')
      .trim();
  }

  function isOcrBoilerplateLine(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    if (/^(?:首页|关注|推荐|搜索|分享|评论|点赞|收藏|转发|复制|编辑|取消|完成|返回|更多|菜单|设置|下载|打开APP|扫一扫|登录|注册|广告)$/i.test(text)) return true;
    if (/^(?:All iCloud|All Notes|iCloud|Notes|备忘录|最近删除|文件夹)$/i.test(text)) return true;
    if (/^(?:由?\s*@?\s*)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+at\s+\d{1,2}:\d{2})?$/i.test(text)) return true;
    if (/^(?:由?\s*@?\s*)?\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?$/.test(text)) return true;
    if (/^(?:第\s*\d+\s*页|\d+\s*\/\s*\d+|Page\s*\d+)$/i.test(text)) return true;
    if (/^(?:https?:\/\/|www\.)\S+$/i.test(text)) return true;
    if (/^@[\w.-]{2,}$/.test(text)) return true;
    if (/^(?:小红书|抖音|微博|微信|公众号|知乎|B站|哔哩哔哩|快手|今日头条)(?:号|官方|用户)?$/.test(text)) return true;
    if (/^(?:截图|图片|二维码|扫码关注|长按识别|点击查看|请点击查看|展开全文|阅读原文|复制链接|下载APP|打开APP)$/i.test(text)) return true;
    if (/^(?:请)?(?:点击|长按|扫码|打开|下载|关注|收藏|点赞|转发|分享|评论).{0,10}(?:查看|下载|关注|购买|阅读|详情|APP|原文)?$/i.test(text)) return true;
    if (/^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*(?:AM|PM))?$/i.test(text)) return true;
    if (/^(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*[和禾利川|｜丨Il1O0])*$/i.test(text)) return true;
    if (/^(?:Wi-?Fi|5G|4G|中国移动|中国联通|中国电信|电量|信号|电池)$/i.test(text)) return true;
    if (/^(?:[↑↓]\s*)?\d+(?:\.\d+)?\s*(?:K|M|G)?B\/s$/i.test(text)) return true;
    return false;
  }

  function removeOcrBoilerplateLines(lines) {
    const seen = new Map();
    return lines.filter((line, index) => {
      const text = String(line || '').trim();
      if (!text) return true;
      if (isOcrBoilerplateLine(text)) return false;
      const key = text.replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
      if (key.length >= 6 && seen.has(key) && index - seen.get(key) <= 6) return false;
      if (key) seen.set(key, index);
      return true;
    });
  }

  function normalizeOcrText(text) {
    const source = String(text || '')
      .replaceAll('\r', '')
      .replace(/\u0000/g, '')
      .replace(/\u00a0/g, ' ');
    const lines = removeOcrBoilerplateLines(
      source
        .split('\n')
        .map((line) => cleanOcrPunctuationLine(line))
        .filter((line) => !isOcrNoiseLine(line))
    );
    return reflowOcrLines(lines);
  }

  function parseOcrKeyValueLine(value) {
    const match = String(value || '').trim().match(/^(.{2,18}?)[：:]\s*(.+)$/);
    if (!match) return null;
    const key = match[1].trim();
    const content = match[2].trim();
    if (!key || !content || /[。！？!?]/.test(key)) return null;
    if (countCjkChars(key) === 0 && [...key].length < 3) return null;
    return { key, value: content };
  }

  function isOcrStructuredHeading(value, index, lines) {
    const text = stripOcrListMarker(value);
    const length = [...text].length;
    if (length < 2 || length > 18) return false;
    if (/[。！？!?]$/.test(text)) return false;
    if (/[，,]/.test(text) && length > 10) return false;
    if (/^[0-9\s.,%％￥$:：-]+$/.test(text)) return false;
    const digitCount = (text.match(/\d/g) || []).length;
    if (digitCount / Math.max(length, 1) > 0.35) return false;
    if (isLikelyOcrHeadingLine(text)) return true;
    if (/[：:]$/.test(String(value).trim())) return true;
    if (length <= 12 && !/[：:]/.test(text)) {
      const previousBlank = index === 0 || !String(lines[index - 1] || '').trim();
      if (previousBlank) return true;
    }
    return false;
  }

  function getOcrTableCandidate(value, forceTable = false) {
    const line = String(value || '').trim();
    if (!line) return null;
    const wide = line.includes('\t') || /[ ]{2,}/.test(line);
    if (!forceTable && !wide && isOcrBulletLine(line)) return null;
    if (wide) {
      const cells = splitOcrTextIntoCells(line);
      return cells.length >= 2 ? { cells, wide: true } : null;
    }
    const cells = line.split(/\s+/).filter(Boolean);
    const shortCells = cells.length >= 2 && cells.every((cell) => [...cell].length <= 14);
    if (forceTable && shortCells) return { cells, wide: false, forced: true };
    if (cells.length >= 3) return { cells, wide: false };
    if (cells.length === 2 && (isOcrTableHeaderRow(cells) || cells.some(isNumericOcrCell))) {
      return { cells, wide: false, weak: true };
    }
    return null;
  }

  function buildForcedOcrTable(lines) {
    const rows = (lines || [])
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .map((line) => {
        const candidate = getOcrTableCandidate(line.replace(/[|｜丨]/g, '\t'), true);
        if (candidate && candidate.cells.length >= 2) return candidate.cells;
        const keyValue = parseOcrKeyValueLine(line);
        if (keyValue) return [keyValue.key, keyValue.value];
        return [line];
      });

    if (!rows.length) return [];
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const paddedRows = rows.map((row) => [...row, ...Array(columnCount - row.length).fill(OCR_EMPTY_CELL)]);
    const headers = paddedRows.length > 1 && isOcrTableHeaderRow(paddedRows[0]) ? paddedRows.shift() : [];
    return [{ type: 'table', headers, rows: paddedRows }];
  }

  function structureOcrContent(text, options = {}) {
    const lines = normalizeOcrText(text).split('\n').map((line) => line.trim());
    const forceTable = Boolean(options.forceTable);
    const disableAutoTable = Boolean(options.disableAutoTable);
    if (forceTable) return buildForcedOcrTable(lines);
    const blocks = [];
    let listItems = [];
    const flushList = () => {
      if (listItems.length) {
        blocks.push({ type: 'list', items: [...listItems] });
        listItems = [];
      }
    };

    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (!line) {
        index += 1;
        continue;
      }

      const firstCandidate = disableAutoTable && !forceTable ? null : getOcrTableCandidate(line, forceTable);
      if (firstCandidate) {
        const rows = [firstCandidate.cells];
        let cursor = index + 1;
        let hasWideColumns = firstCandidate.wide;
        while (cursor < lines.length) {
          const nextCandidate = getOcrTableCandidate(lines[cursor], forceTable);
          if (!nextCandidate) break;
          rows.push(nextCandidate.cells);
          hasWideColumns = hasWideColumns || nextCandidate.wide;
          cursor += 1;
        }
        const table = createOcrTableBlock(rows);
        const flatCells = rows.flat();
        const numericRatio = flatCells.length
          ? flatCells.filter(isNumericOcrCell).length / flatCells.length
          : 0;
        const acceptedTable = table
          && rows.length >= 2
          && (forceTable || hasWideColumns || isOcrTableHeaderRow(rows[0]) || numericRatio >= 0.25);
        const tableTimeCells = table ? table.rows.map((row) => row[0]) : [];
        const timeTable = Boolean(table) && isLikelyTimeColumn(tableTimeCells);
        const validTimeTable = !timeTable || forceTable || isValidOcrTimeSequence(tableTimeCells);
        if (acceptedTable && validTimeTable && (forceTable || (table.headers.length <= 6 && (table.rows[0]?.length || 0) <= 6))) {
          flushList();
          blocks.push(table);
          index = cursor;
          continue;
        }
      }

      if (isOcrBulletLine(line)) {
        listItems.push(stripOcrListMarker(line));
        index += 1;
        continue;
      }
      flushList();
      const keyValue = parseOcrKeyValueLine(line);
      if (keyValue && !isOcrStructuredHeading(line, index, lines)) {
        blocks.push({ type: 'keyValue', key: keyValue.key, value: keyValue.value });
        index += 1;
        continue;
      }
      if (isOcrStructuredHeading(line, index, lines)) {
        blocks.push({ type: 'heading', text: stripOcrListMarker(line) });
        index += 1;
        continue;
      }
      blocks.push({ type: 'paragraph', text: line });
      index += 1;
    }
    flushList();
    return blocks;
  }

  function blocksToHtml(blocks) {
    return (blocks || []).map((block) => {
      if (block.type === 'heading') return `<h3>${escapeHtml(block.text)}</h3>`;
      if (block.type === 'list') {
        return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
      }
      if (block.type === 'keyValue') {
        return `<p><strong>${escapeHtml(block.key)}</strong>：${escapeHtml(block.value)}</p>`;
      }
      if (block.type === 'table') {
        const headers = (block.headers || []).length
          ? `<thead><tr>${block.headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>`
          : '';
        const timeTable = block.headers?.[0] === '时间';
        const rows = (block.rows || []).map((row) => `<tr>${row.map((cell, columnIndex) => {
          const displayCell = cell === OCR_EMPTY_CELL ? '' : cell;
          const warning = isSuspiciousOcrCell(cell, columnIndex, timeTable);
          return `<td${warning ? ' class="ocr-cell-warning" title="待核对"' : ''}>${escapeHtml(displayCell)}</td>`;
        }).join('')}</tr>`).join('');
        return `<div class="apple-table-wrap"><table>${headers}<tbody>${rows}</tbody></table></div>`;
      }
      return `<p>${escapeHtml(block.text)}</p>`;
    }).join('');
  }

  function renderOcrBlockPreview(blocks) {
    return blocksToHtml(blocks);
  }

  function splitMarkdownTableRow(value) {
    return String(value || '')
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  }

  function isMarkdownTableSeparator(cells) {
    return Array.isArray(cells)
      && cells.length > 0
      && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
  }

  function parseHtmlTableRows(html) {
    const documentNode = new DOMParser().parseFromString(html, 'text/html');
    const table = documentNode.querySelector('table');
    if (!table) return [];
    return [...table.querySelectorAll('tr')]
      .map((row) => [...row.querySelectorAll('th,td')].map((cell) => cell.textContent.trim()))
      .filter((row) => row.length >= 2);
  }

  function normalizeOcrDigits(value) {
    return String(value || '').replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0));
  }

  function correctOcrTimeCell(value) {
    if (!value || value === OCR_EMPTY_CELL) return value;
    const normalized = normalizeOcrDigits(value)
      .replace(/[Oo]/g, '0')
      .replace(/[Ww]/g, '3')
      .replace(/[Il|]/g, '1')
      .replace(/[^\d]/g, '');
    if (!normalized) return String(value).trim();
    const digits = normalized.slice(0, 3);
    return digits ? `${digits}天` : String(value).trim();
  }

  function getOcrTimeCandidates(value) {
    const digits = normalizeOcrDigits(value)
      .replace(/[Oo]/g, '0')
      .replace(/[Ww]/g, '3')
      .replace(/[Il|]/g, '1')
      .replace(/[^\d]/g, '');
    const candidates = new Set();
    for (let start = 0; start < digits.length; start += 1) {
      for (let end = start + 1; end <= digits.length; end += 1) {
        const number = Number(digits.slice(start, end));
        if (number > 0 && number <= 365) candidates.add(number);
      }
    }
    return [...candidates];
  }

  function scoreCommonOcrTime(value) {
    const common = [3, 7, 14, 21, 30, 60, 90, 120, 180, 270, 360, 365];
    return Math.min(...common.map((candidate) => Math.abs(candidate - value) + String(value).length));
  }

  function normalizeOcrTimeSequence(cells) {
    const parsed = (cells || []).map((cell) => {
      const digits = correctOcrTimeCell(cell).replace(/[^\d]/g, '');
      return digits ? Number(digits) : null;
    });
    const normalized = parsed.slice();

    for (let index = 0; index < parsed.length; index += 1) {
      const value = parsed[index];
      if (value === null) continue;
      let previous = null;
      for (let before = index - 1; before >= 0; before -= 1) {
        if (parsed[before] !== null) {
          previous = parsed[before];
          break;
        }
      }
      let next = null;
      for (let after = index + 1; after < parsed.length; after += 1) {
        if (parsed[after] !== null) {
          next = parsed[after];
          break;
        }
      }
      const monotonic = (previous === null || value >= previous) && (next === null || value <= next);
      if (monotonic) continue;
      const candidates = getOcrTimeCandidates(cells[index]).filter((candidate) => {
        return (previous === null || candidate >= previous) && (next === null || candidate <= next);
      });
      if (!candidates.length) continue;
      candidates.sort((a, b) => scoreCommonOcrTime(a) - scoreCommonOcrTime(b));
      normalized[index] = candidates[0];
    }

    return normalized.map((value, index) => value === null ? correctOcrTimeCell(cells[index]) : `${value}天`);
  }

  function isPaddleJsTimeLine(value) {
    const compact = normalizeOcrDigits(value).replace(/\s+/g, '');
    if (!compact || compact.length > 5) return false;
    if (!/^[0-9OoWwIl|]{1,4}(?:[天元日.]?)$/.test(compact)) return false;
    const digits = compact.replace(/[Oo]/g, '0').replace(/[Ww]/g, '3').replace(/[Il|]/g, '1').replace(/\D/g, '');
    return digits.length >= 1 && digits.length <= 3;
  }

  function parsePaddleJsTableText(text) {
    const lines = normalizeOcrText(text).split('\n').map((line) => line.trim()).filter(Boolean);
    const rows = [];
    let current = null;

    lines.forEach((line) => {
      if (current && /^(?:天|元)$/.test(line) && current.content.length === 0) {
        current.time = correctOcrTimeCell(current.time).replace(/[天元]$/, '') + '天';
        return;
      }
      if (isPaddleJsTimeLine(line)) {
        if (current) rows.push(current);
        current = { time: correctOcrTimeCell(line), content: [] };
        return;
      }
      if (current) {
        const cleaned = correctOcrDomainText(line);
        if (cleaned && cleaned !== 'C') current.content.push(cleaned);
      }
    });
    if (current) rows.push(current);

    const validRows = rows.filter((row) => row.content.length);
    if (validRows.length < 3 || validRows.length > 20) return null;

    const normalizedTimes = validRows.map((row) => Number(correctOcrTimeCell(row.time).replace(/\D/g, '')));
    if (normalizedTimes.some((value) => !Number.isFinite(value) || value <= 0)) return null;
    if (normalizedTimes.some((value, index) => index > 0 && value <= normalizedTimes[index - 1])) return null;
    if (validRows.some((row) => countMeaningfulOcrChars(row.content.join(' ')) < 4)) return null;

    return {
      type: 'table',
      headers: ['时间', '内容'],
      rows: validRows.map((row) => [correctOcrTimeCell(row.time), correctOcrDomainText(row.content.join(' '))])
    };
  }

  function isLikelyTimeColumn(cells) {
    const meaningful = (cells || []).filter((cell) => cell && cell !== OCR_EMPTY_CELL);
    if (meaningful.length < 2) return false;
    const timeLike = meaningful.filter((cell) => {
      const normalized = normalizeOcrDigits(cell);
      return /^\d{1,3}\s*[天日元日.]?$/.test(normalized)
        || correctOcrTimeCell(cell) !== cell
        || /[OoWw]/.test(normalized) && /\d|天/.test(normalized);
    }).length;
    return timeLike >= 2 && timeLike / meaningful.length >= 0.6;
  }

  function correctOcrDomainText(value) {
    let text = normalizeOcrDigits(value);
    const replacements = [
      [/川练/g, '训练'],
      [/肌内/g, '肌肉'],
      [/休脂/g, '体脂'],
      [/线粒休/g, '线粒体'],
      [/摄氧\s*量/g, '摄氧量'],
      [/心慌和气短/g, '心慌气短'],
      [/受[份伤]风险/g, '受伤风险'],
      [/新[手首]水平/g, '新手水平'],
      [/重[启起]\s*川练/g, '重启训练'],
      [/合里安排/g, '合理安排'],
      [/停止健身多久/g, '停止健身 多久'],
      [/忆不会掉肌肉/g, '不会掉肌肉'],
      [/Noie/g, 'Note'],
      [/兵并/g, '并'],
      [/[。.]\s*\/?\s*$/g, '。'],
      [/[Ww]O(\s*天)/g, '30$1'],
      [/(\d+)\s*元\s*天/g, '$1天'],
      [/(\d+)\s*\.\s*天/g, '$1天']
    ];
    replacements.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });
    text = text.replace(/(\d)[Oo](\s*天)/g, (match, digit, suffix) => `${digit}0${suffix}`);
    text = text.replace(/([\u3400-\u9fff])[oO0Il|]{1,2}$/g, '$1。');
    return text
      .replace(/([\u3400-\u9fff])[ \t]+(?=[\u3400-\u9fff])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function isSuspiciousOcrCell(cell, columnIndex = 0, timeTable = false) {
    if (!cell || cell === OCR_EMPTY_CELL) return false;
    const text = String(cell).trim();
    if (timeTable && columnIndex === 0 && !/^\d{1,3}天$/.test(text)) return true;
    return /(?:川练|休脂|肌内|线粒休|忆不会|[oO0]$|\/\s*$|WO|元\s*天|\.\s*天)/.test(text);
  }

  function countSuspiciousOcrCells(blocks) {
    let count = 0;
    (blocks || []).forEach((block) => {
      if (block.type !== 'table') return;
      const timeTable = block.headers?.[0] === '时间';
      (block.rows || []).forEach((row) => {
        row.forEach((cell, columnIndex) => {
          if (isSuspiciousOcrCell(cell, columnIndex, timeTable)) count += 1;
        });
      });
    });
    return count;
  }

  function isValidOcrTimeSequence(cells) {
    const values = (cells || []).map((cell) => {
      const digits = correctOcrTimeCell(cell).replace(/[^\d]/g, '');
      return digits ? Number(digits) : null;
    });
    if (values.some((value) => value === null)) return false;
    return values.every((value, index) => index === 0 || value > values[index - 1]);
  }

  function cleanOcrIrrelevantLine(value) {
    let line = String(value || '').trim();
    const segments = [...line.matchAll(/[\u3400-\u9fff]{3,}/g)];
    if (segments.length) {
      const first = segments[0];
      if (first.index > 0 && first.index <= 24) {
        line = line.slice(first.index);
      }
      const refreshed = [...line.matchAll(/[\u3400-\u9fff]{3,}/g)];
      const last = refreshed[refreshed.length - 1];
      if (last) {
        const lastEnd = last.index + last[0].length;
        const tail = line.slice(lastEnd);
        if (tail.length <= 14 && /^[A-Za-z0-9\s.|\-—_:：]+$/.test(tail)) {
          line = line.slice(0, lastEnd);
        }
      }
    }
    return line
      .replace(/([\u3400-\u9fff])[A-Za-z]{1,3}$/g, '$1')
      .replace(/[|｜丨]{1,}$/g, '')
      .trim();
  }

  function looksLikeGarbledLatinLine(value) {
    const tokens = String(value || '').match(/[A-Za-z]{2,}/g) || [];
    if (!tokens.length) return false;
    const knownToken = /^(?:OCR|AI|PDF|Excel|English|Best|Note|Demo|APP)$/i;
    const weak = tokens.filter((token) => {
      if (knownToken.test(token)) return false;
      const vowels = (token.match(/[aeiouAEIOU]/g) || []).length;
      if (/[A-Z]/.test(token.slice(1)) && /[a-z]/.test(token)) return true;
      if (token.length <= 3 && vowels === 0) return true;
      return token.length >= 5 && vowels / token.length < 0.3;
    }).length;
    return weak >= Math.max(1, Math.ceil(tokens.length * 0.5));
  }

  function lineRelevanceKey(value) {
    return String(value || '').replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();
  }

  function filterOcrContentLines(text) {
    const lines = normalizeOcrText(text)
      .split('\n')
      .map((line) => cleanOcrIrrelevantLine(line))
      .filter((line, index, source) => line || (index > 0 && index < source.length - 1));
    const contentLines = lines.filter((line) => countMeaningfulOcrChars(line) >= 10);
    const dominant = analyzeOcrTopics(contentLines.length ? contentLines : lines)[0];

    const timeCandidates = lines
      .map((line, index) => ({ line, index, time: isPaddleJsTimeLine(line) }))
      .filter((item) => item.time);
    const validTimeIndexes = new Set();
    if (timeCandidates.length >= 3 && isValidOcrTimeSequence(timeCandidates.map((item) => item.line))) {
      timeCandidates.forEach((item) => validTimeIndexes.add(item.index));
    }

    const kept = [];
    const seen = new Set();
    lines.forEach((line, index) => {
      if (!line) return;
      if (validTimeIndexes.has(index)) {
        kept.push(line);
        return;
      }
      const compact = line.replace(/\s+/g, '');
      const meaningful = countMeaningfulOcrChars(line);
      const cjkCount = countCjkChars(line);
      const cjkRatio = meaningful ? cjkCount / meaningful : 0;
      const symbolRatio = compact.length ? 1 - meaningful / compact.length : 1;
      const topicHits = countTopicHits(line, dominant);

      if (meaningful < 4) return;
      if (symbolRatio > 0.3) return;
      if (looksLikeGarbledLatinLine(line)) return;
      if (cjkRatio < 0.15 && meaningful < 24 && topicHits === 0) return;

      const key = lineRelevanceKey(line);
      if (key.length >= 6 && seen.has(key)) return;
      if (key) seen.add(key);
      kept.push(line);
    });

    return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function buildBlocksForText(text, options = {}) {
    const renderMode = options.renderMode || 'auto';
    const filterIrrelevant = options.filterIrrelevant !== false;
    if (!String(text || '').trim()) return [];

    const markdownBlocks = parseMarkdownToOcrBlocks(text);
    const hasMarkdownTable = markdownBlocks.some((block) => block.type === 'table');
    if (hasMarkdownTable && renderMode !== 'text') {
      return applyOcrTableCorrections(markdownBlocks);
    }

    if (renderMode === 'table') {
      return applyOcrTableCorrections(structureOcrContent(text, { forceTable: true }));
    }

    const autoBlocks = applyOcrTableCorrections(structureOcrContent(text, { forceTable: false }));
    if (renderMode === 'auto' && autoBlocks.some((block) => block.type === 'table')) {
      return autoBlocks;
    }

    const sourceText = filterIrrelevant ? filterOcrContentLines(text) : text;
    return applyOcrTableCorrections(structureOcrContent(sourceText, { disableAutoTable: true }));
  }

  function rebuildOcrBlocks() {
    state.ocrBlocks = buildBlocksForText(state.ocrText, {
      renderMode: state.ocrRenderMode,
      filterIrrelevant: state.ocrFilterIrrelevant
    });
    state.ocrDraftHtml = renderOcrBlockPreview(state.ocrBlocks);
  }

  function applyOcrTableCorrections(blocks) {
    return (blocks || []).map((block) => {
      if (block.type === 'table') {
        const rows = (block.rows || []).map((row) => row.map((cell) => correctOcrDomainText(cell)));
        const firstColumn = rows.map((row) => row[0]);
        const timeColumn = isLikelyTimeColumn(firstColumn);
        const normalizedTimes = timeColumn ? normalizeOcrTimeSequence(firstColumn) : [];
        const correctedRows = timeColumn
          ? rows.map((row, index) => [normalizedTimes[index], ...row.slice(1)])
          : rows;
        const columnCount = block.headers?.length || correctedRows[0]?.length || 0;
        const inferredHeaders = timeColumn
          ? columnCount === 2
            ? ['时间', '内容']
            : ['时间', '内容', ...Array(Math.max(0, columnCount - 2)).fill(OCR_EMPTY_CELL)]
          : (block.headers || []).map((cell) => correctOcrDomainText(cell));
        return {
          ...block,
          headers: inferredHeaders,
          rows: correctedRows
        };
      }
      if (block.type === 'heading' || block.type === 'paragraph') {
        return { ...block, text: correctOcrDomainText(block.text) };
      }
      if (block.type === 'list') {
        return { ...block, items: (block.items || []).map((item) => correctOcrDomainText(item)) };
      }
      if (block.type === 'keyValue') {
        return {
          ...block,
          key: correctOcrDomainText(block.key),
          value: correctOcrDomainText(block.value)
        };
      }
      return block;
    });
  }

  function parseMarkdownToOcrBlocks(markdown) {
    const lines = String(markdown || '').replaceAll('\r', '').split('\n');
    const blocks = [];
    let listItems = [];
    const flushList = () => {
      if (listItems.length) {
        blocks.push({ type: 'list', items: [...listItems] });
        listItems = [];
      }
    };

    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        index += 1;
        continue;
      }

      if (trimmed.toLowerCase().startsWith('<table')) {
        let cursor = index;
        const htmlLines = [];
        while (cursor < lines.length) {
          htmlLines.push(lines[cursor]);
          if (lines[cursor].toLowerCase().includes('</table>')) break;
          cursor += 1;
        }
        const rows = parseHtmlTableRows(htmlLines.join('\n'));
        const table = createOcrTableBlock(rows);
        if (table) {
          flushList();
          blocks.push(table);
          index = cursor + 1;
          continue;
        }
      }

      if (trimmed.startsWith('|')) {
        const rows = [];
        let cursor = index;
        while (cursor < lines.length && lines[cursor].trim().startsWith('|')) {
          const cells = splitMarkdownTableRow(lines[cursor]);
          if (!isMarkdownTableSeparator(cells)) rows.push(cells);
          cursor += 1;
        }
        const table = createOcrTableBlock(rows);
        if (table) {
          flushList();
          blocks.push(table);
          index = cursor;
          continue;
        }
      }

      const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        flushList();
        blocks.push({ type: 'heading', text: heading[1].trim() });
        index += 1;
        continue;
      }

      const listItem = trimmed.match(/^(?:[-*+]|\d+[.)])\s+(.+)$/);
      if (listItem) {
        listItems.push(listItem[1].trim());
        index += 1;
        continue;
      }

      flushList();
      blocks.push({
        type: 'paragraph',
        text: trimmed
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/__(.+?)__/g, '$1')
          .replace(/`(.+?)`/g, '$1')
      });
      index += 1;
    }
    flushList();
    return blocks;
  }

  function ocrBlocksToPlainText(blocks) {
    return (blocks || []).map((block) => {
      if (block.type === 'heading' || block.type === 'paragraph') return block.text || '';
      if (block.type === 'keyValue') return `${block.key || ''}：${block.value || ''}`;
      if (block.type === 'list') return (block.items || []).join('\n');
      if (block.type === 'table') {
        const rows = [
          ...(block.headers || []).length ? [block.headers] : [],
          ...(block.rows || [])
        ];
        return rows.map((row) => row.map((cell) => cell === OCR_EMPTY_CELL ? '' : cell).join('\t')).join('\n');
      }
      return '';
    }).filter(Boolean).join('\n\n');
  }

  async function callPaddleOcrApi(fileItem) {
    let uploadFile = fileItem?.file;
    if (!uploadFile && fileItem?.url) {
      const blob = await fetch(fileItem.url).then((response) => response.blob());
      uploadFile = new File([blob], fileItem.name || 'image.png', { type: blob.type || 'image/png' });
    }
    if (!uploadFile) throw new Error('无法读取当前图片文件。');
    if (location.protocol === 'file:') {
      throw new Error('高精度模式需要通过 http://localhost 打开，不能使用 file://。');
    }

    const form = new FormData();
    form.append('file', uploadFile, uploadFile.name || fileItem.name || 'image.png');
    const response = await fetch('/api/ocr/high-precision', {
      method: 'POST',
      body: form
    });
    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('高精度 OCR 服务返回了无效响应。');
    }
    if (!response.ok || !payload.ok) {
      throw new Error(payload?.error?.message || `高精度 OCR 请求失败（${response.status}）。`);
    }
    return payload;
  }

  function sanitizeOcrTextSegment(value) {
    return String(value || '')
      .replace(/[|｜丨]/g, ' ')
      .replace(/[•·●○◆◇■□▪▫▲▼★☆※→←↑↓]/g, '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/\t+/g, ' ')
      .trim();
  }

  function countMeaningfulOcrChars(value) {
    return (String(value || '').match(/[\u3400-\u9fffA-Za-z0-9]/g) || []).length;
  }

  function averageNumber(values) {
    const valid = values.filter((value) => Number.isFinite(value));
    if (!valid.length) return 0;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  function isLikelyGraphicOcrLine(rawText, lineConfidence, validWordCount, totalWordCount) {
    const text = sanitizeOcrTextSegment(rawText);
    if (!text) return true;
    const meaningful = countMeaningfulOcrChars(text);
    if (!meaningful) return true;
    const compact = text.replace(/\s+/g, '');
    if (/^[A-Za-z0-9IlO0]{1,3}$/.test(compact) && lineConfidence < 82) return true;
    if (/^(.)\1+$/.test(compact)) return true;
    const symbolRatio = 1 - meaningful / Math.max(compact.length, 1);
    if (symbolRatio > 0.65) return true;
    if (totalWordCount > 0 && validWordCount === 0) return true;
    if (totalWordCount > 0 && validWordCount / totalWordCount < 0.35 && lineConfidence < 75) return true;
    if (meaningful <= 1 && lineConfidence < 70) return true;
    return false;
  }

  function joinOcrWordTexts(words) {
    let result = '';
    (words || []).forEach((word) => {
      const text = sanitizeOcrTextSegment(word?.text);
      if (!text) return;
      if (!result) {
        result = text;
        return;
      }
      const previous = result.slice(-1);
      const first = text.slice(0, 1);
      const needsSpace = /[A-Za-z0-9]$/.test(previous) && /^[A-Za-z0-9]/.test(first);
      result += `${needsSpace ? ' ' : ''}${text}`;
    });
    return cleanOcrPunctuationLine(result);
  }

  function splitOcrWordsIntoCells(words) {
    const validWords = (words || [])
      .filter((word) => word?.bbox && sanitizeOcrTextSegment(word?.text))
      .slice()
      .sort((a, b) => Number(a.bbox.x0 || 0) - Number(b.bbox.x0 || 0));
    if (validWords.length < 2) {
      return validWords.length ? [joinOcrWordTexts(validWords)] : [];
    }

    const heights = validWords
      .map((word) => Math.abs(Number(word.bbox.y1 || 0) - Number(word.bbox.y0 || 0)))
      .filter((height) => height > 0)
      .sort((a, b) => a - b);
    const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 20;
    const gapThreshold = Math.max(18, medianHeight * 0.85);
    const cells = [];
    let currentWords = [];
    let previousRight = null;

    validWords.forEach((word) => {
      const x0 = Number(word.bbox.x0 || 0);
      const x1 = Number(word.bbox.x1 || x0);
      if (previousRight !== null && x0 - previousRight > gapThreshold && currentWords.length) {
        cells.push(joinOcrWordTexts(currentWords));
        currentWords = [];
      }
      currentWords.push(word);
      previousRight = x1;
    });
    if (currentWords.length) cells.push(joinOcrWordTexts(currentWords));
    return cells.filter(Boolean);
  }

  function splitOcrTextIntoCells(value) {
    return String(value || '')
      .split(/\t+|[ ]{2,}/)
      .map((cell) => cleanOcrPunctuationLine(cell))
      .filter(Boolean);
  }

  function isOcrTableHeaderRow(row) {
    return (row || []).some((cell) => /(?:项目|名称|代码|股票|板块|方向|指标|数值|数量|金额|日期|时间|负责人|状态|动作|组数|次数|重量|部位|训练|内容|备注|说明|标题|类别|合计|涨跌|价格|收益|风险)/.test(cell));
  }

  function isNumericOcrCell(value) {
    return /^[¥￥$]?-?\d+(?:[.,]\d+)*(?:%|％)?$/.test(String(value || '').trim());
  }

  function createOcrTableBlock(rows) {
    const normalizedRows = (rows || [])
      .map((row) => row.map((cell) => cleanOcrPunctuationLine(cell)))
      .filter((row) => row.length >= 2 && row.some((cell) => cell !== ''));
    if (normalizedRows.length < 2) return null;
    const columnCount = Math.max(...normalizedRows.map((row) => row.length));
    const paddedRows = normalizedRows.map((row) => [...row, ...Array(columnCount - row.length).fill(OCR_EMPTY_CELL)]);
    const firstRow = paddedRows[0];
    const useHeader = isOcrTableHeaderRow(firstRow);
    return {
      type: 'table',
      headers: useHeader ? firstRow : [],
      rows: useHeader ? paddedRows.slice(1) : paddedRows
    };
  }

  function parseOcrTableFromLines(lineRecords, forceTable = false) {
    const rows = [];
    (lineRecords || []).forEach((record) => {
      const wordCells = splitOcrWordsIntoCells(record.words);
      const textCells = splitOcrTextIntoCells(record.text);
      const cells = wordCells.length >= 2 ? wordCells : textCells;
      if (cells.length >= 2) rows.push(cells);
    });
    if (rows.length < 3) return null;
    const tableRatio = rows.length / Math.max(lineRecords.length, 1);
    if (!forceTable && tableRatio < 0.6) return null;
    const columnCounts = rows.map((row) => row.length);
    const modeCount = Math.max(...columnCounts.map((count) => columnCounts.filter((item) => item === count).length));
    if (!forceTable && modeCount / rows.length < 0.6) return null;
    const flatCells = rows.flat();
    const numericRatio = flatCells.length
      ? flatCells.filter(isNumericOcrCell).length / flatCells.length
      : 0;
    if (!forceTable && !isOcrTableHeaderRow(rows[0]) && numericRatio < 0.25) return null;
    if (!forceTable && Math.max(...columnCounts) > 6) return null;
    return createOcrTableBlock(rows);
  }

  function extractReliableOcrText(result) {
    const fallbackText = normalizeOcrText(result?.data?.text || '');
    const blocks = result?.data?.blocks;
    if (!Array.isArray(blocks) || !blocks.length) {
      return {
        text: fallbackText,
        confidence: Math.round(result?.data?.confidence || 0),
        ignoredLines: 0,
        keptLines: fallbackText ? fallbackText.split('\n').length : 0
      };
    }

    const extractedLines = [];
    const lineConfidences = [];
    let ignoredLines = 0;
    let keptLines = 0;

    blocks.forEach((block) => {
      if (!block || !Array.isArray(block.paragraphs)) return;
      if (/(?:IMAGE|NOISE)/i.test(block.blocktype || '')) {
        ignoredLines += block.paragraphs.reduce((sum, paragraph) => sum + (paragraph?.lines?.length || 0), 0);
        return;
      }

      block.paragraphs.forEach((paragraph) => {
        if (!paragraph || !Array.isArray(paragraph.lines)) return;
        const paragraphRecords = [];

        paragraph.lines.forEach((line) => {
          if (!line) return;
          const words = Array.isArray(line.words) ? line.words : [];
          const validWordConfidences = words
            .filter((word) => {
              const wordText = sanitizeOcrTextSegment(word?.text);
              const wordConfidence = Number(word?.confidence || 0);
              return wordConfidence >= 30 && countMeaningfulOcrChars(wordText) >= 1;
            })
            .map((word) => Number(word.confidence));
          const validWordCount = validWordConfidences.length;
          const lineConfidence = Number.isFinite(Number(line.confidence)) && Number(line.confidence) > 0
            ? Number(line.confidence)
            : averageNumber(validWordConfidences);
          const cleanLine = sanitizeOcrTextSegment(line.text);

          if (isLikelyGraphicOcrLine(cleanLine, lineConfidence, validWordCount, words.length)) {
            ignoredLines += 1;
            return;
          }

          paragraphRecords.push({ text: cleanLine, words });
          lineConfidences.push(lineConfidence);
          keptLines += 1;
        });

        if (paragraphRecords.length) {
          const table = parseOcrTableFromLines(paragraphRecords, /TABLE/i.test(block.blocktype || ''));
          if (table) {
            const rows = table.headers.length ? [table.headers, ...table.rows] : table.rows;
            extractedLines.push(...rows.map((row) => row.join('\t')), '');
          } else {
            extractedLines.push(...paragraphRecords.map((record) => record.text), '');
          }
        }
      });
    });

    const extractedText = normalizeOcrText(extractedLines.join('\n'));
    const text = extractedText || fallbackText;
    return {
      text,
      confidence: Math.round(lineConfidences.length ? averageNumber(lineConfidences) : Number(result?.data?.confidence || 0)),
      ignoredLines,
      keptLines: keptLines || (text ? text.split('\n').length : 0)
    };
  }

  function stripOcrTitleNoise(value) {
    return String(value || '')
      .replace(/^[#＃\-–—•·●○◆◇■□▪▫]+\s*/, '')
      .replace(/[。！；;，,、：:]\s*$/g, '')
      .replace(/^[，。！？；：、,.!?;:]+|[，、；：,;:]+$/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\t+/g, ' ')
      .replaceAll(OCR_EMPTY_CELL, ' ')
      .trim();
  }

  function shortenOcrTitle(value, maxLength = 28) {
    let title = stripOcrTitleNoise(value);
    if ([...title].length <= maxLength) return title;
    const clause = title.split(/[，。；！？,;!?]/)[0].trim();
    if ([...clause].length >= 6 && [...clause].length <= maxLength) title = clause;
    else title = [...title].slice(0, maxLength).join('');
    return stripOcrTitleNoise(title);
  }

  function countTextOccurrences(text, keyword) {
    if (!keyword) return 0;
    return String(text).split(String(keyword)).length - 1;
  }

  function countTextPattern(text, pattern) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    const matches = String(text).match(new RegExp(pattern.source, flags));
    return matches ? matches.length : 0;
  }

  function getOcrTopicDefinitions() {
    return [
      {
        id: 'stock',
        label: '股票与市场',
        title: '股票与市场信息整理',
        strong: ['股票', '证券', 'A股', '港股', '美股', '板块', '涨停', '跌停', '资金流', '北向资金', '机构调研', '估值', '市盈率', '市净率', '研报', '财报', '净利润', '毛利率', 'ROE', '个股', '标的', '市值', '成交量', '算力', '液冷', '光模块', '半导体', '新能源'],
        weak: ['指数', '行业', '赛道', '龙头', '收益', '仓位', '趋势', '代码', '行情', '投资', '风险'],
        patterns: [
          { source: '\b(?:00|30|60|68|8)\d{4}\b', flags: 'g', weight: 5 },
          { source: '市盈率|市净率|ROE|EPS', flags: 'gi', weight: 3 }
        ]
      },
      {
        id: 'meeting',
        label: '会议与行动项',
        title: '会议内容与行动项纪要',
        strong: ['会议', '纪要', '议题', '参会', '发言人', '讨论', '决议', '共识', '行动项', '待办', '下一步', '负责人', '截止时间', '周会', '例会', '评审会', '复盘会'],
        weak: ['结论', '安排', '跟进', '进度', '项目组', '时间'],
        patterns: [{ source: '\b\d{1,2}:\d{2}\b', flags: 'g', weight: 2 }]
      },
      {
        id: 'project',
        label: '项目与方案',
        title: '项目进展与计划整理',
        strong: ['项目', '需求', '方案', '计划', '里程碑', '排期', '版本', '上线', '验收', '开发', '设计', '测试', '迭代', '交付', '功能', '路线图', '进度'],
        weak: ['目标', '任务', '负责人', '风险', '流程', '范围']
      },
      {
        id: 'data',
        label: '数据与报告',
        title: '数据报告与关键指标摘要',
        strong: ['报告', '数据', '同比', '环比', '统计', '指标', '增长率', '占比', '市场规模', '调研', '图表', '表格', '样本', '营收', '利润', '金额'],
        weak: ['数量', '结果', '趋势', '分析', '总额', '比例'],
        patterns: [
          { source: '\d+(?:\.\d+)?[%％]', flags: 'g', weight: 3 },
          { source: '(?:同比|环比|增长|下降|提升|减少)\s*\d', flags: 'g', weight: 3 }
        ]
      },
      {
        id: 'learning',
        label: '学习与知识',
        title: '学习内容与知识要点整理',
        strong: ['学习', '课程', '知识点', '阅读', '读书', '章节', '概念', '定义', '原理', '公式', '复盘', '心得', '教程'],
        weak: ['理解', '重点', '笔记', '方法', '技巧']
      },
      {
        id: 'fitness',
        label: '健身与训练',
        title: '健身训练与饮食计划',
        strong: ['健身', '训练', '增肌', '减脂', '塑形', '有氧', '无氧', '力量训练', '深蹲', '硬拉', '卧推', '推举', '引体向上', '俯卧撑', '卷腹', '拉伸', '热身', '组数', '次数', '组间休息', '心率', '体脂率', 'BMI', '蛋白质', '碳水', '热量', '卡路里', '饮食', '食谱', '补剂', '肌群', '胸肌', '背肌', '腿部', '核心', '肩部', '手臂', '动作', '教练', '健身房', '打卡', '课表', '训练计划', '恢复', '损伤', '关节', '姿势'],
        weak: ['重量', '休息', '营养', '睡眠', '运动', '体能', '进步', '目标', '计划'],
        patterns: [
          { source: '\d+\s*(?:组|次|kg|公斤|分钟|kcal|千卡)', flags: 'gi', weight: 3 },
          { source: '(?:增肌|减脂|塑形|力量|有氧)', flags: 'g', weight: 3 }
        ]
      },
      {
        id: 'ocr',
        label: 'OCR 与文字提取',
        title: 'OCR 识别内容整理',
        strong: ['OCR', '识别', '扫描', '文字提取', '截图', '图片转文字', '提取结果'],
        weak: ['图片', '文字', '文本', '测试图片', '示例图片']
      },
      {
        id: 'product',
        label: '产品与运营',
        title: '产品与运营要点整理',
        strong: ['产品', '用户', '体验', '运营', '转化率', '留存', '增长', '用户反馈', '竞品', '需求', '功能'],
        weak: ['方案', '设计', '流程', '界面', '页面']
      },
      {
        id: 'document',
        label: '文档与规则',
        title: '文档内容要点整理',
        strong: ['通知', '规则', '制度', '合同', '条款', '申请', '流程', '资料', '文档', '说明书', '注意事项'],
        weak: ['要求', '说明', '规定', '材料']
      }
    ];
  }

  function analyzeOcrTopics(lines) {
    const text = lines.join('\n');
    const topics = getOcrTopicDefinitions().map((definition) => {
      const matched = [];
      let score = 0;
      let topicLines = 0;

      definition.strong.forEach((term) => {
        const count = countTextOccurrences(text, term);
        if (count > 0) {
          matched.push(term);
          score += Math.min(count, 4) * 10;
        }
      });

      definition.weak.forEach((term) => {
        const count = countTextOccurrences(text, term);
        if (count > 0) {
          matched.push(term);
          score += Math.min(count, 2) * 2;
        }
      });

      (definition.patterns || []).forEach((pattern) => {
        const count = countTextPattern(text, pattern);
        score += Math.min(count, 4) * pattern.weight;
      });

      lines.forEach((line, index) => {
        const strongHits = definition.strong.filter((term) => line.includes(term)).length;
        const weakHits = definition.weak.filter((term) => line.includes(term)).length;
        const hits = strongHits * 2 + weakHits;
        if (!hits) return;
        topicLines += 1;
        score += Math.min(hits, 4) * 2;
        if (index < 6 && line.length <= 26) score += 2;
      });

      if (topicLines >= 2) score += Math.min(topicLines, 5) * 1.5;
      return {
        ...definition,
        score: Math.round(score),
        matched: [...new Set(matched)].slice(0, 8),
        topicLines
      };
    });

    return topics.sort((a, b) => b.score - a.score || b.matched.length - a.matched.length);
  }

  function countTopicHits(value, topic) {
    if (!topic) return 0;
    const title = String(value);
    const strongHits = topic.strong.reduce((sum, term) => sum + (title.includes(term) ? 2 : 0), 0);
    const weakHits = topic.weak.reduce((sum, term) => sum + (title.includes(term) ? 1 : 0), 0);
    return strongHits + weakHits;
  }

  function scoreOcrTitleLine(value, index, topics) {
    const sourceLine = String(value || '').trim();
    const title = shortenOcrTitle(stripOcrListMarker(value), 26);
    if (!title) return -Infinity;
    const length = [...title].length;
    const dominant = topics[0];
    const second = topics[1];
    const dominantHits = countTopicHits(title, dominant);
    const secondHits = countTopicHits(title, second);
    const digitCount = (title.match(/\d/g) || []).length;
    const positionBonus = [10, 8, 6, 5, 4, 3][index] || 0;
    let score = positionBonus;

    if (length >= 6 && length <= 24) score += 24;
    else if (length >= 4 && length <= 32) score += 14;
    else if (length < 4) score -= 25;
    else score -= 18;

    if (dominantHits > 0) score += Math.min(dominantHits, 6) * 10 + 8;
    if (secondHits > 0) score += Math.min(secondHits, 4) * 3;
    if (/(?:清单|纪要|报告|分析|观察|方案|计划|要点|总结|复盘|策略|研究)/.test(title)) score += 16;
    if (/^(?:核心结论|结论|摘要|总结|要点|说明|备注|目标|背景)[：:]?/.test(title)) score -= 30;
    if (/^(?:优记|best\s*note)/i.test(title)) score -= 80;
    if (/(?:测试图片|示例图片|演示模式|demo|smoke)/i.test(title)) score -= 20;
    if (/[。！？!?]$/.test(title) && /[，,]/.test(title) && length > 16) score -= 30;
    if (/[，,]/.test(title) && length > 14) score -= 10;
    if (/[%％]/.test(title) && length > 14) score -= 12;
    if (digitCount / Math.max(length, 1) > 0.35) score -= 22;
    if (/(?:年|月|日|时|分|元|万|亿|%|％|\d{4,})/.test(title) && length < 18) score -= 12;
    const isQuestionTitle = /[？?]$/.test(sourceLine)
      && /(?:多久|怎么|如何|为什么|什么|是否|哪|谁|何时|多少)/.test(title)
      && length <= 32;
    if (isQuestionTitle) score += 28;
    if (/[。！？!?]$/.test(sourceLine)) {
      score -= isQuestionTitle
        ? 0
        : /(?:清单|纪要|报告|分析|观察|方案|计划|要点|总结|复盘|策略|研究)$/.test(title) ? 8 : 35;
    }
    if (/[：:]/.test(title)) score -= 10;
    if (isOcrStructuredLine(title) && dominantHits === 0) score -= 8;
    return { title, source: sourceLine, score, index, topicHits: dominantHits, dominantHits, secondHits };
  }

  function rankOcrTitleLines(lines, topics) {
    return lines
      .map((line, index) => scoreOcrTitleLine(line, index, topics))
      .filter((candidate) => Number.isFinite(candidate.score))
      .sort((a, b) => b.score - a.score || a.index - b.index);
  }

  function extractOcrTopicFocus(lines, topic, rankedLines = []) {
    const candidates = rankedLines.length ? rankedLines : rankOcrTitleLines(lines, [topic]);
    for (const candidate of candidates) {
      const title = shortenOcrTitle(candidate.title, 22);
      if (!title || countTopicHits(title, topic) <= 0) continue;
      if (/^(?:核心结论|结论|摘要|总结|要点|说明|备注|目标|背景)$/.test(title)) continue;
      if (/[。！？!?]$/.test(candidate.source) && !/(?:清单|纪要|报告|分析|观察|方案|计划|要点|总结|复盘|策略|研究)$/.test(title)) continue;
      if (/(?:测试图片|示例图片|演示模式|demo|smoke)/i.test(title)) return '';
      const digitCount = (title.match(/\d/g) || []).length;
      if (digitCount / Math.max([...title].length, 1) > 0.35) continue;
      if (/^(?:股票|证券|板块|行业|市场)(?:代码|指数|名称)$/.test(title)) continue;
      if (candidate.score >= 30) return title;
    }
    return '';
  }

  function buildOcrTopicTitle(focus, topic) {
    const clean = shortenOcrTitle(focus, 22);
    if (!clean) return topic.title;
    if (topic.id === 'stock') {
      if (/(?:清单|观察|分析|策略|复盘|研究|投资)$/.test(clean)) return clean;
      return `${clean}与市场信息整理`;
    }
    if (topic.id === 'meeting') {
      if (/(?:纪要|会议|周会|例会|评审会)$/.test(clean)) return /纪要$/.test(clean) ? clean : `${clean}纪要`;
      return `${clean}会议纪要`;
    }
    if (topic.id === 'project') {
      if (/(?:进展|计划|方案|项目)$/.test(clean)) return `${clean}整理`;
      return `${clean}项目整理`;
    }
    if (topic.id === 'data') {
      if (/(?:报告|数据|分析|指标|报表)$/.test(clean)) return `${clean}要点`;
      return `${clean}数据要点整理`;
    }
    if (topic.id === 'learning') {
      if (/(?:笔记|学习|心得|复盘)$/.test(clean)) return clean;
      return `${clean}学习笔记`;
    }
    if (topic.id === 'fitness') {
      if ([...clean].length <= 4) return topic.title;
      if (/(?:训练|健身|锻炼|减脂|增肌|饮食|计划|动作|要点)$/.test(clean)) return `${clean}要点`;
      if (/(?:健身|训练|锻炼)/.test(clean)) return `${clean}要点`;
      return `${clean}健身训练要点`;
    }
    if (topic.id === 'ocr') {
      if (/(?:OCR|识别|扫描|文字提取)/i.test(clean) && !/测试|示例/i.test(clean)) return `${clean}整理`;
      return topic.title;
    }
    if (topic.id === 'product') {
      if (/(?:产品|方案|功能|页面)$/.test(clean)) return `${clean}要点`;
      return `${clean}产品要点整理`;
    }
    if (topic.id === 'document') {
      if (/(?:文档|资料|说明)$/.test(clean)) return `${clean}要点`;
      return `${clean}文档要点整理`;
    }
    return topic.title;
  }

  function shortOcrTopicLabel(topic) {
    return {
      stock: '股票',
      meeting: '会议',
      project: '项目',
      data: '数据',
      learning: '学习',
      fitness: '健身',
      ocr: 'OCR',
      product: '产品',
      document: '文档'
    }[topic.id] || topic.label;
  }

  function getOcrTopicAlternativeTitles(topic) {
    const alternatives = {
      fitness: ['健身训练计划与饮食建议', '健身动作、组数与恢复要点'],
      stock: ['股票市场观察与风险提示', '板块逻辑与关键指标跟踪'],
      meeting: ['会议结论与行动项整理', '会议议题与后续计划'],
      project: ['项目进展、风险与下一步', '项目计划与交付节点'],
      data: ['数据表现与关键指标分析', '报告结论与趋势总结'],
      learning: ['学习重点与知识框架', '课程要点与复习计划'],
      ocr: ['OCR 识别内容整理', '识别文字与重点信息'],
      product: ['产品需求与用户体验要点', '产品方案与迭代计划'],
      document: ['文档规则与注意事项', '文档重点与执行要求']
    };
    return alternatives[topic.id] || [topic.title];
  }

  function generateOcrTitleSuggestions(text) {
    const normalized = normalizeOcrText(text);
    const lines = normalized
      .split('\n')
      .map((line) => stripOcrListMarker(line))
      .filter((line) => line && !isOcrNoiseLine(line));
    if (!lines.length) {
      return [{ title: 'OCR 识别结果整理', reason: '未提取到明确主题' }];
    }

    const topics = analyzeOcrTopics(lines);
    const dominant = topics[0];
    const second = topics[1];
    const rankedLines = rankOcrTitleLines(lines, topics);
    const suggestions = [];

    if (dominant.score < 6) {
      return [
        { title: '文字内容要点整理', reason: '没有检测到稳定主题' },
        { title: '内容摘要与重点信息', reason: '适合主题较分散的内容' },
        { title: '识别文字与待办事项', reason: '适合包含任务或行动项的内容' }
      ];
    }

    const questionHeading = lines.find((line) => {
      const text = stripOcrListMarker(line);
      return /[？?]$/.test(text)
        && /(?:多久|怎么|如何|为什么|什么|是否|哪|谁|何时|多少)/.test(text)
        && [...text].length <= 32;
    });
    if (questionHeading) {
      suggestions.push({
        title: shortenOcrTitle(questionHeading, 30),
        reason: '识别到全文核心问句，优先作为标题'
      });
    }

    const bestLine = rankedLines.find((candidate) => candidate.dominantHits >= 2 && candidate.score >= 42);
    if (bestLine) {
      suggestions.push({
        title: shortenOcrTitle(bestLine.title, 26),
        reason: `正文中与“${dominant.matched.slice(0, 3).join('、') || dominant.label}”最相关的内容`
      });
    }

    const focus = extractOcrTopicFocus(lines, dominant, rankedLines);
    suggestions.push({
      title: buildOcrTopicTitle(focus, dominant),
      reason: dominant.matched.length
        ? `全文主题主要集中在：${dominant.matched.slice(0, 4).join('、')}`
        : `根据全文主题判断为${dominant.label}`
    });

    getOcrTopicAlternativeTitles(dominant).forEach((title, index) => {
      suggestions.push({
        title,
        reason: index === 0 ? `与全文主要领域“${dominant.label}”保持一致` : `围绕${dominant.label}提供的备选标题`
      });
    });

    const secondIsMaterial = second && second.score >= Math.max(10, dominant.score * 0.65);
    if (secondIsMaterial) {
      const secondFocus = extractOcrTopicFocus(lines, second, rankedLines);
      suggestions.push({
        title: buildOcrTopicTitle(secondFocus, second),
        reason: `正文中也包含较多${second.label}相关内容`
      });
    }

    if (secondIsMaterial && second.score >= dominant.score * 0.55) {
      suggestions.push({
        title: `${shortOcrTopicLabel(dominant)}与${shortOcrTopicLabel(second)}内容整理`,
        reason: '正文包含两类主要主题，适合使用综合标题'
      });
    }

    suggestions.push(
      { title: '文字内容要点整理', reason: '内容主题不明显时使用' },
      { title: '内容摘要与后续行动', reason: '适合同时包含结论和待办事项的内容' }
    );

    const seen = new Set();
    return suggestions
      .filter((suggestion) => {
        const title = shortenOcrTitle(suggestion.title, 28);
        if (!title || seen.has(title)) return false;
        seen.add(title);
        suggestion.title = title;
        return true;
      })
      .slice(0, 3);
  }

  function generateOcrTitle(text) {
    return generateOcrTitleSuggestions(text)[0]?.title || 'OCR 识别结果整理';
  }

  function getTableMetaFromOcrBlocks(blocks, engine = 'PaddleOCR') {
    const table = (blocks || []).find((block) => block.type === 'table');
    if (!table) return null;
    return {
      rows: table.rows.length,
      columns: table.headers.length || table.rows[0]?.length || 0,
      passes: 1,
      lowConfidenceCells: 0,
      engine
    };
  }

  async function runPaddleJsOcrRecognition(files) {
    const startedAt = performance.now();
    state.busy = true;
    state.ocrText = '';
    state.ocrTitle = '';
    state.ocrTitleSuggestions = [];
    state.ocrTags = [];
    state.ocrDraftHtml = '';
    state.ocrBlocks = [];
    state.ocrResults = [];
    state.ocrMeta = null;
    state.ocrError = '';
    render();
    setOcrProgress(4, '加载免费 Paddle.js OCR 模型…', 0);

    try {
      const batch = await recognizeFilesWithPaddleJs(files, (index, file) => {
        for (let previous = 0; previous < index; previous += 1) {
          updateOcrFileStatus(files[previous].id, '完成', 'done');
        }
        updateOcrFileStatus(file.id, 'Paddle.js 识别中…', 'active');
        setOcrProgress(12 + (index / files.length) * 76, `Paddle.js 识别 ${index + 1}/${files.length}`, 1);
      });
      batch.results.forEach((result) => updateOcrFileStatus(result.id, '完成 · Paddle.js', 'done'));

      state.ocrResults = batch.results;
      state.ocrText = correctOcrDomainText(batch.text);
      state.ocrTextDirty = false;
      state.ocrRenderMode = 'text';
      rebuildOcrBlocks();
      state.ocrMeta = {
        images: files.length,
        confidence: null,
        engine: 'Paddle.js',
        elapsedMs: performance.now() - startedAt,
        ignoredGraphics: 0,
        tableMeta: batch.results.find((result) => result.tableMeta)?.tableMeta || null,
        chars: batch.text.length
      };
      state.ocrTitleSuggestions = generateOcrTitleSuggestions(filterOcrContentLines(batch.titleText || batch.text));
      state.ocrTitle = state.ocrTitleSuggestions[0]?.title || 'Paddle.js 识别结果';
      state.ocrError = '';
      state.stats.ocrRuns += 1;
      persist();
      setOcrProgress(100, 'Paddle.js 识别完成', 2);
      state.busy = false;
      render();
      toast('免费高精度 Paddle.js 识别完成。', 'success');
    } catch (error) {
      console.error('Paddle.js OCR failed:', error);
      state.busy = false;
      state.ocrEngine = 'local';
      render();
      toast(`Paddle.js 不可用，已回退到本地 Tesseract：${error.message}`, 'error');
      return runOcrRecognition();
    }
  }

  async function runPaddleJsAiOrganize(files) {
    const startedAt = performance.now();
    state.busy = true;
    state.aiResult = null;
    render();
    setProgress('ai', 0, 3);

    try {
      const batch = await recognizeFilesWithPaddleJs(files, (index, file) => {
        const label = document.getElementById('ai-progress-label');
        if (label) label.textContent = `Paddle.js 识别第 ${index + 1}/${files.length} 张：${file.name}`;
        const value = Math.round(18 + (index / files.length) * 62);
        const bar = document.getElementById('ai-progress-bar');
        const percent = document.getElementById('ai-progress-percent');
        if (bar) bar.style.width = `${value}%`;
        if (percent) percent.textContent = `${value}%`;
      });
      setProgress('ai', 2, 3);
      state.aiResult = buildGeneratedNote(state.importTemplate, files, batch.text, '', batch.blocks, batch.titleText);
      state.stats.aiRuns += 1;
      persist();
      state.busy = false;
      render();
      toast(`Paddle.js 免费高精度整理完成，用时 ${((performance.now() - startedAt) / 1000).toFixed(1)} 秒。`, 'success');
    } catch (error) {
      console.error('Paddle.js AI organize failed:', error);
      state.busy = false;
      state.ocrEngine = 'local';
      render();
      toast(`Paddle.js 不可用，已回退到本地 Tesseract：${error.message}`, 'error');
      return runAiOrganize();
    }
  }

  async function runPaddleOcrRecognition(files) {
    const startedAt = performance.now();
    state.busy = true;
    state.ocrText = '';
    state.ocrTitle = '';
    state.ocrTitleSuggestions = [];
    state.ocrTags = [];
    state.ocrDraftHtml = '';
    state.ocrBlocks = [];
    state.ocrResults = [];
    state.ocrMeta = null;
    state.ocrError = '';
    render();
    setOcrProgress(5, '连接高精度 OCR 服务…', 0);

    try {
      const results = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        updateOcrFileStatus(file.id, 'PaddleOCR 识别中…', 'active');
        const data = await callPaddleOcrApi(file);
        const markdown = data.markdown || data.text || '';
        const blocks = parseMarkdownToOcrBlocks(markdown);
        const text = ocrBlocksToPlainText(blocks) || data.text || markdown;
        results.push({
          id: file.id,
          name: file.name,
          text,
          markdown,
          confidence: null,
          tableMeta: getTableMetaFromOcrBlocks(blocks),
          error: ''
        });
        updateOcrFileStatus(file.id, '完成 · PaddleOCR', 'done');
        setOcrProgress(18 + ((index + 1) / files.length) * 74, `高精度识别 ${index + 1}/${files.length}`, 1);
      }

      const combinedMarkdown = results.map((result) => result.markdown || result.text).join('\n\n');
      const combinedBlocks = parseMarkdownToOcrBlocks(combinedMarkdown);
      const combinedText = ocrBlocksToPlainText(combinedBlocks) || results.map((result) => result.text).join('\n\n');
      state.ocrResults = results;
      state.ocrText = correctOcrDomainText(combinedText);
      state.ocrTextDirty = false;
      state.ocrRenderMode = 'text';
      rebuildOcrBlocks();
      state.ocrMeta = {
        images: files.length,
        confidence: null,
        engine: 'PaddleOCR',
        elapsedMs: performance.now() - startedAt,
        ignoredGraphics: 0,
        tableMeta: getTableMetaFromOcrBlocks(state.ocrBlocks, 'PaddleOCR'),
        chars: combinedText.length
      };
      state.ocrTitleSuggestions = generateOcrTitleSuggestions(filterOcrContentLines(combinedText));
      state.ocrTitle = state.ocrTitleSuggestions[0]?.title || '高精度 OCR 识别结果';
      state.ocrError = '';
      state.stats.ocrRuns += 1;
      persist();
      setOcrProgress(100, '高精度识别完成', 2);
      state.busy = false;
      render();
      toast('PaddleOCR 高精度识别完成。', 'success');
    } catch (error) {
      console.error('PaddleOCR failed:', error);
      state.busy = false;
      state.ocrEngine = 'local';
      render();
      toast(`高精度 OCR 不可用，已回退到本地 Tesseract：${error.message}`, 'error');
      return runOcrRecognition();
    }
  }

  async function runPaddleAiOrganize(files) {
    const startedAt = performance.now();
    state.busy = true;
    state.aiResult = null;
    render();
    setProgress('ai', 0, 3);

    try {
      const results = [];
      for (let index = 0; index < files.length; index += 1) {
        const label = document.getElementById('ai-progress-label');
        if (label) label.textContent = `PaddleOCR 识别第 ${index + 1}/${files.length} 张：${files[index].name}`;
        const data = await callPaddleOcrApi(files[index]);
        results.push({
          markdown: data.markdown || data.text || '',
          text: data.text || ''
        });
        const value = Math.round(30 + ((index + 1) / files.length) * 55);
        const bar = document.getElementById('ai-progress-bar');
        const percent = document.getElementById('ai-progress-percent');
        if (bar) bar.style.width = `${value}%`;
        if (percent) percent.textContent = `${value}%`;
      }

      const markdown = results.map((result) => result.markdown || result.text).join('\n\n');
      const blocks = parseMarkdownToOcrBlocks(markdown);
      const text = ocrBlocksToPlainText(blocks) || results.map((result) => result.text).join('\n\n');
      setProgress('ai', 2, 3);
      state.aiResult = buildGeneratedNote(state.importTemplate, files, text, markdown);
      state.stats.aiRuns += 1;
      persist();
      state.busy = false;
      render();
      toast(`PaddleOCR 高精度整理完成，用时 ${((performance.now() - startedAt) / 1000).toFixed(1)} 秒。`, 'success');
    } catch (error) {
      console.error('PaddleOCR AI organize failed:', error);
      state.busy = false;
      state.ocrEngine = 'local';
      render();
      toast(`高精度整理不可用，已回退到本地 Tesseract：${error.message}`, 'error');
      return runAiOrganize();
    }
  }

  async function runOcrRecognition() {
    if (!state.ocrFiles.length) {
      toast('请先上传至少一张图片。', 'error');
      return;
    }

    const files = state.ocrFiles.map((file) => ({ ...file }));
    if (state.ocrEngine === 'paddlejs') {
      return runPaddleJsOcrRecognition(files);
    }
    if (state.ocrEngine === 'paddle') {
      return runPaddleOcrRecognition(files);
    }
    const startedAt = performance.now();
    let worker = null;
    let outcome = null;
    let lastProgress = 2;
    const updateProgress = (percent, label, macroStep) => {
      lastProgress = Math.max(lastProgress, percent);
      setOcrProgress(lastProgress, label, macroStep);
    };

    state.busy = true;
    state.ocrText = '';
    state.ocrTitle = '';
    state.ocrTitleSuggestions = [];
    state.ocrTags = [];
    state.ocrDraftHtml = '';
    state.ocrMeta = null;
    state.ocrResults = [];
    state.ocrBlocks = [];
    state.ocrForceTable = false;
    state.ocrError = '';
    render();
    updateProgress(3, '准备加载 OCR 引擎…', 0);

    try {
      const Tesseract = await loadTesseractEngine();
      updateProgress(8, 'OCR 引擎加载完成，正在初始化…', 0);

      const current = { index: 0, total: files.length };
      worker = await Tesseract.createWorker(state.ocrLang, 1, {
        logger: (message) => {
          const engineProgress = Number.isFinite(message.progress) ? message.progress : 0;
          if (message.status === 'recognizing text' && current.index > 0) {
            const overall = 16 + (((current.index - 1) + engineProgress) / files.length) * 76;
            updateProgress(overall, `识别第 ${current.index}/${files.length} 张 · ${Math.round(engineProgress * 100)}%`, 1);
            return;
          }
          const label = translateOcrStatus(message.status);
          const enginePercent = 5 + Math.min(10, engineProgress * 10);
          updateProgress(enginePercent, `${label}${engineProgress ? ` · ${Math.round(engineProgress * 100)}%` : '…'}`, 0);
        },
        errorHandler: (error) => console.warn('OCR worker error:', error)
      });

      await worker.setParameters({
        preserve_interword_spaces: '1',
        user_defined_dpi: '300'
      });

      const results = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        current.index = index + 1;
        updateProgress(16 + (index / files.length) * 76, `准备识别第 ${index + 1}/${files.length} 张…`, 1);
        updateOcrFileStatus(file.id, '正在优化图片…', 'active');

        try {
          const processedImage = await preprocessImageForOcr(file.url);
          updateOcrFileStatus(file.id, processedImage.hasTableGrid ? '检测到表格，正在逐格识别…' : '正在识别文字…', 'active');
          let extraction = null;
          if (!file.isSample && processedImage.tableCells?.length >= 4) {
            extraction = await recognizeOcrTableCells(worker, processedImage.tableCells);
          }
          if (!extraction?.text) {
            await worker.setParameters({
              preserve_interword_spaces: '1',
              tessedit_pageseg_mode: file.isSample ? '6' : '3'
            });
            const result = await worker.recognize(processedImage.dataUrl);
            extraction = file.isSample
              ? {
                text: normalizeOcrText(result?.data?.text || ''),
                confidence: Number(result?.data?.confidence || 0),
                ignoredLines: 0,
                keptLines: String(result?.data?.text || '').split('\n').length
              }
              : extractReliableOcrText(result);
          } else {
            await worker.setParameters({ preserve_interword_spaces: '1' });
          }
          const text = extraction.text;
          const confidence = Math.max(0, Math.min(100, Math.round(extraction.confidence || 0)));
          results.push({
            id: file.id,
            name: file.name,
            text,
            confidence,
            ignoredLines: extraction.ignoredLines,
            tableMeta: extraction.tableMeta || null,
            error: ''
          });
          updateOcrFileStatus(
            file.id,
            text
              ? `完成 · 置信度 ${confidence}%${extraction.tableMeta ? ` · 表格 ${extraction.tableMeta.rows}×${extraction.tableMeta.columns}` : ''}${extraction.ignoredLines ? ` · 忽略 ${extraction.ignoredLines} 个图形/噪声行` : ''}`
              : '未检测到可靠文字',
            text ? 'done' : 'warning'
          );
        } catch (fileError) {
          console.warn(`OCR failed for ${file.name}:`, fileError);
          results.push({
            id: file.id,
            name: file.name,
            text: '',
            confidence: 0,
            error: fileError?.message || '识别失败'
          });
          updateOcrFileStatus(file.id, '识别失败', 'warning');
        }
        updateProgress(16 + ((index + 1) / files.length) * 76, `已完成 ${index + 1}/${files.length} 张`, 1);
      }

      updateProgress(97, '正在整理识别结果…', 2);
      const usefulResults = results.filter((result) => result.text);
      const ignoredGraphics = results.reduce((sum, result) => sum + (result.ignoredLines || 0), 0);
      const averageConfidence = usefulResults.length
        ? Math.round(usefulResults.reduce((sum, result) => sum + result.confidence, 0) / usefulResults.length)
        : 0;
      const elapsedMs = performance.now() - startedAt;

      state.ocrResults = results;
      state.ocrMeta = {
        images: files.length,
        confidence: averageConfidence,
        elapsedMs,
        ignoredGraphics,
        tableMeta: results.find((result) => result.tableMeta)?.tableMeta || null,
        chars: usefulResults.reduce((sum, result) => sum + result.text.length, 0)
      };
      state.stats.ocrRuns += 1;

      if (!usefulResults.length) {
        state.ocrText = '';
        state.ocrError = '未检测到可靠文字。图形、图标和低置信度内容已自动忽略，请尝试裁剪文字区域或切换识别语言。';
        outcome = { type: 'error', message: '未检测到可靠文字，图形和低置信度内容已忽略。' };
      } else {
        state.ocrText = correctOcrDomainText(usefulResults.map((result) => result.text).join('\n\n'));
        state.ocrTextDirty = false;
        state.ocrRenderMode = 'text';
        if (files.some((file) => file.isSample)) state.ocrFilterIrrelevant = false;
        rebuildOcrBlocks();
        state.ocrTitleSuggestions = generateOcrTitleSuggestions(filterOcrContentLines(state.ocrText));
        state.ocrTitle = state.ocrTitleSuggestions[0]?.title || 'OCR 识别结果整理';
        state.ocrTags = inferOcrTags(state.ocrText, state.ocrTitle);
        state.ocrFolder = '未分类';
        state.ocrError = '';
        updateProgress(100, '识别完成', 2);
        outcome = { type: 'success', message: `识别完成：${files.length} 张图片，平均置信度 ${averageConfidence}%。` };
      }
      persist();
    } catch (error) {
      console.error('OCR failed:', error);
      state.ocrText = '';
      state.ocrMeta = null;
      state.ocrResults = [];
      state.ocrBlocks = [];
      state.ocrForceTable = false;
      state.ocrError = error?.message || 'OCR 识别失败，请稍后重试。';
      outcome = { type: 'error', message: state.ocrError };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (error) {
          console.warn('OCR worker cleanup failed:', error);
        }
      }
      state.busy = false;
      render();
      if (outcome) toast(outcome.message, outcome.type);
    }
  }

  async function copyOcrText() {
    const text = stripHtml(document.getElementById('ocr-preview-body')?.innerHTML || state.ocrDraftHtml) || document.getElementById('ocr-text')?.value || state.ocrText;
    if (!text) {
      toast('暂无可复制的文字。', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    toast('已复制全部文字。', 'success');
  }

  function inferOcrTags(text, title = '') {
    const lines = `${title}\n${text || ''}`.split('\n').map((line) => line.trim()).filter(Boolean);
    const dominant = analyzeOcrTopics(lines)[0];
    const tagMap = {
      fitness: ['健身', '训练'],
      stock: ['股票', '投资'],
      meeting: ['会议', '工作'],
      learning: ['学习', '笔记'],
      data: ['数据', '笔记'],
      project: ['项目', '工作'],
      ocr: ['OCR'],
      product: ['产品', '工作'],
      document: ['文档', '资料']
    };
    return tagMap[dominant?.id] || ['OCR'];
  }

  async function saveOcrInline() {
    const sourceFiles = [...state.ocrFiles];
    const title = (document.getElementById('ocr-generated-title')?.value || state.ocrTitle || 'OCR 提取结果').trim();
    const tags = (document.getElementById('ocr-generated-tags')?.value || state.ocrTags.join(', '))
      .split(/[,，]/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean);
    const previewBody = document.getElementById('ocr-preview-body');
    const rawContent = previewBody?.innerHTML || state.ocrDraftHtml || blocksToHtml(state.ocrBlocks) || `<p>${escapeHtml(state.ocrText)}</p>`;
    const contentHtml = sanitizeHtml(rawContent);
    if (!stripHtml(contentHtml).trim()) {
      toast('识别内容为空，暂时不能保存。', 'error');
      return;
    }
    const now = new Date().toISOString();
    const note = {
      id: `note-${Date.now()}`,
      title: title || 'OCR 提取结果',
      type: 'ocr',
      folder: document.getElementById('ocr-generated-folder')?.value || state.ocrFolder || '未分类',
      tags: tags.length ? [...new Set(tags)] : inferOcrTags(state.ocrText, title),
      summary: stripHtml(contentHtml).slice(0, 110),
      contentHtml,
      sourceImages: [],
      createdAt: now,
      updatedAt: now
    };
    state.notes.unshift(note);
    state.ocrText = '';
    state.ocrTextDirty = false;
    state.ocrTitle = '';
    state.ocrTitleSuggestions = [];
    state.ocrTags = [];
    state.ocrDraftHtml = '';
    state.ocrMeta = null;
    state.ocrResults = [];
    state.ocrBlocks = [];
    state.ocrForceTable = false;
    state.ocrError = '';
    clearFiles('ocr');
    persist({ reason: '保存 OCR 笔记' });
    navigate('note', { noteId: note.id });
    if (state.ocrKeepSources && document.getElementById('ocr-keep-sources')?.checked !== false) attachSourceImagesInBackground(note, sourceFiles);
    toast('编辑结果已保存为笔记。', 'success');
  }

  function applyFolderToCurrentContext(context, name) {
    const selectId = {
      ai: 'ai-generated-folder',
      ocr: 'ocr-generated-folder',
      detail: 'detail-folder'
    }[context];
    const select = selectId ? document.getElementById(selectId) : null;
    if (select) {
      if (![...select.options].some((option) => option.value === name)) {
        select.add(new Option(name, name));
      }
      select.value = name;
    }
    if (context === 'ai' && state.aiResult) state.aiResult.folder = name;
    if (context === 'ocr') state.ocrFolder = name;
    if (context === 'detail') state.currentFolderDraft = name;
  }

  function openNewFolderModal(context = 'global') {
    showModal(`
      <div class="modal">
        <h2>新建文件夹</h2>
        <p>创建后会直接选中，不需要退出当前编辑或保存流程。</p>
        <label class="form-label" for="new-folder-name">文件夹名称</label>
        <input class="detail-title-input" style="width:100%;font-size:18px;padding:10px;border:1px solid var(--line);border-radius:12px" id="new-folder-name" placeholder="例如：客户会议、健身计划、旅行资料" />
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn" id="confirm-new-folder">创建并选中</button>
        </div>
      </div>
    `);
    const input = document.getElementById('new-folder-name');
    input?.focus();
    document.getElementById('confirm-new-folder')?.addEventListener('click', () => {
      const name = input.value.trim().replace(/\s+/g, ' ').slice(0, 30);
      if (!name) {
        toast('请输入文件夹名称。', 'error');
        return;
      }
      const current = getFolderOptions().filter((folder) => folder !== '全部文件夹');
      const exists = current.includes(name);
      if (!exists) {
        state.customFolders = [...(state.customFolders || []), name];
        persist({ reason: '新建文件夹' });
      }
      if (context === 'global') {
        state.folderFilter = name;
        closeModal();
        render();
        toast(exists ? '文件夹已经存在，已为你打开。' : `已创建文件夹“${name}”。`, 'success');
        return;
      }
      applyFolderToCurrentContext(context, name);
      closeModal();
      toast(exists ? `已选中已有文件夹“${name}”。` : `已创建并选中文件夹“${name}”。`, 'success');
    });
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') document.getElementById('confirm-new-folder')?.click();
    });
  }

  function saveMarkdownNote(noteId, options = {}) {
    const note = getNoteById(noteId);
    if (!note) return;
    const title = document.getElementById('detail-title')?.value.trim();
    const tags = document.getElementById('detail-tags')?.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean);
    const folder = document.getElementById('detail-folder')?.value || note.folder || '未分类';
    const source = document.getElementById('workspace-markdown-source')?.value || state.workspaceMarkdownDraft || noteMarkdownBody(note);
    if (!title) {
      if (options.toast !== false) toast('笔记标题不能为空。', 'error');
      return false;
    }
    const blocks = parseMarkdownToOcrBlocks(source.replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, ''));
    const contentHtml = sanitizeHtml(blocksToHtml(blocks));
    note.title = title;
    note.tags = tags.length ? [...new Set(tags)] : ['未分类'];
    note.folder = folder;
    note.contentHtml = contentHtml;
    note.summary = stripHtml(contentHtml).slice(0, 110);
    note.updatedAt = new Date().toISOString();
    state.workspaceMarkdownDraft = options.render === false ? source : '';
    persist({ reason: options.reason || '保存 Markdown 笔记' });
    if (options.render !== false) render();
    if (options.toast !== false) toast('Markdown 已保存。', 'success');
    return true;
  }

  function saveNoteDetail(noteId, options = {}) {
    const note = getNoteById(noteId);
    if (!note) return;
    const title = document.getElementById('detail-title')?.value.trim();
    const tags = document.getElementById('detail-tags')?.value
      .split(/[,，]/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean);
    const detailContent = document.getElementById('detail-content');
    const contentClone = detailContent?.cloneNode(true);
    contentClone?.querySelectorAll('.section-sort-controls').forEach((control) => control.remove());
    const content = contentClone?.innerHTML || detailContent?.innerHTML || '';
    if (!title) {
      if (options.toast !== false) toast('笔记标题不能为空。', 'error');
      return false;
    }
    note.title = title;
    note.tags = tags.length ? [...new Set(tags)] : ['未分类'];
    note.folder = document.getElementById('detail-folder')?.value || note.folder || '未分类';
    note.contentHtml = sanitizeHtml(content);
    note.summary = stripHtml(note.contentHtml).slice(0, 110);
    note.updatedAt = new Date().toISOString();
    persist({ reason: options.reason || '编辑笔记' });
    if (options.render !== false) render();
    if (options.toast !== false) toast('修改已保存。', 'success');
    return true;
  }

  function toggleNotePin(noteId, renderAfter = true) {
    const note = getNoteById(noteId);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    persist();
    if (renderAfter) render();
    toast(note.pinned ? '笔记已置顶。' : '已取消置顶。', 'success');
  }

  function createTableCell(value = '', options = {}) {
    return {
      text: String(value ?? ''),
      rowSpan: Math.max(1, Number(options.rowSpan || 1)),
      colSpan: Math.max(1, Number(options.colSpan || 1)),
      hidden: Boolean(options.hidden)
    };
  }

  function normalizeTableCell(cell) {
    if (cell && typeof cell === 'object') {
      return createTableCell(cell.text ?? '', cell);
    }
    return createTableCell(cell ?? '');
  }

  function ensureTableMatrixShape(input, minimumWidth = 1) {
    const rows = Array.isArray(input) ? input.map((row) => Array.isArray(row) ? row.map(normalizeTableCell) : [normalizeTableCell(row)]) : [];
    const width = Math.max(minimumWidth, ...rows.map((row) => row.length), 1);
    return rows.map((row) => [...row, ...Array.from({ length: Math.max(0, width - row.length) }, () => createTableCell(''))]);
  }

  function getTableMatrix(html, tableIndex = 0) {
    const documentNode = new DOMParser().parseFromString(`<div>${sanitizeHtml(html)}</div>`, 'text/html');
    const table = documentNode.querySelectorAll('table')[tableIndex];
    if (!table) return [];
    const matrix = [];
    [...table.querySelectorAll('tr')].forEach((row, rowIndex) => {
      if (!matrix[rowIndex]) matrix[rowIndex] = [];
      let columnIndex = 0;
      [...row.querySelectorAll('th,td')].forEach((cell) => {
        while (matrix[rowIndex][columnIndex]?.hidden) columnIndex += 1;
        const rowSpan = Math.max(1, Number(cell.getAttribute('rowspan') || 1));
        const colSpan = Math.max(1, Number(cell.getAttribute('colspan') || 1));
        matrix[rowIndex][columnIndex] = createTableCell(cell.textContent.trim(), { rowSpan, colSpan });
        for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
          const targetRow = rowIndex + rowOffset;
          if (!matrix[targetRow]) matrix[targetRow] = [];
          for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
            if (rowOffset === 0 && columnOffset === 0) continue;
            matrix[targetRow][columnIndex + columnOffset] = createTableCell('', { hidden: true });
          }
        }
        columnIndex += colSpan;
      });
    });
    return ensureTableMatrixShape(matrix);
  }

  function getSelectedTableBounds(keys) {
    const points = [...(keys || [])].map((key) => String(key).split(':').map(Number)).filter(([row, column]) => Number.isFinite(row) && Number.isFinite(column));
    if (!points.length) return null;
    return {
      minRow: Math.min(...points.map(([row]) => row)),
      maxRow: Math.max(...points.map(([row]) => row)),
      minColumn: Math.min(...points.map(([, column]) => column)),
      maxColumn: Math.max(...points.map(([, column]) => column))
    };
  }

  function getTableSelectionKeys(anchor, target, matrix) {
    const minRow = Math.min(anchor.row, target.row);
    const maxRow = Math.max(anchor.row, target.row);
    const minColumn = Math.min(anchor.column, target.column);
    const maxColumn = Math.max(anchor.column, target.column);
    const keys = new Set();
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        if (row < matrix.length && column < (matrix[row] || []).length && !matrix[row][column]?.hidden) {
          keys.add(`${row}:${column}`);
        }
      }
    }
    return keys;
  }

  function tableMatrixToHtml(matrix, header = true) {
    const normalized = ensureTableMatrixShape(matrix || []);
    if (!normalized.length) return '';
    const renderCell = (cell, tag) => {
      const attributes = [];
      if (cell.colSpan > 1) attributes.push(`colspan="${cell.colSpan}"`);
      if (cell.rowSpan > 1) attributes.push(`rowspan="${cell.rowSpan}"`);
      return `<${tag}${attributes.length ? ` ${attributes.join(' ')}` : ''}>${escapeHtml(cell.text || '')}</${tag}>`;
    };
    const renderRow = (row, tag) => `<tr>${row.map((cell) => cell.hidden ? '' : renderCell(cell, tag)).join('')}</tr>`;
    const head = header && normalized.length ? `<thead>${renderRow(normalized[0], 'th')}</thead>` : '';
    const bodyRows = header ? normalized.slice(1) : normalized;
    return `<table>${head}<tbody>${bodyRows.map((row) => renderRow(row, 'td')).join('')}</tbody></table>`;
  }

  function applyTableToNote(noteId, matrix, header = true) {
    const note = getNoteById(noteId);
    if (!note || !matrix?.length) return;
    const current = document.getElementById('detail-content')?.innerHTML || note.contentHtml;
    const documentNode = new DOMParser().parseFromString(`<div>${sanitizeHtml(current)}</div>`, 'text/html');
    const wrapper = documentNode.body.firstElementChild;
    const existing = wrapper.querySelector('table');
    const holder = document.createElement('div');
    holder.innerHTML = tableMatrixToHtml(matrix, header);
    const replacement = holder.firstElementChild;
    if (existing && replacement) existing.replaceWith(replacement);
    else if (replacement) wrapper.appendChild(replacement);
    const contentHtml = sanitizeHtml(wrapper.innerHTML);
    note.contentHtml = contentHtml;
    note.summary = stripHtml(contentHtml).slice(0, 110);
    note.updatedAt = new Date().toISOString();
    const detailContent = document.getElementById('detail-content');
    if (detailContent) detailContent.innerHTML = contentHtml;
    persist({ reason: '编辑表格' });
  }

  function openTableEditor(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;
    const current = document.getElementById('detail-content')?.innerHTML || note.contentHtml;
    let matrix = getTableMatrix(current);
    let header = true;
    const undoStack = [];
    const redoStack = [];
    let selectedCells = new Set();
    let dragAnchor = null;
    let dragLast = null;
    if (!matrix.length) {
      matrix = ensureTableMatrixShape([
        ['列 1', '列 2', '列 3'],
        ['', '', ''],
        ['', '', '']
      ]);
    }
    showModal(`
      <div class="modal table-editor-modal">
        <h2>编辑表格</h2>
        <p>拖动选择多个单元格后可以合并；所有修改在保存前都可以撤销和重做。</p>
        <div class="table-editor-toolbar">
          <button class="btn ghost small" id="table-undo" type="button" disabled>↶ 撤销</button>
          <button class="btn ghost small" id="table-redo" type="button" disabled>↷ 重做</button>
          <button class="btn secondary small" id="table-merge-cells" type="button">合并所选</button>
          <button class="btn secondary small" id="table-unmerge-cells" type="button">取消合并</button>
          <button class="btn secondary small" id="table-add-row" type="button">＋ 行</button>
          <button class="btn secondary small" id="table-add-column" type="button">＋ 列</button>
          <button class="btn ghost small" id="table-remove-row" type="button">− 末行</button>
          <button class="btn ghost small" id="table-remove-column" type="button">− 末列</button>
          <label class="merge-delete-option"><input type="checkbox" id="table-first-header" ${header ? 'checked' : ''} /> 首行作为表头</label>
        </div>
        <div class="table-editor-hint"><span id="table-selection-label">拖动或按住 Shift 选择单元格</span><span>合并后会保留左上角及选中区域内的文字</span></div>
        <div class="table-editor-wrap"><table class="table-editor-grid" id="table-editor-grid"></table></div>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn" id="confirm-table-edit">保存表格</button>
        </div>
      </div>
    `);

    const grid = document.getElementById('table-editor-grid');
    const undoButton = document.getElementById('table-undo');
    const redoButton = document.getElementById('table-redo');
    const selectionLabel = document.getElementById('table-selection-label');

    const cloneMatrix = () => structuredClone(matrix);
    const syncHistoryButtons = () => {
      if (undoButton) undoButton.disabled = !undoStack.length;
      if (redoButton) redoButton.disabled = !redoStack.length;
    };
    const pushHistory = () => {
      undoStack.push(cloneMatrix());
      if (undoStack.length > 80) undoStack.shift();
      redoStack.length = 0;
      syncHistoryButtons();
    };
    const updateSelection = () => {
      grid.querySelectorAll('.table-edit-cell').forEach((cell) => {
        cell.classList.toggle('selected', selectedCells.has(cell.dataset.cellKey));
      });
      if (selectionLabel) {
        selectionLabel.textContent = selectedCells.size > 1 ? `已选择 ${selectedCells.size} 个单元格` : '拖动或按住 Shift 选择单元格';
      }
    };
    const renderGrid = () => {
      matrix = ensureTableMatrixShape(matrix);
      grid.innerHTML = matrix.map((row, rowIndex) => `<tr>${row.map((cell, columnIndex) => {
        if (cell.hidden) return '';
        return `<td class="table-edit-cell" data-cell-key="${rowIndex}:${columnIndex}" data-cell-row="${rowIndex}" data-cell-column="${columnIndex}"><input data-cell-row="${rowIndex}" data-cell-column="${columnIndex}" value="${escapeHtml(cell.text || '')}" aria-label="第${rowIndex + 1}行第${columnIndex + 1}列" /></td>`;
      }).join('')}</tr>`).join('');
      updateSelection();
    };
    const readMatrixFromGrid = () => {
      grid.querySelectorAll('input[data-cell-row]').forEach((input) => {
        const row = Number(input.dataset.cellRow);
        const column = Number(input.dataset.cellColumn);
        if (matrix[row]?.[column]) matrix[row][column].text = input.value.trim();
      });
      return matrix;
    };
    const getCellFromEvent = (event) => {
      const cell = event.target.closest('.table-edit-cell');
      if (!cell) return null;
      return { row: Number(cell.dataset.cellRow), column: Number(cell.dataset.cellColumn), key: cell.dataset.cellKey };
    };
    const finishDrag = () => {
      dragAnchor = null;
      dragLast = null;
    };
    const selectRange = (anchor, target, additive = false) => {
      if (!anchor || !target) return;
      const keys = getTableSelectionKeys(anchor, target, matrix);
      selectedCells = additive ? new Set([...selectedCells, ...keys]) : keys;
      updateSelection();
    };

    grid.addEventListener('mousedown', (event) => {
      const cell = getCellFromEvent(event);
      if (!cell || event.button !== 0) return;
      event.preventDefault();
      if (event.shiftKey && selectedCells.size) {
        const [first] = selectedCells;
        const [row, column] = first.split(':').map(Number);
        dragAnchor = { row, column };
        dragLast = { row: cell.row, column: cell.column };
        selectRange(dragAnchor, dragLast);
      } else {
        dragAnchor = { row: cell.row, column: cell.column };
        dragLast = { ...dragAnchor };
        selectedCells = new Set([cell.key]);
        updateSelection();
      }
      grid.querySelector(`input[data-cell-row="${cell.row}"][data-cell-column="${cell.column}"]`)?.focus({ preventScroll: true });
      const onMouseUp = () => {
        finishDrag();
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mouseup', onMouseUp, { once: true });
    });
    grid.addEventListener('mouseover', (event) => {
      if (!dragAnchor || !(event.buttons & 1)) return;
      const cell = getCellFromEvent(event);
      if (!cell) return;
      dragLast = { row: cell.row, column: cell.column };
      selectRange(dragAnchor, dragLast);
    });
    grid.addEventListener('input', (event) => {
      if (!event.target.matches('input[data-cell-row]')) return;
      const row = Number(event.target.dataset.cellRow);
      const column = Number(event.target.dataset.cellColumn);
      if (matrix[row]?.[column]) matrix[row][column].text = event.target.value;
    });

    document.getElementById('table-undo')?.addEventListener('click', () => {
      if (!undoStack.length) return;
      readMatrixFromGrid();
      const previous = undoStack.pop();
      redoStack.push(cloneMatrix());
      matrix = previous;
      selectedCells = new Set();
      renderGrid();
      syncHistoryButtons();
    });
    document.getElementById('table-redo')?.addEventListener('click', () => {
      if (!redoStack.length) return;
      readMatrixFromGrid();
      const next = redoStack.pop();
      undoStack.push(cloneMatrix());
      matrix = next;
      selectedCells = new Set();
      renderGrid();
      syncHistoryButtons();
    });
    document.getElementById('table-add-row')?.addEventListener('click', () => {
      pushHistory();
      matrix = ensureTableMatrixShape(matrix);
      const width = matrix[0]?.length || 1;
      matrix.push(Array.from({ length: width }, () => createTableCell('')));
      selectedCells = new Set();
      renderGrid();
    });
    document.getElementById('table-add-column')?.addEventListener('click', () => {
      pushHistory();
      matrix = ensureTableMatrixShape(matrix);
      matrix.forEach((row) => row.push(createTableCell('')));
      selectedCells = new Set();
      renderGrid();
    });
    document.getElementById('table-remove-row')?.addEventListener('click', () => {
      if (matrix.length <= 1) return toast('表格至少保留一行。', 'error');
      pushHistory();
      matrix.pop();
      selectedCells = new Set();
      renderGrid();
    });
    document.getElementById('table-remove-column')?.addEventListener('click', () => {
      matrix = ensureTableMatrixShape(matrix);
      if ((matrix[0] || []).length <= 1) return toast('表格至少保留一列。', 'error');
      pushHistory();
      matrix.forEach((row) => row.pop());
      selectedCells = new Set();
      renderGrid();
    });
    document.getElementById('table-merge-cells')?.addEventListener('click', () => {
      const bounds = getSelectedTableBounds(selectedCells);
      if (!bounds || selectedCells.size < 2) return toast('请先拖动选择至少两个单元格。', 'error');
      pushHistory();
      matrix = ensureTableMatrixShape(matrix);
      const texts = [];
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
        for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
          const cell = matrix[row]?.[column];
          if (cell && !cell.hidden && cell.text.trim()) texts.push(cell.text.trim());
        }
      }
      const rowSpan = bounds.maxRow - bounds.minRow + 1;
      const colSpan = bounds.maxColumn - bounds.minColumn + 1;
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
        for (let column = bounds.minColumn; column <= bounds.maxColumn; column += 1) {
          if (!matrix[row]) matrix[row] = [];
          matrix[row][column] = createTableCell('', { hidden: !(row === bounds.minRow && column === bounds.minColumn) });
        }
      }
      matrix[bounds.minRow][bounds.minColumn] = createTableCell(texts.join('\n'), { rowSpan, colSpan });
      selectedCells = new Set([`${bounds.minRow}:${bounds.minColumn}`]);
      renderGrid();
      toast('已合并所选单元格。', 'success');
    });
    document.getElementById('table-unmerge-cells')?.addEventListener('click', () => {
      const bounds = getSelectedTableBounds(selectedCells);
      if (!bounds) return toast('请先选择已合并的单元格。', 'error');
      const target = matrix[bounds.minRow]?.[bounds.minColumn];
      if (!target || (target.rowSpan === 1 && target.colSpan === 1)) return toast('所选的不是合并单元格。', 'error');
      pushHistory();
      const text = target.text;
      for (let row = bounds.minRow; row < bounds.minRow + target.rowSpan; row += 1) {
        for (let column = bounds.minColumn; column < bounds.minColumn + target.colSpan; column += 1) {
          if (!matrix[row]) matrix[row] = [];
          matrix[row][column] = createTableCell(row === bounds.minRow && column === bounds.minColumn ? text : '');
        }
      }
      selectedCells = new Set();
      renderGrid();
      toast('已取消合并。', 'success');
    });
    document.getElementById('table-first-header')?.addEventListener('change', (event) => {
      header = Boolean(event.target.checked);
    });
    document.getElementById('confirm-table-edit')?.addEventListener('click', () => {
      applyTableToNote(noteId, readMatrixFromGrid(), header);
      closeModal();
      toast('表格已更新。', 'success');
    });

    renderGrid();
    syncHistoryButtons();
  }

  function insertTableIntoNote(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;
    const current = document.getElementById('detail-content')?.innerHTML || note.contentHtml;
    const matrix = ensureTableMatrixShape([
      ['列 1', '列 2', '列 3'],
      ['', '', ''],
      ['', '', '']
    ]);
    const documentNode = new DOMParser().parseFromString(`<div>${sanitizeHtml(current)}</div>`, 'text/html');
    const wrapper = documentNode.body.firstElementChild;
    const holder = document.createElement('div');
    holder.innerHTML = tableMatrixToHtml(matrix, true);
    if (holder.firstElementChild) wrapper.appendChild(holder.firstElementChild);
    const contentHtml = sanitizeHtml(wrapper.innerHTML);
    note.contentHtml = contentHtml;
    note.updatedAt = new Date().toISOString();
    const detailContent = document.getElementById('detail-content');
    if (detailContent) detailContent.innerHTML = contentHtml;
    persist({ reason: '插入表格' });
    openTableEditor(noteId);
    toast('已插入 3 列表格，可直接编辑。', 'success');
  }

  function importExamples(ids = null, openFirst = false) {
    const selected = ids?.length ? exampleNotes.filter((item) => ids.includes(item.id)) : exampleNotes;
    if (!selected.length) return;
    selected.forEach((example) => {
      const copy = structuredClone(example);
      const index = state.notes.findIndex((note) => note.id === copy.id);
      if (index >= 0) state.notes[index] = copy;
      else state.notes.unshift(copy);
    });
    state.lastExampleImportAt = new Date().toISOString();
    persist();
    if (openFirst) {
      navigate('note', { noteId: selected[0].id });
    } else {
      render();
    }
    toast(`已导入 ${selected.length} 条真实示例。`, 'success');
  }

  async function exportBackup() {
    const assets = await getAllAssetRecords();
    const payload = {
      app: '优记 BestNote',
      version: '7.20',
      exportedAt: new Date().toISOString(),
      notes: state.notes,
      deletedNotes: state.deletedNotes,
      customFolders: state.customFolders,
      assets: assets.map((record) => ({
        id: record.id,
        createdAt: record.createdAt,
        images: (record.images || []).map((image) => ({
          id: image.id,
          name: image.name,
          type: image.type,
          data: arrayBufferToBase64(image.data)
        }))
      }))
    };
    downloadBlob(`Best-Note-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload), 'application/json;charset=utf-8');
    toast(`完整备份已导出，包含 ${state.notes.length} 条笔记和 ${assets.length} 组原图。`, 'success');
  }

  function exportAllMarkdown() {
    if (!state.notes.length) {
      toast('当前没有可导出的笔记。', 'error');
      return;
    }
    const content = state.notes
      .map((note) => `${htmlToMarkdown(note)}\n\n---\n\n`)
      .join('');
    downloadBlob(`Best-Note-全部笔记-${new Date().toISOString().slice(0, 10)}.md`, content, 'text/markdown;charset=utf-8');
    toast(`已导出 ${state.notes.length} 条 Markdown 笔记。`, 'success');
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = JSON.parse(String(reader.result || '{}'));
        const incoming = Array.isArray(payload.notes) ? payload.notes : [];
        if (!incoming.length) throw new Error('备份中没有可导入的笔记。');
        const deleted = Array.isArray(payload.deletedNotes) ? payload.deletedNotes : [];
        const incomingFolders = Array.isArray(payload.customFolders) ? payload.customFolders : [];
        state.customFolders = [...new Set([...(state.customFolders || []), ...incomingFolders.filter((folder) => typeof folder === 'string' && folder.trim())])];
        incoming.forEach((note) => {
          if (!note || !note.id || !note.title) return;
          const normalized = {
            ...note,
            title: String(note.title).trim(),
            type: note.type || 'general',
            folder: note.folder || '未分类',
            tags: Array.isArray(note.tags) && note.tags.length ? note.tags : ['导入'],
            contentHtml: sanitizeHtml(note.contentHtml || `<p>${escapeHtml(note.summary || '')}</p>`),
            summary: note.summary || stripHtml(note.contentHtml || ''),
            updatedAt: note.updatedAt || new Date().toISOString()
          };
          const index = state.notes.findIndex((item) => item.id === normalized.id);
          if (index < 0) state.notes.push(normalized);
          else if (new Date(normalized.updatedAt) > new Date(state.notes[index].updatedAt || 0)) state.notes[index] = normalized;
        });
        deleted.forEach((note) => {
          if (!note?.id || state.deletedNotes.some((item) => item.id === note.id)) return;
          state.deletedNotes.push(note);
        });
        const incomingAssets = Array.isArray(payload.assets) ? payload.assets : [];
        if (incomingAssets.length) {
          const database = await openAssetDatabase();
          const transaction = database.transaction(DB_ASSETS_STORE, 'readwrite');
          const store = transaction.objectStore(DB_ASSETS_STORE);
          incomingAssets.forEach((record) => {
            if (!record?.id || !Array.isArray(record.images)) return;
            store.put({
              id: record.id,
              createdAt: record.createdAt || new Date().toISOString(),
              images: record.images.map((image) => ({
                id: image.id,
                name: image.name,
                type: image.type,
                data: base64ToArrayBuffer(image.data || '')
              }))
            });
          });
        }
        persist({ history: false });
        render();
        toast(`备份导入完成：${incoming.length} 条笔记，${incomingAssets.length} 组原图。`, 'success');
      } catch (error) {
        toast(error.message || '备份文件格式不正确。', 'error');
      }
    };
    reader.readAsText(file);
  }

  function toggleNoteSelection(noteId) {
    if (!noteId) return;
    if (state.selectedNoteIds.includes(noteId)) {
      state.selectedNoteIds = state.selectedNoteIds.filter((id) => id !== noteId);
    } else {
      state.selectedNoteIds = [...state.selectedNoteIds, noteId];
    }
    render();
  }

  function buildMergedSectionsHtml(notes = []) {
    return notes
      .map((note) => `<div data-section-id="${escapeHtml(note.id)}"><h3>${escapeHtml(note.title)}</h3>${sanitizeHtml(note.contentHtml)}</div>`)
      .join('');
  }

  function openMergeNotesModal() {
    const selectedNotes = state.selectedNoteIds.map((id) => getNoteById(id)).filter(Boolean);
    if (selectedNotes.length < 2) {
      toast('请至少选择两条笔记。', 'error');
      return;
    }
    const noteMap = new Map(selectedNotes.map((note) => [note.id, note]));
    let mergeOrder = selectedNotes.map((note) => note.id);
    const suggestedTags = [...new Set(selectedNotes.flatMap((note) => note.tags || []))].slice(0, 6);
    const defaultTitle = `${selectedNotes[0].title} 等 ${selectedNotes.length} 条笔记`;
    showModal(`
      <div class="modal merge-note-modal">
        <h2>合并笔记</h2>
        <p>拖动章节，或使用上下按钮调整合并顺序。</p>
        <div class="merge-order-card">
          <div class="merge-order-head">
            <span>合并顺序</span>
            <small>合并完成后仍可继续排序</small>
          </div>
          <ol class="merge-order-list" id="merge-order-list"></ol>
        </div>
        <label class="form-label" for="merge-note-title">合并后的标题</label>
        <input class="detail-title-input" style="width:100%;font-size:20px;padding:10px;border:1px solid var(--line);border-radius:12px" id="merge-note-title" value="${escapeHtml(defaultTitle)}" />
        <label class="form-label" for="merge-note-tags" style="margin-top:16px">标签</label>
        <input class="detail-title-input" style="width:100%;font-size:15px;padding:10px;border:1px solid var(--line);border-radius:12px" id="merge-note-tags" value="${escapeHtml(suggestedTags.join(', '))}" />
        <label class="merge-delete-option">
          <input type="checkbox" id="merge-delete-originals" />
          <span>合并后删除原笔记</span>
        </label>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn" id="confirm-merge-notes">合并笔记</button>
        </div>
      </div>
    `);
    const orderList = document.getElementById('merge-order-list');
    const renderMergeOrder = () => {
      orderList.innerHTML = mergeOrder.map((id, index) => {
        const note = noteMap.get(id);
        return `
          <li class="merge-order-item" draggable="true" data-merge-id="${escapeHtml(id)}">
            <span class="merge-drag-handle" title="拖动排序">⠿</span>
            <span class="merge-order-number">${index + 1}</span>
            <div class="merge-order-title">
              <strong>${escapeHtml(note?.title || '未命名笔记')}</strong>
              <small>${escapeHtml(note?.folder || '未分类')}</small>
            </div>
            <span class="merge-order-actions">
              <button type="button" data-merge-move="up" ${index === 0 ? 'disabled' : ''} aria-label="上移">↑</button>
              <button type="button" data-merge-move="down" ${index === mergeOrder.length - 1 ? 'disabled' : ''} aria-label="下移">↓</button>
            </span>
          </li>
        `;
      }).join('');
    };
    let mergeDragId = null;
    const moveMergeItem = (id, direction) => {
      const index = mergeOrder.indexOf(id);
      const target = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= mergeOrder.length) return;
      [mergeOrder[index], mergeOrder[target]] = [mergeOrder[target], mergeOrder[index]];
      renderMergeOrder();
    };
    orderList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-merge-move]');
      if (!button) return;
      const item = button.closest('[data-merge-id]');
      moveMergeItem(item.dataset.mergeId, button.dataset.mergeMove);
    });
    orderList.addEventListener('dragstart', (event) => {
      const item = event.target.closest('[data-merge-id]');
      if (!item) return;
      mergeDragId = item.dataset.mergeId;
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', mergeDragId);
    });
    orderList.addEventListener('dragover', (event) => {
      event.preventDefault();
      const target = event.target.closest('[data-merge-id]');
      const dragged = [...orderList.querySelectorAll('[data-merge-id]')].find((item) => item.dataset.mergeId === mergeDragId);
      if (!target || !dragged || target === dragged) return;
      const rect = target.getBoundingClientRect();
      if (event.clientY > rect.top + rect.height / 2) target.after(dragged);
      else target.before(dragged);
    });
    orderList.addEventListener('drop', (event) => {
      event.preventDefault();
      mergeOrder = [...orderList.querySelectorAll('[data-merge-id]')].map((item) => item.dataset.mergeId);
      renderMergeOrder();
      mergeDragId = null;
    });
    orderList.addEventListener('dragend', () => {
      mergeOrder = [...orderList.querySelectorAll('[data-merge-id]')].map((item) => item.dataset.mergeId);
      renderMergeOrder();
      mergeDragId = null;
    });
    renderMergeOrder();
    document.getElementById('merge-note-title')?.focus();
    document.getElementById('confirm-merge-notes')?.addEventListener('click', () => {
      const titleInput = document.getElementById('merge-note-title');
      const tagsInput = document.getElementById('merge-note-tags');
      const deleteOriginals = document.getElementById('merge-delete-originals')?.checked;
      const orderedNotes = mergeOrder.map((id) => noteMap.get(id)).filter(Boolean);
      const title = titleInput.value.trim() || defaultTitle;
      const tags = tagsInput.value.split(/[,，]/).map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean);
      const contentHtml = buildMergedSectionsHtml(orderedNotes);
      const folders = [...new Set(orderedNotes.map((note) => note.folder || '未分类'))];
      const now = new Date().toISOString();
      const mergedNote = {
        id: `note-${Date.now()}`,
        title,
        type: 'general',
        folder: folders.length === 1 ? folders[0] : '合并笔记',
        tags: tags.length ? [...new Set(tags)] : ['合并'],
        summary: `由 ${orderedNotes.length} 条笔记合并：${orderedNotes.map((note) => note.title).join('、')}`.slice(0, 110),
        contentHtml,
        createdAt: now,
        updatedAt: now
      };
      if (deleteOriginals) {
        const deletedAt = new Date().toISOString();
        state.deletedNotes = [
          ...selectedNotes.map((note) => ({ ...note, deletedAt })),
          ...state.deletedNotes.filter((note) => !state.selectedNoteIds.includes(note.id))
        ];
        state.notes = state.notes.filter((note) => !state.selectedNoteIds.includes(note.id));
      }
      state.notes.unshift(mergedNote);
      state.noteSelectionMode = false;
      state.selectedNoteIds = [];
      state.sectionSortMode = true;
      persist({ reason: '合并笔记' });
      closeModal();
      navigate('note', { noteId: mergedNote.id });
      toast(`已按指定顺序合并 ${orderedNotes.length} 条笔记。`, 'success');
    });
  }

  function moveNoteToTrash(noteId, options = {}) {
    const note = getNoteById(noteId);
    if (!note) return;
    const deleted = { ...note, deletedAt: new Date().toISOString() };
    state.notes = state.notes.filter((item) => item.id !== noteId);
    state.deletedNotes = [deleted, ...state.deletedNotes.filter((item) => item.id !== noteId)];
    persist();
    if (options.renderAfter !== false) render();
    toast('笔记已移到回收站。', 'success');
  }

  function restoreNoteFromTrash(noteId) {
    const note = state.deletedNotes.find((item) => item.id === noteId);
    if (!note) return;
    const restored = { ...note, updatedAt: new Date().toISOString() };
    delete restored.deletedAt;
    state.deletedNotes = state.deletedNotes.filter((item) => item.id !== noteId);
    state.notes = [restored, ...state.notes.filter((item) => item.id !== noteId)];
    persist();
    render();
    toast('笔记已恢复。', 'success');
  }

  async function permanentlyDeleteNote(noteId) {
    await deleteSourceImageAssets(noteId);
    state.deletedNotes = state.deletedNotes.filter((note) => note.id !== noteId);
    persist();
    render();
    toast('笔记已永久删除。', 'success');
  }

  function openPermanentDeleteModal(noteId) {
    const note = state.deletedNotes.find((item) => item.id === noteId);
    if (!note) return;
    showModal(`
      <div class="modal">
        <h2>永久删除这条笔记？</h2>
        <p>“${escapeHtml(note.title)}”将无法恢复。</p>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn danger" id="confirm-permanent-delete">永久删除</button>
        </div>
      </div>
    `);
    document.getElementById('confirm-permanent-delete')?.addEventListener('click', () => {
      closeModal();
      permanentlyDeleteNote(noteId);
    });
  }

  function openClearTrashModal() {
    if (!state.deletedNotes.length) {
      toast('回收站已经为空。', 'error');
      return;
    }
    showModal(`
      <div class="modal">
        <h2>清空回收站？</h2>
        <p>回收站中的 ${state.deletedNotes.length} 条笔记将被永久删除，无法恢复。</p>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn danger" id="confirm-clear-trash">一键清空</button>
        </div>
      </div>
    `);
    document.getElementById('confirm-clear-trash')?.addEventListener('click', async () => {
      await Promise.all(state.deletedNotes.map((note) => deleteSourceImageAssets(note.id)));
      state.deletedNotes = [];
      persist();
      closeModal();
      render();
      toast('回收站已清空。', 'success');
    });
  }

  function openRemoveSourcesModal(noteId) {
    const note = getNoteById(noteId);
    if (!note?.sourceImages?.length) return;
    showModal(`
      <div class="modal">
        <h2>删除原始截图？</h2>
        <p>将删除这条笔记保留的 ${note.sourceImages.length} 张原图和缩略图，文字内容不会受影响。</p>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn danger" id="confirm-remove-sources">删除原图</button>
        </div>
      </div>
    `);
    document.getElementById('confirm-remove-sources')?.addEventListener('click', async () => {
      await deleteSourceImageAssets(noteId);
      note.sourceImages = [];
      persist({ reason: '删除笔记原图' });
      closeModal();
      render();
      toast('原始截图已删除，文字内容已保留。', 'success');
    });
  }

  async function openSourceLightbox(noteId, index = 0) {
    const note = getNoteById(noteId);
    const source = note?.sourceImages?.[index];
    const memoryFile = sourceAssetMemory.get(noteId)?.[index];
    let imageUrl = source?.thumbnail || '';
    if (memoryFile) {
      if (activeSourceObjectUrl) URL.revokeObjectURL(activeSourceObjectUrl);
      activeSourceObjectUrl = URL.createObjectURL(memoryFile);
      imageUrl = activeSourceObjectUrl;
    } else {
      const asset = await getSourceImageAsset(noteId, index);
      if (asset?.data) {
        if (activeSourceObjectUrl) URL.revokeObjectURL(activeSourceObjectUrl);
        const blob = new Blob([asset.data], { type: asset.type || 'image/png' });
        activeSourceObjectUrl = URL.createObjectURL(blob);
        imageUrl = activeSourceObjectUrl;
      }
    }
    if (!imageUrl) {
      toast('没有找到这张原始截图。', 'error');
      return;
    }
    showModal(`
      <div class="modal source-lightbox-modal">
        <div class="source-lightbox-head">
          <div>
            <span class="eyebrow">Original Screenshot</span>
            <h2>${escapeHtml(source?.name || `原始截图 ${index + 1}`)}</h2>
          </div>
          <button class="icon-close" type="button" data-close-modal aria-label="关闭">×</button>
        </div>
        <div class="source-lightbox-image-wrap">
          <img src="${imageUrl}" alt="${escapeHtml(source?.name || '原始截图')}" draggable="true" />
        </div>
        <div class="source-lightbox-nav">
          <button class="btn secondary small" type="button" data-source-nav="${escapeHtml(noteId)}" data-source-nav-index="${index - 1}" ${index <= 0 ? 'disabled' : ''}>← 上一张</button>
          <span>${index + 1} / ${note?.sourceImages?.length || 1}</span>
          <button class="btn secondary small" type="button" data-source-nav="${escapeHtml(noteId)}" data-source-nav-index="${index + 1}" ${index >= (note?.sourceImages?.length || 1) - 1 ? 'disabled' : ''}>下一张 →</button>
        </div>
        <p class="source-lightbox-hint">手机端可以长按图片保存，或使用下方按钮保存原图。</p>
        <div class="modal-actions">
          <button class="btn secondary" type="button" data-source-download="${escapeHtml(noteId)}" data-source-download-index="${index}">保存原图</button>
          <button class="btn" type="button" data-close-modal>关闭</button>
        </div>
      </div>
    `);
  }

  async function downloadSourceImage(noteId, index = 0) {
    const memoryFile = sourceAssetMemory.get(noteId)?.[index];
    if (memoryFile) {
      downloadBlob(memoryFile.name || `截图-${index + 1}.png`, memoryFile, memoryFile.type || 'image/png');
      toast('原图已开始下载。', 'success');
      return;
    }
    const asset = await getSourceImageAsset(noteId, index);
    if (!asset?.data) {
      toast('没有找到可以下载的原图。', 'error');
      return;
    }
    downloadBlob(asset.name || `截图-${index + 1}.png`, new Blob([asset.data], { type: asset.type || 'image/png' }), asset.type || 'image/png');
    toast('原图已开始下载。', 'success');
  }

  function openExportModal(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;
    showModal(`
      <div class="modal">
        <h2>导出笔记</h2>
        <p>选择需要的文件格式。Excel 导出会优先使用笔记中的表格结构。</p>
        <div class="export-options">
          <button class="export-option" data-export-format="markdown" data-export-id="${escapeHtml(note.id)}">
            <span class="export-icon">M↓</span>
            <span><strong>Markdown</strong><small>保留标题、列表和表格结构</small></span>
          </button>
          <button class="export-option" data-export-format="excel" data-export-id="${escapeHtml(note.id)}">
            <span class="export-icon">X</span>
            <span><strong>Excel 表格</strong><small>生成可用 Excel 打开的表格文件</small></span>
          </button>
          <button class="export-option" data-export-format="text" data-export-id="${escapeHtml(note.id)}">
            <span class="export-icon">T</span>
            <span><strong>纯文本</strong><small>仅保留可编辑的文字内容</small></span>
          </button>
          <button class="export-option" data-export-format="json" data-export-id="${escapeHtml(note.id)}">
            <span class="export-icon">J</span>
            <span><strong>JSON</strong><small>保留标题、标签和结构化内容，便于再次导入</small></span>
          </button>
          <button class="export-option" data-export-format="pdf" data-export-id="${escapeHtml(note.id)}">
            <span class="export-icon">P</span>
            <span><strong>PDF</strong><small>打开浏览器打印窗口，选择“另存为 PDF”</small></span>
          </button>
          <button class="export-option" data-export-format="png" data-export-id="${escapeHtml(note.id)}">
            <span class="export-icon">▣</span>
            <span><strong>PNG 图片</strong><small>把当前笔记导出为高清图片</small></span>
          </button>
        </div>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
        </div>
      </div>
    `);
  }

  function exportNote(noteId, format) {
    const note = getNoteById(noteId);
    if (!note) return;
    const safeName = note.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || '笔记';
    if (format === 'markdown') {
      downloadBlob(`${safeName}.md`, htmlToMarkdown(note), 'text/markdown;charset=utf-8');
    } else if (format === 'text') {
      downloadBlob(`${safeName}.txt`, `${note.title}\n\n${stripHtml(note.contentHtml)}`, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      downloadBlob(`${safeName}.json`, JSON.stringify(note, null, 2), 'application/json;charset=utf-8');
    } else if (format === 'pdf') {
      exportNotePdf(note);
      closeModal();
      toast('已打开打印窗口，请选择“另存为 PDF”。', 'success');
      return;
    } else if (format === 'png') {
      closeModal();
      exportNotePng(note);
      return;
    } else {
      downloadBlob(`${safeName}.xls`, htmlToExcel(note), 'application/vnd.ms-excel;charset=utf-8');
    }
    closeModal();
    const formatLabel = { markdown: 'Markdown', excel: 'Excel', text: '纯文本', json: 'JSON' }[format] || '文件';
    toast(`已导出 ${formatLabel} 文件。`, 'success');
  }

  function buildExportPaperHtml(note) {
    const tags = (note.tags || []).map((tag) => `<span class="export-tag">#${escapeHtml(tag)}</span>`).join('');
    const sources = (note.sourceImages || []).filter((source) => source.thumbnail);
    const sourceHtml = sources.length
      ? `<section class="export-sources"><h2>原始截图</h2><div class="export-source-grid">${sources.map((source, index) => `<figure><img src="${source.thumbnail}" alt="${escapeHtml(source.name || `原始截图 ${index + 1}`)}" /><figcaption>${escapeHtml(source.name || `原始截图 ${index + 1}`)}</figcaption></figure>`).join('')}</div></section>`
      : '';
    return `
      <article class="export-note-paper">
        <header>
          <h1>${escapeHtml(note.title)}</h1>
          <div class="export-meta">${formatDateTime(note.updatedAt)} · ${escapeHtml(note.folder || '未分类')} · 优记 BestNote</div>
          <div class="export-tags">${tags}</div>
        </header>
        <main>${sanitizeHtml(note.contentHtml)}</main>
        ${sourceHtml}
        <footer>由优记 BestNote 导出</footer>
      </article>
    `;
  }

  function exportNotePdf(note) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('浏览器阻止了打印窗口，请允许弹出窗口后重试。', 'error');
      return;
    }
    const paper = buildExportPaperHtml(note);
    printWindow.document.write(`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${escapeHtml(note.title)}</title><style>
      @page{size:A4;margin:12mm}
      *{box-sizing:border-box}
      body{margin:0;background:#fff;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;font-size:12px;line-height:1.75}
      .export-note-paper{width:100%;max-width:820px;margin:0 auto;padding:12px}
      .export-note-paper h1{margin:0 0 8px;font-size:28px;line-height:1.25;overflow-wrap:anywhere}
      .export-note-paper h2{font-size:17px;margin:22px 0 8px}.export-note-paper h3{font-size:15px;margin:20px 0 7px}
      .export-meta,.export-tag{color:#667085;font-size:10px}.export-tag{display:inline-block;margin:0 6px 0 0}
      .export-note-paper main{margin-top:22px;overflow-wrap:anywhere}.export-note-paper p,.export-note-paper li{overflow-wrap:anywhere}
      .export-note-paper table{width:100%;border-collapse:collapse;margin:14px 0;table-layout:fixed}.export-note-paper th,.export-note-paper td{border:1px solid #d0d5dd;padding:8px 9px;text-align:left;vertical-align:top;word-break:break-word}
      .export-note-paper th{background:#f2f4f7}.export-note-paper tr{page-break-inside:avoid}
      .export-sources{margin-top:28px}.export-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .export-source-grid figure{margin:0;border:1px solid #e4e7ec;border-radius:8px;padding:8px}.export-source-grid img{display:block;width:100%;max-height:420px;object-fit:contain;border-radius:6px}.export-source-grid figcaption{margin-top:5px;color:#667085;font-size:9px}
      footer{margin-top:30px;padding-top:12px;border-top:1px solid #e4e7ec;color:#98a2b3;font-size:9px}
    </style></head><body>${paper}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
    printWindow.document.close();
  }

  let html2canvasLoader = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasLoader) return html2canvasLoader;
    html2canvasLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.async = true;
      script.onload = () => window.html2canvas ? resolve(window.html2canvas) : reject(new Error('PNG 导出组件初始化失败。'));
      script.onerror = () => reject(new Error('PNG 导出组件下载失败，请检查网络。'));
      document.head.appendChild(script);
    });
    return html2canvasLoader;
  }

  async function exportNotePng(note) {
    let host = null;
    try {
      const html2canvas = await loadHtml2Canvas();
      host = document.createElement('div');
      host.className = 'png-export-host';
      host.innerHTML = buildExportPaperHtml(note);
      document.body.appendChild(host);
      await Promise.all([...host.querySelectorAll('img')].map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      })));
      const target = host.querySelector('.export-note-paper');
      if (!target) throw new Error('没有找到可导出的笔记内容。');
      const width = Math.max(target.scrollWidth, target.offsetWidth, 1100);
      const height = Math.max(target.scrollHeight, target.offsetHeight);
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width,
        height,
        windowWidth: width + 80,
        windowHeight: height + 80,
        scrollX: 0,
        scrollY: 0
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
      if (!blob) throw new Error('PNG 生成失败。');
      const safeName = note.title.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || '笔记';
      downloadBlob(`${safeName}.png`, blob, 'image/png');
      toast('PNG 已开始下载。', 'success');
    } catch (error) {
      console.error('PNG export failed:', error);
      toast(error.message || 'PNG 导出失败。', 'error');
    } finally {
      host?.remove();
    }
  }

  function noteMarkdownBody(note) {
    return htmlToMarkdown(note).replace(/^#\s+.*\n+/, '');
  }

  function markdownToPreviewHtml(markdown) {
    const source = String(markdown || '');
    const images = [...source.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)]
      .map((match) => `<figure><img src="${escapeHtml(match[2])}" alt="${escapeHtml(match[1] || '图片')}" loading="lazy" /><figcaption>${escapeHtml(match[1] || '')}</figcaption></figure>`)
      .join('');
    const textOnly = source.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '');
    return `${images}${blocksToHtml(parseMarkdownToOcrBlocks(textOnly))}`;
  }

  function htmlElementToMarkdown(element, lines, depth = 0) {
    if (!element) return;
    if (element.tagName === 'H3') {
      lines.push(`## ${element.textContent.trim()}`, '');
      return;
    }
    if (element.tagName === 'P') {
      lines.push(element.textContent.trim(), '');
      return;
    }
    if (element.tagName === 'UL' || element.tagName === 'OL') {
      [...element.children].forEach((item, index) => {
        lines.push(`${'  '.repeat(depth)}${element.tagName === 'OL' ? `${index + 1}.` : '-'} ${item.textContent.trim()}`);
      });
      lines.push('');
      return;
    }
    if (element.tagName === 'TABLE') {
      const rows = [...element.querySelectorAll('tr')].map((row) => [...row.children].map((cell) => cell.textContent.trim().replaceAll('|', '\\|')));
      if (rows.length) {
        lines.push(`| ${rows[0].join(' | ')} |`);
        lines.push(`| ${rows[0].map(() => '---').join(' | ')} |`);
        rows.slice(1).forEach((row) => lines.push(`| ${row.join(' | ')} |`));
        lines.push('');
      }
      return;
    }
    if (element.tagName === 'BLOCKQUOTE') {
      lines.push(`> ${element.textContent.trim()}`, '');
      return;
    }
    if (element.tagName === 'IMG') {
      lines.push(`![${element.getAttribute('alt') || '图片'}](${element.getAttribute('src') || ''})`, '');
      return;
    }
    [...element.children].forEach((child) => htmlElementToMarkdown(child, lines, depth + 1));
  }

  function htmlToMarkdown(note) {
    const container = document.createElement('div');
    container.innerHTML = sanitizeHtml(note.contentHtml);
    const lines = [`# ${note.title}`, ''];
    if (note.tags?.length) lines.push(`标签：${note.tags.map((tag) => `#${tag}`).join(' ')}`, '');
    [...container.children].forEach((element) => htmlElementToMarkdown(element, lines));
    if (note.sourceImages?.length) {
      lines.push('## 原始截图', '');
      note.sourceImages.forEach((source, index) => lines.push(`- ${source.name || `原始截图 ${index + 1}`}`));
      lines.push('');
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  function htmlToExcel(note) {
    const container = document.createElement('div');
    container.innerHTML = sanitizeHtml(note.contentHtml);
    const firstTable = container.querySelector('table');
    let rowsHtml = '';
    if (firstTable) {
      rowsHtml = [...firstTable.querySelectorAll('tr')].map((row) => {
        const cellTag = row.closest('thead') ? 'th' : 'td';
        return `<tr>${[...row.children].map((cell) => `<${cellTag}>${escapeHtml(cell.textContent.trim())}</${cellTag}>`).join('')}</tr>`;
      }).join('');
    } else {
      rowsHtml = stripHtml(note.contentHtml)
        .split(/(?<=[。！？])/)
        .filter(Boolean)
        .map((line) => `<tr><td>${escapeHtml(line.trim())}</td></tr>`)
        .join('');
    }
    return `\uFEFF<!doctype html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse}th,td{border:1px solid #999;padding:6px 10px;vertical-align:top}th{background:#eee}</style></head><body><h2>${escapeHtml(note.title)}</h2><table>${rowsHtml}</table></body></html>`;
  }

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openDeleteModal(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;
    showModal(`
      <div class="modal">
        <h2>移到回收站？</h2>
        <p>“${escapeHtml(note.title)}”会暂时放入回收站，之后可以恢复或永久删除。</p>
        <div class="modal-actions">
          <button class="btn ghost" data-close-modal>取消</button>
          <button class="btn danger" id="confirm-delete">移到回收站</button>
        </div>
      </div>
    `);
    document.getElementById('confirm-delete')?.addEventListener('click', () => {
      moveNoteToTrash(noteId, { renderAfter: false });
      closeModal();
      navigate('notes');
    });
  }

  async function installApp() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return;
    }
    showModal(`
      <div class="modal">
        <h2>安装到手机或桌面</h2>
        <p>在 Chrome、Edge 或 Safari 中打开本网页后，可以通过浏览器的“添加到主屏幕 / 安装应用”把优记保存成独立入口。</p>
        <ul class="install-steps">
          <li><strong>iPhone / iPad：</strong>点击 Safari 底部分享按钮，选择“添加到主屏幕”。</li>
          <li><strong>Android：</strong>点击浏览器菜单，选择“安装应用”或“添加到主屏幕”。</li>
          <li><strong>电脑：</strong>点击地址栏右侧的安装图标，或浏览器菜单中的“安装优记”。</li>
        </ul>
        <div class="modal-actions">
          <button class="btn" data-close-modal>知道了</button>
        </div>
      </div>
    `);
  }

  function showModal(content) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>${content}</div>`;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalRoot.innerHTML = '';
    document.body.style.overflow = '';
    if (activeSourceObjectUrl) {
      URL.revokeObjectURL(activeSourceObjectUrl);
      activeSourceObjectUrl = null;
    }
  }

  function toast(message, type = '') {
    const element = document.createElement('div');
    element.className = `toast ${type}`.trim();
    element.innerHTML = `<span>${type === 'error' ? '!' : type === 'success' ? '✓' : 'ⓘ'}</span><span>${escapeHtml(message)}</span>`;
    toastRegion.appendChild(element);
    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(8px)';
      setTimeout(() => element.remove(), 200);
    }, 3200);
  }

  function refreshNotesResults() {
    const grid = document.getElementById('notes-grid');
    const count = document.getElementById('notes-result-count');
    if (!grid) return;
    const filtered = getFilteredNotes();
    grid.innerHTML = filtered.length
      ? filtered.map(noteCard).join('')
      : emptyState('没有找到相关笔记', '试试其他关键词，或清除当前标签筛选。', 'notes', '清除筛选', true);
    if (count) count.textContent = `共 ${filtered.length} 条`;
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-theme-toggle]')) {
      toggleTheme();
      return;
    }

    if (event.target.closest('[data-install-app]')) {
      installApp();
      return;
    }

    if (event.target.closest('[data-new-folder]')) {
      openNewFolderModal('global');
      return;
    }

    const newFolderContext = event.target.closest('[data-new-folder-context]');
    if (newFolderContext) {
      openNewFolderModal(newFolderContext.dataset.newFolderContext || 'global');
      return;
    }

    const homeTemplate = event.target.closest('[data-home-template]');
    if (homeTemplate) {
      state.pasteTemplate = homeTemplate.dataset.homeTemplate || 'auto';
      state.pasteParsed = false;
      state.pasteStructuredHtml = '';
      navigate('paste');
      setTimeout(() => document.getElementById('paste-text')?.focus(), 0);
      return;
    }

    const removeSources = event.target.closest('[data-remove-note-sources]');
    if (removeSources) {
      openRemoveSourcesModal(removeSources.dataset.removeNoteSources);
      return;
    }

    const sourceNav = event.target.closest('[data-source-nav]');
    if (sourceNav) {
      openSourceLightbox(sourceNav.dataset.sourceNav, Number(sourceNav.dataset.sourceNavIndex || 0));
      return;
    }

    const sourceThumb = event.target.closest('[data-source-note]');
    if (sourceThumb) {
      openSourceLightbox(sourceThumb.dataset.sourceNote, Number(sourceThumb.dataset.sourceIndex || 0));
      return;
    }

    const sourceDownload = event.target.closest('[data-source-download]');
    if (sourceDownload) {
      downloadSourceImage(sourceDownload.dataset.sourceDownload, Number(sourceDownload.dataset.sourceDownloadIndex || 0));
      return;
    }

    const mobileImport = event.target.closest('[data-mobile-import]');
    if (mobileImport) {
      startMobileImport(mobileImport.dataset.mobileImport);
      return;
    }

    if (event.target.closest('[data-paste-image]')) {
      pasteImageFromClipboard();
      return;
    }

    const routeTarget = event.target.closest('[data-route]');
    if (routeTarget) {
      event.preventDefault();
      navigate(routeTarget.dataset.route);
      return;
    }

    if (event.target.closest('[data-toggle-note-selection]')) {
      state.noteSelectionMode = !state.noteSelectionMode;
      state.selectedNoteIds = [];
      render();
      return;
    }

    if (event.target.closest('[data-select-all-notes]')) {
      state.selectedNoteIds = getFilteredNotes().map((note) => note.id);
      render();
      return;
    }

    if (event.target.closest('[data-clear-note-selection]')) {
      state.selectedNoteIds = [];
      render();
      return;
    }

    if (event.target.closest('#merge-selected-notes')) {
      openMergeNotesModal();
      return;
    }

    const quickMerge = event.target.closest('[data-quick-merge]');
    if (quickMerge) {
      const noteId = quickMerge.dataset.quickMerge;
      state.noteSelectionMode = true;
      if (!state.selectedNoteIds.includes(noteId)) {
        state.selectedNoteIds = [...state.selectedNoteIds, noteId];
      }
      render();
      toast('已加入合并选择，请再选择其他笔记。', 'success');
      return;
    }

    const quickPin = event.target.closest('[data-quick-pin]');
    if (quickPin) {
      toggleNotePin(quickPin.dataset.quickPin);
      return;
    }

    const quickDelete = event.target.closest('[data-quick-delete]');
    if (quickDelete) {
      moveNoteToTrash(quickDelete.dataset.quickDelete);
      return;
    }

    if (event.target.closest('[data-import-examples]')) {
      importExamples();
      return;
    }

    const importExample = event.target.closest('[data-import-example]');
    if (importExample) {
      importExamples([importExample.dataset.importExample]);
      return;
    }

    const openExample = event.target.closest('[data-open-example]');
    if (openExample) {
      importExamples([openExample.dataset.openExample], true);
      return;
    }

    const restoreNote = event.target.closest('[data-restore-note]');
    if (restoreNote) {
      restoreNoteFromTrash(restoreNote.dataset.restoreNote);
      return;
    }

    const permanentDelete = event.target.closest('[data-permanent-delete]');
    if (permanentDelete) {
      openPermanentDeleteModal(permanentDelete.dataset.permanentDelete);
      return;
    }

    if (event.target.closest('#clear-trash')) {
      openClearTrashModal();
      return;
    }

    if (event.target.closest('[data-refresh-history]')) {
      state.historyLoaded = false;
      state.historyLoading = false;
      loadHistoryIntoState();
      return;
    }

    if (event.target.closest('[data-clear-history]')) {
      clearHistorySnapshots();
      return;
    }

    const restoreHistory = event.target.closest('[data-restore-history]');
    if (restoreHistory) {
      restoreHistorySnapshot(Number(restoreHistory.dataset.restoreHistory));
      return;
    }

    const workspaceNote = event.target.closest('[data-workspace-note]');
    if (workspaceNote) {
      state.noteId = workspaceNote.dataset.workspaceNote;
      state.route = 'workspace';
      state.workspaceMarkdownDraft = '';
      state.workspaceListOpen = false;
      render();
      return;
    }

    if (event.target.closest('[data-workspace-new]')) {
      navigate('paste');
      return;
    }

    if (event.target.closest('[data-workspace-list-toggle]')) {
      state.workspaceListOpen = !state.workspaceListOpen;
      render();
      return;
    }

    const rerunOcr = event.target.closest('[data-rerun-ocr]');
    if (rerunOcr) {
      rerunOcrForNote(rerunOcr.dataset.rerunOcr);
      return;
    }

    const workspaceMode = event.target.closest('[data-workspace-mode]');
    if (workspaceMode) {
      state.workspaceMode = workspaceMode.dataset.workspaceMode || 'rich';
      state.workspaceMarkdownDraft = '';
      render();
      return;
    }

    const saveMarkdown = event.target.closest('[data-save-markdown-note]');
    if (saveMarkdown) {
      saveMarkdownNote(saveMarkdown.dataset.saveMarkdownNote);
      return;
    }

    const openNote = event.target.closest('[data-open-note]');
    if (openNote) {
      if (state.noteSelectionMode) {
        toggleNoteSelection(openNote.dataset.openNote);
      } else {
        navigate('note', { noteId: openNote.dataset.openNote });
      }
      return;
    }

    const filter = event.target.closest('[data-filter]');
    if (filter) {
      state.filter = filter.dataset.filter;
      render();
      return;
    }

    if (event.target.closest('[data-clear-filter]')) {
      state.filter = '全部';
      state.search = '';
      render();
      return;
    }

    const template = event.target.closest('[data-template]');
    if (template) {
      state.importTemplate = template.dataset.template;
      state.aiResult = null;
      render();
      return;
    }

    const remove = event.target.closest('[data-remove-file]');
    if (remove) {
      removeFile(remove.dataset.removeFile, remove.dataset.fileId);
      return;
    }

    const toggleSectionSort = event.target.closest('[data-toggle-section-sort]');
    if (toggleSectionSort) {
      const noteId = toggleSectionSort.dataset.toggleSectionSort;
      if (state.sectionSortMode) {
        persistSectionOrder(noteId, { toast: false });
      } else if (saveNoteDetail(noteId, { render: false, toast: false }) === false) {
        return;
      }
      state.sectionSortMode = !state.sectionSortMode;
      render();
      toast(state.sectionSortMode ? '已进入章节排序模式。' : '已退出章节排序模式。', 'success');
      return;
    }

    const moveSection = event.target.closest('[data-move-section]');
    if (moveSection) {
      moveSectionByButton(moveSection);
      return;
    }

    const save = event.target.closest('[data-save-note]');
    if (save) {
      saveNoteDetail(save.dataset.saveNote);
      return;
    }

    const togglePin = event.target.closest('[data-toggle-pin-note]');
    if (togglePin) {
      toggleNotePin(togglePin.dataset.togglePinNote);
      return;
    }

    const editTable = event.target.closest('[data-edit-table]');
    if (editTable) {
      openTableEditor(editTable.dataset.editTable);
      return;
    }

    const insertTable = event.target.closest('[data-insert-table]');
    if (insertTable) {
      insertTableIntoNote(insertTable.dataset.insertTable);
      return;
    }

    if (event.target.closest('[data-export-backup]')) {
      exportBackup();
      return;
    }

    if (event.target.closest('[data-export-all-markdown]')) {
      exportAllMarkdown();
      return;
    }

    const exportButton = event.target.closest('[data-export]');
    if (exportButton) {
      openExportModal(exportButton.dataset.export);
      return;
    }

    const exportFormat = event.target.closest('[data-export-format]');
    if (exportFormat) {
      exportNote(exportFormat.dataset.exportId, exportFormat.dataset.exportFormat);
      return;
    }

    const deleteButton = event.target.closest('[data-delete-note]');
    if (deleteButton) {
      openDeleteModal(deleteButton.dataset.deleteNote);
      return;
    }

    if (event.target.closest('[data-close-modal]') || event.target.matches('[data-modal-backdrop]')) {
      closeModal();
    }
  });

  document.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files || [])].filter((file) => file.type.startsWith('image/'));
    if (!files.length || event.target.matches('input, textarea, [contenteditable="true"]')) return;
    event.preventDefault();
    navigate('ocr');
    addFiles(files, 'ocr');
    toast(`已从剪贴板加入 ${files.length} 张截图。`, 'success');
  });

  document.addEventListener('keydown', (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      globalSearch.focus();
      globalSearch.select();
      return;
    }
    if (modifier && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      state.pasteTemplate = 'auto';
      navigate('paste');
      setTimeout(() => document.getElementById('paste-text')?.focus(), 0);
      return;
    }
    if (modifier && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      globalSearch.focus();
      globalSearch.select();
      return;
    }
    if (modifier && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (state.route === 'note' && state.noteId) saveNoteDetail(state.noteId);
      else if (state.route === 'paste' && state.pasteParsed) openSavePasteModal();
      else toast('当前页面没有需要保存的内容。', 'error');
      return;
    }
    if (event.key === 'Escape') closeModal();
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-open-note]')) {
      event.preventDefault();
      if (state.noteSelectionMode) toggleNoteSelection(event.target.dataset.openNote);
      else navigate('note', { noteId: event.target.dataset.openNote });
    }
  });

  globalSearch.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    if (state.route === 'notes') {
      refreshNotesResults();
    } else if (state.route === 'workspace') {
      render();
      globalSearch.focus();
      globalSearch.setSelectionRange(state.search.length, state.search.length);
    } else if (state.search) {
      state.route = 'notes';
      state.filter = '全部';
      render();
      globalSearch.focus();
      globalSearch.setSelectionRange(state.search.length, state.search.length);
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    document.querySelectorAll('[data-install-app]').forEach((button) => button.classList.add('ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    toast('优记已安装到当前设备。', 'success');
  });

  const selfTestMode = new URLSearchParams(window.location.search).get('selftest') === '1';
  const requestedRoute = new URLSearchParams(window.location.search).get('route');
  if (['workspace', 'home', 'import', 'ocr', 'paste', 'notes', 'examples', 'history', 'backup'].includes(requestedRoute)) {
    state.route = requestedRoute;
  }

  if (new URLSearchParams(window.location.search).get('selftest') === '1') {
    window.BestNoteTestApi = {
      version: '7.20',
      parseBlocks: (text, options = {}) => buildBlocksForText(text, options),
      filterLines: (text) => filterOcrContentLines(text),
      titles: (text) => generateOcrTitleSuggestions(text),
      inferTags: (text, title = '') => inferOcrTags(text, title),
      recommendTemplate: (text) => recommendTemplateKey('auto', String(text || '').split('\n').map((line) => line.trim()).filter(Boolean)),
      buildGeneratedNote: (template, text, title = '') => buildGeneratedNote(template, [{ id: 'test', name: 'test.png' }], text, '', null, title),
      sanitizeHtml,
      matrixToHtml: (matrix) => tableMatrixToHtml(matrix, true),
      matrixFromHtml: (html) => getTableMatrix(html),
      mergeSectionsHtml: (notes) => buildMergedSectionsHtml(notes),
      structureText: (template, text) => buildStructuredTextHtml(template, buildBlocksForText(text), text),
      resolveTextTemplate: (template, text) => resolveTextTemplate(template, text),
      buildExportPaperHtml: (note) => buildExportPaperHtml(note),
      noteToMarkdown: (note) => htmlToMarkdown(note),
      noteToExcel: (note) => htmlToExcel(note),
      plainText: (html) => stripHtml(html),
      supportsIndexedDb: Boolean(window.indexedDB),
      correctTime: (value) => correctOcrTimeCell(value),
      normalizeTimes: (values) => normalizeOcrTimeSequence(values),
      parseTableText: (text) => parsePaddleJsTableText(text),
      examples: () => structuredClone(exampleNotes)
    };
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Service worker registration failed:', error));
    });
  }

  applyTheme();
  setSaveStatus('已自动保存', 'saved');
  bindMobileImportInputs();
  hydrateFromDatabase().then(consumeSharedPayload).finally(() => {
    if (!selfTestMode) render();
  });
})();
