const translations = JSON.parse(document.getElementById('translations-json').textContent);
const specialistSets = JSON.parse(document.getElementById('specialists-json').textContent);
const defaultLang = 'ru';
let currentLang = localStorage.getItem('qalagan_lang') || defaultLang;
const langSwitch = document.querySelector('.lang-switch');
const langToggle = document.querySelector('.lang-toggle');
const langButtons = document.querySelectorAll('.lang-btn');
const translatable = document.querySelectorAll('[data-i18n]');
const supportedLangs = new Set(['ru', 'kk', 'en']);

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
  langToggle.setAttribute('aria-label', labels[lang] || labels[defaultLang]);
  langToggle.setAttribute('title', labels[lang] || labels[defaultLang]);
}

function setLanguage(lang, options = {}) {
  const { restartRotators = true } = options;
  const nextLang = supportedLangs.has(lang) ? lang : defaultLang;
  currentLang = nextLang;
  const dict = translations[nextLang] || translations[defaultLang];
  document.documentElement.lang = nextLang;

  translatable.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
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

function renderHeroCard(item) {
  const services = item.services
    .map(
      ([title, meta, price]) =>
        `<div class="service-row"><div class="service-meta"><b>${title}</b><div>${meta}</div></div><div class="price">${price}</div></div>`
    )
    .join('');
  const slots = item.slots
    .map(
      (slot, i) =>
        `<div class="slot ${i === item.active ? 'active' : ''} ${item.busy.includes(i) ? 'busy' : ''}">${slot}</div>`
    )
    .join('');

  return `
    <div class="rotator-view">
      <div class="mini-hero ${item.theme}">
        <div class="small">${item.label}</div>
        <h3>${item.title}</h3>
        <div class="small">${item.caption}</div>
        <div class="mini-grid"><div class="chip">${item.chip1}</div><div class="chip">${item.chip2}</div></div>
      </div>
      <div class="list-card glass-card">${services}</div>
      <div class="list-card glass-card"><div class="time-row"><b>${item.timesTitle}</b><span>${item.day}</span></div><div class="slots">${slots}</div></div>
      <div class="demo-form-card"><div class="demo-form-title">${item.formTitle}</div><div class="demo-form-desc">${item.formDesc}</div></div>
    </div>`;
}

function renderShowcaseCard(item) {
  const services = item.services
    .map(
      ([title, meta, price]) =>
        `<div class="service-row"><div class="service-meta"><b>${title}</b><div>${meta}</div></div><div class="price">${price}</div></div>`
    )
    .join('');
  const slots = item.slots
    .map(
      (slot, i) =>
        `<div class="slot ${i === item.active ? 'active' : ''} ${item.busy.includes(i) ? 'busy' : ''}">${slot}</div>`
    )
    .join('');

  return `
    <div class="rotator-view showcase-view card glass-card showcase-panel">
      <div class="mini-hero ${item.theme} showcase-hero">
        <div class="small">${item.label}</div>
        <h3>${item.title}</h3>
        <div class="small">${item.caption}</div>
        <div class="showcase-tag chip">${item.tag}</div>
      </div>
      <div class="list-card glass-card showcase-list">${services}</div>
      <div class="list-card glass-card showcase-list"><div class="time-row"><b>${item.timesTitle}</b><span>${item.day}</span></div><div class="slots">${slots}</div></div>
    </div>`;
}

function createRotator(targetId, type, renderer, interval) {
  const el = document.getElementById(targetId);
  let index = 0;
  let timer = null;
  let isAnimating = false;

  const dataset = () => specialistSets[type][currentLang] || specialistSets[type][defaultLang] || [];

  function renderItem(item, className = 'is-current') {
    const panel = document.createElement('div');
    panel.className = `rotator-panel ${className}`;
    panel.innerHTML = renderer(item);
    return panel;
  }

  function paint(nextIndex) {
    const items = dataset();
    if (!el || !items.length) return;
    el.innerHTML = '';
    el.appendChild(renderItem(items[nextIndex % items.length]));
  }

  function tick() {
    const items = dataset();
    if (!el || isAnimating || items.length < 2) return;

    const nextIndex = (index + 1) % items.length;
    const currentPanel = el.querySelector('.rotator-panel.is-current') || renderItem(items[index], 'is-current');

    if (!currentPanel.parentNode) {
      el.appendChild(currentPanel);
    }

    const incomingPanel = renderItem(items[nextIndex], 'is-next');
    el.appendChild(incomingPanel);
    isAnimating = true;

    requestAnimationFrame(() => {
      el.classList.add('is-transitioning');
      currentPanel.classList.add('is-leaving');
      incomingPanel.classList.add('is-entering');
    });

    const finalize = () => {
      index = nextIndex;
      isAnimating = false;
      el.classList.remove('is-transitioning');
      el.innerHTML = '';
      el.appendChild(renderItem(items[index], 'is-current'));
    };

    incomingPanel.addEventListener('transitionend', finalize, { once: true });
  }

  function start() {
    stop();
    paint(index);
    timer = setInterval(tick, interval);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restart() {
    index = 0;
    isAnimating = false;
    start();
  }

  return { start, stop, restart };
}

const heroRotator = createRotator('heroRotator', 'hero', renderHeroCard, 4300);
const showcaseRotator = createRotator('showcaseRotator', 'showcase', renderShowcaseCard, 5000);
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
