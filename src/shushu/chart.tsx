import React from 'react';
import {clamp01, powOutRemain} from '../common';
import {CText, abs} from '../ui';
import type {GuaName, Hexagram} from './chartdata';
import {GUA, YAO_POS, HU_SOURCE, tiYong, huGua} from './chartdata';
import {YaoLine, YaoMorph, GuaGlyph, EdgeTab, Badge} from './prims';
import {
  INK, INK_MID, INK_SOFT, INK_FAINT, RULE, CINNABAR, CINNABAR_SOFT, CINNABAR_WASH,
  PAPER_WUXING, FONT_KAI, FONT_KAI_BOLD, FONT_NUM, STROKE, alpha, mix, INDIGO_SOFT,
} from './paper';

/**
 * 本互变三列卦盘 —— 排盘可视化的核心组件。
 *
 * 讲一卦的完整结构需要同屏回答四个问题，对应四个视觉单元：
 *   1. 本卦是什么（左列 + 卦名 + 上下卦五行）
 *   2. 动爻在哪、怎么动（朱砂圈标记 + YaoMorph 逐帧翻转）
 *   3. 互卦从哪来（中列 + 源爻高亮，显示二三四/三四五的抽取）
 *   4. 谁体谁用（本卦上下卦各挂一个体/用胶囊）
 *
 * 所有状态都是绝对帧号 N 的纯函数（同一份 layout 被多个镜头共用）
 * → 镜头边界零跳变。
 *
 * 逐帧时序（相对 f0）：
 *   0     本卦六爻自下而上生长（每爻错峰 3 帧，共约 30 帧）
 *   +34   卦名 + 上下卦标签 + 爻位序号落位
 *   +56   动爻朱砂圈画出（draw-on 14 帧）
 *   +70   体用胶囊分挂上下卦
 *   +90   变卦列入场（若无变卦则互卦列入场）
 *   flipAt 动爻翻转（YaoMorph 0→1，16 帧）→ 变卦结构成立
 *
 * 版面（1280×720 内容主区 x76–1204）：
 *   列距 300px；爻宽 110；爻距 36；六爻总高 180。
 */

export interface HexChartProps {
  /** 盘面中心 x（本卦列的中心） */
  cx: number;
  /** 盘面中心 y（六爻几何中心） */
  cy: number;
  ben: Hexagram;
  /** 变卦（有动爻时） */
  bian?: Hexagram;
  /** 互卦（自动由 ben 算出，也可外部传入避免重复计算） */
  hu?: Hexagram;
  /** 动爻位，1–6 自下而上 */
  moving?: number[];
  /** 显示哪些列 */
  show?: {hu?: boolean; bian?: boolean};
  /** 单列间距 */
  colGap?: number;
  N: number;
  f0: number;
  /** 动爻翻转发生的帧（缺省 f0+90） */
  flipAt?: number;
  /** 是否挂体用胶囊 */
  tiYong?: boolean;
  /** 爻位序号（初二三四五上） */
  posLabels?: boolean;
  /** 半透明：镜头里它成为配角时 */
  opacity?: number;
  /** 整体收束程度 0→1（离场用），1 = 完全收 */
  exitK?: number;
}

const YAO_W = 110;
const YAO_GAP = 36;

