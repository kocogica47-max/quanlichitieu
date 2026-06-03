/**
 * Premium Effects & Interactions — 60 FPS Optimized
 * Chỉ dùng transform + opacity để đảm bảo compositor-only animations
 */

const isMobile = window.innerWidth < 768;

// ── 1. Ripple Effect ────────────────────────────────────────────────────────
function initRippleEffect() {
    document.querySelectorAll('.btn, .btn-gradient-cyan, .btn-tech-primary, .btn-tech-cyan').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect   = this.getBoundingClientRect();
            const size   = Math.max(rect.width, rect.height);

            ripple.className = 'ripple-el';
            ripple.style.cssText = `
                width:${size}px;height:${size}px;
                left:${e.clientX - rect.left - size / 2}px;
                top:${e.clientY - rect.top  - size / 2}px;
            `;

            this.appendChild(ripple);
            // cleanup after animation ends
            ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
        });
    });
}

// ── 2. Number Counter — rAF-based (no setInterval) ─────────────────────────
function animateCounter(element, target, duration = 1200) {
    if (!element) return;

    const start     = performance.now();
    const startVal  = 0;

    function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current  = Math.floor(startVal + (target - startVal) * eased);

        element.textContent = current.toLocaleString('vi-VN') + ' đ';

        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ── 3. Scroll Reveal — IntersectionObserver, CSS-driven ────────────────────
function initScrollReveal() {
    if (isMobile) return; // skip trên mobile

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.tech-card').forEach(el => {
        el.classList.add('reveal-ready');
        observer.observe(el);
    });
}

// ── 4. Toast Notification ──────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const icons  = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const colors = { success: '#10b981', error: '#ef4444', info: '#06b6d4', warning: '#f59e0b' };

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-in';
    toast.innerHTML = `
        <span style="color:${colors[type]};font-size:1.2rem">${icons[type]}</span>
        <span>${message}</span>
    `;
    toast.style.setProperty('--toast-accent', colors[type]);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-in', 'toast-out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3000);
}

// ── 5. Loading Spinner ─────────────────────────────────────────────────────
function showLoading() {
    if (document.getElementById('loading-overlay')) return;
    const el = document.createElement('div');
    el.id = 'loading-overlay';
    el.innerHTML = '<div class="spinner-ring"></div>';
    document.body.appendChild(el);
}

function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.remove();
}

// ── 6. Parallax — REMOVED (causes layout thrashing) ────────────────────────
// Parallax trên .tech-card dùng style.transform trong scroll listener
// buộc browser recalculate layout mỗi frame → đây là nguyên nhân lag #1
// Đã xoá hoàn toàn.

// ── 7. Typing Effect ───────────────────────────────────────────────────────
function typeWriter(element, text, speed = 50) {
    if (!element) return;
    let i = 0;
    element.textContent = '';
    (function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i++);
            setTimeout(type, speed);
        }
    })();
}

// ── 8. Confetti — rAF-driven, DOM-lite ─────────────────────────────────────
function createConfetti() {
    const colors = ['#6366f1','#06b6d4','#8b5cf6','#ec4899','#f59e0b'];
    const count  = isMobile ? 12 : 40;

    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.cssText = `
            left:${Math.random() * 100}%;
            background:${colors[i % colors.length]};
            animation-duration:${2 + Math.random() * 2}s;
            animation-delay:${Math.random() * 0.5}s;
        `;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }
}

// ── 9. Page Transitions ─────────────────────────────────────────────────────
function initPageTransitions() {
    if (isMobile) return;

    document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('?')) {
                e.preventDefault();
                document.body.classList.add('page-exit');
                setTimeout(() => { window.location.href = href; }, 250);
            }
        });
    });
}

// ── 10. Init ────────────────────────────────────────────────────────────────
function initPremiumEffects() {
    // Inject CSS animations vào 1 <style> duy nhất
    const style = document.createElement('style');
    style.textContent = `
        /* Ripple */
        .ripple-el {
            position: absolute;
            border-radius: 50%;
            background: rgba(255,255,255,0.45);
            transform: scale(0);
            animation: ripple-anim 0.55s ease-out forwards;
            pointer-events: none;
            will-change: transform, opacity;
        }
        @keyframes ripple-anim {
            to { transform: scale(4); opacity: 0; }
        }

        /* Scroll reveal — CSS-driven, compositor-only */
        .reveal-ready {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.5s ease, transform 0.5s ease;
            will-change: opacity, transform;
        }
        .reveal-ready.revealed {
            opacity: 1;
            transform: translateY(0);
        }

        /* Toast */
        .toast-notification {
            position: fixed;
            top: 20px; right: 20px;
            background: var(--dropdown-bg, rgba(30,41,59,0.95));
            backdrop-filter: blur(12px);
            border: 1px solid var(--toast-accent, #6366f1);
            border-radius: 14px;
            padding: 14px 20px;
            box-shadow: var(--shadow-md);
            z-index: 9999;
            color: var(--text-primary, #f8fafc);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 320px;
            will-change: transform, opacity;
        }
        .toast-in  { animation: toast-slide-in  0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .toast-out { animation: toast-slide-out 0.22s ease-in forwards; }
        @keyframes toast-slide-in  { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes toast-slide-out { from { transform: translateX(0);    opacity: 1; } to { transform: translateX(120%); opacity: 0; } }

        /* Loading */
        #loading-overlay {
            position: fixed; inset: 0;
            background: var(--overlay-bg, rgba(10,14,39,0.75));
            backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999;
        }
        .spinner-ring {
            width: 44px; height: 44px;
            border: 3px solid var(--card-border, rgba(99,102,241,0.2));
            border-top-color: var(--accent-primary, #6366f1);
            border-radius: 50%;
            animation: spin 0.75s linear infinite;
            will-change: transform;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Confetti */
        .confetti-piece {
            position: fixed; top: -10px;
            width: 9px; height: 9px;
            opacity: 1;
            animation: confetti-fall linear forwards;
            will-change: transform, opacity;
            z-index: 99999;
        }
        @keyframes confetti-fall {
            to { transform: translateY(105vh) rotate(540deg); opacity: 0; }
        }

        /* Page exit */
        .page-exit {
            opacity: 0;
            transition: opacity 0.25s ease;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #6366f1, #8b5cf6);
            border-radius: 8px;
        }
        [data-theme="light"] ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #5b5fc7, #7c3aed);
        }
    `;
    document.head.appendChild(style);

    initRippleEffect();
    initScrollReveal();
    initPageTransitions();

    // Fade-in page — opacity only (compositor layer, free)
    document.body.style.opacity = '0';
    window.addEventListener('load', () => {
        document.body.style.transition = 'opacity 0.35s ease';
        document.body.style.opacity = '1';
        // Remove transition property after fade so it doesn't interfere
        setTimeout(() => { document.body.style.transition = ''; }, 400);
    }, { once: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumEffects);
} else {
    initPremiumEffects();
}

window.PremiumEffects = { showToast, showLoading, hideLoading, animateCounter, createConfetti, typeWriter };
