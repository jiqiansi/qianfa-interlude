import React from 'react';
import {DIZHI,DIZHI_ANGLE,DIZHI_WUXING,GUA,JIAZI,type WuXing,type GuaName,type YaoKind,YAO_POS} from './chartdata';
import {CText} from '../ui';
import {YaoLine,EdgeTab} from './prims';
import {PAPER,INK,INK_MID,INK_SOFT,INK_FAINT,RULE,CINNABAR,PAPER_WUXING,FONT_KAI,FONT_KAI_BOLD,FONT_NUM,STROKE,alpha} from './paper';
import {clamp01} from '../common';

/** 十二地支轮：子在正上（北），顺时针排布；方位语义与 chartdata.DIZHI_ANGLE 一致。 */
export const DizhiWheel:React.FC<{
  cx:number;cy:number;r?:number;N:number;f0:number;
  active?:string[]; highlightWuxing?:WuXing; showWuxing?:boolean; showDirection?:boolean; opacity?:number;
}>=({cx,cy,r=190,N,f0,active=[],highlightWuxing,showWuxing=true,showDirection=true,opacity=1})=>{
  const pts=DIZHI.map((z,i)=>{
    const deg=DIZHI_ANGLE[z], rad=(deg-90)*Math.PI/180;
    return {z,i,x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad),wx:DIZHI_WUXING[z]};
  });
  return <div style={{opacity}}>
    <svg width={1280} height={720} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={RULE} strokeWidth={STROKE.thin}/>
      <circle cx={cx} cy={cy} r={r-26} fill="none" stroke={RULE} strokeWidth={STROKE.hair} strokeDasharray="2 5"/>
      {pts.map(p=>{const k=clamp01((N-(f0+4*p.i))/12);return k>0?<line key={p.z} x1={cx+(r-26)*Math.cos((DIZHI_ANGLE[p.z]-90)*Math.PI/180)} y1={cy+(r-26)*Math.sin((DIZHI_ANGLE[p.z]-90)*Math.PI/180)} x2={cx+r*Math.cos((DIZHI_ANGLE[p.z]-90)*Math.PI/180)} y2={cy+r*Math.sin((DIZHI_ANGLE[p.z]-90)*Math.PI/180)} stroke={RULE} strokeWidth={STROKE.hair} opacity={k}/>:null;})}
    </svg>
    {pts.map(p=>{
      const k=clamp01((N-(f0+4*p.i))/12); if(k<=0)return null;
      const is=active.includes(p.z)||(highlightWuxing===p.wx);
      const col=is?CINNABAR:PAPER_WUXING[p.wx];
      const lx=p.x+(p.x<cx?-25:p.x>cx?25:0), ly=p.y+(p.y<cy?-20:p.y>cy?20:0);
      return <div key={p.z} style={{opacity:k}}>
        <div style={{position:'absolute',left:p.x-5,top:p.y-5,width:10,height:10,borderRadius:5,background:is?CINNABAR:alpha(PAPER_WUXING[p.wx],.34),border:`1.5px solid ${col}`}}/>
        <CText cx={lx} cy={ly} size={24} weight={is?700:500} family={is?FONT_KAI_BOLD:FONT_KAI} color={col}>{p.z}</CText>
        {showWuxing?<CText cx={lx} cy={ly+20} size={17} family={FONT_KAI} color={INK_FAINT}>{p.wx}</CText>:null}
      </div>;
    })}
    <CText cx={cx} cy={cy} size={25} weight={600} family={FONT_KAI} color={INK_SOFT}>地支</CText>
    {showDirection?<>
      <CText cx={cx} cy={cy-r-28} size={19} family={FONT_KAI} color={INK_FAINT}>北</CText>
      <CText cx={cx+r+28} cy={cy} size={19} family={FONT_KAI} color={INK_FAINT}>东</CText>
      <CText cx={cx} cy={cy+r+28} size={19} family={FONT_KAI} color={INK_FAINT}>南</CText>
      <CText cx={cx-r-28} cy={cy} size={19} family={FONT_KAI} color={INK_FAINT}>西</CText>
    </>:null}
  </div>;
};