/** 六爻列：自下（初）而上（上）。 */
const HexColumn: React.FC<{
  h: Hexagram;
  cx: number; cy: number;
  N: number; f0: number;
  /** 逐爻入场起点帧数组（相对 N 的绝对帧） */
  yaoFrom: (i: number) => number;
  /** 需要翻转的爻（动爻）：在 flipAt 做 YaoMorph */
  flip?: {pos: number[]; at: number; from: Hexagram};
  /** 源爻高亮（互卦抽取时点亮本卦的哪几爻） */
  litSrc?: number[];
  /** 独立的动爻朱砂圈阶段；不与 YaoMorph 的目标列耦合。 */
  marker?: {pos: number[]; at: number; until?: number};
  opacity?: number;
  color?: string;
}> = ({h, cx, cy, N, f0, yaoFrom, flip, litSrc = [], marker, opacity = 1, color = INK}) => {
  const top = cy - (5 * YAO_GAP) / 2;
  const moving = flip?.pos ?? [];
  const markerPos = marker?.pos ?? [];
  const markerUntil = marker?.until ?? Infinity;
  return (
    <div style={{opacity}}>
      {h.yao.map((v, i) => {
        const yy = top + (5 - i) * YAO_GAP;
        const start = yaoFrom(i);
        const n = N - start;
        if (n < 0) return null;
        const p = clamp01(n / 14); // 爻生长 14 帧
        const isMoving = moving.includes(i + 1);
        const isMarked = markerPos.includes(i + 1) && N >= (marker?.at ?? Infinity) && N <= markerUntil;
        const markerFade = isMarked && marker ? Math.min(1, Math.max(0, (N - marker.at + 1) / 10), Math.max(0, (markerUntil - N + 1) / 8)) : 0;
        const kind = v ? 'yang' : 'yin';
        const lit = litSrc.includes(i + 1);

        // 动爻：flipAt 前显示本卦原爻，之后翻转
        let drawKind: 'yang' | 'yin' = kind;
        let morphP = -1;
        if (flip && flip.pos.includes(i + 1)) {
          const k = clamp01((N - flip.at) / 16);
          const fromKind = flip.from.yao[i] ? 'yang' : 'yin';
          const toKind = kind;
          if (k >= 1) {
            drawKind = toKind;
          } else if (k <= 0) {
            drawKind = fromKind;
          } else {
            morphP = k;
            drawKind = fromKind;
          }
        }

        const c = isMarked || (isMoving && N >= (flip?.at ?? Infinity))
          ? CINNABAR
          : color;

        return (
          <React.Fragment key={i}>
            {morphP >= 0 ? (
              <YaoMorph cx={cx} cy={yy} w={YAO_W} from={flip!.from.yao[i] ? 'yang' : 'yin'}
                        to={kind} p={morphP} color={CINNABAR} />
            ) : (
              <YaoLine cx={cx} cy={yy} w={YAO_W} kind={drawKind} color={c} p={p}
                       glow={lit ? `0 0 10px 2px ${alpha(CINNABAR, 0.35)}` : undefined} />
            )}
            {/* 动爻朱砂圈：在爻右端 */}
            {isMarked ? (() => {
              const mp = clamp01((N - (marker!.at)) / 14);
              const r = 8 * mp;
              return (
                <div style={{
                  ...abs(cx + YAO_W / 2 + 20 - r, yy - r, r * 2, r * 2),
                  boxSizing: 'border-box', borderRadius: r,
                  border: `${Math.max(1, 2.2 * mp).toFixed(1)}px solid ${CINNABAR}`,
                  opacity: markerFade,
                }} />
              );
            })() : null}
            {/* 互卦抽取：源爻短墨标 */}
            {lit ? (() => {
              const ln = N - (f0 + 96);
              if (ln < 0) return null;
              const lp = clamp01(ln / 10);
              return (
                <div style={{
                  ...abs(cx - YAO_W / 2 - 30, yy - 6 * lp, 16 * lp, 12 * lp),
                  background: alpha(CINNABAR, 0.75), borderRadius: 3,
                }} />
              );
            })() : null}
          </React.Fragment>
        );
      })}
      {/* 下卦/上卦分界：细虚线 */}
      {(() => {
        const n = N - (f0 + 34);
        if (n < 0) return null;
        const mid = top + 2.5 * YAO_GAP;
        return (
          <svg width={YAO_W + 60} height={2} style={{position: 'absolute', left: cx - (YAO_W + 60) / 2, top: mid - 1, opacity: clamp01(n / 12) * 0.75}}>
            <line x1={4} y1={1} x2={YAO_W + 56} y2={1} stroke={INK_FAINT}
                  strokeWidth={STROKE.hair} strokeDasharray="3 5" />
          </svg>
        );
      })()}
    </div>
  );
};

