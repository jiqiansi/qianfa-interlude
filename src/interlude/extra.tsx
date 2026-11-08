import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CText, abs} from '../ui';
import {
  Stage, N1, op, thud, InkHair, VText, DipanRing, CenterPin, PaperCell, DashLine,
  ringXY, ringAngle, inkSpread, inkDry, clamp01, easeOutCubic, easeInOutCubic, alpha,
} from './kit';
import {FONT_KAI, FONT_KAI_BOLD, INK, INK_MID, INK_SOFT, INK_FAINT, RULE, CINNABAR, CINNABAR_SOFT,
  CINNABAR_WASH, PAPER_HI} from '../shushu/paper';
import {JIAZI, ZHI_JING, SAN_QIU_WU_MU, ZHI, type Zhi} from '../qianfa/data';
import type {ILProps} from './openers';

/**
 * 实验组 ×12 —— 同一套纸墨语言下的**不同风格**：
 * 环形（对宫/日晷/四季）、目录型、长卷横移、机械咬合、跳格、相撞、网格、对照栏、光、单点落子。
 * 与 5 支常规片头/转场一样：不绑定任何一期，讲次与短词走 props。
 * 事实只取 `qianfa/data.ts`（对宫同经、三丘五墓、六十甲子），不自行编造。
 */

const BASE = {course: '伤寒钤法', series: '清源勘道', sub: '术数精讲'};
const Head: React.FC<{series: string; sub: string; y?: number; p: number}> = ({series, sub, y = 104, p}) => (
  <CText cx={640} cy={y} size={19} family={FONT_KAI} color={INK_FAINT} letterSpacing={6}
         opacity={inkSpread(p, 16)}>{`${series} · ${sub}`}</CText>
);

/* ================================================================ X1 对宫定经（环 · 结构型）
 * 得病日支亮起 → 虚线穿心连到对宫 → 环心浮出经名。地支对宫同经，这是读盘的第一步。
 * 150 帧 / 5.0s。
 */
