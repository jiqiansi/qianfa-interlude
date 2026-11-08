import React from 'react';
import {FONT_ORB, TEXT_DY, clamp01} from '../common';
import {CText, abs, fadeIn, scaleIn} from '../ui';
import type {GuaName, WuXing, YaoKind} from './chartdata';
import {GUA, WANGSHUAI_LEVEL, type WangShuai} from './chartdata';
import {
  INK, INK_MID, INK_SOFT, INK_FAINT, RULE, PAPER, PAPER_WUXING,
  CINNABAR, CINNABAR_SOFT, CINNABAR_WASH, INDIGO, INDIGO_SOFT,
  FONT_KAI, FONT_KAI_BOLD, FONT_NUM, STROKE, RADIUS,
  alpha, mix, inkSpread, inkA,
} from './paper';

/**
 * 术数排盘的基础图元 —— 纸本配色版。
 *
 * 焦点语言：黑底体系靠紫霓虹发光，纸本靠**朱砂**——
 * 一屏之内朱砂只给一处（当前重点 / 动爻 / 断语落点），其余全是墨与纸。
 * 墨的浓淡（inkA）承担「过去 / 当前 / 未来」的状态区分，不改色相。
 */

// ---------------------------------------------------------------- 爻画

export interface YaoLineProps {
  cx: number;
  cy: number;
  /** 整条爻宽（阴爻两段 + 中缝 = 这个宽度） */
  w?: number;
  h?: number;
  kind: YaoKind;
  color?: string;
  /** 0–1 逐帧生长（draw-on） */
  p?: number;
  opacity?: number;
  glow?: string;
  gapRatio?: number;
}

/** 一条爻。阳爻整条，阴爻中间断开。按 p 从左端生长。 */
export const YaoLine: React.FC<YaoLineProps> = ({
  cx, cy, w = 110, h = 9, kind, color = INK, p = 1, opacity = 1, glow, gapRatio = 0.24,
}) => {
  const k = clamp01(p);
  if (k <= 0 || opacity <= 0) return null;
  const left = cx - (w / 2) * k;
  const ww = w * k;
  const st: React.CSSProperties = {boxSizing: 'border-box', background: color, opacity, boxShadow: glow};
  if (kind === 'yang') return <div style={{...abs(left, cy - h / 2, ww, h), ...st}} />;
  const seg = (ww * (1 - gapRatio)) / 2;
  return (
    <>
      <div style={{...abs(left, cy - h / 2, seg, h), ...st}} />
      <div style={{...abs(left + ww - seg, cy - h / 2, seg, h), ...st}} />
    </>
  );
};

/**
 * 阴阳翻转：动爻变卦的逐帧表现。
 * 阳→阴：中段张开一条缝（墨迹从中裂开）；阴→阳：中缝合拢。
 * p=0 原样，p=1 已是目标态。
 */
export const YaoMorph: React.FC<{
  cx: number; cy: number; w?: number; h?: number;
  from: YaoKind; to: YaoKind; p: number;
  color?: string; opacity?: number; glow?: string;
}> = ({cx, cy, w = 110, h = 9, from, to, p, color = INK, opacity = 1, glow}) => {
  const k = clamp01(p);
  if (from === to) return <YaoLine cx={cx} cy={cy} w={w} h={h} kind={to} color={color} opacity={opacity} glow={glow} />;
  const gap = w * 0.24 * (from === 'yang' ? k : 1 - k);
  const seg = (w - gap) / 2;
  const st: React.CSSProperties = {boxSizing: 'border-box', background: color, opacity, boxShadow: glow};
  return (
    <>
      <div style={{...abs(cx - w / 2, cy - h / 2, seg, h), ...st}} />
      <div style={{...abs(cx - w / 2 + seg + gap, cy - h / 2, seg, h), ...st}} />
    </>
  );
};

// ---------------------------------------------------------------- 三爻卦

