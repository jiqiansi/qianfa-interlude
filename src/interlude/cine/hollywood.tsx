import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DK, LIT, cineA, clamp01, rnd, easeOutCubic, easeInOutCubic} from './engine';
import {FONT_KAI, FONT_KAI_BOLD} from '../../shushu/paper';

/**
 * 好莱坞件（v4）：把"慢淡入 + 静态暗底"换成真正的镜头语言。
 *
 *   ① Camera   —— 摄影机：推镜（scale 常驻变化）+ 震屏（入点/落点）+ 色散（drop-shadow 双层）
 *   ② Slam     —— 入点：从 1.35 倍砸到 1.0，带方向模糊与过冲，**没有"淡入"**
 *   ③ Metallic —— 金属字：上金下暗的渐变填充 + 立体厚度 + 泛光，预告片标题的字面质感
 *   ④ Shatter  —— **全屏碎裂**：预先把整幅画面切成放射状玻璃块，碎裂那一下整块屏一起飞
 *   ⑤ Grade    —— 调色：暖高光 + 冷阴影 + 暗角 + 颗粒（在 DarkStage 之上再压一层）
 *
 * 全部是帧的纯函数（只用 `rnd(seed,i)`），可跳渲、可并行。
 */

// ---------------------------------------------------------------- 摄影机

export type CamProps = {
  children?: React.ReactNode;
  /** 震屏幅度（px）：入点给 6–10，落点给 3–6 */
  shake?: number;
  /** 推镜：整镜常驻的缓慢放大（0 = 不动，0.08 = 推到 1.08） */
  push?: number;
  /** 色散强度（px）：强光元素用 1.2–2.4 */
  ca?: number;
  /** 震屏的频率抖动种子 */
  seed?: number;
};

export const Camera: React.FC<CamProps> = ({children, shake = 0, push = 0, ca = 0, seed = 5}) => {
  const n = useCurrentFrame() + 1;
  const sx = shake > 0 ? (rnd(seed, n % 61) - 0.5) * 2 * shake : 0;
  const sy = shake > 0 ? (rnd(seed + 1, n % 59) - 0.5) * 2 * shake : 0;
  const rot = shake > 0 ? (rnd(seed + 2, n % 53) - 0.5) * shake * 0.06 : 0;
  const sc = 1 + push * easeInOutCubic(clamp01(n / 300));
  const filter = ca > 0
    ? `drop-shadow(${ca.toFixed(1)}px 0 0 ${cineA('#FF3A22', 0.30)}) drop-shadow(${(-ca).toFixed(1)}px 0 0 ${cineA('#3AD2FF', 0.30)})`
    : undefined;
  return (
    <AbsoluteFill style={{
      transform: `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`,
      filter, willChange: 'transform, filter',
    }}>
      {children}
    </AbsoluteFill>
  );
};

/** 入点曲线：0 → 1，前 70% 快速收（1.35→1.0），后 30% 一点点过冲回来。 */
export const slamCurve = (p: number): {scale: number; blur: number; op: number} => {
  const t = clamp01(p);
  // 砸下来：scale 从 1.35 收到 1.0，easeOutQuint
  const e = 1 - Math.pow(1 - t, 5);
  const scale = 1.35 - 0.35 * e;
  // 末尾 12% 轻微过冲（1.0 → 0.985 → 1.0），像重物落定的回弹
  const over = t > 0.88 ? 0.015 * Math.sin((t - 0.88) / 0.12 * Math.PI) : 0;
  const blur = 14 * (1 - e);
  const op = clamp01(t * 4);                 // 只在前 1/4 里淡入，几乎算硬切
  return {scale: scale - over, blur, op};
};

// ---------------------------------------------------------------- 金属字（标题级）

