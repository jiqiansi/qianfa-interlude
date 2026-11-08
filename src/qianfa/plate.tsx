import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CText, abs} from '../ui';
import {clamp01} from '../common';
import {FONT_KAI, FONT_KAI_BOLD, CINNABAR, INK, INK_MID, INK_SOFT, INK_FAINT, PAPER_HI} from '../shushu/paper';
import {PZ, DIPAN_POS, POS_OF, type Zhi, type Gan} from './data';

/**
 * 伤寒钤法十六宫天地盘 —— 照排盘程序 `qianfa.html` 的表盘重绘。
 *
 * 三层同格：
 *   天盘支（主字，居中，深翠 #2c6e49，最大）
 *   天盘干（左下，赭橙 #d35400）
 *   地盘支（右下，灰绿 #7a9c8a）
 * 中心 2×2 合并放三司。
 *
 * 铁律（表盘样式规范 §四）：逐宫铺盘、禁止整盘跳出；关键帧落在「标号/落字」那一下。
 * 动画由事件表驱动，事件按 `perStep` 帧均匀铺开，不靠运镜掩盖。
 */

export type Tone = 'gray' | 'cinnabar' | 'ink' | 'orange' | 'green';
const TONE_COLOR: Record<Tone, string> = {
  gray: INK_FAINT, cinnabar: CINNABAR, ink: INK, orange: PZ.tian2, green: PZ.tian1,
};

export type PanEvent = ({k: 'mark'; zhi: Zhi; text: string; tone?: Tone}      // 打序号 / 落签（朱砂定格）
  | {k: 'tz'; zhi: Zhi; gz: Zhi}                           // 铺天盘支
  | {k: 'tg'; zhi: Zhi; gz: Gan}                           // 铺天盘干
  | {k: 'dz'; zhi: Zhi}                                    // 摆地盘支（逐格落笔）
  | {k: 'focus'; zhi: Zhi}                                 // 焦点宫（朱砂描边）
  | {k: 'ring'}                                            // 环上高亮一圈（顺数用）
  | {k: 'wait'; n?: number}) & {
  /** 与口播对齐的时刻：镜头时长内的比例（0–1）。
   *  生成端按**真实词边界**算出该动作被念到的秒数再除以句长；没有词边界时才按字位估。 */
  rel?: number;
  /** 继承层标记：本镜口播并没念这一宫，它只是继续在盘上。
   *  合并场景里若有同一动作的「真念版本」，stitch() 会留那个、丢这个。 */
  carry?: boolean;
};

export interface PanProps {
  cx?: number; cy?: number; cell?: number;
  /** 事件表；按顺序以 perStep 帧铺开 */
  events?: PanEvent[];
  perStep?: number;
  /** 起笔前留白帧（默认 12） */
  lead?: number;
  /** 镜头总帧数：带 `rel` 的事件按 `lead + rel*(dur-lead)` 落在口播上 */
  dur?: number;
  /** 三司表头值 */
  sanSi?: {sitian?: Zhi; sidi?: Zhi; sinren?: Zhi; yearZhi?: Zhi; yearGan?: string};
  showHeader?: boolean;
  showLegend?: boolean;
  /** 中心格说明 */
  centerNote?: string;
  /** 地盘是否已经立好（默认 true = 直接可见） */
  standX?: number;   // 表头左
  standY?: number;
  title?: string;
}

/** 单元格几何 */
const cellRect = (cell: number, pos: number) => {
  const col = pos % 4, row = Math.floor(pos / 4);
  return {x: col * cell, y: row * cell, w: cell, h: cell};
};

/** 一块地层格子（含三层文字的容器，进度 p 控制落字）。
 *  mark 是**一叠**签：一格可以同时挂「3」计步签和「司地」名签（竖着排）。
 *  以前一格只存一枚、后写覆盖，结果司天宫挂上计步「0」就把「司天」签盖掉了。 */