export interface GuaGlyphProps {
  cx: number;
  cy: number;
  gua: GuaName;
  /** 三爻总高。默认 78（配角档上限） */
  size?: number;
  yaoW?: number;
  yaoH?: number;
  color?: string;
  label?: 'none' | 'below' | 'right';
  labelSize?: number;
  showWuxing?: boolean;
  showNum?: 'none' | 'xian' | 'hou';
  opacity?: number;
  p?: number;
}

/** 三爻卦：自下而上画三爻，可带卦名 / 五行 / 数。 */
export const GuaGlyph: React.FC<GuaGlyphProps> = ({
  cx, cy, gua, size = 78, yaoW, yaoH, color = INK, label = 'below', labelSize = 30,
  showWuxing = false, showNum = 'none', opacity = 1, p = 1,
}) => {
  const info = GUA[gua];
  const h = yaoH ?? Math.max(7, size * 0.10);
  const gapY = size / 3;
  const w = yaoW ?? Math.min(120, size * 1.4);
  const top = cy - gapY;
  const wu = PAPER_WUXING[info.wuxing];
  const lc = showWuxing ? wu : color;
  return (
    <div style={{opacity}}>
      {info.yao.map((y, i) => {
        const yy = top + (2 - i) * gapY;
        const seg = clamp01(p * 3 - (2 - i) * 0.6);
        return <YaoLine key={i} cx={cx} cy={yy} w={w} h={h} kind={y ? 'yang' : 'yin'} color={lc} p={seg} />;
      })}
      {label !== 'none' ? (
        label === 'below' ? (
          <CText cx={cx} cy={top + 3 * gapY + labelSize * 0.55} size={labelSize} weight={700}
                  family={FONT_KAI_BOLD} color={showWuxing ? wu : INK} scaleX={1}>{gua}</CText>
        ) : (
          <CText cx={cx + w / 2 + labelSize * 0.8} cy={cy} size={labelSize} weight={700}
                  family={FONT_KAI_BOLD} color={showWuxing ? wu : INK} scaleX={1}>{gua}</CText>
        )
      ) : null}
      {showWuxing ? (
        <CText cx={cx} cy={top + 3 * gapY + labelSize * 1.5} size={21} weight={600}
                family={FONT_KAI} color={wu}>{info.wuxing}</CText>
      ) : null}
      {showNum !== 'none' ? (
        <CText cx={cx + (label === 'below' ? w * 0.78 : 0)}
                cy={label === 'below' ? cy - gapY * 0.6 : cy - size * 0.72}
                size={24} weight={700} family={FONT_NUM} color={CINNABAR}>
          {showNum === 'xian' ? info.xianTian : info.houTian}
        </CText>
      ) : null}
    </div>
  );
};

/** Unicode 卦符特大号展示。 */
export const GuaSymbol: React.FC<{
  cx: number; cy: number; gua: GuaName; size?: number; color?: string; opacity?: number;
}> = ({cx, cy, gua, size = 120, color = INK, opacity = 1}) => (
  <CText cx={cx} cy={cy} size={size} weight={400} family={FONT_KAI} color={color} opacity={opacity} dy={0}>
    {GUA[gua].glyph}
  </CText>
);

// ---------------------------------------------------------------- 五行节点

