import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, rnd} from '../common';
import {PAPER, PAPER_DEEP, PAPER_LIGHT, FIBER, STAIN, VIGNETTE, RULE, INK_FAINT} from './paper';

/**
 * 纸底 —— 全片最底层，铺满 1280×720。
 *
 * 它是「清新」的第一来源。做纸不是贴一张黄图就完事，四个层次缺一不可：
 *   1. 基色：米黄，带极缓的明度起伏（不是纯色块）
 *   2. 纤维：极淡的横向短丝，模拟宣纸的帘纹
 *   3. 陈斑：两三处极淡的褐色晕染，位置固定（用 rnd 播种，不随时间变）
 *   4. 渐晕：四边略沉、中间略亮，让画面有「纸被灯照着」的体积
 *
 * 三条硬约束（违反任一条，画面立刻从「纸」变成「黄背景」）：
 *   · 所有纹理的透明度都在 0.03–0.10 之间。超过 0.12 就开始显脏；
 *   · 纹理不随时间动。纸是静的，动的是上面的墨；
 *   · 全片没有纯黑纯白大面积填充。
 */

/** 宣纸帘纹：等距的极淡横线。周期是 26px，模仿竹帘抄纸的帘距。 */
const LaidLines: React.FC<{w: number; h: number}> = ({w, h}) => (
  <>
    {Array.from({length: Math.ceil(h / 26)}, (_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute', left: 0, top: i * 26, width: w, height: 1,
          background: FIBER,
        }}
      />
    ))}
  </>
);

/** 纸纤维：短促的横向丝缕，随机分布但位置固定（种子写死）。 */
const Fibers: React.FC<{w: number; h: number; n?: number}> = ({w, h, n = 90}) => (
  <>
    {Array.from({length: n}, (_, i) => {
      const x = rnd(11, i) * w;
      const y = rnd(12, i) * h;
      const len = 18 + rnd(13, i) * 74;
      const op = 0.018 + rnd(14, i) * 0.030;
      return (
        <div
          key={i}
          style={{
            position: 'absolute', left: x, top: y, width: len, height: 1,
            background: `rgba(150,132,96,${op.toFixed(3)})`,
          }}
        />
      );
    })}
  </>
);

/** 陈化斑：三处极淡的褐色晕染，用径向渐变，位置固定。 */
const Stains: React.FC<{w: number; h: number}> = ({w, h}) => {
  const spots: Array<[number, number, number, number]> = [
    // x, y, 半径, 浓度系数
    [0.18, 0.24, 0.34, 0.9],
    [0.78, 0.68, 0.30, 0.7],
    [0.55, 0.10, 0.22, 0.55],
  ];
  return (
    <>
      {spots.map(([fx, fy, fr, fk], i) => {
        const r = fr * w;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: fx * w - r, top: fy * h - r,
              width: r * 2, height: r * 2,
              background: `radial-gradient(circle, ${STAIN} 0%, rgba(168,138,88,0) 68%)`,
              opacity: fk,
            }}
          />
        );
      })}
    </>
  );
};

/** 四边渐晕：中央提亮、四边压沉。 */
const Vignette: React.FC<{w: number; h: number}> = ({w, h}) => (
  <>
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse 78% 72% at 50% 46%, ${PAPER_LIGHT} 0%, rgba(252,248,238,0) 62%)`,
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      boxShadow: `inset 0 0 ${Math.round(w * 0.10)}px ${Math.round(w * 0.03)}px ${VIGNETTE}`,
    }} />
    {/* 左右两侧各一道更沉的书脊阴影，像翻开的册页 */}
    <div style={{
      position: 'absolute', left: 0, top: 0, width: 54, height: h,
      background: `linear-gradient(to right, ${VIGNETTE}, rgba(120,98,62,0))`,
    }} />
    <div style={{
      position: 'absolute', right: 0, top: 0, width: 54, height: h,
      background: `linear-gradient(to left, ${VIGNETTE}, rgba(120,98,62,0))`,
    }} />
  </>
);

/**
 * 纸底总装。作为 Main 的最底层挂一次即可。
 *
 * `calm` 为 true 时关掉纤维与陈斑，只留基色与渐晕 —— 用于需要极干净的
 * 大数字 / 公式镜头，避免纹理干扰读数。
 */
export const PaperBg: React.FC<{calm?: boolean}> = ({calm = false}) => {
  const {width: w, height: h} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: PAPER}}>
      {/* 基色：极缓的明度起伏，避免整屏死平 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(168deg, ${PAPER_LIGHT} 0%, ${PAPER} 42%, ${PAPER_DEEP} 100%)`,
      }} />
      {!calm && <LaidLines w={w} h={h} />}
      {!calm && <Fibers w={w} h={h} />}
      {!calm && <Stains w={w} h={h} />}
      <Vignette w={w} h={h} />
    </AbsoluteFill>
  );
};