const Cell: React.FC<{
  x: number; y: number; w: number; h: number;
  dipan: Zhi | null;
  tz?: Zhi; tg?: Gan;
  focus?: boolean;
  /** 定格宫的呼吸相位 0–1：读盘镜可以长到一分钟，定格宫要一直「活着」，
   *  否则整块画面就是死的（搜到的两段式做法里，这条叫「不留 dead air」）。 */
  pulse?: number;
  dipanP?: number; tzP?: number; tgP?: number;
  marks?: Array<{text: string; tone: Tone; p: number}>;
}> = ({x, y, w, h, dipan, tz, tg, focus, pulse = 0, dipanP = 1, tzP = 1, tgP = 1, marks = []}) => {
  if (!dipan) {
    // 中心 2×2：合并格由父层画，这里返回空
    return null;
  }
  const bd = focus ? CINNABAR : PZ.cell;
  const bw = focus ? 3 : 1.5;
  const bwid = Math.min(30, h * 0.30);
  return (
    <div>
      <div style={{
        ...abs(x, y, w, h), boxSizing: 'border-box',
        background: PZ.paper, border: `${bw}px solid ${bd}`,
        boxShadow: focus
          ? `0 0 0 ${(3 + 4 * pulse).toFixed(1)}px rgba(178,58,46,${(0.12 + 0.10 * pulse).toFixed(3)})`
          : undefined,
      }} />
      {/* 天盘支：主字 */}
      {tz && tzP > 0 ? (
        <CText cx={x + w / 2} cy={y + h * 0.40} size={Math.min(64, h * 0.46)} weight={700}
               family={FONT_KAI_BOLD} color={PZ.tian1}
               opacity={clamp01(tzP)} dy={-2}>{tz}</CText>
      ) : null}
      {/* 天盘干：左下 */}
      {tg && tgP > 0 ? (
        <CText cx={x + w * 0.20} cy={y + h * 0.79} size={Math.min(30, h * 0.235)} weight={600}
               family={FONT_KAI} color={PZ.tian2} opacity={clamp01(tgP)} dy={-1}>{tg}</CText>
      ) : null}
      {/* 地盘支：右下 */}
      <CText cx={x + w * 0.80} cy={y + h * 0.79} size={Math.min(30, h * 0.235)} weight={500}
             family={FONT_KAI} color={PZ.dipan} opacity={clamp01(dipanP)} dy={-1}>{dipan}</CText>
      {/* 签（自右上角往下叠） */}
      {marks.map((m, i) => (m.p > 0 ? (
        <div key={i} style={{opacity: clamp01(m.p)}}>
          <div style={{
            ...abs(x + w - bwid - 4, y + 4 + i * (bwid + 3), bwid, bwid),
            boxSizing: 'border-box', borderRadius: 6, background: PAPER_HI,
            border: `1.5px solid ${TONE_COLOR[m.tone]}`,
          }} />
          <CText cx={x + w - bwid / 2 - 4} cy={y + 4 + i * (bwid + 3) + bwid / 2}
                 size={Math.min(24, h * 0.185)} weight={700} family={FONT_KAI_BOLD}
                 color={TONE_COLOR[m.tone]} dy={-1}>{m.text}</CText>
        </div>
      ) : null))}
    </div>
  );
};

