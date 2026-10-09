const tbody = document.querySelector("tbody");
const status = document.getElementById("status");
const btn = document.getElementById("add-current");
const icons = document.getElementById("icons");
const rulesView = document.getElementById("rules");
const lockForm = document.getElementById("lock");
const pinInput = document.getElementById("pin");
const bookmarkList = document.getElementById("bookmarks");
const bookmarkBtn = document.getElementById("bookmark-current");
const lock = createLock();
let rules = [];
let bookmarks = [];
let currentTab = null;
let picking = null;

function save() {
  chrome.storage.local.set({ rules: rules.filter((r) => r.match.trim()) });
}

// 754 → "12:34", 3754 → "1:02:34"
const formatTime = (s) => (s ? new Date(s * 1000).toISOString().slice(11, 19).replace(/^0+:?0?/, "") : "");

function render() {
  // Nút ★ chạy cả khi đang khoá: trang đã lưu thì khoá nút, mốc thời gian tự cập nhật khi xem
  const isSaved = bookmarks.some((b) => b.url === currentTab?.url);
  bookmarkBtn.disabled = isSaved;
  bookmarkBtn.textContent = isSaved ? "✓ Đã lưu" : "★ Lưu video này";
  // Đang khoá thì không dựng bảng, để danh sách không nằm trong DOM
  if (rulesView.hidden) {
    bookmarkList.replaceChildren();
    return tbody.replaceChildren();
  }
  bookmarkList.replaceChildren(
    ...bookmarks.map((b, i) => {
      const li = document.createElement("li");
      const open = document.createElement("button");
      const time = document.createElement("small");
      time.textContent = formatTime(b.time);
      open.append(b.title, time);
      open.title = b.url;
      open.onclick = () => chrome.runtime.sendMessage({ type: "openBookmark", url: b.url, time: b.time });
      const del = document.createElement("button");
      del.textContent = "✕";
      del.onclick = () => {
        bookmarks.splice(i, 1);
        chrome.storage.local.set({ bookmarks });
        render();
      };
      li.append(open, del);
      return li;
    })
  );
  tbody.replaceChildren(
    ...rules.map((rule, i) => {
      const tr = document.createElement("tr");
      for (const field of ["match", "title", "favicon"]) {
        const input = document.createElement("input");
        input.value = rule[field] || "";
        if (field === "favicon") {
          input.onclick = () => {
            picking = input;
            icons.showPopover({ source: input });
          };
          // Xem trước icon trong ô; emoji thì tự hiện bằng chữ
          (input.oninput = () => {
            const url = input.value && URL.parse(input.value, chrome.runtime.getURL(""));
            input.style.backgroundImage = url ? `url("${url}")` : "";
          })();
        }
        input.onchange = () => {
          rule[field] = input.value;
          save();
        };
        tr.insertCell().append(input);
      }
      const del = document.createElement("button");
      del.textContent = "✕";
      del.onclick = () => {
        rules.splice(i, 1);
        save();
        render();
      };
      tr.insertCell().append(del);
      return tr;
    })
  );
}

icons.onclick = (e) => {
  const opt = e.target.closest("button");
  if (!opt) return;
  picking.value = opt.value;
  picking.oninput();
  picking.onchange();
  icons.hidePopover();
};

document.getElementById("add").onclick = () => {
  rules.push({ match: "", title: "", favicon: "" });
  render();
};

Promise.all([
  getRules(),
  chrome.tabs.query({ active: true, currentWindow: true }),
  chrome.storage.local.get({ bookmarks: [] })
]).then(([r, [tab], b]) => {
  rules = r;
  bookmarks = b.bookmarks;
  currentTab = tab;
  showDefault();
  if (!/^https?:/.test(tab?.url || "")) return (status.textContent = "Không dùng được trên trang này.");
  bookmarkBtn.hidden = false;
  if (findRule(rules, tab.url)) return (status.textContent = "Trang này đang được ngụy trang.");
  const host = new URL(tab.url).hostname.replace(/^www\./, "");
  btn.textContent = `+ Ngụy trang trang này (${host})`;
  btn.hidden = false;
  btn.onclick = () => {
    rules.push({ match: host, title: "Kế hoạch tuần - Google Tài liệu", favicon: "icons/google-docs.ico" });
    save();
    render();
    btn.hidden = true;
    status.textContent = "Trang này đang được ngụy trang.";
  };
});

