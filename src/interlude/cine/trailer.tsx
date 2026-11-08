import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {
  DK, LIT, cineA, DarkStage, LightSweep, Flare, Extrude, Burst, CondenseText, CineCaption,
  Dust, Grain, easeOutCubic, easeInOutCubic, clamp01, rnd,
} from './engine';
import {FONT_KAI, FONT_KAI_BOLD} from '../../shushu/paper';
import {JIAZI, DIPAN_POS, RING_POS, type Zhi} from '../../qianfa/data';

/**
 * 预告片（v3）—— 按操作者 2026-11-08 的分镜重做，只有四镜：
 *
 *   一、医学（停留）→ 忽的多个 & → 再多出 数术
 *   二、六十花甲子横竖乱飞（低透明度）→ 中央罗盘内圈十二地支（不动）
 *       → 外圈再逐个显示一遍十二地支（流逝感）→ 显示完只有外圈转圈
 *   三、六经营卫 / 主病行流…四字名词歪斜、不固定位置地堆满屏幕 → 玻璃破碎
 *   四、伤寒钤法 +「换个眼睛看中医」（只在这里出现课名）
 *
 * 删掉的：反复出现的「伤寒钤法」、莫名的「甲寅」停留、「寅」的红色特效、
 * 无意义的「续」与「第 8 讲」。
 */

const D = {course: '伤寒钤法', series: '清源勘道', sub: '术数精讲', tagline: '换个眼睛看中医'};

/* ---------------------------------------------------------------- 镜一 · 医学 & 数术（225 帧 / 7.5s）
f1–34    深场里先起光；「医学」压进来（3D 抬起 + 光晕）
f34–92   停留：只呼吸（尘埃、光斑脉动）—— 操作者要求"大字：医学，停留"
f92–110  下一行**忽的**多出一个 &
f118–140 再多出「数术」（与 & 同排）
f140–225 整块定格，光扫过
*/
const ShotA: React.FC = () => {
  const n = useCurrentFrame() + 1;
  const breathe = 0.5 + 0.5 * Math.sin(n * 0.03);
  const amp = clamp01((n - 92) / 8);
  const shu = clamp01((n - 118) / 12);
  return (
    <DarkStage key="left" bars dust={150} fog={0.5}>
      <Extrude text="医学" cx={640} cy={286} size={186} p={clamp01((n - 6) / 34)} layers={10} depth={30}
               rx={7} ry={-13} letterSpacing={16} />
      {amp > 0 ? (
        <>
          <Flare x={640} y={472} k={amp * (0.5 + 0.5 * breathe)} len={340} color={LIT.gold} />
          <Extrude text="&" cx={498} cy={472} size={104} p={amp} layers={7} depth={22} rx={6} ry={-10}
                   glow={LIT.gold} letterSpacing={0} />
        </>
      ) : null}
      {shu > 0 ? (
        <Extrude text="数术" cx={772} cy={472} size={144} p={shu} layers={9} depth={26} rx={6} ry={-12}
                 letterSpacing={14} />
      ) : null}
      <LightSweep p={clamp01((n - 150) / 60)} angle={12} w={0.3} k={0.55} />
    </DarkStage>
  );
};

