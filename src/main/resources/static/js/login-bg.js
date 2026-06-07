/**
 * Finance Tech Background — Cinematic Edition
 *
 * Visual layers (back → front):
 *   1. Orbs       — large glowing blobs drifting slowly (radial gradient)
 *   2. Grid       — subtle perspective grid lines
 *   3. Nodes      — particle network with smooth eased connections
 *   4. Streams    — horizontal light streaks
 *   5. Symbols    — currency glyphs fading in/out with sine bob
 *
 * Performance:
 *   - Device tier: low / mid / high  → particle counts scaled
 *   - 30 fps cap on low-end mobile
 *   - O(n) spatial-grid for connections
 *   - Off-screen canvas for orbs (repaint only on resize)
 *   - Theme color cache (read DOM only on change)
 *   - visibilitychange pause/resume
 */
(function () {
    'use strict';

    /* ─────────────────────────────────────────────
       DEVICE TIER
    ───────────────────────────────────────────── */
    const W0     = window.innerWidth;
    const cores  = navigator.hardwareConcurrency || 4;
    const MOBILE = W0 < 768;
    const LOW    = MOBILE && cores <= 4;
    const HIGH   = !MOBILE && cores >= 8;

    const FPS      = LOW ? 30 : 60;
    const INTERVAL = 1000 / FPS;

    /* ─────────────────────────────────────────────
       TIER CONFIG
    ───────────────────────────────────────────── */
    const T = LOW ? {
        nodes:   22, connectR: 95,  streams: 3,  orbs: 2, symbols: 4,
    } : MOBILE ? {
        nodes:   35, connectR: 110, streams: 5,  orbs: 3, symbols: 6,
    } : HIGH ? {
        nodes:   65, connectR: 150, streams: 9,  orbs: 5, symbols: 10,
    } : {
        nodes:   45, connectR: 125, streams: 7,  orbs: 4, symbols: 8,
    };

    /* ─────────────────────────────────────────────
       THEME COLORS — cached
    ───────────────────────────────────────────── */
    let _theme = null, _pal = null;

    function pal() {
        const t = document.documentElement.getAttribute('data-theme') || 'dark';
        if (t === _theme) return _pal;
        _theme = t;
        const dark = t !== 'light';
        _pal = dark ? {
            orb1:   [99,  102, 241],   // indigo
            orb2:   [139,  92, 246],   // violet
            orb3:   [6,   182, 212],   // cyan
            node:   [99,  102, 241],
            line:   [99,  102, 241],
            stream: [6,   182, 212],
            sym:    [139,  92, 246],
            grid:   [99,  102, 241],
        } : {
            orb1:   [90,  127, 168],
            orb2:   [123, 111, 168],
            orb3:   [59,  142, 165],
            node:   [90,  127, 168],
            line:   [90,  127, 168],
            stream: [59,  142, 165],
            sym:    [123, 111, 168],
            grid:   [90,  127, 168],
        };
        orbsDirty = true;   // force orb canvas redraw on theme change
        return _pal;
    }

    function rgba([r,g,b], a) { return `rgba(${r},${g},${b},${a})`; }

    /* ─────────────────────────────────────────────
       CANVAS
    ───────────────────────────────────────────── */
    const cv  = document.createElement('canvas');
    cv.id     = 'login-bg-canvas';
    cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
    document.body.prepend(cv);
    const cx  = cv.getContext('2d', { alpha: true, desynchronized: true });

    // Off-screen canvas for orbs (expensive radial gradients)
    const orbCv = document.createElement('canvas');
    const orbCx = orbCv.getContext('2d');
    let orbsDirty = true;

    let W = 0, H = 0;

    function resize() {
        W = cv.width  = window.innerWidth;
        H = cv.height = window.innerHeight;
        orbCv.width   = W;
        orbCv.height  = H;
        orbsDirty     = true;
        gridDirty     = true;
        _cellSize     = T.connectR;
        streams.forEach(s => s.invalidate());
    }

    let _rt;
    window.addEventListener('resize', () => {
        clearTimeout(_rt);
        _rt = setTimeout(resize, 160);
    }, { passive: true });

    /* ─────────────────────────────────────────────
       LAYER 1 — AMBIENT ORBS  (off-screen, slow)
    ───────────────────────────────────────────── */
    const orbData = Array.from({ length: T.orbs }, (_, i) => ({
        px: 0.15 + Math.random() * 0.7,   // relative x anchor
        py: 0.15 + Math.random() * 0.7,
        r:  LOW ? 200 : (MOBILE ? 260 : 380) + i * 40,
        colorKey: i % 3,                   // which orb color
        phase:  Math.random() * Math.PI * 2,
        dphase: 0.0002 + Math.random() * 0.0003,
        amp:    0.04 + Math.random() * 0.04,
    }));

    let orbsDirty2 = false; // secondary dirty for position drift

    function updateOrbs(t) {
        let moved = false;
        for (const o of orbData) {
            const prev = o.phase;
            o.phase += o.dphase;
            // only repaint orbs every ~90 frames to keep off-screen cheap
            if (((o.phase * 100) | 0) !== ((prev * 100) | 0)) moved = true;
        }
        return moved;
    }

    function paintOrbs(p) {
        orbCx.clearRect(0, 0, W, H);
        const keys = ['orb1', 'orb2', 'orb3'];
        for (const o of orbData) {
            const ox = (o.px + Math.sin(o.phase) * o.amp) * W;
            const oy = (o.py + Math.cos(o.phase * 0.7) * o.amp) * H;
            const [r,g,b] = p[keys[o.colorKey]];
            const grd = orbCx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
            grd.addColorStop(0,   `rgba(${r},${g},${b},0.13)`);
            grd.addColorStop(0.4, `rgba(${r},${g},${b},0.06)`);
            grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
            orbCx.fillStyle = grd;
            orbCx.fillRect(0, 0, W, H);
        }
    }

    /* ─────────────────────────────────────────────
       LAYER 2 — PERSPECTIVE GRID
    ───────────────────────────────────────────── */
    const gridCv = document.createElement('canvas');
    const gridCx = gridCv.getContext('2d');
    let gridDirty = true;

    function paintGrid(p) {
        gridCv.width  = W;
        gridCv.height = H;
        const c = gridCx;
        c.clearRect(0, 0, W, H);

        const vp = { x: W / 2, y: H * 0.55 };   // vanishing point
        const [r,g,b] = p.grid;
        const baseA = LOW ? 0.025 : 0.04;

        // Horizontal lines (perspective spacing)
        const lines = LOW ? 8 : (MOBILE ? 10 : 14);
        for (let i = 0; i <= lines; i++) {
            const t  = i / lines;
            const yt = H * 0.45 + t * H * 0.55;   // from mid to bottom
            const xw = (t * t) * W * 0.95;          // perspective width
            const a  = baseA * (0.2 + t * 0.8);
            c.beginPath();
            c.moveTo(vp.x - xw / 2, yt);
            c.lineTo(vp.x + xw / 2, yt);
            c.strokeStyle = `rgba(${r},${g},${b},${a})`;
            c.lineWidth   = 0.5;
            c.stroke();
        }

        // Vertical converging lines
        const vlines = LOW ? 7 : (MOBILE ? 9 : 13);
        for (let i = 0; i <= vlines; i++) {
            const t   = i / vlines;
            const xb  = W * 0.025 + t * W * 0.95;
            const a   = baseA * (0.5 + Math.abs(t - 0.5) * 0.8);
            c.beginPath();
            c.moveTo(vp.x, vp.y);
            c.lineTo(xb, H);
            c.strokeStyle = `rgba(${r},${g},${b},${a})`;
            c.lineWidth   = 0.5;
            c.stroke();
        }

        gridDirty = false;
    }

    /* ─────────────────────────────────────────────
       LAYER 3 — NODES + CONNECTIONS
    ───────────────────────────────────────────── */
    class Node {
        constructor(init) {
            this.x  = Math.random() * (W || window.innerWidth);
            this.y  = init ? Math.random() * (H || window.innerHeight)
                           : (Math.random() > 0.5 ? -12 : (H || window.innerHeight) + 12);
            const spd = 0.12 + Math.random() * (LOW ? 0.22 : 0.38);
            const ang = Math.random() * Math.PI * 2;
            this.vx  = Math.cos(ang) * spd;
            this.vy  = Math.sin(ang) * spd;
            this.r   = 1.4 + Math.random() * (LOW ? 1.4 : 2.0);
            this.op  = 0.25 + Math.random() * 0.5;
            // subtle twinkle
            this.tph = Math.random() * Math.PI * 2;
            this.tspd = 0.02 + Math.random() * 0.03;
        }
        update() {
            this.x   += this.vx;
            this.y   += this.vy;
            this.tph += this.tspd;
            if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
                // respawn from edges
                const side = Math.floor(Math.random() * 4);
                this.x = side === 0 ? -12 : side === 1 ? W + 12
                       : Math.random() * W;
                this.y = side === 2 ? -12 : side === 3 ? H + 12
                       : Math.random() * H;
            }
        }
        get opacity() { return this.op * (0.7 + 0.3 * Math.sin(this.tph)); }
    }

    let _cellSize = T.connectR;
    const nodes = Array.from({ length: T.nodes }, (_, i) => new Node(true));

    function buildGrid() {
        const g = new Map();
        for (const n of nodes) {
            const cx = (n.x / _cellSize) | 0;
            const cy = (n.y / _cellSize) | 0;
            const k  = (cx << 16) | (cy & 0xffff);
            let cell = g.get(k);
            if (!cell) { cell = []; g.set(k, cell); }
            cell.push(n);
        }
        return g;
    }

    function drawNodes(p) {
        const grid  = buildGrid();
        const dist2 = _cellSize * _cellSize;
        const [lr,lg,lb] = p.line;
        const [nr,ng,nb] = p.node;

        // connections first
        cx.save();
        for (const n of nodes) {
            const gx = (n.x / _cellSize) | 0;
            const gy = (n.y / _cellSize) | 0;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const cell = grid.get(((gx+dx) << 16) | ((gy+dy) & 0xffff));
                    if (!cell) continue;
                    for (const q of cell) {
                        if (q.x < n.x || (q.x === n.x && q.y <= n.y)) continue;
                        const ddx = n.x - q.x, ddy = n.y - q.y;
                        const d2  = ddx*ddx + ddy*ddy;
                        if (d2 >= dist2) continue;
                        const t   = 1 - d2 / dist2;
                        // alpha eased with smooth step
                        const a   = t * t * (3 - 2*t) * 0.28;
                        cx.beginPath();
                        cx.moveTo(n.x, n.y);
                        cx.lineTo(q.x, q.y);
                        cx.strokeStyle = `rgba(${lr},${lg},${lb},${a})`;
                        cx.lineWidth   = 0.55 + t * 0.4;
                        cx.stroke();
                    }
                }
            }
        }

        // nodes (dots) — single fillStyle per opacity group would be ideal,
        // but per-node twinkle makes it impractical; globalAlpha is compositor-safe
        for (const n of nodes) {
            const op = n.opacity;
            cx.globalAlpha = op;
            cx.beginPath();
            cx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            cx.fillStyle = `rgba(${nr},${ng},${nb},1)`;
            cx.fill();

            // soft glow ring
            if (!LOW && op > 0.4) {
                cx.beginPath();
                cx.arc(n.x, n.y, n.r * 2.4, 0, Math.PI * 2);
                cx.fillStyle = `rgba(${nr},${ng},${nb},0.07)`;
                cx.fill();
            }
        }
        cx.globalAlpha = 1;
        cx.restore();
    }

    /* ─────────────────────────────────────────────
       LAYER 4 — LIGHT STREAMS
    ───────────────────────────────────────────── */
    class Stream {
        constructor(init) {
            this._g = null;
            this.reset(init);
        }
        reset(init = false) {
            const maxLen = LOW ? 80 : 130;
            this.y   = (Math.random() * (H || window.innerHeight)) | 0;
            this.len = (50 + Math.random() * maxLen) | 0;
            this.spd = 1.1 + Math.random() * (LOW ? 1.0 : 1.8);
            this.op  = 0.07 + Math.random() * 0.18;
            this.w   = 0.4 + Math.random() * 1.0;
            this.x   = init ? Math.random() * (W || window.innerWidth) : -(this.len);
            this._g  = null;
            this._gx = -9999;
        }
        invalidate() { this._g = null; }
        update() {
            this.x += this.spd;
            if (this.x > W + this.len) this.reset();
        }
        draw(p) {
            const gxSnap = (this.x / 6) | 0;
            if (!this._g || this._gx !== gxSnap) {
                this._gx = gxSnap;
                const g = cx.createLinearGradient(this.x - this.len, 0, this.x + 4, 0);
                const [r,g2,b] = p.stream;
                g.addColorStop(0,    `rgba(${r},${g2},${b},0)`);
                g.addColorStop(0.55, `rgba(${r},${g2},${b},${this.op})`);
                g.addColorStop(0.85, `rgba(${r},${g2},${b},${this.op * 0.4})`);
                g.addColorStop(1,    `rgba(${r},${g2},${b},0)`);
                this._g = g;
            }
            cx.beginPath();
            cx.moveTo(this.x - this.len, this.y);
            cx.lineTo(this.x + 4, this.y);
            cx.strokeStyle = this._g;
            cx.lineWidth   = this.w;
            cx.stroke();
        }
    }

    const streams = Array.from({ length: T.streams }, (_, i) => new Stream(true));

    /* ─────────────────────────────────────────────
       LAYER 5 — CURRENCY SYMBOLS
    ───────────────────────────────────────────── */
    const SYM_LIST = ['₫', '$', '€', '£', '¥', '₩', '₿', '💳', '📈', '💰'];

    class Symbol {
        constructor(init) { this.reset(init); }
        reset(init = false) {
            this.ch   = SYM_LIST[Math.floor(Math.random() * SYM_LIST.length)];
            this.x    = 0.05 * W + Math.random() * 0.9 * W;
            this.y    = init ? Math.random() * H : H + 30;
            this.vy   = -(0.12 + Math.random() * 0.22);
            this.vx   = (Math.random() - 0.5) * 0.18;
            this.size = (LOW ? 11 : 14) + Math.random() * (LOW ? 10 : 16);
            this.op   = 0.0;          // fade in from 0
            this.maxOp = 0.1 + Math.random() * 0.18;
            this.state = 'in';        // in | hold | out
            this.life  = 180 + Math.random() * 240;
            this.age   = 0;
            this.rot   = (Math.random() - 0.5) * 0.4;
            this.drot  = (Math.random() - 0.5) * 0.004;
            this.bob   = Math.random() * Math.PI * 2;
            this.bobAmp = 0.3 + Math.random() * 0.5;
        }
        update() {
            this.age++;
            this.bob  += 0.025;
            this.rot  += this.drot;
            this.x    += this.vx;
            this.y    += this.vy + Math.sin(this.bob) * this.bobAmp * 0.04;

            if (this.state === 'in') {
                this.op += this.maxOp / 30;
                if (this.op >= this.maxOp) { this.op = this.maxOp; this.state = 'hold'; }
            } else if (this.state === 'hold') {
                if (this.age > this.life) this.state = 'out';
            } else {
                this.op -= this.maxOp / 40;
                if (this.op <= 0) this.reset();
            }

            if (this.y < -40 || this.x < -30 || this.x > W + 30) this.reset();
        }
        draw(p) {
            if (this.op <= 0.005) return;
            cx.save();
            cx.translate(this.x, this.y + Math.sin(this.bob) * this.bobAmp);
            cx.rotate(this.rot);
            cx.globalAlpha = this.op;
            cx.font        = `${this.size | 0}px sans-serif`;
            cx.fillStyle   = rgba(p.sym, 1);
            cx.textAlign   = 'center';
            cx.textBaseline = 'middle';
            cx.fillText(this.ch, 0, 0);
            cx.restore();
        }
    }

    const symbols = Array.from({ length: T.symbols }, (_, i) => new Symbol(true));

    /* ─────────────────────────────────────────────
       INIT & RESIZE
    ───────────────────────────────────────────── */
    resize();

    /* ─────────────────────────────────────────────
       LOOP
    ───────────────────────────────────────────── */
    let raf, lastT = 0, orbTick = 0;

    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = now - lastT;
        if (dt < INTERVAL - 2) return;
        lastT = now - (dt % INTERVAL);

        const p = pal();

        // Orbs: repaint off-screen only when dirty (theme change / resize)
        // OR drift slowly every ~3 seconds
        orbTick++;
        const orbNeedsRepaint = orbsDirty || (orbTick % (FPS * 3) === 0);
        if (orbNeedsRepaint) {
            updateOrbs(now);
            paintOrbs(p);
            orbsDirty = false;
        }

        // Grid: repaint off-screen only on dirty
        if (gridDirty) paintGrid(p);

        // --- main canvas ---
        cx.clearRect(0, 0, W, H);

        // 1. Orbs
        cx.drawImage(orbCv, 0, 0);

        // 2. Grid
        cx.drawImage(gridCv, 0, 0);

        // 3. Streams
        for (const s of streams) { s.update(); s.draw(p); }

        // 4. Nodes + connections
        for (const n of nodes) n.update();
        drawNodes(p);

        // 5. Symbols
        for (const s of symbols) { s.update(); s.draw(p); }
    }

    raf = requestAnimationFrame(loop);

    /* ─────────────────────────────────────────────
       VISIBILITY PAUSE
    ───────────────────────────────────────────── */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(raf);
        } else {
            lastT = 0;
            orbsDirty = gridDirty = true;
            raf = requestAnimationFrame(loop);
        }
    });

})();