export const ExDuiGongJing: React.FC<ILProps> = ({
  series = BASE.series, sub = BASE.sub, stop = '寅', lec = '', title = '',
}) => {
  const n = N1();
  const cx = 640, cy = 350, r = 186;
  const z0 = stop as Zhi;
  const jing = ZHI_JING[z0] ?? '';
  // 对宫：同经的那一支（辰戌 / 卯酉 / 寅申 / 丑未 / 子午 / 巳亥）
  const z1 = ((Object.keys(ZHI_JING) as Zhi[]).find((z) => z !== z0 && ZHI_JING[z] === jing) ?? z0) as Zhi;
  const a = ringXY(z0, cx, cy, r);
  const b = ringXY(z1, cx, cy, r);
  const p0 = clamp01((n - 64) / 26);
  return (
    <Stage>
      <Head series={series} sub={sub} p={n - 2} />
      <DipanRing cx={cx} cy={cy} r={r} ringP={op(n - 2, 14)}
                 appear={(i) => clamp01((n - (5 + 4 * i)) / 11)}
                 focus={n > 56 ? (stop as Zhi) : null} labelSize={27} showDir={false} />
      <CenterPin cx={cx} cy={cy} p={clamp01((n - 6) / 12)} />
      {/* 对宫虚线：先长出一半，再补齐另一半（穿心） */}
      <DashLine x1={a.x} y1={a.y} x2={cx + (a.x - cx) * 0.30} y2={cy + (a.y - cy) * 0.30}
                p={clamp01((n - 64) / 14)} color={CINNABAR_SOFT} sw={1.8} />
      <DashLine x1={cx + (b.x - cx) * 0.30} y1={cy + (b.y - cy) * 0.30} x2={b.x} y2={b.y}
                p={p0} color={CINNABAR_SOFT} sw={1.8} />
      {n > 56 ? (
        <div style={{...abs(b.x - 7, b.y - 7, 14, 14), borderRadius: 7, border: `2px solid ${alpha(CINNABAR, 0.55)}`}} />
      ) : null}
      {/* 环心：经名 */}
      <CText cx={cx} cy={cy - 16} size={46} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 94) / 16)} dy={-2}>{jing}</CText>
      <InkHair cx={cx} y={cy + 16} w={96} p={clamp01((n - 104) / 14)} color={CINNABAR} th={1.8} opacity={0.7} />
      <CText cx={cx} cy={cy + 48} size={20} family={FONT_KAI} color={INK_SOFT} letterSpacing={3}
             opacity={clamp01((n - 112) / 16)}>对宫同经</CText>
      {lec || title ? (
        <CText cx={640} cy={648} size={24} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 122) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ================================================================ X2 七步目录（目录型）
 * 一讲要走的七步，像刻本目录一样逐条落墨；朱砂只在**最新那一条**的序号上（焦点传递）。
 * 180 帧 / 6.0s。
 */
const SEVEN = ['定司天', '定司地', '定司人', '铺天盘支', '铺天盘干', '读经', '取号'];
export const ExSevenSteps: React.FC<ILProps & {steps?: string[]}> = ({
  course = BASE.course, series = BASE.series, sub = BASE.sub, lec = '', title = '', steps = SEVEN,
}) => {
  const n = N1();
  const size = 30, y0 = 214, dy = 52;
  const badgeX = 452, textL = 486;
  const rows = steps.slice(0, 7);
  const at = (i: number) => 10 + i * 13;
  const latest = rows.reduce((acc, _s, i) => (n >= at(i) ? i : acc), -1);
  const lastY = y0 + (rows.length - 1) * dy;
  return (
    <Stage>
      <CText cx={640} cy={140} size={22} family={FONT_KAI} color={INK_FAINT} letterSpacing={6}
             opacity={inkSpread(n - 2, 16)}>{`${series} · ${sub}`}</CText>
      <CText cx={640} cy={172} size={30} weight={600} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 6, 16)}>本讲路线</CText>
      {/* 进度竖线 + 滑动的朱砂点 */}
      <div style={{...abs(828, y0 - 14, 1.4, lastY - y0 + 28), background: RULE, opacity: clamp01((n - 8) / 14)}} />
      <div style={{
        ...abs(823.5, y0 + Math.max(0, latest) * dy - 4.5, 11, 11), borderRadius: 2, background: CINNABAR,
        opacity: latest < 0 ? 0 : 0.85,
      }} />
      {rows.map((t, i) => {
        const p = inkSpread(n - at(i), 14);
        if (p <= 0) return null;
        const isNow = i === latest;
        return (
          <div key={t} style={{opacity: p}}>
            <div style={{
              ...abs(badgeX - 15, y0 + i * dy - 15, 30, 30), boxSizing: 'border-box', borderRadius: 15,
              border: `${isNow ? 2 : 1.3}px solid ${isNow ? CINNABAR : RULE}`,
              background: isNow ? CINNABAR_WASH : 'transparent',
            }} />
            <CText cx={badgeX} cy={y0 + i * dy} size={19} weight={700} family={FONT_KAI_BOLD}
                   color={isNow ? CINNABAR : INK_FAINT} dy={-1}>{`${i + 1}`}</CText>
            <CText cx={textL + (t.length * size * 1.02) / 2} cy={y0 + i * dy} size={size}
                   weight={isNow ? 700 : 500} family={isNow ? FONT_KAI_BOLD : FONT_KAI}
                   color={isNow ? INK : INK_SOFT} dy={-1}>{t}</CText>
          </div>
        );
      })}
      <InkHair cx={640} y={lastY + 54} w={420} p={clamp01((n - 118) / 16)} color={CINNABAR} th={2} opacity={0.72} />
      <CText cx={640} cy={lastY + 96} size={44} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 124) / 16)} dy={-2}>{course}</CText>
      {lec || title ? (
        <CText cx={640} cy={lastY + 138} size={26} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 132) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ================================================================ X3 六十甲子长卷（横移长卷）
 * 时间是一卷纸：镜头沿卷横移，停在被朱砂圈住的那一格。两侧离中心越远越淡（卷的"远"）。
 * 135 帧 / 4.5s。props: stop = 停在哪个干支。
 */
export const ExJiaziScroll: React.FC<ILProps> = ({
  course = BASE.course, series = BASE.series, sub = BASE.sub, stop = '甲寅', lec = '', title = '',
}) => {
  const n = N1();
  const CW = 104;                       // 每格宽
  const idx = Math.max(0, JIAZI.indexOf(stop));
  const t = easeOutCubic(clamp01((n - 2) / 66));
  const startOff = idx - 26, endOff = idx;      // 从卷的前段滚到目标格
  const off = startOff + (endOff - startOff) * t;
  const blur = 5 * Math.pow(1 - clamp01((n - 2) / 66), 2.2);
  const k = n - 70;
  const th = thud(k, 1.6);
  const boxP = clamp01((n - 74) / 18);
  const cx = 640, y = 300, H = 132;
  const cells: Array<{g: string; rel: number}> = [];
  for (let i = -7; i <= 7; i++) {
    const gi = ((idx + i) % 60 + 60) % 60;
    cells.push({g: JIAZI[gi], rel: i});
  }
  return (
    <Stage>
      <Head series={series} sub={sub} p={n - 2} />
      {/* 长卷的两条界格线（跟着卷一起走） */}
      <InkHair cx={cx} y={y - H / 2} w={1280} p={clamp01((n - 2) / 14)} color={RULE} th={1.2} />
      <InkHair cx={cx} y={y + H / 2} w={1280} p={clamp01((n - 2) / 14)} color={RULE} th={1.2} />
      <div style={{filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
        {cells.map((c, i) => {
          const x = cx + (c.rel - (off - idx)) * CW;
          if (x < -CW || x > 1280 + CW) return null;
          const dist = Math.abs(x - cx) / 1280;
          const settled = n >= 70 && c.rel === 0;
          return (
            <div key={i} style={{opacity: 1 - 0.55 * Math.min(1, dist * 2.4)}}>
              <CText cx={x} cy={y + th} size={settled ? 62 : 54} weight={settled ? 700 : 500}
                     family={FONT_KAI_BOLD} color={settled ? INK : INK_SOFT}>{c.g}</CText>
              <div style={{...abs(x - CW / 2, y - H / 2 + 8, 1, H - 16), background: RULE, opacity: 0.55}} />
            </div>
          );
        })}
      </div>
      {/* 停定的朱砂框 */}
      {boxP > 0 ? (
        <>
          <InkHair cx={cx} y={y - H / 2} w={CW} p={boxP} color={CINNABAR} th={2} opacity={0.85} />
          <InkHair cx={cx} y={y + H / 2} w={CW} p={boxP} color={CINNABAR} th={2} opacity={0.85} />
          {boxP > 0.55 ? (
            <>
              <div style={{...abs(cx - CW / 2, y - H / 2, 2, H * (boxP - 0.55) / 0.45), background: CINNABAR, opacity: 0.85}} />
              <div style={{...abs(cx + CW / 2 - 2, y - H / 2, 2, H * (boxP - 0.55) / 0.45), background: CINNABAR, opacity: 0.85}} />
            </>
          ) : null}
        </>
      ) : null}
      <VText cx={cx + CW / 2 + 30} y={y - 32} text="得病日" size={21} gap={8} color={INK_SOFT} p={clamp01((n - 88) / 16)} />
      <CText cx={640} cy={474} size={46} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 92) / 16)} dy={-2}>{course}</CText>
      <InkHair cx={640} y={514} w={190} p={clamp01((n - 100) / 14)} color={CINNABAR} th={2} opacity={0.72} />
      {lec || title ? (
        <CText cx={640} cy={566} size={26} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 108) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ================================================================ X4 干支咬合（机械 · 表格化）
 * 十格天干条 × 十二格地支条反向咬合，对齐的那一格就是那一天（甲 × 寅 = 甲寅）。
 * 165 帧 / 5.5s。
 */
export const ExGanzhiGears: React.FC<ILProps> = ({
  course = BASE.course, series = BASE.series, sub = BASE.sub, stop = '甲寅', lec = '', title = '',
}) => {
  const n = N1();
  const CW = 76, CH = 66;
  const gi = Math.max(0, JIAZI.indexOf(stop));
  const gan = JIAZI[gi][0];
  const zhi = JIAZI[gi][1];
  const ganIdx = '甲乙丙丁戊己庚辛壬癸'.indexOf(gan);
  const zhiIdx = '子丑寅卯辰巳午未申酉戌亥'.indexOf(zhi);
  const t = easeOutCubic(clamp01((n - 2) / 74));
  const ganOff = (ganIdx - 4) + (4 - ganIdx) * t;      // 天干条自右向左收
  const zhiOff = (zhiIdx - 5) + (5 - zhiIdx) * t;      // 地支条反向（咬合）
  const blur = 6 * Math.pow(1 - clamp01((n - 2) / 74), 2.2);
  const yG = 232, yZ = 330;
  const k = n - 78;
  const th = thud(k, 1.5);
  const boxP = clamp01((n - 82) / 16);
  const ganChars = '甲乙丙丁戊己庚辛壬癸'.split('');
  const zhiChars = '子丑寅卯辰巳午未申酉戌亥'.split('');
  return (
    <Stage>
      <Head series={series} sub={sub} p={n - 2} />
      <CText cx={640} cy={168} size={22} family={FONT_KAI} color={INK_FAINT} letterSpacing={4}
             opacity={inkSpread(n - 6, 16)}>天干轮 × 地支轮 · 咬合</CText>
      <div style={{filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
        {ganChars.map((c, i) => {
          const x = 640 + (i - ganOff) * CW;
          if (x < -CW || x > 1280 + CW) return null;
          return (
            <div key={c} style={{opacity: 1 - 0.5 * Math.min(1, Math.abs(x - 640) / 700 * 1.6)}}>
              <CText cx={x} cy={yG + th} size={44} family={FONT_KAI_BOLD} color={INK_SOFT}>{c}</CText>
              <div style={{...abs(x - CW / 2, yG - CH / 2, CW, CH), boxSizing: 'border-box', border: `1.2px solid ${RULE}`}} />
            </div>
          );
        })}
        {zhiChars.map((c, i) => {
          const x = 640 + (i - zhiOff) * CW;
          if (x < -CW || x > 1280 + CW) return null;
          return (
            <div key={c} style={{opacity: 1 - 0.5 * Math.min(1, Math.abs(x - 640) / 700 * 1.6)}}>
              <CText cx={x} cy={yZ + th} size={44} family={FONT_KAI_BOLD} color={INK_SOFT}>{c}</CText>
              <div style={{...abs(x - CW / 2, yZ - CH / 2, CW, CH), boxSizing: 'border-box', border: `1.2px solid ${RULE}`}} />
            </div>
          );
        })}
      </div>
      {/* 对齐的指示针 */}
      <div style={{...abs(638.5, yG - CH / 2 - 34, 3, 34), background: CINNABAR, opacity: 0.7}} />
      <div style={{...abs(638.5, yZ + CH / 2, 3, 34), background: CINNABAR, opacity: 0.7}} />
      {/* 停定的两格 */}
      {boxP > 0 ? (
        <>
          {[yG, yZ].map((yy) => (
            <PaperCell key={yy} x={640 - CW / 2 - 3} y={yy - CH / 2 - 3} w={CW + 6} h={CH + 6}
                       tone="cinnabar" p={boxP} r={4} fill="transparent" />
          ))}
        </>
      ) : null}
      {/* 合成结果 */}
      <CText cx={640} cy={468} size={72} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 96) / 18)} dy={-2}>{`${gan}${zhi}`}</CText>
      <InkHair cx={640} y={522} w={190} p={clamp01((n - 104) / 14)} color={CINNABAR} th={2} opacity={0.72} />
      <CText cx={640} cy={566} size={44} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 110) / 16)} dy={-2}>{course}</CText>
      {lec || title ? (
        <CText cx={640} cy={604} size={24} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 118) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ================================================================ X5 病传跳格（跳格 · 转场）
 * 六日六格，一枚小印一格一格往前跳；朱砂只跟当前那一格。只演"按日一格"这个机制，
 * 不填任何具体干支（那是正片按真实案例推的）。
 * 105 帧 / 3.5s。
 */
export const ExBingchuanHops: React.FC<ILProps & {days?: number; dir?: '顺' | '逆'}> = ({
  days = 4, dir = '顺',
}) => {
  const n = N1();
  const CW = 168, CH = 116, y = 352;
  const xs = [0, 1, 2, 3, 4, 5].map((i) => 640 + (i - 2.5) * (CW + 16));
  const hop = (i: number) => 24 + i * 20;                 // 每一次起跳的帧
  const landed = (i: number) => hop(i) + 12;
  const cur = xs.reduce((acc, _x, i) => (n >= landed(i) ? i : acc), -1);
  const hopping = xs.reduce((acc, _x, i) => (n >= hop(i) && n < landed(i) ? i : acc), -1);
  const idx = hopping >= 0 ? hopping : Math.max(0, cur);
  const t = hopping >= 0 ? (n - hop(hopping)) / 12 : 0;
  const hopY = hopping >= 0 ? -46 * Math.sin(Math.PI * t) : 0;
  return (
    <Stage>
      <CText cx={640} cy={192} size={26} weight={600} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 2, 16)}>病传 · 一日一经</CText>
      <CText cx={640} cy={232} size={20} family={FONT_KAI} color={INK_FAINT} letterSpacing={3}
             opacity={inkSpread(n - 8, 16)}>{dir === '顺' ? '男逆女顺 · 此处顺行' : '男逆女顺 · 此处逆行'}</CText>
      {xs.map((x, i) => {
        const p = clamp01((n - (6 + i * 5)) / 12);
        const isNow = i === cur || i === hopping;
        return (
          <div key={i} style={{opacity: p}}>
            <PaperCell x={x - CW / 2} y={y - CH / 2} w={CW} h={CH} tone={isNow ? 'cinnabar' : 'rule'} p={1} r={4} />
            <CText cx={x} cy={y - 18} size={19} family={FONT_KAI} color={INK_FAINT}>第</CText>
            <CText cx={x} cy={y + 4} size={40} weight={700} family={FONT_KAI_BOLD}
                   color={isNow ? CINNABAR : INK_SOFT}>{`${i + 1}`}</CText>
            <CText cx={x} cy={y + 36} size={19} family={FONT_KAI} color={INK_FAINT}>日</CText>
          </div>
        );
      })}
      {/* 跳子：一枚小印（朱砂方 + 白字），抛物线起落 */}
      {cur >= 0 || hopping >= 0 ? (
        <div style={{transform: `translate(${xs[idx]}px, ${y + hopY}px)`}}>
          <div style={{
            ...abs(-20, -20, 40, 40), boxSizing: 'border-box', background: CINNABAR, borderRadius: 4,
            border: `2px solid ${alpha('#8E3029', 0.5)}`,
            boxShadow: `0 0 0 4px ${CINNABAR_WASH}`,
          }} />
          <CText cx={0} cy={0} size={22} weight={700} family={FONT_KAI_BOLD} color={PAPER_HI} dy={-1}>
            {dir === '顺' ? '→' : '←'}
          </CText>
        </div>
      ) : null}
      <InkHair cx={640} y={y + CH / 2 + 40} w={560} p={clamp01((n - 60) / 16)} color={RULE} th={1.2} opacity={0.9} />
      <CText cx={640} cy={y + CH / 2 + 74} size={22} family={FONT_KAI} color={INK_SOFT}
             opacity={clamp01((n - 68) / 16)}>{`走到第 ${Math.max(1, cur + 1)} 日`}</CText>
    </Stage>
  );
};

