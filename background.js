importScripts(
  "config.js",
  "rules.js",
  "background/closed-tabs.js",
  "background/tab-closer.js",
  "background/auto-mute.js"
);

let rules = RULES;
let bookmarks = [];
const ready = Promise.all([
  getRules().then((r) => (rules = r)),
  chrome.storage.local.get({ bookmarks: [] }).then((s) => (bookmarks = s.bookmarks))
]);

const isTarget = (url) => findRule(rules, url) !== null;
const closedTabs = createClosedTabs();
const tabCloser = createTabCloser({ isTarget, getDecoyUrl: () => DECOY_URL, closedTabs });
const autoMute = createAutoMute({ isTarget, isEnabled: () => AUTO_MUTE });

const seeks = {};

// Tin nhắn từ content script / popup: thêm loại mới chỉ cần thêm một dòng ở đây
const HANDLERS = {
  closeAll: (msg, sender) => tabCloser.closeAll(sender.tab),
  closedCount: () => closedTabs.count(),
  restoreClosed: () => closedTabs.restore(),
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
  if (!changes.rules) return;
  rules = changes.rules.newValue || RULES;
  autoMute.refresh();
});

ready.then(autoMute.refresh);
autoMute.start();
