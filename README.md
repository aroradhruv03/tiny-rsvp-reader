# Tiny RSVP Reader

Tiny RSVP Reader is a privacy-first Progressive Web App for speed reading pasted text and local `.txt` files. It uses plain HTML, CSS, and JavaScript only.

## What This App Is

This is a static website. There is no server app, account, login, database, analytics, or cloud sync.

For normal use on an iPhone or iPad, you put these files on a website host such as GitHub Pages. That hosted website URL is the "deployed app." After you open that URL once in Safari, Safari can install it to your home screen like an app.

## Privacy

- Reading text is processed fully in your browser.
- `.txt` files are loaded with the browser `FileReader` API.
- Files and pasted text are not uploaded.
- There is no backend, analytics, tracking, external API, CDN, or third-party script.
- Reading text is not stored in `localStorage`, IndexedDB, cookies, or the service worker cache.
- Only reader settings are saved in `localStorage`.
- After first load, the service worker caches only app files so the app can run offline.

## Features

- RSVP one-word-at-a-time reader.
- Paste text into a textarea.
- Open local `.txt` files.
- Start, pause, restart, back 10 words, and forward 10 words.
- WPM from 100 to 1000.
- Font size, font weight, and typeface choices.
- Black, dark grey, and light themes.
- Optional focus-letter highlighting.
- Configurable comma, sentence, new-line, and paragraph pauses.
- Optional hard stops after sentences, new lines, or paragraphs. Press play or space to continue.
- Optional long-word slowdown with percentage-per-extra-letter control.
- 1 to 5 simultaneous words.
- Optional word fade with configurable duration.
- Mobile-first controls sized for iPhone and iPad Safari.

## Try It On Your Mac First

From Terminal:

```sh
cd /Users/dhruv/tiny-rsvp-reader
python3 -m http.server 8000
```

Then open this URL in Safari on the Mac:

```text
http://localhost:8000
```

You can test the reader, paste text, upload a `.txt` file, and adjust settings.

Important: opening `index.html` directly from Finder also shows the page, but full PWA/offline behavior requires a website URL. That means `http://localhost:8000` for local testing, or an HTTPS URL such as GitHub Pages for iPhone install.

## Deploy To GitHub Pages

GitHub Pages is a free way to put these static files online. It gives you an HTTPS website URL. iPhone Safari needs that HTTPS URL before it can install the app reliably.

### 1. Create The GitHub Repository

1. Go to `https://github.com`.
2. Sign in or create a GitHub account.
3. Click the `+` button in the top right.
4. Click `New repository`.
5. Repository name: `tiny-rsvp-reader`.
6. Choose `Public` unless you know you need private.
7. Do not worry about adding a README on GitHub because this folder already has one.
8. Click `Create repository`.

### 2. Upload The Files From Your Mac

In Terminal:

```sh
cd /Users/dhruv/tiny-rsvp-reader
git init
git add .
git commit -m "Initial Tiny RSVP Reader PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tiny-rsvp-reader.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

If Git asks you to sign in, follow GitHub's instructions. GitHub may ask for a browser login or a personal access token depending on your setup.

### 3. Turn On GitHub Pages

1. Open your repository on GitHub.
2. Click `Settings`.
3. In the left sidebar, click `Pages`.
4. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
5. Under `Branch`, choose `main`.
6. For the folder, choose `/root`.
7. Click `Save`.
8. Wait 1 to 3 minutes.
9. GitHub will show a site URL. It usually looks like:

```text
https://YOUR_USERNAME.github.io/tiny-rsvp-reader/
```

That URL is your deployed app.

## Install On iPhone Or iPad

Use Safari. Chrome or the Google app on iPhone will not install this PWA the same way.

1. On your iPhone or iPad, open Safari.
2. Type or paste your GitHub Pages URL:

```text
https://YOUR_USERNAME.github.io/tiny-rsvp-reader/
```

3. Wait until the app fully loads.
4. Tap the Share button in Safari. It is the square icon with an upward arrow.
5. Scroll the share sheet if needed.
6. Tap `Add to Home Screen`.
7. Confirm the name. You can keep `Tiny RSVP`.
8. Tap `Add`.
9. Go to your home screen.
10. Tap the new `Tiny RSVP` icon.
11. While still online, let it open once completely.
12. After that first successful load, it should work offline.

## Confirm Offline Works

1. Open the home-screen `Tiny RSVP` app once while online.
2. Close it.
3. Turn on Airplane Mode.
4. Open `Tiny RSVP` from the home screen again.
5. The app shell should still open.
6. Paste text or open a local `.txt` file and read normally.

Your pasted reading text is still not saved. If you close or refresh the app, paste or open the text again.

## Update The App Later

After editing files:

```sh
cd /Users/dhruv/tiny-rsvp-reader
git add .
git commit -m "Update Tiny RSVP Reader"
git push
```

GitHub Pages will redeploy automatically. If your iPhone keeps showing the old version, close the app, reopen it while online, and refresh the Safari page once.

## Troubleshooting

- If `Add to Home Screen` is missing, make sure you are using Safari on iPhone or iPad.
- If offline mode does not work, open the GitHub Pages URL once while online and wait for it to finish loading.
- If the app opens in a browser tab instead of app mode, delete the home-screen icon and add it again from Safari.
- If text disappears after closing the app, that is expected. Reading text is intentionally not saved for privacy.
- If GitHub Pages shows 404 right after setup, wait a few minutes and reload.