/* ================================================================ X6 时辰日晷（环形 · 扇形窗）
 * 日晷的针拨到「欲解时」那三个时辰上，扇形窗亮起。欲解时是三个时辰的窗口
 * （《伤寒论》原文口径，本片不点名哪一经——那是正片按盘推的）。
 * 135 帧 / 4.5s。
 */
export const ExShichenDial: React.FC<ILProps & {win?: [string, string, string]}> = ({
  series = BASE.series, sub = BASE.sub, win = ['巳', '午', '未'], lec = '', title = '',
}) => {
  const n = N1();
  const cx = 640, cy = 356, r = 168;
  const p = easeInOutCubic(clamp01((n - 4) / 56));
  const from = -140, to = ringAngle(win[1] as Zhi) * 180 / Math.PI;    // 针自左扫到中间那个时辰
  const ang = (from + (to - from) * p) * Math.PI / 180;
  const secP = clamp01((n - 74) / 20);
  const a0 = ringAngle(win[0] as Zhi), a2 = ringAngle(win[2] as Zhi);
  const seg = (a: number, b: number, rr: number) => {
    const x0 = cx + rr * Math.cos(a), y0 = cy + rr * Math.sin(a);
    const x1 = cx + rr * Math.cos(b), y1 = cy + rr * Math.sin(b);
    return `M${x0},${y0} A${rr},${rr} 0 0 1 ${x1},${y1} L${cx},${cy} Z`;
  };
  return (
    <Stage>
      <Head series={series} sub={sub} p={n - 2} />
      <DipanRing cx={cx} cy={cy} r={r} ringP={op(n - 2, 14)} appear={() => 1} focus={null} labelSize={26} showDir={false} />
      {/* 扇形窗：三时辰的区间 */}
      {secP > 0 ? (
        <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
          <path d={seg(a0, a2, r)} fill={CINNABAR_WASH} stroke={alpha(CINNABAR, 0.55 * secP)} strokeWidth={1.6}
                opacity={secP} />
        </svg>
      ) : null}
      {/* 指针 */}
      <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <line x1={cx} y1={cy} x2={cx + (r - 22) * Math.cos(ang)} y2={cy + (r - 22) * Math.sin(ang)}
              stroke={INK} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
      </svg>
      <div style={{...abs(cx - 6, cy - 6, 12, 12), borderRadius: 6, background: CINNABAR, opacity: 0.8}} />
      <CText cx={cx} cy={cy - 42} size={30} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 88) / 16)} dy={-2}>欲解时</CText>
      <CText cx={cx} cy={cy - 8} size={20} family={FONT_KAI} color={INK_SOFT} letterSpacing={2}
             opacity={clamp01((n - 96) / 16)}>三个时辰的窗口</CText>
      <CText cx={cx} cy={cy + 30} size={26} weight={600} family={FONT_KAI_BOLD} color={CINNABAR}
             opacity={clamp01((n - 104) / 16)}>{win.join(' · ')}</CText>
      {lec || title ? (
        <CText cx={640} cy={608} size={24} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 112) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ================================================================ X7 两感相撞（相撞 · 转场）
 * 表里两条墨线相向而来，中间撞上（两感 = 两经同时受病）。
 * 90 帧 / 3.0s。
 */
export const ExTwoGanClash: React.FC<ILProps & {word?: string}> = ({word = '两感'}) => {
  const n = N1();
  const y = 356;
  const t = easeInOutCubic(clamp01((n - 4) / 34));
  const lenL = (640 - 150) * t, lenR = (640 - 150) * t;
  const hit = clamp01((n - 38) / 12);
  const ripple = clamp01((n - 38) / 24);
  return (
    <Stage>
      {/* 表 / 里 两端的标签 */}
      <CText cx={128} cy={y} size={26} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 4, 12)}>表</CText>
      <CText cx={1152} cy={y} size={26} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 4, 12)}>里</CText>
      <div style={{...abs(640 - lenL, y - 1.5, lenL, 3), background: alpha(INK, 0.85)}} />
      <div style={{...abs(640, y - 1.5, lenR, 3), background: alpha(INK, 0.85)}} />
      {/* 碰撞点：朱砂洇开 */}
      {hit > 0 ? (
        <>
          <div style={{
            ...abs(640 - 30 - 30 * ripple, y - 30 - 30 * ripple, 60 + 60 * ripple, 60 + 60 * ripple),
            borderRadius: 999, background: 'radial-gradient(circle, rgba(178,58,46,0.30) 0%, rgba(178,58,46,0.10) 46%, rgba(178,58,46,0) 72%)',
            opacity: (1 - ripple * 0.7),
          }} />
          <div style={{...abs(636, y - 4, 8, 8), borderRadius: 4, background: CINNABAR, opacity: 0.85}} />
        </>
      ) : null}
      {word ? (
        <CText cx={640} cy={y - 96} size={40} weight={700} family={FONT_KAI_BOLD} color={INK}
               opacity={inkSpread(n - 54, 16) * inkDry(n - 74, 14)}>{word}</CText>
      ) : null}
      <CText cx={640} cy={y + 96} size={20} family={FONT_KAI} color={INK_FAINT} letterSpacing={3}
             opacity={inkSpread(n - 58, 16) * inkDry(n - 78, 12)}>表里同病</CText>
    </Stage>
  );
};

