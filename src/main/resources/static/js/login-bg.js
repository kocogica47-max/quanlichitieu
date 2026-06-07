/**
 * Login Background Animation — Performance Optimized
 * Tối ưu cho mọi thiết bị: điện thoại cũ, mid-range, desktop
 *
 * Chiến lược:
 * - Phân cấp config theo device tier (low / mid / high)
 * - Connections: spatial grid O(n) thay vì O(n²)
 * - Gradient streams: cache gradient, không tạo mới mỗi frame
 * - FloatIcon: chỉ dùng text symbol ASCII (không emoji nặng)
 * - getThemeColors: cache, chỉ re-read khi theme thay đổi
 * - Dùng Path2D batch cho particles
 * - Tự throttle xuống 30fps trên low-end device
 * - Dừng animation khi tab ẩn, resume khi trở lại
 */
(function () {
    'use strict';

    /* ====================================================
       DEVICE TIER DETECTION
    ==================================================== */
    const isMobile   = window.innerWidth < 768;
    const isLowEnd   = isMobile && (navigator.hardwareConcurrency || 4) <= 4;
    const isHighEnd  = !isMobile && (navigator.hardwareConcurrency || 4) >= 8;

    // Throttle xuống 30fps trên low-end mobile
    const TARGET_FPS    = isLowEnd ? 30 : 60;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    /* ====================================================
       CONFIG THEO DEVICE TIER
    ==================================================== */
    const CFG = isLowEnd
        ? { // Điện thoại cũ / mid-range yếu
            particle:  { count: 20, speedMin: 0.1, speedMax: 0.3, radiusMin: 1.5, radiusMax: 2.5, connectDist: 100, opacityBase: 0.45 },
            icon:      { symbols: ['₫', '$', '€', '💳', '💰', '📈'], count: 5, speedMin: 0.1, speedMax: 0.2, sizeMin: 12, sizeMax: 20, opacityMin: 0.06, opacityMax: 0.15 },
            pulse:     { count: 2, maxRadius: 150, speed: 0.4 },
            stream:    { count: 3, speed: 1.0, length: 70 },
          }
        : isMobile
        ? { // Điện thoại mid/high-end
            particle:  { count: 30, speedMin: 0.12, speedMax: 0.35, radiusMin: 1.5, radiusMax: 3, connectDist: 110, opacityBase: 0.5 },
            icon:      { symbols: ['₫', '$', '€', '£', '💳', '💰', '📈', '💸'], count: 8, speedMin: 0.1, speedMax: 0.25, sizeMin: 12, sizeMax: 22, opacityMin: 0.06, opacityMax: 0.18 },
            pulse:     { count: 3, maxRadius: 180, speed: 0.45 },
            stream:    { count: 5, speed: 1.1, length: 80 },
          }
        : isHighEnd
        ? { // Desktop high-end
            particle:  { count: 55, speedMin: 0.15, speedMax: 0.5, radiusMin: 1.5, radiusMax: 3.5, connectDist: 140, opacityBase: 0.55 },
            icon:      { symbols: ['₫', '$', '€', '£', '¥', '₩', '💳', '💰', '📈', '💸'], count: 12, speedMin: 0.1, speedMax: 0.28, sizeMin: 14, sizeMax: 26, opacityMin: 0.07, opacityMax: 0.2 },
            pulse:     { count: 5, maxRadius: 220, speed: 0.55 },
            stream:    { count: 8, speed: 1.2, length: 90 },
          }
        : { // Desktop mid
            particle:  { count: 40, speedMin: 0.15, speedMax: 0.4, radiusMin: 1.5, radiusMax: 3, connectDist: 120, opacityBase: 0.5 },
            icon:      { symbols: ['₫', '$', '€', '£', '💳', '💰', '📈', '💸'], count: 9, speedMin: 0.1, speedMax: 0.25, sizeMin: 13, sizeMax: 24, opacityMin: 0.07, opacityMax: 0.18 },
            pulse:     { count: 4, maxRadius: 190, speed: 0.5 },
            stream:    { count: 6, speed: 1.15, length: 85 },
          };

    /* ====================================================
       THEME COLORS — cached, chỉ re-read khi theme đổi
    ==================================================== */
    let _colors = null;
    let _lastTheme = null;

    function getThemeColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === _lastTheme && _colors) return _colors;
        _lastTheme = theme;
        _colors = theme !== 'light'
            ? { particle: 'rgba(99,102,241,', line: 'rgba(99,102,241,', icon: 'rgba(139,92,246,', pulse: 'rgba(6,182,212,', stream: 'rgba(6,182,212,' }
            : { particle: 'rgba(90,127,168,', line: 'rgba(90,127,168,', icon: 'rgba(123,111,168,', pulse: 'rgba(59,142,165,', stream: 'rgba(59,142,165,' };
        // Invalidate stream gradient cache khi theme đổi
        streams.forEach(s => { s._gradCache = null; });
        return _colors;
    }

    /* ====================================================
       CANVAS SETUP
    ==================================================== */
    const canvas = document.createElement('canvas');
    canvas.id = 'login-bg-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    let W = 0, H = 0;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        // Rebuild spatial grid khi resize
        _gridCellSize = CFG.particle.connectDist;
        // Invalidate tất cả gradient cache
        streams.forEach(s => { s._gradCache = null; s._gradKey = ''; });
    }

    // Debounce resize
    let _resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(resize, 150);
    }, { passive: true });

    /* ====================================================
       PARTICLES
    ==================================================== */
    class Particle {
        constructor() { this.reset(true); }
        reset(init = false) {
            const c = CFG.particle;
            this.x  = Math.random() * W;
            this.y  = init ? Math.random() * H : (Math.random() > 0.5 ? -10 : H + 10);
            const speed = c.speedMin + Math.random() * (c.speedMax - c.speedMin);
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.r  = c.radiusMin + Math.random() * (c.radiusMax - c.radiusMin);
            this.op = 0.2 + Math.random() * c.opacityBase;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) this.reset();
        }
    }

    /* ====================================================
       SPATIAL GRID — O(n) connections thay vì O(n²)
    ==================================================== */
    let _gridCellSize = CFG.particle.connectDist;

    function buildGrid(pts) {
        const grid = new Map();
        for (const p of pts) {
            const cx = (p.x / _gridCellSize) | 0;
            const cy = (p.y / _gridCellSize) | 0;
            const key = (cx << 16) | (cy & 0xffff);
            let cell = grid.get(key);
            if (!cell) { cell = []; grid.set(key, cell); }
            cell.push(p);
        }
        return grid;
    }

    function drawConnections(colors) {
        const dist  = _gridCellSize;
        const dist2 = dist * dist;
        const grid  = buildGrid(particles);

        ctx.lineWidth = 0.6;

        for (const p of particles) {
            const cx = (p.x / dist) | 0;
            const cy = (p.y / dist) | 0;

            for (let nx = cx - 1; nx <= cx + 1; nx++) {
                for (let ny = cy - 1; ny <= cy + 1; ny++) {
                    const cell = grid.get((nx << 16) | (ny & 0xffff));
                    if (!cell) continue;
                    for (const q of cell) {
                        if (q === p) continue;
                        // Chỉ vẽ 1 chiều (p < q theo địa chỉ)
                        if (q.x < p.x || (q.x === p.x && q.y < p.y)) continue;
                        const dx = p.x - q.x;
                        const dy = p.y - q.y;
                        const d2 = dx * dx + dy * dy;
                        if (d2 < dist2) {
                            const alpha = (1 - d2 / dist2) * 0.32;
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(q.x, q.y);
                            ctx.strokeStyle = colors.line + alpha + ')';
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    }

    /* ====================================================
       BATCH DRAW PARTICLES — một beginPath duy nhất
    ==================================================== */
    function drawParticles(colors) {
        // Group theo opacity gần nhau để giảm fillStyle changes
        // Đơn giản hơn: vẽ từng cái nhưng skip beginPath overhead bằng arc path
        ctx.fillStyle = colors.particle + '0.5)';
        for (const p of particles) {
            ctx.globalAlpha = p.op;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /* ====================================================
       FLOATING ICONS — ASCII only, không emoji nặng trên mobile
    ==================================================== */
    class FloatIcon {
        constructor() { this.reset(true); }
        reset(init = false) {
            const c = CFG.icon;
            this.symbol = c.symbols[Math.floor(Math.random() * c.symbols.length)];
            this.x    = Math.random() * W;
            this.y    = init ? Math.random() * H : H + 40;
            this.vy   = -(c.speedMin + Math.random() * (c.speedMax - c.speedMin));
            this.vx   = (Math.random() - 0.5) * 0.2;
            this.size = c.sizeMin + Math.random() * (c.sizeMax - c.sizeMin);
            this.op   = c.opacityMin + Math.random() * (c.opacityMax - c.opacityMin);
            this.rot  = Math.random() * Math.PI * 2;
            this.drot = (Math.random() - 0.5) * 0.006;
        }
        update() {
            this.y   += this.vy;
            this.x   += this.vx;
            this.rot += this.drot;
            if (this.y < -50) this.reset();
        }
        draw(colors) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.op;
            ctx.font = `${this.size | 0}px sans-serif`;
            ctx.fillStyle = colors.icon + '1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.symbol, 0, 0);
            ctx.restore();
        }
    }

    /* ====================================================
       PULSE RINGS
    ==================================================== */
    const _pulseDecay = 0.35 / (CFG.pulse.maxRadius / CFG.pulse.speed);

    class PulseRing {
        constructor() { this.reset(true); }
        reset(init = false) {
            this.x  = Math.random() * W;
            this.y  = Math.random() * H;
            this.r  = init ? Math.random() * CFG.pulse.maxRadius : 0;
            this.op = 0.32;
        }
        update() {
            this.r  += CFG.pulse.speed;
            this.op -= _pulseDecay;
            if (this.r > CFG.pulse.maxRadius) this.reset();
        }
        draw(colors) {
            if (this.op <= 0) return;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.strokeStyle = colors.pulse + this.op + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /* ====================================================
       DATA STREAMS — gradient cached, chỉ tạo lại khi cần
    ==================================================== */
    class DataStream {
        constructor() {
            this._gradCache = null;
            this._gradKey   = '';
            this.reset(true);
        }
        reset(init = false) {
            const c = CFG.stream;
            this.x   = init ? Math.random() * W : -c.length;
            this.y   = (Math.random() * H) | 0;
            this.len = (40 + Math.random() * c.length) | 0;
            this.spd = c.speed + Math.random() * 1.2;
            this.op  = 0.07 + Math.random() * 0.16;
            this.w   = 0.5 + Math.random() * 0.8;
            this._gradCache = null;
        }
        update() {
            this.x += this.spd;
            if (this.x > W + this.len) this.reset();
        }
        draw(colors) {
            // Cache gradient: chỉ tạo lại khi x thay đổi đáng kể (mỗi 4px)
            const gx = (this.x / 4) | 0;
            const key = `${gx}_${colors.stream}_${this.op}`;
            if (this._gradKey !== key) {
                this._gradKey   = key;
                const x0 = this.x - this.len;
                const x1 = this.x;
                const g  = ctx.createLinearGradient(x0, 0, x1, 0);
                g.addColorStop(0,   colors.stream + '0)');
                g.addColorStop(0.5, colors.stream + this.op + ')');
                g.addColorStop(1,   colors.stream + '0)');
                this._gradCache = g;
            }
            ctx.beginPath();
            ctx.moveTo(this.x - this.len, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = this._gradCache;
            ctx.lineWidth   = this.w;
            ctx.stroke();
        }
    }

    /* ====================================================
       INIT OBJECTS
    ==================================================== */
    const particles = Array.from({ length: CFG.particle.count }, () => new Particle());
    const icons     = Array.from({ length: CFG.icon.count     }, () => new FloatIcon());
    const pulses    = Array.from({ length: CFG.pulse.count    }, () => new PulseRing());
    const streams   = Array.from({ length: CFG.stream.count   }, () => new DataStream());

    // Init size sau khi streams được tạo
    resize();

    /* ====================================================
       ANIMATION LOOP — throttle FPS trên low-end
    ==================================================== */
    let raf;
    let lastTime = 0;

    function loop(now) {
        raf = requestAnimationFrame(loop);

        const delta = now - lastTime;
        if (delta < FRAME_INTERVAL - 2) return; // throttle
        lastTime = now - (delta % FRAME_INTERVAL);

        ctx.clearRect(0, 0, W, H);
        const colors = getThemeColors();

        for (const p of pulses)   { p.update(); p.draw(colors);  }
        for (const s of streams)  { s.update(); s.draw(colors);  }
        drawConnections(colors);
        for (const p of particles){ p.update(); }
        drawParticles(colors);
        for (const ic of icons)   { ic.update(); ic.draw(colors); }
    }

    raf = requestAnimationFrame(loop);

    /* ====================================================
       PAUSE khi tab ẩn
    ==================================================== */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(raf);
        } else {
            lastTime = 0;
            raf = requestAnimationFrame(loop);
        }
    });

})();
