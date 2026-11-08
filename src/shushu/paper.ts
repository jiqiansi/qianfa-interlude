/**
 * 纸本视觉体系 —— 淡黄宣纸底 + 复古楷体的全套设计变量。
 *
 * 与 anything2explainer 的「黑底霓虹 MG」是两套完全不同的皮肤：
 *   黑底体系：黑幕 + 紫霓虹 + 无衬线粗黑体，靠发光制造焦点；
 *   纸本体系：淡黄纸 + 墨色 + 楷体，靠留白与朱砂点染制造焦点。
 *
 * 因此**不能**把旧体系的颜色常量直接拿来用：旧的白金 #E8E8EC 画在米黄纸上
 * 直接消失，旧的紫色 #6630F8 在纸上显得刺眼且不属于任何一个传统色系。
 * 所有颜色都在本文件重新定义，镜头一律从 `paper` 取名，不写字面色值。
 *
 * 设计约束（用户口径）：仿纸张淡黄背景、复古但非毛笔的字体、整体清新。
 * 落到具体规则上：
 *   · 底色是纸，不是白，也不是深色 —— 全片没有一处纯黑或纯白大面积填充；
 *   · 墨色分五档浓淡，靠「墨的浓淡」而不是「发光」区分主次；
 *   · 彩色只做点染：一屏之内彩色面积不超过约一成，其余全是墨与纸；
 *   · 线细（1.5–2.5px），不用大面积色块，不加重投影 —— 这三条是「清新」的来源；
 *   · 焦点用朱砂，结构用靛青，五行用传统五色（在本纸上重新校准过明度）。
 */

// ---------------------------------------------------------------- 纸

/** 纸张底色。全片铺满，是最底层。 */
export const PAPER = '#F6F0DF';
/** 纸的深色档：四边渐晕、纸堆叠的阴影面。 */
export const PAPER_DEEP = '#EBE2CB';
/** 纸的更深处：压角、折痕背面。 */
export const PAPER_SHADE = '#DED3B7';
/** 纸上的柔光（中央提亮），做旧宣纸的中间亮、四周沉。 */
export const PAPER_LIGHT = '#FCF8EE';

/** 纸张纤维纹理的线色（极淡，叠在底上）。 */
export const FIBER = 'rgba(150,132,96,0.055)';
/** 纸张陈化的淡褐斑（局部晕染）。 */
export const STAIN = 'rgba(168,138,88,0.055)';
/** 四边渐晕（纸被压暗的边缘）。 */
export const VIGNETTE = 'rgba(120,98,62,0.10)';

// ---------------------------------------------------------------- 墨

/** 墨色五档。浓墨用于标题与主角，淡墨用于注脚与辅助线。 */
export const INK = '#2C2822';        // 浓墨 · 标题、卦名、爻画
/** 中墨：正文与说明。 */
export const INK_MID = '#4E4739';
/** 淡墨：次要说明、坐标字。 */
export const INK_SOFT = '#79705C';
/** 更淡：网格线、极次要的注脚。 */
export const INK_FAINT = '#A79C83';
/** 界格线：表格与九宫的格线，最淡的一档。 */
export const RULE = '#C9BE9F';

/** 纸上的白色（用于需要「留白」的高光点，非纯白）。 */
export const PAPER_HI = '#FFFDF6';

// ---------------------------------------------------------------- 传统色（点染）

/** 朱砂：唯一的重音色。当前重点、动爻、断语落点、关键数字。 */
export const CINNABAR = '#B23A2E';
/** 朱砂淡：朱砂的浅档，做色阶与次要强调。 */
export const CINNABAR_SOFT = '#CE6A5A';
/** 朱砂晕：朱砂的极淡填充，做底色点染。 */
export const CINNABAR_WASH = 'rgba(178,58,46,0.10)';

/** 靛青：结构色。流程、格线、方位标注、非焦点的结构线条。 */
export const INDIGO = '#2E5A7A';
/** 靛青淡。 */
export const INDIGO_SOFT = '#5C86A3';

export {PAPER as PAPER_BASE};

/** 赭石：次级强调，用于「另一方」「对照」。 */
export const OCHRE = '#A8794A';

/** 青碧：清新的来源。用于「已通」「正确」「新」的正向标记。 */
export const CELADON = '#4E8B78';

/** 藤黄：提示、待办、未定。 */
export const GOLD = '#C9A227';

// ---------------------------------------------------------------- 五行色（在纸上校准）

import type {WuXing} from './chartdata';

/**
 * 五行在纸上的用色。
 *
 * 传统五色是青赤黄白黑，直接搬到米黄纸上，「白」（金）与纸同色、「黑」（水）
 * 与墨同色，两个都失去辨识度。这里按可辨识性重新校准：
 *   · 金改暖灰（素金/银灰），保留「白」的语义又能在纸上看见；
 *   · 水改玄青（深蓝黑），与墨的暖黑拉开色相，既不撞墨也不丢「黑」的语义。
 * 木、火、土三色同步压暗一档 —— 传统色是给白宣纸用的，米黄纸本身偏暖，
 * 亮度不压下来会显脏。
 */
export const PAPER_WUXING: Record<WuXing, string> = {
  木: '#3E7D5A',
  火: '#C0392B',
  土: '#C9A227',
  金: '#9A9488',
  水: '#2B4A6B',
};

/** 五行的淡档（做色阶、填充、非焦点态）。 */
export const PAPER_WUXING_SOFT: Record<WuXing, string> = {
  木: 'rgba(62,125,90,0.16)',
  火: 'rgba(192,57,43,0.16)',
  土: 'rgba(201,162,39,0.18)',
  金: 'rgba(154,148,136,0.18)',
  水: 'rgba(43,74,107,0.16)',
};

