import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CText, abs} from '../ui';
import {clamp01, easeOutCubic, easeInOutCubic} from '../common/easing';
import {Fonts} from '../common/lib';
import {PaperBg} from '../shushu/paperbg';
import {RING_POS, DIPAN_POS, ringIdxOf, type Zhi} from '../qianfa/data';
import {
  PAPER, PAPER_HI, INK, INK_MID, INK_SOFT, INK_FAINT, RULE,
  CINNABAR, CINNABAR_SOFT, alpha, inkSpread, inkDry,
  FONT_KAI, FONT_KAI_BOLD,
} from '../shushu/paper';

/**
 * 片头 / 转场共用件（通用，不绑定任何一期）。
 *
 * 设计口径 —— 只有「四种纸上动作」，全片不出现第二种动效词汇：
 *   ① 落墨（inkSpread）：字从墨点洇开，前景物出现的唯一方式
 *   ② 按印（thud + press）：落到纸面时一次性阻尼抖动，7 帧内衰减（非循环 → 不构成闪烁）
 *   ③ 逐格铺：格/签/支按序落位，关键帧落在「落下那一下」
 *   ④ 吸干（inkDry）：离场不是淡出，是墨被纸吸走
 * 色只用纸/墨五档 + 朱砂一处焦点；字体一律霞鹜文楷（与 21 期成片同一套字）。
 */

export const N1 = () => useCurrentFrame() + 1;

/** 首帧即有微亮度的淡入（别用 n/len，首帧会是全黑）。 */
export const op = (n: number, len = 12) => (n < 0 ? 0 : 1 - Math.pow(1 - clamp01((n + 1) / (len + 1)), 2.2));

/** 落定后的一次性阻尼抖动（px）。k>7 后恒为 0 —— 是「按下去」的手感，不是循环闪烁。 */
export const thud = (k: number, a = 2.4) => (k < 0 || k > 7 ? 0 : a * Math.pow(0.55, k) * Math.sin(k * 2.2));

export {easeOutCubic, easeInOutCubic, inkSpread, inkDry, clamp01};

/** 所有片头/转场的公共外壳：纸底 + 字体就绪。
 *  `FontsOnce` 把外层的字体等待传给内层 —— 接触印相一次铺几十格时，
 *  不能让每一格各自 delayRender 一次。 */
const FontsCtx = React.createContext(false);
export const FontsOnce: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <FontsCtx.Provider value>
    <Fonts />
    {children}
  </FontsCtx.Provider>
);

export const Stage: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const hasFonts = React.useContext(FontsCtx);
  return (
    <AbsoluteFill style={{background: PAPER}}>
      {hasFonts ? null : <Fonts />}
      <PaperBg />
      {children}
    </AbsoluteFill>
  );
};

