import React from 'react';
import {Freeze} from 'remotion';
import {FontsOnce} from './kit';
import {PaperBg} from '../shushu/paperbg';
import {INK, INK_FAINT, PAPER, RULE, FONT_KAI} from '../shushu/paper';
import {
  ExDuiGongJing, ExSevenSteps, ExJiaziScroll, ExGanzhiGears, ExBingchuanHops, ExShichenDial,
  ExTwoGanClash, ExSanQiuWuMu, ExSixteenTalismans, ExYiwenDiff, ExBacklit, ExDayDropIn,
} from './extra';

/**
 * 接触印相（实验组）—— 12 支 × 4 关键帧，一次渲染出齐。
 * ⚠ Composition 的 durationInFrames 必须 ≥ 最大关键帧，否则 <Freeze> 会被裁到第 0 帧（40 格空纸）。
 */
type Cell = {label: string; Comp: React.FC<Record<string, never>>; f: number};

const CELLS: Cell[] = [
  {label:'X1 对宫定经', Comp: ExDuiGongJing, f: 20},
  {label:'X1 对宫定经', Comp: ExDuiGongJing, f: 70},
  {label:'X1 对宫定经', Comp: ExDuiGongJing, f: 100},
  {label:'X1 对宫定经', Comp: ExDuiGongJing, f: 140},
  {label:'X2 七步目录', Comp: ExSevenSteps, f: 20},
  {label:'X2 七步目录', Comp: ExSevenSteps, f: 60},
  {label:'X2 七步目录', Comp: ExSevenSteps, f: 110},
  {label:'X2 七步目录', Comp: ExSevenSteps, f: 165},
  {label:'X3 甲子长卷', Comp: ExJiaziScroll, f: 20},
  {label:'X3 甲子长卷', Comp: ExJiaziScroll, f: 50},
  {label:'X3 甲子长卷', Comp: ExJiaziScroll, f: 84},
  {label:'X3 甲子长卷', Comp: ExJiaziScroll, f: 125},
  {label:'X4 干支咬合', Comp: ExGanzhiGears, f: 20},
  {label:'X4 干支咬合', Comp: ExGanzhiGears, f: 60},
  {label:'X4 干支咬合', Comp: ExGanzhiGears, f: 96},
  {label:'X4 干支咬合', Comp: ExGanzhiGears, f: 155},
  {label:'X5 病传跳格', Comp: ExBingchuanHops, f: 14},
  {label:'X5 病传跳格', Comp: ExBingchuanHops, f: 40},
  {label:'X5 病传跳格', Comp: ExBingchuanHops, f: 66},
  {label:'X5 病传跳格', Comp: ExBingchuanHops, f: 96},
  {label:'X6 时辰日晷', Comp: ExShichenDial, f: 20},
  {label:'X6 时辰日晷', Comp: ExShichenDial, f: 60},
  {label:'X6 时辰日晷', Comp: ExShichenDial, f: 90},
  {label:'X6 时辰日晷', Comp: ExShichenDial, f: 125},
  {label:'X7 两感相撞', Comp: ExTwoGanClash, f: 20},
  {label:'X7 两感相撞', Comp: ExTwoGanClash, f: 42},
  {label:'X7 两感相撞', Comp: ExTwoGanClash, f: 58},
  {label:'X7 两感相撞', Comp: ExTwoGanClash, f: 80},
  {label:'X8 三丘五墓', Comp: ExSanQiuWuMu, f: 20},
  {label:'X8 三丘五墓', Comp: ExSanQiuWuMu, f: 70},
  {label:'X8 三丘五墓', Comp: ExSanQiuWuMu, f: 100},
  {label:'X8 三丘五墓', Comp: ExSanQiuWuMu, f: 125},
  {label:'X9 十六方签', Comp: ExSixteenTalismans, f: 30},
  {label:'X9 十六方签', Comp: ExSixteenTalismans, f: 70},
  {label:'X9 十六方签', Comp: ExSixteenTalismans, f: 92},
  {label:'X9 十六方签', Comp: ExSixteenTalismans, f: 140},
  {label:'X10 异文对照', Comp: ExYiwenDiff, f: 30},
  {label:'X10 异文对照', Comp: ExYiwenDiff, f: 60},
  {label:'X10 异文对照', Comp: ExYiwenDiff, f: 100},
  {label:'X10 异文对照', Comp: ExYiwenDiff, f: 140},
  {label:'X11 纸背透光', Comp: ExBacklit, f: 10},
  {label:'X11 纸背透光', Comp: ExBacklit, f: 26},
  {label:'X11 纸背透光', Comp: ExBacklit, f: 40},
  {label:'X11 纸背透光', Comp: ExBacklit, f: 60},
  {label:'X12 落子', Comp: ExDayDropIn, f: 10},
  {label:'X12 落子', Comp: ExDayDropIn, f: 20},
  {label:'X12 落子', Comp: ExDayDropIn, f: 26},
  {label:'X12 落子', Comp: ExDayDropIn, f: 56},
];

const COLS = 4;
const CW = 320, CH = 180;
export const ILE_W = COLS * CW;
export const ILE_H = Math.ceil(CELLS.length / COLS) * CH;

const CellBox: React.FC<{c: Cell; i: number}> = ({c, i}) => (
  <div style={{
    position: 'absolute', left: (i % COLS) * CW, top: Math.floor(i / COLS) * CH,
    width: CW, height: CH, overflow: 'hidden', background: PAPER,
    borderRight: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`,
  }}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transform: `scale(${CW / 1280})`, transformOrigin: '0 0'}}>
      <Freeze frame={c.f}>
        <PaperBg />
        <c.Comp />
      </Freeze>
    </div>
    <div style={{
      position: 'absolute', left: 6, bottom: 2, fontFamily: FONT_KAI, fontSize: 15,
      color: INK_FAINT, background: 'rgba(246,240,223,0.86)', padding: '1px 6px', borderRadius: 3,
    }}>{`${c.label}  f${c.f}`}</div>
    <div style={{position: 'absolute', right: 6, top: 3, fontFamily: FONT_KAI, fontSize: 14, color: INK_FAINT}}>{i + 1}</div>
  </div>
);

export const ILESheet: React.FC = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: ILE_W, height: ILE_H, background: PAPER}}>
    <FontsOnce>
      {CELLS.map((c, i) => <CellBox key={i} c={c} i={i} />)}
    </FontsOnce>
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, color: INK}} />
  </div>
);