export const Metallic: React.FC<{
  text: string; cx: number; cy: number; size?: number;
  /** 入点进度（用 slamCurve 的结果传进来） */
  p?: number; scaleIn?: number; blurPx?: number;
  /** 3D 姿态 */
  rx?: number; ry?: number;
  /** 立体厚度层数（0 = 只要平字） */
  layers?: number; depth?: number;
  /** 字距 */
  letterSpacing?: number;
  /** 光晕色（朱砂/藤黄） */
  glow?: string;
  /** 冷金 / 暖金两套金属面 */
  scheme?: 'gold' | 'paper';
  opacity?: number;
}> = ({text, cx, cy, size = 180, p = 1, scaleIn = 1, blurPx = 0, rx = 6, ry = -12,
  layers = 9, depth = 30, letterSpacing = 8, glow = LIT.gold, scheme = 'gold', opacity = 1}) => {
  const t = clamp01(p);
  if (t <= 0) return null;
  const t2 = easeOutCubic(t);
  const front: React.CSSProperties = {
    position: 'absolute', left: cx, top: cy,
    fontFamily: FONT_KAI_BOLD, fontWeight: 700, fontSize: size, letterSpacing, lineHeight: 1,
    whiteSpace: 'nowrap',
  };
  const metal = scheme === 'gold'
    ? 'linear-gradient(180deg, #FFF8E2 0%, #F0DCA6 26%, #C6A863 48%, #8C7238 60%, #E9D29A 74%, #B79A57 100%)'
    : 'linear-gradient(180deg, #FFFFFF 0%, #F6F0DF 34%, #CBC0A6 58%, #8A8171 66%, #F2EBD8 82%, #A79C83 100%)';
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 1000, transformStyle: 'preserve-3d',
                 filter: blurPx > 0.3 ? `blur(${blurPx.toFixed(2)}px)` : undefined, opacity}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
                   transform: `scale(${(scaleIn * (0.94 + 0.06 * t2)).toFixed(4)}) rotateX(${(rx * t2).toFixed(2)}deg) rotateY(${(ry * t2).toFixed(2)}deg)`}}>
        {/* 厚度：从背面到正面 → 暗金属 → 亮金属 */}
        {layers > 0 ? Array.from({length: layers}, (_, i) => {
          const k = 1 - i / (layers + 1);
          return (
            <div key={i} style={{
              ...front,
              transform: `translate(-50%,-50%) translateZ(${(-(i + 1) * (depth / layers)).toFixed(2)}px)`,
              color: `rgb(${Math.round(78 * k + 30)},${Math.round(66 * k + 26)},${Math.round(44 * k + 20)})`,
            }}>{text}</div>
          );
        }) : null}
        {/* 正面：金属渐变要"用 background-clip 抠字"，不能用 color */}
        <div style={{
          ...front,
          transform: 'translate(-50%,-50%)',
          backgroundImage: metal, WebkitBackgroundClip: 'text', backgroundClip: 'text',
          color: 'transparent',
          textShadow: `0 ${(8 * t2).toFixed(0)}px ${(24 * t2).toFixed(0)}px rgba(0,0,0,0.75)`,
        }}>{text}</div>
        {/* 泛光：同一串字再叠一层，只做光，不显形 */}
        <div style={{
          ...front, transform: 'translate(-50%,-50%)', color: glow,
          opacity: 0.42 * t2, filter: 'blur(16px)', mixBlendMode: 'screen',
        }}>{text}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 全屏碎裂

export type Shard = {poly: string; pts: Array<[number, number]>; cx: number; cy: number; ang: number; dist: number; spin: number; size: number};

/**
 * 预生成放射状玻璃块（**覆盖整幅画面**，不是屏幕中间一小团）。
 * 从冲击点向外切：内环 10 块、中环 14 块、外环 14 块（外环半径拉到画外，保证四角也被覆盖）。
 */
export const makeShards = (ox: number, oy: number, seed = 71): Shard[] => {
  const rings = [
    {r0: 0, r1: 170, n: 10},
    {r0: 170, r1: 420, n: 14},
    {r0: 420, r1: 1400, n: 16},
  ];
  const out: Shard[] = [];
  let k = 0;
  for (const ring of rings) {
    // 每一环给一点角度偏移，避免所有缝对齐成米字
    const a0 = rnd(seed, k++) * (Math.PI / 7);
    for (let i = 0; i < ring.n; i++) {
      const a1 = a0 + (i / ring.n) * Math.PI * 2 + (rnd(seed + 1, k) - 0.5) * 0.05;
      const a2 = a0 + ((i + 1) / ring.n) * Math.PI * 2 + (rnd(seed + 2, k) - 0.5) * 0.05;
      const jr = (r: number) => r * (0.92 + 0.16 * rnd(seed + 3, k));
      const p = (r: number, a: number): [number, number] => [ox + r * Math.cos(a), oy + r * Math.sin(a)];
      const [x1, y1] = p(jr(ring.r0), a1), [x2, y2] = p(jr(ring.r1), a1);
      const [x3, y3] = p(jr(ring.r1), a2), [x4, y4] = p(jr(ring.r0), a2);
      const cm = (a1 + a2) / 2, rm = (ring.r0 + ring.r1) / 2;
      out.push({
        poly: `polygon(${x1.toFixed(1)}px ${y1.toFixed(1)}px, ${x2.toFixed(1)}px ${y2.toFixed(1)}px, ${x3.toFixed(1)}px ${y3.toFixed(1)}px, ${x4.toFixed(1)}px ${y4.toFixed(1)}px)`,
        pts: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
        cx: ox + rm * Math.cos(cm), cy: oy + rm * Math.sin(cm),
        ang: cm, dist: 1 + 0.6 * rnd(seed + 4, k), spin: (rnd(seed + 5, k) - 0.5) * 70,
        size: ring.r1 - ring.r0,
      });
      k++;
    }
  }
  return out;
};

