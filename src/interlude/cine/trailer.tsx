import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {
  DK, LIT, cineA, DarkStage, Letterbox, LightSweep, Flare, easeOutCubic, easeInOutCubic,
  clamp01, rnd,
} from './engine';
import {Camera, slamCurve, Metallic, Shatter, CrackLines, Grade, makeShards} from './hollywood';
import {FONT_KAI, FONT_KAI_BOLD} from '../../shushu/paper';
import {JIAZI, DIPAN_POS, RING_POS, type Zhi} from '../../qianfa/data';

/**
 * 预告片 v4（好莱坞版）—— 针对「丑暴了 / 玻璃破碎应该是屏幕破碎 / & 和数术要换行 /
 * 不要让空白没有字的帧出现那么久」重写。
 *
 * 与 v3 的差别（不是加特效，是换拍法）：
 *   ① 入点全部用 **Slam**（1.35 倍砸到 1.0 + 方向模糊 + 过冲），没有"淡入"；
 *   ② 每个入点带 **震屏**，每个定格带 **推镜**（画面上永远在动）；
 *   ③ 标题用 **金属字**（渐变抠字 + 立体厚度 + 泛光 + 色散）；
 *   ④ 碎裂改成 **全屏碎裂**：36 块放射状玻璃铺满整幅画面，先"裂"（裂缝线）再"碎"（碎片扑向镜头）；
 *   ⑤ 加 **调色层**（暖高光 / 冷阴影 / 暗角），整条片一个色调。
 *
 * 画面里**不再有没字的空场**：每一镜第 2 帧就有字，末尾不留长空白。
 */

const D = {course: '伤寒钤法', series: '清源勘道', sub: '术数精讲', tagline: '换个眼睛看中医'};

/* ================================================================ 镜一 · 医学 / & / 数术（195 帧 / 6.5s）
f2–18      「医学」砸进来（金属字 200px，落定那一下闪 + 震屏 8）
f18–66     定格 + 推镜（画面继续往前进）+ 光扫
f66–82     **换行**：第二行「&」砸进来（藤黄）
f82–98     第三行「数术」砸进来（金属字）
f98–165    三行定格 + 推镜 + 变形光斑扫过
f165–195   甩出：整幅加速放大 + 模糊 → 硬切（不留空场）
*/
const ShotA: React.FC = () => {
  const n = useCurrentFrame() + 1;
  const a = slamCurve(clamp01((n - 2) / 16));
  const amp = slamCurve(clamp01((n - 66) / 16));
  const shu = slamCurve(clamp01((n - 82) / 16));
  const whip = clamp01((n - 165) / 30);
  const shake = (a.blur > 0.4 ? 8 * clamp01(a.blur / 14) : 0) + (amp.blur > 0.4 ? 5 * clamp01(amp.blur / 14) : 0)
    + (shu.blur > 0.4 ? 6 * clamp01(shu.blur / 14) : 0);
  return (
    <DarkStage key="left" bars dust={170} fog={0.5} grain={0.06}>
      <Camera shake={shake} push={0.07} ca={1.6}>
        <Metallic text="医学" cx={640} cy={214} size={186} p={a.op} scaleIn={a.scale} blurPx={a.blur}
                  layers={10} depth={34} letterSpacing={20} />
        {amp.op > 0 ? (
          <Metallic text="&" cx={640} cy={368} size={104} p={amp.op} scaleIn={amp.scale} blurPx={amp.blur}
                    layers={7} depth={22} letterSpacing={0} glow={LIT.gold} />
        ) : null}
        {shu.op > 0 ? (
          <Metallic text="数术" cx={640} cy={492} size={158} p={shu.op} scaleIn={shu.scale} blurPx={shu.blur}
                    layers={9} depth={30} letterSpacing={18} />
        ) : null}
        <LightSweep p={clamp01((n - 100) / 70)} angle={12} w={0.32} k={0.6} />
        <Flare x={640} y={368} k={clamp01((n - 110) / 50) * 0.7} len={620} color={LIT.gold} />
      </Camera>
      {/* 甩出：加速放大 + 模糊（速度感，不是淡出） */}
      {whip > 0 ? <AbsoluteFill style={{backdropFilter: `blur(${(18 * whip).toFixed(1)}px)`, background: `rgba(0,0,0,${(0.5 * whip).toFixed(2)})`}} /> : null}
      <Grade k={1} />
      {n >= 18 && n <= 19 ? <AbsoluteFill style={{background: 'rgba(255,250,238,0.34)'}} /> : null}
      {n >= 82 && n <= 83 ? <AbsoluteFill style={{background: 'rgba(255,246,226,0.26)'}} /> : null}
      <Letterbox />
    </DarkStage>
  );
};

