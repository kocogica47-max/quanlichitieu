/**
 * Premium Effects & Interactions - MOBILE OPTIMIZED
 * Các hiệu ứng nâng cao cho giao diện (Đã tối ưu cho điện thoại)
 */

// Detect mobile device
const isMobile = window.innerWidth < 768;

// 1. Ripple Effect cho tất cả buttons
function initRippleEffect() {
    document.querySelectorAll('.btn, .btn-gradient-cyan, .btn-tech-primary, .btn-tech-cyan').forEach(button => {
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// 2. Number Counter Animation
function animateCounter(element, target, duration = 2000) {
    if (!element) return;
    
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString('vi-VN') + ' đ';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString('vi-VN') + ' đ';
        }
    }, 16);
}

// 3. Smooth Scroll Reveal (DISABLED ON MOBILE for performance)
function initScrollReveal() {
    // Disable on mobile for better performance
    if (isMobile) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Unobserve after animation to save resources
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.tech-card, .mobile-card-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
}

// 4. Toast Notification System (Optimized backdrop-filter for mobile)
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#06b6d4',
        warning: '#f59e0b'
    };
    
    // Reduce blur on mobile for better performance
    const blurAmount = isMobile ? '8px' : '20px';
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--dropdown-bg, rgba(30, 41, 59, 0.95));
        backdrop-filter: blur(${blurAmount});
        border: 1px solid ${colors[type]};
        border-radius: 16px;
        padding: 16px 24px;
        box-shadow: var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.4));
        z-index: 9999;
        color: var(--text-primary, #f8fafc);
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
    `;
    
    toast.innerHTML = `
        <span style="font-size: 20px; color: ${colors[type]};">${icons[type]}</span>
        <span style="flex: 1;">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 5. Loading Spinner (Optimized for mobile)
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading-overlay';
    
    // Reduce blur on mobile
    const blurAmount = isMobile ? '5px' : '10px';
    
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--overlay-bg, rgba(10, 14, 39, 0.8));
        backdrop-filter: blur(${blurAmount});
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
    
    loading.innerHTML = `
        <div style="
            width: 50px;
            height: 50px;
            border: 3px solid var(--card-border, rgba(99, 102, 241, 0.15));
            border-top-color: var(--accent-primary, #6366f1);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
    `;
    
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) loading.remove();
}

// 6. Parallax Effect (DISABLED ON MOBILE for performance)
function initParallax() {
    // Only enable on desktop
    if (isMobile) return;
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const parallaxElements = document.querySelectorAll('.tech-card');
                
                parallaxElements.forEach((el, index) => {
                    const speed = 0.05 * (index + 1);
                    el.style.transform = `translateY(${scrolled * speed}px)`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    });
}

// 7. Typing Effect
function typeWriter(element, text, speed = 50) {
    if (!element) return;
    
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// 8. Confetti Effect (Optimized for mobile - reduced count)
function createConfetti() {
    const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'];
    // Reduce confetti count on mobile (15 vs 50)
    const confettiCount = isMobile ? 15 : 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            opacity: 1;
            transform: rotate(${Math.random() * 360}deg);
            animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
            z-index: 99999;
        `;
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

// 9. Smooth Page Transitions (DISABLED ON MOBILE for performance)
function initPageTransitions() {
    // Disable on mobile for better performance
    if (isMobile) return;
    
    document.querySelectorAll('a:not([target="_blank"])').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
}

// 10. Initialize all effects
function initPremiumEffects() {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-animation {
            to { transform: scale(4); opacity: 0; }
        }
        
        @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes confetti-fall {
            to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #6366f1, #8b5cf6);
            border-radius: 10px;
            border: 2px solid rgba(15, 23, 42, 0.5);
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #818cf8, #a78bfa);
        }

        [data-theme="light"] ::-webkit-scrollbar-track {
            background: rgba(238, 242, 255, 0.6);
        }

        [data-theme="light"] ::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #5b5fc7, #7c3aed);
            border-color: rgba(238, 242, 255, 0.6);
        }

        [data-theme="light"] ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #4338ca, #6d28d9);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize effects
    initRippleEffect();
    initScrollReveal();
    
    // Fade in page on load (faster on mobile: 0.3s vs 0.5s)
    const fadeInDuration = isMobile ? '0.3s' : '0.5s';
    document.body.style.opacity = '0';
    window.addEventListener('load', () => {
        document.body.style.transition = `opacity ${fadeInDuration} ease`;
        document.body.style.opacity = '1';
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumEffects);
} else {
    initPremiumEffects();
}

// Export functions for manual use
window.PremiumEffects = {
    showToast,
    showLoading,
    hideLoading,
    animateCounter,
    createConfetti,
    typeWriter
};