export const Shatter: React.FC<{
  /** 碎裂进度：0 = 还没碎（严丝合缝，看起来是完整画面）、>0 = 飞散 */
  p: number;
  ox: number; oy: number;
  seed?: number;
  children?: React.ReactNode;
  /** 玻璃块颜色（默认冷白玻璃） */
  tint?: string;
}> = ({p, ox, oy, seed = 71, children, tint = '#CFE6F2'}) => {
  const n = useCurrentFrame() + 1;
  const t = clamp01(p);
  const shards = React.useMemo(() => makeShards(ox, oy, seed), [ox, oy, seed]);
  if (t <= 0) {
    // 未碎：直接给完整画面（裂缝还没出现）
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const e = easeOutCubic(Math.min(1, t * 1.35));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 每块玻璃：clip-path 就是它原来占据的那一块，位移/旋转按"从冲击点向外" */}
      {shards.map((s, i) => {
        const d = (140 + 520 * e) * s.dist;
        const dx = d * Math.cos(s.ang), dy = d * Math.sin(s.ang) + 190 * e * e;
        const sc = 1 + 0.55 * e;
        const op = clamp01(1 - Math.max(0, t - 0.55) / 0.45);
        return (
          <div key={i} style={{
            position: 'absolute', inset: 0, clipPath: s.poly,
            transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${(s.spin * e).toFixed(2)}deg) scale(${sc.toFixed(3)})`,
            opacity: op,
          }}>
            {/* 玻璃块内的"画面"：整层内容 + 一层冷色玻璃反光，位移由上面的 transform 带出去 */}
            <AbsoluteFill style={{
              background: `linear-gradient(150deg, ${cineA(tint, 0.30)} 0%, ${cineA(tint, 0.06)} 46%, rgba(255,255,255,0.16) 100%)`,
              backdropFilter: 'blur(1px)',
            }} />
            {children}
            {/* 玻璃块边缘的亮边（碎片的"刃"） */}
            <div style={{position: 'absolute', inset: 0, clipPath: s.poly,
                         border: `1px solid ${cineA('#FFFFFF', 0.5)}`, filter: 'blur(0.3px)'}} />
          </div>
        );
      })}
      {/* 碎裂那一下：裂缝闪光 + 冲击波 */}
      {t < 0.28 ? (
        <>
          <div style={{position: 'absolute', inset: 0, background: `rgba(255,252,244,${(0.55 * (1 - t / 0.28)).toFixed(3)})`}} />
          {[0, 1, 2].map((i) => {
            const rr = (90 + i * 220) * easeOutCubic(clamp01(t / (0.34 + i * 0.12)));
            return (
              <div key={i} style={{
                position: 'absolute', left: ox - rr, top: oy - rr * 0.62, width: rr * 2, height: rr * 1.24,
                borderRadius: '50%', border: `${2.4 - i * 0.6}px solid ${cineA(i === 0 ? '#FFFFFF' : LIT.ice, 0.5 - i * 0.13)}`,
                filter: 'blur(1.4px)',
              }} />
            );
          })}
        </>
      ) : null}
      {/* 飞出来的玻璃屑（小颗粒，带亮度） */}
      <AbsoluteFill>
        {Array.from({length: 90}, (_, i) => {
          const a = rnd(81, i) * Math.PI * 2;
          const v = 180 + 520 * rnd(82, i);
          const r = (v / 4.2) * (1 - Math.exp(-4.2 * t * 0.5));
          const x = ox + r * Math.cos(a), y = oy + r * Math.sin(a) + 120 * t * t;
          const f = clamp01(1 - t * 1.1);
          if (f <= 0.02) return null;
          const s = 2 + 5 * rnd(83, i);
          return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s,
                                      background: '#FFFFFF', opacity: 0.75 * f,
                                      boxShadow: `0 0 8px ${cineA(LIT.ice, 0.6)}`}} />;
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, opacity: (n % 2) * 0.02}} />
    </AbsoluteFill>
  );
};

/** 预碎裂：把同一套 shard 几何画成发白的裂缝（碎裂前 6–10 帧先裂，再碎）。 */
export const CrackLines: React.FC<{ox: number; oy: number; p: number; seed?: number}> = ({ox, oy, p, seed = 71}) => {
  const t = clamp01(p);
  if (t <= 0) return null;
  const shards = makeShards(ox, oy, seed);
  return (
    <svg width="1280" height="720" style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: t}}>
      {shards.map((s, i) => (
        <polygon key={i} points={s.pts.map((q) => q.join(',')).join(' ')} fill="none"
                 stroke={cineA('#FFFFFF', 0.28 + 0.5 * rnd(seed + 9, i))} strokeWidth={0.9 + 0.7 * rnd(seed + 8, i)}
                 style={{filter: 'blur(0.4px)'}} />
      ))}
      <circle cx={ox} cy={oy} r={10 + 26 * t} fill="none" stroke={cineA('#FFFFFF', 0.7)} strokeWidth={2} />
    </svg>
  );
};

// ---------------------------------------------------------------- 调色

/** 电影调色层：暖高光 + 冷阴影 + 暗角（压在 DarkStage 之上）。 */
export const Grade: React.FC<{k?: number}> = ({k = 1}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: k}}>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,214,150,0.10) 0%, rgba(0,0,0,0) 46%, rgba(18,54,78,0.22) 100%)', mixBlendMode: 'soft-light'}} />
    <AbsoluteFill style={{background: 'radial-gradient(80% 62% at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.62) 100%)'}} />
  </AbsoluteFill>
);
