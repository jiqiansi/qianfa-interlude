import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  DK, LIT, cineA, DarkStage, Letterbox, Dust, Grain, LightSweep, Flare, GlassSlab, Extrude, Sheet3D,
  Burst, CondenseText, CineCaption, easeOutCubic, easeInOutCubic, clamp01, rnd,
} from './engine';
import {FONT_KAI, FONT_KAI_BOLD} from '../../shushu/paper';
import {JIAZI, DIPAN_POS, RING_POS, type Zhi} from '../../qianfa/data';
import {ringXY, ringAngle} from '../kit';

/**
 * 暗场纸本 · 电影感片头 / 转场（v2）×10
 *
 * 设计口径：
 *   ① 光是主角。每个片段先定"主光从哪来"，再定物（纸 / 玻璃 / 字 / 粒子）。
 *   ② 物都在 3D 里（CSS perspective + preserve-3d）：纸会立起、字有厚度、环会摊成盘。
 *   ③ 磨砂玻璃只做**HUD 与副题**，不做大面积背景 —— 大面积 backdrop-filter 又贵又糊。
 *   ④ 朱砂仍是唯一焦点色；藤黄只描边，青碧/冰蓝只做结构与环境。
 *   ⑤ 一屏不出现"表格 / 方框 / 网格"式的教学构件（除 K8 的盘，且它是发光线框，不是白底表格）。
 *   ⑥ 无 >3Hz 闪烁：只有位移、模糊、单次闪白与冲击环。
 */

export type CineProps = {
  course?: string; series?: string; sub?: string; tagline?: string;
  lec?: string; title?: string; word?: string; stop?: string;
};
const D = {course: '伤寒钤法', series: '清源勘道', sub: '术数精讲'};

/** 3D 方印（朱砂实心 + 白文），会旋转落下。 */
const Seal3D: React.FC<{cx: number; cy: number; size?: number; chars?: string; k: number; spin?: number}> = ({
  cx, cy, size = 210, chars = '钤法', k, spin = 1,
}) => {
  const t = clamp01(k);
  if (t <= 0) return null;
  const s = size * (1.22 - 0.22 * easeOutCubic(t));
  const rz = (1 - easeOutCubic(t)) * -14 * spin;
  const rx = (1 - easeOutCubic(t)) * 58;
  const list = [...chars];
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 900, transformStyle: 'preserve-3d'}}>
      <div style={{
        position: 'absolute', left: cx, top: cy, width: s, height: s,
        transform: `translate(-50%,-50%) rotateX(${rx.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg)`,
        background: `linear-gradient(150deg, #D64A34 0%, ${LIT.cinnabarDeep} 46%, #7E241C 100%)`,
        borderRadius: s * 0.035,
        boxShadow: `0 ${(18 * t).toFixed(0)}px ${(34 * t).toFixed(0)}px rgba(0,0,0,0.62), 0 0 ${(46 * t).toFixed(0)}px ${cineA(LIT.cinnabar, 0.45)}`,
        opacity: 0.35 + 0.65 * t,
      }}>
        <div style={{position: 'absolute', inset: s * 0.075, border: `1.4px solid ${cineA('#FFF4E4', 0.42)}`, borderRadius: s * 0.012}} />
        {list.map((c, i) => (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: `${((i + 0.5) / list.length) * 100}%`,
            transform: 'translate(-50%,-50%)', fontFamily: FONT_KAI_BOLD, fontWeight: 700,
            fontSize: s * 0.34, color: '#FFF4E4', textShadow: '0 2px 10px rgba(0,0,0,0.35)', lineHeight: 1,
          }}>{c}</div>
        ))}
      </div>
    </div>
  );
};

