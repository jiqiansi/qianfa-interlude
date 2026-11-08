import React from 'react';
import {Composition} from 'remotion';
import {ILSheet, SHEET_W, SHEET_H} from './interlude/Sheet';
import {IL_DEFAULTS, OpenerSeal, OpenerSanSi, OpenerDayRoller, OpenerTitle, OpenerRing} from './interlude/openers';
import {TransSignDrop, TransScan, TransScanOverlay, TransRingTurn, TransInkBlot, TransGridClose} from './interlude/transitions';
import {
  ExDuiGongJing, ExSevenSteps, ExJiaziScroll, ExGanzhiGears, ExBingchuanHops, ExShichenDial,
  ExTwoGanClash, ExSanQiuWuMu, ExSixteenTalismans, ExYiwenDiff, ExBacklit, ExDayDropIn,
} from './interlude/extra';
import {ILESheet, ILE_W, ILE_H} from './interlude/Sheet2';
import {
  CineAwakening, CineLightThrough, CineGanzhiFlow, CineRing3D, CineInkBurst,
  CineGlassSlab, CineTunnel, CineSparksPlate, CineWordsFog, CineSealThunder,
  CineReel, CINE_REEL_FRAMES,
} from './interlude/cine/clips';
import {ILCSheet, ILC_W, ILC_H} from './interlude/cine/Sheet3';

/**
 * 伤寒钤法 · 通用片头 / 转场包（不绑定任何一期）。
 *
 * 除了 Sheet，每个 id 都是一支可直接交付的短片：
 *   片头 OpenerSeal(180) / OpenerSanSi(165) / OpenerDayRoller(135) / OpenerTitle(120) / OpenerRing(105)
 *   转场 TransSignDrop(70) / TransScan(45) / TransRingTurn(60) / TransInkBlot(60) / TransGridClose(60)
 *   叠加 TransScanOverlay(45) —— 透明底，压在任意素材上（vp9 + yuva420p）
 *
 * 讲次/章名/短词都走 props，不写死在画面里：
 *   remotion render src/index.ts OpenerSeal out.mp4 --props='{"lec":"第 7 讲","title":"七步起盘"}'
 */
const W = 1280, H = 720, FPS = 30;
const base = {course: IL_DEFAULTS.course, series: IL_DEFAULTS.series, sub: IL_DEFAULTS.sub};

export const Root: React.FC = () => (
  <>
    <Composition id="OpenerSeal" component={OpenerSeal} durationInFrames={180} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="OpenerSanSi" component={OpenerSanSi} durationInFrames={165} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="OpenerDayRoller" component={OpenerDayRoller} durationInFrames={135} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="OpenerTitle" component={OpenerTitle} durationInFrames={120} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="OpenerRing" component={OpenerRing} durationInFrames={105} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="TransSignDrop" component={TransSignDrop} durationInFrames={70} fps={FPS} width={W} height={H} />
    <Composition id="TransScan" component={TransScan} durationInFrames={45} fps={FPS} width={W} height={H} />
    <Composition id="TransScanOverlay" component={TransScanOverlay} durationInFrames={45} fps={FPS} width={W} height={H} />
    <Composition id="TransRingTurn" component={TransRingTurn} durationInFrames={60} fps={FPS} width={W} height={H} />
    <Composition id="TransInkBlot" component={TransInkBlot} durationInFrames={60} fps={FPS} width={W} height={H} />
    <Composition id="TransGridClose" component={TransGridClose} durationInFrames={60} fps={FPS} width={W} height={H} />
    {/* 实验组 ×12：同一套纸墨语言下的不同风格（环形/目录/长卷/咬合/跳格/相撞/网格/对照/光/落子） */}
    <Composition id="ExDuiGongJing" component={ExDuiGongJing} durationInFrames={150} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="ExSevenSteps" component={ExSevenSteps} durationInFrames={180} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="ExJiaziScroll" component={ExJiaziScroll} durationInFrames={135} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="ExGanzhiGears" component={ExGanzhiGears} durationInFrames={165} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="ExBingchuanHops" component={ExBingchuanHops} durationInFrames={105} fps={FPS} width={W} height={H} />
    <Composition id="ExShichenDial" component={ExShichenDial} durationInFrames={135} fps={FPS} width={W} height={H} />
    <Composition id="ExTwoGanClash" component={ExTwoGanClash} durationInFrames={90} fps={FPS} width={W} height={H} />
    <Composition id="ExSanQiuWuMu" component={ExSanQiuWuMu} durationInFrames={135} fps={FPS} width={W} height={H} />
    <Composition id="ExSixteenTalismans" component={ExSixteenTalismans} durationInFrames={150} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="ExYiwenDiff" component={ExYiwenDiff} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="ExBacklit" component={ExBacklit} durationInFrames={75} fps={FPS} width={W} height={H} />
    <Composition id="ExDayDropIn" component={ExDayDropIn} durationInFrames={66} fps={FPS} width={W} height={H} />
    <Composition id="ILESheet" component={ILESheet} durationInFrames={200} fps={FPS} width={ILE_W} height={ILE_H} />
    {/* 暗场电影感组 ×10（v2）：3D + 磨砂玻璃 + 粒子 + 体积光 */}
    <Composition id="CineAwakening" component={CineAwakening} durationInFrames={240} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="CineLightThrough" component={CineLightThrough} durationInFrames={210} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="CineGanzhiFlow" component={CineGanzhiFlow} durationInFrames={195} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="CineRing3D" component={CineRing3D} durationInFrames={180} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="CineInkBurst" component={CineInkBurst} durationInFrames={90} fps={FPS} width={W} height={H} />
    <Composition id="CineGlassSlab" component={CineGlassSlab} durationInFrames={75} fps={FPS} width={W} height={H} />
    <Composition id="CineTunnel" component={CineTunnel} durationInFrames={78} fps={FPS} width={W} height={H} />
    <Composition id="CineSparksPlate" component={CineSparksPlate} durationInFrames={180} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="CineWordsFog" component={CineWordsFog} durationInFrames={150} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="CineSealThunder" component={CineSealThunder} durationInFrames={75} fps={FPS} width={W} height={H} />
    <Composition id="CineReel" component={CineReel} durationInFrames={CINE_REEL_FRAMES} fps={FPS} width={W} height={H} defaultProps={base} />
    <Composition id="ILCSheet" component={ILCSheet} durationInFrames={260} fps={FPS} width={ILC_W} height={ILC_H} />
    <Composition id="ILSheet" component={ILSheet} durationInFrames={200} fps={FPS} width={SHEET_W} height={SHEET_H} />
  </>
);