/** 横墨线（可自中心向两侧生长）。 */
export const InkHair: React.FC<{
  cx: number; y: number; w: number; p: number;
  color?: string; th?: number; opacity?: number;
}> = ({cx, y, w, p, color = RULE, th = 1.2, opacity = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const width = Math.max(0.5, w * k);
  return (
    <div style={{
      ...abs(cx - width / 2, y, width, th),
      background: color, opacity: opacity * (0.35 + 0.65 * k),
    }} />
  );
};

/** 竖排小字（印侧标签、得病日标签）。 */
export const VText: React.FC<{
  cx: number; y: number; text: string; size?: number; gap?: number;
  color?: string; p?: number; family?: string; weight?: number;
}> = ({cx, y, text, size = 22, gap = 4, color = INK_SOFT, p = 1, family = FONT_KAI, weight = 500}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const chars = [...text];
  return (
    <>
      {chars.map((c, i) => (
        <CText key={i} cx={cx} cy={y + i * (size + gap)} size={size} weight={weight} family={family}
               color={color} opacity={clamp01(k * chars.length - i)} dy={-1}>{c}</CText>
      ))}
    </>
  );
};

/**
 * 方印（朱文/白文印章）。片头的「钤」在本课里就是这枚印：
 * 钤法 = 以印记定位，印一落，盘就定了。
 *
 * 落印分两段：`fall` 从高到落（加速下落），`press` 从触纸到压实（印文逐字吃进纸里）。
 * 印文按传统读序排：右列自上而下，再左列自上而下。
 */
/**
 * 印文排布（传统读序）：
 *   1 字 → 居中一枚大字
 *   2 字 → 单列竖排（自上而下，最不容易读错）
 *   3 字 → 单列竖排，字号收一档
 *   4 字 → 2×2，**右列先、左列后**（四字印的规矩读法：右上一→右下二→左上一→左下二）
 *   4 字以上 → 双列分组
 */
const sealLayout = (list: string[], s: number): Array<{c: string; x: number; y: number; size: number}> => {
  const n = list.length;
  const out: Array<{c: string; x: number; y: number; size: number}> = [];
  if (n === 1) {
    return [{c: list[0], x: 0, y: 0, size: s * 0.60}];
  }
  if (n === 2) {
    list.forEach((c, i) => out.push({c, x: 0, y: (i - 0.5) * s * 0.40, size: s * 0.38}));
    return out;
  }
  if (n === 3) {
    list.forEach((c, i) => out.push({c, x: 0, y: (i - 1) * s * 0.32, size: s * 0.30}));
    return out;
  }
  if (n === 4) {
    const order: Array<[number, number]> = [[1, 0], [1, 1], [0, 0], [0, 1]];
    order.forEach(([cc, rr], i) => out.push({
      c: list[i], x: (cc - 0.5) * s * 0.50, y: (rr - 0.5) * s * 0.44, size: s * 0.38,
    }));
    return out;
  }
  const rows = Math.ceil(n / 2);
  const order: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) order.push([1, r]);
  for (let r = 0; r < rows; r++) order.push([0, r]);
  list.forEach((c, i) => {
    const [cc, rr] = order[i] ?? [0, 0];
    out.push({c, x: (cc - 0.5) * s * 0.50, y: (rr - (rows - 1) / 2) * s * 0.36, size: s * 0.30});
  });
  return out;
};

export const SealStamp: React.FC<{
  cx: number; cy: number; size?: number; chars?: string;
  fall: number; press: number; dy?: number;
}> = ({cx, cy, size = 226, chars = '钤法', fall, press, dy = 0}) => {
  const f = clamp01(fall);
  if (f <= 0) return null;
  const s = size * (1.12 - 0.12 * easeOutCubic(f));               // 落到纸面时正好是实尺
  const body = 0.35 + 0.65 * easeOutCubic(f);                      // 下落中逐渐实起来
  const glyphs = sealLayout([...chars], s);
  return (
    <div style={{...abs(0, 0, 0, 0), opacity: body, transform: `translateY(${dy}px)`}}>
      {/* 印泥的底：朱砂块 + 略深的印边 + 不均匀的印泥沉积 */}
      <div style={{
        ...abs(cx - s / 2, cy - s / 2, s, s), boxSizing: 'border-box',
        background: CINNABAR, border: `${Math.max(2, s * 0.012)}px solid ${alpha('#8E3029', 0.55)}`,
        borderRadius: s * 0.022,
        backgroundImage: 'radial-gradient(circle at 36% 32%, rgba(142,47,38,0.30), rgba(142,47,38,0) 62%), radial-gradient(circle at 74% 78%, rgba(142,47,38,0.22), rgba(142,47,38,0) 58%)',
      }} />
      {/* 印泥的斑驳：两处羽化的纸色缺口（印泥没吃匀）。用渐变羽化，硬边小方块会像脏点 */}
      <div style={{...abs(cx - s * 0.46, cy - s * 0.16, s * 0.16, s * 0.12), background: `radial-gradient(ellipse at center, ${alpha(PAPER, 0.24)} 0%, ${alpha(PAPER, 0)} 70%)`}} />
      <div style={{...abs(cx + s * 0.14, cy + s * 0.34, s * 0.22, s * 0.14), background: `radial-gradient(ellipse at center, ${alpha(PAPER, 0.18)} 0%, ${alpha(PAPER, 0)} 70%)`}} />
      {/* 内圈细白边（印边的留白），纸质白 */}
      <div style={{
        ...abs(cx - s / 2 + s * 0.075, cy - s / 2 + s * 0.075, s * 0.85, s * 0.85),
        boxSizing: 'border-box', border: `${Math.max(1.2, s * 0.007)}px solid ${alpha(PAPER_HI, 0.42)}`,
        borderRadius: s * 0.012,
      }} />
      {/* 印文：白文（朱底纸字），逐字压印 */}
      {glyphs.map((g, i) => {
        const pi = clamp01((press - i * 0.17) / 0.36);
        if (pi <= 0) return null;
        return (
          <CText key={i} cx={cx + g.x} cy={cy + g.y} size={g.size * (1.22 - 0.22 * pi)} weight={700}
                 family={FONT_KAI_BOLD} color={PAPER_HI} opacity={pi} dy={-2}>{g.c}</CText>
        );
      })}
    </div>
  );
};

