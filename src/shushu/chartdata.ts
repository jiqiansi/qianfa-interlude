/**
 * 术数盘面「事实层」—— 纯数据 + 纯函数，不含 React。
 *
 * 这是整套排盘可视化的正确性地基：所有组件只负责画，卦名 / 五行 / 方位 / 数
 * 一律从本文件取，**不许在镜头里手写卦名字符串或数字**。理由有三：
 *   1. 一处改，全片一致；
 *   2. 能被 scripts/chart_check.py 静态校验（镜头里出现「上艮下坎」时，
 *      自检脚本能独立重算一遍，不依赖渲染）；
 *   3. 讲课讲错一个卦名，是这类视频最致命的错误，靠人眼 QC 抓不住。
 *
 * 依据：说卦传（方位 / 类象）、邵雍先后天八卦图、洛书九宫、
 *       《皇极经世》元会运世、《阳九阴六用数度图》四象数。
 */

export type WuXing = '木' | '火' | '土' | '金' | '水';
export type GuaName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';
export type YaoKind = 'yang' | 'yin';

/** 八卦按「先天数」顺序：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8 */
export const GUA_ORDER: GuaName[] = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];

export interface GuaInfo {
  name: GuaName;
  /** 三爻，**自下而上**：1 = 阳爻，0 = 阴爻 */
  yao: [0 | 1, 0 | 1, 0 | 1];
  /** Unicode 三爻符号 ☰☱☲☳☴☵☶☷ */
  glyph: string;
  nature: string;
  wuxing: WuXing;
  /** 先天数（1–8） */
  xianTian: number;
  /** 后天数（洛书九宫） */
  houTian: number;
  /** 先天方位（伏羲） */
  xianFang: string;
  /** 后天方位（文王 / 洛书） */
  houFang: string;
  family: string;
  /** 说卦传核心类象 */
  xiang: string[];
}

/** 八卦属性总表。yao 自下而上，glyph 与之一致。 */
export const GUA: Record<GuaName, GuaInfo> = {
  乾: {name: '乾', yao: [1, 1, 1], glyph: '☰', nature: '天', wuxing: '金', xianTian: 1, houTian: 6, xianFang: '南',   houFang: '西北', family: '老父', xiang: ['天', '父', '君', '首', '马', '圆物', '刚健']},
  兑: {name: '兑', yao: [1, 1, 0], glyph: '☱', nature: '泽', wuxing: '金', xianTian: 2, houTian: 7, xianFang: '东南', houFang: '西',   family: '少女', xiang: ['泽', '少女', '口', '悦', '毁折', '巫']},
  离: {name: '离', yao: [1, 0, 1], glyph: '☲', nature: '火', wuxing: '火', xianTian: 3, houTian: 9, xianFang: '东',   houFang: '南',   family: '中女', xiang: ['火', '日', '电', '中女', '目', '文书', '甲胄']},
  震: {name: '震', yao: [1, 0, 0], glyph: '☳', nature: '雷', wuxing: '木', xianTian: 4, houTian: 3, xianFang: '东北', houFang: '东',   family: '长男', xiang: ['雷', '长男', '足', '动', '龙', '决躁']},
  巽: {name: '巽', yao: [0, 1, 1], glyph: '☴', nature: '风', wuxing: '木', xianTian: 5, houTian: 4, xianFang: '西南', houFang: '东南', family: '长女', xiang: ['风', '长女', '股', '木', '绳直', '进退']},
  坎: {name: '坎', yao: [0, 1, 0], glyph: '☵', nature: '水', wuxing: '水', xianTian: 6, houTian: 1, xianFang: '西',   houFang: '北',   family: '中男', xiang: ['水', '中男', '耳', '险', '月', '盗', '陷']},
  艮: {name: '艮', yao: [0, 0, 1], glyph: '☶', nature: '山', wuxing: '土', xianTian: 7, houTian: 8, xianFang: '西北', houFang: '东北', family: '少男', xiang: ['山', '少男', '手', '止', '门阙', '狗']},
  坤: {name: '坤', yao: [0, 0, 0], glyph: '☷', nature: '地', wuxing: '土', xianTian: 8, houTian: 2, xianFang: '北',   houFang: '西南', family: '老母', xiang: ['地', '母', '腹', '众', '牛', '柔顺']},
};

// ---------------------------------------------------------------- 五行

/** 五行相生环序：木→火→土→金→水→木 */
export const WUXING_ORDER: WuXing[] = ['木', '火', '土', '金', '水'];
export const SHENG: Record<WuXing, WuXing> = {木: '火', 火: '土', 土: '金', 金: '水', 水: '木'};
export const KE: Record<WuXing, WuXing> = {木: '土', 土: '水', 水: '火', 火: '金', 金: '木'};

