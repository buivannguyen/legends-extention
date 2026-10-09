# Legend's extension

> Học tập vì một tương lai tươi sáng

Trong thời đại AI phát triển từng ngày, **học tập** là cách tốt nhất để không bị bỏ lại phía sau. Legend's extension đồng hành cùng bạn trên hành trình ấy: biến mỗi tab trình duyệt thành một **góc học tập** gọn gàng và tập trung, để bạn vững bước tới một **tương lai** tươi sáng.

## Tính năng

- **Đổi tiêu đề tab:** đặt tiêu đề cố định, hoặc chèn tiêu đề gốc bằng `{title}`.
- **Đổi favicon:** dùng icon có sẵn trong extension, URL ảnh, hoặc emoji.
- **Giữ ngụy trang liên tục:** nếu trang tự đổi lại tiêu đề hoặc favicon (thông báo mới, SPA chuyển trang…), extension ghi đè lại ngay.
- **Phím tắt** (chỉ hoạt động trên các trang trong cấu hình):

  | Thao tác | Hành động |
  |---|---|
  | Bấm rồi thả riêng phím **Ctrl** | Đóng **tất cả** tab thuộc cấu hình, mở tab mồi thay vào |
  | Bấm **chuột giữa** (con lăn) | Đóng **tất cả** tab thuộc cấu hình, mở tab mồi thay vào |
  | Bấm rồi thả riêng phím **Shift** | Chuyển tab hiện tại sang ChatGPT |

  Các tổ hợp phím như `Ctrl+C`, `Ctrl+V` hay `Shift+A` vẫn dùng bình thường. Đang gõ trong ô nhập liệu thì phím tắt không chạy, tránh bấm nhầm.
- **Tab mồi & khôi phục:** đóng tab bằng phím tắt sẽ mở ngay một trang mồi (mặc định Google Docs). Muốn mở lại các tab vừa đóng, bấm **↺ Khôi phục tab vừa đóng** trong popup.
- **Khoá popup:** danh sách trang trong popup ẩn sẵn, bấm **👁 Hiện danh sách** mới thấy. Đặt **mã PIN** để khoá hẳn: phải nhập đúng mã mới xem/sửa được rule, mở khoá xong tự khoá lại sau 5 phút hoặc khi tắt trình duyệt. Quên mã thì chỉ có cách xoá mã cùng toàn bộ rule và video yêu thích. Mã chỉ lưu dạng băm SHA-256, không lưu mã gốc.
- **Video yêu thích:** lưu video ngay trong extension thay vì bookmark của trình duyệt. Mở popup, bấm **★ Lưu video này** (dùng được cả khi popup đang khoá): extension lưu tiêu đề thật (kể cả khi tab đang ngụy trang) và mốc thời gian đang xem. Trang đã lưu thì nút hiện **✓ Đã lưu**, mốc thời gian tự cập nhật khi đang xem (mỗi 15 giây), khi dừng video và khi đóng tab. Danh sách nằm ở tab **★ Yêu thích**, bấm tên video để mở lại ở tab mới và tua tới mốc đã lưu. Danh sách được ẩn/khoá bằng mã PIN cùng với danh sách trang. Mốc thời gian chỉ áp cho video dài hơn 60 giây, có tác dụng cả với player nhúng bằng iframe.
- **Tự tắt tiếng:** tab ngụy trang tự tắt tiếng khi chuyển sang tab khác, bật lại khi quay về. Tab bạn tự tắt tiếng thì giữ nguyên.

## Cài đặt

1. Clone repo:
   ```bash
   git clone https://github.com/buivannguyen/legends-extention.git
   ```
2. Mở `chrome://extensions` và bật **Developer mode** (góc trên bên phải).
3. Bấm **Load unpacked** rồi chọn thư mục vừa clone.

## Cấu hình

Bấm icon extension để mở popup: nút **Ngụy trang trang này** ở trên cùng thêm nhanh trang đang mở, tab **Ngụy trang** để thêm, sửa, xoá rule. Thay đổi áp dụng ngay, không cần reload. Gõ xong bấm **Enter** để lưu.

[`config.js`](config.js) chỉ là danh sách mặc định, dùng khi chưa lưu rule nào:

```js
const RULES = [
  {
    match: "example.com",
    title: "Kế hoạch tuần - Google Tài liệu",
    favicon: "icons/google-docs.ico"
  },
  {
    match: "example.*",
    title: "Tasks - Google Trang tính",
    favicon: "icons/google-sheets.ico"
  }
];
```

| Trường | Ý nghĩa | Ví dụ |
|---|---|---|
| `match` | Tên miền (khớp cả subdomain), tên miền có `*`, hoặc pattern cho toàn URL | `example.com`, `example.*`, `*://mail.example.com/*` |
| `title` | Tiêu đề mới. Dùng `{title}` để chèn tiêu đề gốc. Bỏ trống = giữ nguyên | `"[Work] {title}"` |
| `favicon` | File trong `icons/`, URL ảnh, hoặc emoji. Bỏ trống = giữ nguyên | `"icons/duolingo.ico"`, `"📊"` |

