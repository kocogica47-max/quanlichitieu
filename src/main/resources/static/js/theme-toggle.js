/**
 * Theme Toggle System - Dark/Light Mode
 * Hệ thống chuyển đổi chế độ sáng/tối
 */

// Lấy theme hiện tại từ localStorage hoặc mặc định là 'dark'
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'dark';
}

// Lưu theme vào localStorage
function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

// Áp dụng theme
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Cập nhật icon của nút toggle
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (themeIcon) {
        if (theme === 'light') {
            themeIcon.className = 'bi bi-moon-stars-fill';
            if (themeText) themeText.textContent = 'Tối';
        } else {
            themeIcon.className = 'bi bi-sun-fill';
            if (themeText) themeText.textContent = 'Sáng';
        }
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    saveTheme(newTheme);
    applyTheme(newTheme);
    
    // Hiệu ứng chuyển đổi mượt mà
    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

// Khởi tạo theme khi trang load
function initTheme() {
    const theme = getCurrentTheme();
    applyTheme(theme);
}

// Tự động khởi tạo khi DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// Export cho sử dụng global
window.toggleTheme = toggleTheme;
window.getCurrentTheme = getCurrentTheme;
