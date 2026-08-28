import { readFileSync, writeFileSync } from 'node:fs';
const Д = '/private/tmp/claude-501/-Users-nikitazaytsev/38e2070a-66b9-42d0-b34d-dfecf3865931/scratchpad';
const данные = JSON.parse(readFileSync(`${Д}/visa-data.json`, 'utf8'));
const ф = (n) => n.toLocaleString('ru-RU');
const по = (t) => данные.filter((d) => d.visa === t);
const св = по('free'), эв = по('evisa'), кс = по('required');
const дешевле = (сп) => [...сп].filter((d) => d.trip).sort((a, b) => a.trip - b.trip);
const свНеРФ = дешевле(св.filter((d) => !d.domestic));

const ШРИФТЫ = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Golos+Text:wght@400;500;600;700&family=PT+Mono&family=Neucha&display=swap" rel="stylesheet">`;

const ОБЩЕЕ = `
:root{--paper:#fbfbfa;--ink:#15171a;--dim:#5c626b;--gold:#1d40ae;--hair:#d9dbde;--sand:#efece4;
--ff:'Golos Text',system-ui,sans-serif;--ff-head:'Old Standard TT',Georgia,serif;--ff-mono:'PT Mono',monospace;--ff-hand:'Neucha',cursive}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--ff);line-height:1.5;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--ff-head);margin:0;line-height:1.08;font-weight:700}
a{color:inherit}
.wrap{max-width:1240px;margin:0 auto;padding:0 clamp(1rem,4vw,3rem)}
.mono{font-family:var(--ff-mono)}
/* ⛔ Ссылка «к содержимому» видна только под фокусом с клавиатуры. WebAIM:
   без неё человек на клавиатуре каждый раз проходит всю шапку заново. */
.skip{position:absolute;left:-9999px;top:0;background:var(--ink);color:#fff;
padding:.7rem 1rem;z-index:99;min-height:44px;display:inline-flex;align-items:center}
.skip:focus{left:0}
.top{border-bottom:1px solid var(--hair);padding:.9rem 0;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--dim)}
.top b{font-family:var(--ff-head);font-size:1.05rem;letter-spacing:0;text-transform:none;color:var(--ink)}
.chip{display:inline-flex;align-items:center;min-height:32px;padding:.35rem .8rem;border:1px solid var(--hair);
background:#fff;font:inherit;font-size:.82rem;cursor:pointer;border-radius:2px;color:var(--ink)}
.chip[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}
.chip .n{font-family:var(--ff-mono);font-weight:400;font-size:.78em;color:var(--dim);padding-left:.35rem}
.chip[aria-pressed=true] .n{color:#fff;opacity:.7}
.chip:disabled{opacity:.4;cursor:not-allowed}
.chips{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
/* ⛔ Поиск — первым, не в конце. NN/g: больше половины людей на сайте
   «поисковые» и идут прямо в строку. Baymard по 15 тревел-сайтам: поиск
   должен быть главным содержимым, у 25% сайтов это не так. */
.find{display:flex;align-items:center;gap:.6rem;border:2px solid var(--ink);background:#fff;
padding:.15rem .15rem .15rem .8rem;margin-bottom:.8rem;max-width:34rem}
.find label{font-family:var(--ff-mono);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);white-space:nowrap}
.find input{flex:1;min-width:0;border:0;background:transparent;font:inherit;font-size:1rem;
padding:.6rem .2rem;min-height:44px;color:var(--ink)}
.find input::placeholder{color:var(--dim)}
.find button{border:0;background:transparent;font:inherit;cursor:pointer;color:var(--dim);
min-width:44px;min-height:44px;font-size:1.1rem}
.sum{font-size:.82rem;color:var(--dim);margin-top:.7rem}
.sum b{color:var(--ink)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:1px;background:var(--hair);border:1px solid var(--hair)}
.card{background:var(--paper);padding:.9rem;display:flex;flex-direction:column;gap:.35rem;text-decoration:none;min-height:44px}
.card:hover{background:#fff}
.card h3{font-size:1.12rem}
.card .iso{font-family:var(--ff-mono);font-size:.68rem;letter-spacing:.1em;color:var(--dim)}
.f{display:flex;justify-content:space-between;gap:.5rem;font-size:.8rem;border-top:1px dotted var(--hair);padding-top:.3rem}
.f dt{color:var(--dim)}
.f dd{margin:0;text-align:right}
.price{display:flex;align-items:baseline;gap:.45rem;flex-wrap:wrap;margin:.15rem 0 .1rem}
.price .mono{font-size:1.02rem;font-weight:600}
.price .per{font-size:.72rem;color:var(--dim)}
.seen{color:var(--gold);font-size:.82em;padding-left:.3rem}
/* ⛔ Видимый фокус с клавиатуры. Первый заход снял его через outline:0 — человек,
   идущий табуляцией, переставал понимать, где он. WCAG 2.4.7. */
a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.f--money .per{font-size:.82em;color:var(--dim)}
.more{display:inline-block;margin-top:.9rem;padding:.4rem 0;min-height:24px;font-size:.95rem;
text-decoration:underline;text-underline-offset:.22em}
.next{border-top:1px solid var(--hair);margin-top:2rem;padding-top:.9rem;font-size:.82rem;color:var(--dim)}
@media(max-width:640px){.grid{grid-template-columns:1fr 1fr}}
`;