Với `match`: `example.*` khớp `example.com`, `example.net`, `www.example.xyz`… nhưng không khớp `notexample.com`.

Sửa `config.js` thì phải vào `chrome://extensions` bấm **Reload**, và chỉ có tác dụng khi chưa lưu rule nào trong popup.

Cuối `config.js` còn vài tuỳ chọn khác:

| Hằng số | Ý nghĩa | Mặc định |
|---|---|---|
| `SWITCH_URL` | Trang chuyển tới khi thả riêng phím Shift | `https://chatgpt.com/` |
| `DECOY_URL` | Trang mồi mở ra khi đóng tab bằng phím tắt. Bỏ trống = không mở | Google Docs |
| `AUTO_MUTE` | Tự tắt tiếng tab ngụy trang khi chuyển sang tab khác | `true` |
| `LOCK_AFTER_MINUTES` | Mở khoá popup bằng mã PIN xong, tự khoá lại sau bấy nhiêu phút | `5` |

### Icon có sẵn

| File | Icon |
|---|---|
| `icons/google-docs.ico` | Google Docs |
| `icons/google-sheets.ico` | Google Sheets |
| `icons/duolingo.ico` | Duolingo |
| `icons/elsa.png` | ELSA Speak |

Icon của chính extension là `icons/icon.svg` (bản gốc) và `icons/icon-16/32/48/128.png` render từ đó.

Muốn thêm icon, chép file `.png`, `.ico` hoặc `.svg` vào `icons/` rồi ghi đường dẫn vào `favicon`.

## Cấu trúc thư mục

```
├── manifest.json   # Khai báo extension (Manifest V3)
├── config.js       # Danh sách rule
├── rules.js        # Logic so khớp URL, dùng chung cho content script và background
├── content.js      # Ghép các module content script
├── content/
│   ├── disguise.js       # Đổi + giữ tiêu đề/favicon, trả lại khi bỏ ngụy trang
│   ├── icon-resolver.js  # Đổi giá trị favicon (file/URL/emoji) thành href
│   ├── hotkeys.js        # Phím tắt Ctrl/Shift và chuột giữa
│   ├── url-watcher.js    # Bắt SPA đổi URL
│   └── video-time.js     # Đọc/tua mốc thời gian video yêu thích (chạy cả trong iframe)
├── background.js   # Ghép các module background, định tuyến tin nhắn
├── background/
│   ├── tab-closer.js     # Đóng tab thuộc cấu hình, mở tab mồi
│   ├── closed-tabs.js    # Nhớ và khôi phục tab vừa đóng
│   └── auto-mute.js      # Tự tắt/bật tiếng tab
├── ui/
│   ├── style.css       # CSS dùng chung
│   └── page-popup/     # Bấm icon extension: ngụy trang nhanh + quản lý rule (lưu trong chrome.storage.local)
│       └── lock.js     # Khoá danh sách rule và video yêu thích bằng mã PIN
└── icons/          # Favicon dùng để ngụy trang
```

## Đề xuất tính năng & báo lỗi

Mọi ý tưởng đều được chào đón! Hãy mở một [Issue](https://github.com/buivannguyen/legends-extention/issues/new/choose) và chọn:

- **Feature request:** đề xuất tính năng mới (phím tắt mới, icon mới, tùy chọn mới…).
- **Bug report:** báo lỗi. Nhớ ghi phiên bản Chrome, hệ điều hành, các bước tái hiện, và log trong Console nếu có.

## Đóng góp

Pull request luôn được hoan nghênh 🙌

1. Fork repo và tạo nhánh mới từ `main`:
   ```bash
   git checkout -b feature/ten-tinh-nang
   ```
2. Code và thử trên Chrome bằng **Load unpacked**.
3. Commit với message rõ ràng, ví dụ `feat: thêm phím tắt Alt để ...` hoặc `fix: favicon không đổi trên ...`.
4. Push và mở Pull Request vào `main`. Mô tả thay đổi và cách bạn đã kiểm tra.

Một số lưu ý khi đóng góp:

- Giữ extension **không cần build**: JavaScript thuần, không thêm framework hay bundler.
- Hạn chế xin thêm quyền (`permissions`) trong `manifest.json`. Nếu bắt buộc, giải thích lý do trong PR.
- Không đưa danh sách trang cá nhân của bạn vào `config.js` trong PR. Hãy dùng tên miền ví dụ như `example.com`.
- Icon mới nên nhỏ gọn (dưới 50 KB), đặt trong `icons/` và thêm vào bảng "Icon có sẵn" ở trên.
