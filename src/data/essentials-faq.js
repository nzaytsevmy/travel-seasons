// Хелпер: собрать FAQ-вопросы из ESSENTIALS/CUSTOMS/HOLIDAYS для добавления
// в существующую FAQPage schema родительской страницы (без дублей @id).
//
// AEO: каждый блок-факт = Q&A. Яндекс.Нейро / Google AI Overviews забирают
// именно структурированные Q&A, не абзацы.

import { PLUG_TYPES } from './country-plug-types.js';
import { getEssentials } from './country-essentials.js';
import { getCustoms } from './country-customs.js';

export function buildEssentialsFaq(slug, countryNameVp) {
  // countryNameVp = «в Японии», «на Бали» (предложный падеж)
  const out = [];
  const plug = PLUG_TYPES[slug];
  const ess = getEssentials(slug);
  const cust = getCustoms(slug);

  if (plug) {
    out.push({
      q: `Какие розетки ${countryNameVp}?`,
      a: `${countryNameVp.charAt(0).toUpperCase() + countryNameVp.slice(1)} используется тип ${plug.types}, напряжение ${plug.voltage}, частота ${plug.hz}. Переходник нужен, если ваша техника не USB-зарядка.`
    });
  }
  if (ess?.tipping) {
    out.push({
      q: `Принято ли давать чаевые ${countryNameVp}?`,
      a: `Рестораны: ${ess.tipping.restaurants}. Такси: ${ess.tipping.taxi}. Отели: ${ess.tipping.hotel}.${ess.tipping.note ? ' ' + ess.tipping.note + '.' : ''}`
    });
  }
  if (ess?.emergency) {
    const parts = [];
    if (ess.emergency.police) parts.push(`полиция ${ess.emergency.police}`);
    if (ess.emergency.ambulance_fire) parts.push(`скорая и пожарные ${ess.emergency.ambulance_fire}`);
    if (ess.emergency.ambulance) parts.push(`скорая ${ess.emergency.ambulance}`);
    if (ess.emergency.fire) parts.push(`пожарные ${ess.emergency.fire}`);
    if (ess.emergency.embassy_ru_phone) parts.push(`посольство РФ ${ess.emergency.embassy_ru_phone}`);
    out.push({
      q: `Какие экстренные номера ${countryNameVp}?`,
      a: parts.join('; ') + '.'
    });
  }
  if (ess?.water) {
    out.push({
      q: `Можно ли пить воду из-под крана ${countryNameVp}?`,
      a: `${ess.water.tap_drinkable ? 'Да, можно' : 'Нет, только бутилированная'}.${ess.water.note ? ' ' + ess.water.note + '.' : ''}`
    });
  }
  if (ess?.taxi_apps?.length) {
    out.push({
      q: `Какие такси-приложения работают ${countryNameVp}?`,
      a: ess.taxi_apps.map(t => `${t.name}${t.note ? ` (${t.note})` : ''}`).join('; ') + '.'
    });
  }
  if (cust?.forbidden?.length) {
    out.push({
      q: `Что нельзя ввозить ${countryNameVp}?`,
      a: cust.forbidden.join('; ') + '.'
    });
  }
  return out;
}