/* ================================================================ K1 觉醒（片头 · 8.0s / 240 帧）
f1–24    深渊中出现一粒朱砂光点（浮起）
f24–78   宣纸自深处升起并立起（rx 72°→10°，z -420→0），一束光自左掠过把它打亮
f78–96   印自上落下（3D，旋转收正），落纸：冲击环 + 粒子爆发 + 单次闪白
f90–132  立体字「伤寒钤法」逐字从纸面抬起（厚度 26px）
f132–172 光扫过全屏 + 变形镜头光斑；磨砂玻璃副题条自下滑入
f172–240 定格呼吸（尘埃、纸的微晃、光晕低频脉动）
*/
export const CineAwakening: React.FC<CineProps> = ({
  course = D.course, series = D.series, sub = D.sub, tagline = '不望闻问切，只要得病日期', lec = '', title = '',
}) => {
  const n = useCurrentFrame() + 1;
  const rise = clamp01((n - 24) / 54);
  const sealK = clamp01((n - 78) / 18);
  const burstT = Math.max(0, (n - 96) / 30);
  const chars = [...course];
  const sweep = clamp01((n - 132) / 40);
  const slabP = clamp01((n - 148) / 22);
  const breathe = 0.5 + 0.5 * Math.sin(n * 0.035);
  return (
    <DarkStage key="left" bars dust={170} fog={0.55}>
      {/* 起始那粒朱砂光点 */}
      {n < 96 ? (
        <div style={{
          position: 'absolute', left: 640 - 4, top: 470 - 60 * clamp01((n - 4) / 40),
          width: 8, height: 8, borderRadius: 4, background: LIT.cinnabar,
          boxShadow: `0 0 24px 8px ${cineA(LIT.cinnabar, 0.55)}`, opacity: clamp01((n - 2) / 14),
        }} />
      ) : null}
      <Sheet3D cx={640} cy={372} w={880} h={496} p={rise}
               rx={10} ry={-12} rz={-1.2} z={0} lit={0.6 + 0.4 * rise} sheen={0.35 + 0.3 * breathe}>
        {/* 纸上的立体字 */}
        {chars.map((c, i) => (
          <Extrude key={c + i} text={c} cx={640 + (i - (chars.length - 1) / 2) * 104} cy={300}
                   size={92} p={clamp01((n - (90 + i * 11)) / 26)} layers={9} depth={26} />
        ))}
        {n > 96 ? <Seal3D cx={320} cy={452} size={150} chars="钤法" k={clamp01((n - 96) / 16)} /> : null}
      </Sheet3D>
      {/* 印落那一下：粒子 + 冲击 */}
      <Burst cx={320} cy={452} t={burstT} qty={150} seed={21} color={LIT.cinnabar} color2={LIT.gold} />
      <LightSweep p={clamp01((n - 40) / 44) * (1 - clamp01((n - 100) / 40))} angle={16} k={0.9} />
      <LightSweep p={sweep} angle={-12} w={0.34} k={0.7} color="rgba(255,238,206,0.42)" />
      <Flare x={640} y={300} k={clamp01((n - 150) / 30) * (0.55 + 0.45 * breathe)} len={520} />
      <GlassSlab x={340} y={560} w={600} h={92} p={slabP} from="bottom" sweep={clamp01((n - 156) / 40)}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     fontFamily: FONT_KAI_BOLD, fontSize: 34, letterSpacing: 8, color: DK.text,
                     textShadow: '0 2px 12px rgba(0,0,0,0.6)'}}>{tagline}</div>
      </GlassSlab>
      <CineCaption text={`${series} · ${sub}`} cx={640} cy={132} size={22} p={clamp01((n - 160) / 24)} />
      {lec || title ? (
        <CineCaption text={[lec, title].filter(Boolean).join(' · ')} cx={640} cy={664} size={26}
                     p={clamp01((n - 176) / 22)} color={DK.text} />
      ) : null}
    </DarkStage>
  );
};

/* ================================================================ K2 纸背透光（片头 · 7.0s / 210 帧）
f1–30    深场，纸半透地浮在光里
f30–96   背后强光自左下扫过，字从纸里"透"出来（凝字：模糊 18px → 0）
始终      镜头缓慢推进（纸 z 从 -160 到 +40），纸轻微摆动（rx/ry 低频）
f120–170 变形光斑掠过，副题浮出
f170–210 定格
（v1 的「钤」水印在这版里彻底没有 —— 用户裁定它难看。）
*/
export const CineLightThrough: React.FC<CineProps> = ({
  course = D.course, series = D.series, sub = D.sub, tagline = '不望闻问切，只要得病日期', lec = '', title = '',
}) => {
  const n = useCurrentFrame() + 1;
  const push = easeInOutCubic(clamp01((n - 10) / 190));
  const sway = Math.sin(n * 0.021);
  const cond = clamp01((n - 34) / 62);
  return (
    <DarkStage key="left" bars dust={140} fog={0.7} warm={0.75}>
      {/* 背光：从纸后面打上来的大光斑 */}
      <div style={{
        position: 'absolute', left: 180, top: 60, width: 920, height: 620, borderRadius: '50%',
        background: `radial-gradient(closest-side, ${cineA('#FFE7B4', 0.55 * clamp01((n - 20) / 50))} 0%, rgba(255,214,150,0.12) 52%, rgba(0,0,0,0) 76%)`,
        filter: 'blur(30px)',
      }} />
      <Sheet3D cx={640} cy={356} w={920} h={518} p={1} rx={6 + 2.6 * sway} ry={-9 + 5 * sway} rz={-0.8}
               z={-160 + 200 * push} lit={0.75 + 0.25 * cond} sheen={0.3 + 0.4 * cond}>
        <CondenseText text={course} cx={640} cy={344} size={104} p={cond}
                      color="#3A2E1E" glow={LIT.gold} letterSpacing={30} />
      </Sheet3D>
      <LightSweep p={clamp01((n - 30) / 96)} angle={-14} w={0.5} k={0.75} color="rgba(255,236,196,0.5)" />
      <Flare x={640} y={344} k={clamp01((n - 126) / 40) * 0.8} len={620} color={LIT.gold} />
      <CineCaption text={tagline} cx={640} cy={556} size={28} p={clamp01((n - 150) / 24)} />
      <CineCaption text={`${series} · ${sub}`} cx={640} cy={126} size={22} p={clamp01((n - 140) / 24)} />
      {lec || title ? (
        <CineCaption text={[lec, title].filter(Boolean).join(' · ')} cx={640} cy={662} size={26}
                     p={clamp01((n - 168) / 22)} color={DK.text} />
      ) : null}
    </DarkStage>
  );
};

