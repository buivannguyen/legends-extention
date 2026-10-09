importScripts("config.js", "rules.js");

// Content script yêu cầu đóng tất cả tab thuộc config
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "closeAll") return;
  // Đóng ngay tab hiện tại, không chờ gì cả
  if (sender.tab?.id != null) chrome.tabs.remove(sender.tab.id).catch(() => {});

  chrome.tabs.query({}, (tabs) => {
    const ids = tabs
      .filter((t) => t.id !== sender.tab?.id && findRule(RULES, t.url || t.pendingUrl || ""))
      .map((t) => t.id);
    if (ids.length) chrome.tabs.remove(ids).catch(() => {});
  });
});
