/**
 * Login Background Animation
 * Nền động chủ đề công nghệ chi tiêu
 * - Lưới hạt kết nối (particle network)
 * - Các biểu tượng tiền tệ / chi tiêu nổi
 * - Đường kẻ dữ liệu chạy ngang (data streams)
 * - Vòng tròn pulse mờ
 */

(function () {
    'use strict';

    /* ====================================================
       CONFIG
    ==================================================== */
    const CFG = {
        particle: {
            count: 55,
            speedMin: 0.18,
            speedMax: 0.55,
            radiusMin: 1.5,
            radiusMax: 3.5,
            connectDist: 140,
            opacityBase: 0.55,
        },
        icon: {
            symbols: ['₫', '$', '€', '£', '¥', '₩', '💳', '📊', '💰', '📈', '🔐', '💸'],
            count: 14,
            speedMin: 0.12,
            speedMax: 0.32,
            sizeMin: 14,
            sizeMax: 28,
            opacityMin: 0.07,
            opacityMax: 0.22,
        },
        pulse: {
            count: 5,
            maxRadius: 220,
            speed: 0.55,
        },
        stream: {
            count: 8,
            speed: 1.2,
            length: 90,
        },
    };

    /* ====================================================
       THEME COLORS (tự đọc CSS variable)
    ==================================================== */
    function getThemeColors() {
        const dark = document.documentElement.getAttribute('data-theme') !== 'light';
        return dark
            ? {
                  particle: 'rgba(99,102,241,',     // indigo
                  line:     'rgba(99,102,241,',
                  icon:     'rgba(139,92,246,',      // violet
                  pulse:    'rgba(6,182,212,',       // cyan
                  stream:   'rgba(6,182,212,',
              }
            : {
                  particle: 'rgba(90,127,168,',      // slate-blue
                  line:     'rgba(90,127,168,',
                  icon:     'rgba(123,111,168,',     // lavender
                  pulse:    'rgba(59,142,165,',      // teal
                  stream:   'rgba(59,142,165,',
              };
    }

    /* ====================================================
       CANVAS SETUP
    ==================================================== */
    const canvas = document.createElement('canvas');
    canvas.id = 'login-bg-canvas';
    canvas.style.cssText = [
        'position:fixed', 'top:0', 'left:0',
        'width:100%', 'height:100%',
        'pointer-events:none',
        'z-index:0',
        'will-change:transform',
    ].join(';');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

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
            if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
                this.reset();
            }
        }
        draw(colors) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = colors.particle + this.op + ')';
            ctx.fill();
        }
    }

    /* ====================================================
       FLOATING ICONS (emoji / currency symbols)
    ==================================================== */
    class FloatIcon {
        constructor() { this.reset(true); }
        reset(init = false) {
            const c = CFG.icon;
            this.symbol = c.symbols[Math.floor(Math.random() * c.symbols.length)];
            this.x  = Math.random() * W;
            this.y  = init ? Math.random() * H : H + 40;
            this.vy = -(c.speedMin + Math.random() * (c.speedMax - c.speedMin));
            this.vx = (Math.random() - 0.5) * 0.25;
            this.size = c.sizeMin + Math.random() * (c.sizeMax - c.sizeMin);
            this.op  = c.opacityMin + Math.random() * (c.opacityMax - c.opacityMin);
            this.rot = Math.random() * Math.PI * 2;
            this.drot = (Math.random() - 0.5) * 0.008;
        }
        update() {
            this.y  += this.vy;
            this.x  += this.vx;
            this.rot += this.drot;
            if (this.y < -50) this.reset();
        }
        draw(colors) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.op;
            ctx.font = `${this.size}px sans-serif`;
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
    class PulseRing {
        constructor() { this.reset(true); }
        reset(init = false) {
            this.x  = Math.random() * W;
            this.y  = Math.random() * H;
            this.r  = init ? Math.random() * CFG.pulse.maxRadius : 0;
            this.op = 0.35;
        }
        update() {
            this.r  += CFG.pulse.speed;
            this.op -= 0.35 / (CFG.pulse.maxRadius / CFG.pulse.speed);
            if (this.r > CFG.pulse.maxRadius) this.reset();
        }
        draw(colors) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.strokeStyle = colors.pulse + Math.max(0, this.op) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /* ====================================================
       DATA STREAMS (horizontal scanlines)
    ==================================================== */
    class DataStream {
        constructor() { this.reset(true); }
        reset(init = false) {
            const c = CFG.stream;
            this.x   = init ? Math.random() * W : -c.length;
            this.y   = Math.random() * H;
            this.len = 40 + Math.random() * c.length;
            this.spd = c.speed + Math.random() * 1.5;
            this.op  = 0.08 + Math.random() * 0.18;
            this.w   = 0.5 + Math.random() * 1;
        }
        update() {
            this.x += this.spd;
            if (this.x > W + this.len) this.reset();
        }
        draw(colors) {
            const grad = ctx.createLinearGradient(this.x - this.len, 0, this.x, 0);
            grad.addColorStop(0, colors.stream + '0)');
            grad.addColorStop(0.5, colors.stream + this.op + ')');
            grad.addColorStop(1, colors.stream + '0)');
            ctx.beginPath();
            ctx.moveTo(this.x - this.len, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.w;
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

    /* ====================================================
       DRAW PARTICLE CONNECTIONS
    ==================================================== */
    function drawConnections(colors) {
        const dist2 = CFG.particle.connectDist ** 2;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d2 = dx * dx + dy * dy;
                if (d2 < dist2) {
                    const alpha = (1 - d2 / dist2) * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = colors.line + alpha + ')';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
    }

    /* ====================================================
       ANIMATION LOOP
    ==================================================== */
    let raf;
    function loop() {
        ctx.clearRect(0, 0, W, H);
        const colors = getThemeColors();

        // Pulses (behind everything)
        pulses.forEach(p => { p.update(); p.draw(colors); });

        // Data streams
        streams.forEach(s => { s.update(); s.draw(colors); });

        // Connections between particles
        drawConnections(colors);

        // Particles
        particles.forEach(p => { p.update(); p.draw(colors); });

        // Floating icons (on top)
        icons.forEach(ic => { ic.update(); ic.draw(colors); });

        raf = requestAnimationFrame(loop);
    }
    loop();

    /* ====================================================
       PAUSE when tab is hidden (battery saver)
    ==================================================== */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(raf);
        } else {
            loop();
        }
    });

})();