/** 五行色：传统青赤黄白黑，在黑板上的可读化版本（白金提亮、黑水改靛蓝） */
export const WUXING_COLOR: Record<WuXing, string> = {
  木: '#3FBF7F',
  火: '#E8412F',
  土: '#D9A441',
  金: '#E8E8EC',
  水: '#3A6FD8',
};

/** 五行在圆环上的角度（度，0 = 正上，顺时针）：木上、火右、土下右、金下左、水上左 */
export const WUXING_ANGLE: Record<WuXing, number> = {木: 0, 火: 72, 土: 144, 金: 216, 水: 288};

/** 旺相休囚死五档。判据：值令者旺、令生者相、生令者休、克令者囚、令克者死 */
export const WANGSHUAI = ['旺', '相', '休', '囚', '死'] as const;
export type WangShuai = (typeof WANGSHUAI)[number];
/** 五档亮度（色阶条 / 给卦体上色用） */
export const WANGSHUAI_LEVEL: Record<WangShuai, number> = {旺: 1.0, 相: 0.78, 休: 0.52, 囚: 0.34, 死: 0.18};
/** 五档说明（画在色阶条下方） */
export const WANGSHUAI_DESC: Record<WangShuai, string> = {
  旺: '当令者', 相: '令所生', 休: '生令者', 囚: '克令者', 死: '令所克',
};

/** 给定当令五行，求另一个五行的旺衰档 */
export const wangShuaiOf = (ling: WuXing, x: WuXing): WangShuai => {
  if (x === ling) return '旺';
  if (SHENG[ling] === x) return '相';
  if (SHENG[x] === ling) return '休';
  if (KE[x] === ling) return '囚';
  return '死'; // KE[ling] === x
};

// ---------------------------------------------------------------- 四象

/** 四象：太阳九 / 少阴八 / 少阳七 / 太阴六（《阳九阴六用数度图》） */
export interface SiXiangInfo {
  name: string;
  num: number;
  /** 自下而上两爻 */
  yao: [YaoKind, YaoKind];
  season: string;
  desc: string;
}
export const SIXIANG: SiXiangInfo[] = [
  {name: '太阳', num: 9, yao: ['yang', 'yang'], season: '夏', desc: '阳进阴退，阳强于阴'},
  {name: '少阴', num: 8, yao: ['yang', 'yin'],  season: '秋', desc: '阴进阳退，阴始生'},
  {name: '少阳', num: 7, yao: ['yin', 'yang'],  season: '春', desc: '阳进阴退，阳始生'},
  {name: '太阴', num: 6, yao: ['yin', 'yin'],   season: '冬', desc: '阴进阳退，阴强于阳'},
];
export const SIXIANG_BY_NAME: Record<string, SiXiangInfo> = Object.fromEntries(SIXIANG.map((s) => [s.name, s]));

/** 阳爻用太阳数九、阴爻用太阴数六（阳九阴六） */
export const YAO_NUM = {yang: 9, yin: 6} as const;

// ---------------------------------------------------------------- 干支

/** 十二地支（顺时针，子上北） */
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const DIZHI_WUXING: Record<string, WuXing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const TIANGAN_WUXING: Record<string, WuXing> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
/** 地支角度：子上 = 0°，顺时针每支 30° */
export const DIZHI_ANGLE: Record<string, number> = Object.fromEntries(DIZHI.map((z, i) => [z, i * 30]));
/** 六十甲子标准循环：天干十位、地支十二位同步顺行；两者共同周期为 60。 */
export const JIAZI: string[] = Array.from({length: 60}, (_, i) => `${TIANGAN[i % 10]}${DIZHI[i % 12]}`);

// ---------------------------------------------------------------- 皇极经世 / 策轨

/** 元会运世进位：1 元 = 12 会，1 会 = 30 运，1 运 = 12 世，1 世 = 30 年 */
export const YUAN_HUI_YUN_SHI = {元: 12, 会: 30, 运: 12, 世: 30} as const;
/** 策轨数四格 */
export const CEGUI_SLOTS = ['原', '会', '运', '世'] as const;
export type CeGuiSlot = (typeof CEGUI_SLOTS)[number];
/** 四格的进位基数（画积算链条用） */
export const CEGUI_RADIX: Record<CeGuiSlot, number> = {原: 1, 会: 12, 运: 30, 世: 12};

// ---------------------------------------------------------------- 六爻

