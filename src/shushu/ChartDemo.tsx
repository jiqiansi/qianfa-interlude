import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {Fonts} from '../common';
import {CText} from '../ui';
import {PaperBg} from './paperbg';
import {HexChart, SplitMergeGua} from './chart';
import {WuxingRing, BaguaCompare, SiXiangPanel, CeGuiBoard, YingqiTimeline} from './charts';
import {DizhiWheel, NajiaPanel, type NajiaLine} from './ganzhi';
import {DEMO_HEX, DEMO_HU, DEMO_BIAN, DEMO_MOVING, YAO_POS} from './chartdata';
import {INK, INK_SOFT, INK_FAINT, CINNABAR, FONT_KAI, FONT_KAI_BOLD} from './paper';

/**
 * 47 秒术数图元验证样片（不是完整课程，不声称是原书占例）。
 * 用途：验证纸底/字体/卦盘/动爻翻转/五行环/方位移宫，以及数理、干支、应期组件的
 * 数据接口和待核状态。演示盘只使用 chartdata.ts 的纯数学关系，不承载占断结论。
 *
 * 0–12s 本互变三列盘，五爻动，逐帧展示互卦来源与变爻
 * 12–17s 五行生克环，节点/相生/相克逐层落墨
 * 17–22s 先天→后天八卦，八个卦按身份逐个移宫
 * 22–27s 上下卦拆合，展示结构变化而不是硬切卦名
 * 27–33s 四象与策轨数理宫位的接口示意，数值缺失明确显示“缺”
 * 33–39s 十二地支轮与纳甲表的接口示意，不补造纳甲数据
 * 39–44s 应期筛选时间轴模板，不代算日期
 * 44–47s 总结卡
 */
const Header: React.FC<{title: string; sub?: string}> = ({title, sub}) => (
  <>
    <div style={{position:'absolute',left:76,top:34,width:3,height:26,background:CINNABAR}} />
    <CText cx={176} cy={47} size={25} weight={700} family={FONT_KAI_BOLD} color={INK}>{title}</CText>
    {sub ? <CText cx={1110} cy={48} size={19} weight={500} family={FONT_KAI} color={INK_FAINT}>{sub}</CText> : null}
    <div style={{position:'absolute',left:76,top:72,width:1128,height:1,background:'#C9BE9F'}} />
  </>
);

const HexSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="动爻如何变卦" sub="演示数据 · 非原书占例" />
    <CText cx={640} cy={118} size={23} family={FONT_KAI} color={INK_SOFT}>
      {DEMO_HEX.name} · {DEMO_MOVING.map((p) => YAO_POS[p - 1]).join('、')}爻动：跟着爻画，从本卦推到互卦与变卦
    </CText>
    <HexChart cx={245} cy={390} colGap={340} ben={DEMO_HEX} hu={DEMO_HU} bian={DEMO_BIAN}
      moving={DEMO_MOVING} N={N} f0={22} flipAt={150} show={{hu:true,bian:true}} tiYong />
    <CText cx={640} cy={670} size={18} family={FONT_KAI} color={INK_FAINT}>
      互卦：二三四为下、三四五为上 · {DEMO_MOVING.map((p) => YAO_POS[p - 1]).join('、')}爻动：只翻动爻
    </CText>
  </AbsoluteFill>;
};

const WuxingSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="五行生克" sub="相生环 · 相克星" />
    <CText cx={640} cy={126} size={23} family={FONT_KAI} color={INK_SOFT}>
      相生顺环，相克交错；高亮表示当前讲到的关系
    </CText>
    <WuxingRing cx={640} cy={368} r={165} N={N} f0={22} mode="both" focus={['木','土']} relationText labels />
  </AbsoluteFill>;
};

const BaguaSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="先天与后天" sub="八宫逐一移位" />
    <CText cx={640} cy={122} size={22} family={FONT_KAI} color={INK_SOFT}>
      方位图上南下北、左东右西；切换时逐个追踪八卦的位置
    </CText>
    <BaguaCompare cx={640} cy={355} size={260} N={N} f0={22} stepFrames={14} />
  </AbsoluteFill>;
};

const SplitSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="上下卦拆合" sub="拆开看 · 合起来算" />
    <CText cx={640} cy={122} size={22} family={FONT_KAI} color={INK_SOFT}>
      上卦、下卦先分开落位，再合成六爻本卦；初爻始终在下
    </CText>
    <SplitMergeGua cx={640} cy={380} upper="艮" lower="坎" N={N} f0={22} mergeAt={88} gap={210} label />
    <CText cx={640} cy={640} size={20} family={FONT_KAI} color={INK_FAINT}>
      上{DEMO_HEX.upper} · 下{DEMO_HEX.lower} · 合成{DEMO_HEX.name}（演示数据）
    </CText>
  </AbsoluteFill>;
};

const ArithmeticSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="数理接口" sub="四象 · 原会运世" />
    <CText cx={640} cy={118} size={21} family={FONT_KAI} color={INK_SOFT}>
      先展示结构，再填入经过考校的输入；缺数不写成 0
    </CText>
    <SiXiangPanel x={92} y={218} w={490} h={250} N={N} f0={22} active="少阴" />
    <CeGuiBoard x={640} y={238} w={548} h={214} values={{原:null,会:null,运:null,世:null}}
      missing={['原','会','运','世']} N={N} f0={22} hierarchy />
    <CText cx={640} cy={610} size={20} family={FONT_KAI} color={CINNABAR}>
      数值未提供 · 只验证排版与缺数状态，不代算
    </CText>
  </AbsoluteFill>;
};

const NAJIA_DEMO_LINES: NajiaLine[] = DEMO_HEX.yao.map((v, i) => ({
  pos: i + 1,
  yinYang: v ? 'yang' : 'yin',
  moving: DEMO_MOVING.includes(i + 1),
}));

const GanzhiSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="干支与纳甲" sub="地支轮 · 数据接口示意" />
    <CText cx={640} cy={118} size={21} family={FONT_KAI} color={INK_SOFT}>
      子在北、午在南；纳甲列只显示调用方提供的数据，不在组件内猜
    </CText>
    <DizhiWheel cx={300} cy={405} r={150} N={N} f0={22} active={['子','午']} showWuxing showDirection />
    <NajiaPanel x={555} y={215} w={620} rowH={43} gua={DEMO_HEX.upper} lines={NAJIA_DEMO_LINES} N={N} f0={22} />
    <CText cx={865} cy={644} size={19} family={FONT_KAI} color={CINNABAR}>
      纳甲 / 六亲 / 世应：待核数据不自动填造
    </CText>
  </AbsoluteFill>;
};

const YingqiSection: React.FC = () => {
  const N = useCurrentFrame() + 1;
  return <AbsoluteFill>
    <Header title="应期推演" sub="候选 → 筛选 → 待核" />
    <CText cx={640} cy={126} size={22} family={FONT_KAI} color={INK_SOFT}>
      先列候选，再逐层筛选；没有经过核验的历法算法，不直接报日期
    </CText>
    <YingqiTimeline x={120} y={300} w={1040} N={N} f0={22}
      points={[
        {label:'输入', kind:'起点', note:'已确认'},
        {label:'候选', kind:'范围', note:'待核'},
        {label:'初筛', kind:'规则', note:'待核'},
        {label:'复核', kind:'冲合', note:'待核'},
        {label:'结论', kind:'不代算', note:'待核'},
      ]} />
    <CText cx={640} cy={520} size={25} weight={700} family={FONT_KAI_BOLD} color={CINNABAR}>
      应期不是“闪出一个答案”
    </CText>
  </AbsoluteFill>;
};

const Closing: React.FC = () => (
  <AbsoluteFill>
    <CText cx={640} cy={310} size={42} weight={700} family={FONT_KAI_BOLD} color={INK}>盘面不是插图</CText>
    <CText cx={640} cy={370} size={28} family={FONT_KAI} color={INK_SOFT}>每一爻、每一步、每个数，都有出处，也能复算。</CText>
    <div style={{position:'absolute',left:554,top:414,width:172,height:2,background:CINNABAR}} />
    <CText cx={640} cy={454} size={22} family={FONT_KAI} color={INK_FAINT}>事实来自 chartdata.ts，独立校验由 chart_check.py 完成</CText>
  </AbsoluteFill>
);

export const ChartDemo: React.FC = () => (
  <AbsoluteFill style={{background:'#F6F0DF'}}>
    <Fonts />
    <PaperBg />
    <Sequence from={0} durationInFrames={360}><HexSection /></Sequence>
    <Sequence from={360} durationInFrames={150}><WuxingSection /></Sequence>
    <Sequence from={510} durationInFrames={150}><BaguaSection /></Sequence>
    <Sequence from={660} durationInFrames={150}><SplitSection /></Sequence>
    <Sequence from={810} durationInFrames={180}><ArithmeticSection /></Sequence>
    <Sequence from={990} durationInFrames={180}><GanzhiSection /></Sequence>
    <Sequence from={1170} durationInFrames={150}><YingqiSection /></Sequence>
    <Sequence from={1320} durationInFrames={90}><Closing /></Sequence>
  </AbsoluteFill>
);
