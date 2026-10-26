import test from 'node:test';
import assert from 'node:assert/strict';
import { sputnikObservation } from '../scripts/sputnik-observation.mjs';

const clickId = 'c00112233445566778899';
const input = () => ({
  dateFrom:'2026-10-26', dateTo:'2026-11-08', actionsThrough:'2026-11-08',
  ingestion:{status:'complete',from:'2026-10-26',through:'2026-11-08',completedAt:'2026-11-09T06:00:00Z',rowCount:1},
  sputnikHumanClicks:{status:'complete',filter:"ym:s:isRobot=='No'",dateFrom:'2026-10-26',dateTo:'2026-11-08',rows:[
    {click_id:clickId,partner:'sputnik8',cta_id:'bali_sputnik8_body_1',rollout_id:'sputnik_preferred_v1',event_time:'2026-10-26T12:00:00+03:00',event_count:1},
  ]},
  actions:[{action_id:'booking_1',partner:'sputnik8',state:'processing',commission_rub:100,
    sub_id:`tt2__bali_sputnik8_body_1__aa_v1__a__${clickId}`,date:'2026-10-27'}],
});

test('processing is a booking, never confirmed income', () => {
  const report=sputnikObservation(input());
  assert.equal(report.status,'observing');
  assert.equal(report.humanClicks,1);
  assert.equal(report.processingOrders,1);
  assert.equal(report.confirmedOrders,0);
  assert.equal(report.confirmedCommissionRub,0);
  assert.equal(report.bookingClickRate,1);
  assert.equal(report.confirmedClickRate,0);
  assert.equal(report.causalLift,null);
});

test('absent exports and incomplete receipts are unavailable, not zero conversion', () => {
  for(const data of [{}, {...input(),ingestion:{status:'partial'}}, {...input(),sputnikHumanClicks:undefined}]) {
    const report=sputnikObservation(data);
    assert.equal(report.status,'unavailable');
    assert.equal(report.bookingClickRate,null);
  }
});

test('only unambiguous Sputnik clicks from this rollout join to its actions', () => {
  for(const change of [{partner:'tripster'},{rollout_id:'old'},{event_count:2}]) {
    const data=input();Object.assign(data.sputnikHumanClicks.rows[0],change);
    const report=sputnikObservation(data);
    assert.equal(report.joinedOrders,0);
    assert.equal(report.unjoinedOrders,1);
  }
});

test('latest cancelled status replaces processing and confirmed order; no cancelled income', () => {
  const data=input();const action=data.actions[0];
  data.actions=[{...action,state:'paid',updated_at:'2026-11-01T12:00:00Z'},
    {...action,state:'cancelled',updated_at:'2026-11-02T12:00:00Z'}];
  data.ingestion.rowCount=2;
  const report=sputnikObservation(data);
  assert.equal(report.cancelledOrders,1);
  assert.equal(report.confirmedCommissionRub,0);
  assert.equal(report.bookingClickRate,0);
});

test('two confirmed orders after one click count as one converted click', () => {
  const data=input();data.actions=[{...data.actions[0],state:'paid'}, {...data.actions[0],action_id:'booking_2',state:'paid'}];data.ingestion.rowCount=2;
  const report=sputnikObservation(data);
  assert.equal(report.confirmedOrders,2);
  assert.equal(report.confirmedClickRate,1);
  assert.equal(report.confirmedCommissionRub,200);
});
