#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { joinRevenueRowsToClicks } from '../src/data/monetization.js';
import { TOUR_ROLLOUT_ID } from '../src/data/tour-rollout.js';

export const SPUTNIK_HUMAN_FILTER = "ym:s:isRobot=='No'";
const cancelled = new Set(['cancelled','canceled','rejected','reversed','declined']);
const confirmed = new Set(['approved','confirmed','paid']);
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value));

export function sputnikObservation(input) {
  const unavailable = reason => ({status:'unavailable',reason,rolloutId:TOUR_ROLLOUT_ID,
    bookingClickRate:null,confirmedClickRate:null,causalLift:null});
  const receipt=input?.ingestion;
  const cohort=input?.sputnikHumanClicks;
  if (!date(input?.dateFrom) || !date(input?.dateTo) || !date(input?.actionsThrough)
    || input.dateFrom>input.dateTo || input.dateTo>input.actionsThrough
    || receipt?.status!=='complete' || receipt.from!==input.dateFrom || receipt.through!==input.actionsThrough
    || !Number.isFinite(Date.parse(receipt.completedAt)) || !Array.isArray(input.actions) || receipt.rowCount!==input.actions.length)
    return unavailable('No complete action export for this observation window');
  if (cohort?.status!=='complete' || cohort.filter!==SPUTNIK_HUMAN_FILTER
    || cohort.dateFrom!==input.dateFrom || cohort.dateTo!==input.dateTo || !Array.isArray(cohort.rows))
    return unavailable('No complete robot-filtered Metrika click export');
  const clicks=cohort.rows.filter(row=>row.partner==='sputnik8' && row.rollout_id===TOUR_ROLLOUT_ID
    && /^c[a-f0-9]{20}$/.test(row.click_id || '') && /^[a-z0-9_]{5,64}$/.test(row.cta_id || '')
    && Number.isFinite(Date.parse(row.event_time))
    && row.event_time.slice(0,10)>=input.dateFrom && row.event_time.slice(0,10)<=input.dateTo);
  const byClick=new Map(clicks.map(row=>[row.click_id,row]));
  const actions=input.actions.filter(row=>row.partner==='sputnik8');
  const joined=joinRevenueRowsToClicks(actions,clicks);
  const rows=joined.rows.filter(row=>row.metrikaClick && row.ctaId===byClick.get(row.clickId)?.cta_id);
  const approved=rows.filter(row=>confirmed.has(row.status));
  const processing=rows.filter(row=>row.status==='processing');
  const converted=new Set([...approved,...processing].map(row=>row.clickId));
  const approvedClicks=new Set(approved.map(row=>row.clickId));
  const humanClicks=byClick.size;
  return {
    status:humanClicks?'observing':'no_clicks',rolloutId:TOUR_ROLLOUT_ID,
    generatedAt:receipt.completedAt,clickWindow:{from:input.dateFrom,through:input.dateTo},actionsThrough:input.actionsThrough,
    population:'Metrika outbound goals, robots excluded; all traffic sources, analytics consent required',
    humanClicks,joinedOrders:rows.length,unjoinedOrders:joined.rows.length-rows.length,
    processingOrders:processing.length,confirmedOrders:approved.length,
    cancelledOrders:rows.filter(row=>cancelled.has(row.status)).length,
    unknownStatusOrders:rows.filter(row=>!confirmed.has(row.status)&&!cancelled.has(row.status)&&row.status!=='processing').length,
    confirmedCommissionRub:approved.every(row=>row.monetaryValueKnown)?approved.reduce((sum,row)=>sum+row.approvedRevenue,0):null,
    bookingClickRate:humanClicks?converted.size/humanClicks:null,
    confirmedClickRate:humanClicks?approvedClicks.size/humanClicks:null,
    firstObservedClick:clicks.map(row=>row.event_time).sort()[0] || null,
    causalLift:null,
    interpretation:'Observational rollout. Processing is potential, cancellations excluded. Confirmed commission may still change; no mature revenue or causal winner claim. Unjoined orders are not attributed to this rollout.',
  };
}

if(process.argv[1] && resolve(process.argv[1])===new URL(import.meta.url).pathname){
  const [inputFile,outputFile]=process.argv.slice(2);
  if(!inputFile || !outputFile)throw new Error('Usage: sputnik-observation.mjs private-export.json private-report.json');
  const report=sputnikObservation(JSON.parse(readFileSync(inputFile,'utf8')));
  writeFileSync(outputFile,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log(`Sputnik observation: ${report.status}; report saved privately`);
  if(report.status==='unavailable')process.exitCode=1;
}
