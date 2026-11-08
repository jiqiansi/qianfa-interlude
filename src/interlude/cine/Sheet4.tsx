import React from 'react';
import {Freeze} from 'remotion';
import {FontsOnce} from '../kit';
import {PaperBg} from '../../shushu/paperbg';
import {INK, INK_FAINT, PAPER, RULE, FONT_KAI} from '../../shushu/paper';
import {CineTrailer} from './trailer';
import {DK} from './engine';

/**
 * 接触印相（预告片 v3）—— 四镜各 4 帧，一次渲染出齐。
 * ⚠ durationInFrames 必须 ≥ 最大关键帧（见 ILSheet 的同一条坑）。
 */
type Cell = {label: string; Comp: React.FC<Record<string, never>>; f: number};

const CELLS: Cell[] = [
  {label:'镜一 医学入', Comp: CineTrailer, f: 10},
  {label:'镜一 医学定格', Comp: CineTrailer, f: 46},
  {label:'镜一 & 换行', Comp: CineTrailer, f: 78},
  {label:'镜一 数术', Comp: CineTrailer, f: 112},
  {label:'镜二 花甲成墙', Comp: CineTrailer, f: 215},
  {label:'镜二 罗盘现身', Comp: CineTrailer, f: 285},
  {label:'镜二 内圈锁定', Comp: CineTrailer, f: 345},
  {label:'镜二 外圈飞入', Comp: CineTrailer, f: 455},
  {label:'镜三 术语砸满', Comp: CineTrailer, f: 565},
  {label:'镜三 定格推镜', Comp: CineTrailer, f: 645},
  {label:'镜三 先裂', Comp: CineTrailer, f: 676},
  {label:'镜三 碎裂', Comp: CineTrailer, f: 690},
  {label:'镜四 题名砸入', Comp: CineTrailer, f: 812},
  {label:'镜四 定格', Comp: CineTrailer, f: 860},
  {label:'镜四 小标题', Comp: CineTrailer, f: 934},
  {label:'镜四 收尾', Comp: CineTrailer, f: 1050},
];

const COLS = 4;
const CW = 320, CH = 180;
export const ILT_W = COLS * CW;
export const ILT_H = Math.ceil(CELLS.length / COLS) * CH;

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

export const ILTSheet: React.FC = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: ILT_W, height: ILT_H, background: DK.page}}>
    <FontsOnce>
      {CELLS.map((c, i) => <CellBox key={i} c={c} i={i} />)}
    </FontsOnce>
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, color: INK}} />
  </div>
);
