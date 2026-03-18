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
    exampleRotator.restart();
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

function getCurrentDict() {
  return translations[currentLang] || translations[defaultLang];
}

function renderContacts(contacts) {
  return contacts.map((type) => `<span class="contact-dot ${type}" aria-hidden="true"></span>`).join('');
}

function renderServices(services) {
  return services.map(([title, price]) => `<div class="service-row"><span>${title}</span><strong>${price}</strong></div>`).join('');
}

function renderSlots(slots) {
  return slots.map((slot, index) => `<span class="slot-chip ${index === 2 ? 'active' : ''}">${slot}</span>`).join('');
}

function renderScreen(item, { compact = false } = {}) {
  const dict = getCurrentDict();
  return `
    <article class="specialist-screen ${item.theme} ${compact ? 'compact' : ''}">
      <div class="screen-top">
        <div>
          <div class="screen-name">${item.name}</div>
          <div class="screen-role">${item.role}</div>
        </div>
        <div class="screen-contacts">${renderContacts(item.contacts)}</div>
      </div>
      <div class="screen-card-block">
        <div class="screen-label">${dict.nav_examples}</div>
        ${renderServices(item.services)}
      </div>
      <div class="screen-card-block">
        <div class="screen-label">${dict.examples_phone_hint}</div>
        <div class="slot-grid">${renderSlots(item.slots)}</div>
      </div>
      <button class="screen-button" type="button">${item.cta}</button>
    </article>`;
}

function createHeroRotator(targetId) {
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
      <div class="hero-phone left">${renderScreen(left, { compact: true })}</div>
      <div class="hero-phone center">${renderScreen(center)}</div>
      <div class="hero-phone right">${renderScreen(right, { compact: true })}</div>`;
  }

  function start() {
    stop();
    paint();
    timer = setInterval(() => {
      const items = dataset();
      if (!items.length) return;
      index = (index + 1) % items.length;
      paint();
    }, 4300);
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

function createExampleRotator(targetId) {
  const el = document.getElementById(targetId);
  let index = 0;
  let timer = null;
  let isAnimating = false;

  const dataset = () => specialistSets.showcase[currentLang] || specialistSets.showcase[defaultLang] || [];

  function panel(item, className) {
    const node = document.createElement('div');
    node.className = `example-panel ${className}`;
    node.innerHTML = renderScreen(item);
    return node;
  }

  function paint(currentIndex) {
    const items = dataset();
    if (!el || !items.length) return;
    el.innerHTML = '';
    el.appendChild(panel(items[currentIndex % items.length], 'current'));
  }

  function tick() {
    const items = dataset();
    if (!el || items.length < 2 || isAnimating) return;
    const nextIndex = (index + 1) % items.length;
    const current = el.querySelector('.example-panel.current');
    const next = panel(items[nextIndex], 'next');
    el.appendChild(next);
    isAnimating = true;

    requestAnimationFrame(() => {
      el.classList.add('switching');
      current?.classList.add('leave');
      next.classList.add('enter');
    });

    next.addEventListener('transitionend', () => {
      index = nextIndex;
      isAnimating = false;
      el.classList.remove('switching');
      paint(index);
    }, { once: true });
  }

  function start() {
    stop();
    paint(index);
    timer = setInterval(tick, 5000);
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

const heroRotator = createHeroRotator('heroStack');
const exampleRotator = createExampleRotator('showcaseRotator');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
setLanguage(currentLang, { restartRotators: false });
heroRotator.start();
exampleRotator.start();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    heroRotator.stop();
    exampleRotator.stop();
  } else {
    heroRotator.start();
    exampleRotator.start();
  }
});
