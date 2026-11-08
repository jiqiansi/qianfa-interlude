import React from 'react';
import {useCurrentFrame, Sequence} from 'remotion';
import {CText} from '../ui';
import {TOTAL_FRAMES, CHAPTER_STARTS, SENTENCES, SHOT_RANGES} from '../common';
import {SUBS} from '../common/subs';
import {clamp01} from '../common/easing';
import {VIDEO} from '../config';
import {INK, INK_MID, INK_SOFT, INK_FAINT, RULE, CINNABAR,
  FONT_KAI, FONT_KAI_BOLD, alpha, inkSpread, inkDry} from './paper';

/**
 * 讲次号取自 config 的 slug（qianfa-l05 → 5）。
 * 页眉/章节笺上写的是**本讲在全课程里的序号**，不是章内序号——
 * 否则第 5 讲的屏幕上会出现「第 2 讲」这种误导。
 */
const LECTURE = (() => {
  const m = /l(\d+)\s*$/.exec(VIDEO.slug ?? '');
  return m ? String(parseInt(m[1], 10)) : '';
})();

/**
 * 纸本覆盖层：片头 / 章节笺 / 页眉 / 进度线 / 字幕。
 * 替代 anything2explainer 的黑底紫胶囊覆盖层。这里所有组件只用墨色和朱砂，
 * 不用 Glitch、不用霓虹 glow，动效是「落墨 / 翻页 / 朱印轻按」。
 */

const TITLE_TO = SENTENCES[0]?.from ? SENTENCES[0].from - 1 : 150;

/** 片头题签：淡墨落字 → 朱砂短线出现 → 副题。 */
export const PaperTitle: React.FC = () => {
  const N = useCurrentFrame() + 1;
  const p = inkSpread(N - 12, 18);
  const exit = N > TITLE_TO - 10 ? inkDry(N - (TITLE_TO - 10), 10) : 1;
  const op = p * exit;
  if (op <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op}}>
      {/* 左上小题签：系列名 */}
      <CText cx={640} cy={245} size={24} weight={500} family={FONT_KAI}
              color={INK_FAINT} letterSpacing={5} opacity={p * 0.8}>术数精讲</CText>
      {/* 主标题：楷体墨字，不压窄、不发光 */}
      <CText cx={640} cy={330} size={78} weight={700} family={FONT_KAI_BOLD}
              color={INK}>{VIDEO.title.rest || VIDEO.title.big}</CText>
      {/* 朱砂落线：像书签 / 题签下的印线 */}
      <div style={{position: 'absolute', left: 640 - 150 * p, top: 390, width: 300 * p, height: 2,
                   background: CINNABAR, opacity: p * 0.72}} />
      {/* 副题 */}
      <CText cx={640} cy={438} size={28} weight={500} family={FONT_KAI}
              color={INK_SOFT} opacity={inkSpread(N - 32, 16)}>{VIDEO.title.tagline}</CText>
      {/* 角落朱印（若有作者/系列名，印章是装饰，不作焦点抢占） */}
      <div style={{position: 'absolute', right: 176, bottom: 150, width: 52, height: 52,
                   border: `1.5px solid ${alpha(CINNABAR, 0.45)}`, borderRadius: 3,
                   display: 'flex', alignItems: 'center', justifyContent: 'center',
                   color: alpha(CINNABAR, 0.55), fontFamily: FONT_KAI_BOLD, fontSize: 24,
                   transform: 'rotate(-3deg)'}}>术</div>
    </div>
  );
};

/**
 * 章节笺：纸本小标题，不盖底色，只用细朱砂线与墨字。
 *
 * ⚠ 边界必须按 **镜头区间（SHOT_RANGES）** 算，不能按句子（SENTENCES）算。
 * 踩过的坑（2026-10-03，L16 抽帧发现）：镜头会「吃掉」句与句之间的留白——
 * 首句 S01 到 232 帧，镜头 SC01 却到 307 帧。按句子边界算，章节笺会落在
 * 235–287，**正好压进片头镜头里**，和「本讲路线」条目叠成一团
 * （片头 SC01 是 86–307，章节笺是 235–287，重叠 53 帧）。
 * 所以这里取「上一镜的 to」当起点；**放不下就不放**（宁可不显示，
 * 也不要在镜头里再叠一层字）。
 */
