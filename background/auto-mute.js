// Tắt tiếng các tab thuộc config khi không phải tab đang xem, bật lại khi quay về.
// Chỉ bật lại tab do chính extension tắt tiếng, không đụng tab người dùng tự tắt.

function createAutoMute({ isTarget, isEnabled }) {
  const mutedByUs = (tab) => tab.mutedInfo?.muted && tab.mutedInfo.extensionId === chrome.runtime.id;

  async function refresh() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      const shouldMute = isEnabled() && !tab.active && isTarget(tab.url || tab.pendingUrl || "");
      if (shouldMute && !tab.mutedInfo?.muted) chrome.tabs.update(tab.id, { muted: true }).catch(() => {});
      else if (!shouldMute && mutedByUs(tab)) chrome.tabs.update(tab.id, { muted: false }).catch(() => {});
    }
  }

  function start() {
    chrome.tabs.onActivated.addListener(refresh);
    chrome.tabs.onUpdated.addListener((id, change) => {
      if (change.url || change.audible) refresh();
    });
  }

  return { start, refresh };
}
