# Hướng Dẫn Chuyển Đổi Theme - Dark/Light Mode

## Tổng Quan

Ứng dụng Quản Lý Chi Tiêu đã được nâng cấp với tính năng chuyển đổi giữa chế độ tối (Dark Mode) và chế độ sáng (Light Mode). Người dùng có thể dễ dàng chuyển đổi giữa hai chế độ bằng cách nhấn vào nút toggle ở góc trên bên phải của mỗi trang.

## Các Tính Năng Chính

### 1. **Theme Toggle System**
- ✅ Chuyển đổi mượt mà giữa Dark Mode và Light Mode
- ✅ Lưu trữ lựa chọn theme trong localStorage
- ✅ Tự động áp dụng theme đã chọn khi tải lại trang
- ✅ Hiệu ứng chuyển đổi mượt mà với CSS transitions

### 2. **CSS Variables System**
- ✅ Sử dụng CSS Custom Properties cho dễ dàng tùy chỉnh
- ✅ Hai bộ màu hoàn chỉnh cho Dark và Light theme
- ✅ Tự động điều chỉnh màu sắc, bóng đổ, và hiệu ứng

### 3. **Responsive Design**
- ✅ Hoạt động tốt trên mọi thiết bị (Desktop, Tablet, Mobile)
- ✅ Nút toggle được tối ưu cho cả màn hình lớn và nhỏ
- ✅ Touch-friendly trên thiết bị di động

## Cấu Trúc File

### 1. **JavaScript - Theme Toggle Logic**
```
src/main/resources/static/js/theme-toggle.js
```
- Quản lý logic chuyển đổi theme
- Lưu/đọc theme từ localStorage
- Cập nhật icon và text của nút toggle

### 2. **CSS - Theme Variables**
```
src/main/resources/static/css/theme-variables.css
```
- Định nghĩa CSS variables cho cả hai theme
- Áp dụng màu sắc và hiệu ứng tự động
- Tối ưu hóa cho light mode

### 3. **HTML Pages - Updated**
Tất cả các trang đã được cập nhật:
- ✅ `index.html` - Trang chính
- ✅ `login.html` - Trang đăng nhập
- ✅ `register.html` - Trang đăng ký
- ✅ `new_expense.html` - Trang thêm khoản chi

## Cách Sử Dụng

### Cho Người Dùng:
1. Mở ứng dụng
2. Tìm nút toggle ở góc trên bên phải (biểu tượng mặt trời/mặt trăng)
3. Nhấn vào nút để chuyển đổi giữa Dark Mode và Light Mode
4. Theme được chọn sẽ tự động lưu và áp dụng cho các lần truy cập sau

### Cho Developer:

#### Thêm Theme Toggle vào trang mới:
```html
<!-- 1. Thêm CSS và JS vào <head> -->
<link href="/css/theme-variables.css" rel="stylesheet">
<script src="/js/theme-toggle.js"></script>

<!-- 2. Thêm nút toggle vào <body> -->
<button onclick="toggleTheme()" class="btn btn-sm btn-outline-light border-opacity-25 rounded-3 d-flex align-items-center gap-2" 
        style="position: fixed; top: 20px; right: 20px; z-index: 1000; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); color: #94a3b8; padding: 8px 16px;"
        title="Chuyển đổi chế độ sáng/tối">
    <i id="theme-icon" class="bi bi-sun-fill"></i>
    <span id="theme-text" class="d-none d-sm-inline">Sáng</span>
</button>
```

#### Tùy chỉnh màu sắc cho Light Mode:
Chỉnh sửa file `theme-variables.css`:
```css
[data-theme="light"] {
    --bg-gradient-1: #f8fafc;
    --text-primary: #1e293b;
    /* ... các biến khác */
}
```

## Bảng Màu

### Dark Theme (Mặc định):
- Background: Gradient tối (#0f0f23 → #1a0b2e)
- Text Primary: #e2e8f0
- Text Secondary: #94a3b8
- Card Background: rgba(30, 41, 59, 0.6)
- Accent Colors: #6366f1 (Indigo), #06b6d4 (Cyan)

### Light Theme:
- Background: Gradient sáng (#f8fafc → #e0e7ff)
- Text Primary: #1e293b
- Text Secondary: #475569
- Card Background: rgba(255, 255, 255, 0.8)
- Accent Colors: Giữ nguyên như Dark Theme

## API Functions

### JavaScript Functions:
```javascript
// Lấy theme hiện tại
getCurrentTheme() // Returns: 'dark' hoặc 'light'

// Chuyển đổi theme
toggleTheme()

// Áp dụng theme cụ thể
applyTheme('light') // hoặc 'dark'
```

## Performance

- ✅ Smooth transitions (0.3s - 0.5s)
- ✅ GPU-accelerated animations
- ✅ Minimal reflow/repaint
- ✅ LocalStorage caching
- ✅ Tối ưu cho mobile devices

## Browser Support

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Theme không lưu sau khi reload:
- Kiểm tra localStorage có bị disable không
- Xóa cache và thử lại

### Màu sắc không đổi:
- Kiểm tra file `theme-variables.css` đã được load chưa
- Kiểm tra console có lỗi JavaScript không

### Nút toggle không hiển thị:
- Kiểm tra file `theme-toggle.js` đã được load chưa
- Kiểm tra z-index của nút toggle

## Future Enhancements

Các tính năng có thể thêm trong tương lai:
- [ ] Auto theme dựa trên system preference
- [ ] Thêm theme tùy chỉnh (Custom themes)
- [ ] Theme scheduler (tự động đổi theo giờ)
- [ ] Thêm nhiều color schemes

## Credits

Developed by: Kiro AI Assistant
Date: June 1, 2026
Version: 1.0.0
