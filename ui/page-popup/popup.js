const tbody = document.querySelector("tbody");
const status = document.getElementById("status");
const btn = document.getElementById("add-current");
const icons = document.getElementById("icons");
const rulesView = document.getElementById("rules");
const lockForm = document.getElementById("lock");
const pinInput = document.getElementById("pin");
const lock = createLock();
let rules = [];
let picking = null;

function save() {
  chrome.storage.local.set({ rules: rules.filter((r) => r.match.trim()) });
}

function render() {
  // Đang khoá thì không dựng bảng, để danh sách không nằm trong DOM
  if (rulesView.hidden) return tbody.replaceChildren();
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

Promise.all([getRules(), chrome.tabs.query({ active: true, currentWindow: true })]).then(([r, [tab]]) => {
  rules = r;
  showDefault();
  if (!/^https?:/.test(tab?.url || "")) return (status.textContent = "Không dùng được trên trang này.");
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
      showDefault();
    });
  }
  forgot.dataset.confirm = "1";
  forgot.textContent = "Bấm lần nữa để xoá mã PIN và toàn bộ rule";
};

// Khôi phục các tab vừa bị đóng bằng phím tắt
const restore = document.getElementById("restore");
chrome.runtime.sendMessage({ type: "closedCount" }).then((count) => {
  if (!count) return;
  restore.textContent = `↺ Khôi phục ${count} tab vừa đóng`;
  restore.hidden = false;
  restore.onclick = () => chrome.runtime.sendMessage({ type: "restoreClosed" }).then(() => window.close());
});