export const PanGrid: React.FC<PanProps> = ({
  cx = 640, cy = 400, cell = 118,
  events = [], perStep = 20, lead = 12, dur = 0,
  sanSi, showHeader = true, showLegend = true, centerNote,
}) => {
  const n = useCurrentFrame() + 1;
  const size = cell * 4;
  const ox = cx - size / 2;
  const oy = cy - size / 2;

  // ---- 事件展开 ----
  const state = {
    tz: {} as Partial<Record<Zhi, Zhi>>, tg: {} as Partial<Record<Zhi, Gan>>,
    marks: {} as Partial<Record<Zhi, Array<{text: string; tone: Tone; at: number}>>>,
    focus: null as Zhi | null,
  };
  let k = lead;
  const sched = events.map((e) => {
    const step = e.k === 'wait' ? (e.n ?? 12) : perStep;
    // 带 rel 的事件直接钉在口播对应字位；其余按 perStep 顺序铺开。
    // rel 现在是**按真实词边界算的语音内比例**（见 make_lecture.py 的 RelTimer），
    // 而镜头的帧区间就等于该句修剪后的音频区间，所以直接 `rel × dur`，不要再加 lead
    // 去压缩一遍——那会整体晚 0.4s 且越靠后越偏。
    const at = e.rel != null && dur > 0 ? e.rel * dur : k;
    k = Math.max(k + step, at + step);
    return {e, at, dur: step};
  });
  const pAt = (at: number, len = 12) => {
    if (n < at) return 0;
    return Math.min(1, (n - at + 1) / len);
  };
  const hasDz = sched.some((s) => s.e.k === 'dz');
  const dzAt = (z: Zhi) => {
    for (const s of sched) if (s.e.k === 'dz' && (s.e as {zhi: Zhi}).zhi === z) return s.at;
    return -1;
  };
  for (const {e, at} of sched) {
    const p = pAt(at);
    if (p <= 0) continue;
    if (e.k === 'tz') state.tz[e.zhi] = e.gz;
    else if (e.k === 'tg') state.tg[e.zhi] = e.gz;
    else if (e.k === 'mark') {
      const arr = state.marks[e.zhi] ?? (state.marks[e.zhi] = []);
      if (!arr.some((m) => m.text === e.text)) {          // 同格同签只挂一次，不倒序
        arr.push({text: e.text, tone: e.tone ?? 'cinnabar', at});
      }
    } else if (e.k === 'focus') state.focus = e.zhi;
  }
  // ---- 各层各自的落位时刻 ----
  // **不要**用一个共享的「本宫最近事件」去门控三层（支/干/签）。踩过的坑：
  // 铺干镜里巳宫先落支、后落干，共享门控取「最后一次」→ 整格被压到铺干那一刻，
  // 前半段连天盘支都看不见（观众反馈「天盘支消失」）。
  // 合并场景里同一宫会在多个子镜头各出现一次（内容相同），取**最早**一次即可：
  // 取最后一次会把进度门控到场景很靠后，实测表现为整盘空白。
  const layerAt = (z: Zhi, k: 'tz' | 'tg' | 'mark') => {
    let at = -1;
    for (const s of sched) {
      if (s.e.k === k && (s.e as {zhi: Zhi}).zhi === z) at = at < 0 ? s.at : Math.min(at, s.at);
    }
    return at;
  };
  // 三司表头的值只在**那一项的签落下来**时才亮：司天等「司天」签，司人等「司人」签。
  // 以前按「本宫有没有签」判——辰宫先落了计步签「2」，表头就把司人提前亮出来了。
  const roleAt = (z: Zhi | undefined, role: string) => {
    if (!z) return -1;
    const arr = (state.marks[z] ?? []).filter((m) => m.text === role);
    return arr.length ? Math.max(...arr.map((m) => m.at)) : -1;
  };
  const roleP = (z: Zhi | undefined, role: string) => {
    const t = roleAt(z, role);
    return t < 0 ? 0 : pAt(t, 8);
  };

  const headerH = cell * 0.62;
  const legendH = 30;
  const topY = showHeader ? oy - headerH - 16 : oy;
  const legendY = oy + size + 12;

  return (
    <div>
      {/* 三司表头 */}
      {showHeader && sanSi ? (
        <SanSiHeader x={ox} y={topY} w={size} h={headerH}
                     sitian={sanSi.sitian} sidi={sanSi.sidi} sinren={sanSi.sinren}
                     yearZhi={sanSi.yearZhi} yearGan={sanSi.yearGan}
                     ps={[roleP(sanSi.sitian, '司天'), roleP(sanSi.sidi, '司地'),
                          roleP(sanSi.sinren, '司人')]} />
      ) : null}

      {/* 格子 */}
      {DIPAN_POS.map((z, pos) => {
        if (!z) return null;
        const r = cellRect(cell, pos);
        const x = ox + r.x, y = oy + r.y;
        // 三层各按自己的落位时刻亮：支用支的时刻，干用干的时刻。
        const tzAt = layerAt(z, 'tz'), tgAt = layerAt(z, 'tg');
        const tzP = tzAt < 0 ? 1 : pAt(tzAt, 10);
        const tgP = tgAt < 0 ? 1 : pAt(tgAt, 10);
        return (
          <Cell key={pos} x={x} y={y} w={cell} h={cell} dipan={z}
                tz={state.tz[z]} tg={state.tg[z]}
                focus={state.focus === z}
                pulse={0.5 - 0.5 * Math.cos(2 * Math.PI * n / 72)}
                tzP={state.tz[z] ? tzP : 0}
                tgP={state.tg[z] ? tgP : 0}
                dipanP={hasDz ? (dzAt(z) < 0 ? 0 : pAt(dzAt(z), 12)) : 1}
                marks={(state.marks[z] ?? []).map((m) => ({text: m.text, tone: m.tone, p: pAt(m.at, 10)}))} />
        );
      })}

      {/* 中心 2×2 合并格 */}
      <div style={{
        ...abs(ox + cell, oy + cell, cell * 2, cell * 2), boxSizing: 'border-box',
        background: PZ.center, border: `1.5px solid ${PZ.cell}`, borderRadius: 12,
        boxShadow: '0 5px 15px rgba(0,0,0,.05)',
      }} />
      <CText cx={cx} cy={oy + cell * 2 - cell * 0.42} size={cell * 0.185} weight={700}
             family={FONT_KAI_BOLD} color={PZ.ink3} dy={-2}>十六宫天地盘</CText>
      {sanSi?.yearZhi ? (
        <CText cx={cx} cy={oy + cell * 2 + cell * 0.10} size={cell * 0.26} weight={700}
               family={FONT_KAI_BOLD} color={PZ.ink} dy={-2}>
          {`年命${sanSi.yearGan ?? ''}${sanSi.yearZhi}`}
        </CText>
      ) : null}
      <CText cx={cx} cy={oy + cell * 2 + cell * 0.62} size={cell * 0.17} weight={600}
             family={FONT_KAI} color={PZ.ink3} dy={-1}>
        {centerNote ?? '上南下北 · 左东右西'}
      </CText>

      {/* 图例 */}
      {showLegend ? <PanLegend cx={cx} y={legendY} /> : null}
    </div>
  );
};

