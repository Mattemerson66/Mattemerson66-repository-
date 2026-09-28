'use strict';

/* ---------- Content ---------- */

const PROMPTS = [
  'Who made something a little easier for you today?',
  'What made you laugh or smile today, even briefly?',
  'What did someone do today that they didn\'t have to?',
  'What task went smoother than you feared?',
  'What small thing did you enjoy eating or drinking today?',
  'What worked exactly the way it was supposed to today?',
  'What did you notice today that you usually walk past?',
  'Who said something today that stuck with you?',
  'What problem didn\'t happen today?',
  'What\'s something your body did well today?',
  'What bit of good timing did you get today?',
  'What\'s a tool or object that quietly did its job today?',
  'What moment today would you replay if you could?',
  'What did a stranger do today that helped, even slightly?',
  'What did you get to skip, dodge or finish early today?',
  'What sound, smell or view did you enjoy today?',
  'What\'s something you learned today, however small?',
  'What conversation today went better than expected?',
  'What did someone at home do today that you\'d normally overlook?',
  'What\'s one thing you have now that you once wished for?',
  'Who reached out to you recently, and what did they say?',
  'What part of your routine felt good today?',
  'What did you do today that past-you would be glad about?',
  'What went right at work today, even in a hard day?',
  'What was the most comfortable moment of your day?',
  'What small kindness did you see, give or receive today?',
  'What\'s something that was fixed, repaired or sorted out today?',
  'What did the weather give you today?',
  'What made you feel capable today?',
  'What was easier today than it used to be?',
  'Whose work today made your day possible without you seeing them?',
  'What did a child, pet or friend do today that delighted you?',
  'What surprised you today, in a good way?',
  'What did you get right today?',
  'What\'s a tiny luxury you had today?',
  'What did you have enough of today?',
  'What did someone forgive, excuse or let slide for you?',
  'What went quiet or calm today when it could have been stressful?'
];

const SLOTS = [
  {
    kind: 'unexpected',
    label: 'Unexpected',
    question: 'What went right today that you didn\'t expect?',
    hint: 'Keep it tiny, fresh and surprising. A moment someone made you laugh, or a task that went smoother than you feared.'
  },
  {
    kind: 'prompt',
    label: 'Today\'s prompt',
    hint: 'Be specific: who, what, when.'
  },
  {
    kind: 'contrast',
    label: 'Contrast',
    question: 'What ordinary thing went smoothly today?',
    hint: 'A parking spot right away. Wi-Fi that connected. A meeting that ended on time.',
    reflection: 'Now picture it going wrong. How annoying would that have been?'
  }
];

// Answers that are true but too big to feel anything. If an answer is only
// these words (plus filler like "my" or "grateful for"), nudge toward
// something specific from today.
const TOO_BIG = {
  body: ['health', 'healthy', 'body', 'wellness'],
  people: ['family', 'kids', 'kid', 'children', 'child', 'son', 'daughter', 'sons', 'daughters', 'parents', 'parent',
    'mom', 'mum', 'dad', 'wife', 'husband', 'partner', 'spouse', 'girlfriend', 'boyfriend', 'loved', 'ones', 'people'],
  friends: ['friends', 'friend', 'friendship', 'friendships'],
  work: ['job', 'work', 'career', 'employment', 'income', 'money', 'paycheck'],
  home: ['home', 'house', 'roof', 'head', 'shelter', 'apartment'],
  basics: ['food', 'water', 'electricity', 'safety', 'freedom', 'clothes', 'car'],
  life: ['life', 'alive', 'everything', 'god', 'blessings', 'blessed', 'world', 'universe', 'nature']
};
const FOLLOW_UP = {
  body: 'What did your body let you do today that you usually take for granted?',
  people: 'What did one of them actually do or say today?',
  friends: 'Which friend, and what exactly did they do?',
  work: 'What one moment went better than expected today?',
  home: 'What small thing about home made today easier?',
  basics: 'What specific moment today made you notice it?',
  life: 'Zoom in: what single moment today made you feel that?'
};
const FILLER = new Set(['my', 'the', 'a', 'an', 'and', 'i', 'im', 'am', 'grateful', 'thankful', 'for', 'having', 'have',
  'being', 'our', 'good', 'great', 'nice', 'wonderful', 'amazing', 'loving', 'supportive', 'of', 'to', 'that', 'all',
  'so', 'very', 'such', 'with', 'in', 'over', 'is', 'are', 'still', 'just', 'always', 'me', 'we', 'again', 'today',
  'really', 'lovely', 'beautiful', 'happy', 'safe', 'a']);