// ⛔ Порядок фактов задан айтрекингом, а не вкусом. Обзор по 70 работам в
// туризме и замеры зон интереса: дольше и чаще всего смотрят на снимок, имя и
// ЦЕНУ — значит цена стоит сразу под именем, а не в конце карточки. Отметка
// «был лично» — рядом с ценой: в работе по 171 пользователю внимание идёт к
// цене вместе с сигналом доверия (оценки, отзывы).
const карточка = (d) => `<a class="card" href="/visa/${d.slug}/">
<h3>${d.nom}${d.был ? '<span class="seen" title="Никита был лично" aria-label="автор был лично">✓</span>' : ''}</h3>
<div class="price"><span class="mono">≈ ${ф(d.trip)} ₽</span><span class="per">неделя с перелётом</span></div>
<span class="iso">${d.visa === 'free' ? 'БЕЗ ВИЗЫ' : d.visa === 'evisa' ? 'ВИЗА ОНЛАЙН' : 'КОНСУЛЬСТВО'}</span>
<dl style="margin:.35rem 0 0"><div class="f"><dt>Срок</dt><dd>${d.dur || '—'}</dd></div>
<div class="f"><dt>Виза</dt><dd>${d.cost || '—'}</dd></div></dl></a>`;

// ⛔ Поиск вынесен отдельно: в каждом макете он ставится ТУДА, где попадает в
// первый экран. NN/g: больше половины людей на сайте «поисковые» и идут прямо
// в строку; если она под сгибом, они её не находят.
const ПОИСК = `<div class="find">
<label for="q">Страна</label>
<input type="search" id="q" placeholder="Япония, Турция, Грузия…" autocomplete="off">
<button type="button" id="qx" aria-label="Очистить поиск" hidden>×</button>
</div>`;
const ФИЛЬТРЫ = `<nav class="chips" aria-label="Отбор направлений">
<button class="chip" aria-pressed="true" data-v="all">Все <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-v="free">Без визы <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-v="evisa">Виза онлайн <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-v="required">Консульство <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-t="low">Поездка до 100 тыс. <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-t="mid">100–200 тыс. <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-c="free">Виза бесплатна <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-c="cheap">Виза до $50 <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-d="long">Пускают на 60+ дней <b class="n"></b></button>
<button class="chip" aria-pressed="false" data-s="trip">Сначала дешёвая поездка</button>
<button class="chip" id="reset" type="button">Сбросить</button>
</nav>
<p class="sum" id="sum">Показано <b>74</b> из 74 · отбор не задан</p>`;