/* ================================================================ X8 三丘五墓（环形 · 对宫轴）
 * 四季各一对宫：春（丘丑·墓未）/ 夏（丘辰·墓戌）/ 秋（丘未·墓丑）/ 冬（丘戌·墓辰）。
 * 数据取自 qianfa/data.ts 的 SAN_QIU_WU_MU，不另编。
 * 135 帧 / 4.5s。
 */
export const ExSanQiuWuMu: React.FC<ILProps & {word?: string}> = ({word = '三丘五墓'}) => {
  const n = N1();
  const cx = 640, cy = 356, r = 168;
  const axis = (z0: Zhi, z1: Zhi) => ({a: ringXY(z0, cx, cy, r), b: ringXY(z1, cx, cy, r)});
  const ax1 = axis('丑', '未');
  const ax2 = axis('辰', '戌');
  return (
    <Stage>
      <DipanRing cx={cx} cy={cy} r={r} ringP={op(n - 2, 14)}
                 appear={(i) => clamp01((n - (5 + 4 * i)) / 11)} focus={null} labelSize={25} showDir={false} />
      <DashLine x1={ax1.a.x} y1={ax1.a.y} x2={ax1.b.x} y2={ax1.b.y} p={clamp01((n - 58) / 20)} color={alpha(INK_FAINT, 0.9)} sw={1.5} />
      <DashLine x1={ax2.a.x} y1={ax2.a.y} x2={ax2.b.x} y2={ax2.b.y} p={clamp01((n - 78) / 20)} color={alpha(INK_FAINT, 0.9)} sw={1.5} />
      {/* 四个季节：按 SAN_QIU_WU_MU 的四季归属摆在对应轴的外侧 */}
      {SAN_QIU_WU_MU.map((s, i) => {
        const p = clamp01((n - (96 + i * 6)) / 14);
        if (p <= 0) return null;
        // 挂在**该季的「丘」支**外侧：位置由数据定，不手写坐标（手写过一次，四条里两条挂反了）
        const pos = ringXY(s.sanqiu, cx, cy, r + 62);
        return (
          <div key={s.season} style={{opacity: p}}>
            <CText cx={pos.x} cy={pos.y - 12} size={24} weight={600} family={FONT_KAI_BOLD} color={INK_SOFT}>{s.season}</CText>
            <CText cx={pos.x} cy={pos.y + 16} size={18} family={FONT_KAI} color={INK_FAINT}>
              {`丘${s.sanqiu} · 墓${s.wumu}`}
            </CText>
          </div>
        );
      })}
      <CText cx={640} cy={cy} size={34} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 88) / 16)} dy={-2}>{word}</CText>
      <CText cx={640} cy={cy + 40} size={19} family={FONT_KAI} color={INK_FAINT} letterSpacing={2}
             opacity={clamp01((n - 96) / 16)}>四季对宫</CText>
    </Stage>
  );
};

