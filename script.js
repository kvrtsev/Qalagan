const translations = JSON.parse(document.getElementById('translations-json').textContent);
const specialistSets = JSON.parse(document.getElementById('specialists-json').textContent);

const defaultLang = 'ru';
const supportedLangs = new Set(['ru', 'kk', 'en']);
let currentLang = localStorage.getItem('qalagan_lang') || defaultLang;

const langSwitch = document.querySelector('.lang-switch');
const langToggle = document.querySelector('.lang-toggle');
const langButtons = document.querySelectorAll('.lang-btn');
const translatable = document.querySelectorAll('[data-i18n]');

document.getElementById('year').textContent = new Date().getFullYear();

function closeLangMenu() {
  if (!langSwitch || !langToggle) return;
  langSwitch.classList.remove('open');
  langToggle.setAttribute('aria-expanded', 'false');
}

function openLangMenu() {
  if (!langSwitch || !langToggle) return;
  langSwitch.classList.add('open');
  langToggle.setAttribute('aria-expanded', 'true');
}

function updateLangToggleLabel(lang) {
  if (!langToggle) return;
  const labels = {
    ru: 'Выбрать язык. Текущий: Русский',
    kk: 'Тілді таңдау. Ағымдағысы: Қазақша',
    en: 'Choose language. Current: English'
  };
  const label = labels[lang] || labels[defaultLang];
  langToggle.setAttribute('aria-label', label);
  langToggle.setAttribute('title', label);
}

function setLanguage(lang, options = {}) {
  const { restartRotators = true } = options;
  const nextLang = supportedLangs.has(lang) ? lang : defaultLang;
  currentLang = nextLang;
  const dict = translations[nextLang] || translations[defaultLang];
  document.documentElement.lang = nextLang;

  translatable.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === nextLang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', String(isActive));
  });

  updateLangToggleLabel(nextLang);
  localStorage.setItem('qalagan_lang', nextLang);

  if (restartRotators) {
    heroRotator.restart();
    showcaseRotator.restart();
  }
}

langToggle?.addEventListener('click', () => {
  if (langSwitch.classList.contains('open')) {
    closeLangMenu();
  } else {
    openLangMenu();
  }
});

langButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setLanguage(btn.dataset.lang);
    closeLangMenu();
  });
});

document.addEventListener('click', (event) => {
  if (!langSwitch || langSwitch.contains(event.target)) return;
  closeLangMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLangMenu();
});

function renderServiceRows(services) {
  return services
    .map(
      ([title, meta, price]) =>
        `<div class="service-row"><div class="service-meta"><b>${title}</b><div>${meta}</div></div><div class="price">${price}</div></div>`
    )
    .join('');
}

function renderSlots(item) {
  return item.slots
    .map(
      (slot, i) =>
        `<div class="slot ${i === item.active ? 'active' : ''} ${item.busy.includes(i) ? 'busy' : ''}">${slot}</div>`
    )
    .join('');
}

function renderHeroCard(item) {
  return `
    <div class="mini-hero ${item.theme}">
      <div class="small">${item.label}</div>
      <h3>${item.title}</h3>
      <div class="small">${item.caption}</div>
      <div class="mini-grid"><div class="chip">${item.chip1}</div><div class="chip">${item.chip2}</div></div>
    </div>
    <div class="list-card">${renderServiceRows(item.services)}</div>
    <div class="list-card"><div class="time-row"><b>${item.timesTitle}</b><span>${item.day}</span></div><div class="slots">${renderSlots(item)}</div></div>
    <div class="demo-form-card"><div class="form-title">${item.formTitle}</div><div class="form-desc">${item.formDesc}</div></div>
  `;
}

function renderShowcaseCard(item) {
  return `
    <div class="mini-hero ${item.theme}">
      <div class="small">${item.label}</div>
      <h3>${item.title}</h3>
      <div class="small">${item.caption}</div>
      <div class="mini-grid"><div class="chip">${item.tag}</div></div>
    </div>
    <div class="list-card">${renderServiceRows(item.services)}</div>
    <div class="list-card"><div class="time-row"><b>${item.timesTitle}</b><span>${item.day}</span></div><div class="slots">${renderSlots(item)}</div></div>
  `;
}

function createRotator(targetId, type, renderer, interval) {
  const el = document.getElementById(targetId);
  let index = 0;
  let timer = null;

  const dataset = () => specialistSets[type][currentLang] || specialistSets[type][defaultLang] || [];

  function paint(nextIndex) {
    const items = dataset();
    if (!el || !items.length) return;
    el.innerHTML = renderer(items[nextIndex % items.length]);
  }

  function tick() {
    const items = dataset();
    if (!el || !items.length) return;
    el.classList.remove('animating-in');
    el.classList.add('animating-out');
    setTimeout(() => {
      index = (index + 1) % items.length;
      paint(index);
      el.classList.remove('animating-out');
      el.classList.add('animating-in');
      requestAnimationFrame(() => setTimeout(() => el.classList.remove('animating-in'), 30));
    }, 300);
  }

  function start() {
    stop();
    paint(index);
    timer = setInterval(tick, interval);
  }

  function stop() {
    if (timer) clearInterval(timer);
  }

  function restart() {
    index = 0;
    start();
  }

  return { start, stop, restart };
}

const heroRotator = createRotator('heroRotator', 'hero', renderHeroCard, 3200);
const showcaseRotator = createRotator('showcaseRotator', 'showcase', renderShowcaseCard, 3600);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
setLanguage(currentLang, { restartRotators: false });
heroRotator.start();
showcaseRotator.start();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    heroRotator.stop();
    showcaseRotator.stop();
  } else {
    heroRotator.start();
    showcaseRotator.start();
  }
});
