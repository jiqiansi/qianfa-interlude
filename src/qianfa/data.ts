/**
 * 伤寒钤法事实层（唯一数据源）。
 *
 * 规则：镜头组件不许自己写干支/经名/墓位，一律从这里取。
 * 校验：`video/scripts/chart_check.py` 会独立复算本文件的地支序、长生表、墓位与六经对宫。
 *
 * 口径固定（用户 2026-10 考究）：
 *   · 十二长生按**水土同宫**（五行寄生十二宫），不取火土同宫，也不混八字十干阴阳顺逆。
 *   · 天地盘方位**上南下北、左东右西**，地盘布局来自排盘程序 `shanghanCore.js` 的 dipanLayout。
 */

export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export type Zhi = (typeof ZHI)[number];
export type Gan = (typeof GAN)[number];

/** 地支序号：子 0 … 亥 11。 */
export const zhiIdx = (z: Zhi) => ZHI.indexOf(z);
/** 顺行 n 位（阳支进、铺支用）。 */
export const zhiAdd = (z: Zhi, n: number): Zhi => ZHI[(((zhiIdx(z) + n) % 12) + 12) % 12];
/** 对宫（六冲、六经对宫、三丘五墓互为对宫，共用这一条）。 */
export const zhiOpp = (z: Zhi): Zhi => zhiAdd(z, 6);

/**
 * 地盘布局（排盘程序 dipanLayout，4×4 行主序，pos0–pos15）。
 * 中心 2×2 = pos5,6,9,10 合并成一格。
 * 方位：上南下北、左东右西（午顶、子底、卯左、酉右）。
 */
export const DIPAN_POS: (Zhi | null)[] = [
  '巳', '午', '未', '申',
  '辰', null, null, '酉',
  '卯', null, null, '戌',
  '寅', '丑', '子', '亥',
];

/** 环序（顺时针，pos 索引）：巳→午→未→申→酉→戌→亥→子→丑→寅→卯→辰。 */
export const RING_POS = [0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4];

/** 地支 → pos 索引（铺盘、定位用）。 */
export const POS_OF: Record<Zhi, number> = (() => {
  const m = {} as Record<Zhi, number>;
  DIPAN_POS.forEach((z, i) => { if (z) m[z] = i; });
  return m;
})();

/** 地支 → 环上序号（0 = 巳，顺时针）。顺数三宫用环序，不用地支序。 */
export const ringIdxOf = (z: Zhi) => RING_POS.indexOf(POS_OF[z]);
/** 沿环序顺行 n 格。 */
export const ringAdd = (z: Zhi, n: number): Zhi => {
  const i = ringIdxOf(z);
  return DIPAN_POS[RING_POS[(((i + n) % 12) + 12) % 12]] as Zhi;
};

// ---------------------------------------------------------------- 阴阳五行

export const ZHI_YANG = new Set<Zhi>(['子', '寅', '辰', '午', '申', '戌']);
export const isYangZhi = (z: Zhi) => ZHI_YANG.has(z);

export const ZHI_WUXING: Record<Zhi, '木' | '火' | '土' | '金' | '水'> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export const GAN_WUXING: Record<Gan, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

/** 五行相生：木→火→土→金→水→木。 */
export const SHENG: Record<string, string> = {木: '火', 火: '土', 土: '金', 金: '水', 水: '木'};
/** 五行相克：木克土、土克水、水克火、火克金、金克木。 */
export const KE: Record<string, string> = {木: '土', 土: '水', 水: '火', 火: '金', 金: '木'};

// ---------------------------------------------------------------- 六经

/** 地支对宫同经（表里两经共六条）。 */
export const ZHI_JING: Record<Zhi, string> = {
  辰: '太阳', 戌: '太阳',
  卯: '阳明', 酉: '阳明',
  寅: '少阳', 申: '少阳',
  丑: '太阴', 未: '太阴',
  子: '少阴', 午: '少阴',
  巳: '厥阴', 亥: '厥阴',
};

export const LIU_JING = [
  {name: '太阳', zhi: ['辰', '戌'] as Zhi[], full: '太阳（足太阳膀胱经）'},
  {name: '阳明', zhi: ['卯', '酉'] as Zhi[], full: '阳明（足阳明胃经）'},
  {name: '少阳', zhi: ['寅', '申'] as Zhi[], full: '少阳（足少阳胆经）'},
  {name: '太阴', zhi: ['丑', '未'] as Zhi[], full: '太阴（足太阴脾经）'},
  {name: '少阴', zhi: ['子', '午'] as Zhi[], full: '少阴（足少阴肾经）'},
  {name: '厥阴', zhi: ['巳', '亥'] as Zhi[], full: '厥阴（足厥阴肝经）'},
];

// ---------------------------------------------------------------- 十二长生（水土同宫）

export const CHANGSHENG_STEPS = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养',
] as const;
export type ChangShengStep = (typeof CHANGSHENG_STEPS)[number];