/** 纸上的签（落签动效）：白底 + 细框 + 居中字。朱砂签左侧多一枚方点（不靠颜色单独编码）。 */
export const TagSign: React.FC<{
  cx: number; cy: number; w?: number; h?: number; text: string;
  tone?: 'ink' | 'cinnabar'; p: number; size?: number;
}> = ({cx, cy, w = 156, h = 54, text, tone = 'ink', p, size = 27}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const col = tone === 'cinnabar' ? CINNABAR : INK_SOFT;
  const dy = -16 * (1 - easeOutCubic(k));
  return (
    <div style={{opacity: k, transform: `translateY(${dy.toFixed(2)}px)`}}>
      <div style={{
        ...abs(cx - w / 2, cy - h / 2, w, h), boxSizing: 'border-box',
        background: PAPER_HI, borderRadius: 4,
        border: `${tone === 'cinnabar' ? 2 : 1.6}px solid ${tone === 'cinnabar' ? CINNABAR : RULE}`,
      }} />
      {tone === 'cinnabar' ? (
        <div style={{...abs(cx - w / 2 + 9, cy - 2.5, 5, 5), background: CINNABAR, borderRadius: 1}} />
      ) : null}
      <CText cx={cx} cy={cy} size={size} weight={tone === 'cinnabar' ? 700 : 600}
             family={tone === 'cinnabar' ? FONT_KAI_BOLD : FONT_KAI} color={col} dy={-1}>{text}</CText>
    </div>
  );
};

/**
 * 十二支环 —— **午在顶**（上南下北），环序顺行；与十六宫地盘同一套方位。
 * ⚠ 不要用 `shushu/ganzhi.tsx` 的 `DizhiWheel`：那是卦课的「子在顶（上北下南）」，
 *   两套课混用会让老观众以为方位标错了。
 */
