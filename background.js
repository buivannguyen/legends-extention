importScripts(
  "config.js",
  "rules.js",
  "background/closed-tabs.js",
  "background/tab-closer.js",
  "background/auto-mute.js",
  "background/auto-close.js",
  "background/grid.js"
);

let rules = RULES;
let bookmarks = [];
let autoCloseMinutes = AUTO_CLOSE_AFTER_MINUTES;
let decoyUrl = DECOY_URL;
const ready = Promise.all([
  getRules().then((r) => (rules = r)),
  chrome.storage.local.get({ bookmarks: [] }).then((s) => (bookmarks = s.bookmarks)),
  chrome.storage.local
    .get({ autoCloseMinutes: AUTO_CLOSE_AFTER_MINUTES })
    .then((s) => (autoCloseMinutes = s.autoCloseMinutes)),
  // Chuỗi rỗng là đã chủ động bỏ trống (không mở tab mồi), khác với chưa đặt (dùng DECOY_URL)
  chrome.storage.local.get({ decoyUrl: DECOY_URL }).then((s) => (decoyUrl = s.decoyUrl))
]);

const isTarget = (url) => findRule(rules, url) !== null;
const closedTabs = createClosedTabs();
const tabCloser = createTabCloser({ isTarget, getDecoyUrl: () => decoyUrl, closedTabs });
const autoMute = createAutoMute({ isTarget, isEnabled: () => AUTO_MUTE });
const autoClose = createAutoClose({
  ready,
  isTarget,
  getMinutes: () => autoCloseMinutes,
  closeAll: () => tabCloser.closeAll()
});
const grid = createGrid({ isTarget });
const clearHistory = (url) => isTarget(url) && chrome.history.deleteUrl({ url });
const sweepHistory = () =>
  chrome.history.search({ text: "", startTime: 0, maxResults: 0 }).then((items) => items.forEach((i) => clearHistory(i.url)));

const seeks = {};

// Tin nhắn từ content script / popup: thêm loại mới chỉ cần thêm một dòng ở đây
const HANDLERS = {
  closeAll: (msg, sender) => tabCloser.closeAll(sender.tab),
  closedCount: () => closedTabs.count(),
  restoreClosed: () => closedTabs.restore(),
  autoCloseStatus: ({ windowId }) => autoClose.check(windowId),
  tileGrid: ({ area }) => grid.tile(area),
  openBookmark: async ({ url, time }) => {
    const tab = await chrome.tabs.create({ url });
    if (time) seeks[tab.id] = time;
  },
  
  videoLoaded: (msg, sender) => {
    const seek = seeks[sender.tab.id];
    delete seeks[sender.tab.id];
    return { seek, saved: bookmarks.some((b) => b.url === sender.tab.url) };
  },
  videoProgress: ({ time }, sender) => {
    const bookmark = bookmarks.find((b) => b.url === sender.tab?.url);
    if (!bookmark || bookmark.time === time) return;
    bookmark.time = time;
    return chrome.storage.local.set({ bookmarks });
  }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = HANDLERS[msg?.type];
  if (!handler) return;
  ready
    .then(() => handler(msg, sender))
    .then(sendResponse, () => sendResponse(null));
  return true; 
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.bookmarks) bookmarks = changes.bookmarks.newValue || [];
  if (changes.decoyUrl) decoyUrl = changes.decoyUrl.newValue ?? DECOY_URL;
  if (changes.autoCloseMinutes) {
    autoCloseMinutes = changes.autoCloseMinutes.newValue ?? AUTO_CLOSE_AFTER_MINUTES;
    autoClose.refresh();
  }
  if (!changes.rules) return;
  rules = changes.rules.newValue || RULES;
  autoMute.refresh();
  sweepHistory();
});

chrome.history.onVisited.addListener(({ url }) => ready.then(() => clearHistory(url)));
chrome.runtime.onStartup.addListener(() => ready.then(sweepHistory));
chrome.runtime.onInstalled.addListener(() => ready.then(sweepHistory));

ready.then(autoMute.refresh);
autoMute.start();
autoClose.start();