/** 纳甲六爻表。只负责显示调用方提供且已核实的数据；不在组件内猜纳甲映射。 */
export interface NajiaLine {pos:number;yinYang:YaoKind;gan?:string;zhi?:string;wuxing?:WuXing;liuqin?:string;moving?:boolean;shiYing?:'世'|'应';}
export const NajiaPanel:React.FC<{
  x:number;y:number;w?:number;rowH?:number;gua:GuaName;lines:NajiaLine[];N:number;f0:number;opacity?:number;
}> = ({x,y,w=570,rowH=48,gua,lines,N,f0,opacity=1})=>{
  const title=GUA[gua];
  const cols=[{t:'爻位',w:.15},{t:'六亲',w:.18},{t:'纳甲',w:.25},{t:'五行',w:.18},{t:'世应',w:.16}];
  const xx=[x]; cols.forEach((c,i)=>{if(i<cols.length-1)xx.push(xx[i]+w*c.w);});
  return <div style={{opacity}}>
    <CText cx={x+w/2} cy={y-27} size={26} weight={700} family={FONT_KAI_BOLD} color={INK}>{gua} · {title.wuxing}卦</CText>
    {cols.map((c,i)=><CText key={c.t} cx={xx[i]+w*c.w/2} cy={y+12} size={19} family={FONT_KAI} color={INK_FAINT}>{c.t}</CText>)}
    {lines.slice().sort((a,b)=>b.pos-a.pos).map((l,i)=>{
      const yy=y+38+i*rowH; const k=clamp01((N-(f0+i*4))/10); if(k<=0)return null;
      const col=l.moving?CINNABAR:(l.wuxing?PAPER_WUXING[l.wuxing]:INK);
      return <div key={l.pos} style={{opacity:k}}>
        <div style={{position:'absolute',left:x,top:yy+rowH-3,width:w,height:1,background:RULE}}/>
        <CText cx={xx[0]+w*cols[0].w/2} cy={yy+rowH/2} size={21} family={FONT_KAI} color={l.moving?CINNABAR:INK_SOFT}>{YAO_POS[l.pos-1]}爻</CText>
        <CText cx={xx[1]+w*cols[1].w/2} cy={yy+rowH/2} size={21} family={FONT_KAI} color={INK_MID}>{l.liuqin||'—'}</CText>
        <CText cx={xx[2]+w*cols[2].w/2} cy={yy+rowH/2} size={22} family={FONT_KAI_BOLD} color={col}>{`${l.gan||''}${l.zhi||''}`||'—'}</CText>
        <CText cx={xx[3]+w*cols[3].w/2} cy={yy+rowH/2} size={21} family={FONT_KAI} color={l.wuxing?PAPER_WUXING[l.wuxing]:INK_FAINT}>{l.wuxing||'—'}</CText>
        {l.shiYing?<EdgeTab x={xx[4]+w*cols[4].w/2-18} y={yy+rowH/2-13} w={36} h={26} text={l.shiYing} color={l.shiYing==='世'?CINNABAR:INK_FAINT} fill={l.shiYing==='世'?'wash':'none'} fontSize={18}/>:null}
        {l.moving?<YaoLine cx={x+w-12} cy={yy+rowH/2} w={16} h={3} kind={l.yinYang} color={CINNABAR}/>:null}
      </div>;
    })}
  </div>;
};

/** 六十甲子顺序表由 chartdata.ts 单一事实层提供。 */
export {JIAZI};
/** 返回甲子序号（0-based）；奇偶阴阳不配者返回 -1。 */
export const jiaziIndex=(gan:string,zhi:string):number=>JIAZI.indexOf(gan+zhi);