const СКРИПТ = `<script>
(function(){var st={v:'all',t:null,s:false,q:'',c:null,d:false};
var cards=[].slice.call(document.querySelectorAll('.card'));
var q=document.getElementById('q'),qx=document.getElementById('qx');
var sum=document.getElementById('sum');
function apply(){var n=0;
 cards.forEach(function(c){var v=c.dataset.v,tr=+c.dataset.trip||0;
  var name=(c.dataset.name||''),cb=c.dataset.c||'',lg=c.dataset.d==='1';
  var ok=(!st.q||name.indexOf(st.q)>=0)&&(st.v==='all'||v===st.v)
   &&(!st.t||(tr&&(st.t==='low'?tr<100000:tr<=200000)))
   &&(!st.c||cb===st.c)&&(!st.d||lg);
  c.hidden=!ok; if(ok)n++;});
 document.querySelectorAll('[data-group]').forEach(function(g){
  g.hidden=!g.querySelector('.card:not([hidden])');});
 // Счётчик на каждом чипе: сколько останется, если нажать именно его, при
 // нынешнем остальном отборе. Пустой отбор гасит кнопку — человек не тычет
 // в заведомое «ничего не найдено».
 counts();
 var ч=[]; if(st.q)ч.push('поиск «'+st.q+'»');
 // в подписи чипа теперь есть счётчик — вырезаем его, иначе сводка читается
 // как «отбор: Консульство 17»
 if(st.v!=='all'){var e0=document.querySelector('[data-v="'+st.v+'"]').cloneNode(true);
  var n0=e0.querySelector('.n'); if(n0)n0.remove(); ч.push(e0.textContent.trim());}
 if(st.t)ч.push(st.t==='low'?'до 100 тыс.':'100–200 тыс.');
 if(st.c)ч.push(st.c==='free'?'виза бесплатна':'виза до $50');
 if(st.d)ч.push('60+ дней');
 if(st.s)ч.push('сначала дешёвая поездка');
 sum.innerHTML='Показано <b>'+n+'</b> из 74 · '+(ч.length?'отбор: '+ч.join(' · '):'отбор не задан');}
function подходит(c,o){var v=c.dataset.v,tr=+c.dataset.trip||0,cb=c.dataset.c||'',lg=c.dataset.d==='1',nm=c.dataset.name||'';
 var q2=('q' in o)?o.q:st.q, v2=('v' in o)?o.v:st.v, t2=('t' in o)?o.t:st.t, c2=('c' in o)?o.c:st.c, d2=('d' in o)?o.d:st.d;
 return (!q2||nm.indexOf(q2)>=0)&&(v2==='all'||v===v2)&&(!t2||(tr&&(t2==='low'?tr<100000:tr<=200000)))
  &&(!c2||cb===c2)&&(!d2||lg);}
function counts(){
 document.querySelectorAll('.chip').forEach(function(ch){
  var el=ch.querySelector('.n'); if(!el)return;
  var o={};
  if(ch.dataset.v)o.v=ch.dataset.v;
  else if(ch.dataset.t)o.t=(st.t===ch.dataset.t?null:ch.dataset.t);
  else if(ch.dataset.c)o.c=(st.c===ch.dataset.c?null:ch.dataset.c);
  else if(ch.dataset.d)o.d=!st.d; else return;
  var n=cards.filter(function(c){return подходит(c,o);}).length;
  el.textContent=n; ch.disabled=(n===0&&ch.getAttribute('aria-pressed')!=='true');});}
function sort(){document.querySelectorAll('[data-group] .grid').forEach(function(g){
 var cs=[].slice.call(g.children);
 cs.sort(function(a,b){return st.s?((+a.dataset.trip||1e9)-(+b.dataset.trip||1e9)):((+a.dataset.ord)-(+b.dataset.ord));});
 cs.forEach(function(c){g.appendChild(c);});});}
document.addEventListener('click',function(e){var c=e.target.closest('.chip'); if(!c)return;
 if(c.dataset.v){st.v=c.dataset.v;document.querySelectorAll('[data-v]').forEach(function(x){x.setAttribute('aria-pressed',String(x===c));});}
 if(c.dataset.t){var on=c.getAttribute('aria-pressed')==='true';st.t=on?null:c.dataset.t;
  document.querySelectorAll('[data-t]').forEach(function(x){x.setAttribute('aria-pressed',String(!on&&x===c));});}
 if(c.dataset.c){var on2=c.getAttribute('aria-pressed')==='true';st.c=on2?null:c.dataset.c;
  document.querySelectorAll('[data-c]').forEach(function(x){x.setAttribute('aria-pressed',String(!on2&&x===c));});}
 if(c.dataset.d){st.d=c.getAttribute('aria-pressed')!=='true';c.setAttribute('aria-pressed',String(st.d));}
 if(c.dataset.s){st.s=c.getAttribute('aria-pressed')!=='true';c.setAttribute('aria-pressed',String(st.s));sort();}
 if(c.id==='reset'){st={v:'all',t:null,s:false,q:'',c:null,d:false};
  document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.v==='all'));});
  if(q){q.value='';} if(qx)qx.hidden=true; sort();}
 apply();});
if(q){q.addEventListener('input',function(){st.q=q.value.trim().toLowerCase();
 if(qx)qx.hidden=!st.q; apply();});}
if(qx){qx.addEventListener('click',function(){q.value='';st.q='';qx.hidden=true;apply();q.focus();});}
apply();})();
</script>`;

