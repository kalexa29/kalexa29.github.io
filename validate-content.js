#!/usr/bin/env node
// Zero-dependency validator for content.json.
//
// Run before pushing changes: `node validate-content.js`
// (or point it at another file: `node validate-content.js path/to/file.json`)
//
// Checks that every field script.js expects is present and the right type,
// so a typo or missing field gets caught here instead of silently leaving
// a blank section on the live site. Also flags the two most common personal
// mistakes for this project: em-dashes (house style forbids them) and the
// unfilled Web3Forms placeholder key.

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || path.join(__dirname, 'content.json');

const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }
function isArray(v) { return Array.isArray(v); }
function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function requireString(obj, key, context) {
  if (!isNonEmptyString(obj?.[key])) fail(`${context}.${key} must be a non-empty string`);
}

function requireArray(obj, key, context, minLength = 0) {
  const val = obj?.[key];
  if (!isArray(val)) {
    fail(`${context}.${key} must be an array`);
    return;
  }
  if (val.length < minLength) fail(`${context}.${key} must have at least ${minLength} item(s)`);
}

function scanForEmDashes(value, context) {
  if (typeof value === 'string') {
    if (value.includes('—')) warn(`${context} contains an em-dash (—), house style avoids these`);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanForEmDashes(v, `${context}[${i}]`));
  } else if (isObject(value)) {
    for (const [k, v] of Object.entries(value)) scanForEmDashes(v, `${context}.${k}`);
  }
}

// --- Load and parse ---
let raw;
try {
  raw = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error(`Could not read ${filePath}: ${err.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`content.json is not valid JSON: ${err.message}`);
  process.exit(1);
}

// --- meta ---
if (isObject(data.meta)) {
  ['title', 'description', 'ogDescription', 'canonicalUrl', 'linkedinUrl', 'linkedinDisplay'].forEach(k =>
    requireString(data.meta, k, 'meta')
  );
  if (isNonEmptyString(data.meta.canonicalUrl) && !/^https?:\/\//.test(data.meta.canonicalUrl)) {
    fail('meta.canonicalUrl should start with http:// or https://');
  }
  if (isNonEmptyString(data.meta.linkedinUrl) && !data.meta.linkedinUrl.includes('linkedin.com')) {
    warn('meta.linkedinUrl does not look like a linkedin.com URL');
  }
} else {
  fail('Top-level "meta" object is missing');
}

// --- hero ---
if (isObject(data.hero)) {
  requireString(data.hero, 'name', 'hero');
  requireString(data.hero, 'role', 'hero');
  requireString(data.hero, 'summary', 'hero');
  if (isObject(data.hero.primaryCta)) {
    requireString(data.hero.primaryCta, 'label', 'hero.primaryCta');
    requireString(data.hero.primaryCta, 'href', 'hero.primaryCta');
  } else {
    fail('hero.primaryCta object is missing');
  }
  if (isObject(data.hero.secondaryCta)) {
    requireString(data.hero.secondaryCta, 'label', 'hero.secondaryCta');
    if (!isNonEmptyString(data.hero.secondaryCta.href) && !isNonEmptyString(data.hero.secondaryCta.hrefKey)) {
      fail('hero.secondaryCta needs either "href" or "hrefKey"');
    }
    if (isNonEmptyString(data.hero.secondaryCta.hrefKey) && !data.meta?.[data.hero.secondaryCta.hrefKey]) {
      fail(`hero.secondaryCta.hrefKey "${data.hero.secondaryCta.hrefKey}" does not exist in meta`);
    }
  } else {
    fail('hero.secondaryCta object is missing');
  }
} else {
  fail('Top-level "hero" object is missing');
}

// --- services ---
if (isObject(data.services)) {
  requireString(data.services, 'label', 'services');
  requireString(data.services, 'title', 'services');
  requireString(data.services, 'intro', 'services');
  requireString(data.services, 'note', 'services');
  requireArray(data.services, 'items', 'services', 1);

  (data.services.items || []).forEach((item, i) => {
    const ctx = `services.items[${i}]`;
    if (!isObject(item)) { fail(`${ctx} must be an object`); return; }
    requireString(item, 'id', ctx);
    requireString(item, 'title', ctx);
    requireString(item, 'summary', ctx);
    requireString(item, 'whoFor', ctx);
    requireArray(item, 'scope', ctx, 1);
    requireArray(item, 'proofPoints', ctx, 1);
    requireArray(item, 'faq', ctx, 1);
    (item.faq || []).forEach((faq, j) => {
      const faqCtx = `${ctx}.faq[${j}]`;
      if (!isObject(faq)) { fail(`${faqCtx} must be an object`); return; }
      requireString(faq, 'q', faqCtx);
      requireString(faq, 'a', faqCtx);
    });
  });

  // ids must be unique (used as DOM ids and anchor targets)
  const ids = (data.services.items || []).map(i => i?.id).filter(Boolean);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(`services.items has duplicate id(s): ${[...new Set(dupes)].join(', ')}`);
} else {
  fail('Top-level "services" object is missing');
}

// --- skills ---
if (isObject(data.skills)) {
  requireString(data.skills, 'label', 'skills');
  requireString(data.skills, 'title', 'skills');
  requireArray(data.skills, 'groups', 'skills', 1);
  (data.skills.groups || []).forEach((group, i) => {
    const ctx = `skills.groups[${i}]`;
    if (!isObject(group)) { fail(`${ctx} must be an object`); return; }
    requireString(group, 'name', ctx);
    requireArray(group, 'tags', ctx, 1);
  });
} else {
  fail('Top-level "skills" object is missing');
}

// --- education ---
if (isObject(data.education)) {
  ['label', 'title', 'degree', 'school', 'detail'].forEach(k => requireString(data.education, k, 'education'));
} else {
  fail('Top-level "education" object is missing');
}

// --- contact ---
if (isObject(data.contact)) {
  ['label', 'title', 'text', 'formAction', 'accessKey', 'formSubject', 'formNote', 'successMessage', 'errorMessage']
    .forEach(k => requireString(data.contact, k, 'contact'));
  if (data.contact.accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    warn('contact.accessKey is still the placeholder value, the contact form will not deliver messages until this is replaced');
  }
  if (isNonEmptyString(data.contact.formAction) && !/^https:\/\//.test(data.contact.formAction)) {
    warn('contact.formAction should be an https:// URL');
  }
} else {
  fail('Top-level "contact" object is missing');
}

// --- footer ---
if (isObject(data.footer)) {
  requireString(data.footer, 'text', 'footer');
} else {
  fail('Top-level "footer" object is missing');
}

// --- global em-dash scan ---
scanForEmDashes(data, 'content.json');

// --- report ---
console.log(`Validated ${path.relative(process.cwd(), filePath) || filePath}\n`);

if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  warnings.forEach(w => console.log(`  - ${w}`));
  console.log('');
}

if (errors.length) {
  console.log(`${errors.length} error(s):`);
  errors.forEach(e => console.log(`  - ${e}`));
  console.log('\nFAILED');
  process.exit(1);
}

console.log('All checks passed.');
process.exit(0);
