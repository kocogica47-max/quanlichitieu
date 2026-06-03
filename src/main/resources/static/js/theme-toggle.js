/**
 * Theme Toggle System - Dark/Light Mode
 * Hệ thống chuyển đổi chế độ sáng/tối
 */

function getCurrentTheme() {
    return localStorage.getItem('theme') || 'dark';
}

function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // Cập nhật icon và text
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

    // Áp dụng class CSS cho tất cả nút toggle
    document.querySelectorAll('[onclick="toggleTheme()"], .theme-toggle-btn').forEach(btn => {
        btn.classList.add('theme-toggle-btn');
        // Xóa inline style cứng để CSS variable hoạt động
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
    });
}

function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Ripple effect
    document.body.style.transition = 'background 0.4s ease, color 0.3s ease';

    saveTheme(newTheme);
    applyTheme(newTheme);

    setTimeout(() => {
        document.body.style.transition = '';
    }, 400);
}

function initTheme() {
    const theme = getCurrentTheme();
    // Áp dụng ngay để tránh flash
    document.documentElement.setAttribute('data-theme', theme);
    applyTheme(theme);
}

// Áp dụng theme trước khi DOM render xong để tránh flash
(function() {
    const t = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

window.toggleTheme = toggleTheme;
window.getCurrentTheme = getCurrentTheme;

// Re-render chart khi đổi theme (nếu có chart trên trang)
const _origToggle = window.toggleTheme;
window.toggleTheme = function() {
    _origToggle();
    // Reload chart sau khi theme đổi (nếu trang có loadBarChart)
    setTimeout(() => {
        if (typeof loadBarChart === 'function' && typeof currentChartType !== 'undefined') {
            if (currentChartType === 'bar') loadBarChart();
            else if (currentChartType === 'pie') loadPieChart();
        }
    }, 320);
};