/* ================================================================ K3 干支流（片头 · 6.5s / 195 帧）
f1–110   六十干支在纵深里向镜头流来（z 由远及近），速度逐渐减到 0
始终      随 z 变模糊、变暗（近处清晰）
f112     「甲寅」锁在 z=0，朱砂光晕 + 变形光斑
f126–168 磨砂玻璃牌自下升起托住它（牌上「得病日」），课名 3D 抬起
f168–195 定格
*/
export const CineGanzhiFlow: React.FC<CineProps> = ({
  course = D.course, series = D.series, sub = D.sub, stop = '甲寅', lec = '', title = '',
}) => {
  const n = useCurrentFrame() + 1;
  const idx = Math.max(0, JIAZI.indexOf(stop));
  const s = easeOutCubic(clamp01((n - 8) / 104));                 // 0→1 减速
  const CAM = 780;
  const locked = n >= 112;
  const slabP = clamp01((n - 126) / 24);
  return (
    <DarkStage key="top" bars dust={130} fog={0.45}>
      <div style={{position: 'absolute', inset: 0, perspective: CAM, transformStyle: 'preserve-3d'}}>
        {Array.from({length: 14}, (_, i) => {
          const r = i - 6;
          const gi = ((idx + r) % 60 + 60) % 60;
          const z = r * 180 - 1500 * (1 - s);                     // 远处出发，向镜头走来
          const scale = CAM / (CAM - z);                           // CSS 透视的等效放大率
          if (scale < 0.15 || scale > 2.05) return null;         // 封顶：别让字怼到镜头上成一团糊
          const isLock = locked && r === 0;
          const blur = clamp01(-z / 900) * 5.5;
          const op = clamp01(1.05 - Math.abs(z) / 3200) * (isLock ? 1 : 0.6);
          if (op <= 0.02) return null;
          return (
            <div key={i} style={{
              position: 'absolute', left: 640, top: 330,
              transform: `translate(-50%,-50%) translateZ(${z.toFixed(0)}px) scale(${scale.toFixed(3)})`,
              opacity: op, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
            }}>
              <div style={{
                fontFamily: FONT_KAI_BOLD, fontWeight: 700, fontSize: 116, lineHeight: 1, whiteSpace: 'nowrap',
                color: isLock ? LIT.paper : DK.text,
                textShadow: isLock
                  ? `0 0 30px ${cineA(LIT.cinnabar, 0.9)}, 0 0 90px ${cineA(LIT.cinnabar, 0.5)}, 0 6px 24px rgba(0,0,0,0.7)`
                  : '0 4px 18px rgba(0,0,0,0.65)',
              }}>{JIAZI[gi]}</div>
            </div>
          );
        })}
      </div>
      {/* 锁定那一下 */}
      <Flare x={640} y={330} k={clamp01((n - 112) / 24)} len={560} />
      <Burst cx={640} cy={330} t={Math.max(0, (n - 112) / 30)} qty={70} seed={31} spread={220}
             life={0.7} ring={false} flash={false} color={LIT.gold} color2={DK.text} />
      <GlassSlab x={420} y={470} w={440} h={92} p={slabP} from="bottom" sweep={clamp01((n - 140) / 40)}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     gap: 18, fontFamily: FONT_KAI, fontSize: 28, letterSpacing: 6, color: DK.text}}>
          <span style={{color: DK.muted, fontSize: 22}}>得病日</span>
          <span style={{fontFamily: FONT_KAI_BOLD, color: LIT.cinnabar, fontSize: 34}}>{stop}</span>
        </div>
      </GlassSlab>
      <Extrude text={course} cx={640} cy={604} size={54} p={clamp01((n - 150) / 26)} layers={7} depth={18} rx={6} ry={-8} />
      {lec || title ? (
        <CineCaption text={[lec, title].filter(Boolean).join(' · ')} cx={640} cy={682} size={24}
                     p={clamp01((n - 168) / 22)} color={DK.text} />
      ) : null}
    </DarkStage>
  );
};

