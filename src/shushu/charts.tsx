import React from 'react';
import {GUA_ORDER, GUA, SHENG, KE, WUXING_ORDER, WANGSHUAI, WANGSHUAI_LEVEL,
  XIANTIAN_GRID, HOUTIAN_GRID, LUOSHU_GRID, RC_FANGWEI, DIZHI, DIZHI_ANGLE, DIZHI_WUXING,
  SIXIANG, CEGUI_SLOTS, YUAN_HUI_YUN_SHI, WUXING_ANGLE, type GuaName, type WuXing,
  type Hexagram, type WangShuai, type CeGuiSlot, hexName, makeHex, huGua, bianGua, tiYong, relate, RELATION_COLOR,
} from './chartdata';
import {GuaGlyph, GuaSymbol, YaoLine, YaoMorph, WuxingNode, ringPoint, PalaceCell,
  NumSlot, EdgeTab, Badge} from './prims';
import {CText, abs} from '../ui';
import {clamp01, lerp} from '../common';
import {PAPER, INK, INK_MID, INK_SOFT, INK_FAINT, RULE, CINNABAR, CINNABAR_SOFT,
  CINNABAR_WASH, INDIGO, INDIGO_SOFT, CELADON, GOLD, OCHRE, PAPER_WUXING, PAPER_WUXING_SOFT,
  FONT_KAI, FONT_KAI_BOLD, FONT_NUM, STROKE, RADIUS, alpha, mix, inkSpread, inkDry} from './paper';

/**
 * 术数图表层 —— 所有「需要看着排、看着算」的可视化都在这里。
 *
 * 共同约定：
 *   · 每个组件收绝对帧 N 与入场帧 f0，全部是纯函数，无随机副作用；
 *   · 颜色语义固定：五行色 = 元素身份，朱砂 = 当前讲解焦点，靛青 = 结构；
 *   · 纸底不发光，焦点靠朱砂印记 / 墨色加浓 / 细线框 / 轻微放大，不用霓虹 glow；
 *   · 每个盘面必须有可见的方位/方向说明，避免观众把「上南下北」看反。
 */

// ---------------------------------------------------------------- SVG helpers

type Pt = {x: number; y: number};

/** 逐帧画线：stroke-dashoffset 让线从起点长到终点。 */
const DrawLine: React.FC<{a: Pt; b: Pt; p: number; color?: string; sw?: number; dash?: string; opacity?: number}> =
  ({a, b, p, color = INK, sw = STROKE.thin, dash, opacity = 1}) => {
    const k = clamp01(p);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (k <= 0) return null;
    return (
      <svg width={1280} height={720} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * k} y2={a.y + (b.y - a.y) * k}
              stroke={color} strokeWidth={sw} strokeDasharray={dash} opacity={opacity} strokeLinecap="round" />
      </svg>
    );
  };

/** 箭头：线逐帧延伸，箭头头部最后 4 帧落下。 */
const DrawArrow: React.FC<{a: Pt; b: Pt; p: number; color?: string; sw?: number; head?: number; opacity?: number}> =
  ({a, b, p, color = INK, sw = STROKE.thin, head = 9, opacity = 1}) => {
    const k = clamp01(p);
    if (k <= 0) return null;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const tip = {x: a.x + dx * k, y: a.y + dy * k};
    const showHead = k > 0.88;
    const bx = tip.x - ux * head, by = tip.y - uy * head;
    const px = -uy * head * 0.52, py = ux * head * 0.52;
    return (
      <svg width={1280} height={720} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        <line x1={a.x} y1={a.y} x2={showHead ? bx : tip.x} y2={showHead ? by : tip.y}
              stroke={color} strokeWidth={sw} strokeLinecap="round" opacity={opacity} />
        {showHead ? <polygon points={`${tip.x},${tip.y} ${bx + px},${by + py} ${bx - px},${by - py}`}
                               fill={color} opacity={opacity} /> : null}
      </svg>
    );
  };

const PENTAGRAM_EDGES: Array<[WuXing, WuXing]> = [
  ['木', '土'], ['土', '水'], ['水', '火'], ['火', '金'], ['金', '木'],
];
const SHENG_EDGES: Array<[WuXing, WuXing]> = WUXING_ORDER.map((w, i) => [w, WUXING_ORDER[(i + 1) % 5]]);