/* ================================================================ X9 十六方签（网格铺陈）
 * 十六首运气方 = 4×4 十六枚签，逐枚落墨，最后一枚被点起。
 * 150 帧 / 5.0s。
 */
export const ExSixteenTalismans: React.FC<ILProps & {pick?: number}> = ({
  course = BASE.course, series = BASE.series, sub = BASE.sub, lec = '', title = '', pick = 10,
}) => {
  const n = N1();
  const CW = 104, CH = 64, GAP = 10;
  const x0 = 640 - (CW * 4 + GAP * 3) / 2;
  const y0 = 238;
  const at = (i: number) => 6 + i * 4;
  const pAll = clamp01((n - 76) / 16);
  return (
    <Stage>
      <Head series={series} sub={sub} p={n - 2} />
      <CText cx={640} cy={196} size={24} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 2, 16)}>运气方 · 十六首</CText>
      {Array.from({length: 16}, (_, i) => {
        const r = Math.floor(i / 4), c = i % 4;
        const x = x0 + c * (CW + GAP), y = y0 + r * (CH + GAP);
        const p = inkSpread(n - at(i), 12);
        if (p <= 0) return null;
        const isPick = i === pick && n > 84;
        return (
          <div key={i} style={{opacity: p}}>
            <PaperCell x={x} y={y} w={CW} h={CH} tone={isPick ? 'cinnabar' : 'rule'} r={3} p={1} />
            <CText cx={x + CW / 2} cy={y + CH / 2} size={26} weight={isPick ? 700 : 500}
                   family={isPick ? FONT_KAI_BOLD : FONT_KAI}
                   color={isPick ? CINNABAR : alpha(INK, 0.55)}>{`${i + 1}`}</CText>
          </div>
        );
      })}
      <CText cx={640} cy={566} size={44} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 94) / 16)} dy={-2}>{course}</CText>
      {lec || title ? (
        <CText cx={640} cy={604} size={24} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 110) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
      {/* 全部落完时的一次整体呼吸（不是闪烁：只加一次，不往复） */}
      {n > 76 && n < 92 ? (
        <div style={{...abs(0, 0, 1280, 720), background: `rgba(255,253,246,${(0.10 * (1 - pAll)).toFixed(3)})`}} />
      ) : null}
    </Stage>
  );
};

