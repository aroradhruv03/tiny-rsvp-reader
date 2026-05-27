const STORAGE_KEY = "tiny-rsvp-reader-settings-v1";

const DEFAULT_TEXT = "Paste text or open a .txt file to start reading. Tiny RSVP keeps reading text only in memory.";

const state = {
  tokens: [],
  index: 0,
  playing: false,
  timer: null,
  wakeLock: null,
  textLoaded: false,
  settings: {
    wpm: 300,
    fontSize: 84,
    theme: "black",
    fontFamily: "mono",
    fontWeight: 500,
    focusLetter: true,
    reduceMotion: false,
    keepAwake: false,
    commaPause: 150,
    sentencePause: 350,
    linePause: 450,
    paragraphPause: 900,
    stopSentence: false,
    stopLine: false,
    stopParagraph: false,
    chunkSize: 1,
    longWordPause: true,
    longWordPercent: 5,
    longWordThreshold: 10,
    fadeEnabled: true,
    fadeDuration: 90
  }
};

const els = {
  prefix: document.getElementById("prefix"),
  focusLetter: document.getElementById("focusLetter"),
  suffix: document.getElementById("suffix"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  restartBtn: document.getElementById("restartBtn"),
  backBtn: document.getElementById("backBtn"),
  forwardBtn: document.getElementById("forwardBtn"),
  progressRange: document.getElementById("progressRange"),
  positionLabel: document.getElementById("positionLabel"),
  timeLabel: document.getElementById("timeLabel"),
  wpmSlider: document.getElementById("wpmSlider"),
  wpmValue: document.getElementById("wpmValue"),
  fontSlider: document.getElementById("fontSlider"),
  fontValue: document.getElementById("fontValue"),
  editorToggle: document.getElementById("editorToggle"),
  settingsToggle: document.getElementById("settingsToggle"),
  panelScrim: document.getElementById("panelScrim"),
  editorPanel: document.getElementById("editorPanel"),
  settingsPanel: document.getElementById("settingsPanel"),
  textInput: document.getElementById("textInput"),
  fileInput: document.getElementById("fileInput"),
  loadTextBtn: document.getElementById("loadTextBtn"),
  clearTextBtn: document.getElementById("clearTextBtn"),
  themeRadios: document.querySelectorAll('input[name="theme"]'),
  fontFamilySelect: document.getElementById("fontFamilySelect"),
  fontWeightSlider: document.getElementById("fontWeightSlider"),
  fontWeightValue: document.getElementById("fontWeightValue"),
  focusToggle: document.getElementById("focusToggle"),
  motionToggle: document.getElementById("motionToggle"),
  wakeToggle: document.getElementById("wakeToggle"),
  commaPause: document.getElementById("commaPause"),
  commaPauseValue: document.getElementById("commaPauseValue"),
  sentencePause: document.getElementById("sentencePause"),
  sentencePauseValue: document.getElementById("sentencePauseValue"),
  linePause: document.getElementById("linePause"),
  linePauseValue: document.getElementById("linePauseValue"),
  paragraphPause: document.getElementById("paragraphPause"),
  paragraphPauseValue: document.getElementById("paragraphPauseValue"),
  longWordPercent: document.getElementById("longWordPercent"),
  longWordPercentValue: document.getElementById("longWordPercentValue"),
  longWordThreshold: document.getElementById("longWordThreshold"),
  longWordThresholdValue: document.getElementById("longWordThresholdValue"),
  stopSentenceToggle: document.getElementById("stopSentenceToggle"),
  stopLineToggle: document.getElementById("stopLineToggle"),
  stopParagraphToggle: document.getElementById("stopParagraphToggle"),
  chunkSlider: document.getElementById("chunkSlider"),
  chunkValue: document.getElementById("chunkValue"),
  fadeDuration: document.getElementById("fadeDuration"),
  fadeDurationValue: document.getElementById("fadeDurationValue"),
  fadeToggle: document.getElementById("fadeToggle"),
  longWordToggle: document.getElementById("longWordToggle")
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (saved.darkMode !== undefined && saved.theme === undefined) {
      saved.theme = saved.darkMode ? "black" : "light";
      delete saved.darkMode;
    }
    state.settings = { ...state.settings, ...saved };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
}

function tokenize(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const matches = normalized.match(/\S+/g) || [];
  let cursor = 0;

  return matches.map((word) => {
    const start = normalized.indexOf(word, cursor);
    const between = normalized.slice(cursor, start);
    cursor = start + word.length;
    return {
      text: word,
      before: between,
      sentenceEnd: /[.!?]["')\]]*$/.test(word),
      commaEnd: /[,;:]["')\]]*$/.test(word),
      lineBreak: between.includes("\n"),
      paragraphBreak: /\n\s*\n/.test(between)
    };
  });
}

function focusIndexFor(word) {
  const cleanLength = [...word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")].length || word.length;
  if (cleanLength <= 1) return 0;
  if (cleanLength <= 5) return 1;
  if (cleanLength <= 9) return 2;
  return 3;
}

function currentWords() {
  return state.tokens.slice(state.index, state.index + state.settings.chunkSize);
}

function renderWord() {
  const items = currentWords();
  const word = items.map((item) => item.text).join(" ") || (state.textLoaded ? "" : "Ready");
  const letters = [...word];
  const focusIndex = Math.min(focusIndexFor(word), Math.max(letters.length - 1, 0));

  els.prefix.textContent = letters.slice(0, focusIndex).join("");
  els.focusLetter.textContent = letters[focusIndex] || "";
  els.suffix.textContent = letters.slice(focusIndex + 1).join("");
  restartFade();

  document.body.classList.toggle("no-focus", !state.settings.focusLetter);
  els.progressRange.max = Math.max(state.tokens.length - 1, 0);
  els.progressRange.value = state.index;
  els.positionLabel.textContent = `${Math.min(state.index + 1, state.tokens.length)} / ${state.tokens.length}`;
  els.timeLabel.textContent = estimateRemaining();
  updateControls();
}

function estimateRemaining() {
  if (!state.tokens.length) return "0:00";
  const remainingWords = Math.max(state.tokens.length - state.index, 0);
  const seconds = Math.round((remainingWords / state.settings.wpm) * 60);
  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function currentDelay() {
  const base = 60000 / state.settings.wpm;
  const items = currentWords();
  const last = items[items.length - 1];
  if (!last) return base;

  let delay = base;
  const extraLetters = Math.max(0, last.text.length - state.settings.longWordThreshold);
  if (state.settings.longWordPause && extraLetters > 0) {
    delay += base * (state.settings.longWordPercent / 100) * extraLetters;
  }
  if (last.commaEnd) delay += state.settings.commaPause;
  if (last.sentenceEnd) delay += state.settings.sentencePause;
  if (last.lineBreak) delay += state.settings.linePause;
  if (last.paragraphBreak) delay += state.settings.paragraphPause;
  return delay;
}

function shouldStopAfterCurrent() {
  const items = currentWords();
  const last = items[items.length - 1];
  if (!last) return false;
  return (state.settings.stopSentence && last.sentenceEnd) ||
    (state.settings.stopLine && last.lineBreak) ||
    (state.settings.stopParagraph && last.paragraphBreak);
}

function advance() {
  if (!state.playing) return;
  if (state.index >= state.tokens.length - 1) {
    pause();
    return;
  }
  if (shouldStopAfterCurrent()) {
    pause();
    return;
  }

  state.index = Math.min(state.index + state.settings.chunkSize, state.tokens.length - 1);
  renderWord();
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(state.timer);
  state.timer = setTimeout(advance, currentDelay());
}

async function play() {
  if (!state.tokens.length) {
    loadText(DEFAULT_TEXT);
  }
  state.playing = true;
  els.playPauseBtn.innerHTML = '<span aria-hidden="true">Ⅱ</span><span>Pause</span>';
  await requestWakeLock();
  scheduleNext();
}

function pause() {
  state.playing = false;
  clearTimeout(state.timer);
  els.playPauseBtn.innerHTML = '<span aria-hidden="true">▶</span><span>Play</span>';
  releaseWakeLock();
}

function restart() {
  state.index = 0;
  renderWord();
  if (state.playing) scheduleNext();
}

function jump(amount) {
  state.index = Math.max(0, Math.min(state.index + amount, Math.max(state.tokens.length - 1, 0)));
  renderWord();
  if (state.playing) scheduleNext();
}

function loadText(text) {
  pause();
  state.tokens = tokenize(text.trim());
  state.index = 0;
  state.textLoaded = state.tokens.length > 0;
  renderWord();
}

function restartFade() {
  const duration = state.settings.fadeEnabled && !state.settings.reduceMotion ? state.settings.fadeDuration : 0;
  document.documentElement.style.setProperty("--fade-duration", `${duration}ms`);
  const wrap = els.prefix.parentElement;
  wrap.classList.remove("word-fade");
  if (!duration) return;
  requestAnimationFrame(() => wrap.classList.add("word-fade"));
}

function updateControls() {
  const hasWords = state.tokens.length > 0;
  els.backBtn.disabled = !hasWords || state.index === 0;
  els.forwardBtn.disabled = !hasWords || state.index >= state.tokens.length - 1;
  els.restartBtn.disabled = !hasWords || state.index === 0;
  els.playPauseBtn.disabled = !hasWords && !els.textInput.value.trim();
}

function applySettingsToUi() {
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.style.setProperty("--font-size", `${state.settings.fontSize}px`);
  document.documentElement.style.setProperty("--font-weight", state.settings.fontWeight);
  document.documentElement.style.setProperty("--fade-duration", `${state.settings.fadeDuration}ms`);
  document.body.dataset.font = state.settings.fontFamily;
  document.body.classList.toggle("no-focus", !state.settings.focusLetter);
  document.body.classList.toggle("reduced-motion", state.settings.reduceMotion);

  els.wpmSlider.value = state.settings.wpm;
  els.wpmValue.textContent = `${state.settings.wpm} WPM`;
  els.fontSlider.value = state.settings.fontSize;
  els.fontValue.textContent = `${state.settings.fontSize} px`;
  els.themeRadios.forEach((radio) => {
    radio.checked = radio.value === state.settings.theme;
  });
  els.fontFamilySelect.value = state.settings.fontFamily;
  els.fontWeightSlider.value = state.settings.fontWeight;
  els.fontWeightValue.textContent = String(state.settings.fontWeight);
  els.focusToggle.checked = state.settings.focusLetter;
  els.motionToggle.checked = state.settings.reduceMotion;
  els.wakeToggle.checked = state.settings.keepAwake;
  syncPauseControl("commaPause", "commaPauseValue");
  syncPauseControl("sentencePause", "sentencePauseValue");
  syncPauseControl("linePause", "linePauseValue");
  syncPauseControl("paragraphPause", "paragraphPauseValue");
  els.longWordPercent.value = state.settings.longWordPercent;
  els.longWordPercentValue.textContent = `${state.settings.longWordPercent}%`;
  els.longWordThreshold.value = state.settings.longWordThreshold;
  els.longWordThresholdValue.textContent = String(state.settings.longWordThreshold);
  els.stopSentenceToggle.checked = state.settings.stopSentence;
  els.stopLineToggle.checked = state.settings.stopLine;
  els.stopParagraphToggle.checked = state.settings.stopParagraph;
  els.chunkSlider.value = state.settings.chunkSize;
  els.chunkValue.textContent = String(state.settings.chunkSize);
  els.fadeDuration.value = state.settings.fadeDuration;
  els.fadeDurationValue.textContent = `${state.settings.fadeDuration} ms`;
  els.fadeToggle.checked = state.settings.fadeEnabled;
  els.longWordToggle.checked = state.settings.longWordPause;
}

function syncPauseControl(inputId, outputId) {
  els[inputId].value = state.settings[inputId];
  els[outputId].textContent = `${state.settings[inputId]} ms`;
}

function settingFromRange(input, key, output, suffix) {
  input.addEventListener("input", () => {
    state.settings[key] = Number(input.value);
    output.textContent = `${input.value}${suffix}`;
    if (key === "fontSize") {
      document.documentElement.style.setProperty("--font-size", `${input.value}px`);
    } else if (key === "fontWeight") {
      document.documentElement.style.setProperty("--font-weight", input.value);
    } else if (key === "fadeDuration") {
      document.documentElement.style.setProperty("--fade-duration", `${input.value}ms`);
    }
    saveSettings();
    renderWord();
    if (state.playing) scheduleNext();
  });
}

function settingFromToggle(input, key, callback) {
  input.addEventListener("change", () => {
    state.settings[key] = input.checked;
    callback?.();
    saveSettings();
    renderWord();
  });
}

async function requestWakeLock() {
  if (!state.settings.keepAwake || !("wakeLock" in navigator)) return;
  try {
    state.wakeLock = await navigator.wakeLock.request("screen");
  } catch {
    state.wakeLock = null;
  }
}

function releaseWakeLock() {
  if (state.wakeLock) {
    state.wakeLock.release();
    state.wakeLock = null;
  }
}

function openPanel(panel) {
  closePanels();
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  els.panelScrim.hidden = true;
}

function closePanels() {
  [els.editorPanel, els.settingsPanel].forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  els.panelScrim.hidden = true;
}

function bindEvents() {
  els.playPauseBtn.addEventListener("click", () => state.playing ? pause() : play());
  els.restartBtn.addEventListener("click", restart);
  els.backBtn.addEventListener("click", () => jump(-10));
  els.forwardBtn.addEventListener("click", () => jump(10));
  els.progressRange.addEventListener("input", () => {
    state.index = Number(els.progressRange.value);
    renderWord();
    if (state.playing) scheduleNext();
  });

  els.editorToggle.addEventListener("click", () => openPanel(els.editorPanel));
  els.settingsToggle.addEventListener("click", () => openPanel(els.settingsPanel));
  document.querySelectorAll("[data-close-panel]").forEach((button) => {
    button.addEventListener("click", closePanels);
  });
  els.loadTextBtn.addEventListener("click", () => {
    loadText(els.textInput.value);
    closePanels();
  });
  els.clearTextBtn.addEventListener("click", () => {
    pause();
    els.textInput.value = "";
    state.tokens = [];
    state.index = 0;
    state.textLoaded = false;
    renderWord();
  });

  els.fileInput.addEventListener("change", () => {
    const file = els.fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      els.textInput.value = String(reader.result || "");
      loadText(els.textInput.value);
      closePanels();
    };
    reader.readAsText(file);
  });

  settingFromRange(els.wpmSlider, "wpm", els.wpmValue, " WPM");
  settingFromRange(els.fontSlider, "fontSize", els.fontValue, " px");
  settingFromRange(els.fontWeightSlider, "fontWeight", els.fontWeightValue, "");
  settingFromRange(els.commaPause, "commaPause", els.commaPauseValue, " ms");
  settingFromRange(els.sentencePause, "sentencePause", els.sentencePauseValue, " ms");
  settingFromRange(els.linePause, "linePause", els.linePauseValue, " ms");
  settingFromRange(els.paragraphPause, "paragraphPause", els.paragraphPauseValue, " ms");
  settingFromRange(els.longWordPercent, "longWordPercent", els.longWordPercentValue, "%");
  settingFromRange(els.longWordThreshold, "longWordThreshold", els.longWordThresholdValue, "");
  settingFromRange(els.chunkSlider, "chunkSize", els.chunkValue, "");
  settingFromRange(els.fadeDuration, "fadeDuration", els.fadeDurationValue, " ms");

  els.themeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      state.settings.theme = radio.value;
      document.documentElement.dataset.theme = state.settings.theme;
      saveSettings();
    });
  });
  els.fontFamilySelect.addEventListener("change", () => {
    state.settings.fontFamily = els.fontFamilySelect.value;
    document.body.dataset.font = state.settings.fontFamily;
    saveSettings();
  });
  settingFromToggle(els.focusToggle, "focusLetter");
  settingFromToggle(els.motionToggle, "reduceMotion");
  settingFromToggle(els.wakeToggle, "keepAwake");
  settingFromToggle(els.stopSentenceToggle, "stopSentence");
  settingFromToggle(els.stopLineToggle, "stopLine");
  settingFromToggle(els.stopParagraphToggle, "stopParagraph");
  settingFromToggle(els.fadeToggle, "fadeEnabled");
  settingFromToggle(els.longWordToggle, "longWordPause");

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
    if (isTyping) return;

    if (event.code === "Space") {
      event.preventDefault();
      state.playing ? pause() : play();
    } else if (event.key === "ArrowLeft") {
      jump(-10);
    } else if (event.key === "ArrowRight") {
      jump(10);
    } else if (event.key.toLowerCase() === "r") {
      restart();
    } else if (event.key === "Escape") {
      closePanels();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.playing) {
      requestWakeLock();
    }
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

loadSettings();
applySettingsToUi();
bindEvents();
loadText(DEFAULT_TEXT);
state.textLoaded = false;
renderWord();
registerServiceWorker();
