import React from 'react';
import {Freeze} from 'remotion';
import {FontsOnce} from './kit';
import {PaperBg} from '../shushu/paperbg';
import {INK, INK_FAINT, PAPER, RULE, FONT_KAI} from '../shushu/paper';
import {OpenerSeal, OpenerSanSi, OpenerDayRoller, OpenerTitle, OpenerRing} from './openers';
import {TransSignDrop, TransScan, TransRingTurn, TransInkBlot, TransGridClose} from './transitions';

/**
 * 接触印相 —— 一次渲染出全部片头/转场的关键帧，用于目视 QC。
 * 逐帧 `remotion still` 是每帧一次 Chromium 冷启动，几十帧会把机器吃满（skill 里被叫停过一次）。
 */
type Cell = {label: string; Comp: React.FC<Record<string, never>>; f: number};

const CELLS: Cell[] = [
  {label: '片头1 落印', Comp: OpenerSeal, f: 12},
  {label: '片头1 落印', Comp: OpenerSeal, f: 22},
  {label: '片头1 落印', Comp: OpenerSeal, f: 40},
  {label: '片头1 落印', Comp: OpenerSeal, f: 140},
  {label: '片头2 定盘', Comp: OpenerSanSi, f: 34},
  {label: '片头2 定盘', Comp: OpenerSanSi, f: 88},
  {label: '片头2 定盘', Comp: OpenerSanSi, f: 122},
  {label: '片头2 定盘', Comp: OpenerSanSi, f: 160},
  {label: '片头3 得病日', Comp: OpenerDayRoller, f: 14},
  {label: '片头3 得病日', Comp: OpenerDayRoller, f: 44},
  {label: '片头3 得病日', Comp: OpenerDayRoller, f: 76},
  {label: '片头3 得病日', Comp: OpenerDayRoller, f: 128},
  {label: '片头4 题名', Comp: OpenerTitle, f: 24},
  {label: '片头4 题名', Comp: OpenerTitle, f: 52},
  {label: '片头4 题名', Comp: OpenerTitle, f: 78},
  {label: '片头4 题名', Comp: OpenerTitle, f: 116},
  {label: '片头5 地支环', Comp: OpenerRing, f: 16},
  {label: '片头5 地支环', Comp: OpenerRing, f: 40},
  {label: '片头5 地支环', Comp: OpenerRing, f: 66},
  {label: '片头5 地支环', Comp: OpenerRing, f: 100},
  {label: '转场1 落签', Comp: TransSignDrop, f: 12},
  {label: '转场1 落签', Comp: TransSignDrop, f: 32},
  {label: '转场1 落签', Comp: TransSignDrop, f: 48},
  {label: '转场1 落签', Comp: TransSignDrop, f: 58},
  {label: '转场2 扫朱', Comp: TransScan, f: 6},
  {label: '转场2 扫朱', Comp: TransScan, f: 14},
  {label: '转场2 扫朱', Comp: TransScan, f: 22},
  {label: '转场2 扫朱', Comp: TransScan, f: 40},
  {label: '转场3 拨盘', Comp: TransRingTurn, f: 8},
  {label: '转场3 拨盘', Comp: TransRingTurn, f: 26},
  {label: '转场3 拨盘', Comp: TransRingTurn, f: 44},
  {label: '转场3 拨盘', Comp: TransRingTurn, f: 56},
  {label: '转场4 洇墨', Comp: TransInkBlot, f: 5},
  {label: '转场4 洇墨', Comp: TransInkBlot, f: 14},
  {label: '转场4 洇墨', Comp: TransInkBlot, f: 26},
  {label: '转场4 洇墨', Comp: TransInkBlot, f: 52},
  {label: '转场5 合界', Comp: TransGridClose, f: 6},
  {label: '转场5 合界', Comp: TransGridClose, f: 20},
  {label: '转场5 合界', Comp: TransGridClose, f: 38},
  {label: '转场5 合界', Comp: TransGridClose, f: 54},
];

const COLS = 4;
const CW = 320, CH = 180;
export const SHEET_W = COLS * CW;
export const SHEET_H = Math.ceil(CELLS.length / COLS) * CH;

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

export const ILSheet: React.FC = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: SHEET_W, height: SHEET_H, background: PAPER}}>
    <FontsOnce>
      {CELLS.map((c, i) => <CellBox key={i} c={c} i={i} />)}
    </FontsOnce>
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, color: INK}} />
  </div>
);