/**
 * 五行长生起支（**水土同宫**，用户 2026-10 定死）。
 * 木亥 · 火寅 · 金巳 · 水土申。
 * 不取火土同宫，也不是八字那套「十干各自起、阴干逆行」。
 */
export const CHANGSHENG_START: Record<string, Zhi> = {
  木: '亥',
  火: '寅',
  金: '巳',
  水土: '申', // 水土共用一宫
  土: '申',   // 兼容按五行单独取值
  水: '申',
};

/** 某五行十二长生：返回 12 步 → 地支 的完整表。 */
export const changShengTable = (wx: keyof typeof CHANGSHENG_START) => {
  const start = CHANGSHENG_START[wx];
  const rows = CHANGSHENG_STEPS.map((step, i) => ({step, zhi: zhiAdd(start, i), i}));
  return rows;
};

/** 五行墓位（= 长生 + 9）：木未 · 火戌 · 金丑 · 水土辰。第十三讲棺墓法直接用。 */
export const MU_WEI: Record<string, Zhi> = {
  木: '未', 火: '戌', 金: '丑', 水土: '辰', 土: '辰', 水: '辰',
};

// ---------------------------------------------------------------- 三丘五墓

/** 三丘 / 五墓（四季对宫，互为对宫）。 */
export const SAN_QIU_WU_MU = [
  {season: '春', sanqiu: '丑' as Zhi, wumu: '未' as Zhi},
  {season: '夏', sanqiu: '辰' as Zhi, wumu: '戌' as Zhi},
  {season: '秋', sanqiu: '未' as Zhi, wumu: '丑' as Zhi},
  {season: '冬', sanqiu: '戌' as Zhi, wumu: '辰' as Zhi},
];

// ---------------------------------------------------------------- 五运

/** 五运（年干化运）：甲己土 · 乙庚金 · 丙辛水 · 丁壬木 · 戊癸火。 */
export const WU_YUN: {gan: Gan[]; yun: string; wang: Zhi; note?: string}[] = [
  {gan: ['甲', '己'], yun: '土', wang: '未', note: '棺墓法另一说旺在子，两法不混用'},
  {gan: ['乙', '庚'], yun: '金', wang: '酉'},
  {gan: ['丙', '辛'], yun: '水', wang: '子'},
  {gan: ['丁', '壬'], yun: '木', wang: '卯'},
  {gan: ['戊', '癸'], yun: '火', wang: '午'},
];

/** 五虎遁（年干 → 正月建干）：甲己丙寅首 · 乙庚戊寅头 · 丙辛庚寅 · 丁壬壬寅 · 戊癸甲寅。 */
export const WU_HU_DUN = [
  {gan: ['甲', '己'], head: '丙寅'},
  {gan: ['乙', '庚'], head: '戊寅'},
  {gan: ['丙', '辛'], head: '庚寅'},
  {gan: ['丁', '壬'], head: '壬寅'},
  {gan: ['戊', '癸'], head: '甲寅'},
];

// ---------------------------------------------------------------- 六十甲子

export const JIAZI = Array.from({length: 60}, (_, i) => `${GAN[i % 10]}${ZHI[i % 12]}`);

/** 干支在六十甲子里的序号（0 起）。用于「第 N 干」一类定数计算。 */
export const jiaziIdx = (g: Gan, z: Zhi) => {
  for (let i = 0; i < 60; i++) if (i % 10 === GAN.indexOf(g) && i % 12 === zhiIdx(z)) return i;
  return -1;
};

// ---------------------------------------------------------------- 天干定数（病传「母甲」一间）

/**
 * 病传定数：以落宫天干为第十干，按「十减一除三余零加一」得药号干。
 * 例：癸 → (10−1) % 3 = 0 → 0+1 = 1 → 甲（母甲）。
 */
export const DINGSHU_DIV = 3;
export const dingshuGan = (g: Gan): Gan => {
  const n = GAN.indexOf(g) + 1;            // 甲=1 … 癸=10
  const r = (n - 1) % DINGSHU_DIV;
  return GAN[r];
};

// ---------------------------------------------------------------- 盘面配色（照排盘程序）

export const PZ = {
  tian1: '#2c6e49',   // 天盘地支（主字）深翠
  tian2: '#d35400',   // 天盘天干（左下）赭橙
  tian2r: '#e74c3c',  // 天盘天干·旧版圈标 朱红
  dipan: '#7a9c8a',   // 地盘地支（右下）灰绿
  border: '#d4e8d9',  // 盘体边框 淡青
  cell: '#e1efe7',    // 单元格线
  center: '#eaf4ef',  // 中心格底 浅青
  paper: '#ffffff',   // 纸面（格内）
  ink: '#2c6e49',     // 主文字
  ink2: '#4a7a60',    // 次文字
  ink3: '#7a9c8a',    // 弱文字
  head: 'linear-gradient(#f0f7f3,#e3f0e9)', // 表头渐层
} as const;
