// Loads content.json and renders every section of the page.
// Edit content.json to change any text, job, skill, or link on the site;
// this file only handles rendering and never needs to change for content updates.
//
// All text from content.json is inserted via textContent/DOM properties,
// never innerHTML, so nothing in content.json can be interpreted as markup.
// The one exception is LINKEDIN_ICON below, which is a hardcoded constant
// defined in this file (not data from content.json), so it's safe to insert
// as markup.
//
// Error handling philosophy: each section renders independently. If one
// section's data is missing or malformed, that section is skipped (logged
// to the console) rather than blanking the whole page. Run
// `node validate-content.js` before deploying to catch content.json
// mistakes ahead of time instead of relying on this runtime fallback.

const LINKEDIN_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>`;

const FORM_SUBMIT_TIMEOUT_MS = 15000;

// Small DOM-builder helper: creates an element, sets text via textContent
// (never innerHTML), and sets attributes via setAttribute.
function createEl(tag, { className, text, attrs } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      node.setAttribute(key, value);
    }
  }
  return node;
}

// Null-safe text setter: no-ops if the element doesn't exist, instead of
// throwing, so a missing/renamed id in index.html can't crash the whole render.
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '';
}

async function loadContent() {
  // cache: 'no-store' so browsers never serve a stale cached copy of
  // content.json, always fetch what's actually on disk/deployed.
  const res = await fetch('content.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`content.json request failed with status ${res.status}`);
  return res.json();
}

function renderHero(hero = {}, meta = {}) {
  setText('heroName', hero.name);
  setText('heroRole', hero.role);
  setText('heroSummary', hero.summary);

  const actions = document.getElementById('heroActions');
  if (!actions) return;
  actions.textContent = '';

  const primaryCta = hero.primaryCta || {};
  const secondaryCta = hero.secondaryCta || {};
  const secondaryHref = secondaryCta.hrefKey ? meta[secondaryCta.hrefKey] : secondaryCta.href;

  if (primaryCta.label && primaryCta.href) {
    actions.appendChild(createEl('a', {
      className: 'btn btn-primary',
      text: primaryCta.label,
      attrs: { href: primaryCta.href }
    }));
  }
  if (secondaryCta.label && secondaryHref) {
    actions.appendChild(createEl('a', {
      className: 'btn btn-outline',
      text: secondaryCta.label,
      attrs: { href: secondaryHref, target: '_blank', rel: 'noopener' }
    }));
  }
}

function buildList(className, items) {
  const list = createEl('ul', { className });
  (items || []).forEach(item => list.appendChild(createEl('li', { text: item })));
  return list;
}

function buildFaqList(faqItems) {
  const wrap = createEl('div', { className: 'faq-list' });
  (faqItems || []).forEach(faq => {
    const { q, a } = faq || {};
    const item = createEl('div', { className: 'faq-item' });
    item.append(
      createEl('p', { className: 'faq-q', text: q || '' }),
      createEl('p', { className: 'faq-a', text: a || '' })
    );
    wrap.appendChild(item);
  });
  return wrap;
}

function buildServiceBlock(service) {
  const s = service || {};
  const block = createEl('div', { className: 'service-block fade-in', attrs: { id: s.id || '' } });
  block.append(
    createEl('h3', { className: 'service-title', text: s.title || '' }),
    createEl('p', { className: 'service-summary', text: s.summary || '' }),
    createEl('div', { className: 'service-subhead', text: 'Who this is for' }),
    createEl('p', { className: 'service-who', text: s.whoFor || '' }),
    createEl('div', { className: 'service-subhead', text: "What's included" }),
    buildList('scope-list', s.scope),
    createEl('div', { className: 'service-subhead', text: 'Proof points' }),
    buildList('proof-list', s.proofPoints),
    createEl('div', { className: 'service-subhead', text: 'FAQ' }),
    buildFaqList(s.faq)
  );
  return block;
}

function renderServices(services = {}) {
  setText('servicesLabel', services.label);
  setText('servicesTitle', services.title);
  setText('servicesIntro', services.intro);

  const list = document.getElementById('servicesList');
  if (list) {
    list.textContent = '';
    (services.items || []).forEach(item => list.appendChild(buildServiceBlock(item)));
  }

  setText('servicesNote', services.note);
}

function renderSkills(skills = {}) {
  setText('skillsLabel', skills.label);
  setText('skillsTitle', skills.title);

  const list = document.getElementById('skillsList');
  if (!list) return;
  list.textContent = '';
  (skills.groups || []).forEach(group => {
    const g = group || {};
    const tagList = createEl('div', { className: 'tag-list' });
    (g.tags || []).forEach(tag => tagList.appendChild(createEl('span', { className: 'tag', text: tag })));

    const card = createEl('div', { className: 'skill-card fade-in' });
    card.append(createEl('h3', { text: g.name || '' }), tagList);
    list.appendChild(card);
  });
}

function renderEducation(education = {}) {
  setText('educationLabel', education.label);
  setText('educationTitle', education.title);

  const card = document.getElementById('eduCard');
  if (!card) return;
  card.textContent = '';
  card.append(
    createEl('div', { className: 'edu-degree', text: education.degree || '' }),
    createEl('div', { className: 'edu-school', text: education.school || '' }),
    createEl('div', { className: 'edu-detail', text: education.detail || '' })
  );
}

function renderContact(contact = {}, meta = {}) {
  setText('contactLabel', contact.label);
  setText('contactTitle', contact.title);
  setText('contactText', contact.text);

  const linkedinWrap = document.getElementById('contactLinkedin');
  if (linkedinWrap) {
    linkedinWrap.textContent = '';
    if (meta.linkedinUrl) {
      const link = createEl('a', {
        className: 'contact-link',
        attrs: { href: meta.linkedinUrl, target: '_blank', rel: 'noopener' }
      });
      // LINKEDIN_ICON is a hardcoded constant defined above, not data from
      // content.json, so it's safe to insert as markup here.
      const iconWrap = document.createElement('span');
      iconWrap.innerHTML = LINKEDIN_ICON;
      if (iconWrap.firstChild) link.appendChild(iconWrap.firstChild);
      link.appendChild(document.createTextNode(' ' + (meta.linkedinDisplay || '')));
      linkedinWrap.appendChild(link);
    }
  }

  const form = document.getElementById('contactForm');
  if (form) {
    form.action = contact.formAction || '';
    const accessKeyInput = form.querySelector('input[name="access_key"]');
    if (accessKeyInput) accessKeyInput.value = contact.accessKey || '';
    const subjectInput = form.querySelector('input[name="subject"]');
    if (subjectInput) subjectInput.value = contact.formSubject || '';
  }

  setText('formNote', contact.formNote);
}

function renderFooter(footer = {}) {
  setText('footerText', footer.text);
}

function setupNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (!navToggle || !navLinks) return;
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

function setupFadeIn() {
  if (!('IntersectionObserver' in window)) {
    // Fallback for very old browsers without IntersectionObserver support:
    // just show everything immediately instead of leaving it invisible.
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// Sets up AJAX submission for the contact form: prevents the default full-page
// navigation to Web3Forms' raw response, shows inline success/error state,
// disables the button while sending, and times out instead of hanging forever
// on a stalled network request.
function setupContactForm(contact = {}) {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.textContent : 'Send message';

  let statusEl = document.getElementById('formStatus');
  if (!statusEl) {
    statusEl = createEl('p', { className: 'form-status', attrs: { id: 'formStatus', role: 'status', 'aria-live': 'polite' } });
    form.appendChild(statusEl);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!form.action) {
      statusEl.textContent = contact.errorMessage || 'This form is not configured yet.';
      statusEl.className = 'form-status form-status-error';
      return;
    }

    statusEl.textContent = '';
    statusEl.className = 'form-status';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FORM_SUBMIT_TIMEOUT_MS);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`Form submission failed with status ${res.status}`);

      statusEl.textContent = contact.successMessage || "Thanks, I'll get back to you soon.";
      statusEl.className = 'form-status form-status-success';
      form.reset();
    } catch (err) {
      console.error('Contact form submission failed:', err);
      const timedOut = err && err.name === 'AbortError';
      statusEl.textContent = timedOut
        ? 'That took too long and timed out. Please try again, or reach out on LinkedIn instead.'
        : (contact.errorMessage || 'Something went wrong sending that. Please try again, or reach out on LinkedIn instead.');
      statusEl.className = 'form-status form-status-error';
    } finally {
      clearTimeout(timeoutId);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  });
}

function renderLoadError() {
  const top = document.getElementById('top');
  if (!top) return;
  top.textContent = '';

  const msg = createEl('p', { attrs: { style: 'padding:120px 0;color:#a79fc0;max-width:640px;' } });

  if (window.location.protocol === 'file:') {
    msg.append(
      document.createTextNode("Content failed to load. You're viewing this file locally over file://, run a local server instead (e.g. "),
      createEl('code', { text: 'python3 -m http.server' }),
      document.createTextNode(') and open it at http://localhost, browsers block local JSON fetches over file://.')
    );
  } else {
    msg.append(
      document.createTextNode('Something went wrong loading this page. Please try refreshing. If the problem continues, the site content file may be missing or malformed.')
    );
  }
  top.appendChild(msg);
}

// Each section renders independently so one bad field in content.json
// can't take down the whole page; failures are logged to the console
// with which section failed, and that section is simply left empty.
function renderSection(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`Failed to render "${name}" section:`, err);
  }
}

async function init() {
  let data;
  try {
    data = await loadContent();
  } catch (err) {
    console.error('Failed to load content.json:', err);
    renderLoadError();
    setupNav();
    setupFadeIn();
    return;
  }

  renderSection('hero', () => renderHero(data.hero, data.meta));
  renderSection('services', () => renderServices(data.services));
  renderSection('skills', () => renderSkills(data.skills));
  renderSection('education', () => renderEducation(data.education));
  renderSection('contact', () => renderContact(data.contact, data.meta));
  renderSection('footer', () => renderFooter(data.footer));

  setupNav();
  setupFadeIn();
  renderSection('contact form handlers', () => setupContactForm(data.contact));
}

init();