// ---------------------------------------------------------------- 1. 五行生克环

export interface WuxingRingProps {
  cx: number; cy: number; r?: number;
  N: number; f0: number;
  mode?: 'sheng' | 'ke' | 'both';
  /** 当前讲到的关系，例 ['木','火'] */
  focus?: [WuXing, WuXing];
  /** 是否显示相生/相克标签 */
  labels?: boolean;
  /** 显示「木生火」这种关系文字 */
  relationText?: boolean;
  opacity?: number;
}

/**
 * 五行生克环。逐帧：节点先落位 → 相生顺时针逐箭头画出 → 相克五角线逐条画出 → focus 路径朱砂加重。
 *
 * 传统方向：生 = 木→火→土→金→水→木；克 = 木→土→水→火→金→木。
 * 这两个方向是事实层数据，视觉组件不自己推断（防止把五行关系画反）。
 */
export const WuxingRing: React.FC<WuxingRingProps> = ({
  cx = 640, cy = 360, r = 190, N, f0, mode = 'both', focus, labels = true,
  relationText = false, opacity = 1,
}) => {
  const nodeAt = (w: WuXing) => ringPoint(cx, cy, r, WUXING_ANGLE[w]);
  const sheng = mode === 'sheng' || mode === 'both';
  const ke = mode === 'ke' || mode === 'both';
  const edgeStart = f0 + 32;
  const edgeGap = 9;
  return (
    <div style={{opacity}}>
      {/* 圆环轨道：淡墨，固定结构 */}
      <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={RULE} strokeWidth={STROKE.hair} strokeDasharray="3 6" />
      </svg>

      {/* 相生边：顺时针五边形，逐条画出 */}
      {sheng ? SHENG_EDGES.map(([a, b], i) => {
        const p = clamp01((N - (edgeStart + i * edgeGap)) / 14);
        if (p <= 0) return null;
        const isFocus = focus?.[0] === a && focus?.[1] === b;
        const A = nodeAt(a), B = nodeAt(b);
        return (
          <React.Fragment key={`s-${a}-${b}`}>
            <DrawArrow a={A} b={B} p={p} color={isFocus ? CINNABAR : CELADON}
                       sw={isFocus ? 2.5 : 1.5} head={9} opacity={isFocus ? 0.9 : 0.55} />
            {relationText && p > 0.8 ? (
              <CText cx={(A.x + B.x) / 2} cy={(A.y + B.y) / 2} size={18} family={FONT_KAI}
                     color={isFocus ? CINNABAR : CELADON} opacity={0.85}>生</CText>
            ) : null}
          </React.Fragment>
        );
      }) : null}

      {/* 相克边：五角星，延后 55 帧出现 */}
      {ke ? PENTAGRAM_EDGES.map(([a, b], i) => {
        const base = edgeStart + (sheng ? 55 : 0);
        const p = clamp01((N - (base + i * edgeGap)) / 14);
        if (p <= 0) return null;
        const isFocus = focus?.[0] === a && focus?.[1] === b;
        const A = nodeAt(a), B = nodeAt(b);
        return (
          <React.Fragment key={`k-${a}-${b}`}>
            <DrawArrow a={A} b={B} p={p} color={isFocus ? CINNABAR : OCHRE}
                       sw={isFocus ? 2.8 : 1.35} head={8} opacity={isFocus ? 0.95 : 0.48} />
            {relationText && p > 0.8 ? (
              <CText cx={(A.x + B.x) / 2} cy={(A.y + B.y) / 2} size={18} family={FONT_KAI}
                     color={isFocus ? CINNABAR : OCHRE} opacity={0.85}>克</CText>
            ) : null}
          </React.Fragment>
        );
      }) : null}

      {/* 五行节点最后出现（箭头先画，节点后盖住线头） */}
      {WUXING_ORDER.map((w, i) => {
        const p = clamp01((N - (f0 + i * 4)) / 12);
        if (p <= 0) return null;
        const pos = nodeAt(w);
        const active = focus?.[0] === w || focus?.[1] === w;
        return <WuxingNode key={w} cx={pos.x} cy={pos.y} wuxing={w} r={34}
                           active={!!active} p={p} showLabel labelSize={30} />;
      })}

      {/* 图题：传统顺序标签 */}
      {labels ? (
        <div style={{opacity: clamp01((N - f0 - 10) / 10)}}>
          <CText cx={cx} cy={cy + r + 72} size={22} family={FONT_KAI} color={INK_FAINT}>
            木生火 · 火生土 · 土生金 · 金生水 · 水生木
          </CText>
        </div>
      ) : null}
    </div>
  );
};