/** 五行节点：圆形淡圈 + 卦色，亮度按旺衰档。 */
export const WuxingNode: React.FC<{
  cx: number; cy: number; wuxing: WuXing; r?: number;
  wang?: WangShuai;
  active?: boolean;
  showLabel?: boolean;
  labelSize?: number;
  opacity?: number;
  p?: number;
}> = ({cx, cy, wuxing, r = 38, wang, active = false, showLabel = true, labelSize = 32, opacity = 1, p = 1}) => {
  const k = clamp01(p);
  if (k <= 0 || opacity <= 0) return null;
  const base = PAPER_WUXING[wuxing];
  const lvl = wang ? WANGSHUAI_LEVEL[wang] : 1;
  const rr = r * (0.5 + 0.5 * k);
  const stroke = active ? CINNABAR : alpha(base, 0.35 + 0.6 * lvl);
  return (
    <div style={{opacity}}>
      <div style={{
        ...abs(cx - rr, cy - rr, rr * 2, rr * 2), borderRadius: rr, boxSizing: 'border-box',
        background: alpha(base, (active ? 0.14 : 0.07) + 0.1 * lvl),
        border: `${Math.max(1.5, r * 0.055).toFixed(1)}px solid ${stroke}`,
        boxShadow: active ? `0 0 0 3px ${CINNABAR_WASH}` : undefined,
      }} />
      {showLabel ? (
        <CText cx={cx} cy={cy} size={labelSize} weight={700} family={FONT_KAI_BOLD}
                color={lvl < 0.4 ? alpha(base, 0.45 + lvl) : base} dy={TEXT_DY}>{wuxing}</CText>
      ) : null}
      {wang ? (
        <CText cx={cx} cy={cy + rr + 14} size={19} weight={600} family={FONT_KAI}
                color={lvl > 0.6 ? CINNABAR_SOFT : INK_FAINT}>{wang}</CText>
      ) : null}
    </div>
  );
};

/** 圆环上按角度取点（0° = 正上，顺时针）。 */
export const ringPoint = (cx: number, cy: number, radius: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad)};
};

// ---------------------------------------------------------------- 方位格

