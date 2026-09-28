# Invisible Good

A tiny gratitude journal for iPhone that installs from Safari to your Home Screen. No App Store, no subscription, no account.

> Gratitude isn't about the big stuff you already know you're grateful for.
> It's about catching the invisible good that's hiding in plain sight.

## How it works

Every day you answer three questions:

1. **Unexpected:** *What went right today that you didn't expect?*
2. **Today's prompt:** a specific question from a rotating deck of about 40 (e.g. *Who made something a little easier for you today?*). You can tap **Different prompt** to swap it.
3. **Contrast:** *What ordinary thing went smoothly today?* It's followed by *Now picture it going wrong. How annoying would that have been?*

If an answer is too big to feel anything, like "my family" or "health", the app nudges you toward something specific: *What did one of them actually do or say today?*

After you save, **From your past** brings back an earlier entry. It prefers one from exactly a week, a month or a year ago. Rereading these is half the value.

## Install on your iPhone

1. Open the app's URL in **Safari**. It has to be Safari, not Chrome.
2. Tap **Share**, then **Add to Home Screen**.
3. Open it from the new **Good** icon. It runs full-screen and works offline.

## Daily reminder

Go to **Settings**, then **Daily reminder**, pick a time and tap **Add daily reminder to Calendar**. This adds a daily Calendar event with an alert. It starts from the next time you picked and carries your time zone, so it stays at the same time through daylight saving changes. To change the time, delete the old event and add a new one. If tapping the button does nothing, use **Save the reminder file instead**, then open the file from the Files app. Home-screen web apps can't reliably schedule their own notifications on iPhone, so Calendar does it instead. The Settings screen also explains how to set up a Shortcuts automation that opens the app every day.

## Your data

- Entries are stored **only on your phone**, in the app's local storage. Nothing is ever uploaded.
- **Settings → Export backup** opens the share sheet. Choose **Save to Files** and pick iCloud Drive. **Restore from backup** merges a backup file back in.
- Once you have a week of entries, the app reminds you to back up if you haven't done so in 30 days.
- If you delete the Home Screen app, its data goes with it. Export first.

## Hosting (GitHub Pages)

The app is plain static files (`index.html`, `app.js`, `styles.css`, `sw.js`) with no build step.

1. Merge this branch into `main`.
2. In the repo, go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
3. After a minute or so it's live at `https://mattemerson66.github.io/Mattemerson66-repository-/`.

GitHub Pages on a **private** repo needs a paid GitHub plan. Otherwise make the repo public: only the app code becomes public, never your entries. The other option is to connect the repo to Netlify or Cloudflare Pages, which are free and work with private repos.

## Development

- Serve locally with `python3 -m http.server` and open `http://localhost:8000`.
- After changing app files, bump `VERSION` in `sw.js` so installed copies pick up the update. They update on the next launch after that.
