// frontend-ui/src/pages/admin/settings/core/SettingsManager.js

export class SettingsManager {
  static instance = null;
  static STORAGE_KEY = 'aquila_operator_preferences';

  constructor() {
    if (SettingsManager.instance) {
      return SettingsManager.instance;
    }
    this.defaults = {
      alarmSound: true,
      browserPush: true,
      dailyDigest: false,
      theme: 'light',
      textScale: 100,
      highContrast: false,
      reduceMotion: false,
      volumeUnit: 'liters',
      clockFormat: '12h',
      language: 'en',
      emergencyPhone: ''
    };
    this.committed = { ...this.defaults };
    this.draft = { ...this.defaults };
    this.listeners = new Set();
    this.load();
    SettingsManager.instance = this;
  }

  static getInstance() {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  load() {
    try {
      const raw = localStorage.getItem(SettingsManager.STORAGE_KEY);
      this.committed = raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      this.committed = { ...this.defaults };
    }
    this.draft = { ...this.committed };
  }

  get(key, fallback = null) {
    return this.draft[key] ?? fallback ?? this.defaults[key] ?? null;
  }

  setDraft(key, value) {
    this.draft[key] = value;
    this.notify();
  }

  isDirty() {
    return JSON.stringify(this.committed) !== JSON.stringify(this.draft);
  }

  saveDraft() {
    this.committed = { ...this.draft };
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this.committed));
    } catch (e) {
      console.warn('[SettingsManager] Storage write failed:', e);
    }
    this.notify();
  }

  resetDraft() {
    this.draft = { ...this.committed };
    this.notify();
  }

  resetRegional() {
    this.setDraft('volumeUnit', 'liters');
    this.setDraft('clockFormat', '12h');
    this.setDraft('language', 'en');
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({
        committed: this.committed,
        draft: this.draft,
        isDirty: this.isDirty()
      });
    }
  }

  playTestChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
    }
  }
}

export const settingsManager = SettingsManager.getInstance();