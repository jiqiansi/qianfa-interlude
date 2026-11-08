import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Fonts} from '../../common/lib';
import {clamp01, easeOutCubic, easeInOutCubic, rnd} from '../../common/easing';
import {FONT_KAI, FONT_KAI_BOLD} from '../../shushu/paper';

/**
 * 暗场纸本 · 电影感引擎（v2）
 *
 * 与 v1（浅色纸面 + 四种纸上动作）是**两套皮肤**，但共用同一套品牌事实：
 *   · 朱砂 `#B23A2E`（亮档 `#E0503C`）仍是**唯一焦点色**，一屏一处；
 *   · 青碧 `#4E8B78` / `#3DA874` 只做结构线，藤黄 `#C9A227` 只做轮廓光；
 *   · 正文与标题仍是霞鹜文楷，不改字；
 *   · 暗底取自品牌基线的深色模式（`#12181B / #1A2328 / #1F2D33 / #2D4047 / #D4E1E8`），
 *     不是另起一套「科幻黑」——所以纸本课与暗场片头放在一起仍是一家。
 *
 * v2 的动词换成电影语言：**光、纵深、玻璃、粒子、冲击**。
 * 所有动画仍是帧的纯函数（只用 `rnd(seed,i)`，不用 Math.random），可确定性重渲。
 */

// ---------------------------------------------------------------- 暗场调色板
export const DK = {
  page: '#0B0F12',
  deep: '#12181B',
  card: '#1A2328',
  elev: '#1F2D33',
  border: '#2D4047',
  text: '#D4E1E8',
  muted: '#8FA6B2',
  dim: '#5E7077',
} as const;

/** 亮色档：暗底上的发光色。朱砂=焦点，藤黄=轮廓光，青碧=结构，冰蓝=环境。 */
export const LIT = {
  cinnabar: '#E0503C',
  cinnabarDeep: '#B23A2E',
  gold: '#C9A227',
  celadon: '#3DA874',
  ice: '#8AD8E8',
  paper: '#F6F0DF',
} as const;

export const cineA = (hex: string, a: number) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${clamp01(a).toFixed(3)})`;
};

export const cn = (n: number) => useCurrentFrame() + 1 + n;

// ---------------------------------------------------------------- 舞台

/**
 * 暗场舞台：底 + 体积光柱 + 雾 + 尘埃 + 暗角 + 颗粒 +（可选）2.35:1 遮幅。
 * 这是所有 v2 片段的公共底；`children` 是被照亮的实物（纸、玻璃、字）。
 */
export const DarkStage: React.FC<{
  children?: React.ReactNode;
  /** 主光方向：'left' | 'right' | 'top'（决定光柱与高光偏哪边） */
  key?: 'left' | 'right' | 'top';
  bars?: boolean;
  dust?: number;
  grain?: number;
  fog?: number;
  /** 整体色温（0 冷 / 1 暖），用于让不同片段的暗场气质有差别 */
  warm?: number;
}> = ({children, key = 'left', bars = true, dust = 150, grain = 0.055, fog = 0.5, warm = 0.65}) => {
  const n = useCurrentFrame() + 1;
  const keyX = key === 'left' ? '18%' : key === 'right' ? '82%' : '50%';
  const tint = warm >= 0.5 ? `rgba(255,226,178,${(0.05 + 0.05 * warm).toFixed(3)})` : `rgba(160,205,230,0.08)`;
  return (
    <AbsoluteFill style={{background: DK.page, overflow: 'hidden'}}>
      <Fonts />
      {/* 底：中央略亮、四角沉下去 */}
      <AbsoluteFill style={{
        background: `radial-gradient(120% 90% at ${keyX} 42%, ${DK.card} 0%, ${DK.deep} 42%, ${DK.page} 78%, #05080A 100%)`,
      }} />
      {/* 主光柱：两束斜向体积光，随时间极缓漂移 */}
      <AbsoluteFill style={{opacity: 0.55}}>
        {[0, 1].map((i) => {
          const ph = n * 0.006 + i * 1.7;
          const x = (i === 0 ? 0.30 : 0.62) + 0.03 * Math.sin(ph);
          const w = i === 0 ? 0.26 : 0.14;
          return (
            <div key={i} style={{
              position: 'absolute', left: `${(x - w / 2) * 100}%`, top: '-25%', width: `${w * 100}%`, height: '150%',
              transform: `rotate(${i === 0 ? 14 : -11}deg)`,
              background: `linear-gradient(180deg, ${tint} 0%, rgba(255,255,255,0.02) 62%, rgba(255,255,255,0) 100%)`,
              filter: `blur(${28 + 10 * i}px)`,
              opacity: 0.5 - i * 0.16,
            }} />
          );
        })}
      </AbsoluteFill>
      {/* 雾：两层大面积柔光缓慢平移 */}
      {fog > 0 ? (
        <AbsoluteFill style={{opacity: fog}}>
          {[0, 1].map((i) => {
            const ph = n * (i ? -0.004 : 0.005);
            return (
              <div key={i} style={{
                position: 'absolute', left: `${-20 + 22 * i + 12 * Math.sin(ph)}%`, top: `${-10 + 8 * i}%`,
                width: '90%', height: '70%', borderRadius: '50%',
                background: `radial-gradient(circle, ${i ? 'rgba(140,170,190,0.10)' : 'rgba(255,232,196,0.10)'} 0%, rgba(0,0,0,0) 68%)`,
                filter: 'blur(46px)',
              }} />
            );
          })}
        </AbsoluteFill>
      ) : null}
      {children}
      <Dust n={dust} />
      {/* 暗角 + 颗粒 */}
      <AbsoluteFill style={{background: 'radial-gradient(75% 60% at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.55) 100%)'}} />
      <Grain k={grain} />
      {bars ? <Letterbox /> : null}
    </AbsoluteFill>
  );
};

