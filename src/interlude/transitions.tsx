import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CText, abs} from '../ui';
import {
  Stage, N1, op, thud, InkHair, TagSign, DipanRing, CenterPin,
  inkSpread, inkDry, clamp01, easeOutCubic, easeInOutCubic,
} from './kit';
import {PaperBg} from '../shushu/paperbg';
import {Fonts} from '../common/lib';
import {rnd} from '../common/easing';
import {INK, INK_SOFT, RULE, CINNABAR, alpha, FONT_KAI, FONT_KAI_BOLD} from '../shushu/paper';
import type {ILProps} from './openers';

/**
 * 通用转场 ×5 —— 首末帧都是空纸，所以既能当插入卡（剪辑点直接落一张），
 * 也能当叠化基底（前后各 6–8 帧留白足够 dissolve）。
 * 长度 1.5–2.3s：转场是标点，不是句子。
 */

const CENTER = {cx: 640, cy: 348};

/* ------------------------------------------------------------------ 转场 1 · 落签
 * 三司签依次落下，朱砂只在**最新那枚**上（焦点传递，不是三处同时红）。
 * 70 帧 / 2.33s。
 * ------------------------------------------------------------------ */
export const TransSignDrop: React.FC<ILProps & {signs?: string[]}> = ({
  signs = ['司天', '司地', '司人'],
}) => {
  const n = N1();
  const at = (i: number) => [6, 24, 42][i] ?? 0;
  const latest = n >= at(2) + 8 ? 2 : n >= at(1) + 8 ? 1 : 0;
  return (
    <Stage>
      {signs.slice(0, 3).map((t, i) => {
        const p = clamp01((n - at(i)) / 9);
        const dry = inkDry(n - (56 + i * 3), 12);
        if (p <= 0 || dry <= 0.01) return null;
        return (
          <div key={t} style={{opacity: dry}}>
            <TagSign cx={CENTER.cx + (i - 1) * 186} cy={CENTER.cy} text={t}
                     tone={i === latest ? 'cinnabar' : 'ink'} p={p} />
          </div>
        );
      })}
    </Stage>
  );
};

/* ------------------------------------------------------------------ 转场 2 · 扫朱
 * 一道朱砂细线自左扫到右，线后带一条纸面提亮带。用于章节推进 / 段落切分。
 * 45 帧 / 1.5s。另有 alpha 叠加版（TransScanOverlay）——可压在任意素材上。
 * ------------------------------------------------------------------ */
const ScanBody: React.FC<{n: number; th?: number}> = ({n, th = 3}) => {
  const p = clamp01((n - 3) / 22);
  const x = -60 + 1400 * p;
  const dry = p >= 1 ? clamp01((n - 26) / 9) : 0;
  if (p <= 0) return null;
  return (
    <>
      {/* 线过处纸面提亮：亮带拖在线的后面（扫过去的地方还亮着） */}
      <div style={{
        ...abs(x - 240, 0, 240, 720),
        background: `linear-gradient(90deg, rgba(252,248,238,0) 0%, rgba(252,248,238,0.30) 46%, rgba(252,248,238,0.68) 100%)`,
        opacity: (1 - dry) * 0.95,
      }} />
      <div style={{
        ...abs(x, 0, th, 720), background: CINNABAR, opacity: (1 - dry) * 0.85,
      }} />
      {/* 线的起止端各一枚方点（不靠颜色单独编码） */}
      <div style={{...abs(x - 2, 96, 7, 7), background: CINNABAR, opacity: (1 - dry) * 0.7}} />
      <div style={{...abs(x - 2, 617, 7, 7), background: CINNABAR, opacity: (1 - dry) * 0.7}} />
    </>
  );
};

export const TransScan: React.FC<ILProps> = () => {
  const n = N1();
  return <Stage><ScanBody n={n} /></Stage>;
};

/** 同一支转场的透明版：没有纸底，只有朱砂线与提亮带，可直接叠在任意素材上。
 *  渲染：`--codec=vp9 --pixel-format=yuva420p`（webm）。 */