/* ================================================================ K4 时间之环（片头 · 6.0s / 180 帧）
f1–64    十二支环摊成斜盘（rotateX 66°）高速旋转，带速度残影
f64      骤停：支的位置定死，一粒朱砂锁定某一支 + 冲击环 + 光斑
f84–132  盘心 3D 课名升起；玻璃副题滑入
*/
export const CineRing3D: React.FC<CineProps> = ({
  course = D.course, series = D.series, sub = D.sub, stop = '寅', lec = '', title = '',
}) => {
  const n = useCurrentFrame() + 1;
  const spinK = easeOutCubic(clamp01((n - 4) / 60));
  const spin = (1 - spinK) * 900;                       // 从 900° 收到 0
  const stopped = n > 64;
  const lock = clamp01((n - 64) / 18);
  const cx = 640, cy = 366, rx = 178;
  const ring = RING_POS.map((p, i) => DIPAN_POS[p] as Zhi);
  return (
    <DarkStage key="top" bars dust={120} fog={0.4}>
      <div style={{position: 'absolute', inset: 0, perspective: 1000, transformStyle: 'preserve-3d'}}>
        <div style={{
          position: 'absolute', left: cx, top: cy, width: 0, height: 0,
          transform: `rotateX(66deg) rotateZ(${spin.toFixed(1)}deg)`, transformStyle: 'preserve-3d',
        }}>
          {/* 盘面：两圈发光细环 */}
          <div style={{position: 'absolute', left: -rx, top: -rx, width: rx * 2, height: rx * 2, borderRadius: rx,
                       border: `1.4px solid ${cineA(LIT.celadon, 0.5)}`, boxShadow: `0 0 24px ${cineA(LIT.celadon, 0.25)}`}} />
          <div style={{position: 'absolute', left: -(rx - 34), top: -(rx - 34), width: (rx - 34) * 2, height: (rx - 34) * 2,
                       borderRadius: rx, border: `1px dashed ${cineA(DK.text, 0.22)}`}} />
          {ring.map((z, i) => {
            const a = ((i - 1) * 30 - 90) * Math.PI / 180;
            const x = (rx + 34) * Math.cos(a), y = (rx + 34) * Math.sin(a);
            const isLock = stopped && z === stop;
            return (
              <div key={z} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotateZ(${-spin}deg) rotateX(-66deg)`}}>
                <div style={{
                  fontFamily: FONT_KAI_BOLD, fontWeight: isLock ? 700 : 500, fontSize: isLock ? 46 : 38,
                  color: isLock ? LIT.cinnabar : DK.text, lineHeight: 1,
                  textShadow: isLock
                    ? `0 0 26px ${cineA(LIT.cinnabar, 0.95)}, 0 0 70px ${cineA(LIT.cinnabar, 0.45)}`
                    : '0 3px 14px rgba(0,0,0,0.7)',
                  opacity: stopped ? 1 : 0.75,
                }}>{z}</div>
              </div>
            );
          })}
          {/* 高转速时的残影 */}
          {!stopped && spin > 22 ? [1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', left: -rx, top: -rx, width: rx * 2, height: rx * 2, borderRadius: rx,
                                 border: `1px solid ${cineA(i === 1 ? LIT.ice : LIT.gold, 0.10)}`,
                                 transform: `rotateZ(${(-spin * 0.08 * i).toFixed(1)}deg)`}} />
          )) : null}
        </div>
      </div>
      <Burst cx={cx} cy={cy} t={Math.max(0, (n - 64) / 30)} qty={90} seed={41} spread={300} life={0.8}
             ring color={LIT.cinnabar} color2={LIT.gold} flash />
      <Flare x={cx} y={cy} k={lock * 0.85} len={520} />
      <Extrude text={course} cx={cx} cy={cy - 4} size={62} p={clamp01((n - 88) / 26)} layers={8} depth={20} rx={10} ry={-12} />
      <GlassSlab x={452} y={520} w={376} h={78} p={clamp01((n - 108) / 22)} from="bottom" sweep={clamp01((n - 120) / 40)}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                     fontFamily: FONT_KAI, fontSize: 24, letterSpacing: 6, color: DK.muted}}>
          {`${series} · ${sub}`}
        </div>
      </GlassSlab>
      {lec || title ? (
        <CineCaption text={[lec, title].filter(Boolean).join(' · ')} cx={640} cy={636} size={24}
                     p={clamp01((n - 126) / 22)} color={DK.text} />
      ) : null}
    </DarkStage>
  );
};

/* ================================================================ K5 墨爆（转场 · 3.0s / 90 帧）
f1–22    墨滴悬在暗场里（有高光与微弱脉动）
f22      爆开：180 粒墨点向外飞、带阻尼
f30–62   粒子减速成雾；雾里凝出短词
f62–90   雾与粒子被吸走
*/
export const CineInkBurst: React.FC<CineProps> = ({word = '续'}) => {
  const n = useCurrentFrame() + 1;
  const t = Math.max(0, (n - 22) / 30);
  const cond = clamp01((n - 34) / 30);
  const gone = 1 - clamp01((n - 62) / 26);
  return (
    <DarkStage key="top" bars={false} dust={90} fog={0.35} grain={0.07}>
      {/* 拦截的雾（爆发后才浓） */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.55 * clamp01((n - 26) / 20) * gone,
        background: 'radial-gradient(46% 40% at 50% 50%, rgba(210,222,230,0.18) 0%, rgba(0,0,0,0) 72%)',
        filter: 'blur(18px)',
      }} />
      {n <= 26 ? (
        <div style={{
          position: 'absolute', left: 640 - 13, top: 356 - 13, width: 26, height: 26, borderRadius: 13,
          background: `radial-gradient(circle at 32% 28%, #A8B4BC 0%, #3A444C 42%, #141A1E 100%)`,
          boxShadow: `0 0 26px ${cineA('#C9D4DC', 0.55)}, 0 0 70px ${cineA(LIT.ice, 0.28)}, inset 0 0 10px rgba(0,0,0,0.75)`,
          transform: `scale(${(1 + 0.06 * Math.sin(n * 0.3)).toFixed(3)})`,
        }}>
          {/* 镜面高光：暗底上一颗黑点根本看不见，得给它一点反光 */}
          <div style={{position: 'absolute', left: 7, top: 5, width: 6, height: 5, borderRadius: 4,
                       background: 'rgba(255,255,255,0.65)', filter: 'blur(1.2px)'}} />
        </div>
      ) : null}
      <Burst cx={640} cy={356} t={t * 1.02} qty={220} seed={51} spread={470} life={1.35}
             color="#2B343A" color2={LIT.cinnabar} gravity={210} />
      <Burst cx={640} cy={356} t={t * 1.02} qty={40} seed={57} spread={250} life={0.9}
             color={LIT.cinnabar} color2={LIT.gold} ring={false} flash={false} gravity={160} />
      <div style={{opacity: gone}}>
        <CondenseText text={word} cx={640} cy={356} size={96} p={cond} color={DK.text} glow={LIT.ice} letterSpacing={40} />
      </div>
      <LightSweep p={clamp01((n - 30) / 34)} angle={8} w={0.3} k={0.5 * gone} />
    </DarkStage>
  );
};

/* ================================================================ K6 玻璃牌（转场 · 2.5s / 75 帧）
f1–20    磨砂玻璃板自右侧 3D 滑入
f16–40   板上短词逐字亮起
f42–70   玻璃碎裂：碎片与粒子向外飞，主光一闪
*/
export const CineGlassSlab: React.FC<CineProps> = ({word = '下一节', series = D.series}) => {
  const n = useCurrentFrame() + 1;
  const inP = clamp01((n - 2) / 18);
  const letters = [...word];
  const shard = Math.max(0, (n - 42) / 26);
  return (
    <DarkStage key="right" bars={false} dust={110} fog={0.3}>
      <div style={{opacity: 1 - clamp01((n - 42) / 6)}}>
      {/* ⚠ 磨砂玻璃在**均匀黑底上是看不出来的**（blur 一片黑还是黑）。
          所以板后面必须先有一片光池，玻璃才有东西可折射。 */}
      <div style={{
        position: 'absolute', left: 300, top: 210, width: 680, height: 300, borderRadius: 40,
        background: 'radial-gradient(closest-side, rgba(255,236,196,0.20) 0%, rgba(180,214,235,0.10) 52%, rgba(0,0,0,0) 78%)',
        filter: 'blur(34px)', opacity: clamp01((n - 2) / 16) * clamp01(1 - shard * 0.5),
      }} />
      {shard <= 0 ? (
        <GlassSlab x={392} y={286} w={496} h={148} p={inP} from="right" ry={-22} rx={6} z={70}
                   sweep={clamp01((n - 24) / 40)} blurPx={26}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                       gap: 8, fontFamily: FONT_KAI_BOLD, fontWeight: 700, fontSize: 58, color: DK.text}}>
            {letters.map((c, i) => {
              const lp = clamp01((n - (16 + i * 5)) / 10);
              return (
                <span key={i} style={{
                  opacity: lp, transform: `translateY(${(14 * (1 - lp)).toFixed(1)}px)`,
                  textShadow: `0 0 ${(20 * lp).toFixed(0)}px ${cineA(LIT.ice, 0.45 * lp)}, 0 4px 16px rgba(0,0,0,0.6)`,
                }}>{c}</span>
              );
            })}
          </div>
        </GlassSlab>
      ) : null}
      </div>
      {/* 碎裂：12 片玻璃多边形 + 粒子 */}
      {shard > 0 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {Array.from({length: 18}, (_, i) => {
            const a = rnd(61, i) * Math.PI * 2;
            const v = 130 + 260 * rnd(62, i);
            const r = (v / 4.2) * (1 - Math.exp(-4.2 * shard * 0.5));
            const x = 640 + r * Math.cos(a), y = 360 + r * Math.sin(a) + 60 * shard * shard;
            const s = 20 + 44 * rnd(63, i);
            const rot = (rnd(64, i) - 0.5) * 240 * shard * 3;
            const op = clamp01(1 - shard * 0.65);
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: y, width: s, height: s * 0.7,
                transform: `translate(-50%,-50%) rotate(${rot.toFixed(1)}deg)`,
                background: `linear-gradient(140deg, rgba(255,255,255,0.86) 0%, rgba(186,226,244,0.34) 45%, rgba(255,255,255,0.10) 100%)`,
                border: `1px solid ${cineA('#FFFFFF', 0.55)}`,
                boxShadow: `0 0 18px ${cineA(LIT.ice, 0.35)}, 0 6px 18px rgba(0,0,0,0.5)`, opacity: op,
                clipPath: 'polygon(0% 12%, 62% 0%, 100% 44%, 74% 100%, 18% 88%)',
              }} />
            );
          })}
          <Burst cx={640} cy={360} t={shard * 0.9} qty={150} seed={66} spread={420} life={0.95}
                 color={LIT.ice} color2={LIT.gold} gravity={300} flash />
        </AbsoluteFill>
      ) : null}
      <LightSweep p={clamp01((n - 40) / 30)} angle={-20} w={0.26} k={1} color="rgba(255,255,255,0.5)" />
      <CineCaption text={series} cx={640} cy={600} size={22} p={clamp01((n - 20) / 20) * clamp01(1 - shard)} />
    </DarkStage>
  );
};