export const DipanRing: React.FC<{
  cx: number; cy: number; r: number;
  /** 第 i 个支（环序 0 = 巳）的出现进度 */
  appear?: (i: number) => number;
  focus?: Zhi | null;
  ringP?: number;
  rot?: number;
  showDir?: boolean;
  labelSize?: number;
}> = ({cx, cy, r, appear, focus = null, ringP = 1, rot = 0, showDir = true, labelSize = 27}) => {
  const zp = clamp01(ringP);
  return (
    <>
      <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: zp}}>
        <g transform={`rotate(${rot.toFixed(2)} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={RULE} strokeWidth={1.3} />
          {RING_POS.map((pos, i) => {
            const a = ((i - 1) * 30 - 90) * Math.PI / 180;      // 环序 1 = 午 → 顶
            return (
              <line key={i} x1={cx + (r - 9) * Math.cos(a)} y1={cy + (r - 9) * Math.sin(a)}
                    x2={cx + (r + 7) * Math.cos(a)} y2={cy + (r + 7) * Math.sin(a)}
                    stroke={RULE} strokeWidth={1.1} />
            );
          })}
        </g>
      </svg>
      {RING_POS.map((pos, i) => {
        const z = DIPAN_POS[pos] as Zhi;
        const k = appear ? clamp01(appear(i)) : 1;
        if (k <= 0) return null;
        const a = ((i - 1) * 30 - 90 + rot) * Math.PI / 180;
        const x = cx + (r + 30) * Math.cos(a);
        const y = cy + (r + 30) * Math.sin(a);
        const is = focus === z;
        return (
          <div key={z} style={{opacity: k}}>
            {/* 焦点标在**环上**（不是字后），否则朱砂块糊在字身上 */}
            {is ? (
              <div style={{
                ...abs(cx + r * Math.cos(a) - 7, cy + r * Math.sin(a) - 7, 14, 14),
                borderRadius: 7, border: `2px solid ${CINNABAR}`, background: alpha(CINNABAR, 0.12),
              }} />
            ) : null}
            <CText cx={x} cy={y} size={is ? labelSize + 3 : labelSize} weight={is ? 700 : 500}
                   family={is ? FONT_KAI_BOLD : FONT_KAI}
                   color={is ? CINNABAR : INK} opacity={is ? 1 : 0.86} dy={-1}>{z}</CText>
          </div>
        );
      })}
      {/* 方位：上南下北（与十六宫盘一致，标出来是为了让方位可辨） */}
      {showDir ? (
        <>
          <CText cx={cx} cy={cy - r - 52} size={18} family={FONT_KAI} color={INK_FAINT}>南</CText>
          <CText cx={cx} cy={cy + r + 52} size={18} family={FONT_KAI} color={INK_FAINT}>北</CText>
          <CText cx={cx - r - 52} cy={cy} size={18} family={FONT_KAI} color={INK_FAINT}>东</CText>
          <CText cx={cx + r + 52} cy={cy} size={18} family={FONT_KAI} color={INK_FAINT}>西</CText>
        </>
      ) : null}
    </>
  );
};

/** 纸上一枚小朱点（盘心针）：环中央的静止焦点，表示「盘在此，未动」。 */
export const CenterPin: React.FC<{cx: number; cy: number; r?: number; p?: number}> = ({cx, cy, r = 4, p = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  return <div style={{...abs(cx - r, cy - r, r * 2, r * 2), borderRadius: r, background: CINNABAR, opacity: 0.6 * k}} />;
};

/** 课程名 + 系列名（片头收尾统一的题签块，位置由调用方给）。 */
export const TitleBlock: React.FC<{
  cx: number; cy: number; course: string; series?: string; sub?: string; tagline?: string;
  p: number; size?: number; lineP?: number; tagP?: number;
}> = ({cx, cy, course, series, sub, tagline, p, size = 46, lineP = 1, tagP = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  return (
    <div style={{opacity: k}}>
      {series ? (
        <CText cx={cx} cy={cy - (tagline ? 96 : 74)} size={21} family={FONT_KAI} color={INK_FAINT}
               letterSpacing={6}>{sub ? `${series} · ${sub}` : series}</CText>
      ) : null}
      <CText cx={cx} cy={cy} size={size} weight={700} family={FONT_KAI_BOLD} color={INK}>{course}</CText>
      <InkHair cx={cx} y={cy + size * 0.62} w={200} p={lineP} color={CINNABAR} th={2} opacity={0.72} />
      {tagline ? (
        <CText cx={cx} cy={cy + size * 0.62 + 40} size={26} family={FONT_KAI} color={INK_SOFT}
               opacity={clamp01(tagP)}>{tagline}</CText>
      ) : null}
    </div>
  );
};


/** 某地支在「午在顶」环上的角度（弧度）与坐标 —— 环类图形的共用几何。 */
export const ringAngle = (z: Zhi) => ((ringIdxOf(z) - 1) * 30 - 90) * Math.PI / 180;
export const ringXY = (z: Zhi, cx: number, cy: number, r: number) => {
  const a = ringAngle(z);
  return {x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a};
};

/** 纸上的小格（签/格/块）：白底 + 细界格线；tone 决定边框。 */
export const PaperCell: React.FC<{
  x: number; y: number; w: number; h: number; p?: number;
  tone?: 'rule' | 'ink' | 'cinnabar'; r?: number; fill?: string; sw?: number;
}> = ({x, y, w, h, p = 1, tone = 'rule', r = 3, fill = PAPER_HI, sw}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const col = tone === 'cinnabar' ? CINNABAR : tone === 'ink' ? INK_SOFT : RULE;
  const width = sw ?? (tone === 'cinnabar' ? 2 : 1.4);
  return (
    <div style={{
      ...abs(x, y, w, h), boxSizing: 'border-box', background: fill, borderRadius: r,
      border: `${width}px solid ${col}`, opacity: k,
      boxShadow: tone === 'cinnabar' ? `0 0 0 3px rgba(178,58,46,0.10)` : undefined,
    }} />
  );
};

/** 虚线（带生长进度）：对宫连线、关系线用。 */
export const DashLine: React.FC<{
  x1: number; y1: number; x2: number; y2: number; p: number;
  color?: string; dash?: string; sw?: number;
}> = ({x1, y1, x2, y2, p, color = RULE, dash = '7 6', sw = 1.6}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  return (
    <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeDasharray={dash}
            strokeDashoffset={1 - k} pathLength={1} opacity={0.9} />
    </svg>
  );
};

export {CINNABAR_SOFT, INK_MID, INK_SOFT, INK_FAINT, alpha, INK};
export type {Zhi};
