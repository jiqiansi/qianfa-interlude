import React from 'react';
import {Freeze} from 'remotion';
import {FontsOnce} from '../kit';
import {PaperBg} from '../../shushu/paperbg';
import {INK, INK_FAINT, PAPER, RULE, FONT_KAI} from '../../shushu/paper';
import {
  CineAwakening, CineLightThrough, CineGanzhiFlow, CineRing3D, CineInkBurst,
  CineGlassSlab, CineTunnel, CineSparksPlate, CineWordsFog, CineSealThunder,
} from './clips';
import {DK} from './engine';

/**
 * 接触印相（暗场电影感组）—— 10 支 × 4 关键帧。
 * ⚠ durationInFrames 必须 ≥ 最大关键帧（见 ILSheet 的同一条坑）。
 */
type Cell = {label: string; Comp: React.FC<Record<string, never>>; f: number};

const CELLS: Cell[] = [
  {label:'K1 觉醒', Comp: CineAwakening, f: 30},
  {label:'K1 觉醒', Comp: CineAwakening, f: 80},
  {label:'K1 觉醒', Comp: CineAwakening, f: 112},
  {label:'K1 觉醒', Comp: CineAwakening, f: 200},
  {label:'K2 纸背透光', Comp: CineLightThrough, f: 30},
  {label:'K2 纸背透光', Comp: CineLightThrough, f: 74},
  {label:'K2 纸背透光', Comp: CineLightThrough, f: 140},
  {label:'K2 纸背透光', Comp: CineLightThrough, f: 196},
  {label:'K3 干支流', Comp: CineGanzhiFlow, f: 30},
  {label:'K3 干支流', Comp: CineGanzhiFlow, f: 72},
  {label:'K3 干支流', Comp: CineGanzhiFlow, f: 118},
  {label:'K3 干支流', Comp: CineGanzhiFlow, f: 176},
  {label:'K4 时间之环', Comp: CineRing3D, f: 30},
  {label:'K4 时间之环', Comp: CineRing3D, f: 62},
  {label:'K4 时间之环', Comp: CineRing3D, f: 92},
  {label:'K4 时间之环', Comp: CineRing3D, f: 150},
  {label:'K5 墨爆', Comp: CineInkBurst, f: 12},
  {label:'K5 墨爆', Comp: CineInkBurst, f: 26},
  {label:'K5 墨爆', Comp: CineInkBurst, f: 46},
  {label:'K5 墨爆', Comp: CineInkBurst, f: 78},
  {label:'K6 玻璃牌', Comp: CineGlassSlab, f: 8},
  {label:'K6 玻璃牌', Comp: CineGlassSlab, f: 30},
  {label:'K6 玻璃牌', Comp: CineGlassSlab, f: 50},
  {label:'K6 玻璃牌', Comp: CineGlassSlab, f: 68},
  {label:'K7 卷轴隧道', Comp: CineTunnel, f: 10},
  {label:'K7 卷轴隧道', Comp: CineTunnel, f: 30},
  {label:'K7 卷轴隧道', Comp: CineTunnel, f: 54},
  {label:'K7 卷轴隧道', Comp: CineTunnel, f: 72},
  {label:'K8 星火落盘', Comp: CineSparksPlate, f: 30},
  {label:'K8 星火落盘', Comp: CineSparksPlate, f: 86},
  {label:'K8 星火落盘', Comp: CineSparksPlate, f: 104},
  {label:'K8 星火落盘', Comp: CineSparksPlate, f: 160},
  {label:'K9 雾中凝字', Comp: CineWordsFog, f: 14},
  {label:'K9 雾中凝字', Comp: CineWordsFog, f: 52},
  {label:'K9 雾中凝字', Comp: CineWordsFog, f: 96},
  {label:'K9 雾中凝字', Comp: CineWordsFog, f: 140},
  {label:'K10 印落成雷', Comp: CineSealThunder, f: 8},
  {label:'K10 印落成雷', Comp: CineSealThunder, f: 26},
  {label:'K10 印落成雷', Comp: CineSealThunder, f: 36},
  {label:'K10 印落成雷', Comp: CineSealThunder, f: 62},
];

const COLS = 4;
const CW = 320, CH = 180;
export const ILC_W = COLS * CW;
export const ILC_H = Math.ceil(CELLS.length / COLS) * CH;

const CellBox: React.FC<{c: Cell; i: number}> = ({c, i}) => (
  <div style={{
    position: 'absolute', left: (i % COLS) * CW, top: Math.floor(i / COLS) * CH,
    width: CW, height: CH, overflow: 'hidden', background: DK.page,
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
      color: DK.text, background: 'rgba(11,15,18,0.72)', padding: '1px 6px', borderRadius: 3,
    }}>{`${c.label}  f${c.f}`}</div>
    <div style={{position: 'absolute', right: 6, top: 3, fontFamily: FONT_KAI, fontSize: 14, color: DK.muted}}>{i + 1}</div>
  </div>
);

export const ILCSheet: React.FC = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: ILC_W, height: ILC_H, background: DK.page}}>
    <FontsOnce>
      {CELLS.map((c, i) => <CellBox key={i} c={c} i={i} />)}
    </FontsOnce>
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, color: INK}} />
  </div>
);