/** 旺相休囚死色阶：五格逐帧落墨，当前状态盖朱砂小印。 */
export const WangShuaiScale: React.FC<{
  x: number; y: number; w?: number; h?: number;
  N: number; f0: number; active?: WangShuai;
  opacity?: number;
}> = ({x, y, w = 560, h = 56, N, f0, active, opacity = 1}) => {
  const labels = WANGSHUAI as readonly WangShuai[];
  const gap = 6;
  const cw = (w - gap * 4) / 5;
  return (
    <div style={{opacity}}>
      {labels.map((label, i) => {
        const p = clamp01((N - (f0 + i * 4)) / 10);
        if (p <= 0) return null;
        const xx = x + i * (cw + gap);
        const is = label === active;
        const alphaK = WANGSHUAI_LEVEL[label];
        const fill = is ? CINNABAR_WASH : alpha(INK, 0.025 + 0.075 * alphaK);
        const stroke = is ? CINNABAR : mix(RULE, INK_SOFT, alphaK * 0.45);
        return (
          <React.Fragment key={label}>
            <div style={{...abs(xx, y, cw, h), boxSizing: 'border-box', border: `${is ? 2.2 : 1.2}px solid ${stroke}`, background: fill, borderRadius: 3}} />
            <CText cx={xx + cw / 2} cy={y + h / 2 - 1} size={26} weight={is ? 700 : 500}
                    family={FONT_KAI_BOLD} color={is ? CINNABAR : INK_SOFT} opacity={p}>{label}</CText>
            {is ? <SealMark cx={xx + cw - 12} cy={y + 10} p={clamp01((N - f0 - 28) / 8)} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** 极简朱砂点记（旺衰条当前状态用，不是真正大印章）。 */
const SealMark: React.FC<{cx: number; cy: number; p: number}> = ({cx, cy, p}) => p <= 0 ? null : (
  <div style={{...abs(cx - 3.5, cy - 3.5, 7, 7), borderRadius: 7, background: CINNABAR, opacity: p}} />
);

// ---------------------------------------------------------------- 2. 先后天方位图

export interface BaguaFangweiProps {
  cx: number; cy: number; size?: number;
  N: number; f0: number;
  mode?: '先天' | '后天';
  /** 在 switchAt 做先天→后天的逐帧移宫 */
  morph?: {from: '先天' | '后天'; to: '先天' | '后天'; at: number};
  focusGua?: GuaName;
  showLuoshu?: boolean;
  /** 方向文字（上南下北·左东右西）必须显式，以免观众读反 */
  showCompass?: boolean;
  opacity?: number;
}

/**
 * 先后天八卦方位九宫图。视觉铁律：**上南下北、左东右西必须画在图上**。
 *
 * morph 切换不是交叉淡化，而是八个卦按方位矩阵逐个**移宫**（错峰 2 帧），
 * 让观众看到「哪些卦换了位置」——这是视觉理解点，不可只做文字淡出。
 */
export const BaguaFangwei: React.FC<BaguaFangweiProps> = ({
  cx = 640, cy = 370, size = 420, N, f0, mode = '后天', morph,
  focusGua, showLuoshu = true, showCompass = true, opacity = 1,
}) => {
  const cell = size / 3;
  const ox = cx - size / 2;
  const oy = cy - size / 2;
  const currentGrid = mode === '先天' ? XIANTIAN_GRID : HOUTIAN_GRID;
  const getPos = (grid: (GuaName | null)[][], g: GuaName) => {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (grid[r][c] === g) return {x: ox + c * cell, y: oy + r * cell};
    return {x: ox + cell, y: oy + cell};
  };
  const title = morph ? morph.from : mode;
  const transitionK = morph ? clamp01((N - morph.at) / 36) : 1;
  const fromGrid = morph?.from === '先天' ? XIANTIAN_GRID : HOUTIAN_GRID;
  const toGrid = morph?.to === '先天' ? XIANTIAN_GRID : HOUTIAN_GRID;
  const allGua = GUA_ORDER;

  return (
    <div style={{opacity}}>
      {/* 九宫网格：用细墨线，不用黑底卡片 */}
      <svg width={size} height={size} style={{position: 'absolute', left: ox, top: oy, overflow: 'visible'}}>
        <rect x={0} y={0} width={size} height={size} fill="rgba(255,253,246,0.35)" stroke={RULE} strokeWidth={STROKE.thin} />
        <line x1={cell} y1={0} x2={cell} y2={size} stroke={RULE} strokeWidth={STROKE.hair} />
        <line x1={cell * 2} y1={0} x2={cell * 2} y2={size} stroke={RULE} strokeWidth={STROKE.hair} />
        <line x1={0} y1={cell} x2={size} y2={cell} stroke={RULE} strokeWidth={STROKE.hair} />
        <line x1={0} y1={cell * 2} x2={size} y2={cell * 2} stroke={RULE} strokeWidth={STROKE.hair} />
      </svg>

      {/* 中宫：绝对画布坐标；洛书数 5 位于中格右上角，与八宫数字样式一致 */}
      {showLuoshu ? (
        <CText cx={ox + 2 * cell - 15} cy={oy + cell + 15} size={22} weight={700}
          family={FONT_NUM} color={INK_SOFT}>5</CText>
      ) : null}
      <CText cx={cx} cy={cy} size={32} weight={500} family={FONT_KAI} color={INK_FAINT}>
        中
      </CText>

      {/* 八个卦：morph 时按 identity 从旧宫移向新宫 */}
      {allGua.map((g, i) => {
        const p = clamp01((N - (f0 + i * 3)) / 12);
        if (p <= 0) return null;
        const from = morph ? getPos(fromGrid, g) : getPos(currentGrid, g);
        const to = morph ? getPos(toGrid, g) : from;
        const k = morph ? transitionK : 1;
        const x = from.x + (to.x - from.x) * k;
        const y = from.y + (to.y - from.y) * k;
        const col = Math.round((x - ox) / cell);
        const row = Math.round((y - oy) / cell);
        const fw = RC_FANGWEI[row]?.[col] ?? '';
        // 洛书数固定属于后天宫位；先天模式只显示先天数
        const info = GUA[g];
        const num = morph
          ? Math.round(info.xianTian + (info.houTian - info.xianTian) * transitionK)
          : mode === '先天' ? info.xianTian : info.houTian;
        const active = focusGua === g;
        return (
          <PalaceCell key={g} x={x} y={y} w={cell} h={cell} gua={g} fangwei={fw}
            num={num} active={active} showNum={showLuoshu} showFangwei={showCompass}
            p={p} lit={active ? 1 : 0} mode="glyph" />
        );
      })}

      {/* 方向标识：明确上南下北 */}
      {showCompass ? (
        <div style={{opacity: clamp01((N - f0 - 18) / 10)}}>
          <CText cx={cx} cy={oy - 26} size={22} family={FONT_KAI} color={INK_FAINT}>南 ↑</CText>
          <CText cx={cx} cy={oy + size + 26} size={22} family={FONT_KAI} color={INK_FAINT}>北 ↓</CText>
          <CText cx={ox - 34} cy={cy} size={20} family={FONT_KAI} color={INK_FAINT}>东</CText>
          <CText cx={ox + size + 34} cy={cy} size={20} family={FONT_KAI} color={INK_FAINT}>西</CText>
        </div>
      ) : null}

      {/* 图名 */}
      <CText cx={cx} cy={oy + size + (showCompass ? 60 : 36)} size={27} weight={700}
        family={FONT_KAI_BOLD} color={morph ? CINNABAR : INK_MID}>
        {morph ? (transitionK < 0.5 ? '先天八卦' : '后天八卦') : `${title}八卦`}
      </CText>
      {morph ? (
        <CText cx={cx} cy={oy + size + (showCompass ? 90 : 66)} size={20} family={FONT_KAI}
          color={INK_FAINT} opacity={clamp01(transitionK * (1 - transitionK) * 4)}>
          阴阳未交 → 阴阳相交
        </CText>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- 2b. 先天 / 后天并排移宫追踪

/** 并排对照先天与后天两张静态方位图；按卦名逐个点亮对应旧宫/新宫，避免同一宫格里八卦重叠穿行。 */
export const BaguaCompare: React.FC<{
  cx:number; cy:number; size?:number; N:number; f0:number; stepFrames?:number; opacity?:number;
}> = ({cx=640,cy=360,size=270,N,f0,stepFrames=16,opacity=1}) => {
  const cell=size/3;
  const leftX=cx-size-66, rightX=cx+66, topY=cy-size/2;
  const elapsed=Math.max(0,N-f0);
  const index=Math.min(GUA_ORDER.length-1,Math.floor(elapsed/stepFrames));
  const active=elapsed<0?null:GUA_ORDER[index];
  const pos=(grid:(GuaName|null)[][],g:GuaName)=>{
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(grid[r][c]===g)return {r,c};
    return {r:1,c:1};
  };
  const drawGrid=(grid:(GuaName|null)[][],x:number,which:'先天'|'后天')=> <React.Fragment key={which}>
    <svg width={size} height={size} style={{position:'absolute',left:x,top:topY,pointerEvents:'none'}}>
      <rect x={0} y={0} width={size} height={size} fill="rgba(255,253,246,0.32)" stroke={RULE} strokeWidth={STROKE.thin}/>
      <line x1={cell} y1={0} x2={cell} y2={size} stroke={RULE} strokeWidth={STROKE.hair}/>
      <line x1={2*cell} y1={0} x2={2*cell} y2={size} stroke={RULE} strokeWidth={STROKE.hair}/>
      <line x1={0} y1={cell} x2={size} y2={cell} stroke={RULE} strokeWidth={STROKE.hair}/>
      <line x1={0} y1={2*cell} x2={size} y2={2*cell} stroke={RULE} strokeWidth={STROKE.hair}/>
    </svg>
    {grid.map((row,r)=>row.map((g,c)=>{
      const x0=x+c*cell,y0=topY+r*cell;
      if(!g)return null;
      const info=GUA[g];
      const num=which==='先天'?info.xianTian:info.houTian;
      return <PalaceCell key={`${which}-${g}`} x={x0} y={y0} w={cell} h={cell} gua={g}
        fangwei={which==='先天'?info.xianFang:info.houFang} num={num}
        active={active===g} lit={active===g?1:0} showNum showFangwei p={1} mode="glyph"/>;
    }))}
    {which==='后天'?<>
      <CText cx={x+2*cell-15} cy={topY+cell+15} size={22} weight={700} family={FONT_NUM} color={INK_SOFT}>5</CText>
      <CText cx={x+1.5*cell} cy={topY+1.5*cell} size={25} family={FONT_KAI} color={INK_FAINT}>中</CText>
    </>:null}
  </React.Fragment>;
  const caption=active?`${active}：先天${GUA[active].xianFang} → 后天${GUA[active].houFang}`:'逐卦追踪方位变化';
  return <div style={{opacity}}>
    <CText cx={leftX+size/2} cy={topY-38} size={26} weight={700} family={FONT_KAI_BOLD} color={INK}>先天八卦</CText>
    <CText cx={rightX+size/2} cy={topY-38} size={26} weight={700} family={FONT_KAI_BOLD} color={INK}>后天八卦</CText>
    <CText cx={leftX+size/2} cy={topY-12} size={18} family={FONT_KAI} color={INK_FAINT}>南 ↑ · 左东右西 · 北 ↓</CText>
    <CText cx={rightX+size/2} cy={topY-12} size={18} family={FONT_KAI} color={INK_FAINT}>南 ↑ · 左东右西 · 北 ↓</CText>
    {drawGrid(XIANTIAN_GRID,leftX,'先天')}
    {drawGrid(HOUTIAN_GRID,rightX,'后天')}
    <CText cx={cx} cy={cy} size={26} weight={700} family={FONT_KAI_BOLD} color={CINNABAR}>→</CText>
    <CText cx={cx} cy={topY+size+58} size={24} weight={700} family={FONT_KAI_BOLD} color={active?CINNABAR:INK_SOFT}>
      {caption}
    </CText>
  </div>;
};

// ---------------------------------------------------------------- 3. 四象数盘

/** 四象四格：太阳九、少阴八、少阳七、太阴六。逐格拆出两爻（最底层数理）。 */
export const SiXiangPanel: React.FC<{
  x: number; y: number; w?: number; h?: number;
  N: number; f0: number;
  active?: string;
  opacity?: number;
}> = ({x, y, w = 520, h = 260, N, f0, active, opacity = 1}) => {
  const gap = 10;
  const cw = (w - gap) / 2;
  const ch = (h - gap) / 2;
  return (
    <div style={{opacity}}>
      {SIXIANG.map((s, i) => {
        const row = Math.floor(i / 2), col = i % 2;
        const xx = x + col * (cw + gap), yy = y + row * (ch + gap);
        const p = clamp01((N - (f0 + i * 7)) / 15);
        if (p <= 0) return null;
        const is = active === s.name;
        const stroke = is ? CINNABAR : RULE;
        const fill = is ? CINNABAR_WASH : 'rgba(255,253,246,0.45)';
        return (
          <div key={s.name} style={{opacity: p}}>
            <div style={{...abs(xx, yy, cw, ch), boxSizing: 'border-box', border: `${is ? STROKE.bold : STROKE.thin}px solid ${stroke}`, background: fill, borderRadius: RADIUS.card}} />
            {/* 两爻：阳实线、阴断线（自下而上） */}
            {s.yao.map((kind, j) => (
              <div key={j} style={{opacity: clamp01((N - (f0 + i * 7 + 5 + j * 4)) / 8)}}>
                <YaoLine cx={xx + cw * 0.33} cy={yy + ch * 0.43 + (1 - j) * 23}
                         w={cw * 0.40} h={7} kind={kind} color={is ? CINNABAR : INK_MID} />
              </div>
            ))}
            <CText cx={xx + cw * 0.78} cy={yy + ch * 0.34} size={28} weight={700} family={FONT_KAI_BOLD}
              color={is ? CINNABAR : INK}>{s.name}</CText>
            <CText cx={xx + cw * 0.78} cy={yy + ch * 0.66} size={38} weight={700} family={FONT_NUM}
              color={is ? CINNABAR : INK_MID}>{s.num}</CText>
            <CText cx={xx + cw / 2} cy={yy + ch - 15} size={19} family={FONT_KAI} color={INK_FAINT}>
              {s.season} · {s.desc.slice(0, 7)}
            </CText>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- 4. 策轨数理四格

/** 策轨数「原会运世」四项分工盘，带逐步填数 / 缺数标记。 */
export const CeGuiBoard: React.FC<{
  x: number; y: number; w?: number; h?: number;
  values: Partial<Record<CeGuiSlot, number | string | null>>;
  N: number; f0: number;
  active?: CeGuiSlot;
  /** 哪些宫位缺数 */
  missing?: CeGuiSlot[];
  /** 显示元会运世层级连接线 */
  hierarchy?: boolean;
  opacity?: number;
}> = ({x, y, w = 600, h = 250, values, N, f0, active, missing = [], hierarchy = true, opacity = 1}) => {
  const gap = 12;
  const cw = (w - gap * 3) / 4;
  const slots = CEGUI_SLOTS as readonly CeGuiSlot[];
  return (
    <div style={{opacity}}>
      {slots.map((s, i) => {
        const xx = x + i * (cw + gap);
        const p = clamp01((N - (f0 + i * 10)) / 16);
        if (p <= 0) return null;
        const is = active === s;
        const miss = missing.includes(s) || values[s] === null;
        const stroke = is ? CINNABAR : miss ? INK_FAINT : RULE;
        const bg = is ? CINNABAR_WASH : 'rgba(255,253,246,0.45)';
        return (
          <div key={s} style={{opacity: p}}>
            <div style={{...abs(xx, y, cw, h), boxSizing: 'border-box', border: `${is ? STROKE.bold : STROKE.thin}px solid ${stroke}`, background: bg, borderRadius: RADIUS.card}} />
            <CText cx={xx + cw / 2} cy={y + 34} size={27} weight={700} family={FONT_KAI_BOLD}
              color={is ? CINNABAR : INK_MID}>{s}</CText>
            {miss ? (
              <>
                <CText cx={xx + cw / 2} cy={y + h * 0.60} size={42} weight={400} family={FONT_KAI}
                  color={INK_FAINT}>缺</CText>
                <CText cx={xx + cw / 2} cy={y + h - 24} size={20} family={FONT_KAI} color={CINNABAR_SOFT}>空数</CText>
              </>
            ) : (
              <CText cx={xx + cw / 2} cy={y + h * 0.62} size={50} weight={700} family={FONT_NUM}
                color={is ? CINNABAR : INK}>{String(values[s] ?? '—')}</CText>
            )}
            {/* 层级连线：元→会→运→世 */}
            {hierarchy && i < 3 ? (
              <div style={{opacity: clamp01((N - f0 - 52) / 12)}}>
                <CText cx={xx + cw + gap / 2} cy={y + h / 2} size={20} family={FONT_KAI} color={INK_FAINT}>之下</CText>
              </div>
            ) : null}
          </div>
        );
      })}
      {hierarchy ? (
        <CText cx={x + w / 2} cy={y + h + 32} size={20} family={FONT_KAI} color={INK_FAINT}>
          元为天 · 会为地 · 运为人 · 世为事
        </CText>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- 5. 应期推演时间轴

export interface YingqiPoint { label: string; kind?: string; hit?: boolean; note?: string; }

/** 应期推演时间轴：把「怎么算到这个日子」一步步落到时间刻度上。 */
export const YingqiTimeline: React.FC<{
  x: number; y: number; w?: number;
  points: YingqiPoint[];
  N: number; f0: number;
  activeIndex?: number;
  opacity?: number;
}> = ({x, y, w = 900, points, N, f0, activeIndex, opacity = 1}) => {
  const lineY = y + 50;
  const gapX = w / Math.max(points.length - 1, 1);
  const endAt = f0 + 24 + points.length * 10;
  return (
    <div style={{opacity}}>
      {/* 时间基线 */}
      <svg width={1280} height={720} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <line x1={x} y1={lineY} x2={x + w} y2={lineY} stroke={RULE} strokeWidth={STROKE.thin} />
        {/* 刻度 */}
        {points.map((_, i) => {
          const px = x + i * gapX;
          const p = clamp01((N - (f0 + 24 + i * 10)) / 8);
          return p <= 0 ? null : <line key={i} x1={px} y1={lineY - 8} x2={px} y2={lineY + 8} stroke={INK_FAINT} strokeWidth={STROKE.thin} opacity={p} />;
        })}
      </svg>
      {points.map((pt, i) => {
        const px = x + i * gapX;
        const p = clamp01((N - (f0 + 24 + i * 10)) / 10);
        if (p <= 0) return null;
        const is = activeIndex === i || pt.hit;
        const col = is ? CINNABAR : INK_SOFT;
        const r = is ? 9 : 6;
        return (
          <div key={i} style={{opacity: p}}>
            <div style={{...abs(px - r, lineY - r, r * 2, r * 2), borderRadius: r, background: is ? CINNABAR : PAPER, border: `${is ? 2 : 1.5}px solid ${col}`}} />
            <CText cx={px} cy={lineY - 26} size={22} weight={is ? 700 : 500} family={FONT_KAI_BOLD}
              color={col}>{pt.label}</CText>
            {pt.kind ? <CText cx={px} cy={lineY + 28} size={18} family={FONT_KAI} color={INK_FAINT}>{pt.kind}</CText> : null}
            {pt.note ? <CText cx={px} cy={lineY + 54} size={18} family={FONT_KAI} color={INK_SOFT}>{pt.note}</CText> : null}
            {is ? <CText cx={px} cy={lineY - 48} size={18} family={FONT_KAI} color={CINNABAR}>应期</CText> : null}
          </div>
        );
      })}
    </div>
  );
};

// helper to prevent unused imports in tree-shaken demos
void [GUA_ORDER, SHENG, KE, WANGSHUAI, YUAN_HUI_YUN_SHI, WUXING_ANGLE, hexName, makeHex, huGua, bianGua, relate, RELATION_COLOR, INK_MID, INK_SOFT, INK_FAINT, PAPER, INDIGO, INDIGO_SOFT, mix, inkSpread, inkDry, CINNABAR_SOFT];