/**
 * 互卦抽取连线：逐条把本卦爻「牵」到互卦对应位置。
 * 对应关系（爻位从下往上，1-based）：
 *   下互：本卦 2→互卦 1，3→2，4→3
 *   上互：本卦 3→互卦 4，4→5，5→6
 * 共 6 条线，3/4 爻各分叉一次。线从本卦爻的右端长到互卦爻的左端，
 * 先三条朱砂淡线（下互），再三条靛青淡线（上互），让观众能逐条追踪来源。
 */
const MutualExtractionLinks: React.FC<{
  benX:number; huX:number; cy:number; N:number; f0:number; opacity?:number;
}> = ({benX,huX,cy,N,f0,opacity=1}) => {
  const top=cy-(5*YAO_GAP)/2;
  const y=(pos:number)=>top+(6-pos)*YAO_GAP;
  const links:Array<{src:number;dst:number;color:string;group:number}>=[
    ...HU_SOURCE.lower.map((src, i) => ({src,dst:i + 1,color:CINNABAR_SOFT,group:0})),
    ...HU_SOURCE.upper.map((src, i) => ({src,dst:i + 4,color:INDIGO_SOFT,group:1})),
  ];
  return <svg width={1280} height={720} style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none',opacity}}>
    {links.map((l,i)=>{
      const start=f0+94+l.group*22+i%3*4;
      const p=clamp01((N-start)/12);
      if(p<=0)return null;
      const x1=benX+YAO_W/2+5, x2=huX-YAO_W/2-5;
      const y1=y(l.src), y2=y(l.dst);
      const bend=(x2-x1)*0.45;
      const d=`M ${x1} ${y1} C ${x1+bend} ${y1}, ${x2-bend} ${y2}, ${x2} ${y2}`;
      // 屏幕坐标的贝塞尔长度保守估算；pathLength 统一归一到 100
      return <path key={i} d={d} pathLength={100} fill="none" stroke={l.color}
        strokeWidth={1.25} strokeDasharray="100" strokeDashoffset={100*(1-p)}
        opacity={0.62} strokeLinecap="round"/>;
    })}
  </svg>;
};