/**
 * 界格 —— 纸上的细线网格。这是纸本体系取代「黑底发光网格」的东西：
 * 黑底靠发光的格子表现结构，纸上靠最淡的墨线界格。
 */
export const RuleGrid: React.FC<{
  x: number; y: number; w: number; h: number;
  cols?: number; rows?: number;
  /** 只画外框 */
  frameOnly?: boolean;
  opacity?: number;
  /** 外框加重一档（做表头区分） */
  frameBold?: boolean;
}> = ({x, y, w, h, cols = 0, rows = 0, frameOnly = false, opacity = 1, frameBold = false}) => (
  <svg width={w} height={h} style={{position: 'absolute', left: x, top: y, opacity, overflow: 'visible'}}>
    {!frameOnly && Array.from({length: Math.max(0, cols - 1)}, (_, i) => (
      <line key={'c' + i} x1={((i + 1) * w) / cols} y1={0} x2={((i + 1) * w) / cols} y2={h}
            stroke={RULE} strokeWidth={1} />
    ))}
    {!frameOnly && Array.from({length: Math.max(0, rows - 1)}, (_, i) => (
      <line key={'r' + i} x1={0} y1={((i + 1) * h) / rows} x2={w} y2={((i + 1) * h) / rows}
            stroke={RULE} strokeWidth={1} />
    ))}
    <rect x={0} y={0} width={w} height={h} fill="none"
          stroke={frameBold ? INK_FAINT : RULE} strokeWidth={frameBold ? 1.8 : 1.2} />
  </svg>
);

/**
 * 印章 —— 朱砂方印，右下角落款处用。
 *
 * 纸本体系里，朱砂是唯一的重音色，印章是全片最重的那个点。
 * 只在片尾与章节转折处出现，一屏最多一个。
 */
export const Seal: React.FC<{
  cx: number; cy: number; size?: number;
  /** 印文，2–4 字，竖排 */
  text?: string;
  opacity?: number;
  /** 盖下去的进度 0–1（配合按压动效） */
  p?: number;
}> = ({cx, cy, size = 76, text = '云梦', opacity = 1, p = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const chars = [...text];
  const s = size * (1.16 - 0.16 * k); // 盖章是「压下去」，从略大收到实尺
  return (
    <div style={{opacity: opacity * (0.55 + 0.45 * k)}}>
      <div style={{
        position: 'absolute', left: cx - s / 2, top: cy - s / 2, width: s, height: s,
        boxSizing: 'border-box', border: `${Math.max(2, s * 0.055)}px solid #B23A2E`,
        borderRadius: s * 0.06,
        // 印泥的虚实：边缘略毛，中间略透
        background: 'rgba(178,58,46,0.045)',
        boxShadow: `inset 0 0 ${Math.round(s * 0.10)}px rgba(178,58,46,0.22)`,
      }} />
      {chars.map((c, i) => {
        const n = chars.length;
        const step = s / (n + 0.6);
        const ty = cy - s / 2 + step * (i + 0.8);
        return (
          <div key={i} style={{
            position: 'absolute', left: cx - s * 0.26, top: ty - step * 0.5,
            width: s * 0.52, height: step, textAlign: 'center',
            fontFamily: `'LXGW WenKai Medium', 'LXGW WenKai', serif`,
            fontSize: Math.round(s * 0.40), lineHeight: `${step}px`,
            color: '#B23A2E', fontWeight: 700,
          }}>{c}</div>
        );
      })}
    </div>
  );
};

/**
 * 章节页眉 —— 纸本版式。右上角一行小字：卷次 + 篇名。
 * 取代黑底体系的顶部紫色胶囊。
 */
export const PageHead: React.FC<{
  chapter: string;
  title: string;
  /** 淡入进度 0–1 */
  p?: number;
  opacity?: number;
}> = ({chapter, title, p = 1, opacity = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  return (
    <div style={{
      position: 'absolute', right: 76, top: 40, textAlign: 'right',
      opacity: opacity * k, fontFamily: `'LXGW WenKai', serif`,
    }}>
      <div style={{fontSize: 22, color: INK_FAINT, letterSpacing: 3}}>{chapter}</div>
      <div style={{fontSize: 30, color: INK_FAINT, letterSpacing: 2, marginTop: 2}}>{title}</div>
    </div>
  );
};