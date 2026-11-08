import React from 'react';
import {CText, abs} from '../ui';
import {
  Stage, N1, op, thud, InkHair, VText, SealStamp, DipanRing, CenterPin, TitleBlock,
  inkSpread, inkDry, clamp01, easeOutCubic,
} from './kit';
import {DirBlur} from '../common/lib';
import {PanGrid, type PanEvent} from '../qianfa/plate';
import {JIAZI, ZHI, PZ, type Zhi} from '../qianfa/data';
import {
  INK, INK_MID, INK_SOFT, INK_FAINT, RULE, CINNABAR,
  FONT_KAI, FONT_KAI_BOLD, FONT_NUM,
} from '../shushu/paper';

/**
 * 通用片头 ×4 —— 不带任何一期的具体内容，靠 `lec / title` 两个可选参数
 * 才变成「第 N 讲」的片头；不传就是纯系列开场。
 */
export type ILProps = {
  /** 课程名。印面 / 题名用。 */
  course?: string;
  /** 频道名（角标行）。 */
  series?: string;
  /** 频道副题（角标行后半）。 */
  sub?: string;
  /** 一句话钩子。 */
  tagline?: string;
  /** 讲次号，如「第 7 讲」。留空则不出这一行。 */
  lec?: string;
  /** 讲次名，如「七步起盘」。留空则不出这一行。 */
  title?: string;
  /** 转场里要露出的短词。 */
  word?: string;
  /** 滚轮停下的那个干支。 */
  stop?: string;
};

export const IL_DEFAULTS: Required<Pick<ILProps, 'course' | 'series' | 'sub'>> =
  {course: '伤寒钤法', series: '清源勘道', sub: '术数精讲'};

const LessonLine: React.FC<{lec?: string; title?: string; y: number; p: number; size?: number}> = ({lec, title, y, p, size = 30}) => {
  const text = [lec, title].filter(Boolean).join(' · ');
  if (!text) return null;
  return (
    <>
      <InkHair cx={640} y={y - 30} w={360} p={p} color={RULE} th={1.2} opacity={0.9} />
      <CText cx={640} cy={y} size={size} weight={600} family={FONT_KAI} color={INK_MID}
             opacity={op(p, 12)} dy={-1}>{text}</CText>
    </>
  );
};

/* ------------------------------------------------------------------ 片头 1 · 落印
 * 「钤」在本课里就是这枚印：印一落，盘就定了。
 * 6.0s / 180 帧。末段 76 帧静置 —— 配音说起场白时画面不动，不抢字。
 * ------------------------------------------------------------------ */