/** 三司表头：司天 / 司地 / 司人（+ 年命）。 */
export const SanSiHeader: React.FC<{
  x: number; y: number; w: number; h: number;
  sitian?: Zhi; sidi?: Zhi; sinren?: Zhi; yearZhi?: Zhi; yearGan?: string;
  /** 三项各自的「已定」进度（0–1）。缺省时按镜头局部帧错峰淡入。
   *  传了它，表头就与盘上落签同拍——定司天那一镜表头只亮司天，司地/司人还压着。 */
  ps?: number[];
}> = ({x, y, w, h, sitian, sidi, sinren, yearZhi, yearGan, ps}) => {
  const n = useCurrentFrame() + 1;
  const items = [
    {t: '司天', v: sitian ?? '—'},
    {t: '司地', v: sidi ?? '—'},
    {t: '司人', v: sinren ?? '—'},
  ];
  if (yearZhi) items.push({t: '年命', v: `${yearGan ?? ''}${yearZhi}`});
  const gap = 10;
  const cw = (w - gap * (items.length - 1)) / items.length;
  return (
    <div>
      {items.map((it, i) => {
        const shell = clamp01((n - (6 + i * 8)) / 10);         // 底板按序淡入
        const val = ps && i < 3 ? clamp01(ps[i]) : shell;      // 值（司天/司地/司人）等落签
        const bx = x + i * (cw + gap);
        return (
          <div key={it.t} style={{opacity: shell}}>
            <div style={{
              ...abs(bx, y, cw, h), boxSizing: 'border-box', borderRadius: 10,
              background: PZ.head, border: `1.5px solid ${PZ.border}`,
              boxShadow: '0 5px 15px rgba(0,0,0,.05)',
            }} />
            <CText cx={bx + cw / 2} cy={y + h * 0.28} size={Math.min(24, h * 0.26)} weight={600}
                   family={FONT_KAI} color={PZ.ink3} dy={-1}>{it.t}</CText>
            <CText cx={bx + cw / 2} cy={y + h * 0.68} size={Math.min(52, h * 0.50)} weight={700}
                   family={FONT_KAI_BOLD} color={PZ.ink} opacity={val} dy={-2}>{it.v}</CText>
          </div>
        );
      })}
    </div>
  );
};