export const HexChart: React.FC<HexChartProps> = ({
  cx, cy, ben, bian, hu, moving = [], show = {}, colGap = 300,
  N, f0, flipAt, tiYong = true, posLabels = true, opacity = 1, exitK = 0,
}) => {
  const showHu = show.hu ?? (!!hu || !!bian);
  const showBian = show.bian ?? !!bian;
  const huHex = hu ?? huGua(ben);
  const mv = moving;
  const flip = bian && mv.length ? {pos: mv, at: flipAt ?? f0 + 90, from: ben} : undefined;
  const {ti, yong, tiIsLower} = tiYongFn(ben, mv);

  // 列布局：本卦在 cx，互卦/变卦向右
  const cols: Array<{h: Hexagram; x: number; title: string; kind: 'ben' | 'hu' | 'bian'}> = [
    {h: ben, x: cx, title: '本卦', kind: 'ben'},
  ];
  if (showHu) cols.push({h: huHex, x: cx + colGap, title: '互卦', kind: 'hu'});
  if (showBian && bian) cols.push({h: bian, x: cx + colGap * (showHu ? 2 : 1), title: '变卦', kind: 'bian'});

  const top = cy - (5 * YAO_GAP) / 2;
  const bot = top + 5 * YAO_GAP;
  const op = opacity * (1 - clamp01(exitK));

  return (
    <div style={{opacity: op}}>
      {/* 卦名标题区（每列顶部） */}
      {cols.map((c) => {
        const colDelay = c.kind === 'ben' ? 0 : c.kind === 'hu' ? 76 : 90;
        // 变卦的卦名也不能早于动爻翻转，避免观众先看到“答案”再看推导。
        const titleStart = c.kind === 'bian' && flip ? flip.at + 16 : f0 + 34 + colDelay;
        const n = N - titleStart;
        if (n < 0) return null;
        const o = clamp01(n / 12);
        const isFocus = c.kind !== 'ben' || cols.length === 1;
        return (
          <div key={'t' + c.kind} style={{opacity: o}}>
            <CText cx={c.x} cy={top - 74} size={26} weight={700} family={FONT_KAI_BOLD}
                    color={INK_SOFT} letterSpacing={6}>{c.title}</CText>
            <CText cx={c.x} cy={top - 40} size={34} weight={700} family={FONT_KAI_BOLD}
                    color={c.kind === 'bian' ? CINNABAR : INK}>{c.h.name}</CText>
            {/* 上下卦 + 五行 小字 */}
            <CText cx={c.x} cy={top - 14} size={21} weight={500} family={FONT_KAI} color={INK_MID}>
              {`上${c.h.upper}${GUA[c.h.upper].wuxing} 下${c.h.lower}${GUA[c.h.lower].wuxing}`}
            </CText>
          </div>
        );
      })}

      {/* 互卦逐爻抽取线：放在盘面爻线之后由 SVG 细线贯穿；只在互卦列存在时显示 */}
      {showHu ? <MutualExtractionLinks benX={cx} huX={cx + colGap} cy={cy} N={N} f0={f0} opacity={opacity} /> : null}

      {/* 三列爻 */}
      {cols.map((c) => {
        // 互卦抽取时，在本卦源爻（二三四五）上盖淡朱砂；互卦列稍后逐爻生成。
        const lit = c.kind === 'ben' && showHu ? [2, 3, 4, 5] : [];
        return (
          <HexColumn
            key={c.kind}
            h={c.h}
            cx={c.x}
            cy={cy}
            N={N}
            f0={f0 + (c.kind === 'ben' ? 0 : c.kind === 'hu' ? 76 : 90)}
            yaoFrom={(i) => c.kind === 'bian' && flip
              ? flip.at + i * 3
              : f0 + (c.kind === 'ben' ? 0 : c.kind === 'hu' ? 76 : 90) + i * 3}
            flip={c.kind === 'ben' ? undefined : c.kind === 'bian' ? flip : undefined}
            marker={c.kind === 'ben' && flip
              ? {pos: mv, at: f0 + 56, until: flip.at + 16}
              : c.kind === 'bian' && flip
                ? {pos: mv, at: flip.at + 16, until: flip.at + 48}
                : undefined}
            litSrc={lit}
          />
        );
      })}

      {/* 互卦来源标签：把抽取规则写在盘面上，避免只靠旁白 */}
      {showHu ? (
        <CText cx={cx + colGap} cy={bot + 72} size={17} family={FONT_KAI} color={INK_FAINT}
          opacity={clamp01((N - (f0 + 106)) / 10)}>
          下互：二三四 · 上互：三四五
        </CText>
      ) : null}

      {/* 爻位序号（本卦左侧） */}
      {posLabels ? YAO_POS.map((pos, i) => {
        const n = N - (f0 + 40 + i * 2);
        if (n < 0) return null;
        return (
          <CText key={pos} cx={cx - YAO_W / 2 - 46} cy={top + (5 - i) * YAO_GAP} size={22}
                  weight={500} family={FONT_KAI} color={INK_FAINT}
                  opacity={clamp01(n / 10)}>{pos}</CText>
        );
      }) : null}

      {/* 体用胶囊（本卦上下卦下方） */}
      {tiYong && mv.length > 0 ? (() => {
        const n = N - (f0 + 70);
        if (n < 0) return null;
        const o = clamp01(n / 12);
        const lowerY = bot + 46;
        const upperY = top - 106;
        const lowerIsTi = tiIsLower;
        return (
          <div style={{opacity: o}}>
            <EdgeTab x={cx - 66} y={lowerY} w={44} h={30} text={lowerIsTi ? '体' : '用'}
                     color={lowerIsTi ? CINNABAR : INK_FAINT}
                     textColor={lowerIsTi ? CINNABAR : INK_SOFT}
                     fill={lowerIsTi ? 'wash' : 'none'} fontSize={21} />
            <CText cx={cx - 6} cy={lowerY + 15} size={20} family={FONT_KAI} color={INK_SOFT}
                   opacity={0.95}>{GUA[lowerIsTi ? ben.lower : ben.upper].wuxing}</CText>
            <EdgeTab x={cx + 22} y={upperY} w={44} h={30} text={lowerIsTi ? '用' : '体'}
                     color={lowerIsTi ? INK_FAINT : CINNABAR}
                     textColor={lowerIsTi ? INK_SOFT : CINNABAR}
                     fill={lowerIsTi ? 'none' : 'wash'} fontSize={21} />
            <CText cx={cx + 94} cy={upperY + 15} size={20} family={FONT_KAI} color={INK_SOFT}
                   opacity={0.95}>{GUA[lowerIsTi ? ben.upper : ben.lower].wuxing}</CText>
          </div>
        );
      })() : null}

      {/* 动爻指示：底部注脚「○ 动爻 · 第 N 爻」 */}
      {mv.length ? (() => {
        const n = N - (f0 + 56);
        if (n < 0) return null;
        const label = mv.map((p) => YAO_POS[p - 1]).join('、');
        return (
          <CText cx={cx} cy={bot + 96} size={22} weight={600} family={FONT_KAI}
                  color={CINNABAR} opacity={clamp01(n / 12)}>
            {`○ ${label}爻动`}
          </CText>
        );
      })() : null}
    </div>
  );
};