const chapterCards = CHAPTER_STARTS.slice(1).map((c, i) => {
  const first = SENTENCES.find((s) => s.chapter === c.n);
  const si = first ? SHOT_RANGES.findIndex((r) => r.sentence === first.id) : -1;
  const prevTo = si > 0 ? SHOT_RANGES[si - 1].to : null;
  const from = prevTo != null ? prevTo + 3 : (first?.from ?? c.from);
  const to = (first?.from ?? c.from) - 3;
  return {n: c.n, title: c.title, from, to, index: i + 2};
}).filter((c) => c.to - c.from >= 12);          // 放不下 / 太短 → 不显示

export const PaperChapterCards: React.FC = () => {
  const N = useCurrentFrame() + 1;
  const card = chapterCards.find((c) => N >= c.from && N <= c.to);
  if (!card) return null;
  const n = N - card.from;
  const out = card.to - N;
  const p = inkSpread(n, 16) * inkDry(12 - out, 12);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: p}}>
      <CText cx={640} cy={288} size={21} weight={500} family={FONT_KAI}
              color={INK_FAINT} letterSpacing={6}>第 {LECTURE} 讲</CText>
      <CText cx={640} cy={365} size={68} weight={700} family={FONT_KAI_BOLD}
              color={INK}>{card.title}</CText>
      <div style={{position: 'absolute', left: 640 - 86 * clamp01(n / 18), top: 425, width: 172 * clamp01(n / 18), height: 2,
                   background: CINNABAR, opacity: 0.72}} />
      <CText cx={640} cy={475} size={24} family={FONT_KAI} color={INK_SOFT}>承上 · 启下 · 逐步推演</CText>
    </div>
  );
};

/** 页眉：左侧章名 + 右侧小进度点，像书页眉而非 UI 胶囊。 */
export const PaperHeader: React.FC = () => {
  const N = useCurrentFrame() + 1;
  if (!CHAPTER_STARTS.length || N < 80 || N > TOTAL_FRAMES - 45) return null;
  let chapter = CHAPTER_STARTS[0];
  for (const c of CHAPTER_STARTS) if (N >= c.from) chapter = c;
  const p = inkSpread(N - chapter.from, 12);
  return (
    <div style={{position: 'absolute', left: 76, top: 32, opacity: 0.78 * p,
                 display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{width: 3, height: 22, background: CINNABAR, borderRadius: 1}} />
      <span style={{fontFamily: FONT_KAI_BOLD, fontSize: 23, color: INK_MID}}>{chapter.title}</span>
      <span style={{fontFamily: FONT_KAI, fontSize: 18, color: INK_FAINT}}>第 {LECTURE} 讲</span>
    </div>
  );
};

/** 纸本进度线：底部一根细朱砂线 + 小型章节刻度；无紫色大条。 */
export const PaperProgress: React.FC = () => {
  const N = useCurrentFrame() + 1;
  const p = Math.max(0, Math.min(1, N / Math.max(1, TOTAL_FRAMES)));
  const y = 686;
  return (
    <div style={{position: 'absolute', left: 76, top: y, width: 1128, height: 20, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1128, height: 1, background: RULE}} />
      <div style={{position: 'absolute', left: 0, top: -0.5, width: 1128 * p, height: 2, background: CINNABAR, opacity: 0.78}} />
      {CHAPTER_STARTS.slice(1).map((c) => {
        const x = 1128 * (c.from / Math.max(1, TOTAL_FRAMES));
        return <div key={c.n} style={{position: 'absolute', left: x - 1, top: -3, width: 1.5, height: 7, background: INK_FAINT}} />;
      })}
      <div style={{position: 'absolute', left: 1128 * p - 3, top: -2, width: 6, height: 6,
                   borderRadius: 3, background: CINNABAR}} />
    </div>
  );
};

/** 纸本字幕：墨色楷体，贴着纸，不加黑描边/白底字幕框。 */
export const PaperSubtitle: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: 640, top: 637, transform: 'translateX(-50%)',
               maxWidth: 1120, whiteSpace: 'nowrap', textAlign: 'center',
               fontFamily: FONT_KAI_BOLD, fontWeight: 600, fontSize: 40, lineHeight: 1.18,
               color: INK, letterSpacing: 1,
               textShadow: '0 1px 0 rgba(246,240,223,.8)'}}>{text}</div>
);

export const PaperSubtitles: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    {SUBS.map((s, i) => (
      <Sequence key={i} from={s.from - 1} durationInFrames={Math.max(1, s.to - s.from + 1)}>
        <PaperSubtitle text={s.text} />
      </Sequence>
    ))}
  </div>
);

