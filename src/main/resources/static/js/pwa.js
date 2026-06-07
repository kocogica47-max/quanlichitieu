/**
 * PWA Bootstrap — Quản Lý Chi Tiêu
 * - Register Service Worker
 * - Handle "Add to Home Screen" install prompt
 * - Show install banner sau 3 giây nếu chưa install
 */
(function () {
    'use strict';

    /* ── 1. Register Service Worker ─────────────────────────────────────── */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/' })
                .then(reg => {
                    console.log('[PWA] Service Worker registered:', reg.scope);

                    // Kiểm tra update
                    reg.addEventListener('updatefound', () => {
                        const worker = reg.installing;
                        worker.addEventListener('statechange', () => {
                            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateBanner();
                            }
                        });
                    });
                })
                .catch(err => console.warn('[PWA] SW registration failed:', err));
        });
    }

    /* ── 2. Install Prompt (Android Chrome / Edge) ───────────────────────── */
    let deferredPrompt = null;
    let installBanner  = null;

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;

        // Không hiện nữa nếu đã dismiss trong 7 ngày
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

        // Chờ 3 giây rồi hiện banner
        setTimeout(showInstallBanner, 3000);
    });

    // Ẩn banner khi đã install
    window.addEventListener('appinstalled', () => {
        if (installBanner) installBanner.remove();
        deferredPrompt = null;
        localStorage.removeItem('pwa-install-dismissed');
        showToastPWA('✓ Đã cài đặt ứng dụng thành công!', '#10b981');
    });

    function showInstallBanner() {
        if (!deferredPrompt || installBanner) return;

        installBanner = document.createElement('div');
        installBanner.id = 'pwa-install-banner';
        installBanner.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;flex:1">
                <img src="/icons/icon-72.png" width="44" height="44" 
                     style="border-radius:10px;flex-shrink:0"
                     onerror="this.style.display='none'">
                <div>
                    <div style="font-weight:700;font-size:.92rem;color:var(--text-primary,#f1f5f9)">
                        Cài đặt ứng dụng
                    </div>
                    <div style="font-size:.78rem;color:var(--text-muted,#94a3b8);margin-top:2px">
                        Thêm vào màn hình chính để dùng nhanh hơn
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0">
                <button id="pwa-install-btn" style="
                    background:linear-gradient(135deg,#6366f1,#4f46e5);
                    color:#fff;border:none;border-radius:9px;
                    padding:8px 16px;font-size:.83rem;font-weight:600;
                    cursor:pointer;white-space:nowrap">
                    Cài đặt
                </button>
                <button id="pwa-dismiss-btn" style="
                    background:rgba(255,255,255,.08);color:var(--text-muted,#94a3b8);
                    border:1px solid rgba(255,255,255,.1);border-radius:9px;
                    padding:8px 12px;font-size:.83rem;cursor:pointer">
                    ✕
                </button>
            </div>
        `;

        Object.assign(installBanner.style, {
            position:     'fixed',
            bottom:       '16px',
            left:         '50%',
            transform:    'translateX(-50%) translateY(120px)',
            width:        'calc(100% - 32px)',
            maxWidth:     '480px',
            background:   'var(--dropdown-bg, rgba(30,41,59,.97))',
            border:       '1px solid rgba(99,102,241,.35)',
            borderRadius: '16px',
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
            boxShadow:    '0 8px 32px rgba(0,0,0,.5)',
            zIndex:       '9998',
            backdropFilter: 'blur(16px)',
            transition:   'transform .4s cubic-bezier(0.34,1.56,0.64,1)',
        });

        document.body.appendChild(installBanner);

        // Slide in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                installBanner.style.transform = 'translateX(-50%) translateY(0)';
            });
        });

        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            dismissBanner();
        });

        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
            localStorage.setItem('pwa-install-dismissed', Date.now().toString());
            dismissBanner();
        });
    }

    function dismissBanner() {
        if (!installBanner) return;
        installBanner.style.transform = 'translateX(-50%) translateY(120px)';
        setTimeout(() => { if (installBanner) { installBanner.remove(); installBanner = null; } }, 400);
    }

    /* ── 3. Update Banner ────────────────────────────────────────────────── */
    function showUpdateBanner() {
        const banner = document.createElement('div');
        banner.innerHTML = `
            <span style="flex:1;font-size:.85rem;color:var(--text-primary,#f1f5f9)">
                🔄 Có phiên bản mới
            </span>
            <button onclick="window.location.reload()" style="
                background:linear-gradient(135deg,#06b6d4,#0e7490);
                color:#fff;border:none;border-radius:8px;
                padding:7px 14px;font-size:.8rem;font-weight:600;cursor:pointer">
                Cập nhật
            </button>
        `;
        Object.assign(banner.style, {
            position:     'fixed',
            top:          '16px',
            left:         '50%',
            transform:    'translateX(-50%)',
            background:   'var(--dropdown-bg, rgba(30,41,59,.97))',
            border:       '1px solid rgba(6,182,212,.35)',
            borderRadius: '12px',
            padding:      '12px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
            zIndex:       '9999',
            boxShadow:    '0 6px 24px rgba(0,0,0,.4)',
            backdropFilter: 'blur(12px)',
            width:        'calc(100% - 32px)',
            maxWidth:     '400px',
        });
        document.body.appendChild(banner);
    }

    /* ── 4. Toast helper (standalone, không phụ thuộc PremiumEffects) ────── */
    function showToastPWA(msg, color) {
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position:     'fixed',
            top:          '20px',
            right:        '20px',
            background:   color || '#6366f1',
            color:        '#fff',
            borderRadius: '12px',
            padding:      '12px 18px',
            fontSize:     '.88rem',
            fontWeight:   '600',
            zIndex:       '9999',
            boxShadow:    '0 4px 16px rgba(0,0,0,.3)',
            animation:    'pwa-toast-in .3s ease forwards',
        });
        document.head.insertAdjacentHTML('beforeend',
            '<style>@keyframes pwa-toast-in{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}</style>');
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    /* ── 5. iOS "Add to Home Screen" hint ───────────────────────────────── */
    // iOS Safari không hỗ trợ beforeinstallprompt nên cần hint manual
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || ('standalone' in navigator && navigator.standalone);

    if (isIOS && !isStandalone) {
        const dismissed = localStorage.getItem('pwa-ios-dismissed');
        if (!dismissed || Date.now() - parseInt(dismissed) > 14 * 24 * 60 * 60 * 1000) {
            setTimeout(() => {
                const hint = document.createElement('div');
                hint.innerHTML = `
                    <div style="font-size:.88rem;color:var(--text-primary,#f1f5f9);font-weight:600;margin-bottom:6px">
                        📱 Cài đặt ứng dụng trên iPhone
                    </div>
                    <div style="font-size:.8rem;color:var(--text-muted,#94a3b8);line-height:1.55">
                        Nhấn <strong style="color:#06b6d4">Chia sẻ</strong> 
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.5" style="vertical-align:middle"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> 
                        rồi chọn <strong style="color:#06b6d4">"Thêm vào Màn hình chính"</strong>
                    </div>
                    <button id="ios-hint-close" style="
                        position:absolute;top:10px;right:12px;
                        background:none;border:none;color:#64748b;
                        font-size:1rem;cursor:pointer;padding:4px">✕</button>
                `;
                Object.assign(hint.style, {
                    position:     'fixed',
                    bottom:       '20px',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    width:        'calc(100% - 32px)',
                    maxWidth:     '420px',
                    background:   'var(--dropdown-bg, rgba(30,41,59,.97))',
                    border:       '1px solid rgba(99,102,241,.3)',
                    borderRadius: '14px',
                    padding:      '14px 36px 14px 16px',
                    zIndex:       '9998',
                    boxShadow:    '0 8px 30px rgba(0,0,0,.4)',
                    backdropFilter: 'blur(14px)',
                });
                document.body.appendChild(hint);
                document.getElementById('ios-hint-close').onclick = () => {
                    localStorage.setItem('pwa-ios-dismissed', Date.now().toString());
                    hint.remove();
                };
            }, 4000);
        }
    }

})();