/** 体用归属（与 chartdata.tiYong 同逻辑，此处做类型收窄）。 */
function tiYongFn(h: Hexagram, moving: number[]) {
  const r = tiYong(h, moving.length ? moving : [3]); // 无动爻时按三爻动占位（画面上不显示体用）
  return {ti: r.ti, yong: r.yong, tiIsLower: r.tiIsLower};
}

/**
 * 起卦演示：数字 → 上下卦 → 合成本卦（分合动画）。
 * 上下卦从两侧滑入、在中线合体，是"起卦"最直观的逐帧表现。
 */
export const SplitMergeGua: React.FC<{
  cx: number; cy: number;
  upper: GuaName; lower: GuaName;
  N: number; f0: number;
  /** 合体发生的帧（此前两卦分开，此后合并为一卦） */
  mergeAt: number;
  gap?: number;
  label?: boolean;
  opacity?: number;
}> = ({cx, cy, upper, lower, N, f0, mergeAt, gap = 190, label = true, opacity = 1}) => {
  // mergeAt 之前：上卦在上、下卦在下，间距 gap；之后收到标准三爻距
  const k = clamp01((N - mergeAt) / 18);
  const spread = gap * powOutRemain(N - f0, 16, 2.5);
  const sep = gap * (1 - k) + spread;
  const trigramH = 78;
  const uppCy = cy - sep * 0.5;
  const lowCy = cy + sep * 0.5;
  const appear = clamp01((N - f0) / 14);
  return (
    <div style={{opacity: opacity * appear}}>
      <GuaGlyph cx={cx} cy={lowCy} gua={lower} size={trigramH} p={clamp01((N - f0) / 12)}
                 label="none" />
      <GuaGlyph cx={cx} cy={uppCy} gua={upper} size={trigramH} p={clamp01((N - f0 - 6) / 12)}
                 label="none" />
      {label && k > 0.5 ? (
        <div style={{opacity: clamp01((k - 0.5) * 3)}}>
          <CText cx={cx} cy={cy + sep * 0.5 + 78} size={30} weight={700} family={FONT_KAI_BOLD}
                  color={INK}>{`${upper}上${lower}下`}</CText>
        </div>
      ) : null}
    </div>
  );
};