export const OpenerSeal: React.FC<ILProps & {sealText?: string}> = ({
  course = IL_DEFAULTS.course, series = IL_DEFAULTS.series, sub = IL_DEFAULTS.sub,
  tagline = '不望闻问切，只要得病日期', lec = '', title = '', sealText = '钤法',
}) => {
  const n = N1();
  const fall = clamp01((n - 2) / 18);                 // f2–f20 下落（加速）
  const k = n - 20;                                   // 触纸后帧数
  const press = clamp01((n - 24) / 30);               // f24–f54 印文逐字吃进纸
  const seep = clamp01((n - 20) / 16);                // f20–f36 朱砂晕
  const dy = fall < 1 ? -152 * (1 - Math.pow(fall, 2)) : thud(k, 2.6);
  const R = 62 + 190 * easeOutCubic(seep);
  return (
    <Stage>
      {/* 印泥洇开：触纸那一下的一次性扩散 */}
      {seep > 0 && seep < 1 ? (
        <div style={{
          ...abs(640 - R, 286 - R, R * 2, R * 2), borderRadius: R,
          background: 'radial-gradient(circle, rgba(178,58,46,0.13) 0%, rgba(178,58,46,0.05) 52%, rgba(178,58,46,0) 72%)',
          opacity: 1 - seep * 0.85,
        }} />
      ) : null}
      <SealStamp cx={640} cy={286} size={226} chars={sealText} fall={fall} press={press} dy={dy} />
      {/* 印下题名（印文按印章读序读，题名在这里把课名说全，避免读反） */}
      <CText cx={640} cy={452} size={46} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={inkSpread(n - 46, 16)} dy={-2}>{course}</CText>
      <InkHair cx={640} y={494} w={300} p={clamp01((n - 54) / 16)} color={CINNABAR} th={2} opacity={0.72} />
      <CText cx={640} cy={538} size={27} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 60, 16)} dy={-1}>{tagline}</CText>
      <CText cx={640} cy={132} size={21} family={FONT_KAI} color={INK_FAINT} letterSpacing={6}
             opacity={inkSpread(n - 66, 16)}>{`${series} · ${sub}`}</CText>
      {lec || title ? (
        <CText cx={640} cy={592} size={27} weight={600} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 78) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ 片头 2 · 定盘
 * 地盘立好 → 得病日支落宫 → 顺数三宫 → 三司出签。
 * 这是这门课的骨架本身：不问症状，只问得病日。5.5s / 165 帧。
 * ------------------------------------------------------------------ */
const RING_FROM_ZI: Zhi[] = ZHI as unknown as Zhi[];   // 子宫起、按环序扫一圈 = 地支序
export const OPENER_SANSI_EVENTS: PanEvent[] = (() => {
  const ev: PanEvent[] = [];
  RING_FROM_ZI.forEach((z, i) => ev.push({k: 'dz', zhi: z, rel: (6 + 6 * i) / 165}));
  ev.push({k: 'focus', zhi: '寅', rel: 78 / 165});
  ev.push({k: 'mark', zhi: '寅', text: '司天', tone: 'cinnabar', rel: 84 / 165});
  ev.push({k: 'focus', zhi: '卯', rel: 92 / 165});
  ev.push({k: 'mark', zhi: '卯', text: '1', tone: 'gray', rel: 94 / 165});
  ev.push({k: 'focus', zhi: '辰', rel: 100 / 165});
  ev.push({k: 'mark', zhi: '辰', text: '2', tone: 'gray', rel: 102 / 165});
  ev.push({k: 'focus', zhi: '巳', rel: 108 / 165});
  ev.push({k: 'mark', zhi: '巳', text: '3', tone: 'cinnabar', rel: 110 / 165});
  ev.push({k: 'mark', zhi: '巳', text: '司地', tone: 'cinnabar', rel: 116 / 165});
  ev.push({k: 'mark', zhi: '辰', text: '司人', tone: 'ink', rel: 122 / 165});
  ev.push({k: 'focus', zhi: '寅', rel: 132 / 165});      // 收在得病日宫
  return ev;
})();

export const OpenerSanSi: React.FC<ILProps> = ({
  course = IL_DEFAULTS.course, series = IL_DEFAULTS.series, sub = IL_DEFAULTS.sub, lec = '', title = '',
}) => {
  const n = N1();
  const cp = clamp01((n - 128) / 16);
  const cell = 112;
  const size = cell * 4;
  const ox = 640 - size / 2, oy = 352 - size / 2;
  return (
    <Stage>
      <PanGrid cx={640} cy={352} cell={cell} dur={165} perStep={6}
               events={OPENER_SANSI_EVENTS}
               sanSi={{sitian: '寅', sidi: '巳', sinren: '辰'}}
               showHeader showLegend
               centerNote="上南下北 · 左东右西" />
      {/* 中宫换成课程题名（盘里原本写的是图元名，片头要写课名） */}
      {cp > 0 ? (
        <>
          <div style={{
            ...abs(ox + cell, oy + cell, cell * 2, cell * 2), boxSizing: 'border-box',
            background: PZ.center, border: `1.5px solid ${PZ.cell}`, borderRadius: 12,
            opacity: cp, boxShadow: '0 5px 15px rgba(0,0,0,.05)',
          }} />
          <CText cx={640} cy={352 - 22} size={44} weight={700} family={FONT_KAI_BOLD}
                 color={INK} opacity={cp} dy={-2}>{course}</CText>
          <InkHair cx={640} y={352 + 12} w={150} p={clamp01((n - 136) / 14)} color={CINNABAR} th={1.8} opacity={0.7} />
          <CText cx={640} cy={352 + 40} size={19} family={FONT_KAI} color={INK_FAINT} letterSpacing={3}
                 opacity={cp}>{`${series} · ${sub}`}</CText>
          {lec || title ? (
            <CText cx={640} cy={352 + 76} size={24} weight={600} family={FONT_KAI} color={INK_MID}
                   opacity={clamp01((n - 144) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
          ) : null}
        </>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ 片头 3 · 得病日
 * 干支滚轮减速停在某一天：一切从得病那一天起。
 * 快滚段用方向模糊（不是闪白）——滚动是位移，不是明暗交替，不触犯闪烁禁令。
 * 4.5s / 135 帧。
 * ------------------------------------------------------------------ */
export const OpenerDayRoller: React.FC<ILProps> = ({
  course = IL_DEFAULTS.course, series = IL_DEFAULTS.series, sub = IL_DEFAULTS.sub,
  tagline = '得病日一定，盘就定了', lec = '', title = '', stop = '甲寅',
}) => {
  const n = N1();
  const W = 380, H = 140;
  const cx = 640, cy = 296;
  const idx = Math.max(0, JIAZI.indexOf(stop));
  const roll = clamp01((n - 1) / 60);                    // f1–f61 减速停下
  const e = easeOutCubic(roll);
  const off = (idx - 6) + 6 * e;                          // 窗口里滚过的干支
  const blur = 10 * Math.pow(1 - roll, 2.4);              // 快滚段的运动模糊
  const k = n - 62;
  const th = thud(k, 1.9);
  const frameP = clamp01((n - 68) / 24);
  // ⚠ 窗口是 overflow:hidden 的裁切容器，里面的坐标必须**相对窗口**，
  //   直接写画布坐标会被裁掉（踩过：干支整段消失，只剩一个空窗框）。
  const localC = H / 2 + 2;
  const items: Array<{g: string; rel: number}> = [];
  for (let i = -1; i <= 1; i++) {
    const gi = ((idx - 6 + 6 + i) % 60 + 60) % 60;
    items.push({g: JIAZI[gi], rel: i});
  }
  return (
    <Stage>
      <CText cx={640} cy={160} size={21} family={FONT_KAI} color={INK_FAINT} letterSpacing={6}
             opacity={inkSpread(n - 8, 16)}>{`${series} · ${sub}`}</CText>
      {/* 界格线（窗口上下缘），先立 */}
      <InkHair cx={cx} y={cy - H / 2} w={W} p={clamp01((n - 2) / 12)} color={RULE} th={1.2} />
      <InkHair cx={cx} y={cy + H / 2} w={W} p={clamp01((n - 2) / 12)} color={RULE} th={1.2} />
      {/* 滚轮 */}
      <DirBlur bx={0} by={blur}>
        <div style={{...abs(cx - W / 2, cy - H / 2 - 2, W, H), overflow: 'hidden'}}>
          {items.map((it, i) => {
            const settled = roll >= 1 && it.rel === 0;      // 只在停定后放大，滚动中不逐字跳字号
            return (
              <CText key={i} cx={W / 2} cy={localC + it.rel * H + th} size={settled ? 88 : 76}
                     weight={settled ? 700 : 500} family={FONT_NUM}
                     color={settled ? INK : INK_FAINT} opacity={settled ? 1 : 0.5}>{it.g}</CText>
            );
          })}
        </div>
      </DirBlur>
      {/* 停定后朱砂框落位（横线先、竖线后） */}
      <InkHair cx={cx} y={cy - H / 2} w={W} p={frameP} color={CINNABAR} th={2} opacity={0.85} />
      <InkHair cx={cx} y={cy + H / 2} w={W} p={frameP} color={CINNABAR} th={2} opacity={0.85} />
      {frameP > 0.55 ? (
        <>
          <div style={{...abs(cx - W / 2, cy - H / 2, 2, H * (frameP - 0.55) / 0.45), background: CINNABAR, opacity: 0.85}} />
          <div style={{...abs(cx + W / 2 - 2, cy - H / 2, 2, H * (frameP - 0.55) / 0.45), background: CINNABAR, opacity: 0.85}} />
        </>
      ) : null}
      <VText cx={cx + W / 2 + 34} y={cy - 34} text="得病日" size={22} gap={9} color={INK_SOFT}
             p={clamp01((n - 80) / 16)} />
      <TitleBlock cx={640} cy={486} course={course} tagline={tagline}
                  p={clamp01((n - 88) / 16)} size={46}
                  lineP={clamp01((n - 96) / 14)} tagP={clamp01((n - 104) / 14)} />
      {lec || title ? (
        <CText cx={640} cy={594} size={26} weight={600} family={FONT_KAI} color={INK_MID}
               opacity={clamp01((n - 112) / 14)}>{[lec, title].filter(Boolean).join(' · ')}</CText>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ 片头 4 · 题名
 * 最沉静的一支：界格线展开 → 四字逐字落墨 → 朱砂题签线 → 钩子。
 * 与现有 21 期片头血缘最近（都是「落墨 + 朱砂短线」），要连续感就用它。
 * 4.0s / 120 帧。
 * ------------------------------------------------------------------ */
export const OpenerTitle: React.FC<ILProps> = ({
  course = IL_DEFAULTS.course, series = IL_DEFAULTS.series, sub = IL_DEFAULTS.sub,
  tagline = '不望闻问切，只要得病日期', lec = '', title = '',
}) => {
  const n = N1();
  const chars = [...course];
  const step = 98;
  const fs = chars.length >= 6 ? 72 : 86;
  return (
    <Stage>
      <InkHair cx={640} y={250} w={560} p={clamp01((n - 1) / 20)} color={RULE} th={1.2} opacity={0.9} />
      <CText cx={640} cy={182} size={21} family={FONT_KAI} color={INK_FAINT} letterSpacing={6}
             opacity={inkSpread(n - 50, 16)}>{`${series} · ${sub}`}</CText>
      {chars.map((c, i) => {
        const p = inkSpread(n - (12 + i * 11), 16);
        if (p <= 0) return null;
        const x = 640 + (i - (chars.length - 1) / 2) * step;
        return (
          <CText key={i} cx={x} cy={326} size={fs * (1.05 - 0.05 * p)} weight={700} family={FONT_KAI_BOLD}
                 color={INK} opacity={p}>{c}</CText>
        );
      })}
      <InkHair cx={640} y={392} w={200} p={clamp01((n - 64) / 16)} color={CINNABAR} th={2} opacity={0.72} />
      <CText cx={640} cy={438} size={26} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 72, 16)}>{tagline}</CText>
      <LessonLine lec={lec} title={title} y={530} p={clamp01((n - 88) / 14)} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ 片头 5 · 地支环（备选）
 * 环 + 一枚焦点支 + 题名。用于「时间/方位」气质更强的一期，或作为短版片头（3.5s）。
 * ------------------------------------------------------------------ */
export const OpenerRing: React.FC<ILProps> = ({
  course = IL_DEFAULTS.course, series = IL_DEFAULTS.series, sub = IL_DEFAULTS.sub,
  tagline = '不望闻问切，只要得病日期', stop = '寅',
}) => {
  const n = N1();
  return (
    <Stage>
      <DipanRing cx={640} cy={352} r={170} ringP={op(n - 2, 14)}
                 appear={(i) => clamp01((n - (6 + 3.4 * i)) / 12)}
                 focus={n > 56 ? (stop as Zhi) : null} labelSize={27} showDir={false} />
      <CenterPin cx={640} cy={352} p={clamp01((n - 6) / 12)} />
      <CText cx={640} cy={340} size={40} weight={700} family={FONT_KAI_BOLD} color={INK}
             opacity={clamp01((n - 62) / 16)} dy={-2}>{course}</CText>
      <InkHair cx={640} y={368} w={140} p={clamp01((n - 70) / 14)} color={CINNABAR} th={1.8} opacity={0.7} />
      <CText cx={640} cy={402} size={22} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 76, 14)}>得病日</CText>
      <CText cx={640} cy={104} size={19} family={FONT_KAI} color={INK_FAINT} letterSpacing={6}
             opacity={inkSpread(n - 10, 16)}>{`${series} · ${sub}`}</CText>
      <CText cx={640} cy={606} size={24} family={FONT_KAI} color={INK_SOFT}
             opacity={inkSpread(n - 84, 16)}>{tagline}</CText>
    </Stage>
  );
};