/** 图例：天盘地支 / 天盘天干 / 地盘。 */
export const PanLegend: React.FC<{cx: number; y: number}> = ({cx, y}) => {
  const items = [
    {c: PZ.tian1, t: '天盘地支'},
    {c: PZ.tian2, t: '天盘天干'},
    {c: PZ.dipan, t: '地盘'},
  ];
  const total = 3 * 190;
  const startX = cx - total / 2;
  return (
    <div>
      {items.map((it, i) => {
        const x = startX + i * 190;
        return (
          <React.Fragment key={it.t}>
            <div style={{...abs(x, y + 7, 20, 16), boxSizing: 'border-box',
              background: it.c, border: `1.5px solid ${it.c}`, borderRadius: 3}} />
            <CText cx={x + 20 + 8 + it.t.length * 11} cy={y + 15} size={21} weight={600}
                   family={FONT_KAI} color={INK_SOFT} dy={-1}>{it.t}</CText>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** 单宫放大镜：把某一宫的天地人三值放大成一张卡（读盘取号时用）。 */
export const PalaceZoom: React.FC<{
  cx: number; cy: number; w?: number; title?: string;
  dipan: Zhi; tz?: Zhi; tg?: Gan;
  rows?: {label: string; value: string; tone?: Tone}[];
  highlightIndex?: number;
  N?: number; f0?: number;
}> = ({cx, cy, w = 330, dipan, tz, tg, rows = [], highlightIndex = -1, N = 1, f0 = 1}) => {
  const n = N - f0;
  if (n < 0) return null;
  const h = 150 + rows.length * 54;
  const x = cx - w / 2, y = cy - h / 2;
  return (
    <div>
      <div style={{
        ...abs(x, y, w, h), boxSizing: 'border-box', borderRadius: 14, background: PAPER_HI,
        border: `2.5px solid ${CINNABAR}`, boxShadow: '0 6px 18px rgba(0,0,0,.08)',
      }} />
      <CText cx={cx} cy={y + 34} size={26} weight={700} family={FONT_KAI_BOLD}
             color={CINNABAR} dy={-2}>{`地盘「${dipan}」宫`}</CText>
      <div style={{...abs(x + 26, y + 66, w - 52, 1), background: PZ.border}} />
      {rows.map((r, i) => {
        const p = clamp01((n - (10 + i * 10)) / 10);
        const hot = i === highlightIndex;
        return (
          <div key={r.label} style={{opacity: p}}>
            <CText cx={x + 26} cy={y + 106 + i * 54} size={24} weight={600} family={FONT_KAI}
                   color={INK_SOFT} dy={-1}>{r.label}</CText>
            <CText cx={x + w - 26} cy={y + 106 + i * 54} size={34} weight={700} family={FONT_KAI_BOLD}
                   color={hot ? CINNABAR : (r.tone ? TONE_COLOR[r.tone] : PZ.ink)} dy={-2}>{r.value}</CText>
          </div>
        );
      })}
      {tz === undefined && tg === undefined ? null : null}
    </div>
  );
};