/* ---------------------------------------------------------------- 镜二 · 花甲子 → 罗盘（360 帧 / 12.0s）
f1–78     六十花甲子横竖乱飞：每枚各有方向（横飞或竖飞）、低透明度、大小不一
f78–120   甲子淡出；罗盘浮现：**内圈**十二地支（固定不动）+ 刻度
f140–240  **外圈**逐个显示十二地支（每支 8 帧，带流逝感）
f240–360  花甲子已散尽，只剩外圈转圈（内圈始终不动）
*/
const RING = RING_POS.map((p) => DIPAN_POS[p] as Zhi);      // 午在顶、顺时针
const ShotB: React.FC = () => {
  const n = useCurrentFrame() + 1;
  const cx = 640, cy = 356;
  const swarm = 1 - clamp01((n - 78) / 42);                 // 花甲子的存在感
  const compass = clamp01((n - 78) / 30);
  const outerSpin = n > 240 ? (n - 240) * 0.36 : 0;         // 显示完之后只有外圈转
  const seedWords = Array.from({length: 60}, (_, i) => i);
  return (
    <DarkStage key="top" bars dust={110} fog={0.35}>
      {/* 花甲子乱飞 */}
      {swarm > 0.01 ? (
        <AbsoluteFill style={{opacity: swarm}}>
          {seedWords.map((i) => {
            const horiz = rnd(9, i) > 0.5;                    // 横飞 / 竖飞
            const speed = 0.6 + 2.2 * rnd(10, i);
            const rot = (rnd(11, i) - 0.5) * 46;
            const x0 = rnd(12, i) * 1280, y0 = rnd(13, i) * 720;
            const x = horiz ? ((x0 + n * speed * 5) % 1680) - 200 : x0 + Math.sin(n * 0.01 + i) * 40;
            const y = horiz ? y0 + Math.sin(n * 0.012 + i) * 30 : ((y0 + n * speed * 5) % 1000) - 140;
            const size = 20 + 34 * rnd(14, i);
            const op = 0.07 + 0.16 * rnd(15, i);
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`,
                fontFamily: FONT_KAI_BOLD, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap',
                color: DK.text, opacity: op,
              }}>{JIAZI[i]}</div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* 罗盘 */}
      {compass > 0.01 ? (
        <AbsoluteFill style={{opacity: compass}}>
          {/* 盘面底光 */}
          <div style={{
            position: 'absolute', left: cx - 330, top: cy - 330, width: 660, height: 660, borderRadius: 330,
            background: `radial-gradient(closest-side, ${cineA('#8AD8E8', 0.10)} 0%, rgba(0,0,0,0) 72%)`,
            filter: 'blur(18px)',
          }} />
          <svg width="1280" height="720" style={{position: 'absolute', inset: 0}}>
            {[196, 244, 320].map((r, i) => (
              <circle key={r} cx={cx} cy={cy} r={r} fill="none"
                      stroke={i === 0 ? cineA(LIT.celadon, 0.55) : cineA(DK.text, 0.16)}
                      strokeWidth={i === 0 ? 1.4 : 1} strokeDasharray={i === 1 ? '3 6' : undefined} />
            ))}
            {/* 内圈刻度：从环上向外的短线（用 SVG 画，不要拿 div 的 rotate 去凑角度） */}
            {RING.map((z, i) => {
              const a = ((i - 1) * 30 - 90) * Math.PI / 180;
              const r0 = 196, r1 = 214;
              return (
                <line key={`t${z}`} x1={cx + r0 * Math.cos(a)} y1={cy + r0 * Math.sin(a)}
                      x2={cx + r1 * Math.cos(a)} y2={cy + r1 * Math.sin(a)}
                      stroke={cineA(LIT.celadon, 0.5)} strokeWidth={1.6} />
              );
            })}
          </svg>
          {/* 内圈十二地支：**固定不动** */}
          {RING.map((z, i) => {
            const a = ((i - 1) * 30 - 90) * Math.PI / 180;
            const x = cx + 222 * Math.cos(a), y = cy + 222 * Math.sin(a);
            const p = clamp01((n - 96 - i * 1.6) / 16);
            return (
              <React.Fragment key={`in${z}`}>
                <div style={{
                  position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', opacity: p,
                  fontFamily: FONT_KAI_BOLD, fontSize: 34, color: DK.text, lineHeight: 1,
                  textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                }}>{z}</div>
              </React.Fragment>
            );
          })}
          {/* 外圈：逐个显示，随后整圈转 */}
          <div style={{position: 'absolute', inset: 0, transform: `rotate(${outerSpin.toFixed(2)}deg)`, transformOrigin: `${cx}px ${cy}px`}}>
            {RING.map((z, i) => {
              const at = 140 + i * 8;
              const p = clamp01((n - at) / 12);
              if (p <= 0) return null;
              const a = ((i - 1) * 30 - 90) * Math.PI / 180;
              const x = cx + 322 * Math.cos(a), y = cy + 322 * Math.sin(a);
              return (
                <div key={`out${z}`} style={{
                  position: 'absolute', left: x, top: y,
                  // 反向自转：圈在转，字保持正立（否则读不出"转圈"）
                  transform: `translate(-50%,-50%) rotate(${(-outerSpin).toFixed(2)}deg) scale(${(0.7 + 0.3 * p).toFixed(3)})`,
                  opacity: p,
                  fontFamily: FONT_KAI_BOLD, fontSize: 46, color: LIT.paper, lineHeight: 1,
                  textShadow: `0 0 18px ${cineA(LIT.ice, 0.35)}, 0 3px 12px rgba(0,0,0,0.7)`,
                }}>{z}</div>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : null}
    </DarkStage>
  );
};

/* ---------------------------------------------------------------- 镜三 · 四字名词堆满 → 玻璃碎（270 帧 / 9.0s）
f1–118    四字术语一枚接一枚地**歪斜、不固定位置**地堆满屏幕
f118–150  定格一瞬
f150–214  玻璃破碎：24 片碎片带着光飞出去 + 粒子 + 单帧闪；术语随平面一起碎掉
f214–270  碎片散尽
*/
const TERMS = [
  '六经营卫', '主病行流', '三司排盘', '天盘地支', '天盘天干', '六经辨证',
  '药号推算', '五经查方', '病传六日', '两感欲解', '痉湿喝证', '客主加临',
  '五运受病', '三丘五墓', '汗瘥棺墓', '欲解时辰', '霍乱劳复',
];
const ShotC: React.FC = () => {
  const n = useCurrentFrame() + 1;
  const shard = Math.max(0, (n - 150) / 32);
  const gone = clamp01((n - 150) / 14);
  return (
    <DarkStage key="right" bars dust={130} fog={0.4} grain={0.06}>
      {/* 术语云（**不固定位置**：位置/角度按种子给定，长短句错落） */}
      <AbsoluteFill style={{opacity: 1 - gone}}>
        {TERMS.map((t, i) => {
          const at = 4 + i * 6.6;
          const p = clamp01((n - at) / 12);
          if (p <= 0) return null;
          const x = 120 + rnd(21, i) * 1040;
          const y = 120 + rnd(22, i) * 470;
          const rot = (rnd(23, i) - 0.5) * 30;          // 歪斜
          const size = 34 + 26 * rnd(24, i);
          const hot = i === 0 || i === 1;               // 操作者点名的两个词给一点重量
          return (
            <div key={t} style={{
              position: 'absolute', left: x, top: y,
              transform: `translate(-50%,-50%) rotate(${rot.toFixed(1)}deg) scale(${(0.86 + 0.14 * p).toFixed(3)})`,
              opacity: p * (hot ? 0.96 : 0.82),
              fontFamily: FONT_KAI_BOLD, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap',
              color: hot ? LIT.paper : DK.text,
              textShadow: hot ? `0 0 20px ${cineA(LIT.ice, 0.30)}, 0 4px 14px rgba(0,0,0,0.7)` : '0 3px 12px rgba(0,0,0,0.65)',
            }}>{t}</div>
          );
        })}
      </AbsoluteFill>
      {/* 玻璃破碎 */}
      {shard > 0 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {n >= 150 && n <= 151 ? <AbsoluteFill style={{background: 'rgba(255,250,240,0.55)'}} /> : null}
          {Array.from({length: 24}, (_, i) => {
            const a = rnd(31, i) * Math.PI * 2;
            const v = 170 + 400 * rnd(32, i);
            const r = (v / 4.4) * (1 - Math.exp(-4.4 * shard * 0.5));
            const x = 640 + r * Math.cos(a), y = 356 + r * Math.sin(a) + 70 * shard * shard;
            const s = 34 + 78 * rnd(33, i);
            const rot = (rnd(34, i) - 0.5) * 300 * shard * 3;
            const op = clamp01(1 - shard * 0.6);
            return (
              <div key={i} style={{
                position: 'absolute', left: x, top: y, width: s, height: s * 0.72,
                transform: `translate(-50%,-50%) rotate(${rot.toFixed(1)}deg)`,
                background: 'linear-gradient(140deg, rgba(255,255,255,0.88) 0%, rgba(186,226,244,0.34) 46%, rgba(255,255,255,0.10) 100%)',
                border: `1px solid ${cineA('#FFFFFF', 0.55)}`,
                boxShadow: `0 0 18px ${cineA(LIT.ice, 0.35)}, 0 6px 18px rgba(0,0,0,0.5)`,
                clipPath: 'polygon(0% 12%, 62% 0%, 100% 44%, 74% 100%, 18% 88%)',
                opacity: op,
              }} />
            );
          })}
          <Burst cx={640} cy={356} t={shard * 0.9} qty={170} seed={36} spread={440} life={1.0}
                 color={LIT.ice} color2={LIT.gold} gravity={300} ringScale={1.5} />
        </AbsoluteFill>
      ) : null}
    </DarkStage>
  );
};

/* ---------------------------------------------------------------- 镜四 · 伤寒钤法（300 帧 / 10.0s）
f1–70     光起，立体字「伤寒钤法」从暗场里抬起来
f70–150   定格（呼吸）
f150–200  小标题「换个眼睛看中医」淡入（替代原来那句炒作式对偶）
f200–300  频道角标 + 长定格
*/
const ShotD: React.FC<{course: string; tagline: string; series: string; sub: string}> = ({course, tagline, series, sub}) => {
  const n = useCurrentFrame() + 1;
  const breathe = 0.5 + 0.5 * Math.sin(n * 0.028);
  return (
    <DarkStage key="top" bars dust={170} fog={0.55}>
      <LightSweep p={clamp01((n - 4) / 70)} angle={-10} w={0.4} k={0.7} />
      <Extrude text={course} cx={640} cy={326} size={172} p={clamp01((n - 8) / 56)} layers={11} depth={32}
               rx={8} ry={-14} letterSpacing={18} />
      <Flare x={640} y={326} k={clamp01((n - 60) / 40) * (0.5 + 0.5 * breathe)} len={600} />
      <CineCaption text={tagline} cx={640} cy={508} size={46} p={clamp01((n - 150) / 30)} color={DK.text} letterSpacing={12} />
      <CineCaption text={`${series} · ${sub}`} cx={640} cy={176} size={22} p={clamp01((n - 200) / 26)} />
    </DarkStage>
  );
};

/* ---------------------------------------------------------------- 预告片本体 */
export const SHOT_LENS = [225, 360, 270, 300];
export const CINE_TRAILER_FRAMES = SHOT_LENS.reduce((a, b) => a + b, 0);

export type TrailerProps = {course?: string; series?: string; sub?: string; tagline?: string};

export const CineTrailer: React.FC<TrailerProps> = ({
  course = D.course, series = D.series, sub = D.sub, tagline = D.tagline,
}) => {
  let at = 0;
  const seq: Array<{node: React.ReactNode; len: number}> = [
    {node: <ShotA />, len: SHOT_LENS[0]},
    {node: <ShotB />, len: SHOT_LENS[1]},
    {node: <ShotC />, len: SHOT_LENS[2]},
    {node: <ShotD course={course} tagline={tagline} series={series} sub={sub} />, len: SHOT_LENS[3]},
  ];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {seq.map((s, i) => {
        const from = at;
        at += s.len;
        return <Sequence key={i} from={from} durationInFrames={s.len}>{s.node}</Sequence>;
      })}
    </AbsoluteFill>
  );
};
void Grain;