/* ================================================================ K7 卷轴隧道（转场 · 2.6s / 78 帧）
f1–70    九层纸框沿纵深依次掠过（镜头高速穿过），近处框迅速变大掠出画面
f40–78   最后一层框内凝出朱砂短词
*/
export const CineTunnel: React.FC<CineProps> = ({word = '第 8 讲'}) => {
  const n = useCurrentFrame() + 1;
  const CAM = 600;
  const sp = 52;                                    // 每帧前进的 z 距离
  return (
    <DarkStage key="top" bars={false} dust={80} fog={0.25} grain={0.06}>
      <div style={{position: 'absolute', inset: 0, perspective: CAM, transformStyle: 'preserve-3d'}}>
        {Array.from({length: 9}, (_, i) => {
          // 从 -3000（远）走到 +400（掠过镜头），然后循环
          const z = ((i * 360 + n * sp) % 3400) - 3000;
          const scale = CAM / (CAM - z);
          if (scale < 0.1 || scale > 3.6) return null;
          const near = Math.abs(z) < 170;                            // 最靠近字的那一层：朱砂框
          const op = clamp01((z + 3000) / 800) * clamp01((600 - z) / 600);
          if (op <= 0.02) return null;
          return (
            <div key={i} style={{
              position: 'absolute', left: 640, top: 360, width: 900, height: 520,
              transform: `translate(-50%,-50%) translateZ(${z.toFixed(0)}px)`,
              opacity: op * 0.9,
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                border: `${near ? 2.4 : 2}px solid ${cineA(near ? LIT.cinnabar : DK.text, near ? 0.75 : 0.15)}`,
                boxShadow: `0 0 40px ${cineA(near ? LIT.cinnabar : LIT.ice, near ? 0.4 : 0.10)}, inset 0 0 60px rgba(255,255,255,0.04)`,
              }} />
              {/* 纸卷的截面：四角一小段纸色 */}
              <div style={{position: 'absolute', left: -6, top: -6, width: 60, height: 6, background: cineA(LIT.paper, 0.35)}} />
              <div style={{position: 'absolute', right: -6, bottom: -6, width: 60, height: 6, background: cineA(LIT.paper, 0.35)}} />
            </div>
          );
        })}
      </div>
      <CondenseText text={word} cx={640} cy={360} size={78} p={clamp01((n - 40) / 26)} color={DK.text}
                    glow={LIT.cinnabar} letterSpacing={34} />
      <LightSweep p={clamp01((n - 6) / 60)} angle={0} w={0.22} k={0.55} color="rgba(255,244,220,0.35)" />
      <Grain k={0.08} />
    </DarkStage>
  );
};