const секция = (имя, список, подпись) => `<section data-group style="margin-top:2.4rem">
<h2 style="font-size:1.5rem">${имя}</h2><p style="color:var(--dim);font-size:.9rem;margin:.4rem 0 1rem;max-width:60ch">${подпись}</p>
<div class="grid">${список.map((d, i) => карточка(d).replace('<a class="card"', `<a class="card" data-v="${d.visa}" data-trip="${d.trip}" data-ord="${i}" data-name="${d.nom.toLowerCase()}" data-c="${/бесплат/i.test(d.cost) ? 'free' : (Number((d.cost.match(/\d+/)||[999])[0]) <= 50 ? 'cheap' : '')}" data-d="${/(6[0-9]|[7-9][0-9]|[1-9]\d{2,})\s*(дн|дней|day)/i.test(d.dur) || /год|мес/i.test(d.dur) ? '1' : '0'}"`)).join('')}</div></section>`;

const низ = (шапка, тело) => `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${шапка}</title>${ШРИФТЫ}<style>${ОБЩЕЕ}</style></head>
<body>${тело}${СКРИПТ}</body></html>`;

// ─────────────────────── А. РЕЕСТР ───────────────────────
const А = низ('Макет А — Реестр', `
<a class="skip" href="#main">Перейти к содержимому</a>
<header class="top"><div class="wrap"><b>TravelTribe</b> · Визы</div></header>
<main class="wrap" id="main">
<style>
.a-head{border-top:2px solid var(--ink);padding-top:1rem;margin-top:1.4rem}
.a-meta{font-family:var(--ff-mono);font-size:.72rem;letter-spacing:.08em;color:var(--dim)}
.a-h1{font-size:clamp(2.2rem,5.4vw,3.8rem);margin:.5rem 0 .2rem}
.a-h1 em{font-style:italic;color:var(--gold)}
.a-q{font-size:clamp(1.5rem,3vw,2.2rem);margin-top:1.4rem}
.a-lead{margin:.7rem 0 1rem;max-width:52ch}
.a-lead b{font-weight:600}
.stamps{display:flex;flex-wrap:wrap;gap:1rem}
.stamp{display:block;border:2px solid var(--gold);color:var(--gold);padding:.7rem 1rem;border-radius:3px;
transform:rotate(-1.4deg);text-decoration:none;min-height:44px}
.stamp:nth-child(2){transform:rotate(1.1deg)}.stamp:nth-child(3){transform:rotate(-.5deg)}
.stamp b{display:block;font-size:.9rem;text-transform:uppercase;letter-spacing:.08em}
.stamp span{display:block;font-size:.76rem}
.stamp .mono{padding-top:.1rem}
.a-filters{margin-top:2rem;padding:1rem;background:var(--sand)}
</style>
<div class="a-head">
<div class="a-meta">РЕГ. № 070—2026 · TT-VISA-RU · СВЕРЕНО 14.05.2026</div>
<h1 class="a-h1">Визовый <em>реестр</em></h1>
${ПОИСК}
<h2 class="a-q">Куда пускают без визы?</h2>
<p class="a-lead"><b>${св.length} направления из 74</b> — только загранпаспорт. Ещё ${эв.length} открываются визой онлайн, ${кс.length} требуют консульства.</p>
<div class="stamps">
<a class="stamp" href="/${свНеРФ[0].slug}/"><b>без визы</b><span>${свНеРФ[0].nom} — дешевле всех</span><span class="mono">≈ ${ф(свНеРФ[0].trip)} ₽ / НЕДЕЛЯ</span></a>
<a class="stamp" href="/${дешевле(эв)[0].slug}/"><b>виза онлайн</b><span>${дешевле(эв)[0].nom} — дешевле всех</span><span class="mono">≈ ${ф(дешевле(эв)[0].trip)} ₽ / НЕДЕЛЯ</span></a>
<a class="stamp" href="/${дешевле(кс)[0].slug}/"><b>консульство</b><span>${дешевле(кс)[0].nom} — дешевле всех</span><span class="mono">≈ ${ф(дешевле(кс)[0].trip)} ₽ / НЕДЕЛЯ</span></a>
</div>
<a class="more" href="/bezviz/">Полный список безвизовых с условиями</a>
<p class="next">Ниже — реестр всех 74 направлений с отбором по режиму и цене поездки.</p>
</div>
<div class="a-filters">${ФИЛЬТРЫ}</div>
${секция('Без визы', св, 'Загранпаспорт от 6 месяцев. Штамп на границе, никаких документов заранее.')}
${секция('Виза онлайн', эв, 'Оформляется до вылета через сайт миграционной службы. $20–80, один-три дня.')}
${секция('Консульство', кс, 'Через визовый центр: биометрия, документы, $35–200 и до 30 дней ожидания.')}
</main>`);

