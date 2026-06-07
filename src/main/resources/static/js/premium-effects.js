/**
 * Premium Effects — 60 FPS Optimized
 * Chỉ dùng transform + opacity (compositor-only, không trigger layout)
 */

const isMobile = window.innerWidth < 768;

// ── 1. Ripple Effect ──────────────────────────────────────────────────────
function initRippleEffect() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn, .btn-gradient-cyan, .btn-tech-primary, .btn-tech-cyan');
        if (!btn) return;

        const ripple = document.createElement('span');
        const rect   = btn.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height);

        ripple.className = 'ripple-el';
        ripple.style.cssText =
            `width:${size}px;height:${size}px;` +
            `left:${e.clientX - rect.left - size / 2}px;` +
            `top:${e.clientY - rect.top  - size / 2}px;`;

        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
}

// ── 2. Number Counter — rAF-based ─────────────────────────────────────────
function animateCounter(element, target, duration = 1200) {
    if (!element) return;
    const start = performance.now();
    function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        element.textContent = Math.floor(target * eased).toLocaleString('vi-VN') + ' đ';
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── 3. Scroll Reveal — IntersectionObserver ───────────────────────────────
function initScrollReveal() {
    if (isMobile) return;

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

// ── 4. Toast Notification ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const icons  = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const colors = { success: '#10b981', error: '#ef4444', info: '#06b6d4', warning: '#f59e0b' };

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-in';
    toast.innerHTML =
        `<span style="color:${colors[type]};font-size:1.2rem">${icons[type]}</span>` +
        `<span>${message}</span>`;
    toast.style.setProperty('--toast-accent', colors[type]);
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.replace('toast-in', 'toast-out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3000);
}

// ── 5. Loading Spinner ────────────────────────────────────────────────────
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

// ── 6. Confetti ───────────────────────────────────────────────────────────
function createConfetti() {
    const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];
    const count  = isMobile ? 12 : 40;
    const frag   = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.cssText =
            `left:${Math.random() * 100}%;` +
            `background:${colors[i % colors.length]};` +
            `animation-duration:${2 + Math.random() * 2}s;` +
            `animation-delay:${Math.random() * 0.5}s;`;
        frag.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }
    document.body.appendChild(frag);
}

// ── 7. Typing Effect ──────────────────────────────────────────────────────
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

// ── 8. Init ───────────────────────────────────────────────────────────────
function initPremiumEffects() {
    const style = document.createElement('style');
    style.textContent = `
        /* Ripple */
        .ripple-el {
            position:absolute; border-radius:50%;
            background:rgba(255,255,255,0.4);
            transform:scale(0);
            animation:ripple-anim 0.5s ease-out forwards;
            pointer-events:none;
            will-change:transform,opacity;
        }
        @keyframes ripple-anim { to { transform:scale(4); opacity:0; } }

        /* Scroll reveal */
        .reveal-ready {
            opacity:0; transform:translateY(20px);
            transition:opacity 0.45s ease, transform 0.45s ease;
            will-change:opacity,transform;
        }
        .reveal-ready.revealed { opacity:1; transform:translateY(0); }
        .reveal-ready.revealed { will-change:auto; }

        /* Toast */
        .toast-notification {
            position:fixed; top:20px; right:20px;
            background:var(--dropdown-bg,rgba(30,41,59,0.95));
            backdrop-filter:blur(12px);
            border:1px solid var(--toast-accent,#6366f1);
            border-radius:14px; padding:14px 20px;
            box-shadow:var(--shadow-md);
            z-index:9999; color:var(--text-primary,#f8fafc);
            display:flex; align-items:center; gap:10px;
            max-width:320px; will-change:transform,opacity;
        }
        .toast-in  { animation:toast-in  0.26s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .toast-out { animation:toast-out 0.2s ease-in forwards; }
        @keyframes toast-in  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes toast-out { from{transform:translateX(0);opacity:1}   to{transform:translateX(110%);opacity:0} }

        /* Loading */
        #loading-overlay {
            position:fixed; inset:0;
            background:var(--overlay-bg,rgba(10,14,39,0.75));
            backdrop-filter:blur(6px);
            display:flex; align-items:center; justify-content:center;
            z-index:99999;
        }
        .spinner-ring {
            width:44px; height:44px;
            border:3px solid var(--card-border,rgba(99,102,241,0.2));
            border-top-color:var(--accent-primary,#6366f1);
            border-radius:50%;
            animation:spin 0.7s linear infinite;
            will-change:transform;
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Confetti */
        .confetti-piece {
            position:fixed; top:-10px;
            width:8px; height:8px; opacity:1;
            animation:confetti-fall linear forwards;
            will-change:transform,opacity; z-index:99999;
        }
        @keyframes confetti-fall { to { transform:translateY(105vh) rotate(540deg); opacity:0; } }

        /* Scrollbar */
        ::-webkit-scrollbar { width:7px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb {
            background:linear-gradient(180deg,#6366f1,#8b5cf6);
            border-radius:8px;
        }
        [data-theme="light"] ::-webkit-scrollbar-thumb {
            background:linear-gradient(180deg,#5b5fc7,#7c3aed);
        }
    `;
    document.head.appendChild(style);

    initRippleEffect();
    initScrollReveal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumEffects);
} else {
    initPremiumEffects();
}

window.PremiumEffects = { showToast, showLoading, hideLoading, animateCounter, createConfetti, typeWriter };