/* ================================================================ K8 星火落盘（片头 · 6.0s / 180 帧）
f1–40    十六宫以**发光线框**（青碧）自暗场里浮出（不是白底表格）
f54–92   三粒火星自上方落下，最后一粒落入某一宫
f92      涟漪三环 + 粒子；该宫描边转朱砂，宫内浮出「得病日」
f120–168 课名 3D 抬起 + 玻璃副题
*/
export const CineSparksPlate: React.FC<CineProps> = ({
  course = D.course, series = D.series, sub = D.sub, stop = '寅', lec = '', title = '',
}) => {
  const n = useCurrentFrame() + 1;
  const cell = 112, size = cell * 4;
  const ox = 640 - size / 2, oy = 356 - size / 2;
  const posOf: Record<string, number> = {};
  DIPAN_POS.forEach((z, i) => { if (z) posOf[z] = i; });
  const idx = posOf[stop] ?? 12;
  const tx = ox + (idx % 4) * cell + cell / 2;
  const ty = oy + Math.floor(idx / 4) * cell + cell / 2;
  const grid = clamp01((n - 4) / 40);
  const hit = clamp01((n - 92) / 12);
  const sparks = [
    {at: 54, x: tx - 150, y: ty},
    {at: 72, x: tx + 190, y: ty},
    {at: 90, x: tx, y: ty},
  ];
  return (
    <DarkStage key="left" bars dust={150} fog={0.45}>
      <div style={{position: 'absolute', inset: 0, perspective: 900, transformStyle: 'preserve-3d'}}>
        <div style={{
          position: 'absolute', left: 640, top: 356, width: size, height: size,
          transform: `translate(-50%,-50%) rotateX(52deg) scale(${(0.86 + 0.14 * grid).toFixed(3)})`,
          opacity: grid, transformStyle: 'preserve-3d',
        }}>
          {/* 发光网格线 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div style={{position: 'absolute', left: i * cell, top: 0, width: 1.2, height: size,
                           background: cineA(LIT.celadon, 0.42), boxShadow: `0 0 10px ${cineA(LIT.celadon, 0.35)}`}} />
              <div style={{position: 'absolute', left: 0, top: i * cell, width: size, height: 1.2,
                           background: cineA(LIT.celadon, 0.42), boxShadow: `0 0 10px ${cineA(LIT.celadon, 0.35)}`}} />
            </React.Fragment>
          ))}
          {/* 中心 2×2 合并格 */}
          <div style={{position: 'absolute', left: cell, top: cell, width: cell * 2, height: cell * 2,
                       background: cineA(LIT.celadon, 0.06), border: `1px solid ${cineA(LIT.celadon, 0.5)}`}} />
          {/* 十二支（坐标字） */}
          {DIPAN_POS.map((z, i) => {
            if (!z) return null;
            const x = (i % 4) * cell + cell / 2, y = Math.floor(i / 4) * cell + cell / 2;
            const isHit = z === stop;
            return (
              <div key={z} style={{
                position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%) rotateX(-52deg)',
                fontFamily: FONT_KAI, fontSize: 26, lineHeight: 1,
                color: isHit && hit > 0.4 ? LIT.cinnabar : cineA(DK.text, 0.72),
                textShadow: isHit && hit > 0.4 ? `0 0 20px ${cineA(LIT.cinnabar, 0.8)}` : '0 2px 8px rgba(0,0,0,0.6)',
              }}>{z}</div>
            );
          })}
          {/* 落点宫的描边 */}
          {hit > 0 ? (
            <div style={{
              position: 'absolute', left: (idx % 4) * cell + 4, top: Math.floor(idx / 4) * cell + 4,
              width: cell - 8, height: cell - 8, border: `2px solid ${LIT.cinnabar}`,
              boxShadow: `0 0 ${(24 * hit).toFixed(0)}px ${cineA(LIT.cinnabar, 0.55 * hit)}, inset 0 0 ${(20 * hit).toFixed(0)}px ${cineA(LIT.cinnabar, 0.25)}`,
              opacity: hit,
            }} />
          ) : null}
        </div>
      </div>
      {/* 火星：三粒落下，带拖尾 */}
      {sparks.map((s2, i) => {
        if (n < s2.at) return null;
        const t = clamp01((n - s2.at) / 28);
        if (t >= 1) return null;
        const y = s2.y - 420 * (1 - easeOutCubic(t));
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: s2.x - 2, top: y - 52, width: 4, height: 52,
                         background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${cineA(LIT.gold, 0.75)} 100%)`,
                         filter: 'blur(1.5px)'}} />
            <div style={{position: 'absolute', left: s2.x - 4, top: y - 4, width: 8, height: 8, borderRadius: 4,
                         background: LIT.gold, boxShadow: `0 0 22px 10px ${cineA(LIT.gold, 0.55)}`}} />
          </React.Fragment>
        );
      })}
      <Burst cx={tx} cy={ty} t={Math.max(0, (n - 92) / 30)} qty={110} seed={71} spread={260} life={1.0}
             color={LIT.cinnabar} color2={LIT.gold} />
      <Flare x={tx} y={ty} k={hit * 0.7} len={380} />
      <Extrude text={course} cx={640} cy={150} size={54} p={clamp01((n - 124) / 26)} layers={7} depth={18} rx={8} ry={-10} />
      <CineCaption text={`${series} · ${sub}`} cx={640} cy={196} size={22} p={clamp01((n - 140) / 22)} />
      {lec || title ? (
        <CineCaption text={[lec, title].filter(Boolean).join(' · ')} cx={640} cy={664} size={26}
                     p={clamp01((n - 150) / 22)} color={DK.text} />
      ) : null}
    </DarkStage>
  );
};

/* ================================================================ K9 雾中凝字（片头 · 5.0s / 150 帧）
f1–40    浓雾自左涌入；字从雾里凝出（模糊 18 → 0，字距收拢）
f70–104  朱砂光线横扫 + 变形光斑
f104–150 雾退，字定格，副题浮出
*/
export const CineWordsFog: React.FC<CineProps> = ({
  course = D.course, series = D.series, sub = D.sub, tagline = '不望闻问切，只要得病日期', lec = '', title = '',
}) => {
  const n = useCurrentFrame() + 1;
  const cond = clamp01((n - 16) / 62);
  const fogIn = clamp01((n - 2) / 34) * (1 - clamp01((n - 104) / 40));
  const out = clamp01((n - 104) / 40);
  return (
    <DarkStage key="left" bars dust={130} fog={0.3} grain={0.06}>
      {/* 涌进来的浓雾 */}
      <div style={{
        position: 'absolute', left: -240 + 300 * clamp01((n - 2) / 60), top: 60, width: 1200, height: 620,
        borderRadius: '50%', opacity: fogIn,
        background: 'radial-gradient(closest-side, rgba(214,226,234,0.22) 0%, rgba(180,200,214,0.10) 48%, rgba(0,0,0,0) 76%)',
        filter: 'blur(30px)',
      }} />
      <CondenseText text={course} cx={640} cy={348} size={110} p={cond} color={DK.text} glow={LIT.ice} letterSpacing={34} />
      <LightSweep p={clamp01((n - 70) / 36)} angle={-8} w={0.3} k={0.8} color="rgba(255,232,190,0.45)" />
      <Flare x={640} y={348} k={clamp01((n - 82) / 30) * (1 - out * 0.6)} len={560} />
      <CineCaption text={tagline} cx={640} cy={492} size={28} p={clamp01((n - 108) / 24)} />
      <CineCaption text={`${series} · ${sub}`} cx={640} cy={140} size={22} p={clamp01((n - 100) / 24)} />
      {lec || title ? (
        <CineCaption text={[lec, title].filter(Boolean).join(' · ')} cx={640} cy={640} size={26}
                     p={clamp01((n - 118) / 22)} color={DK.text} />
      ) : null}
    </DarkStage>
  );
};

/* ================================================================ K10 印落成雷（转场 · 2.5s / 75 帧）
f1–26    方印带 3D 旋转落下
f26      落定：三层冲击环 + 粒子 + **单帧**闪白（不频闪）
f34–60   短词自印下浮出
f60–75   余波散尽
*/
export const CineSealThunder: React.FC<CineProps> = ({word = '落印', series = D.series}) => {
  const n = useCurrentFrame() + 1;
  const fall = clamp01((n - 2) / 24);
  const y = 344 - 300 * (1 - Math.pow(fall, 2.2));
  const t = Math.max(0, (n - 26) / 30);
  const flash = n >= 26 && n <= 27 ? 0.72 : 0;
  return (
    <DarkStage key="top" bars={false} dust={120} fog={0.35} grain={0.07}>
      {flash > 0 ? <AbsoluteFill style={{background: `rgba(255,248,232,${flash})`}} /> : null}
      <Seal3D cx={640} cy={y} size={186} chars="钤法" k={clamp01(fall * 1.4)} spin={1} />
      <Burst cx={640} cy={344} t={t} qty={190} seed={81} spread={430} life={1.25}
             color={LIT.cinnabar} color2={LIT.gold} gravity={300} ringScale={2.1} />
      <Burst cx={640} cy={344} t={Math.max(0, (n - 30) / 30)} qty={90} seed={83} spread={300} life={1.0}
             color={LIT.gold} color2={DK.text} gravity={260} ring={false} flash={false} />
      <Flare x={640} y={344} k={clamp01((n - 26) / 18) * clamp01(1 - t * 0.5)} len={480} />
      <CineCaption text={word} cx={640} cy={520} size={34} p={clamp01((n - 34) / 18)} color={DK.text} />
      <CineCaption text={series} cx={640} cy={604} size={22} p={clamp01((n - 42) / 20) * clamp01(1 - t)} />
    </DarkStage>
  );
};

/* ================================================================ 合集（给评审 / 发布用）
 * 十支按顺序硬切拼成一条 49 秒的片子。每支首末都在暗场里，硬切本身就是预告片的剪法。
 * 单独注册成 CineReel，不参与单片渲染。
 */
import {Sequence} from 'remotion';
const REEL: Array<{C: React.FC<CineProps>; len: number}> = [
  {C: CineAwakening, len: 240},
  {C: CineLightThrough, len: 210},
  {C: CineGanzhiFlow, len: 195},
  {C: CineRing3D, len: 180},
  {C: CineInkBurst, len: 90},
  {C: CineGlassSlab, len: 75},
  {C: CineTunnel, len: 78},
  {C: CineSparksPlate, len: 180},
  {C: CineWordsFog, len: 150},
  {C: CineSealThunder, len: 75},
];
export const CINE_REEL_FRAMES = REEL.reduce((a, b) => a + b.len, 0);
export const CineReel: React.FC<CineProps> = (props) => {
  let at = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {REEL.map(({C, len}, i) => {
        const from = at;
        at += len;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <C {...props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
