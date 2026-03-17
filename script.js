
const translations = JSON.parse(document.getElementById('translations-json').textContent);
const specialistSets = JSON.parse(document.getElementById('specialists-json').textContent);
let currentLang = localStorage.getItem('qalagan_lang') || 'ru';
const langButtons = document.querySelectorAll('.lang-btn');
const translatable = document.querySelectorAll('[data-i18n]');
function setLanguage(lang){
  currentLang = lang;
  const dict = translations[lang] || translations.ru;
  document.documentElement.lang = lang === 'kk' ? 'kk' : lang;
  translatable.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  localStorage.setItem('qalagan_lang', lang);
  heroRotator.restart();
  showcaseRotator.restart();
}
langButtons.forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
function renderHeroCard(item){
  const services = item.services.map(([title, meta, price]) => `<div class="service-row"><div class="service-meta"><b>${title}</b><div>${meta}</div></div><div class="price">${price}</div></div>`).join('');
  const slots = item.slots.map((slot, i) => `<div class="slot ${i===item.active?'active':''} ${item.busy.includes(i)?'busy':''}">${slot}</div>`).join('');
  return `<div class="mini-hero ${item.theme}"><div class="small">${item.label}</div><h3>${item.title}</h3><div class="small">${item.caption}</div><div class="mini-grid"><div class="chip">${item.chip1}</div><div class="chip">${item.chip2}</div></div></div><div class="list-card glass-card">${services}</div><div class="list-card glass-card"><div class="time-row"><b>${item.timesTitle}</b><span>${item.day}</span></div><div class="slots">${slots}</div></div><div class="demo-form-card"><div style="font-weight:700;font-size:15px;margin-bottom:8px">${item.formTitle}</div><div style="font-size:13px;line-height:1.6;color:rgba(255,255,255,.78)">${item.formDesc}</div></div>`;
}
function renderShowcaseCard(item){
  const services = item.services.map(([title, meta, price]) => `<div class="service-row"><div class="service-meta"><b>${title}</b><div>${meta}</div></div><div class="price">${price}</div></div>`).join('');
  const slots = item.slots.map((slot, i) => `<div class="slot ${i===item.active?'active':''} ${item.busy.includes(i)?'busy':''}">${slot}</div>`).join('');
  return `<div class="card glass-card" style="padding:18px;background:linear-gradient(180deg, rgba(17,22,29,.03), rgba(255,255,255,.68))"><div class="mini-hero ${item.theme}" style="margin:0 0 16px 0;padding:18px 18px 16px"><div class="small">${item.label}</div><h3 style="font-size:26px">${item.title}</h3><div class="small">${item.caption}</div><div style="margin-top:12px" class="chip">${item.tag}</div></div><div class="list-card glass-card" style="margin-top:0">${services}</div><div class="list-card glass-card"><div class="time-row"><b>${item.timesTitle}</b><span>${item.day}</span></div><div class="slots">${slots}</div></div></div>`;
}
function createRotator(targetId, type, renderer, interval){
  const el = document.getElementById(targetId); let index = 0; let timer = null;
  const dataset = () => specialistSets[type][currentLang] || specialistSets[type].ru;
  function paint(nextIndex){ const items = dataset(); el.innerHTML = renderer(items[nextIndex % items.length]); }
  function tick(){ const items = dataset(); if(!items.length) return; el.classList.remove('animating-in'); el.classList.add('animating-out'); setTimeout(() => { index = (index + 1) % items.length; paint(index); el.classList.remove('animating-out'); el.classList.add('animating-in'); requestAnimationFrame(() => setTimeout(() => el.classList.remove('animating-in'), 30)); }, 340); }
  function start(){ stop(); paint(index); timer = setInterval(tick, interval); }
  function stop(){ if(timer) clearInterval(timer); }
  function restart(){ index = 0; start(); }
  return { start, stop, restart };
}
const heroRotator = createRotator('heroRotator', 'hero', renderHeroCard, 2900);
const showcaseRotator = createRotator('showcaseRotator', 'showcase', renderShowcaseCard, 3200);
const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('visible'); }); }, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
setLanguage(currentLang); heroRotator.start(); showcaseRotator.start();
document.addEventListener('visibilitychange', () => { if(document.hidden){ heroRotator.stop(); showcaseRotator.stop(); } else { heroRotator.start(); showcaseRotator.start(); } });