export const TransScanOverlay: React.FC<ILProps> = () => {
  const n = N1();
  return (
    <AbsoluteFill>
      <Fonts />
      <ScanBody n={n} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ 转场 3 · 拨盘
 * 十二支环收拢并顺转一点，像把盘拨了一格，然后整盘被纸吸干。
 * 用于换例子 / 换病日 / 时间往前走。60 帧 / 2.0s。
 * ------------------------------------------------------------------ */
export const TransRingTurn: React.FC<ILProps> = ({word = ''}) => {
  const n = N1();
  const t = easeInOutCubic(clamp01((n - 2) / 40));
  const r = 202 - 50 * t;
  const rot = 16 * t;
  const dry = inkDry(n - 40, 14);                    // 40 帧之后被纸吸干
  const vis = op(n - 1, 10) * dry;
  if (vis <= 0.01) return <Stage />;
  return (
    <Stage>
      <div style={{opacity: vis}}>
        <DipanRing cx={640} cy={356} r={r} rot={rot} ringP={1}
                   appear={() => 1} focus={null} labelSize={26} showDir />
        <CenterPin cx={640} cy={356} r={4} p={dry} />
        {word ? (
          <CText cx={640} cy={356} size={30} weight={600} family={FONT_KAI_BOLD} color={INK_SOFT}
                 opacity={inkSpread(n - 14, 12)}>{word}</CText>
        ) : null}
      </div>
    </Stage>
  );
};

/* ------------------------------------------------------------------ 转场 4 · 洇墨
 * 一滴墨落纸，洇成一团淡晕。收尾 / 预告前的一口气。
 * `word` 给了就在晕里浮出两个字（如「下期」「小结」）。60 帧 / 2.0s。
 * ------------------------------------------------------------------ */
/**
 * 洇开的墨斑路径：**不能画成正圆**。正圆 + 径向渐变出来是一颗灰球（试过，像镜头光斑不像墨）。
 * 边缘按 54 点取确定性噪声（相邻三点平均，得到「毛而不刺」的洇边），纸上墨迹的随机外缘靠这一条成立。
 */
const blotPath = (cx: number, cy: number, R: number, seed = 7, pts = 54): string => {
  const rs = (i: number) => {
    const a = rnd(seed, (i - 1 + pts) % pts), b = rnd(seed, i % pts), c = rnd(seed, (i + 1) % pts);
    return (a + b + c) / 3;
  };
  const d: string[] = [];
  for (let i = 0; i < pts; i++) {
    const ang = (i / pts) * Math.PI * 2;
    // 振幅要够大才「毛」：0.62–1.32 倍半径。太小（±3%）出来还是正圆。
    const k = 0.62 + 0.70 * rs(i) + 0.06 * Math.sin(ang * 3.7 + seed);
    const r = R * k;
    const x = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    d.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `${d.join(' ')} Z`;
};

export const TransInkBlot: React.FC<ILProps> = ({word = ''}) => {
  const n = N1();
  const CY = 330;
  const uid = React.useRef(`ib-${Math.round(Math.random() * 1e6)}`).current;
  const uid2 = React.useRef(`ib2-${Math.round(Math.random() * 1e6)}`).current;
  const fall = clamp01((n - 2) / 6);
  const k = n - 8;
  const dropY = (CY - 140) + 140 * Math.pow(fall, 2.2);   // 自上方落下的那一滴
  const s = clamp01((n - 8) / 26);
  const R = 12 + 148 * easeOutCubic(s);                    // 墨斑直径 ≈ 300px，不铺满屏（铺满就成了灰雾）
  const core = 1 - clamp01((n - 12) / 18);
  const dry = n > 40 ? inkDry(n - 40, 14) : 1;
  return (
    <Stage>
      {/* 墨滴 */}
      {fall > 0 && n <= 26 ? (
        <div style={{
          ...abs(640 - 5, dropY + thud(k, 1.4) - 5, 10, 10), borderRadius: 5,
          background: alpha(INK, 0.85),
        }} />
      ) : null}
      {/* 洇开的墨斑：毛边 + 芯浓边淡 + 一枚甩出去的小墨点 */}
      {s > 0 ? (
        <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none',
          filter: 'blur(2.4px)', opacity: (1 - s * 0.5) * dry}}>
          <defs>
            <radialGradient id={uid} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(30,26,20,0.48)" />
              <stop offset="30%" stopColor="rgba(34,30,23,0.30)" />
              <stop offset="62%" stopColor="rgba(44,40,34,0.13)" />
              <stop offset="88%" stopColor="rgba(44,40,34,0.04)" />
              <stop offset="100%" stopColor="rgba(44,40,34,0)" />
            </radialGradient>
            <radialGradient id={uid2} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(34,30,23,0.22)" />
              <stop offset="70%" stopColor="rgba(44,40,34,0.06)" />
              <stop offset="100%" stopColor="rgba(44,40,34,0)" />
            </radialGradient>
          </defs>
          <path d={blotPath(640, CY, R, 7)} fill={`url(#${uid})`} />
          <path d={blotPath(640 - R * 1.05, CY + R * 0.72, R * 0.34, 12)} fill={`url(#${uid2})`} />
        </svg>
      ) : null}
      {/* 落点的那一小块浓墨，被纸吃掉 */}
      {core > 0.02 ? (
        <div style={{...abs(640 - 5, CY - 5, 10, 10), borderRadius: 5, background: alpha(INK, 0.85), opacity: core}} />
      ) : null}
      {word ? (
        <CText cx={640} cy={CY} size={38} weight={700} family={FONT_KAI_BOLD} color={INK}
               opacity={inkSpread(n - 22, 14) * inkDry(n - 42, 12)}>{word}</CText>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ 转场 5 · 合界
 * 四条界格线自四边合拢成一个小方框，框里露出短词（讲次号 / 章名），再被纸吸干。
 * 用于进入下一讲 / 章节卡前后。60 帧 / 2.0s。
 * ------------------------------------------------------------------ */
export const TransGridClose: React.FC<ILProps> = ({word = ''}) => {
  const n = N1();
  const e = easeInOutCubic(clamp01((n - 2) / 34));
  const x0 = -70 + (490 + 70) * e;
  const y0 = -70 + (300 + 70) * e;
  const w = 1420 + (300 - 1420) * e;
  const h = 860 + (120 - 860) * e;
  const settled = n >= 36;
  const dry = settled ? inkDry(n - 44, 14) : 1;
  const col = alpha(RULE, 0.95);
  return (
    <Stage>
      {dry > 0.01 ? (
        <div style={{opacity: dry}}>
          <div style={{...abs(x0, y0, w, 1.4), background: col}} />
          <div style={{...abs(x0, y0 + h - 1.4, w, 1.4), background: col}} />
          <div style={{...abs(x0, y0, 1.4, h), background: col}} />
          <div style={{...abs(x0 + w - 1.4, y0, 1.4, h), background: col}} />
        </div>
      ) : null}
      {/* 框左上角一枚小朱砂点：简写的印，不是第二个焦点 */}
      {settled && dry > 0.01 ? (
        <div style={{...abs(x0 - 2, y0 - 2, 5, 5), background: CINNABAR, opacity: 0.75 * dry}} />
      ) : null}
      {word ? (
        <CText cx={640} cy={360} size={44} weight={700} family={FONT_KAI_BOLD} color={INK}
               opacity={inkSpread(n - 34, 12) * dry}>
          {word}
        </CText>
      ) : null}
    </Stage>
  );
};