/** 爻位名（自下而上） */
export const YAO_POS = ['初', '二', '三', '四', '五', '上'] as const;
/**
 * 爻题：初九 / 九二 / 六三 … 上六。
 * 规则：阳爻称「九」、阴爻称「六」；初、上两爻把称谓放前（初九/上六），中间四爻放后（九二/六三）。
 */
export const yaoLabel = (pos: number, kind: YaoKind): string => {
  const num = kind === 'yang' ? '九' : '六';
  const ord = ['', '初', '二', '三', '四', '五', '上'][pos];
  if (pos === 1 || pos === 6) return `${ord}${num}`;
  return `${num}${ord}`;
};

/** 64 卦表：[上卦][下卦] → 卦名。上下卦按 GUA_ORDER 索引。 */
const HEX_TABLE: Record<GuaName, [string, string, string, string, string, string, string, string]> = {
  乾: ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
  兑: ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
  离: ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
  震: ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
  巽: ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
  坎: ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
  艮: ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
  坤: ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地'],
};

/** 由上卦、下卦取六爻卦名 */
export const hexName = (upper: GuaName, lower: GuaName): string => HEX_TABLE[upper][GUA_ORDER.indexOf(lower)];

/**
 * 六爻盘面。yao[0] = 初爻（画的时候第 6 爻在最上）。
 * upper = 上卦（四五六爻），lower = 下卦（初二三爻）。
 */
export interface Hexagram {
  upper: GuaName;
  lower: GuaName;
  /** 自下而上 6 个爻：1 阳 / 0 阴 */
  yao: number[];
  name: string;
}

/** 由上下卦构造六爻（不动爻） */
export const makeHex = (upper: GuaName, lower: GuaName): Hexagram => ({
  upper, lower, yao: [...GUA[lower].yao, ...GUA[upper].yao], name: hexName(upper, lower),
});

/** 由三爻（自下而上）反查卦名 */
export const yaoToGua = (t: number[]): GuaName => {
  const hit = GUA_ORDER.find((g) => GUA[g].yao[0] === t[0] && GUA[g].yao[1] === t[1] && GUA[g].yao[2] === t[2]);
  if (!hit) throw new Error('非法三爻：' + t.join(','));
  return hit;
};

const guaOfYao = (y: number[]): {upper: GuaName; lower: GuaName} => ({
  lower: yaoToGua([y[0], y[1], y[2]]),
  upper: yaoToGua([y[3], y[4], y[5]]),
});

/** 由六爻数组直接构造 Hexagram（变卦 / 互卦用） */
export const hexOfYao = (y: number[]): Hexagram => {
  const {upper, lower} = guaOfYao(y);
  return {upper, lower, yao: [...y], name: hexName(upper, lower)};
};

/**
 * 取互卦：本卦二三四爻为下卦、三四五爻为上卦。
 * 互卦永远是「本卦中段重组」，不引入新爻。
 */
export const huGua = (h: Hexagram): Hexagram => {
  const y = h.yao; // [初,二,三,四,五,上]
  const lower = HU_SOURCE.lower.map((p) => y[p - 1]);
  const upper = HU_SOURCE.upper.map((p) => y[p - 1]);
  return hexOfYao([...lower, ...upper]);
};

/** 互卦的两个三爻组在下卦/上卦中各自的来源爻位（1 基），画抽取动画用 */
export const HU_SOURCE = {lower: [2, 3, 4], upper: [3, 4, 5]} as const;

/**
 * 变卦：动爻阴阳互换。movingPos 为 1 基爻位数组（自下而上）。
 */
export const bianGua = (h: Hexagram, movingPos: number[]): Hexagram => {
  const y = [...h.yao];
  const seen = new Set<number>();
  for (const p of movingPos) {
    if (!Number.isInteger(p) || p < 1 || p > 6) throw new RangeError(`动爻位必须是 1–6：${p}`);
    if (seen.has(p)) throw new RangeError(`动爻位重复：${p}`);
    seen.add(p);
    y[p - 1] = y[p - 1] ? 0 : 1;
  }
  return hexOfYao(y);
};

/** 体用：不动者为体，动者为用。返回上下卦归属。 */
export const tiYong = (h: Hexagram, movingPos: number[]): {ti: GuaName; yong: GuaName; tiIsLower: boolean} => {
  const movingUpper = movingPos.some((p) => p >= 4);
  const movingLower = movingPos.some((p) => p <= 3);
  // 上下皆动或皆不动时，按动爻多寡归边；调用方若口径不同应显式覆盖
  const upperIsYong = movingUpper && !movingLower ? true : movingLower && !movingUpper ? false : movingUpper;
  return upperIsYong
    ? {ti: h.lower, yong: h.upper, tiIsLower: true}
    : {ti: h.upper, yong: h.lower, tiIsLower: false};
};

