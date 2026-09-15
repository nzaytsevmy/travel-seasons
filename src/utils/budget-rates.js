import fallback from '../data/budget-rates.json' with { type: 'json' };

export function parseBudgetRates(xml, asOf) {
  const dateMatch = xml.match(/<ValCurs\b[^>]*\bDate="(\d{2})\.(\d{2})\.(\d{4})"/);
  if (!dateMatch) throw new Error('Нет даты курса ЦБ');
  const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date || date > asOf) throw new Error('Неверная дата курса ЦБ');
  const rates = { date, RUB: 1 };
  for (const match of xml.matchAll(/<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g)) {
    const code = match[1].match(/<CharCode>([A-Z]{3})<\/CharCode>/)?.[1];
    if (!['USD', 'EUR'].includes(code)) continue;
    const nominal = Number(match[1].match(/<Nominal>(\d+)<\/Nominal>/)?.[1]);
    const value = Number(match[1].match(/<Value>([\d,]+)<\/Value>/)?.[1].replace(',', '.'));
    if (!(Number.isFinite(value) && value > 0 && Number.isFinite(nominal) && nominal > 0)) throw new Error('Неверное значение курса ЦБ');
    rates[code] = value / nominal;
  }
  if (!rates.USD || !rates.EUR) throw new Error('Неполный ответ ЦБ');
  return rates;
}

export async function loadBudgetRates({ now = new Date(), fetchImpl = fetch, backup = fallback } = {}) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [year, month, day] = date.split('-');
  const source = `https://www.cbr.ru/scripts/XML_daily.asp?date_req=${day}/${month}/${year}`;
  try {
    const response = await fetchImpl(source, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('ЦБ недоступен');
    return { ...parseBudgetRates(await response.text(), date), source };
  } catch {
    // Сборка остаётся возможной офлайн. Все три страницы используют ОДИН
    // подтверждённый запасной курс; браузер не заменяет его после перехода.
    console.warn(`[trip-budget] ЦБ недоступен; используется курс за ${backup.date}`);
    return { ...backup };
  }
}

let ratesPromise;
export function getBudgetRates() {
  // Один снимок на всю сборку, включая данные клиентского калькулятора.
  return ratesPromise ??= loadBudgetRates();
}