// ────────────────── Б. ИНСТРУМЕНТ СВЕРХУ ──────────────────
const Б = низ('Вариант Б — инструмент сверху', `
<a class="skip" href="#main">Перейти к содержимому</a>
<header class="top"><div class="wrap"><b>TravelTribe</b> · Визы</div></header>
<main class="wrap" id="main">
<style>
.b-h1{font-size:clamp(1.9rem,4vw,2.9rem);margin:1.6rem 0 .4rem}
.b-lead{color:var(--dim);max-width:56ch;margin:0 0 1.2rem}
.b-tool{border:2px solid var(--ink);padding:1.1rem;background:#fff}
.b-tool-t{font-family:var(--ff-mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-bottom:.7rem}
.b-answer{display:flex;gap:2rem;flex-wrap:wrap;margin-top:1.1rem;padding-top:1rem;border-top:1px dotted var(--hair)}
.b-n{font-family:var(--ff-mono);font-size:2rem;font-weight:700;line-height:1}
.b-n span{display:block;font-family:var(--ff);font-size:.78rem;font-weight:400;color:var(--dim);letter-spacing:.04em;text-transform:uppercase;padding-top:.25rem}
</style>
<h1 class="b-h1">Нужна ли виза и сколько стоит поездка?</h1>
<p class="b-lead">Отберите режим и бюджет — список ниже перестроится. Цена недели считается с перелётом из Москвы, жильём, едой и транспортом.</p>
<div class="b-tool"><div class="b-tool-t">Подбор по 74 направлениям</div>${ПОИСК}${ФИЛЬТРЫ}
<div class="b-answer">
<div class="b-n">${св.length}<span>без визы</span></div>
<div class="b-n">${эв.length}<span>виза онлайн</span></div>
<div class="b-n">${кс.length}<span>консульство</span></div>
<div class="b-n">${ф(свНеРФ[0].trip)} ₽<span>дешевле всех — ${свНеРФ[0].nom}</span></div>
</div></div>
<p class="next">Ниже — сам реестр. Он перестраивается отбором выше.</p>
${секция('Без визы', св, 'Загранпаспорт от 6 месяцев. Штамп на границе.')}
${секция('Виза онлайн', эв, 'Оформляется до вылета онлайн. $20–80, один-три дня.')}
${секция('Консульство', кс, 'Визовый центр: биометрия, документы, $35–200.')}
</main>`);