/* ================================================================ 镜二 · 花甲子 → 罗盘（330 帧 / 11.0s）
f2–64      六十花甲子**成墙**横竖乱飞（透明度 0.22–0.7、大小 24–72、带方向模糊）
f64–96     花甲子被吸向中心；罗盘现身（1.6 倍砸到 1.0 + 冲击波 + 闪光）
f96–190    内圈十二地支逐个锁定（每个都砸一下 + 小闪 + 震屏），一圈光扫过
f190–250   外圈十二地支自画外飞入、逐个锁定（带速度模糊）
f250–330   只剩外圈转圈（内圈不动）；指针 + 推镜
*/
const RING = RING_POS.map((p) => DIPAN_POS[p] as Zhi);
const ShotB: React.FC = () => {
  const n = useCurrentFrame() + 1;
  const cx = 640, cy = 356;
  const suck = easeInOutCubic(clamp01((n - 64) / 32));       // 花甲子被吸走
  const compIn = slamCurve(clamp01((n - 78) / 18));
  const outerSpin = n > 250 ? (n - 250) * 0.38 : 0;
  const lockShake = RING.reduce((acc, _z, i) => {
    const at = 96 + i * 7.5;
    return n >= at && n < at + 6 ? Math.max(acc, 3.4 * (1 - (n - at) / 6)) : acc;
  }, 0);
  const outerShake = RING.reduce((acc, _z, i) => {
    const at = 190 + i * 5;
    return n >= at && n < at + 5 ? Math.max(acc, 2.6 * (1 - (n - at) / 5)) : acc;
  }, 0);
  return (
    <DarkStage key="top" bars dust={120} fog={0.32} grain={0.055}>
      <Camera shake={suck > 0 && suck < 1 ? 3 : lockShake + outerShake} push={0.05} ca={1.2}>
        {/* 花甲子墙：横竖乱飞 + 方向模糊 */}
        {suck < 1 ? (
          <AbsoluteFill style={{opacity: 1 - suck * 0.92, filter: `blur(${(10 * suck).toFixed(1)}px)`}}>
            {JIAZI.map((gz, i) => {
              const horiz = rnd(9, i) > 0.45;
              const sp = 3.4 + 6.4 * rnd(10, i);
              const rot = (rnd(11, i) - 0.5) * 60;
              const x0 = rnd(12, i) * 1280, y0 = rnd(13, i) * 720;
              const ang = Math.atan2(cy - y0, cx - x0);
              const pull = suck * suck;
              const bx = horiz ? ((x0 + n * sp * 6) % 1700) - 210 : x0 + Math.sin(n * 0.02 + i) * 60;
              const by = horiz ? y0 + Math.sin(n * 0.02 + i) * 40 : ((y0 + n * sp * 6) % 1000) - 140;
              const x = bx + (cx - bx) * pull, y = by + (cy - by) * pull;
              const size = 24 + 48 * rnd(14, i);
              const op = (0.22 + 0.48 * rnd(15, i)) * (1 - pull);
              const vx = Math.cos(ang) * suck * 2, vy = Math.sin(ang) * suck * 2;
              return (
                <div key={i} style={{
                  position: 'absolute', left: x, top: y,
                  transform: `translate(-50%,-50%) rotate(${rot}deg) scaleY(${1 + 0.10 * suck})`,
                  fontFamily: FONT_KAI_BOLD, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap',
                  color: DK.text, opacity: op,
                  filter: `blur(${(0.6 + 1.6 * suck).toFixed(2)}px)`,
                  textShadow: vx || vy ? '0 0 12px rgba(180,215,235,0.25)' : undefined,
                }}>{gz}</div>
              );
            })}
          </AbsoluteFill>
        ) : null}

        {/* 罗盘 */}
        {compIn.op > 0 ? (
          <AbsoluteFill style={{opacity: compIn.op,
            transform: `scale(${compIn.scale.toFixed(3)})`,
            filter: compIn.blur > 0.3 ? `blur(${(compIn.blur * 0.5).toFixed(2)}px)` : undefined}}>
            <div style={{
              position: 'absolute', left: cx - 420, top: cy - 420, width: 840, height: 840, borderRadius: 420,
              background: `radial-gradient(closest-side, ${cineA('#8AD8E8', 0.12)} 0%, rgba(0,0,0,0) 70%)`,
              filter: 'blur(20px)',
            }} />
            <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
              {[196, 244, 322].map((r, i) => (
                <circle key={r} cx={cx} cy={cy} r={r} fill="none"
                        stroke={i === 0 ? cineA(LIT.celadon, 0.6) : cineA(DK.text, 0.18)}
                        strokeWidth={i === 0 ? 1.6 : 1} strokeDasharray={i === 1 ? '3 6' : undefined} />
              ))}
              {/* 一圈光扫：沿环旋转的高光弧 */}
              {(() => {
                const a0 = ((n * 2.2) % 360) * Math.PI / 180;
                const a1 = a0 + 0.9;
                const r = 244;
                return (
                  <path d={`M${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`}
                        fill="none" stroke={cineA('#FFFFFF', 0.55)} strokeWidth={3} style={{filter: 'blur(2px)'}} />
                );
              })()}
              {RING.map((z, i) => {
                const a = ((i - 1) * 30 - 90) * Math.PI / 180;
                return (
                  <line key={`t${z}`} x1={cx + 196 * Math.cos(a)} y1={cy + 196 * Math.sin(a)}
                        x2={cx + 216 * Math.cos(a)} y2={cy + 216 * Math.sin(a)}
                        stroke={cineA(LIT.celadon, 0.55)} strokeWidth={1.7} />
                );
              })}
            </svg>
            {/* 内圈：砸入并锁定 */}
            {RING.map((z, i) => {
              const at = 96 + i * 7.5;
              const s = slamCurve(clamp01((n - at) / 10));
              if (s.op <= 0) return null;
              const a = ((i - 1) * 30 - 90) * Math.PI / 180;
              const x = cx + 222 * Math.cos(a), y = cy + 222 * Math.sin(a);
              return (
                <div key={`in${z}`} style={{
                  position: 'absolute', left: x, top: y,
                  transform: `translate(-50%,-50%) scale(${s.scale.toFixed(3)})`, opacity: s.op,
                  fontFamily: FONT_KAI_BOLD, fontSize: 36, color: DK.text, lineHeight: 1,
                  textShadow: `0 ${(6 * s.op).toFixed(0)}px 14px rgba(0,0,0,0.8), 0 0 ${(18 * s.op).toFixed(0)}px ${cineA(LIT.ice, 0.25)}`,
                  filter: s.blur > 0.3 ? `blur(${s.blur.toFixed(2)}px)` : undefined,
                }}>{z}</div>
              );
            })}
            {/* 外圈：自画外飞入并锁定，随后整圈转 */}
            <div style={{position: 'absolute', inset: 0, transform: `rotate(${outerSpin.toFixed(2)}deg)`, transformOrigin: `${cx}px ${cy}px`}}>
              {RING.map((z, i) => {
                const at = 190 + i * 5;
                const t = clamp01((n - at) / 12);
                if (t <= 0) return null;
                const e = easeOutCubic(t);
                const a = ((i - 1) * 30 - 90) * Math.PI / 180;
                const rr = 900 + (322 - 900) * e;
                const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
                return (
                  <div key={`out${z}`} style={{
                    position: 'absolute', left: x, top: y,
                    transform: `translate(-50%,-50%) rotate(${(-outerSpin).toFixed(2)}deg) scale(${(1.25 - 0.25 * e).toFixed(3)})`,
                    opacity: clamp01(t * 2.2),
                    fontFamily: FONT_KAI_BOLD, fontSize: 48, color: LIT.paper, lineHeight: 1,
                    textShadow: `0 0 ${(22 * e).toFixed(0)}px ${cineA(LIT.ice, 0.4)}, 0 4px 16px rgba(0,0,0,0.75)`,
                    filter: e < 0.9 ? `blur(${(6 * (1 - e)).toFixed(2)}px)` : undefined,
                  }}>{z}</div>
                );
              })}
            </div>
            {/* 指针 */}
            {n > 262 ? (
              <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
                <line x1={cx} y1={cy} x2={cx + 150 * Math.cos((n * 0.9 - 90) * Math.PI / 180)}
                      y2={cy + 150 * Math.sin((n * 0.9 - 90) * Math.PI / 180)}
                      stroke={cineA(LIT.cinnabar, 0.75)} strokeWidth={2.4} strokeLinecap="round" />
                <circle cx={cx} cy={cy} r={6} fill={LIT.cinnabar} />
              </svg>
            ) : null}
          </AbsoluteFill>
        ) : null}
      </Camera>
      <Flare x={640} y={356} k={clamp01((n - 78) / 26) * (1 - clamp01((n - 120) / 80))} len={700} />
      <Grade k={1} />
      {n >= 78 && n <= 79 ? <AbsoluteFill style={{background: 'rgba(240,250,255,0.42)'}} /> : null}
      <Letterbox />
    </DarkStage>
  );
};