// ---------------------------------------------------------------- 五行关系

export type Relation = '生' | '克' | '被生' | '被克' | '比和';

export const relate = (a: WuXing, b: WuXing): Relation => {
  if (a === b) return '比和';
  if (SHENG[a] === b) return '生';
  if (KE[a] === b) return '克';
  if (SHENG[b] === a) return '被生';
  return '被克';
};

/** 关系色：生绿、克红、比和灰白 */
export const RELATION_COLOR: Record<Relation, string> = {
  生: '#8FF740', 被生: '#8FF740', 克: '#F05F41', 被克: '#F05F41', 比和: '#D4D4D4',
};
/** 关系是否「吉」（体用断占时生体为吉、克体为凶） */
export const relationGood = (r: Relation): boolean => r === '生' || r === '被生' || r === '比和';

// ---------------------------------------------------------------- 方位九宫

/**
 * 九宫格布局：row 0 = 上 = 南。这是传统方位图（上南下北、左东右西），
 * 与地图相反，讲课时必须在画面上标出「上南下北」以免观众误读。
 */
export const XIANTIAN_GRID: (GuaName | null)[][] = [
  ['兑', '乾', '巽'], // 东南 南 西南
  ['离', null, '坎'], // 东 中 西
  ['震', '坤', '艮'], // 东北 北 西北
];

export const HOUTIAN_GRID: (GuaName | null)[][] = [
  ['巽', '离', '坤'],
  ['震', null, '兑'],
  ['艮', '坎', '乾'],
];

/** 洛书九宫数（含中宫 5），与 HOUTIAN_GRID 同布局 */
export const LUOSHU_GRID: number[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

/** 方位词 → 九宫坐标 (row, col)，row 0 = 南 */
export const FANGWEI_RC: Record<string, [number, number]> = {
  南: [0, 1], 西南: [0, 2], 西: [1, 2], 西北: [2, 2],
  北: [2, 1], 东北: [2, 0], 东: [1, 0], 东南: [0, 0],
};

/** 九宫坐标 → 方位词（画方位标签用） */
export const RC_FANGWEI: string[][] = [
  ['东南', '南', '西南'],
  ['东', '中', '西'],
  ['东北', '北', '西北'],
];

// ---------------------------------------------------------------- 类象

/** 万物类象（说卦传）。讲课映射表用，只收语料里真会用到的行。 */
export const LEIXIANG: Array<{gua: GuaName; rows: Array<[string, string]>}> = [
  {gua: '乾', rows: [['天', '父 / 君'], ['首', '马'], ['金玉', '圆物'], ['刚健', '寒 / 冰']]},
  {gua: '兑', rows: [['泽', '少女'], ['口 / 舌', '悦'], ['毁折', '巫 / 口舌']]},
  {gua: '离', rows: [['火', '日 / 电'], ['中女', '目'], ['文书', '甲胄 / 戈兵']]},
  {gua: '震', rows: [['雷', '长男'], ['足', '动'], ['龙', '决躁']]},
  {gua: '巽', rows: [['风', '长女'], ['股', '木'], ['绳直', '进退 / 不果']]},
  {gua: '坎', rows: [['水', '中男'], ['耳', '险 / 陷'], ['月', '盗'], ['血卦', '通']]},
  {gua: '艮', rows: [['山', '少男'], ['手', '止'], ['门阙', '狗 / 鼠']]},
  {gua: '坤', rows: [['地', '母'], ['腹', '众'], ['牛', '柔顺'], ['大舆', '文']]},
];

// ---------------------------------------------------------------- 示例盘

/**
 * 纯数学演示数据：本卦 山水蒙（上艮下坎），五爻动
 *   → 变卦 风水涣（上巽下坎），互卦 地雷复（上坤下震）
 * 仅用于组件渲染与排盘算法自检；**不是原书案例，不承载占断结论**。
 */
export const DEMO_HEX: Hexagram = makeHex('艮', '坎');
export const DEMO_MOVING: number[] = [5];
export const DEMO_BIAN: Hexagram = bianGua(DEMO_HEX, DEMO_MOVING);
export const DEMO_HU: Hexagram = huGua(DEMO_HEX);

/** 卦名 → 上下卦拆解（画标题「上艮下坎」用） */
export const splitName = (g: GuaName): {upper: GuaName; lower: GuaName} => ({upper: g, lower: g});