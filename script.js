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
    heroShowcase.restart();
    examplesShowcase.restart();
  }
}

langToggle?.addEventListener('click', () => {
  if (langSwitch.classList.contains('open')) closeLangMenu();
  else openLangMenu();
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

function renderServices(services) {
  return services
    .map(([title, price]) => `<div class="preview-row"><span>${title}</span><strong>${price}</strong></div>`)
    .join('');
}

function renderSlots(slots) {
  return slots.map((slot) => `<span class="time-chip">${slot}</span>`).join('');
}

function renderSpecialistCard(item, options = {}) {
  const { compact = false } = options;
  const dict = translations[currentLang] || translations[defaultLang];
  return `
    <article class="specialist-screen ${item.theme} ${compact ? 'compact' : ''}">
      <div class="screen-top">
        <div>
          <div class="screen-name">${item.name}</div>
          <div class="screen-role">${item.role}</div>
        </div>
        <div class="screen-status">${dict.screen_status}</div>
      </div>
      <div class="screen-block">
        <div class="screen-label">${dict.screen_services}</div>
        ${renderServices(item.services)}
      </div>
      <div class="screen-block">
        <div class="screen-label">${dict.screen_slots}</div>
        <div class="time-grid">${renderSlots(item.slots)}</div>
      </div>
      <button class="screen-cta" type="button">${item.cta}</button>
    </article>`;
}

function createHeroShowcase(targetId) {
  const el = document.getElementById(targetId);
  let index = 0;
  let timer = null;

  const dataset = () => specialistSets.hero[currentLang] || specialistSets.hero[defaultLang] || [];

  function paint() {
    const items = dataset();
    if (!el || items.length < 3) return;
    const center = items[index % items.length];
    const left = items[(index + items.length - 1) % items.length];
    const right = items[(index + 1) % items.length];

    el.innerHTML = `
      <div class="hero-screen side left">${renderSpecialistCard(left, { compact: true })}</div>
      <div class="hero-screen center">${renderSpecialistCard(center)}</div>
      <div class="hero-screen side right">${renderSpecialistCard(right, { compact: true })}</div>`;
  }

  function start() {
    stop();
    paint();
    timer = setInterval(() => {
      index = (index + 1) % dataset().length;
      paint();
    }, 4200);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restart() {
    index = 0;
    start();
  }

  return { start, stop, restart };
}

function createExamplesRotator(targetId) {
  const el = document.getElementById(targetId);
  let index = 0;
  let timer = null;
  let isAnimating = false;

  const dataset = () => specialistSets.showcase[currentLang] || specialistSets.showcase[defaultLang] || [];

  function renderPanel(item, cls) {
    const panel = document.createElement('div');
    panel.className = `showcase-panel ${cls}`;
    panel.innerHTML = renderSpecialistCard(item);
    return panel;
  }

  function paint(nextIndex) {
    const items = dataset();
    if (!el || !items.length) return;
    el.innerHTML = '';
    el.appendChild(renderPanel(items[nextIndex % items.length], 'current'));
  }

  function tick() {
    const items = dataset();
    if (!el || isAnimating || items.length < 2) return;
    const currentPanel = el.querySelector('.showcase-panel.current');
    const nextIndex = (index + 1) % items.length;
    const nextPanel = renderPanel(items[nextIndex], 'next');
    el.appendChild(nextPanel);
    isAnimating = true;

    requestAnimationFrame(() => {
      el.classList.add('switching');
      currentPanel?.classList.add('leave');
      nextPanel.classList.add('enter');
    });

    nextPanel.addEventListener('transitionend', () => {
      index = nextIndex;
      isAnimating = false;
      el.classList.remove('switching');
      paint(index);
    }, { once: true });
  }

  function start() {
    stop();
    paint(index);
    timer = setInterval(tick, 4800);
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

const heroShowcase = createHeroShowcase('heroStack');
const examplesShowcase = createExamplesRotator('showcaseRotator');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
setLanguage(currentLang, { restartRotators: false });
heroShowcase.start();
examplesShowcase.start();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    heroShowcase.stop();
    examplesShowcase.stop();
  } else {
    heroShowcase.start();
    examplesShowcase.start();
  }
});