const BIG_WORD = new Map();
for (const [group, words] of Object.entries(TOO_BIG)) for (const w of words) BIG_WORD.set(w, group);

/* ---------- Storage ---------- */

const STORE_KEY = 'invisible-good.v1';

function emptyState() {
  return { version: 1, entries: {}, settings: {} };
}

function isValidState(d) {
  return d && typeof d === 'object' && d.entries && typeof d.entries === 'object' && !Array.isArray(d.entries);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (isValidState(d)) {
        d.settings = d.settings && typeof d.settings === 'object' ? d.settings : {};
        return d;
      }
    }
  } catch (e) { /* fall through to empty state */ }
  return emptyState();
}

let state = loadState();
let saveTimer = null;

function persist() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    toast('Couldn\'t save. Storage is full or blocked.');
    return false;
  }
}

function persistSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 300);
}

// Home-screen apps are exempt from Safari's 7-day storage eviction, but ask
// for persistent storage anyway where supported.
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

/* ---------- Dates ---------- */

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayKey() {
  return dateKey(new Date());
}

function formatLong(key) {
  return parseKey(key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatWithYear(key) {
  return parseKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

/* ---------- Prompts ---------- */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dailyPrompt(key) {
  return PROMPTS[hash(key) % PROMPTS.length];
}

function nextPrompt(current) {
  const i = PROMPTS.indexOf(current);
  return PROMPTS[(i + 1 + Math.floor(Math.random() * (PROMPTS.length - 1))) % PROMPTS.length];
}

function tooBigNudge(text) {
  const words = text.toLowerCase()
    .replace(/['’]s\b/g, '')
    .replace(/['’]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean);
  const content = words.filter(w => !FILLER.has(w));
  if (!content.length || content.length > 4) return null;
  if (!content.every(w => BIG_WORD.has(w))) return null;
  return `“${text.trim()}” is real, but it's too big to feel. ${FOLLOW_UP[BIG_WORD.get(content[0])]}`;
}

/* ---------- Entries ---------- */

function blankEntry(key) {
  return {
    date: key,
    items: SLOTS.map(s => ({
      kind: s.kind,
      prompt: s.kind === 'prompt' ? dailyPrompt(key) : s.question,
      text: '',
      reflection: ''
    })),
    done: false
  };
}

function getEntry(key) {
  return state.entries[key] || blankEntry(key);
}

function isComplete(entry) {
  return entry.items.every(i => i.text.trim().length > 0);
}

function hasContent(entry) {
  return entry.items.some(i => i.text.trim() || (i.reflection || '').trim());
}

function storeEntry(entry) {
  const now = new Date().toISOString();
  if (!hasContent(entry) && !entry.done) {
    // Keep an unanswered but shuffled prompt only in memory.
    delete state.entries[entry.date];
    return;
  }
  entry.createdAt = entry.createdAt || now;
  entry.updatedAt = now;
  state.entries[entry.date] = entry;
}

function sortedKeys() {
  return Object.keys(state.entries).sort().reverse();
}

/* ---------- UI helpers ---------- */

const $ = (sel, root = document) => root.querySelector(sel);

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  return node;
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

function autoGrow(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 2 + 'px';
}

/* ---------- Today view ---------- */

let editingKey = todayKey();
let draft = getEntry(editingKey);
let nudgeTimers = [];

function renderToday() {
  const today = todayKey();
  draft = getEntry(editingKey);

  $('#today-date').textContent = formatLong(editingKey);
  $('#editing-banner').hidden = editingKey === today;
  $('#editing-date').textContent = formatWithYear(editingKey);

  const list = $('#slots');
  list.replaceChildren();
  const tpl = $('#slot-template');

  SLOTS.forEach((slot, i) => {
    const item = draft.items[i];
    const node = tpl.content.firstElementChild.cloneNode(true);
    const id = `slot-${i}`;
    node.querySelector('.slot-num').textContent = i + 1;
    node.querySelector('.slot-label').textContent = slot.label;
    const q = node.querySelector('.slot-question');
    q.textContent = item.prompt;
    q.htmlFor = id;
    node.querySelector('.slot-hint').textContent = slot.hint;

    const ta = node.querySelector('.slot-text');
    ta.id = id;
    ta.value = item.text;
    const nudge = node.querySelector('.nudge');

    ta.addEventListener('input', () => {
      item.text = ta.value;
      autoGrow(ta);
      nudge.hidden = true;
      clearTimeout(nudgeTimers[i]);
      nudgeTimers[i] = setTimeout(() => showNudge(ta, nudge), 900);
      onDraftChange();
    });
    ta.addEventListener('blur', () => showNudge(ta, nudge));

    if (slot.kind === 'prompt') {
      const shuffle = node.querySelector('.shuffle');
      shuffle.hidden = false;
      shuffle.addEventListener('click', () => {
        item.prompt = nextPrompt(item.prompt);
        q.textContent = item.prompt;
        onDraftChange();
      });
    }

    if (slot.reflection) {
      const box = node.querySelector('.reflection');
      const rid = `reflection-${i}`;
      box.hidden = false;
      const rq = box.querySelector('.reflection-question');
      rq.textContent = slot.reflection;
      rq.htmlFor = rid;
      const rta = box.querySelector('.slot-reflection');
      rta.id = rid;
      rta.value = item.reflection || '';
      rta.addEventListener('input', () => {
        item.reflection = rta.value;
        autoGrow(rta);
        onDraftChange();
      });
    }

    list.appendChild(node);
  });

  requestAnimationFrame(() => list.querySelectorAll('textarea').forEach(autoGrow));
  updateDoneButton();
  $('#done-panel').hidden = true;
  $('#save-status').textContent = draft.done ? 'Saved. Edits save automatically.' : '';
  renderResurface();
  renderBanners();
}

function showNudge(ta, nudgeEl) {
  const msg = tooBigNudge(ta.value);
  nudgeEl.textContent = msg || '';
  nudgeEl.hidden = !msg;
}

function onDraftChange() {
  storeEntry(draft);
  persistSoon();
  updateDoneButton();
  $('#save-status').textContent = draft.done && isComplete(draft) ? 'Saved. Edits save automatically.' : '';
}

function updateDoneButton() {
  const btn = $('#done-btn');
  const filled = draft.items.filter(i => i.text.trim()).length;
  btn.disabled = filled < 3;
  if (filled < 3) btn.textContent = `${filled} of 3, keep going`;
  else if (draft.done) btn.textContent = 'Saved ✓';
  else btn.textContent = editingKey === todayKey() ? 'Save today\'s three' : 'Save these three';
}

function completeEntry() {
  if (!isComplete(draft)) return;
  draft.done = true;
  storeEntry(draft);
  if (!persist()) return;
  updateDoneButton();
  $('#save-status').textContent = 'Saved. Edits save automatically.';
  const days = Object.values(state.entries).filter(e => e.done && isComplete(e)).length;
  $('#done-count').textContent = days === 1
    ? 'Your first day of noticing the invisible good.'
    : `That's ${days} days of noticing the invisible good.`;
  $('#done-panel').hidden = false;
  renderResurface();
  renderBanners();
  const target = $('#resurface').hidden ? $('#done-panel') : $('#resurface');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- Resurfacing ---------- */

let resurfaceSeen = new Set();

function pastMoments() {
  const out = [];
  for (const key of Object.keys(state.entries)) {
    if (key >= todayKey() || key === editingKey) continue;
    state.entries[key].items.forEach((item, i) => {
      if (item.text.trim()) out.push({ key, i, item });
    });
  }
  return out;
}

function onThisDay(moments) {
  const t = parseKey(todayKey());
  const targets = [
    [new Date(t.getFullYear() - 1, t.getMonth(), t.getDate()), 'One year ago today'],
    [new Date(t.getFullYear(), t.getMonth() - 1, t.getDate()), 'One month ago today'],
    [new Date(t.getFullYear(), t.getMonth(), t.getDate() - 7), 'One week ago today']
  ];
  for (const [d, label] of targets) {
    const k = dateKey(d);
    const hits = moments.filter(m => m.key === k && !resurfaceSeen.has(`${m.key}:${m.i}`));
    if (hits.length) return { ...hits[Math.floor(Math.random() * hits.length)], label };
  }
  return null;
}

function pickMoment() {
  const moments = pastMoments();
  if (!moments.length) return null;
  const special = onThisDay(moments);
  if (special) return special;
  let pool = moments.filter(m => !resurfaceSeen.has(`${m.key}:${m.i}`));
  if (!pool.length) {
    resurfaceSeen = new Set();
    pool = moments;
  }
  const m = pool[Math.floor(Math.random() * pool.length)];
  const ago = daysBetween(m.key, todayKey());
  const label = ago === 1 ? 'Yesterday' : ago < 14 ? `${ago} days ago` : formatWithYear(m.key);
  return { ...m, label };
}

function renderResurface() {
  const box = $('#resurface');
  const m = pickMoment();
  if (!m) { box.hidden = true; return; }
  resurfaceSeen.add(`${m.key}:${m.i}`);
  $('#resurface-when').textContent = `${m.label}: ${m.item.prompt}`;
  $('#resurface-text').textContent = m.item.text;
  const r = $('#resurface-reflection');
  r.textContent = (m.item.reflection || '').trim();
  r.hidden = !r.textContent;
  box.hidden = false;
}

/* ---------- Banners ---------- */

function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

function renderBanners() {
  const s = state.settings;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  $('#install-banner').hidden = !(isIOS && !isStandalone() && !s.installDismissed);

  const doneCount = Object.values(state.entries).filter(e => e.done && isComplete(e)).length;
  const last = s.lastBackup ? daysBetween(dateKey(new Date(s.lastBackup)), todayKey()) : Infinity;
  $('#backup-banner').hidden = !(doneCount >= 7 && last >= 30);
}

/* ---------- Past view ---------- */

function renderPast() {
  const query = $('#search').value.trim().toLowerCase();
  const list = $('#past-list');
  list.replaceChildren();
  const keys = sortedKeys();
  const doneCount = keys.filter(k => state.entries[k].done && isComplete(state.entries[k])).length;
  $('#past-count').textContent = doneCount === 1 ? '1 day' : `${doneCount} days`;

  let month = '';
  let shown = 0;
  for (const key of keys) {
    const entry = state.entries[key];
    if (query) {
      const hay = entry.items.map(i => `${i.prompt} ${i.text} ${i.reflection || ''}`).join(' ').toLowerCase();
      if (!hay.includes(query)) continue;
    }
    const m = parseKey(key).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (m !== month) {
      month = m;
      list.appendChild(el('h2', { class: 'month' }, m));
    }
    list.appendChild(renderEntryCard(entry, query));
    shown++;
  }
  const empty = $('#past-empty');
  empty.hidden = shown > 0;
  empty.textContent = query ? 'No entries match that search.' : 'Nothing here yet. Your first entry will show up here.';
}

function appendHighlighted(parent, text, query) {
  if (!query) { parent.append(text); return; }
  const lower = text.toLowerCase();
  let pos = 0;
  let idx;
  while ((idx = lower.indexOf(query, pos)) !== -1) {
    parent.append(text.slice(pos, idx));
    parent.appendChild(el('mark', {}, text.slice(idx, idx + query.length)));
    pos = idx + query.length;
  }
  parent.append(text.slice(pos));
}

function renderEntryCard(entry, query) {
  const card = el('article', { class: 'entry' });
  const head = el('div', { class: 'entry-head' });
  const date = el('span', { class: 'entry-date' }, formatWithYear(entry.date));
  if (!entry.done || !isComplete(entry)) date.appendChild(el('span', { class: 'entry-draft' }, ' · draft'));
  head.appendChild(date);
  const edit = el('button', { type: 'button', class: 'link' }, 'Edit');
  edit.addEventListener('click', () => {
    editingKey = entry.date;
    showTab('today');
  });
  head.appendChild(edit);
  card.appendChild(head);

  const ol = el('ol');
  for (const item of entry.items) {
    if (!item.text.trim()) continue;
    const li = el('li');
    li.appendChild(el('span', { class: 'entry-q' }, item.prompt));
    const a = el('span', { class: 'entry-a' });
    appendHighlighted(a, item.text, query);
    li.appendChild(a);
    if ((item.reflection || '').trim()) {
      const r = el('span', { class: 'entry-r' });
      appendHighlighted(r, item.reflection, query);
      li.appendChild(r);
    }
    ol.appendChild(li);
  }
  card.appendChild(ol);
  return card;
}

/* ---------- Settings: reminder ---------- */

// The reminder is a daily repeating Calendar event built on the phone at the
// moment you tap the button, so it starts from the next occurrence of the
// chosen time. It carries the phone's time zone and that zone's daylight
// saving rules, so 9pm stays 9pm all year.

const pad2 = n => String(n).padStart(2, '0');
const icsLocal = d => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
const icsUTCFields = d => `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00`;
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function icsEscape(str) {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Minutes east of UTC at a given instant, in the phone's own time zone.
function utcOffset(date) {
  return -date.getTimezoneOffset();
}

function formatOffset(mins) {
  const sign = mins < 0 ? '-' : '+';
  const a = Math.abs(mins);
  return `${sign}${pad2(Math.floor(a / 60))}${pad2(a % 60)}`;
}

// Find the instants in `year` where the UTC offset changes (DST starts/ends).
function offsetTransitions(year) {
  const out = [];
  let prev = new Date(year, 0, 1);
  for (let day = 1; day <= 366; day++) {
    const next = new Date(year, 0, 1 + day);
    if (utcOffset(prev) !== utcOffset(next)) {
      let lo = prev.getTime();
      let hi = next.getTime();
      while (hi - lo > 60000) {
        const mid = Math.floor((lo + hi) / 2 / 60000) * 60000;
        if (utcOffset(new Date(mid)) === utcOffset(prev)) lo = mid; else hi = mid;
      }
      out.push({ at: new Date(hi), from: utcOffset(prev), to: utcOffset(next) });
    }
    prev = next;
    if (next.getFullYear() > year) break;
  }
  return out;
}

function buildVTimezone(tzid, year) {
  const lines = ['BEGIN:VTIMEZONE', `TZID:${tzid}`];
  const transitions = offsetTransitions(year);
  if (transitions.length !== 2) {
    // No daylight saving (or rules too irregular to express): one fixed offset.
    const off = formatOffset(utcOffset(new Date(year, 6, 1)));
    lines.push('BEGIN:STANDARD', 'DTSTART:19700101T000000', `TZOFFSETFROM:${off}`, `TZOFFSETTO:${off}`, 'END:STANDARD');
  } else {
    for (const t of transitions) {
      // Wall-clock time of the change, expressed in the offset before it.
      const wall = new Date(t.at.getTime() + t.from * 60000);
      const month = wall.getUTCMonth() + 1;
      const date = wall.getUTCDate();
      const daysInMonth = new Date(Date.UTC(wall.getUTCFullYear(), month, 0)).getUTCDate();
      const nth = date + 7 > daysInMonth ? -1 : Math.ceil(date / 7);
      const kind = t.to > t.from ? 'DAYLIGHT' : 'STANDARD';
      lines.push(
        `BEGIN:${kind}`,
        `DTSTART:${icsUTCFields(wall)}`,
        `TZOFFSETFROM:${formatOffset(t.from)}`,
        `TZOFFSETTO:${formatOffset(t.to)}`,
        `RRULE:FREQ=YEARLY;BYMONTH=${month};BYDAY=${nth}${WEEKDAYS[wall.getUTCDay()]}`,
        `END:${kind}`
      );
    }
  }
  lines.push('END:VTIMEZONE');
  return lines;
}

function buildReminderICS(time, now = new Date()) {
  const [hh, mm] = time.split(':').map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
  if (start <= now) start.setDate(start.getDate() + 1);

  let tzid = '';
  try { tzid = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* floating time */ }

  const question = 'What went right today that you didn\'t expect?';
  const stamp = icsUTCFields(now).replace(/00$/, pad2(now.getUTCSeconds())) + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invisible Good//Gratitude Journal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...(tzid ? buildVTimezone(tzid, start.getFullYear()) : []),
    'BEGIN:VEVENT',
    `UID:invisible-good-${now.getTime()}@invisible-good`,
    `DTSTAMP:${stamp}`,
    tzid ? `DTSTART;TZID=${tzid}:${icsLocal(start)}` : `DTSTART:${icsLocal(start)}`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Catch the invisible good',
    `DESCRIPTION:${icsEscape(`${question}\n\nOpen Good from your Home Screen.`)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(question)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].join('\r\n');
}

function renderReminderOptions() {
  const select = $('#reminder-time');
  if (select.options.length) return;
  for (let m = 5 * 60; m < 24 * 60; m += 30) {
    const value = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const label = new Date(2000, 0, 1, Math.floor(m / 60), m % 60)
      .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    select.appendChild(el('option', { value }, label));
  }
}

function saveReminderTime() {
  state.settings.reminderTime = $('#reminder-time').value;
  persistSoon();
}

// Hand the file to the share sheet: Save to Files, then open it from the
// Files app to add it to Calendar. (Linking to the file directly does nothing
// in a home-screen app.) Built at tap time so it starts from the next occurrence.
async function shareReminder() {
  saveReminderTime();
  const time = $('#reminder-time').value;
  const blob = new Blob([buildReminderICS(time)], { type: 'text/calendar' });
  await shareOrDownload(blob, 'invisible-good-reminder.ics');
}

/* ---------- Settings: backup ---------- */

async function shareOrDownload(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      // Fall back to a download if sharing fails for another reason.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}

function renderSettings() {
  const s = state.settings;
  renderReminderOptions();
  $('#reminder-time').value = s.reminderTime || '21:00';
  $('#last-backup').textContent = s.lastBackup
    ? `Last backup: ${new Date(s.lastBackup).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : 'No backup yet.';
}

async function exportBackup() {
  persist();
  const data = JSON.stringify({ app: 'invisible-good', exportedAt: new Date().toISOString(), ...state }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const ok = await shareOrDownload(blob, `invisible-good-backup-${todayKey()}.json`);
  if (ok) {
    state.settings.lastBackup = new Date().toISOString();
    persist();
    renderSettings();
    renderBanners();
    toast('Backup exported.');
  }
}

function mergeBackup(incoming) {
  let added = 0;
  let updated = 0;
  for (const [key, entry] of Object.entries(incoming.entries)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !entry || !Array.isArray(entry.items)) continue;
    const clean = {
      date: key,
      items: entry.items.slice(0, SLOTS.length).map((it, i) => (it = it || {}, {
        kind: String(it.kind || SLOTS[i].kind),
        prompt: String(it.prompt || ''),
        text: String(it.text || ''),
        reflection: String(it.reflection || '')
      })),
      done: Boolean(entry.done),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };
    while (clean.items.length < SLOTS.length) clean.items.push(blankEntry(key).items[clean.items.length]);
    const existing = state.entries[key];
    if (!existing) { state.entries[key] = clean; added++; }
    else if ((clean.updatedAt || '') > (existing.updatedAt || '')) { state.entries[key] = clean; updated++; }
  }
  return { added, updated };
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!isValidState(data)) throw new Error('not a backup');
    const { added, updated } = mergeBackup(data);
    persist();
    renderAll();
    toast(`Restored: ${added} new, ${updated} updated.`);
  } catch (e) {
    toast('That file isn\'t an Invisible Good backup.');
  }
}

function wipeAll() {
  if (!confirm('Delete every entry on this device? This can\'t be undone.')) return;
  state = { ...emptyState(), settings: state.settings };
  persist();
  editingKey = todayKey();
  renderAll();
  toast('All entries deleted.');
}

/* ---------- Navigation ---------- */

function showTab(name) {
  document.querySelectorAll('.view').forEach(v => { v.hidden = v.dataset.view !== name; });
  document.querySelectorAll('.tabbar button').forEach(b => {
    if (b.dataset.tab === name) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  if (name === 'today') renderToday();
  if (name === 'past') renderPast();
  if (name === 'settings') renderSettings();
  window.scrollTo(0, 0);
}

function renderAll() {
  const current = document.querySelector('.view:not([hidden])');
  showTab(current ? current.dataset.view : 'today');
}

/* ---------- Wiring ---------- */

document.querySelectorAll('.tabbar button').forEach(b => {
  b.addEventListener('click', () => {
    if (b.dataset.tab === 'today' && document.querySelector('[data-view="today"]').hidden) editingKey = todayKey();
    showTab(b.dataset.tab);
  });
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action], [data-dismiss]');
  if (!btn) return;
  switch (btn.dataset.action) {
    case 'export': exportBackup(); break;
    case 'import': $('#import-file').click(); break;
    case 'wipe': wipeAll(); break;
    case 'share-reminder': shareReminder(); break;
    case 'resurface-next': renderResurface(); break;
    case 'back-to-today': editingKey = todayKey(); renderToday(); break;
  }
  if (btn.dataset.dismiss === 'install') {
    state.settings.installDismissed = true;
    persist();
    renderBanners();
  }
});

$('#done-btn').addEventListener('click', completeEntry);
$('#search').addEventListener('input', renderPast);
$('#reminder-time').addEventListener('change', saveReminderTime);
$('#import-file').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (f) importBackup(f);
  e.target.value = '';
});

// Save immediately when the app is backgrounded or closed.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveTimer) persist();
  // Roll over to the new day if the app was left open overnight.
  if (document.visibilityState === 'visible' && editingKey < todayKey() && !$('[data-view="today"]').hidden && $('#editing-banner').hidden) {
    editingKey = todayKey();
    renderToday();
  }
});
window.addEventListener('pagehide', () => { if (saveTimer) persist(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // When an update takes over, reload once so the new code runs straight
  // away instead of on the next launch. Not on first install.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    if (saveTimer) persist();
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        // Home-screen apps can stay alive in the background for days; check
        // for an update each time the app comes back to the foreground.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  });
}

renderToday();