/** 九宫格的一个宫：卦符 / 卦名 / 方位 / 洛书数。 */
export const PalaceCell: React.FC<{
  x: number; y: number; w: number; h: number;
  gua: GuaName | null;
  fangwei?: string;
  num?: number;
  active?: boolean;
  lit?: number;
  opacity?: number;
  p?: number;
  mode?: 'glyph' | 'yao';
  showName?: boolean;
  showFangwei?: boolean;
  showNum?: boolean;
}> = ({x, y, w, h, gua, fangwei, num, active = false, lit = 0, opacity = 1, p = 1,
       mode = 'glyph', showName = true, showFangwei = true, showNum = false}) => {
  const k = clamp01(p);
  if (k <= 0 || opacity <= 0) return null;
  const l = clamp01(lit);
  const wu = gua ? PAPER_WUXING[GUA[gua].wuxing] : INK_FAINT;
  const stroke = active ? CINNABAR : l > 0 ? mix(INK_FAINT, wu, l) : RULE;
  const cx = x + w / 2;
  return (
    <div style={{opacity}}>
      <div style={{
        ...abs(x, y, w, h), boxSizing: 'border-box', borderRadius: RADIUS.cell,
        border: `${active ? STROKE.bold : STROKE.thin}px solid ${stroke}`,
        background: l > 0 ? alpha(wu, 0.06 + 0.1 * l) : 'rgba(255,253,246,0.5)',
      }} />
      {gua ? (
        mode === 'glyph' ? (
          <CText cx={cx} cy={y + h * 0.42} size={Math.min(54, h * 0.48)} weight={400}
                  family={FONT_KAI} color={active ? CINNABAR : wu} opacity={0.6 + 0.4 * k} dy={0}>
            {GUA[gua].glyph}
          </CText>
        ) : (
          <div style={{opacity: 0.6 + 0.4 * k}}>
            <GuaGlyph cx={cx} cy={y + h * 0.40} gua={gua} size={Math.min(56, h * 0.5)}
                      label="none" color={active ? CINNABAR : wu} p={k} />
          </div>
        )
      ) : null}
      {gua && showName ? (
        <CText cx={cx} cy={y + h * 0.71} size={24} weight={700} family={FONT_KAI_BOLD}
                color={active ? CINNABAR : wu} scaleX={1}>{gua}</CText>
      ) : null}
      {showFangwei && fangwei ? (
        <CText cx={cx} cy={y + h * 0.91} size={21} weight={500} family={FONT_KAI}
                color={active ? CINNABAR_SOFT : INK_SOFT}>{fangwei}</CText>
      ) : null}
      {showNum && num !== undefined ? (
        <CText cx={x + w - 15} cy={y + 15} size={22} weight={700} family={FONT_NUM}
                color={active ? CINNABAR : INK_SOFT}>{num}</CText>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- 标签

/** 骑在方块顶边的胶囊标签（卦名 / 体用 / 四象名）。纸本里是细线框 + 墨字。 */
export const EdgeTab: React.FC<{
  x: number; y: number; w?: number; h?: number; text: string;
  /** 框线色，默认朱砂（焦点） */
  color?: string;
  textColor?: string;
  fontSize?: number;
  /** 填充：none | wash（朱砂淡底） */
  fill?: 'none' | 'wash';
  opacity?: number; dy?: number;
}> = ({x, y, w = 96, h = 32, text, color = CINNABAR, textColor = CINNABAR,
       fontSize = 22, fill = 'wash', opacity = 1, dy = 0}) => (
  <div style={{opacity}}>
    <div style={{
      ...abs(x, y + dy, w, h), boxSizing: 'border-box', borderRadius: RADIUS.pill,
      background: fill === 'wash' ? CINNABAR_WASH : 'rgba(255,253,246,0.7)',
      border: `1.5px solid ${color}`,
    }} />
    <CText cx={x + w / 2} cy={y + dy + h / 2} size={fontSize} weight={700}
            family={FONT_KAI_BOLD} color={textColor} dy={TEXT_DY}>{text}</CText>
  </div>
);

/** 序号徽章。 */
export const Badge: React.FC<{
  cx: number; cy: number; n: number | string; r?: number;
  color?: string; opacity?: number; p?: number;
}> = ({cx, cy, n, r = 17, color = INK_SOFT, opacity = 1, p = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const rr = r * (0.5 + 0.5 * k);
  return (
    <div style={{opacity}}>
      <div style={{...abs(cx - rr, cy - rr, rr * 2, rr * 2), boxSizing: 'border-box',
        borderRadius: rr, background: PAPER, border: `1.5px solid ${color}`}} />
      <CText cx={cx} cy={cy} size={r * 1.15} weight={700} family={FONT_NUM} color={color} dy={-1}>
        {String(n)}
      </CText>
    </div>
  );
};

// ---------------------------------------------------------------- 数理格

/** 策轨数理的一个格（原/会/运/世）：细线框 + 大数字 + 备注。 */
export const NumSlot: React.FC<{
  x: number; y: number; w: number; h: number;
  name: string;
  value?: number | string;
  lit?: number;
  active?: boolean;
  note?: string;
  noteColor?: string;
  opacity?: number;
  p?: number;
}> = ({x, y, w, h, name, value, lit = 0, active = false, note, noteColor = INK_FAINT,
       opacity = 1, p = 1}) => {
  const k = clamp01(p);
  if (k <= 0) return null;
  const l = clamp01(lit);
  const stroke = active ? CINNABAR : l > 0 ? mix(RULE, CINNABAR_SOFT, l) : RULE;
  return (
    <div style={{opacity}}>
      <div style={{
        ...abs(x, y, w, h), boxSizing: 'border-box', borderRadius: RADIUS.card,
        border: `${active ? STROKE.bold : STROKE.thin}px solid ${stroke}`,
        background: l > 0 ? alpha(CINNABAR, 0.04 + 0.08 * l) : 'rgba(255,253,246,0.6)',
      }} />
      <CText cx={x + w / 2} cy={y + 25} size={23} weight={700} family={FONT_KAI_BOLD}
              color={active ? CINNABAR : INK_SOFT} scaleX={1}>{name}</CText>
      {value !== undefined ? (
        <CText cx={x + w / 2} cy={y + h * 0.57} size={Math.min(50, h * 0.4)} weight={700}
                family={FONT_NUM} color={active ? CINNABAR : l > 0 ? INK : INK_MID} dy={-2}>
          {String(value)}
        </CText>
      ) : null}
      {note ? (
        <CText cx={x + w / 2} cy={y + h - 17} size={21} weight={600} family={FONT_KAI}
                color={noteColor}>{note}</CText>
      ) : null}
    </div>
  );
};

export {fadeIn, scaleIn, inkSpread, inkA, alpha, mix};