/** 2.35:1 遮幅（上下黑边）—— 一眼「电影」。 */
export const Letterbox: React.FC<{k?: number}> = ({k = 1}) => (
  <>
    <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: 88 * k, background: '#04070A'}} />
    <div style={{position: 'absolute', left: 0, bottom: 0, width: '100%', height: 88 * k, background: '#04070A'}} />
  </>
);

/**
 * 尘埃粒子（有纵深）：size/blur/亮度由 z 决定，越近越大越亮、越远越糊。
 * 数量控在 200 以内 —— 每颗是一个 DOM 节点，铺满屏的多层模糊会很贵。
 */
export const Dust: React.FC<{n?: number; seed?: number; speed?: number; opacity?: number}> = ({
  n = 150, seed = 3, speed = 1, opacity = 1,
}) => {
  const fr = useCurrentFrame() + 1;
  const H = 720;
  if (n <= 0) return null;
  return (
    <AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
      {Array.from({length: n}, (_, i) => {
        const z = rnd(seed, i);                       // 0 远 1 近
        const x0 = rnd(seed + 1, i) * 1280;
        const y0 = rnd(seed + 2, i) * H;
        const sp = (6 + 26 * z) * speed;
        const y = (y0 - fr * sp) % (H + 80);
        const yy = y < -40 ? y + H + 80 : y;
        const x = x0 + 16 * z * Math.sin(fr * 0.013 + i);
        const s = 0.8 + 3.4 * z;
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(fr * 0.05 + i * 1.3));   // ≤1.6Hz，不闪
        return (
          <div key={i} style={{
            position: 'absolute', left: x, top: yy, width: s, height: s, borderRadius: s,
            background: z > 0.72 ? LIT.paper : 'rgba(226,236,242,0.9)',
            opacity: (0.10 + 0.55 * z) * tw,
            filter: z < 0.35 ? `blur(${(1.4 * (0.35 - z) * 4).toFixed(1)}px)` : undefined,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** 胶片颗粒：SVG 湍流 + 逐帧位移（不改变种子，避免每帧重新生成噪声的抖动感过强）。 */
export const Grain: React.FC<{k?: number}> = ({k = 0.05}) => {
  const fr = useCurrentFrame() + 1;
  if (k <= 0) return null;
  const dx = (rnd(7, fr % 97) - 0.5) * 12;
  const dy = (rnd(8, fr % 89) - 0.5) * 12;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay'}}>
      <svg width="1280" height="720" style={{position: 'absolute', left: -12, top: -12}}>
        <filter id="cine-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect x={0} y={0} width="1304" height="744" filter="url(#cine-grain)" opacity={k}
              transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** 体积光扫过：一条很宽的高光带斜扫全屏（"镜头掠过"的感觉）。 */
export const LightSweep: React.FC<{
  p: number; angle?: number; w?: number; k?: number; color?: string;
}> = ({p, angle = 18, w = 0.45, k = 1, color = 'rgba(255,244,220,0.5)'}) => {
  const t = clamp01(p);
  if (t <= 0 || t >= 1) return null;
  const x = -60 + 140 * t;                                 // 百分比
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: k}}>
      <div style={{
        position: 'absolute', left: `${x}%`, top: '-30%', width: `${w * 100}%`, height: '160%',
        transform: `rotate(${angle}deg)`,
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${color} 48%, rgba(255,255,255,0) 100%)`,
        filter: 'blur(26px)',
      }} />
    </AbsoluteFill>
  );
};

/** 变形镜头光斑（anamorphic flare）：横向拉丝 + 中心核 + 冷色回声。 */
export const Flare: React.FC<{x: number; y: number; k: number; len?: number; color?: string}> = ({
  x, y, k, len = 420, color = LIT.cinnabar,
}) => {
  const t = clamp01(k);
  if (t <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: t}}>
      <div style={{
        position: 'absolute', left: x - len / 2, top: y - 3, width: len, height: 6, borderRadius: 3,
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${cineA(color, 0.85)} 50%, rgba(255,255,255,0) 100%)`,
        filter: 'blur(4px)',
      }} />
      <div style={{
        position: 'absolute', left: x - len * 0.62, top: y - 1.2, width: len * 1.24, height: 2.4,
        background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${cineA(LIT.ice, 0.5)} 50%, rgba(255,255,255,0) 100%)`,
        filter: 'blur(3px)',
      }} />
      <div style={{
        position: 'absolute', left: x - 70, top: y - 70, width: 140, height: 140, borderRadius: 70,
        background: `radial-gradient(circle, ${cineA(color, 0.6)} 0%, ${cineA(color, 0.16)} 34%, rgba(0,0,0,0) 70%)`,
        filter: 'blur(6px)',
      }} />
    </AbsoluteFill>
  );
};

/**
 * 磨砂玻璃板：暗场里的"HUD 卡片"。
 * backdrop-filter 是关键（真磨砂），另加内高光、边缘描边、扫过的镜面反光。
 */
export const GlassSlab: React.FC<{
  x: number; y: number; w: number; h: number;
  /** 3D 姿态 */
  rx?: number; ry?: number; rz?: number; z?: number;
  p?: number;                       // 出现进度（位移 + 淡入）
  from?: 'left' | 'right' | 'bottom' | 'top';
  children?: React.ReactNode;
  sweep?: number;                   // 镜面反光进度
  edge?: string;                    // 左侧细线颜色（默认朱砂）
  r?: number;
  blurPx?: number;
}> = ({x, y, w, h, rx = 0, ry = 0, rz = 0, z = 60, p = 1, from = 'bottom', children,
  sweep = 0, edge = LIT.cinnabar, r = 14, blurPx = 22}) => {
  const t = easeOutCubic(clamp01(p));
  if (t <= 0) return null;
  const dx = from === 'left' ? -220 * (1 - t) : from === 'right' ? 220 * (1 - t) : 0;
  const dy = from === 'bottom' ? 120 * (1 - t) : from === 'top' ? -120 * (1 - t) : 0;
  const sw = clamp01(sweep);
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${z * t}px) rotateX(${rx}deg) rotateY(${ry * (1 - 0.6 * t)}deg) rotateZ(${rz}deg)`,
      transformStyle: 'preserve-3d',
      opacity: t,
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: r, overflow: 'hidden',
        background: `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.035) 42%, rgba(255,255,255,0.07) 100%)`,
        backdropFilter: `blur(${blurPx}px) saturate(150%)`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(150%)`,
        border: `1px solid ${cineA(DK.text, 0.16)}`,
        boxShadow: `0 30px 70px rgba(0,0,0,0.60), inset 0 1px 0 ${cineA('#FFFFFF', 0.22)}, inset 0 0 40px ${cineA('#FFFFFF', 0.05)}`,
      }}>
        {/* 板内细微颗粒（磨砂感） */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'overlay',
          backgroundImage: 'repeating-radial-gradient(circle at 30% 20%, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0) 2px)',
          backgroundSize: '5px 5px',
        }} />
        {/* 镜面反光扫过 */}
        <div style={{
          position: 'absolute', top: '-40%', bottom: '-40%', width: '38%',
          left: `${-45 + 130 * sw}%`, transform: 'rotate(14deg)',
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)',
          filter: 'blur(6px)', opacity: sw > 0 && sw < 1 ? 1 : 0,
        }} />
      </div>
      {/* 左侧焦点细线：朱砂只标"当前这一条" */}
      {edge ? (
        <div style={{
          position: 'absolute', left: 0, top: h * 0.18, width: 2.4, height: h * 0.64, borderRadius: 2,
          background: edge, boxShadow: `0 0 12px ${cineA(edge, 0.75)}`, opacity: 0.9,
        }} />
      ) : null}
      <div style={{position: 'absolute', inset: 0}}>{children}</div>
    </div>
  );
};

/**
 * 3D 立体字：多层叠片 + 透视旋转，做出"从纸面抬起"的厚度。
 * 不用 WebGL —— Chromium 的 CSS 3D 足够，而且不怕无 GPU 环境。
 */
export const Extrude: React.FC<{
  text: string; size?: number; cx: number; cy: number;
  layers?: number; depth?: number;      // 每层 z 间距与总厚度
  rx?: number; ry?: number;
  color?: string; side?: string; glow?: string;
  p?: number;                           // 抬起进度 0→1
  family?: string; weight?: number; letterSpacing?: number;
}> = ({text, size = 92, cx, cy, layers = 10, depth = 26, rx = 8, ry = -16, color = LIT.paper,
  side = '#6E6353', glow = LIT.cinnabar, p = 1, family = FONT_KAI_BOLD, weight = 700, letterSpacing = 6}) => {
  const t = easeOutCubic(clamp01(p));
  if (t <= 0) return null;
  const lift = -depth * (1 - t);            // 从纸面（z<0）抬到 z≈0
  const shadow = `0 ${(6 * t).toFixed(1)}px ${(18 * t).toFixed(1)}px rgba(0,0,0,${(0.55 * t).toFixed(2)})`;
  const common: React.CSSProperties = {
    position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%)',
    fontFamily: family, fontWeight: weight, fontSize: size, letterSpacing,
    whiteSpace: 'nowrap', lineHeight: 1,
  };
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 900, transformStyle: 'preserve-3d'}}>
      <div style={{
        position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
        transform: `rotateX(${(rx * t).toFixed(2)}deg) rotateY(${(ry * t).toFixed(2)}deg)`,
      }}>
        {/* 厚度：背面到正面递减亮度 */}
        {Array.from({length: layers}, (_, i) => {
          const k = 1 - i / layers;
          return (
            <div key={i} style={{
              ...common,
              transform: `translate(-50%,-50%) translateZ(${(lift - (i + 1) * (depth / layers)).toFixed(2)}px)`,
              color: i === layers - 1 ? side : `rgb(${Math.round(110 * k + 40)},${Math.round(99 * k + 36)},${Math.round(83 * k + 30)})`,
              opacity: 0.92,
            }}>{text}</div>
          );
        })}
        {/* 正面：纸色 + 内发光 + 朱砂外晕（焦点光） */}
        <div style={{...common, transform: `translate(-50%,-50%) translateZ(${lift.toFixed(2)}px)`,
          color, textShadow: `${shadow}, 0 0 ${(10 * t).toFixed(0)}px ${cineA('#FFF3D8', 0.35 * t)}, 0 0 ${(34 * t).toFixed(0)}px ${cineA(glow, 0.45 * t)}`}}>
          {text}
        </div>
      </div>
    </div>
  );
};

/** 悬浮宣纸（3D）：被光打亮的纸，边缘起翘、表面有帘纹与掠射高光。 */
export const Sheet3D: React.FC<{
  cx: number; cy: number; w?: number; h?: number;
  rx?: number; ry?: number; rz?: number; z?: number;
  p?: number;                       // 升起进度
  lit?: number;                     // 打亮程度 0–1
  children?: React.ReactNode;
  sheen?: number;                   // 掠射高光位置
}> = ({cx, cy, w = 900, h = 506, rx = 10, ry = -12, rz = -1.2, z = 0, p = 1, lit = 1, children, sheen = 0.4}) => {
  const t = easeOutCubic(clamp01(p));
  if (t <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 1100, transformStyle: 'preserve-3d'}}>
      <div style={{
        position: 'absolute', left: cx, top: cy, width: w, height: h,
        transform: `translate(-50%,-50%) translateZ(${(z - 420 * (1 - t)).toFixed(1)}px) rotateX(${(rx * (0.5 + 0.5 * t)).toFixed(2)}deg) rotateY(${(ry * (1.4 - 0.4 * t)).toFixed(2)}deg) rotateZ(${rz}deg)`,
        transformStyle: 'preserve-3d',
        opacity: 0.15 + 0.85 * t,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(118deg, #FFF8E6 0%, #F6F0DF 38%, #EADFC6 100%)`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.65), 0 0 ${(46 * lit).toFixed(0)}px ${cineA('#FFE9B8', 0.28 * lit)}, inset 0 0 60px rgba(150,120,70,0.14)`,
          borderRadius: 2,
        }}>
          {/* 帘纹 + 纤维 + 掠射高光 */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.5,
            backgroundImage: 'repeating-linear-gradient(180deg, rgba(150,132,96,0.10) 0px, rgba(150,132,96,0.10) 1px, rgba(150,132,96,0) 1px, rgba(150,132,96,0) 26px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(${100 + 40 * sheen}deg, rgba(255,255,255,0) ${(20 + 40 * sheen).toFixed(0)}%, rgba(255,255,255,0.30) ${(46 + 20 * sheen).toFixed(0)}%, rgba(255,255,255,0) ${(70 + 10 * sheen).toFixed(0)}%)`,
            mixBlendMode: 'soft-light',
          }} />
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(120% 100% at ${(20 + 50 * sheen).toFixed(0)}% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0) 62%)`}} />
        </div>
        {/* 纸下的投影（和纸分离一点，才有"悬空"感） */}
        <div style={{
          position: 'absolute', left: '4%', right: '4%', top: h + 26, height: 40,
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0) 75%)',
          filter: 'blur(10px)', transform: 'translateZ(-30px)',
        }} />
        <div style={{position: 'absolute', inset: 0}}>{children}</div>
      </div>
    </div>
  );
};

/**
 * 粒子爆发 / 冲击波 / 闪白。
 * `t` = 爆发后秒数（0 起）。粒子用「初速 + 阻尼」解析式，不用逐帧积分 —— 保证任意帧可跳渲。
 */
export const Burst: React.FC<{
  cx: number; cy: number; t: number; qty?: number; seed?: number;
  color?: string; color2?: string; spread?: number; life?: number;
  ring?: boolean; flash?: boolean; gravity?: number;
}> = ({cx, cy, t, qty = 120, seed = 11, color = LIT.cinnabar, color2 = DK.text, spread = 320,
  life = 1.1, ring = true, flash = true, gravity = 240}) => {
  const s = Math.max(0, t);
  if (s <= 0 || s > life * 1.6) return null;
  const parts = Array.from({length: qty}, (_, i) => {
    const a = rnd(seed, i) * Math.PI * 2;
    const v = (0.35 + 0.65 * rnd(seed + 1, i)) * spread;
    const k = 5.5;                                   // 阻尼
    const r = (v / k) * (1 - Math.exp(-k * s));
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a) + 0.5 * gravity * s * s;
    const fade = clamp01(1 - s / (life * (0.6 + 0.6 * rnd(seed + 2, i))));
    const sz = (1 + 3.2 * rnd(seed + 3, i)) * (0.4 + 0.6 * fade);
    return {x, y, fade, sz, c: rnd(seed + 4, i) > 0.62 ? color : color2};
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {flash && s < 0.16 ? (
        <div style={{
          position: 'absolute', left: cx - 260, top: cy - 260, width: 520, height: 520, borderRadius: 260,
          background: `radial-gradient(circle, ${cineA('#FFF6E2', 0.55 * (1 - s / 0.16))} 0%, rgba(255,255,255,0) 62%)`,
        }} />
      ) : null}
      <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
        {ring ? [0, 1, 2].map((i) => {
          const rr = (60 + 260 * i * 0.42) * easeOutCubic(clamp01(s / (0.5 + i * 0.18)));
          const op = clamp01(1 - s / (0.55 + i * 0.22)) * (i === 0 ? 0.5 : i === 1 ? 0.28 : 0.16);
          if (op <= 0.01) return null;
          return <ellipse key={i} cx={cx} cy={cy} rx={rr} ry={rr * 0.52} fill="none"
                          stroke={i === 0 ? color : color2} strokeWidth={2.4 - i * 0.6} opacity={op}
                          style={{filter: 'blur(1.5px)'}} />;
        }) : null}
        {parts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.sz} fill={p.c} opacity={0.85 * p.fade} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** 雾中凝字：模糊度与字距随进度收敛（"从雾里凝出来"）。 */
export const CondenseText: React.FC<{
  text: string; cx: number; cy: number; size?: number; p: number;
  color?: string; glow?: string; letterSpacing?: number; family?: string; weight?: number;
}> = ({text, cx, cy, size = 96, p, color = DK.text, glow = LIT.ice, letterSpacing = 26, family = FONT_KAI_BOLD, weight = 700}) => {
  const t = clamp01(p);
  if (t <= 0) return null;
  const blur = 18 * (1 - t);
  return (
    <div style={{
      position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%)',
      fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1,
      letterSpacing: (letterSpacing * (1 - t) + 4 * t).toFixed(2),
      color, opacity: 0.25 + 0.75 * t,
      filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
      textShadow: `0 0 ${(28 * t).toFixed(0)}px ${cineA(glow, 0.35 * t)}, 0 2px 12px rgba(0,0,0,0.6)`,
      whiteSpace: 'nowrap',
    }}>{text}</div>
  );
};

/** 小字副题（暗场正文）：低对比、字距大，压在玻璃板上或直接浮在暗场里。 */
export const CineCaption: React.FC<{
  text: string; cx: number; cy: number; size?: number; p?: number; color?: string; letterSpacing?: number;
}> = ({text, cx, cy, size = 26, p = 1, color = DK.muted, letterSpacing = 6}) => {
  const t = clamp01(p);
  if (t <= 0) return null;
  return (
    <div style={{
      position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) translateY(${(10 * (1 - t)).toFixed(1)}px)`,
      fontFamily: FONT_KAI, fontSize: size, letterSpacing, color, opacity: t,
      textShadow: '0 2px 10px rgba(0,0,0,0.7)', whiteSpace: 'nowrap',
    }}>{text}</div>
  );
};

export {easeOutCubic, easeInOutCubic, clamp01, rnd};
