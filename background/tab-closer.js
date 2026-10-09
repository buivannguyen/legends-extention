function createTabCloser({ isTarget, getDecoyUrl, closedTabs }) {
  async function closeAll(senderTab) {
    const tabs = await chrome.tabs.query({});
    const targets = tabs.filter((t) => t.id === senderTab?.id || isTarget(t.url || t.pendingUrl || ""));
    if (!targets.length) return;

    // Mở tab mồi trước khi đóng, để cửa sổ không bị đóng theo khi hết tab
    const decoyUrl = getDecoyUrl();
    if (decoyUrl && senderTab) {
      chrome.tabs.create({ url: decoyUrl, windowId: senderTab.windowId, index: senderTab.index, active: true });
    }
    chrome.tabs.remove(targets.map((t) => t.id)).catch(() => {});
    closedTabs.remember(targets);
  }

  return { closeAll };
}