// ─────────────────────── В. ДНЕВНИК ───────────────────────
const В = низ('Макет В — Дневник', `
<a class="skip" href="#main">Перейти к содержимому</a>
<header class="top"><div class="wrap"><b>TravelTribe</b> · Визы</div></header>
<main id="main">
<style>
.v-hero{background:var(--sand);padding:clamp(2rem,5vw,3.4rem) 0;border-bottom:1px solid var(--hair)}
.v-h1{font-size:clamp(2.2rem,6vw,4.4rem);max-width:16ch}
.v-h1 em{font-style:italic;color:var(--gold)}
.v-tape{font-family:var(--ff-mono);font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin:.9rem 0 0}
.v-shelf{display:grid;grid-template-columns:4fr 8fr;gap:2.4rem;padding:2.2rem 0;border-bottom:1px solid var(--hair)}
.v-q{font-size:clamp(1.5rem,3vw,2.2rem)}
.v-q em{font-style:italic}
.v-lead{margin-top:.7rem;max-width:28ch}
.v-lead b{font-weight:600}
.polas{display:flex;gap:1.5rem;flex-wrap:wrap}
.pola{background:#fff;border:1px solid var(--hair);padding:.6rem .6rem 0;text-decoration:none;min-height:44px}
.pola:nth-child(1){transform:rotate(-1.2deg)}.pola:nth-child(2){transform:rotate(.9deg);margin-top:1.1rem}
.pola:nth-child(3){transform:rotate(-.5deg);margin-top:.3rem}
.pcap{display:block;font-family:var(--ff-hand);font-size:1.2rem;padding:.45rem .1rem .5rem;max-width:16ch}
.pdat{display:block;font-family:var(--ff-mono);font-size:.72rem;color:var(--dim);padding-top:.1rem}
.pbox{display:block;width:190px;height:120px;background:linear-gradient(160deg,#cfd6e6,#e8e3d6)}
/* Планшет 768: две колонки съедали высоту, ответ уходил за сгиб (замер 28.08).
   Полка складывается в одну колонку раньше — с 900, а не с 760. */
@media(max-width:900px){.v-shelf{grid-template-columns:1fr;gap:1rem;padding:1.4rem 0}
.v-hero{padding:1.4rem 0}
.v-h1{font-size:clamp(1.9rem,8vw,2.6rem)}
/* Снимки в один ряд с прокруткой: столбиком они уводили ответ за первый экран
   (замер 28.08.2026: низ ответа 1128 при экране 844). */
.polas{flex-wrap:nowrap;overflow-x:auto;gap:.9rem;padding-bottom:.4rem;-webkit-overflow-scrolling:touch}
.pola,.pola:nth-child(1),.pola:nth-child(2),.pola:nth-child(3){transform:none;margin-top:0;flex:0 0 auto}
.pbox{width:150px;height:96px}}
</style>
<div class="v-hero"><div class="wrap">
<h1 class="v-h1">Куда пускают <em>без визы</em></h1>
<p class="v-tape">${св.length} БЕЗ ВИЗЫ · ${эв.length} ВИЗА ОНЛАЙН · ${кс.length} КОНСУЛЬСТВО · ЦЕНА НЕДЕЛИ У КАЖДОГО</p>
<div style="margin-top:1.1rem">${ПОИСК}</div>
</div></div>
<div class="wrap">
<section class="v-shelf">
<div><h2 class="v-q">Куда пускают <em>без визы?</em></h2>
<p class="v-lead"><b>${св.length} направления из 74</b> — только загранпаспорт. Три самых дешёвых.</p>
<a class="more" href="/bezviz/">Полный список с условиями</a></div>
<div class="polas">${свНеРФ.slice(0, 3).map((d) => `<a class="pola" href="/${d.slug}/"><span class="pbox"></span><span class="pcap">${d.nom}<span class="pdat">≈ ${ф(d.trip)} ₽ / НЕДЕЛЯ</span></span></a>`).join('')}</div>
</section>
<section class="v-shelf">
<div><h2 class="v-q">Где виза <em>оформляется онлайн?</em></h2>
<p class="v-lead"><b>${эв.length} направлений</b> — заявка на сайте, $20–80, один-три дня.</p></div>
<div class="polas">${дешевле(эв).slice(0, 3).map((d) => `<a class="pola" href="/${d.slug}/"><span class="pbox"></span><span class="pcap">${d.nom}<span class="pdat">≈ ${ф(d.trip)} ₽ / НЕДЕЛЯ</span></span></a>`).join('')}</div>
</section>
<p class="next">Ниже — реестр всех 74 направлений с отбором.</p>
<div style="margin-top:1.4rem">${ФИЛЬТРЫ}</div>
${секция('Без визы', св, 'Загранпаспорт от 6 месяцев. Штамп на границе.')}
${секция('Виза онлайн', эв, 'Оформляется до вылета онлайн.')}
${секция('Консульство', кс, 'Визовый центр: биометрия, документы.')}
</div></main>`);

writeFileSync(`${Д}/mock/a.html`, А);
writeFileSync(`${Д}/mock/b.html`, Б);
writeFileSync(`${Д}/mock/v.html`, В);
console.log('три макета собраны:', [А, Б, В].map((x) => Math.round(x.length / 1024) + ' КБ').join(' · '));
