# Hướng Dẫn Tùy Chỉnh Portfolio 3D Tương Tác

Chào mừng bạn đến với "bảng điều khiển" (control panel) của portfolio. Dự án này được thiết kế để bạn có thể dễ dàng cập nhật và tùy chỉnh nội dung mà không cần phải can thiệp sâu vào logic phức tạp của mã nguồn.

Hầu hết mọi tùy chỉnh bạn cần sẽ chỉ tập trung ở 3 tệp chính:
1. `src/app.component.ts`
2. `src/guide.service.ts`
3. `src/background.service.ts`

---

## Điều khiển thủ công

### Card dữ liệu (`src/app.component.ts`)
Mảng `CARD_DATA` giữ toàn bộ thông tin card. Mỗi card có thể tự đặt vị trí và kích thước bằng `layout` và bật `manualLayout` để bỏ qua bố cục tự động.

```typescript
{
  id: 'unique-card-id',
  title: 'Tiêu đề chính',
  meta: 'Mô tả ngắn',
  body: `Nội dung chi tiết`,
  opts: { noexpand: true, style: { width: '840px' } },
  manualLayout: true,
  layout: {
    scale: 0.25,
    position: { x: 0, y: 0, z: 0 }
  }
}
```
- `layout.scale`: điều chỉnh kích thước (1 = 100%).
- `layout.position.x/y/z`: dịch chuyển card theo trục X, Y, Z.
- `manualLayout`: đặt `true` để dùng tọa độ trong `layout`; nếu bỏ qua, card sẽ được xếp tự động quanh vòng tròn.

### Lời bình Witness (`src/guide.service.ts`)
`witnessTexts` chứa lời bình tương ứng với từng card.

```typescript
private witnessTexts: Record<string, string> = {
  'personal-info-card': 'Lời bình cho card thông tin cá nhân...',
  // ...
};
```
Thêm hoặc sửa lời bình bằng cách chỉnh sửa các cặp `id: nội_dung` trong đối tượng này. `id` phải trùng với `id` của card trong `CARD_DATA`.

### Công thức nền (`src/background.service.ts`)
Các hằng số giúp điều khiển tần suất và hiệu ứng của công thức xuất hiện ở nền:

- `FORMULA_EXAMPLES`: danh sách công thức hiển thị tuần tự. Thêm bớt phần tử để thay đổi nội dung.
- `GRID_ROWS` và `GRID_COLS`: số hàng và cột của lưới đặt công thức; tăng giảm để chỉnh mật độ xuất hiện.
- `FADE_DURATION`: thời gian (ms) để công thức mờ dần rồi biến mất.

### Kaomoji & emoji hiệu ứng (`src/app.component.ts`)
Hiệu ứng Kaomoji xuất hiện khi chọn card.

- Trong hàm `spawnKaomojiAt`, thay đổi dòng:
  ```typescript
  obj.scale.set(0.5, 0.5, 0.5);
  ```
  để phóng to/thu nhỏ Kaomoji.
- Tùy biến gương mặt Kaomoji qua cấu trúc `KAOMOJI_PARTS` (mắt, miệng, ký tự trang trí).
- Phạm vi emoji hiệu ứng được lấy ngẫu nhiên từ `EMOJI_RANGES`; sửa các cặp mã Unicode để đổi bộ emoji.

### Particles (`src/app.component.ts`)
Hiệu ứng hạt bay lơ lửng trong nền được tạo ngẫu nhiên.

- `particlesCnt`: số lượng hạt. Giảm hoặc tăng để đổi mật độ.
- `baseColor` và `colorArray`: chỉnh màu mặc định của hạt.
- `pointsMaterial.size`: thay đổi kích thước từng hạt.
- Nếu muốn đổi hình dạng hạt, sửa hàm `createCircleTexture`.

### Màu sắc & font chữ (`index.html`, `tailwind.config.js`)
Toàn bộ bảng màu và font cơ bản được đặt trong `index.html`.

```html
:root { --bg:#060606; --card:#111826; --ink:#e6edf3; /* ... */ }
```

- Chỉnh các biến `--bg`, `--card`, `--ink`, v.v. để đổi màu nền và màu chữ.
- Liên kết Google Fonts ở đầu tệp cho phép đổi kiểu chữ. Thay URL hoặc thuộc tính `font` trong `html,body` để chỉnh font và cỡ chữ gốc.
- Khi cần thêm màu hoặc font với Tailwind, mở rộng `theme.extend` trong `tailwind.config.js`.

---

## Blog page

Trang blog được phục vụ từ tệp tĩnh `blog/index.html`. Đường dẫn này sẽ tương ứng với URL `/blog/index.html` (hoặc `/blog/` nếu máy chủ hỗ trợ tự động ánh xạ), vì vậy chỉ cần deploy thư mục `blog/` là đã có thể truy cập trang blog.

Toàn bộ nội dung và tài nguyên liên quan đến blog nên đặt trong thư mục `blog/`. Cấu trúc đề xuất:

- `blog/index.html`: trang chủ blog, liệt kê các bài viết và liên kết điều hướng.
- `blog/posts/`: thư mục con (tùy chọn) chứa từng bài viết, ví dụ `blog/posts/first-post.html`.
- `blog/assets/`: nơi đặt ảnh hoặc CSS/JS riêng cho blog nếu cần.

Quy trình tạo hoặc cập nhật trang blog:

1. Tạo thư mục `blog/` ở gốc repo nếu chưa tồn tại.
2. Thêm `blog/index.html` với phần liệt kê bài viết, mỗi bài liên kết tới tệp HTML tương ứng trong `blog/` hoặc các thư mục con.
3. Tạo một tệp HTML cho mỗi bài viết (ví dụ `blog/2024-hello-world.html` hoặc `blog/posts/2024-hello-world.html`) và cập nhật liên kết từ `blog/index.html`.
4. Khi thêm tài nguyên tĩnh (ảnh, CSS, JS) cho blog, đặt chúng trong `blog/assets/` và tham chiếu bằng đường dẫn tương đối.

## Các cập nhật trong tương lai

- Mobile Version tối ưu cho màn hình nhỏ.
- Blog page để đăng tải bài viết.
- AI tool page cung cấp tiện ích hỗ trợ sáng tạo.
- Trang tương tác 3D với AI.

