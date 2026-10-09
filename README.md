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
  | Bấm rồi thả riêng phím **Ctrl** | Đóng **tất cả** tab thuộc cấu hình |
  | Bấm **chuột giữa** (con lăn) | Đóng **tất cả** tab thuộc cấu hình |
  | Bấm rồi thả riêng phím **Shift** | Chuyển tab hiện tại sang ChatGPT |

  Các tổ hợp phím như `Ctrl+C`, `Ctrl+V` hay `Shift+A` vẫn dùng bình thường.

## Cài đặt

1. Clone repo:
   ```bash
   git clone https://github.com/buivannguyen/legends-extention.git
   ```
2. Mở `chrome://extensions` và bật **Developer mode** (góc trên bên phải).
3. Bấm **Load unpacked** rồi chọn thư mục vừa clone.

## Cấu hình

Danh sách trang nằm trong [`config.js`](config.js):

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

Sau khi sửa cấu hình, vào `chrome://extensions` bấm **Reload** extension rồi tải lại các tab đang mở.

### Icon có sẵn

| File | Icon |
|---|---|
| `icons/google-docs.ico` | Google Docs |
| `icons/google-sheets.ico` | Google Sheets |
| `icons/duolingo.ico` | Duolingo |
| `icons/elsa.png` | ELSA Speak |

Muốn thêm icon, chép file `.png`, `.ico` hoặc `.svg` vào `icons/` rồi ghi đường dẫn vào `favicon`.

## Cấu trúc thư mục

```
├── manifest.json   # Khai báo extension (Manifest V3)
├── config.js       # Danh sách rule
├── rules.js        # Logic so khớp URL, dùng chung cho content script và background
├── content.js      # Đổi tiêu đề/favicon, bắt phím tắt
├── background.js   # Đóng tab theo yêu cầu từ content script
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