/**
 * 生克关系色：生用青碧（顺）、克用朱砂（逆）、比和用淡墨（平）。
 * 刻意不复用五行自身颜色 —— 关系色与五行色混在一张图上时，
 * 关系线必须一眼区别于节点色。
 */
export const RELATION_INK = {
  生: CELADON,
  被生: CELADON,
  克: CINNABAR,
  被克: CINNABAR,
  比和: INK_SOFT,
} as const;

// ---------------------------------------------------------------- 字体

/**
 * 正文与标题字体：霞鹜文楷（LXGW WenKai，OFL 许可）。
 *
 * 选它的理由（对应「复古像毛笔又不是毛笔」）：
 *   · 骨架是楷书，起笔收笔有顿挫与笔锋，比黑体宋体都更「手写」；
 *   · 但它是字体设计师用矢量重新绘制的屏幕字，笔画被规整过，
 *     不会像真毛笔字那样粗细跳脱、在 720p 上糊成一团；
 *   · 有完整的简繁与拉丁字形，标点、数字都能直接用。
 *
 * ⚠ 字体文件放在 template/public/fonts/，由 common/lib.tsx 的 Fonts 组件
 *   通过 delayRender 等待就绪后才渲染第一帧。
 */
export const FONT_KAI = `'LXGW WenKai', 'AR PL UKai CN', 'KaiTi', 'STKaiti', serif`;
/** 楷体粗档（Medium），用于标题与卦名。 */
export const FONT_KAI_BOLD = `'LXGW WenKai', 'AR PL UKai CN', 'KaiTi', 'STKaiti', serif`; // 暂用 Regular 合成粗体，Medium 文件未完整

/**
 * 数字与卦序：等宽楷体 / 衬线数字。
 * 不用 Orbitron 那类科幻等宽 —— 与纸本体系冲突。数字改用衬线，
 * 与楷体的笔锋同源。
 */
export const FONT_NUM = `'LXGW WenKai', 'Times New Roman', serif`;

/** 需要明确「这是引文」的地方（古籍原文、书名）。 */
export const FONT_QUOTE = `'LXGW WenKai', 'Noto Serif CJK SC', 'Songti SC', serif`;

// ---------------------------------------------------------------- 版面

/**
 * 纸上的版面基线。与黑底体系不同，纸本靠留白分栏，所以主区比黑底体系略窄，
 * 左右各留 76px（黑底是 60px）。
 */
export const PAPER_LAYOUT = {
  w: 1280,
  h: 720,
  /** 内容主区 */
  x0: 76, x1: 1204, y0: 96, y1: 616,
  /** 页眉（右上角的篇名 / 章节名） */
  headY: 54,
  /** 页脚（右下角的页码 / 进度） */
  footY: 664,
  /** 正文区（页眉之下、页脚之上） */
  bodyY0: 108, bodyY1: 636,
} as const;

/**
 * 线的粗细。纸本体系一律用细线 —— 这是「清新」的技术来源。
 * 黑底体系靠 2–3px 白描边在暗底上立住，纸上不需要那么粗。
 */
export const STROKE = {
  /** 极细：网格、界格 */
  hair: 1,
  /** 常规：爻画、框线、箭头杆 */
  thin: 1.8,
  /** 加粗：主角框、重点爻 */
  bold: 2.6,
} as const;

/** 圆角。纸上少用圆角，方正的界格更像刻本。 */
export const RADIUS = {none: 0, cell: 4, card: 6, pill: 999} as const;

// ---------------------------------------------------------------- 墨迹浓淡

/**
 * 墨的浓淡五档（0 = 最淡，1 = 最浓）。
 * 用途：一个卦/一条爻处于「过去」「当前」「未来」三种状态时，
 * 不是靠改色相，而是靠改墨的浓淡 —— 这是纸本体系的核心表现手法。
 */
export const INK_LEVELS = [0.18, 0.34, 0.52, 0.76, 1.0] as const;

/** 把墨色按浓淡档调成 rgba。level 0–1。 */
export const inkA = (level: number, base = INK): string => {
  const r = parseInt(base.slice(1, 3), 16);
  const g = parseInt(base.slice(3, 5), 16);
  const b = parseInt(base.slice(5, 7), 16);
  const k = Math.max(0, Math.min(1, level));
  return `rgba(${r},${g},${b},${k.toFixed(3)})`;
};

/** 把任意 #rrggbb 加透明度。 */
export const alpha = (hex: string, a: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const k = Math.max(0, Math.min(1, a));
  return `rgba(${r},${g},${b},${k.toFixed(3)})`;
};

/** 两个 #rrggbb 之间按 k 混色。 */
export const mix = (a: string, b: string, k: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const t = Math.max(0, Math.min(1, k));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

/**
 * 「落墨」缓动：墨点触纸后向外洇开，比线性淡入更贴合纸本。
 * 返回 0–1，供透明度与半径共用。
 */
export const inkSpread = (n: number, len = 10): number => {
  if (n < 0) return 0;
  const t = Math.min(1, n / len);
  // 前段快、后段极慢地收（模拟洇纸的边缘）
  return 1 - Math.pow(1 - t, 3.2);
};

/**
 * 淡墨晕开的离场：不是淡出，是墨被纸吸干。
 * 返回 0–1 的剩余可见度。
 */
export const inkDry = (n: number, len = 12): number => {
  if (n <= 0) return 1;
  const t = Math.min(1, n / len);
  return Math.pow(1 - t, 1.6);
};