/* ================================================================ 镜三 · 术语堆满 → **全屏碎裂**（270 帧 / 9.0s）
f2–104     十七个四字术语每 6 帧砸进来一枚（scale 1.4→1 + 模糊 + 逐次累积的震屏），堆满画面
f104–140   定格 + 推镜（张力）+ 轻微滚动
f132–144   **先裂**：裂缝线自画面中心向四周爬满
f144       **碎**：36 块玻璃铺满整幅画面，同时扑向镜头 + 裂缝闪光 + 冲击波 + 玻璃屑
f144–270   碎片出画；不留长空场 —— 碎片快清时直接硬切到下一镜
*/
const TERMS = [
  '六经营卫', '主病行流', '三司排盘', '天盘地支', '天盘天干', '六经辨证',
  '药号推算', '五经查方', '病传六日', '两感欲解', '痉湿喝证', '客主加临',
  '五运受病', '三丘五墓', '汗瘥棺墓', '欲解时辰', '霍乱劳复',
];
const BREAK = 144;
const ShotC: React.FC = () => {
  const n = useCurrentFrame() + 1;
  const crack = clamp01((n - 132) / 12);
  const shatterP = n >= BREAK ? (n - BREAK) / 34 : 0;
  const shake = TERMS.reduce((acc, _t, i) => {
    const at = 2 + i * 6;                                   // 每枚术语砸进来后 6 帧的震屏窗口
    return n >= at && n < at + 6 ? Math.max(acc, 1.9 * (1 - (n - at) / 6)) : acc;
  }, 0);
  return (
    <DarkStage key="right" bars dust={140} fog={0.38} grain={0.06}>
      <Camera shake={shake} push={n > 104 ? 0.09 : 0.04} ca={1.4}>
        <AbsoluteFill style={{opacity: n >= BREAK ? clamp01(1 - (n - BREAK) / 22) : 1}}>
          {TERMS.map((t, i) => {
            const at = 2 + i * 6;
            const s = slamCurve(clamp01((n - at) / 12));
            if (s.op <= 0) return null;
            const x = 110 + rnd(21, i) * 1060;
            const y = 118 + rnd(22, i) * 484;
            const rot = (rnd(23, i) - 0.5) * 34;
            const size = 36 + 28 * rnd(24, i);
            const hot = i < 2;
            return (
              <div key={t} style={{
                position: 'absolute', left: x, top: y,
                transform: `translate(-50%,-50%) rotate(${rot.toFixed(1)}deg) scale(${s.scale.toFixed(3)})`,
                opacity: s.op * (hot ? 1 : 0.9),
                fontFamily: FONT_KAI_BOLD, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap',
                color: hot ? LIT.paper : DK.text,
                textShadow: hot ? `0 0 24px ${cineA(LIT.ice, 0.35)}, 0 5px 18px rgba(0,0,0,0.75)`
                                : '0 5px 16px rgba(0,0,0,0.7)',
                filter: s.blur > 0.3 ? `blur(${(s.blur * 0.35).toFixed(2)}px)` : undefined,
              }}>{t}</div>
            );
          })}
        </AbsoluteFill>
      </Camera>
      {/* 先裂 */}
      <CrackLines ox={640} oy={356} p={crack} seed={91} />
      {/* 再碎：整幅画面 36 块玻璃 */}
      {shatterP > 0 ? (
        <Shatter p={shatterP} ox={640} oy={356} seed={91}>
          <AbsoluteFill style={{background: 'transparent'}} />
        </Shatter>
      ) : null}
      {n >= BREAK && n <= BREAK + 1 ? <AbsoluteFill style={{background: 'rgba(255,252,244,0.6)'}} /> : null}
      <Grade k={1} />
      <Letterbox />
    </DarkStage>
  );
};
/* ================================================================ 镜四 · 伤寒钤法 + 换个眼睛看中医（285 帧 / 9.5s）
f2–40      金属字「伤寒钤法」砸进来 + 光斑横扫（震屏 6）
f40–120    定格 + 推镜 + 光斑脉动
f120–160   小标题「换个眼睛看中医」砸进来（换行、独立一行、不再是对偶句）
f160–285   频道角标 + 长定格（这一镜是落点，允许停）
*/
const ShotD: React.FC<{course: string; tagline: string; series: string; sub: string}> = ({
  course, tagline, series, sub,
}) => {
  const n = useCurrentFrame() + 1;
  const a = slamCurve(clamp01((n - 2) / 20));
  const b = slamCurve(clamp01((n - 120) / 16));
  const breathe = 0.5 + 0.5 * Math.sin(n * 0.03);
  return (
    <DarkStage key="top" bars dust={170} fog={0.5} grain={0.06}>
      <Camera shake={a.blur * 0.45 + b.blur * 0.35} push={0.05} ca={1.8}>
        <Metallic text={course} cx={640} cy={330} size={196} p={a.op} scaleIn={a.scale} blurPx={a.blur}
                  layers={12} depth={38} letterSpacing={24} glow={LIT.gold} />
        {b.op > 0 ? (
          <Metallic text={tagline} cx={640} cy={508} size={64} p={b.op} scaleIn={b.scale} blurPx={b.blur * 0.7}
                    layers={6} depth={16} letterSpacing={14} scheme="paper" glow={LIT.ice} />
        ) : null}
        <Flare x={640} y={330} k={clamp01((n - 30) / 40) * (0.55 + 0.45 * breathe)} len={700} />
        <LightSweep p={clamp01((n - 8) / 80)} angle={-8} w={0.36} k={0.55} />
      </Camera>
      <Grade k={1} />
      {n >= 22 && n <= 23 ? <AbsoluteFill style={{background: 'rgba(255,250,236,0.30)'}} /> : null}
      {n > 160 ? (
        <div style={{
          position: 'absolute', left: 640, top: 172, transform: 'translate(-50%,-50%)',
          fontFamily: FONT_KAI, fontSize: 24, letterSpacing: 8, color: DK.muted,
          opacity: clamp01((n - 170) / 26), textShadow: '0 2px 10px rgba(0,0,0,0.7)',
        }}>{`${series} · ${sub}`}</div>
      ) : null}
      <Letterbox />
    </DarkStage>
  );
};

/* ================================================================ 预告片本体 */
export const SHOT_LENS = [195, 330, 270, 285];
export const CINE_TRAILER_FRAMES = SHOT_LENS.reduce((a, b) => a + b, 0);
export type TrailerProps = {course?: string; series?: string; sub?: string; tagline?: string};

export const CineTrailer: React.FC<TrailerProps> = ({
  course = D.course, series = D.series, sub = D.sub, tagline = D.tagline,
}) => {
  let at = 0;
  const shots: Array<{node: React.ReactNode; len: number}> = [
    {node: <ShotA />, len: SHOT_LENS[0]},
    {node: <ShotB />, len: SHOT_LENS[1]},
    {node: <ShotC />, len: SHOT_LENS[2]},
    {node: <ShotD course={course} tagline={tagline} series={series} sub={sub} />, len: SHOT_LENS[3]},
  ];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {shots.map((s, i) => {
        const from = at;
        at += s.len;
        return <Sequence key={i} from={from} durationInFrames={s.len}>{s.node}</Sequence>;
      })}
    </AbsoluteFill>
  );
};

export {makeShards};
