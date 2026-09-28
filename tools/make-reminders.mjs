// Generates reminders/HHMM.ics: one daily repeating Calendar event with an
// alert, for every half hour from 05:00 to 23:30. Times are "floating", so
// they follow whatever time zone the phone is in.
//
// Run from the repo root: node tools/make-reminders.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const pad = n => String(n).padStart(2, '0');
const question = "What went right today that you didn't expect?";
const esc = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

mkdirSync('reminders', { recursive: true });
for (let m = 5 * 60; m < 24 * 60; m += 30) {
  const hhmm = `${pad(Math.floor(m / 60))}${pad(m % 60)}`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invisible Good//Gratitude Journal//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:invisible-good-daily-${hhmm}@invisible-good`,
    'DTSTAMP:20260101T000000Z',
    `DTSTART:20260101T${hhmm}00`,
    'DURATION:PT5M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Catch the invisible good',
    `DESCRIPTION:${esc(`${question}\n\nOpen Good from your Home Screen.`)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(question)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].join('\r\n');
  writeFileSync(`reminders/${hhmm}.ics`, ics);
}
