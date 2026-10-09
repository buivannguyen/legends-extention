
(() => {
  const isMain = (v) => v.duration > 60;
  let saved = false;
  let lastReport = Date.now();

  chrome.runtime.onMessage.addListener((msg, sender, reply) => {
    if (msg?.type === "track") saved = true;
    if (msg?.type !== "videoTime") return;
    const video = [...document.querySelectorAll("video")].filter(isMain).sort((a, b) => b.duration - a.duration)[0];
    if (video) reply(Math.floor(video.currentTime));
  });

  document.addEventListener(
    "loadedmetadata",
    (e) => {
      if (!isMain(e.target)) return;
      chrome.runtime.sendMessage({ type: "videoLoaded" }).then((info) => {
        saved = !!info?.saved;
        if (info?.seek) e.target.currentTime = info.seek;
      });
    },
    true
  );

  function report(video, now) {
    if (!saved || !isMain(video) || !video.played.length || !chrome.runtime?.id) return;
    if (!now && Date.now() - lastReport < 15000) return;
    lastReport = Date.now();
    chrome.runtime.sendMessage({ type: "videoProgress", time: video.ended ? 0 : Math.floor(video.currentTime) });
  }
  document.addEventListener("timeupdate", (e) => report(e.target), true);
  document.addEventListener("pause", (e) => report(e.target, true), true);
  addEventListener("pagehide", () => document.querySelectorAll("video").forEach((v) => report(v, true)));
})();