/* ================================================================ X10 异文对照（对照栏）
 * 两版并排，差的那一格被圈出来。**片内不出现任何具体异文内容**——只演"两版并排、
 * 差处被圈出"这个动作，字位用墨块表示，不对任何真实文本下结论。
 * 150 帧 / 5.0s。
 */
export const ExYiwenDiff: React.FC<ILProps & {word?: string}> = ({word = '异文', course = BASE.course}) => {
  const n = N1();
  const BW = 76, BH = 76, GAP = 14;
  const cnt = 6;
  const x0 = 640 - (BW * cnt + GAP * (cnt - 1)) / 2;
  const yA = 268, yB = 396;
  const shift = clamp01((n - 56) / 26);
  const ringP = clamp01((n - 92) / 16);
  const diffIdx = 3;
  const bx = x0 + diffIdx * (BW + GAP);
  return (
    <Stage>
      <CText cx={128} cy={yA + BH / 2} size={20} family={FONT_KAI} color={INK_FAINT}>甲本</CText>
      <CText cx={128} cy={yB + BH / 2} size={20} family={FONT_KAI} color={INK_FAINT}
             opacity={shift}>乙本</CText>
      {Array.from({length: cnt}, (_, i) => (
        <PaperCell key={`a${i}`} x={x0 + i * (BW + GAP)} y={yA} w={BW} h={BH}
                   tone="rule" r={3} p={inkSpread(n - (6 + i * 5), 12)} />
      ))}
      {Array.from({length: cnt}, (_, i) => {
        const isDiff = i === diffIdx;
        const dx = isDiff ? (1 - shift) * 26 : 0;               // 只有差的那一格错位，别整行平移
        return (
          <PaperCell key={`b${i}`} x={x0 + i * (BW + GAP) + dx} y={yB} w={BW} h={BH}
                     tone={isDiff && ringP > 0.5 ? 'cinnabar' : 'ink'} r={3}
                     p={inkSpread(n - (40 + i * 5), 12)} />
        );
      })}
      {/* 字位：墨块（表示"这里有一个字"，不是字本身） */}
      {Array.from({length: cnt}, (_, i) => (
        <React.Fragment key={`m${i}`}>
          <div style={{...abs(x0 + i * (BW + GAP) + 18, yA + BH / 2 - 5, BW - 36, 10), background: alpha(INK, 0.75),
                       opacity: inkSpread(n - (6 + i * 5), 12)}} />
          <div style={{...abs(x0 + i * (BW + GAP) + (i === diffIdx ? (1 - shift) * 26 : 0) + 18, yB + BH / 2 - 5, BW - 36, 10),
                       background: alpha(INK, i === diffIdx ? 0.55 : 0.75), opacity: inkSpread(n - (40 + i * 5), 12)}} />
        </React.Fragment>
      ))}
      {ringP > 0 ? (
        <div style={{
          ...abs(bx - 8, yB - 8, BW + 16, BH + 16), boxSizing: 'border-box', borderRadius: 4,
          border: `2px solid ${CINNABAR}`, opacity: ringP,
          boxShadow: `0 0 0 4px ${CINNABAR_WASH}`,
        }} />
      ) : null}
      <CText cx={bx + BW / 2} cy={yB + BH + 44} size={26} weight={700} family={FONT_KAI_BOLD} color={CINNABAR}
             opacity={clamp01((n - 100) / 14)}>{word}</CText>
      <CText cx={640} cy={yA - 56} size={26} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 2, 16)}>两版并排，差处圈出</CText>
      <InkHair cx={640} y={yA - 26} w={420} p={clamp01((n - 8) / 16)} color={RULE} th={1.2} opacity={0.9} />
      <CText cx={640} cy={562} size={40} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 116) / 16)} dy={-2}>{course}</CText>
    </Stage>
  );
};