// Lưu trang đang mở vào yêu thích, rồi báo tab bắt đầu tự cập nhật mốc.
// Tiêu đề lấy từ content script vì tiêu đề tab có thể đang là tiêu đề ngụy trang
bookmarkBtn.onclick = async () => {
  bookmarkBtn.disabled = true;
  const ask = (type) => chrome.tabs.sendMessage(currentTab.id, { type }).catch(() => null);
  const [title, time] = await Promise.all([ask("realTitle"), ask("videoTime")]);
  bookmarks.unshift({ url: currentTab.url, title: title || currentTab.title, time });
  chrome.storage.local.set({ bookmarks });
  ask("track");
  render();
};

// Bảo vệ danh sách rule: có mã PIN thì phải nhập mã, chưa có thì ẩn sẵn, bấm mới hiện
const lockHint = document.getElementById("lock-hint");
const lockSubmit = document.getElementById("lock-submit");
const forgot = document.getElementById("forgot");
const cancel = document.getElementById("cancel");
let onSubmit = null;

function showRules() {
  lockForm.hidden = true;
  rulesView.hidden = false;
  render();
  lock.hasPin().then((has) => {
    document.getElementById("lock-now").textContent = has ? "🔒 Khoá" : "Ẩn danh sách";
    document.getElementById("set-pin").textContent = has ? "Đổi mã PIN" : "Đặt mã PIN";
    document.getElementById("remove-pin").hidden = !has;
  });
}

// Hiện form thay cho bảng rule. `input` = có ô nhập mã hay không
function showForm({ hint, submit, input = true, back = false, action }) {
  rulesView.hidden = true;
  render();
  lockForm.hidden = false;
  lockHint.textContent = hint;
  lockSubmit.textContent = submit;
  pinInput.hidden = !input;
  pinInput.value = "";
  forgot.hidden = true;
  cancel.hidden = !back;
  onSubmit = action;
  if (input) pinInput.focus();
}

async function showDefault() {
  if (!(await lock.hasPin())) {
    return showForm({ hint: "Danh sách trang đang ẩn.", submit: "👁 Hiện danh sách", input: false, action: showRules });
  }
  if (await lock.isUnlocked()) {
    lock.keepUnlocked();
    return showRules();
  }
  showForm({
    hint: "Nhập mã PIN để xem danh sách trang.",
    submit: "Mở khoá",
    action: async () => {
      if (await lock.unlock(pinInput.value)) return showRules();
      lockHint.textContent = "Sai mã PIN, thử lại.";
      pinInput.select();
    }
  });
  forgot.textContent = "Quên mã PIN?";
  delete forgot.dataset.confirm;
  forgot.hidden = false;
}

lockForm.onsubmit = (e) => {
  e.preventDefault();
  onSubmit?.();
};

cancel.onclick = showRules;

document.getElementById("lock-now").onclick = () => lock.lock().then(showDefault);

document.getElementById("set-pin").onclick = () =>
  showForm({
    hint: "Mã PIN mới (ít nhất 4 ký tự):",
    submit: "Lưu mã",
    back: true,
    action: async () => {
      if (pinInput.value.length < 4) return (lockHint.textContent = "Mã PIN cần ít nhất 4 ký tự.");
      await lock.setPin(pinInput.value);
      showRules();
    }
  });

document.getElementById("remove-pin").onclick = () => lock.removePin().then(showRules);

// Quên mã: bấm 2 lần mới xoá, vì sẽ mất toàn bộ rule
forgot.onclick = () => {
  if (forgot.dataset.confirm) {
    delete forgot.dataset.confirm;
    return lock.reset().then(() => getRules()).then((r) => {
      rules = r;
      bookmarks = [];
      showDefault();
    });
  }
  forgot.dataset.confirm = "1";
  forgot.textContent = "Bấm lần nữa để xoá mã PIN, toàn bộ rule và video yêu thích";
};

// Khôi phục các tab vừa bị đóng bằng phím tắt
const restore = document.getElementById("restore");
chrome.runtime.sendMessage({ type: "closedCount" }).then((count) => {
  if (!count) return;
  restore.textContent = `↺ Khôi phục ${count} tab vừa đóng`;
  restore.hidden = false;
  restore.onclick = () => chrome.runtime.sendMessage({ type: "restoreClosed" }).then(() => window.close());
});