/* ================================================================ X11 纸背透光（氛围 · 转场）
 * 一条暖光带自下往上扫过纸面，"把纸凑到灯前"：帘纹更清楚，纸背一枚水印浮出来又退回去。
 * 75 帧 / 2.5s。
 */
export const ExBacklit: React.FC<ILProps & {word?: string}> = () => {
  const n = N1();
  const t = easeInOutCubic(clamp01((n - 4) / 54));
  const y = 780 - 900 * t;
  const vis = Math.sin(Math.PI * clamp01((n - 4) / 62));
  return (
    <Stage>
      {/* 光带 */}
      <div style={{
        ...abs(-40, y - 260, 1360, 520),
        background: `linear-gradient(0deg, rgba(255,253,246,0) 0%, rgba(255,251,236,${(0.42 * vis).toFixed(3)}) 46%, rgba(255,253,246,0) 100%)`,
      }} />
      {/* 光带经过处：帘纹更清楚（叠一层同周期横纹，只在这条带里可见） */}
      <div style={{
        ...abs(0, y - 240, 1280, 480), overflow: 'hidden',
        opacity: 0.5 * vis,
        backgroundImage: 'repeating-linear-gradient(180deg, rgba(150,132,96,0.085) 0px, rgba(150,132,96,0.085) 1px, rgba(150,132,96,0) 1px, rgba(150,132,96,0) 26px)',
      }} />
      {/* 光带核心的一道细亮边（原来这里是一枚巨大的「钤」水印 —— 用户裁定难看，去掉） */}
      <div style={{
        ...abs(-40, y - 2, 1360, 4),
        background: 'linear-gradient(90deg, rgba(255,248,232,0) 0%, rgba(255,248,232,0.55) 50%, rgba(255,248,232,0) 100%)',
        filter: 'blur(2px)', opacity: 0.6 * vis,
      }} />
    </Stage>
  );
};

/* ================================================================ X12 落子（单点 · 转场）
 * 一枚小印从空中落进十六宫盘的某一宫，宫格当场朱砂描边。最简的一种"换一宫继续"。
 * 66 帧 / 2.2s。props: stop = 落进哪一支。
 */
export const ExDayDropIn: React.FC<ILProps> = ({stop = '寅'}) => {
  const n = N1();
  const cell = 108;
  const size = cell * 4;
  const ox = 640 - size / 2, oy = 340 - size / 2;
  const pos = {巳: 0, 午: 1, 未: 2, 申: 3, 辰: 4, 酉: 7, 卯: 8, 戌: 11, 寅: 12, 丑: 13, 子: 14, 亥: 15} as Record<string, number>;
  const idx = pos[stop] ?? 12;
  const tx = ox + (idx % 4) * cell + cell / 2;
  const ty = oy + Math.floor(idx / 4) * cell + cell / 2;
  const fall = clamp01((n - 4) / 16);
  const y = ty - 220 * (1 - Math.pow(fall, 2.1));
  const k = n - 20;
  const hit = clamp01((n - 20) / 14);
  const dry = n > 44 ? inkDry(n - 44, 14) : 1;
  return (
    <Stage>
      <div style={{opacity: op(n - 2, 14) * dry}}>
        {['巳', '午', '未', '申', '辰', null, null, '酉', '卯', null, null, '戌', '寅', '丑', '子', '亥'].map((z, i) => {
          if (!z) return null;
          const x = ox + (i % 4) * cell, yy = oy + Math.floor(i / 4) * cell;
          return (
            <div key={i}>
              <div style={{...abs(x, yy, cell, cell), boxSizing: 'border-box',
                           background: i === idx ? PAPER_HI : alpha(PAPER_HI, 0.55),
                           border: `1.2px solid ${RULE}`}} />
              <CText cx={x + cell * 0.78} cy={yy + cell * 0.78} size={26} family={FONT_KAI} color={INK_FAINT}>{z}</CText>
            </div>
          );
        })}
        <div style={{...abs(ox + cell, oy + cell, cell * 2, cell * 2), boxSizing: 'border-box',
                     background: alpha(PAPER_HI, 0.85), border: `1.2px solid ${RULE}`, borderRadius: 8}} />
      </div>
      {/* 落子的宫：朱砂描边 */}
      {hit > 0 ? (
        <div style={{...abs(ox + (idx % 4) * cell, oy + Math.floor(idx / 4) * cell, cell, cell), boxSizing: 'border-box',
                     border: `${2 + 1 * hit}px solid ${CINNABAR}`, opacity: hit * dry,
                     boxShadow: `0 0 0 ${(3 + 5 * hit).toFixed(1)}px ${CINNABAR_WASH}`}} />
      ) : null}
      {/* 棋子 */}
      {fall > 0 ? (
        <div style={{transform: `translate(${tx}px, ${y + thud(k, 2.0)}px)`, opacity: op(n - 4, 8) * dry}}>
          <div style={{...abs(-24, -24, 48, 48), boxSizing: 'border-box', background: CINNABAR, borderRadius: 5,
                       border: `2px solid ${alpha('#8E3029', 0.5)}`}} />
          <CText cx={0} cy={0} size={28} weight={700} family={FONT_KAI_BOLD} color={PAPER_HI} dy={-1}>{stop}</CText>
        </div>
      ) : null}
      <CText cx={640} cy={612} size={20} family={FONT_KAI} color={INK_FAINT} letterSpacing={3}
             opacity={clamp01((n - 24) / 14) * dry}>得病日入宫</CText>
    </Stage>
  );
};
