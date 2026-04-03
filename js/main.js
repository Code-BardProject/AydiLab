/**
 * AydiLab - Web Development Agency
 * GSAP & Three.js 3D Animations
 */

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ========================================
// WEBGL BACKGROUND (Three.js)
// ========================================
class WebGLBackground {
    constructor() {
        this.canvas = document.getElementById('webgl-bg');
        if (!this.canvas) return;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Create particles
        this.createParticles();
        
        // Create floating orbs
        this.createOrbs();
        
        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Start animation
        this.animate();
    }
    
    createParticles() {
        const particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        const color1 = new THREE.Color(0xc9a962);
        const color2 = new THREE.Color(0x8b7355);
        
        for (let i = 0; i < particleCount; i++) {
            // Positions - spread across screen
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            
            // Colors - mix of gold and brown
            const mixRatio = Math.random();
            const mixedColor = color1.clone().lerp(color2, mixRatio);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
            
            // Sizes
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Shader material for glowing particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float uTime;
                uniform vec2 uMouse;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Gentle floating animation
                    pos.y += sin(uTime * 0.5 + position.x * 0.1) * 0.5;
                    pos.x += cos(uTime * 0.3 + position.y * 0.1) * 0.3;
                    
                    // Mouse interaction - subtle repulsion
                    float dist = distance(pos.xy, uMouse * 50.0);
                    if (dist < 15.0) {
                        vec2 dir = normalize(pos.xy - uMouse * 50.0);
                        pos.xy += dir * (15.0 - dist) * 0.1;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Circular particle with soft edge
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    // Glow effect
                    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
                    vec3 finalColor = vColor + vec3(glow * 0.3);
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.8);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createOrbs() {
        // Create 3 floating orbs
        const orbGeometry = new THREE.SphereGeometry(1, 32, 32);
        
        this.orbs = [];
        const orbData = [
            { color: 0xc9a962, size: 8, x: -20, y: 10, z: -10 },
            { color: 0x8b7355, size: 6, x: 25, y: -15, z: -20 },
            { color: 0xd4b896, size: 4, x: 15, y: 20, z: -5 }
        ];
        
        orbData.forEach((data, index) => {
            const material = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.15
            });
            
            const orb = new THREE.Mesh(orbGeometry, material);
            orb.position.set(data.x, data.y, data.z);
            orb.scale.set(data.size, data.size, data.size);
            
            // Store initial data for animation
            orb.userData = {
                initialY: data.y,
                initialX: data.x,
                speed: 0.5 + Math.random() * 0.5,
                offset: index * 2
            };
            
            this.orbs.push(orb);
            this.scene.add(orb);
        });
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseMove(e) {
        this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = performance.now() * 0.001;
        
        // Smooth mouse follow
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
        
        // Update particle uniforms
        if (this.particles) {
            this.particles.material.uniforms.uTime.value = time;
            this.particles.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
            
            // Subtle rotation
            this.particles.rotation.y = time * 0.02;
        }
        
        // Animate orbs
        this.orbs.forEach(orb => {
            const data = orb.userData;
            orb.position.y = data.initialY + Math.sin(time * data.speed + data.offset) * 3;
            orb.position.x = data.initialX + Math.cos(time * data.speed * 0.5 + data.offset) * 2;
        });
        
        // Subtle camera movement based on mouse
        this.camera.position.x = this.mouse.x * 2;
        this.camera.position.y = this.mouse.y * 2;
        this.camera.lookAt(0, 0, 0);
        
        this.renderer.render(this.scene, this.camera);
    }
}

// ========================================
// CUSTOM CURSOR
// ========================================
class CustomCursor {
    constructor() {
        this.cursor = document.querySelector('.cursor');
        this.follower = document.querySelector('.cursor-follower');
        
        if (!this.cursor || !this.follower) return;
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        this.posX = 0;
        this.posY = 0;
        this.followerX = 0;
        this.followerY = 0;
        
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.posX = e.clientX;
            this.posY = e.clientY;
        });
        
        this.animate();
        this.initHoverEffects();
    }
    
    animate() {
        this.cursor.style.left = this.posX - 4 + 'px';
        this.cursor.style.top = this.posY - 4 + 'px';
        
        this.followerX += (this.posX - this.followerX) * 0.1;
        this.followerY += (this.posY - this.followerY) * 0.1;
        
        this.follower.style.left = this.followerX - 16 + 'px';
        this.follower.style.top = this.followerY - 16 + 'px';
        
        requestAnimationFrame(() => this.animate());
    }
    
    initHoverEffects() {
        const clickables = document.querySelectorAll('a, button, .service-card, .process-step, .chat-option, .contact-link');
        
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.style.transform = 'scale(2)';
                this.follower.style.transform = 'scale(1.5)';
                this.follower.style.borderColor = 'var(--color-accent)';
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor.style.transform = 'scale(1)';
                this.follower.style.transform = 'scale(1)';
                this.follower.style.borderColor = 'var(--color-accent)';
            });
        });
    }
}

// ========================================
// SCROLL PROGRESS BAR
// ========================================
class ScrollProgress {
    constructor() {
        this.progressBar = document.querySelector('.scroll-progress-bar');
        if (!this.progressBar) return;
        
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            this.progressBar.style.width = progress + '%';
        }, { passive: true });
    }
}

// ========================================
// CHAT MODAL
// ========================================
class ChatModal {
    constructor() {
        this.modal = document.getElementById('chatModal');
        this.toggleBtn = document.getElementById('chatToggle');
        this.closeBtn = document.getElementById('chatModalClose');
        this.overlay = this.modal?.querySelector('.chat-modal-overlay');
        this.contactTrigger = document.getElementById('contactChatTrigger');
        
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.open());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        if (this.contactTrigger) {
            this.contactTrigger.addEventListener('click', () => this.open());
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    open() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        gsap.fromTo('.chat-option',
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
        );
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

class Navigation {
    constructor() {
        this.nav = document.querySelector('.nav');
        this.menuToggle = document.querySelector('.menu-toggle');
        this.mobileMenu = document.querySelector('.mobile-menu');
        this.mobileLinks = document.querySelectorAll('.mobile-link');
        
        this.init();
    }
    
    init() {
        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                this.nav.classList.add('scrolled');
            } else {
                this.nav.classList.remove('scrolled');
            }
        });
        
        // Mobile menu toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleMenu());
        }
        
        // Close menu on link click
        this.mobileLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
    }
    
    toggleMenu() {
        this.menuToggle.classList.toggle('active');
        this.mobileMenu.classList.toggle('active');
        document.body.style.overflow = this.mobileMenu.classList.contains('active') ? 'hidden' : '';
    }
    
    closeMenu() {
        this.menuToggle.classList.remove('active');
        this.mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ========================================
// HERO ANIMATIONS
// ========================================
class HeroAnimations {
    constructor() {
        this.init();
    }
    
    init() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        
        // Tag animation
        tl.to('.hero-tag', {
            opacity: 1,
            y: 0,
            duration: 0.8
        })
        // Title lines
        .from('.title-line', {
            y: 100,
            opacity: 0,
            duration: 1.2,
            stagger: 0.15
        }, '-=0.4')
        // Subtitle words
        .to('.word', {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08
        }, '-=0.8')
        // CTA button
        .from('.btn-primary', {
            y: 30,
            opacity: 0,
            duration: 0.8
        }, '-=0.4')
        // Scroll indicator
        .to('.scroll-indicator', {
            opacity: 1,
            duration: 0.8
        }, '-=0.4');
        
        // Parallax effect on scroll
        gsap.to('.hero-content', {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
        
        // Orbs parallax
        gsap.to('.orb-1', {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
        
        gsap.to('.orb-2', {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }
}

// ========================================
// STATS COUNTER (without scroll trigger)
// ========================================
class StatsCounter {
    constructor() {
        this.stats = document.querySelectorAll('.stat-number[data-count]');
        this.init();
    }
    
    init() {
        // Animate immediately without scroll trigger
        this.stats.forEach(stat => {
            const target = parseInt(stat.dataset.count);
            this.animate(stat, target);
        });
    }
    
    animate(element, target) {
        const obj = { value: 0 };
        const suffix = element.textContent.includes('%') ? '%' : '';
        
        gsap.to(obj, {
            value: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = Math.round(obj.value) + suffix;
            }
        });
    }
}

// ========================================
// SCROLL REVEAL ANIMATIONS (DISABLED)
// ========================================
class ScrollReveal {
    constructor() {
        // Disabled - elements are now visible by default
        this.init();
    }
    
    init() {
        // Make all reveal elements visible immediately
        const reveals = document.querySelectorAll('[data-scroll-reveal]');
        reveals.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}

// ========================================
// SERVICE CARDS HOVER
// ========================================
class ServiceCards {
    constructor() {
        this.cards = document.querySelectorAll('.service-card');
        this.init();
    }
    
    init() {
        this.cards.forEach(card => {
            const icon = card.querySelector('.service-icon');
            const number = card.querySelector('.service-number');
            
            card.addEventListener('mouseenter', () => {
                gsap.to(icon, {
                    y: -10,
                    scale: 1.1,
                    duration: 0.4,
                    ease: 'power2.out'
                });
                
                gsap.to(number, {
                    color: '#ffffff',
                    duration: 0.3
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(icon, {
                    y: 0,
                    scale: 1,
                    duration: 0.4,
                    ease: 'power2.out'
                });
                
                gsap.to(number, {
                    color: '#c9a962',
                    duration: 0.3
                });
            });
        });
    }
}

// ========================================
// PROCESS STEPS ANIMATION (WITHOUT SCROLL)
// ========================================
class ProcessSteps {
    constructor() {
        this.steps = document.querySelectorAll('.process-step');
        this.init();
    }
    
    init() {
        // Make steps visible immediately without scroll animation
        this.steps.forEach((step, index) => {
            step.style.opacity = '1';
            step.style.transform = 'none';
            
            const number = step.querySelector('.step-number');
            if (number) {
                number.style.opacity = '0.5';
                number.style.transform = 'none';
            }
        });
    }
}

// ========================================
// LOCATIONS MARQUEE SPEED
// ========================================
class LocationsMarquee {
    constructor() {
        this.track = document.querySelector('.marquee-track');
        this.init();
    }
    
    init() {
        if (!this.track) return;
        
        // Speed up on scroll
        let scrollSpeed = 0;
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            scrollSpeed = Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;
            
            // Adjust animation speed based on scroll
            const newDuration = Math.max(10, 30 - scrollSpeed * 0.5);
            this.track.style.animationDuration = newDuration + 's';
        }, { passive: true });
        
        // Pause on hover
        const items = document.querySelectorAll('.location-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                this.track.style.animationPlayState = 'paused';
            });
            
            item.addEventListener('mouseleave', () => {
                this.track.style.animationPlayState = 'running';
            });
        });
    }
}

// ========================================
// SMOOTH SCROLL
// ========================================
class SmoothScroll {
    constructor() {
        this.init();
    }
    
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    
                    gsap.to(window, {
                        duration: 1,
                        scrollTo: { y: offsetTop },
                        ease: 'power3.inOut'
                    });
                }
            });
        });
    }
}

// ========================================
// TEXT SCRAMBLE EFFECT
// ========================================
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.originalText = el.innerText;
        this.update = this.update.bind(this);
    }
    
    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    
    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span style="color: var(--color-accent)">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.el.innerHTML = output;
        
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// ========================================
// MAGNETIC BUTTONS
// ========================================
class MagneticButtons {
    constructor() {
        this.buttons = document.querySelectorAll('.magnetic-btn');
        this.init();
    }
    
    init() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        this.buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => this.move(btn, e));
            btn.addEventListener('mouseleave', () => this.reset(btn));
        });
    }
    
    move(btn, e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: 'power2.out'
        });
    }
    
    reset(btn) {
        gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
    }
}

// ========================================
// 3D TILT EFFECT
// ========================================
class Tilt3D {
    constructor() {
        this.elements = document.querySelectorAll('.service-card-3d, .process-step-3d');
        this.init();
    }
    
    init() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        
        this.elements.forEach(el => {
            el.addEventListener('mousemove', (e) => this.tilt(e, el));
            el.addEventListener('mouseleave', () => this.reset(el));
        });
    }
    
    tilt(e, el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        gsap.to(el, {
            rotateX: rotateX,
            rotateY: rotateY,
            translateZ: 30,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 1000
        });
        
        // Add shine effect
        const shine = el.querySelector('.shine') || this.createShine(el);
        const shineX = (x / rect.width) * 100;
        const shineY = (y / rect.height) * 100;
        shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.2) 0%, transparent 50%)`;
    }
    
    createShine(el) {
        const shine = document.createElement('div');
        shine.className = 'shine';
        shine.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 10;
            border-radius: inherit;
        `;
        el.appendChild(shine);
        return shine;
    }
    
    reset(el) {
        gsap.to(el, {
            rotateX: 0,
            rotateY: 0,
            translateZ: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
        
        const shine = el.querySelector('.shine');
        if (shine) {
            shine.style.background = 'transparent';
        }
    }
}

// ========================================
// 3D PARALLAX DEPTH
// ========================================
class Parallax3D {
    constructor() {
        this.depths = document.querySelectorAll('[class*="depth-"]');
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            const mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
            
            this.depths.forEach(el => {
                const depth = this.getDepth(el);
                const moveX = mouseX * depth * 10;
                const moveY = mouseY * depth * 10;
                
                gsap.to(el, {
                    x: moveX,
                    y: moveY,
                    duration: 0.8,
                    ease: 'power2.out'
                });
            });
        });
    }
    
    getDepth(el) {
        if (el.classList.contains('depth-1')) return 1;
        if (el.classList.contains('depth-2')) return 2;
        if (el.classList.contains('depth-3')) return 3;
        if (el.classList.contains('depth-4')) return 4;
        return 1;
    }
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    new WebGLBackground();
    new CustomCursor();
    new ScrollProgress();
    new ChatModal();
    new Navigation();
    new HeroAnimations();
    new StatsCounter();
    new ScrollReveal();
    new ServiceCards();
    new ProcessSteps();
    new LocationsMarquee();
    new MagneticButtons();
    new SmoothScroll();
    new Tilt3D();
    new Parallax3D();
    document.body.classList.add('loaded');
});

// Preloader removal
window.addEventListener('load', () => {
    gsap.to('.hero-bg .gradient-orb', {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        stagger: 0.2,
        ease: 'power2.out'
    });
});

// ========================================
// PROJECTS MODAL
// ========================================
const projectData = {
    1: {
        icon: '🛒',
        title: 'E-Commerce Platform',
        subtitle: 'Full-featured online marketplace',
        description: 'A comprehensive e-commerce solution featuring secure payment gateway integration, real-time inventory management, advanced product filtering, and a seamless checkout experience. The platform supports multiple vendors and includes analytics dashboard for sales tracking.',
        tech: ['React', 'Node.js', 'MongoDB', 'Stripe', 'Redis', 'AWS'],
        stats: { users: '50K+', orders: '1M+', uptime: '99.9%' },
        demo: `
            <div class="demo-ecommerce">
                <style>
                    .demo-ecommerce { font-family: 'Inter', sans-serif; }
                    .demo-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 20px; }
                    .demo-logo { font-weight: 700; color: white; font-size: 1.2rem; }
                    .demo-cart { background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; color: white; cursor: pointer; transition: all 0.3s; }
                    .demo-cart:hover { background: rgba(255,255,255,0.3); }
                    .demo-products { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                    .demo-product { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s; }
                    .demo-product:hover { transform: translateY(-5px); border-color: #c9a962; }
                    .demo-product-img { height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 10px; }
                    .demo-product-name { font-weight: 600; color: #fff; margin-bottom: 5px; }
                    .demo-product-price { color: #c9a962; font-weight: 700; margin-bottom: 10px; }
                    .demo-add-btn { width: 100%; padding: 8px; background: #c9a962; border: none; border-radius: 6px; color: #000; font-weight: 600; cursor: pointer; transition: all 0.3s; }
                    .demo-add-btn:hover { background: #d4b76a; }
                    .demo-checkout { margin-top: 20px; padding: 20px; background: rgba(201, 169, 98, 0.1); border-radius: 12px; border: 1px solid rgba(201, 169, 98, 0.3); }
                    .demo-total { display: flex; justify-content: space-between; font-size: 1.2rem; margin-bottom: 15px; }
                    .demo-pay-btn { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; }
                </style>
                <div class="demo-header">
                    <span class="demo-logo">ShopWave</span>
                    <span class="demo-cart">🛒 Cart (<span id="cart-count">0</span>)</span>
                </div>
                <div class="demo-products">
                    <div class="demo-product">
                        <div class="demo-product-img">📱</div>
                        <div class="demo-product-name">iPhone 15 Pro</div>
                        <div class="demo-product-price">$999</div>
                        <button class="demo-add-btn" onclick="addToCart(999)">Add to Cart</button>
                    </div>
                    <div class="demo-product">
                        <div class="demo-product-img">💻</div>
                        <div class="demo-product-name">MacBook Pro</div>
                        <div class="demo-product-price">$1,499</div>
                        <button class="demo-add-btn" onclick="addToCart(1499)">Add to Cart</button>
                    </div>
                    <div class="demo-product">
                        <div class="demo-product-img">🎧</div>
                        <div class="demo-product-name">AirPods Max</div>
                        <div class="demo-product-price">$549</div>
                        <button class="demo-add-btn" onclick="addToCart(549)">Add to Cart</button>
                    </div>
                </div>
                <div class="demo-checkout">
                    <div class="demo-total">
                        <span>Total:</span>
                        <span style="color: #c9a962; font-weight: 700;">$<span id="total">0</span></span>
                    </div>
                    <button class="demo-pay-btn" onclick="checkout()">💳 Pay with Stripe</button>
                </div>
                <script>
                    let cart = [];
                    function addToCart(price) {
                        cart.push(price);
                        document.getElementById('cart-count').textContent = cart.length;
                        const total = cart.reduce((a,b) => a+b, 0);
                        document.getElementById('total').textContent = total.toLocaleString();
                    }
                    function checkout() {
                        if(cart.length === 0) { alert('Cart is empty!'); return; }
                        alert('Stripe payment simulation: Payment successful! 🎉');
                        cart = []; document.getElementById('cart-count').textContent = '0';
                        document.getElementById('total').textContent = '0';
                    }
                </script>
            </div>
        `
    },
    2: {
        icon: '📊',
        title: 'Analytics Dashboard',
        subtitle: 'Real-time data visualization',
        description: 'Enterprise-grade business intelligence platform with customizable dashboards, real-time data streaming, predictive analytics, and automated reporting. Features role-based access control and data export capabilities.',
        tech: ['Vue.js', 'Python', 'PostgreSQL', 'D3.js', 'TensorFlow', 'Docker'],
        stats: { companies: '200+', reports: '10K+', accuracy: '99.5%' },
        demo: `
            <div class="demo-analytics">
                <style>
                    .demo-analytics { font-family: 'Inter', sans-serif; }
                    .demo-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
                    .demo-metric { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                    .demo-metric-value { font-size: 1.8rem; font-weight: 700; color: #c9a962; }
                    .demo-metric-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
                    .demo-metric-change { color: #10b981; font-size: 0.85rem; margin-top: 5px; }
                    .demo-charts { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
                    .demo-chart { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
                    .demo-chart-title { font-weight: 600; margin-bottom: 15px; color: #fff; }
                    .demo-bar { height: 30px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 10px; position: relative; overflow: hidden; }
                    .demo-bar-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 6px; transition: width 1s ease; }
                    .demo-bar-label { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: white; font-size: 0.85rem; }
                    .demo-pie { width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#667eea 0deg 120deg, #764ba2 120deg 240deg, #c9a962 240deg 360deg); margin: 0 auto; }
                    .demo-legend { display: flex; justify-content: center; gap: 15px; margin-top: 15px; font-size: 0.8rem; }
                    .demo-legend-item { display: flex; align-items: center; gap: 5px; }
                    .demo-dot { width: 10px; height: 10px; border-radius: 50%; }
                </style>
                <div class="demo-metrics">
                    <div class="demo-metric">
                        <div class="demo-metric-value">$2.4M</div>
                        <div class="demo-metric-label">Total Revenue</div>
                        <div class="demo-metric-change">↑ 12.5%</div>
                    </div>
                    <div class="demo-metric">
                        <div class="demo-metric-value">18.2K</div>
                        <div class="demo-metric-label">Active Users</div>
                        <div class="demo-metric-change">↑ 8.3%</div>
                    </div>
                    <div class="demo-metric">
                        <div class="demo-metric-value">3,847</div>
                        <div class="demo-metric-label">Orders</div>
                        <div class="demo-metric-change">↑ 24.1%</div>
                    </div>
                    <div class="demo-metric">
                        <div class="demo-metric-value">4.8%</div>
                        <div class="demo-metric-label">Conversion</div>
                        <div class="demo-metric-change">↑ 2.1%</div>
                    </div>
                </div>
                <div class="demo-charts">
                    <div class="demo-chart">
                        <div class="demo-chart-title">Monthly Sales Performance</div>
                        <div class="demo-bar"><div class="demo-bar-fill" style="width: 85%"></div><span class="demo-bar-label">Jan - $85K</span></div>
                        <div class="demo-bar"><div class="demo-bar-fill" style="width: 92%"></div><span class="demo-bar-label">Feb - $92K</span></div>
                        <div class="demo-bar"><div class="demo-bar-fill" style="width: 78%"></div><span class="demo-bar-label">Mar - $78K</span></div>
                        <div class="demo-bar"><div class="demo-bar-fill" style="width: 95%"></div><span class="demo-bar-label">Apr - $95K</span></div>
                        <div class="demo-bar"><div class="demo-bar-fill" style="width: 88%"></div><span class="demo-bar-label">May - $88K</span></div>
                    </div>
                    <div class="demo-chart">
                        <div class="demo-chart-title">Traffic Sources</div>
                        <div class="demo-pie"></div>
                        <div class="demo-legend">
                            <div class="demo-legend-item"><div class="demo-dot" style="background: #667eea;"></div>Direct</div>
                            <div class="demo-legend-item"><div class="demo-dot" style="background: #764ba2;"></div>Social</div>
                            <div class="demo-legend-item"><div class="demo-dot" style="background: #c9a962;"></div>Organic</div>
                        </div>
                    </div>
                </div>
                <script>
                    setTimeout(() => {
                        document.querySelectorAll('.demo-bar-fill').forEach(bar => {
                            const width = bar.style.width;
                            bar.style.width = '0';
                            setTimeout(() => bar.style.width = width, 100);
                        });
                    }, 500);
                </script>
            </div>
        `
    },
    3: {
        icon: '💬',
        title: 'Chat Application',
        subtitle: 'Real-time messaging platform',
        description: 'Secure messaging application with end-to-end encryption, group chats, voice and video calling, file sharing, and message search. Supports both mobile and desktop platforms with seamless synchronization.',
        tech: ['React Native', 'Firebase', 'WebRTC', 'Signal Protocol', 'Node.js'],
        stats: { messages: '100M+', users: '1M+', rating: '4.8★' },
        demo: `
            <div class="demo-chat">
                <style>
                    .demo-chat { font-family: 'Inter', sans-serif; height: 400px; display: flex; flex-direction: column; }
                    .demo-chat-header { display: flex; align-items: center; gap: 10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 15px; }
                    .demo-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
                    .demo-chat-info { flex: 1; }
                    .demo-chat-name { font-weight: 600; color: #fff; }
                    .demo-chat-status { color: #10b981; font-size: 0.8rem; }
                    .demo-chat-actions { display: flex; gap: 10px; }
                    .demo-chat-btn { padding: 8px 12px; background: rgba(201, 169, 98, 0.2); border: none; border-radius: 20px; color: #c9a962; cursor: pointer; }
                    .demo-messages { flex: 1; overflow-y: auto; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px; margin-bottom: 15px; }
                    .demo-message { margin-bottom: 15px; display: flex; align-items: flex-end; gap: 8px; }
                    .demo-message.sent { flex-direction: row-reverse; }
                    .demo-bubble { max-width: 70%; padding: 12px 15px; border-radius: 18px; font-size: 0.9rem; }
                    .demo-message.received .demo-bubble { background: rgba(255,255,255,0.1); color: #fff; border-bottom-left-radius: 4px; }
                    .demo-message.sent .demo-bubble { background: #c9a962; color: #000; border-bottom-right-radius: 4px; }
                    .demo-message-time { font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 4px; }
                    .demo-input-area { display: flex; gap: 10px; }
                    .demo-chat-input { flex: 1; padding: 12px 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 25px; color: #fff; outline: none; }
                    .demo-send-btn { padding: 12px 20px; background: #c9a962; border: none; border-radius: 25px; color: #000; font-weight: 600; cursor: pointer; }
                </style>
                <div class="demo-chat-header">
                    <div class="demo-avatar">👩</div>
                    <div class="demo-chat-info">
                        <div class="demo-chat-name">Sarah Johnson</div>
                        <div class="demo-chat-status">● Online</div>
                    </div>
                    <div class="demo-chat-actions">
                        <button class="demo-chat-btn">📹</button>
                        <button class="demo-chat-btn">📎</button>
                    </div>
                </div>
                <div class="demo-messages" id="chat-messages">
                    <div class="demo-message received">
                        <div class="demo-avatar" style="width: 30px; height: 30px; font-size: 0.8rem;">👩</div>
                        <div>
                            <div class="demo-bubble">Hey! How's the project coming along? 👋</div>
                            <div class="demo-message-time">10:30 AM</div>
                        </div>
                    </div>
                    <div class="demo-message sent">
                        <div class="demo-avatar" style="width: 30px; height: 30px; font-size: 0.8rem; background: #c9a962;">👨</div>
                        <div>
                            <div class="demo-bubble">Great! Just finished the new feature. Want to see a demo?</div>
                            <div class="demo-message-time">10:32 AM ✓✓</div>
                        </div>
                    </div>
                    <div class="demo-message received">
                        <div class="demo-avatar" style="width: 30px; height: 30px; font-size: 0.8rem;">👩</div>
                        <div>
                            <div class="demo-bubble">Yes please! Send it over 🎉</div>
                            <div class="demo-message-time">10:33 AM</div>
                        </div>
                    </div>
                </div>
                <div class="demo-input-area">
                    <input type="text" class="demo-chat-input" id="chat-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter') sendMessage()">
                    <button class="demo-send-btn" onclick="sendMessage()">Send</button>
                </div>
                <script>
                    function sendMessage() {
                        const input = document.getElementById('chat-input');
                        const text = input.value.trim();
                        if(!text) return;
                        const container = document.getElementById('chat-messages');
                        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const msg = document.createElement('div');
                        msg.className = 'demo-message sent';
                        msg.innerHTML = '<div class="demo-avatar" style="width: 30px; height: 30px; font-size: 0.8rem; background: #c9a962;">👨</div><div><div class="demo-bubble">' + text + '</div><div class="demo-message-time">' + time + ' ✓</div></div>';
                        container.appendChild(msg);
                        container.scrollTop = container.scrollHeight;
                        input.value = '';
                        setTimeout(() => {
                            const reply = document.createElement('div');
                            reply.className = 'demo-message received';
                            reply.innerHTML = '<div class="demo-avatar" style="width: 30px; height: 30px; font-size: 0.8rem;">👩</div><div><div class="demo-bubble">Thanks! Looks amazing! 🔥</div><div class="demo-message-time">' + time + '</div></div>';
                            container.appendChild(reply);
                            container.scrollTop = container.scrollHeight;
                        }, 1500);
                    }
                </script>
            </div>
        `
    },
    4: {
        icon: '🏦',
        title: 'Banking System',
        subtitle: 'Secure online banking platform',
        description: 'Full-stack banking solution with multi-factor authentication, transaction history, bill payments, fund transfers, and loan management. Compliant with financial regulations and includes fraud detection systems.',
        tech: ['Angular', 'Java', 'Oracle', 'Spring Security', 'Kafka', 'Kubernetes'],
        stats: { transactions: '5M+', accounts: '100K+', security: 'A+' },
        demo: `
            <div class="demo-banking">
                <style>
                    .demo-banking { font-family: 'Inter', sans-serif; }
                    .demo-account-card { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 25px; border-radius: 16px; margin-bottom: 20px; position: relative; overflow: hidden; }
                    .demo-account-card::before { content: ''; position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: rgba(255,255,255,0.1); border-radius: 50%; }
                    .demo-bank-logo { color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-bottom: 20px; }
                    .demo-balance-label { color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 5px; }
                    .demo-balance { color: white; font-size: 2rem; font-weight: 700; margin-bottom: 20px; }
                    .demo-card-number { color: rgba(255,255,255,0.9); font-family: monospace; letter-spacing: 2px; }
                    .demo-quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
                    .demo-action { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.1); }
                    .demo-action:hover { background: rgba(201, 169, 98, 0.1); border-color: #c9a962; }
                    .demo-action-icon { font-size: 1.5rem; margin-bottom: 8px; }
                    .demo-action-label { font-size: 0.8rem; color: rgba(255,255,255,0.8); }
                    .demo-transactions { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-transactions-title { font-weight: 600; margin-bottom: 15px; color: #fff; }
                    .demo-transaction { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
                    .demo-transaction:last-child { border-bottom: none; }
                    .demo-trans-left { display: flex; align-items: center; gap: 12px; }
                    .demo-trans-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
                    .demo-trans-name { font-weight: 500; color: #fff; }
                    .demo-trans-date { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                    .demo-trans-amount { font-weight: 600; }
                    .demo-trans-amount.positive { color: #10b981; }
                    .demo-trans-amount.negative { color: #ef4444; }
                </style>
                <div class="demo-account-card">
                    <div class="demo-bank-logo">SecureBank Premium</div>
                    <div class="demo-balance-label">Current Balance</div>
                    <div class="demo-balance">$24,562.80</div>
                    <div class="demo-card-number">**** **** **** 4582</div>
                </div>
                <div class="demo-quick-actions">
                    <div class="demo-action" onclick="alert('Transfer feature demo')">
                        <div class="demo-action-icon">↗️</div>
                        <div class="demo-action-label">Transfer</div>
                    </div>
                    <div class="demo-action" onclick="alert('Payments feature demo')">
                        <div class="demo-action-icon">💸</div>
                        <div class="demo-action-label">Pay Bills</div>
                    </div>
                    <div class="demo-action" onclick="alert('Cards feature demo')">
                        <div class="demo-action-icon">💳</div>
                        <div class="demo-action-label">Cards</div>
                    </div>
                    <div class="demo-action" onclick="alert('Analytics feature demo')">
                        <div class="demo-action-icon">📊</div>
                        <div class="demo-action-label">Analytics</div>
                    </div>
                </div>
                <div class="demo-transactions">
                    <div class="demo-transactions-title">Recent Transactions</div>
                    <div class="demo-transaction">
                        <div class="demo-trans-left">
                            <div class="demo-trans-icon">🛒</div>
                            <div>
                                <div class="demo-trans-name">Amazon Purchase</div>
                                <div class="demo-trans-date">Today, 2:34 PM</div>
                            </div>
                        </div>
                        <div class="demo-trans-amount negative">-$127.50</div>
                    </div>
                    <div class="demo-transaction">
                        <div class="demo-trans-left">
                            <div class="demo-trans-icon">💰</div>
                            <div>
                                <div class="demo-trans-name">Salary Deposit</div>
                                <div class="demo-trans-date">Yesterday</div>
                            </div>
                        </div>
                        <div class="demo-trans-amount positive">+$5,200.00</div>
                    </div>
                    <div class="demo-transaction">
                        <div class="demo-trans-left">
                            <div class="demo-trans-icon">🍕</div>
                            <div>
                                <div class="demo-trans-name">Uber Eats</div>
                                <div class="demo-trans-date">Mar 28, 6:15 PM</div>
                            </div>
                        </div>
                        <div class="demo-trans-amount negative">-$34.20</div>
                    </div>
                </div>
            </div>
        `
    },
    5: {
        icon: '🎓',
        title: 'Learning Management',
        subtitle: 'Online education platform',
        description: 'Comprehensive LMS with video courses, interactive quizzes, progress tracking, certificates, and discussion forums. Features AI-powered recommendations and integrates with popular video conferencing tools.',
        tech: ['Next.js', 'Django', 'AWS', 'PostgreSQL', 'OpenAI', 'WebSockets'],
        stats: { students: '200K+', courses: '500+', completion: '87%' },
        demo: `
            <div class="demo-lms">
                <style>
                    .demo-lms { font-family: 'Inter', sans-serif; }
                    .demo-course-header { display: flex; gap: 20px; margin-bottom: 25px; }
                    .demo-course-thumb { width: 200px; height: 120px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
                    .demo-course-info { flex: 1; }
                    .demo-course-title { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 10px; }
                    .demo-course-meta { display: flex; gap: 15px; color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-bottom: 15px; }
                    .demo-progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
                    .demo-progress-fill { height: 100%; width: 65%; background: #c9a962; border-radius: 4px; transition: width 1s; }
                    .demo-progress-text { display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.85rem; color: rgba(255,255,255,0.6); }
                    .demo-modules { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-module-title { font-weight: 600; margin-bottom: 15px; color: #fff; }
                    .demo-lesson { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
                    .demo-lesson:hover { background: rgba(255,255,255,0.05); }
                    .demo-lesson-check { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
                    .demo-lesson-check.completed { background: #10b981; }
                    .demo-lesson-check.pending { background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3); }
                    .demo-lesson-check.current { background: #c9a962; }
                    .demo-lesson-info { flex: 1; }
                    .demo-lesson-name { color: #fff; font-size: 0.9rem; }
                    .demo-lesson-duration { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
                    .demo-play-btn { width: 32px; height: 32px; border-radius: 50%; background: #c9a962; display: flex; align-items: center; justify-content: center; color: #000; font-size: 0.8rem; }
                </style>
                <div class="demo-course-header">
                    <div class="demo-course-thumb">⚛️</div>
                    <div class="demo-course-info">
                        <div class="demo-course-title">React Advanced Patterns</div>
                        <div class="demo-course-meta">
                            <span>👨‍🏫 John Smith</span>
                            <span>📚 24 Lessons</span>
                            <span>⏱ 12 Hours</span>
                        </div>
                        <div class="demo-progress-bar">
                            <div class="demo-progress-fill"></div>
                        </div>
                        <div class="demo-progress-text">
                            <span>Your Progress</span>
                            <span>65% Complete</span>
                        </div>
                    </div>
                </div>
                <div class="demo-modules">
                    <div class="demo-module-title">Module 3: Hooks & Context</div>
                    <div class="demo-lesson">
                        <div class="demo-lesson-check completed">✓</div>
                        <div class="demo-lesson-info">
                            <div class="demo-lesson-name">1. useEffect Deep Dive</div>
                            <div class="demo-lesson-duration">18 min</div>
                        </div>
                    </div>
                    <div class="demo-lesson">
                        <div class="demo-lesson-check completed">✓</div>
                        <div class="demo-lesson-info">
                            <div class="demo-lesson-name">2. Custom Hooks</div>
                            <div class="demo-lesson-duration">22 min</div>
                        </div>
                    </div>
                    <div class="demo-lesson" style="background: rgba(201, 169, 98, 0.1);">
                        <div class="demo-lesson-check current">▶</div>
                        <div class="demo-lesson-info">
                            <div class="demo-lesson-name">3. Context API Patterns</div>
                            <div class="demo-lesson-duration">25 min</div>
                        </div>
                        <div class="demo-play-btn">▶</div>
                    </div>
                    <div class="demo-lesson">
                        <div class="demo-lesson-check pending"></div>
                        <div class="demo-lesson-info">
                            <div class="demo-lesson-name">4. Performance Optimization</div>
                            <div class="demo-lesson-duration">30 min</div>
                        </div>
                    </div>
                </div>
                <script>
                    document.querySelectorAll('.demo-lesson').forEach(lesson => {
                        lesson.addEventListener('click', function() {
                            document.querySelectorAll('.demo-lesson').forEach(l => l.style.background = '');
                            document.querySelectorAll('.demo-play-btn').forEach(p => p.remove());
                            this.style.background = 'rgba(201, 169, 98, 0.1)';
                            const check = this.querySelector('.demo-lesson-check');
                            check.className = 'demo-lesson-check current';
                            check.textContent = '▶';
                            const playBtn = document.createElement('div');
                            playBtn.className = 'demo-play-btn';
                            playBtn.textContent = '▶';
                            this.appendChild(playBtn);
                        });
                    });
                </script>
            </div>
        `
    },
    6: {
        icon: '🚀',
        title: 'SaaS Platform',
        subtitle: 'Project management tool',
        description: 'Subscription-based project management solution for remote teams with task tracking, time logging, team collaboration, Gantt charts, and automated workflows. Integrates with 50+ third-party tools.',
        tech: ['React', 'GraphQL', 'Docker', 'PostgreSQL', 'Elastic', 'Stripe'],
        stats: { teams: '5K+', tasks: '10M+', growth: '300%' },
        demo: `
            <div class="demo-saas">
                <style>
                    .demo-saas { font-family: 'Inter', sans-serif; }
                    .demo-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                    .demo-column { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px; }
                    .demo-column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                    .demo-column-title { font-weight: 600; color: #fff; display: flex; align-items: center; gap: 8px; }
                    .demo-column-count { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; }
                    .demo-task { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #c9a962; cursor: grab; transition: all 0.3s; }
                    .demo-task:hover { transform: translateX(5px); }
                    .demo-task-title { color: #fff; font-size: 0.9rem; margin-bottom: 8px; }
                    .demo-task-meta { display: flex; justify-content: space-between; align-items: center; }
                    .demo-task-tags { display: flex; gap: 5px; }
                    .demo-tag { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; }
                    .demo-tag.high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
                    .demo-tag.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
                    .demo-assignees { display: flex; }
                    .demo-assignee { width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; margin-left: -8px; border: 2px solid #141414; }
                    .demo-add-task { width: 100%; padding: 10px; background: transparent; border: 2px dashed rgba(255,255,255,0.2); border-radius: 8px; color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s; }
                    .demo-add-task:hover { border-color: #c9a962; color: #c9a962; }
                </style>
                <div class="demo-board">
                    <div class="demo-column">
                        <div class="demo-column-header">
                            <div class="demo-column-title">📋 To Do</div>
                            <span class="demo-column-count">3</span>
                        </div>
                        <div class="demo-task" draggable="true">
                            <div class="demo-task-title">Design system architecture</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag high">High</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">JS</div>
                                </div>
                            </div>
                        </div>
                        <div class="demo-task" draggable="true">
                            <div class="demo-task-title">API documentation</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag medium">Medium</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">AK</div>
                                </div>
                            </div>
                        </div>
                        <div class="demo-task" draggable="true">
                            <div class="demo-task-title">Unit tests setup</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag medium">Medium</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">ML</div>
                                </div>
                            </div>
                        </div>
                        <button class="demo-add-task" onclick="addTask(this)">+ Add Task</button>
                    </div>
                    <div class="demo-column">
                        <div class="demo-column-header">
                            <div class="demo-column-title">🔄 In Progress</div>
                            <span class="demo-column-count">2</span>
                        </div>
                        <div class="demo-task" draggable="true" style="border-left-color: #667eea;">
                            <div class="demo-task-title">Frontend components</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag high">High</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">SM</div>
                                    <div class="demo-assignee">JD</div>
                                </div>
                            </div>
                        </div>
                        <div class="demo-task" draggable="true" style="border-left-color: #764ba2;">
                            <div class="demo-task-title">Database schema</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag medium">Medium</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">AK</div>
                                </div>
                            </div>
                        </div>
                        <button class="demo-add-task" onclick="addTask(this)">+ Add Task</button>
                    </div>
                    <div class="demo-column">
                        <div class="demo-column-header">
                            <div class="demo-column-title">✅ Done</div>
                            <span class="demo-column-count">2</span>
                        </div>
                        <div class="demo-task" draggable="true" style="border-left-color: #10b981; opacity: 0.7;">
                            <div class="demo-task-title">Project setup</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">Done</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">JS</div>
                                </div>
                            </div>
                        </div>
                        <div class="demo-task" draggable="true" style="border-left-color: #10b981; opacity: 0.7;">
                            <div class="demo-task-title">Requirements analysis</div>
                            <div class="demo-task-meta">
                                <div class="demo-task-tags">
                                    <span class="demo-tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">Done</span>
                                </div>
                                <div class="demo-assignees">
                                    <div class="demo-assignee">ML</div>
                                </div>
                            </div>
                        </div>
                        <button class="demo-add-task" onclick="addTask(this)">+ Add Task</button>
                    </div>
                </div>
                <script>
                    let taskCount = 7;
                    function addTask(btn) {
                        const column = btn.parentElement;
                        const title = prompt('Enter task name:');
                        if(!title) return;
                        const task = document.createElement('div');
                        task.className = 'demo-task';
                        task.draggable = true;
                        task.innerHTML = '<div class="demo-task-title">' + title + '</div><div class="demo-task-meta"><div class="demo-task-tags"><span class="demo-tag medium">Medium</span></div><div class="demo-assignees"><div class="demo-assignee">ME</div></div></div>';
                        column.insertBefore(task, btn);
                        column.querySelector('.demo-column-count').textContent = column.querySelectorAll('.demo-task').length;
                    }
                </script>
            </div>
        `
    },
    7: {
        icon: '🏥',
        title: 'Healthcare Portal',
        subtitle: 'Patient management system',
        description: 'HIPAA-compliant healthcare platform with appointment scheduling, electronic health records, telemedicine video calls, prescription management, and insurance integration. Features patient portal and doctor dashboard.',
        tech: ['Vue.js', 'Node.js', 'HIPAA', 'WebRTC', 'MongoDB', 'Azure'],
        stats: { patients: '50K+', providers: '500+', satisfaction: '96%' },
        demo: `
            <div class="demo-healthcare">
                <style>
                    .demo-healthcare { font-family: 'Inter', sans-serif; }
                    .demo-patient-card { display: flex; gap: 20px; margin-bottom: 25px; }
                    .demo-patient-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
                    .demo-patient-info { flex: 1; }
                    .demo-patient-name { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 5px; }
                    .demo-patient-details { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-bottom: 15px; }
                    .demo-vitals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                    .demo-vital { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; text-align: center; }
                    .demo-vital-value { font-size: 1.3rem; font-weight: 700; color: #c9a962; }
                    .demo-vital-label { font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 4px; }
                    .demo-appointments { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-appt-title { font-weight: 600; color: #fff; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
                    .demo-appt-btn { padding: 6px 12px; background: #c9a962; border: none; border-radius: 6px; color: #000; font-size: 0.8rem; cursor: pointer; }
                    .demo-appt-list { display: flex; flex-direction: column; gap: 10px; }
                    .demo-appt-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; }
                    .demo-appt-date { width: 50px; text-align: center; }
                    .demo-appt-day { font-size: 1.2rem; font-weight: 700; color: #c9a962; }
                    .demo-appt-month { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
                    .demo-appt-info { flex: 1; }
                    .demo-appt-doctor { color: #fff; font-weight: 500; }
                    .demo-appt-type { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
                    .demo-appt-status { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; }
                    .demo-appt-status.confirmed { background: rgba(16, 185, 129, 0.2); color: #10b981; }
                    .demo-appt-status.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
                </style>
                <div class="demo-patient-card">
                    <div class="demo-patient-avatar">👨</div>
                    <div class="demo-patient-info">
                        <div class="demo-patient-name">Michael Thompson</div>
                        <div class="demo-patient-details">42 years • Male • ID: #45829</div>
                        <div class="demo-vitals">
                            <div class="demo-vital">
                                <div class="demo-vital-value">120/80</div>
                                <div class="demo-vital-label">Blood Pressure</div>
                            </div>
                            <div class="demo-vital">
                                <div class="demo-vital-value">72</div>
                                <div class="demo-vital-label">Heart Rate</div>
                            </div>
                            <div class="demo-vital">
                                <div class="demo-vital-value">98.6°F</div>
                                <div class="demo-vital-label">Temperature</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="demo-appointments">
                    <div class="demo-appt-title">
                        Upcoming Appointments
                        <button class="demo-appt-btn" onclick="alert('Schedule appointment demo')">+ Book</button>
                    </div>
                    <div class="demo-appt-list">
                        <div class="demo-appt-item">
                            <div class="demo-appt-date">
                                <div class="demo-appt-day">15</div>
                                <div class="demo-appt-month">APR</div>
                            </div>
                            <div class="demo-appt-info">
                                <div class="demo-appt-doctor">Dr. Sarah Williams</div>
                                <div class="demo-appt-type">Cardiology Checkup</div>
                            </div>
                            <span class="demo-appt-status confirmed">Confirmed</span>
                        </div>
                        <div class="demo-appt-item">
                            <div class="demo-appt-date">
                                <div class="demo-appt-day">22</div>
                                <div class="demo-appt-month">APR</div>
                            </div>
                            <div class="demo-appt-info">
                                <div class="demo-appt-doctor">Dr. James Chen</div>
                                <div class="demo-appt-type">Annual Physical</div>
                            </div>
                            <span class="demo-appt-status pending">Pending</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    8: {
        icon: '🎵',
        title: 'Music Streaming',
        subtitle: 'Audio streaming service',
        description: 'High-fidelity music streaming platform with curated playlists, AI recommendations, offline mode, lyrics display, and social sharing. Features artist profiles and podcast support with adaptive streaming.',
        tech: ['React', 'Go', 'Redis', 'PostgreSQL', 'AWS S3', 'FFmpeg'],
        stats: { songs: '50M+', users: '2M+', streams: '1B+' },
        demo: `
            <div class="demo-music">
                <style>
                    .demo-music { font-family: 'Inter', sans-serif; }
                    .demo-now-playing { display: flex; align-items: center; gap: 20px; padding: 20px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3)); border-radius: 16px; margin-bottom: 25px; }
                    .demo-album-art { width: 100px; height: 100px; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
                    .demo-track-info { flex: 1; }
                    .demo-track-name { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 5px; }
                    .demo-artist-name { color: rgba(255,255,255,0.7); }
                    .demo-controls { display: flex; align-items: center; gap: 15px; margin-top: 15px; }
                    .demo-control-btn { background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; opacity: 0.7; transition: opacity 0.3s; }
                    .demo-control-btn:hover { opacity: 1; }
                    .demo-control-btn.play { width: 50px; height: 50px; background: #c9a962; border-radius: 50%; color: #000; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; opacity: 1; }
                    .demo-progress { margin-top: 15px; }
                    .demo-progress-bar { height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden; }
                    .demo-progress-fill { height: 100%; width: 35%; background: #c9a962; border-radius: 2px; }
                    .demo-time { display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                    .demo-playlist { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-playlist-title { font-weight: 600; color: #fff; margin-bottom: 15px; }
                    .demo-song { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
                    .demo-song:hover, .demo-song.active { background: rgba(255,255,255,0.05); }
                    .demo-song-num { width: 30px; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.9rem; }
                    .demo-song-info { flex: 1; }
                    .demo-song-title { color: #fff; font-size: 0.9rem; }
                    .demo-song-artist { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
                    .demo-song-duration { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
                </style>
                <div class="demo-now-playing">
                    <div class="demo-album-art">🎸</div>
                    <div class="demo-track-info">
                        <div class="demo-track-name">Hotel California</div>
                        <div class="demo-artist-name">Eagles • Hotel California</div>
                        <div class="demo-controls">
                            <button class="demo-control-btn">⏮</button>
                            <button class="demo-control-btn play" id="playBtn" onclick="togglePlay()">▶</button>
                            <button class="demo-control-btn">⏭</button>
                            <button class="demo-control-btn">🔀</button>
                            <button class="demo-control-btn">🔁</button>
                        </div>
                        <div class="demo-progress">
                            <div class="demo-progress-bar">
                                <div class="demo-progress-fill" id="progress"></div>
                            </div>
                            <div class="demo-time">
                                <span id="current">1:24</span>
                                <span>6:30</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="demo-playlist">
                    <div class="demo-playlist-title">Up Next</div>
                    <div class="demo-song" onclick="playSong(this, 'Stairway to Heaven', 'Led Zeppelin')">
                        <div class="demo-song-num">1</div>
                        <div class="demo-song-info">
                            <div class="demo-song-title">Stairway to Heaven</div>
                            <div class="demo-song-artist">Led Zeppelin</div>
                        </div>
                        <div class="demo-song-duration">8:02</div>
                    </div>
                    <div class="demo-song" onclick="playSong(this, 'Bohemian Rhapsody', 'Queen')">
                        <div class="demo-song-num">2</div>
                        <div class="demo-song-info">
                            <div class="demo-song-title">Bohemian Rhapsody</div>
                            <div class="demo-song-artist">Queen</div>
                        </div>
                        <div class="demo-song-duration">5:55</div>
                    </div>
                    <div class="demo-song" onclick="playSong(this, 'Sweet Child O Mine', 'Guns N Roses')">
                        <div class="demo-song-num">3</div>
                        <div class="demo-song-info">
                            <div class="demo-song-title">Sweet Child O' Mine</div>
                            <div class="demo-song-artist">Guns N' Roses</div>
                        </div>
                        <div class="demo-song-duration">5:03</div>
                    </div>
                </div>
                <script>
                    let isPlaying = false;
                    let progress = 35;
                    let interval;
                    function togglePlay() {
                        const btn = document.getElementById('playBtn');
                        isPlaying = !isPlaying;
                        btn.textContent = isPlaying ? '⏸' : '▶';
                        if(isPlaying) {
                            interval = setInterval(() => {
                                progress += 0.5;
                                if(progress > 100) progress = 0;
                                document.getElementById('progress').style.width = progress + '%';
                            }, 1000);
                        } else {
                            clearInterval(interval);
                        }
                    }
                    function playSong(el, title, artist) {
                        document.querySelectorAll('.demo-song').forEach(s => s.classList.remove('active'));
                        el.classList.add('active');
                        document.querySelector('.demo-track-name').textContent = title;
                        document.querySelector('.demo-artist-name').textContent = artist;
                        progress = 0;
                        document.getElementById('progress').style.width = '0%';
                        if(!isPlaying) togglePlay();
                    }
                </script>
            </div>
        `
    },
    9: {
        icon: '🚗',
        title: 'Car Rental System',
        subtitle: 'Vehicle booking platform',
        description: 'End-to-end car rental solution with GPS fleet tracking, automated billing, damage reporting, and multi-location support. Features customer loyalty program and dynamic pricing based on demand.',
        tech: ['Angular', 'Spring Boot', 'MySQL', 'Google Maps', 'IoT', 'Stripe'],
        stats: { vehicles: '10K+', rentals: '100K+', cities: '50+' },
        demo: `
            <div class="demo-rental">
                <style>
                    .demo-rental { font-family: 'Inter', sans-serif; }
                    .demo-search { display: flex; gap: 10px; margin-bottom: 25px; }
                    .demo-search-input { flex: 1; padding: 12px 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; }
                    .demo-search-btn { padding: 12px 25px; background: #c9a962; border: none; border-radius: 8px; color: #000; font-weight: 600; cursor: pointer; }
                    .demo-cars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                    .demo-car { background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s; }
                    .demo-car:hover { transform: translateY(-5px); border-color: #c9a962; }
                    .demo-car-img { height: 100px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 3rem; }
                    .demo-car-info { padding: 15px; }
                    .demo-car-name { font-weight: 600; color: #fff; margin-bottom: 5px; }
                    .demo-car-specs { display: flex; gap: 10px; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
                    .demo-car-footer { display: flex; justify-content: space-between; align-items: center; }
                    .demo-car-price { font-size: 1.2rem; font-weight: 700; color: #c9a962; }
                    .demo-car-price span { font-size: 0.75rem; color: rgba(255,255,255,0.5); font-weight: 400; }
                    .demo-rent-btn { padding: 8px 16px; background: #c9a962; border: none; border-radius: 6px; color: #000; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
                    .demo-filters { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
                    .demo-filter { padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: 20px; font-size: 0.8rem; color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.3s; }
                    .demo-filter:hover, .demo-filter.active { background: #c9a962; color: #000; }
                </style>
                <div class="demo-search">
                    <input type="text" class="demo-search-input" placeholder="📍 Location, City or Airport">
                    <button class="demo-search-btn" onclick="alert('Search demo: Found 234 cars')">Search</button>
                </div>
                <div class="demo-filters">
                    <div class="demo-filter active">All Types</div>
                    <div class="demo-filter">SUV</div>
                    <div class="demo-filter">Sedan</div>
                    <div class="demo-filter">Luxury</div>
                    <div class="demo-filter">Electric</div>
                </div>
                <div class="demo-cars">
                    <div class="demo-car">
                        <div class="demo-car-img">🚙</div>
                        <div class="demo-car-info">
                            <div class="demo-car-name">Tesla Model 3</div>
                            <div class="demo-car-specs">⚡ Electric • 🚪 5 Seats • ⛽ Auto</div>
                            <div class="demo-car-footer">
                                <div class="demo-car-price">$89<span>/day</span></div>
                                <button class="demo-rent-btn" onclick="rentCar('Tesla Model 3')">Rent Now</button>
                            </div>
                        </div>
                    </div>
                    <div class="demo-car">
                        <div class="demo-car-img">🚗</div>
                        <div class="demo-car-info">
                            <div class="demo-car-name">BMW X5</div>
                            <div class="demo-car-specs">⛽ Diesel • 🚪 7 Seats • 4WD</div>
                            <div class="demo-car-footer">
                                <div class="demo-car-price">$129<span>/day</span></div>
                                <button class="demo-rent-btn" onclick="rentCar('BMW X5')">Rent Now</button>
                            </div>
                        </div>
                    </div>
                    <div class="demo-car">
                        <div class="demo-car-img">🏎️</div>
                        <div class="demo-car-info">
                            <div class="demo-car-name">Porsche 911</div>
                            <div class="demo-car-specs">⛽ Gas • 🚪 2 Seats • Sport</div>
                            <div class="demo-car-footer">
                                <div class="demo-car-price">$299<span>/day</span></div>
                                <button class="demo-rent-btn" onclick="rentCar('Porsche 911')">Rent Now</button>
                            </div>
                        </div>
                    </div>
                    <div class="demo-car">
                        <div class="demo-car-img">🚐</div>
                        <div class="demo-car-info">
                            <div class="demo-car-name">Mercedes V-Class</div>
                            <div class="demo-car-specs">⛽ Diesel • 🚪 8 Seats • Luxury</div>
                            <div class="demo-car-footer">
                                <div class="demo-car-price">$199<span>/day</span></div>
                                <button class="demo-rent-btn" onclick="rentCar('Mercedes V-Class')">Rent Now</button>
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    function rentCar(car) {
                        alert('Stripe Checkout Demo: ' + car + ' reserved successfully! 🚗');
                    }
                    document.querySelectorAll('.demo-filter').forEach(f => {
                        f.addEventListener('click', function() {
                            document.querySelectorAll('.demo-filter').forEach(filter => filter.classList.remove('active'));
                            this.classList.add('active');
                        });
                    });
                </script>
            </div>
        `
    },
    10: {
        icon: '📱',
        title: 'Social Network',
        subtitle: 'Community platform',
        description: 'Feature-rich social networking app with news feeds, stories, live streaming, events, groups, and marketplace. Includes content moderation tools and privacy controls with end-to-end encrypted messaging.',
        tech: ['React Native', 'Node.js', 'MongoDB', 'Redis', 'WebRTC', 'AWS'],
        stats: { users: '5M+', posts: '1M/day', engagement: '85%' },
        demo: `
            <div class="demo-social">
                <style>
                    .demo-social { font-family: 'Inter', sans-serif; }
                    .demo-stories { display: flex; gap: 10px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 10px; }
                    .demo-story { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; }
                    .demo-story-avatar { width: 60px; height: 60px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6); }
                    .demo-story-inner { width: 100%; height: 100%; border-radius: 50%; background: #141414; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                    .demo-story-name { font-size: 0.75rem; color: rgba(255,255,255,0.7); }
                    .demo-add-story { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 2px dashed rgba(255,255,255,0.3); cursor: pointer; }
                    .demo-feed { display: flex; flex-direction: column; gap: 20px; }
                    .demo-post { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
                    .demo-post-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; }
                    .demo-post-info { flex: 1; }
                    .demo-post-author { font-weight: 600; color: #fff; }
                    .demo-post-time { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                    .demo-post-content { color: rgba(255,255,255,0.9); margin-bottom: 15px; line-height: 1.5; }
                    .demo-post-image { height: 150px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 4rem; margin-bottom: 15px; }
                    .demo-post-actions { display: flex; gap: 20px; }
                    .demo-post-action { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.6); cursor: pointer; transition: color 0.3s; }
                    .demo-post-action:hover { color: #c9a962; }
                    .demo-post-action.liked { color: #ef4444; }
                </style>
                <div class="demo-stories">
                    <div class="demo-story">
                        <div class="demo-add-story">+</div>
                        <span class="demo-story-name">Add</span>
                    </div>
                    <div class="demo-story">
                        <div class="demo-story-avatar"><div class="demo-story-inner">👩</div></div>
                        <span class="demo-story-name">Anna</span>
                    </div>
                    <div class="demo-story">
                        <div class="demo-story-avatar"><div class="demo-story-inner">👨</div></div>
                        <span class="demo-story-name">Mike</span>
                    </div>
                    <div class="demo-story">
                        <div class="demo-story-avatar"><div class="demo-story-inner">👩‍🦰</div></div>
                        <span class="demo-story-name">Sarah</span>
                    </div>
                    <div class="demo-story">
                        <div class="demo-story-avatar"><div class="demo-story-inner">👨‍🦱</div></div>
                        <span class="demo-story-name">John</span>
                    </div>
                </div>
                <div class="demo-feed">
                    <div class="demo-post">
                        <div class="demo-post-header">
                            <div class="demo-post-avatar">👩</div>
                            <div class="demo-post-info">
                                <div class="demo-post-author">Emily Johnson</div>
                                <div class="demo-post-time">2 hours ago • 🌍 Public</div>
                            </div>
                        </div>
                        <div class="demo-post-content">Just launched our new product! 🚀 Super excited to share this milestone with all of you. Thanks for the continuous support! 💪</div>
                        <div class="demo-post-image">🚀</div>
                        <div class="demo-post-actions">
                            <div class="demo-post-action liked" onclick="toggleLike(this)">❤️ 2.4K</div>
                            <div class="demo-post-action">💬 128</div>
                            <div class="demo-post-action">↗️ Share</div>
                        </div>
                    </div>
                </div>
                <script>
                    function toggleLike(el) {
                        el.classList.toggle('liked');
                        const count = el.classList.contains('liked') ? '2.4K' : '2.3K';
                        el.innerHTML = el.classList.contains('liked') ? '❤️ ' + count : '🤍 ' + count;
                    }
                </script>
            </div>
        `
    },
    11: {
        icon: '🏠',
        title: 'Real Estate Portal',
        subtitle: 'Property listing platform',
        description: 'Advanced real estate marketplace with 3D virtual tours, mortgage calculators, neighborhood analytics, and agent matching. Features automated valuation models and document signing integration.',
        tech: ['Next.js', 'Python', 'Elastic', 'Three.js', 'PostgreSQL', 'DocuSign'],
        stats: { listings: '100K+', agents: '5K+', sales: '$2B+' },
        demo: `
            <div class="demo-realestate">
                <style>
                    .demo-realestate { font-family: 'Inter', sans-serif; }
                    .demo-search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
                    .demo-search-input { flex: 1; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; }
                    .demo-price-range { display: flex; gap: 10px; }
                    .demo-price-input { width: 100px; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; }
                    .demo-search-btn { padding: 12px 20px; background: #c9a962; border: none; border-radius: 8px; color: #000; font-weight: 600; cursor: pointer; }
                    .demo-property { background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
                    .demo-property-img { height: 180px; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 4rem; position: relative; }
                    .demo-property-badge { position: absolute; top: 10px; left: 10px; padding: 5px 12px; background: #c9a962; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #000; }
                    .demo-property-badge.featured { background: #ef4444; color: white; }
                    .demo-3d-btn { position: absolute; bottom: 10px; right: 10px; padding: 8px 12px; background: rgba(0,0,0,0.7); border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
                    .demo-property-info { padding: 20px; }
                    .demo-property-price { font-size: 1.5rem; font-weight: 700; color: #c9a962; margin-bottom: 5px; }
                    .demo-property-address { color: rgba(255,255,255,0.7); margin-bottom: 15px; }
                    .demo-property-features { display: flex; gap: 20px; margin-bottom: 15px; }
                    .demo-feature { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.6); font-size: 0.9rem; }
                    .demo-property-footer { display: flex; justify-content: space-between; align-items: center; }
                    .demo-agent { display: flex; align-items: center; gap: 8px; }
                    .demo-agent-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
                    .demo-agent-name { font-size: 0.85rem; color: rgba(255,255,255,0.8); }
                    .demo-contact-btn { padding: 10px 20px; background: #c9a962; border: none; border-radius: 6px; color: #000; font-weight: 600; cursor: pointer; }
                </style>
                <div class="demo-search-bar">
                    <input type="text" class="demo-search-input" placeholder="🔍 Search by city, neighborhood, or ZIP">
                    <div class="demo-price-range">
                        <input type="text" class="demo-price-input" placeholder="Min $">
                        <input type="text" class="demo-price-input" placeholder="Max $">
                    </div>
                    <button class="demo-search-btn">Search</button>
                </div>
                <div class="demo-property">
                    <div class="demo-property-img">
                        🏠
                        <span class="demo-property-badge">For Sale</span>
                        <span class="demo-property-badge featured">FEATURED</span>
                        <div class="demo-3d-btn" onclick="alert('3D Tour Loading... 🏠')">🏠 3D Tour</div>
                    </div>
                    <div class="demo-property-info">
                        <div class="demo-property-price">$1,250,000</div>
                        <div class="demo-property-address">📍 123 Luxury Lane, Beverly Hills, CA 90210</div>
                        <div class="demo-property-features">
                            <div class="demo-feature">🛏 5 Beds</div>
                            <div class="demo-feature">🛁 4 Baths</div>
                            <div class="demo-feature">📐 4,200 sqft</div>
                            <div class="demo-feature">🚗 2 Garage</div>
                        </div>
                        <div class="demo-property-footer">
                            <div class="demo-agent">
                                <div class="demo-agent-avatar">👩</div>
                                <span class="demo-agent-name">Jessica Miller, Realtor</span>
                            </div>
                            <button class="demo-contact-btn" onclick="alert('Contact agent feature demo')">Contact Agent</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    12: {
        icon: '⚽',
        title: 'Sports Betting App',
        subtitle: 'Live betting platform',
        description: 'Real-time sports betting application with live odds, cash-out features, in-play betting, and streaming integration. Includes responsible gaming tools and advanced analytics for bettors.',
        tech: ['React', 'Kotlin', 'Kafka', 'PostgreSQL', 'Redis', 'WebSockets'],
        stats: { events: '50K+', users: '500K+', live: '24/7' },
        demo: `
            <div class="demo-betting">
                <style>
                    .demo-betting { font-family: 'Inter', sans-serif; }
                    .demo-sports { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; }
                    .demo-sport { padding: 10px 20px; background: rgba(255,255,255,0.05); border-radius: 20px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s; }
                    .demo-sport:hover, .demo-sport.active { background: #c9a962; color: #000; }
                    .demo-match { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1); }
                    .demo-match-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                    .demo-league { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.6); font-size: 0.85rem; }
                    .demo-live-badge { padding: 4px 10px; background: #ef4444; border-radius: 12px; font-size: 0.75rem; color: white; animation: pulse 2s infinite; }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
                    .demo-teams { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .demo-team { display: flex; align-items: center; gap: 10px; }
                    .demo-team-logo { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                    .demo-team-name { font-weight: 600; color: #fff; }
                    .demo-score { font-size: 1.8rem; font-weight: 700; color: #c9a962; }
                    .demo-odds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                    .demo-odd { padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; }
                    .demo-odd:hover { border-color: #c9a962; }
                    .demo-odd.selected { background: #c9a962; color: #000; }
                    .demo-odd-label { font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-bottom: 5px; }
                    .demo-odd-value { font-weight: 700; font-size: 1.1rem; }
                </style>
                <div class="demo-sports">
                    <div class="demo-sport active">⚽ Soccer</div>
                    <div class="demo-sport">🏀 Basketball</div>
                    <div class="demo-sport">🎾 Tennis</div>
                    <div class="demo-sport">🏈 Football</div>
                    <div class="demo-sport">🏒 Hockey</div>
                </div>
                <div class="demo-match">
                    <div class="demo-match-header">
                        <div class="demo-league">🏆 UEFA Champions League</div>
                        <span class="demo-live-badge">● LIVE 67'</span>
                    </div>
                    <div class="demo-teams">
                        <div class="demo-team">
                            <div class="demo-team-logo">🔴</div>
                            <span class="demo-team-name">Manchester United</span>
                        </div>
                        <div class="demo-score">2 - 1</div>
                        <div class="demo-team">
                            <div class="demo-team-logo">⚪</div>
                            <span class="demo-team-name">Real Madrid</span>
                        </div>
                    </div>
                    <div class="demo-odds">
                        <div class="demo-odd" onclick="selectOdd(this)">
                            <div class="demo-odd-label">1 (Home)</div>
                            <div class="demo-odd-value">2.45</div>
                        </div>
                        <div class="demo-odd" onclick="selectOdd(this)">
                            <div class="demo-odd-label">X (Draw)</div>
                            <div class="demo-odd-value">3.20</div>
                        </div>
                        <div class="demo-odd" onclick="selectOdd(this)">
                            <div class="demo-odd-label">2 (Away)</div>
                            <div class="demo-odd-value">2.85</div>
                        </div>
                    </div>
                </div>
                <div class="demo-match">
                    <div class="demo-match-header">
                        <div class="demo-league">⚽ Premier League</div>
                        <span class="demo-live-badge">● LIVE 34'</span>
                    </div>
                    <div class="demo-teams">
                        <div class="demo-team">
                            <div class="demo-team-logo">🔵</div>
                            <span class="demo-team-name">Chelsea</span>
                        </div>
                        <div class="demo-score">0 - 0</div>
                        <div class="demo-team">
                            <div class="demo-team-logo">⚫</div>
                            <span class="demo-team-name">Arsenal</span>
                        </div>
                    </div>
                    <div class="demo-odds">
                        <div class="demo-odd" onclick="selectOdd(this)">
                            <div class="demo-odd-label">1 (Home)</div>
                            <div class="demo-odd-value">1.95</div>
                        </div>
                        <div class="demo-odd" onclick="selectOdd(this)">
                            <div class="demo-odd-label">X (Draw)</div>
                            <div class="demo-odd-value">3.40</div>
                        </div>
                        <div class="demo-odd" onclick="selectOdd(this)">
                            <div class="demo-odd-label">2 (Away)</div>
                            <div class="demo-odd-value">3.80</div>
                        </div>
                    </div>
                </div>
                <script>
                    function selectOdd(el) {
                        el.parentElement.querySelectorAll('.demo-odd').forEach(o => o.classList.remove('selected'));
                        el.classList.add('selected');
                    }
                </script>
            </div>
        `
    },
    13: {
        icon: '🍔',
        title: 'Food Delivery',
        subtitle: 'Restaurant ordering system',
        description: 'On-demand food delivery platform with real-time order tracking, restaurant management dashboard, route optimization for drivers, and loyalty rewards program. Features contactless delivery options.',
        tech: ['Flutter', 'Node.js', 'Stripe', 'Google Maps', 'Firebase', 'MongoDB'],
        stats: { restaurants: '10K+', orders: '5M+', drivers: '20K+' },
        demo: `
            <div class="demo-food">
                <style>
                    .demo-food { font-family: 'Inter', sans-serif; }
                    .demo-categories { display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; }
                    .demo-category { padding: 10px 20px; background: rgba(255,255,255,0.05); border-radius: 20px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s; white-space: nowrap; }
                    .demo-category:hover, .demo-category.active { background: #c9a962; color: #000; }
                    .demo-restaurant { background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px; }
                    .demo-restaurant-img { height: 120px; background: linear-gradient(135deg, #f59e0b, #ef4444); display: flex; align-items: center; justify-content: center; font-size: 3rem; position: relative; }
                    .demo-delivery-time { position: absolute; top: 10px; right: 10px; padding: 6px 12px; background: rgba(0,0,0,0.7); border-radius: 20px; font-size: 0.8rem; }
                    .demo-restaurant-info { padding: 15px; }
                    .demo-restaurant-name { font-weight: 600; color: #fff; margin-bottom: 5px; display: flex; justify-content: space-between; }
                    .demo-rating { color: #f59e0b; }
                    .demo-restaurant-meta { color: rgba(255,255,255,0.6); font-size: 0.85rem; margin-bottom: 10px; }
                    .demo-menu-preview { display: flex; gap: 10px; }
                    .demo-menu-item { flex: 1; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center; }
                    .demo-menu-item-name { font-size: 0.8rem; color: rgba(255,255,255,0.8); margin-bottom: 5px; }
                    .demo-menu-item-price { color: #c9a962; font-weight: 600; font-size: 0.9rem; }
                    .demo-tracker { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-tracker-title { font-weight: 600; margin-bottom: 15px; color: #fff; }
                    .demo-track-steps { display: flex; justify-content: space-between; position: relative; }
                    .demo-track-steps::before { content: ''; position: absolute; top: 15px; left: 10%; right: 10%; height: 2px; background: rgba(255,255,255,0.2); }
                    .demo-track-step { display: flex; flex-direction: column; align-items: center; position: relative; }
                    .demo-step-dot { width: 30px; height: 30px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; position: relative; z-index: 1; }
                    .demo-step-dot.pending { background: rgba(255,255,255,0.2); }
                    .demo-step-dot.current { background: #c9a962; animation: pulse 2s infinite; }
                    .demo-step-label { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
                </style>
                <div class="demo-categories">
                    <div class="demo-category active">🍕 Pizza</div>
                    <div class="demo-category">🍔 Burgers</div>
                    <div class="demo-category">🍣 Sushi</div>
                    <div class="demo-category">🥗 Healthy</div>
                    <div class="demo-category">🍜 Asian</div>
                </div>
                <div class="demo-restaurant">
                    <div class="demo-restaurant-img">
                        🍕
                        <span class="demo-delivery-time">⏱ 25-35 min</span>
                    </div>
                    <div class="demo-restaurant-info">
                        <div class="demo-restaurant-name">
                            Tony's Pizzeria
                            <span class="demo-rating">⭐ 4.8</span>
                        </div>
                        <div class="demo-restaurant-meta">Italian • Pizza • $$ • 2.3 km</div>
                        <div class="demo-menu-preview">
                            <div class="demo-menu-item">
                                <div class="demo-menu-item-name">Margherita</div>
                                <div class="demo-menu-item-price">$12.99</div>
                            </div>
                            <div class="demo-menu-item">
                                <div class="demo-menu-item-name">Pepperoni</div>
                                <div class="demo-menu-item-price">$14.99</div>
                            </div>
                            <div class="demo-menu-item">
                                <div class="demo-menu-item-name">Supreme</div>
                                <div class="demo-menu-item-price">$16.99</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="demo-tracker">
                    <div class="demo-tracker-title">📦 Order #45892 - Track Your Order</div>
                    <div class="demo-track-steps">
                        <div class="demo-track-step">
                            <div class="demo-step-dot">✓</div>
                            <span class="demo-step-label">Ordered</span>
                        </div>
                        <div class="demo-track-step">
                            <div class="demo-step-dot">✓</div>
                            <span class="demo-step-label">Preparing</span>
                        </div>
                        <div class="demo-track-step">
                            <div class="demo-step-dot current">🚗</div>
                            <span class="demo-step-label">On the way</span>
                        </div>
                        <div class="demo-track-step">
                            <div class="demo-step-dot pending">🏠</div>
                            <span class="demo-step-label">Delivered</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    14: {
        icon: '🎮',
        title: 'Gaming Platform',
        subtitle: 'Multiplayer gaming hub',
        description: 'Online gaming platform with matchmaking, leaderboards, tournaments, in-game chat, and virtual currency system. Supports multiple game genres with anti-cheat integration and streaming capabilities.',
        tech: ['Unity', 'C#', 'AWS', 'Photon', 'PlayFab', 'Azure'],
        stats: { games: '50+', players: '1M+', tournaments: '100+' },
        demo: `
            <div class="demo-gaming">
                <style>
                    .demo-gaming { font-family: 'Inter', sans-serif; }
                    .demo-games-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
                    .demo-game-card { background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; position: relative; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; }
                    .demo-game-card:hover { transform: scale(1.02); border-color: #c9a962; }
                    .demo-game-img { height: 100px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
                    .demo-game-info { padding: 12px; }
                    .demo-game-name { font-weight: 600; color: #fff; margin-bottom: 5px; }
                    .demo-game-players { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
                    .demo-game-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 10px 20px; background: #c9a962; border-radius: 20px; font-weight: 600; color: #000; opacity: 0; transition: all 0.3s; }
                    .demo-game-card:hover .demo-game-btn { opacity: 1; }
                    .demo-leaderboard { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-lb-title { font-weight: 600; margin-bottom: 15px; color: #fff; display: flex; justify-content: space-between; }
                    .demo-lb-view { font-size: 0.85rem; color: #c9a962; cursor: pointer; }
                    .demo-lb-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; }
                    .demo-lb-row:hover { background: rgba(255,255,255,0.05); }
                    .demo-lb-rank { width: 30px; text-align: center; font-weight: 700; }
                    .demo-lb-rank.gold { color: #ffd700; }
                    .demo-lb-rank.silver { color: #c0c0c0; }
                    .demo-lb-rank.bronze { color: #cd7f32; }
                    .demo-lb-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; }
                    .demo-lb-name { flex: 1; color: #fff; }
                    .demo-lb-score { font-weight: 700; color: #c9a962; }
                </style>
                <div class="demo-games-grid">
                    <div class="demo-game-card" onclick="startGame('Space Shooter')">
                        <div class="demo-game-img" style="background: linear-gradient(135deg, #1e3c72, #2a5298);">🚀</div>
                        <div class="demo-game-info">
                            <div class="demo-game-name">Space Shooter</div>
                            <div class="demo-game-players">👥 12,458 playing</div>
                        </div>
                        <div class="demo-game-btn">PLAY NOW</div>
                    </div>
                    <div class="demo-game-card" onclick="startGame('Racing Pro')">
                        <div class="demo-game-img" style="background: linear-gradient(135deg, #f59e0b, #ef4444);">🏎️</div>
                        <div class="demo-game-info">
                            <div class="demo-game-name">Racing Pro</div>
                            <div class="demo-game-players">👥 8,932 playing</div>
                        </div>
                        <div class="demo-game-btn">PLAY NOW</div>
                    </div>
                </div>
                <div class="demo-leaderboard">
                    <div class="demo-lb-title">
                        🏆 Global Leaderboard
                        <span class="demo-lb-view">View All →</span>
                    </div>
                    <div class="demo-lb-row">
                        <div class="demo-lb-rank gold">1</div>
                        <div class="demo-lb-avatar">🎮</div>
                        <div class="demo-lb-name">ProGamer2024</div>
                        <div class="demo-lb-score">2,458,920</div>
                    </div>
                    <div class="demo-lb-row">
                        <div class="demo-lb-rank silver">2</div>
                        <div class="demo-lb-avatar">⚔️</div>
                        <div class="demo-lb-name">NinjaWarrior</div>
                        <div class="demo-lb-score">2,345,100</div>
                    </div>
                    <div class="demo-lb-row">
                        <div class="demo-lb-rank bronze">3</div>
                        <div class="demo-lb-avatar">🎯</div>
                        <div class="demo-lb-name">SharpShooter</div>
                        <div class="demo-lb-score">2,198,500</div>
                    </div>
                </div>
                <script>
                    function startGame(name) {
                        alert('🎮 Launching ' + name + '...\n\nMatchmaking in progress...\nFound opponent! Starting game...');
                    }
                </script>
            </div>
        `
    },
    15: {
        icon: '📦',
        title: 'Logistics Tracker',
        subtitle: 'Supply chain management',
        description: 'Comprehensive logistics solution with IoT device integration, route optimization, warehouse management, and predictive maintenance. Features real-time shipment tracking and automated alerts.',
        tech: ['React', 'Java', 'IoT', 'Kafka', 'PostgreSQL', 'AWS IoT'],
        stats: { shipments: '10M+', routes: '1M+', efficiency: '+40%' },
        demo: `
            <div class="demo-logistics">
                <style>
                    .demo-logistics { font-family: 'Inter', sans-serif; }
                    .demo-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
                    .demo-stat-card { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-align: center; }
                    .demo-stat-icon { font-size: 2rem; margin-bottom: 8px; }
                    .demo-stat-value { font-size: 1.5rem; font-weight: 700; color: #c9a962; }
                    .demo-stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
                    .demo-shipments { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; }
                    .demo-ship-title { font-weight: 600; margin-bottom: 15px; color: #fff; }
                    .demo-ship-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #c9a962; }
                    .demo-ship-id { font-family: monospace; color: #c9a962; font-weight: 600; }
                    .demo-ship-route { flex: 1; color: rgba(255,255,255,0.8); font-size: 0.9rem; }
                    .demo-ship-status { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; }
                    .demo-ship-status.transit { background: rgba(201, 169, 98, 0.2); color: #c9a962; }
                    .demo-ship-status.delivered { background: rgba(16, 185, 129, 0.2); color: #10b981; }
                    .demo-map-preview { height: 120px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3)); border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; margin-top: 15px; }
                    .demo-map-route { position: absolute; width: 80%; height: 3px; background: linear-gradient(90deg, #c9a962, #10b981); border-radius: 2px; }
                    .demo-map-dot { position: absolute; width: 12px; height: 12px; background: #c9a962; border-radius: 50%; box-shadow: 0 0 10px rgba(201, 169, 98, 0.5); }
                    .demo-iot-status { display: flex; justify-content: space-between; margin-top: 15px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; font-size: 0.85rem; }
                    .demo-iot-item { display: flex; align-items: center; gap: 5px; color: #10b981; }
                </style>
                <div class="demo-stats-row">
                    <div class="demo-stat-card">
                        <div class="demo-stat-icon">📦</div>
                        <div class="demo-stat-value">2,847</div>
                        <div class="demo-stat-label">Active Shipments</div>
                    </div>
                    <div class="demo-stat-card">
                        <div class="demo-stat-icon">🚛</div>
                        <div class="demo-stat-value">156</div>
                        <div class="demo-stat-label">Vehicles</div>
                    </div>
                    <div class="demo-stat-card">
                        <div class="demo-stat-icon">📍</div>
                        <div class="demo-stat-value">98.5%</div>
                        <div class="demo-stat-label">On-Time Rate</div>
                    </div>
                </div>
                <div class="demo-shipments">
                    <div class="demo-ship-title">🚚 Live Shipments</div>
                    <div class="demo-ship-item">
                        <span class="demo-ship-id">#SH-8842</span>
                        <span class="demo-ship-route">Los Angeles → New York</span>
                        <span class="demo-ship-status transit">🚛 In Transit</span>
                    </div>
                    <div class="demo-ship-item">
                        <span class="demo-ship-id">#SH-8843</span>
                        <span class="demo-ship-route">Chicago → Miami</span>
                        <span class="demo-ship-status transit">🚛 In Transit</span>
                    </div>
                    <div class="demo-ship-item">
                        <span class="demo-ship-id">#SH-8839</span>
                        <span class="demo-ship-route">Seattle → Denver</span>
                        <span class="demo-ship-status delivered">✓ Delivered</span>
                    </div>
                    <div class="demo-map-preview">
                        <div class="demo-map-route"></div>
                        <div class="demo-map-dot" style="left: 15%;"></div>
                        <div class="demo-map-dot" style="left: 50%; background: #667eea;"></div>
                        <div class="demo-map-dot" style="left: 85%; background: #10b981;"></div>
                    </div>
                    <div class="demo-iot-status">
                        <div class="demo-iot-item">📡 156 IoT Sensors</div>
                        <div class="demo-iot-item">🌡 156 Active</div>
                        <div class="demo-iot-item">🔋 100% Avg</div>
                    </div>
                </div>
            </div>
        `
    }
};

class ProjectModal {
    constructor() {
        this.modal = document.getElementById('projectModal');
        this.modalBody = document.getElementById('projectModalBody');
        this.closeBtn = document.getElementById('projectModalClose');
        this.overlay = this.modal?.querySelector('.project-modal-overlay');
        this.projectCards = document.querySelectorAll('.project-card');
        
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        // Bind click events to project cards
        this.projectCards.forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.project;
                this.open(projectId);
            });
        });
        
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        // Overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    open(projectId) {
        const id = Number(projectId);
        // Navigate to the full-screen project demo
        window.location.href = `projects/project-${id}.html`;
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize Projects Modal
document.addEventListener('DOMContentLoaded', () => {
    new ProjectModal();
});

// ========================================
// LANGUAGE SWITCHER
// ========================================
const translations = {
    en: {
        // Navigation
        nav_about: 'About',
        nav_services: 'Services',
        nav_projects: 'Projects',
        nav_process: 'Process',
        nav_contact: 'Contact',
        nav_chat: 'Chat',
        
        // Hero
        hero_tag: 'Web Development Agency',
        hero_title_1: 'Web Solutions',
        hero_title_2: 'That Scale',
        hero_subtitle: 'Building fast, secure, and scalable web apps.',
        hero_cta: 'Start a Project',
        hero_scroll: 'Scroll to explore',
        
        // About
        about_label: 'About Us',
        about_text: '<span class="highlight">AydiLab.</span> is a leading web development agency delivering high-performance websites and applications for clients worldwide. From startups to enterprises, we build <span class="highlight">scalable solutions</span> that <span class="highlight">drive results</span>.',
        stat_projects: 'Projects Delivered',
        stat_experience: 'Years Experience',
        stat_satisfaction: 'Client Satisfaction',
        
        // Services
        services_label: 'Services',
        services_title: 'What We Do',
        service_1_title: 'Web Development',
        service_1_desc: 'Custom websites and web applications built with modern technologies for optimal performance.',
        service_2_title: 'Full-Stack Apps',
        service_2_desc: 'End-to-end application development with powerful backends and intuitive frontends.',
        service_3_title: 'API & Backend',
        service_3_desc: 'Robust APIs and server-side solutions for scalable, data-driven applications.',
        service_4_title: 'DevOps & Cloud',
        service_4_desc: 'Deployment, hosting, and infrastructure management for reliable web services.',
        service_link: 'Learn more →',
        
        // Process
        process_label: 'Process',
        process_title: 'How We Work',
        step_1_title: 'Discovery',
        step_1_desc: 'We analyze your requirements, target audience, and technical needs to define the project scope.',
        step_2_title: 'Planning',
        step_2_desc: 'Creating detailed technical architecture and project roadmap for efficient development.',
        step_3_title: 'Development',
        step_3_desc: 'Building your solution with clean code, best practices, and rigorous testing.',
        step_4_title: 'Deployment',
        step_4_desc: 'Launching to production with CI/CD pipelines, monitoring, and ongoing support.',
        
        // Projects
        projects_label: 'Portfolio',
        projects_title: 'Our Projects',
        project_about: 'About Project',
        project_tech: 'Technologies Used',
        project_btn: 'Start Similar Project',
        
        // Locations
        locations_label: 'Global',
        locations_title: 'Operating Worldwide',
        
        // Contact
        contact_label: 'Contact',
        contact_title: "Let's build something amazing together.",
        contact_desc: "Ready to turn your idea into reality? Tell us about your project and we'll get back to you within 24 hours.",
        contact_email: 'Email',
        contact_phone: 'Phone',
        contact_chat: 'Instant Chat',
        contact_chat_value: 'WhatsApp or Telegram →',
        form_name: 'Your Name',
        form_phone: 'Phone Number',
        form_email: 'Email Address',
        form_message: 'Tell us about your project',
        form_send: 'Send Message',
        form_platform_title: 'Choose where to send your message',
        form_success_title: 'Thanks for reaching out!',
        form_success_desc: "We'll get back within 24 hours.",
        
        // Chat Modal
        chat_title: 'Choose your preferred chat',
        chat_subtitle: 'Connect with us instantly through your favorite messaging app',
        whatsapp_name: 'WhatsApp',
        whatsapp_desc: 'Fast response, usually online',
        telegram_name: 'Telegram Bot',
        telegram_desc: 'Automated + human support',
        
        // Footer
        footer_tagline: 'Web Solutions That Scale.',
        footer_privacy: 'Privacy Policy',
        footer_copyright: '© 2026 AydiLab. All rights reserved.',
        
        // Project Modal
        project_stat_users: 'Users',
        project_stat_orders: 'Orders',
        project_stat_uptime: 'Uptime',
        project_stat_companies: 'Companies',
        project_stat_reports: 'Reports',
        project_stat_accuracy: 'Accuracy',
        project_stat_messages: 'Messages',
        project_stat_rating: 'Rating',
        project_stat_transactions: 'Transactions',
        project_stat_accounts: 'Accounts',
        project_stat_security: 'Security',
        project_stat_students: 'Students',
        project_stat_courses: 'Courses',
        project_stat_completion: 'Completion',
        project_stat_teams: 'Teams',
        project_stat_tasks: 'Tasks',
        project_stat_growth: 'Growth',
        project_stat_patients: 'Patients',
        project_stat_providers: 'Providers',
        project_stat_satisfaction: 'Satisfaction',
        project_stat_songs: 'Songs',
        project_stat_streams: 'Streams',
        project_stat_vehicles: 'Vehicles',
        project_stat_rentals: 'Rentals',
        project_stat_cities: 'Cities',
        project_stat_posts: 'Posts',
        project_stat_engagement: 'Engagement',
        project_stat_listings: 'Listings',
        project_stat_agents: 'Agents',
        project_stat_sales: 'Sales',
        project_stat_events: 'Events',
        project_stat_live: 'Live',
        project_stat_restaurants: 'Restaurants',
        project_stat_drivers: 'Drivers',
        project_stat_games: 'Games',
        project_stat_players: 'Players',
        project_stat_tournaments: 'Tournaments',
        project_stat_shipments: 'Shipments',
        project_stat_routes: 'Routes',
        project_stat_efficiency: 'Efficiency'
    },
    ru: {
        // Navigation
        nav_about: 'О нас',
        nav_services: 'Услуги',
        nav_projects: 'Проекты',
        nav_process: 'Процесс',
        nav_contact: 'Контакты',
        nav_chat: 'Чат',
        
        // Hero
        hero_tag: 'Веб-разработка',
        hero_title_1: 'Веб-решения',
        hero_title_2: 'которые масштабируются',
        hero_subtitle: 'Создаем быстрые, безопасные и масштабируемые веб-приложения.',
        hero_cta: 'Начать проект',
        hero_scroll: 'Прокрутите вниз',
        
        // About
        about_label: 'О нас',
        about_text: '<span class="highlight">AydiLab.</span> — ведущее агентство веб-разработки, создающее высокопроизводительные сайты и приложения для клиентов по всему миру. От стартапов до крупных компаний — мы строим <span class="highlight">масштабируемые решения</span>, которые <span class="highlight">приносят результаты</span>.',
        stat_projects: 'Выполнено проектов',
        stat_experience: 'Лет опыта',
        stat_satisfaction: 'Довольных клиентов',
        
        // Services
        services_label: 'Услуги',
        services_title: 'Что мы делаем',
        service_1_title: 'Веб-разработка',
        service_1_desc: 'Создание современных сайтов и веб-приложений с использованием передовых технологий.',
        service_2_title: 'Full-Stack приложения',
        service_2_desc: 'Разработка комплексных приложений с мощным бэкендом и удобным фронтендом.',
        service_3_title: 'API и бэкенд',
        service_3_desc: 'Надежные API и серверные решения для масштабируемых приложений.',
        service_4_title: 'DevOps и облака',
        service_4_desc: 'Развертывание, хостинг и управление инфраструктурой для надежных сервисов.',
        service_link: 'Подробнее →',
        
        // Process
        process_label: 'Процесс',
        process_title: 'Как мы работаем',
        step_1_title: 'Анализ',
        step_1_desc: 'Изучаем ваши требования, целевую аудиторию и технические потребности для определения объема проекта.',
        step_2_title: 'Планирование',
        step_2_desc: 'Создаем детальную техническую архитектуру и дорожную карту проекта.',
        step_3_title: 'Разработка',
        step_3_desc: 'Создаем решение с чистым кодом, лучшими практиками и тщательным тестированием.',
        step_4_title: 'Запуск',
        step_4_desc: 'Развертываем в продакшн с CI/CD, мониторингом и постоянной поддержкой.',
        
        // Projects
        projects_label: 'Портфолио',
        projects_title: 'Наши проекты',
        project_about: 'О проекте',
        project_tech: 'Используемые технологии',
        project_btn: 'Заказать похожий',
        
        // Locations
        locations_label: 'Глобально',
        locations_title: 'Работаем по всему миру',
        
        // Contact
        contact_label: 'Контакты',
        contact_title: 'Давайте создадим что-то удивительное вместе.',
        contact_desc: 'Готовы воплотить вашу идею в жизнь? Расскажите о проекте — мы ответим в течение 24 часов.',
        contact_email: 'Email',
        contact_phone: 'Телефон',
        contact_chat: 'Быстрый чат',
        contact_chat_value: 'WhatsApp или Telegram →',
        form_name: 'Ваше имя',
        form_phone: 'Номер телефона',
        form_email: 'Email адрес',
        form_message: 'Расскажите о вашем проекте',
        form_send: 'Отправить',
        form_platform_title: 'Выберите куда отправить сообщение',
        form_success_title: 'Спасибо за обращение!',
        form_success_desc: 'Мы ответим в течение 24 часов.',
        
        // Chat Modal
        chat_title: 'Выберите чат',
        chat_subtitle: 'Свяжитесь с нами через любимый мессенджер',
        whatsapp_name: 'WhatsApp',
        whatsapp_desc: 'Быстрый ответ, обычно онлайн',
        telegram_name: 'Telegram Bot',
        telegram_desc: 'Автоматизация + человек',
        
        // Footer
        footer_tagline: 'Веб-решения которые масштабируются.',
        footer_privacy: 'Политика конфиденциальности',
        footer_copyright: '© 2026 AydiLab. Все права защищены.',
        
        // Project Modal - Statistics
        project_stat_users: 'Пользователи',
        project_stat_orders: 'Заказы',
        project_stat_uptime: 'Аптайм',
        project_stat_companies: 'Компании',
        project_stat_reports: 'Отчеты',
        project_stat_accuracy: 'Точность',
        project_stat_messages: 'Сообщения',
        project_stat_rating: 'Рейтинг',
        project_stat_transactions: 'Транзакции',
        project_stat_accounts: 'Счета',
        project_stat_security: 'Безопасность',
        project_stat_students: 'Студенты',
        project_stat_courses: 'Курсы',
        project_stat_completion: 'Завершение',
        project_stat_teams: 'Команды',
        project_stat_tasks: 'Задачи',
        project_stat_growth: 'Рост',
        project_stat_patients: 'Пациенты',
        project_stat_providers: 'Врачи',
        project_stat_satisfaction: 'Довольных',
        project_stat_songs: 'Треки',
        project_stat_streams: 'Стримы',
        project_stat_vehicles: 'Авто',
        project_stat_rentals: 'Аренды',
        project_stat_cities: 'Города',
        project_stat_posts: 'Посты',
        project_stat_engagement: 'Вовлечение',
        project_stat_listings: 'Объявления',
        project_stat_agents: 'Агенты',
        project_stat_sales: 'Продажи',
        project_stat_events: 'События',
        project_stat_live: 'Онлайн',
        project_stat_restaurants: 'Рестораны',
        project_stat_drivers: 'Курьеры',
        project_stat_games: 'Игры',
        project_stat_players: 'Игроки',
        project_stat_tournaments: 'Турниры',
        project_stat_shipments: 'Отправки',
        project_stat_routes: 'Маршруты',
        project_stat_efficiency: 'Эффективность'
    },
    am: {
        // Navigation
        nav_about: 'Մեր մասին',
        nav_services: 'Ծառայություններ',
        nav_projects: 'Նախագծեր',
        nav_process: 'Գործընթաց',
        nav_contact: 'Կապ',
        nav_chat: 'Չաթ',
        
        // Hero
        hero_tag: 'Վեբ մշակում',
        hero_title_1: 'Վեբ լուծումներ',
        hero_title_2: 'որոնք մասշտաբվում են',
        hero_subtitle: 'Ստեղծում ենք արագ, անվտանգ և մասշտաբելի վեբ հավելվածներ։',
        hero_cta: 'Սկսել նախագիծ',
        hero_scroll: 'Ոլորել ներքև',
        
        // About
        about_label: 'Մեր մասին',
        about_text: '<span class="highlight">AydiLab.</span>-ը առաջատար վեբ մշակման գործակալություն է, որը ստեղծում է բարձր արդյունավետության կայքեր և հավելվածներ աշխարհի հաճախորդների համար: Ստարտափներից մինչև խոշոր ընկերություններ՝ մենք կառուցում ենք <span class="highlight">մասշտաբելի լուծումներ</span>, որոնք <span class="highlight">ապահովում են արդյունքներ</span>:',
        stat_projects: 'Իրականացված նախագծեր',
        stat_experience: 'Տարիների փորձ',
        stat_satisfaction: 'Գոհ հաճախորդներ',
        
        // Services
        services_label: 'Ծառայություններ',
        services_title: 'Ինչ ենք մենք անում',
        service_1_title: 'Վեբ մշակում',
        service_1_desc: 'Ժամանակակից տեխնոլոգիաներով սովորական կայքերի և վեբ հավելվածների ստեղծում։',
        service_2_title: 'Full-Stack հավելվածներ',
        service_2_desc: 'Հզոր բэкенդով և հարմարավետ ֆրոնտենդով հավելվածների մշակում։',
        service_3_title: 'API և բэкенդ',
        service_3_desc: 'Հուսալի API-ներ և սերվերի լուծումներ մասշտաբելի հավելվածների համար։',
        service_4_title: 'DevOps և ամպ',
        service_4_desc: 'Տեղակայում, հոսթինգ և ենթակառուցվածքի կառավարում հուսալի ծառայությունների համար։',
        service_link: 'Իմացեք ավելին →',
        
        // Process
        process_label: 'Գործընթաց',
        process_title: 'Ինչպես ենք մենք աշխատում',
        step_1_title: 'Վերլուծություն',
        step_1_desc: 'Վերլուծում ենք ձեր պահանջները, թիրախային լսարանը և տեխնիկական կարիքները՝ նախագծի շրջանակները սահմանելու համար։',
        step_2_title: 'Պլանավորում',
        step_2_desc: 'Մանրամասն տեխնիկական ճարտարապետություն և նախագծի ճանապարհային քարտեզի ստեղծում։',
        step_3_title: 'Մշակում',
        step_3_desc: 'Ձեր լուծման ստեղծումը մաքուր կոդով, լավագույն փորձով և խիստ փորձարկմամբ։',
        step_4_title: 'Տեղակայում',
        step_4_desc: 'CI/CD, մոնիտորինգ և մշտական աջակցությամբ արտադրության մեջ запуск։',
        
        // Projects
        projects_label: 'Պորտֆոլիո',
        projects_title: 'Մեր նախագծերը',
        project_about: 'Նախագծի մասին',
        project_tech: 'Օգտագործվող տեխնոլոգիաներ',
        project_btn: 'Պատվիրել նմանը',
        
        // Locations
        locations_label: 'Համաշխարհային',
        locations_title: 'Աշխատում ենք ամբողջ աշխարհում',
        
        // Contact
        contact_label: 'Կապ',
        contact_title: 'Եկեք միասին ստեղծենք մի բան զարմանալի։',
        contact_desc: 'Պատրա՞ստ եք ձեր գաղափարը կյանքի կոչել: Պատմեք նախագծի մասին՝ մենք կպատասխանենք 24 ժամվա ընթացքում։',
        contact_email: 'Էլ. փոստ',
        contact_phone: 'Հեռախոս',
        contact_chat: 'Արագ չաթ',
        contact_chat_value: 'WhatsApp կամ Telegram →',
        form_name: 'Ձեր անունը',
        form_phone: 'Հեռախոսահամար',
        form_email: 'Էլ. փոստի հասցե',
        form_message: 'Պատմեք ձեր նախագծի մասին',
        form_send: 'Ուղարկել',
        form_platform_title: 'Ընտրեք ուր ուղարկել հաղորդագրությունը',
        form_success_title: 'Շնորհակալություն դիմելու համար։',
        form_success_desc: 'Մենք կպատասխանենք 24 ժամվա ընթացքում։',
        
        // Chat Modal
        chat_title: 'Ընտրեք չաթ',
        chat_subtitle: 'Կապվեք մեզ հետ ձեր նախընտրած մեսենջերով',
        whatsapp_name: 'WhatsApp',
        whatsapp_desc: 'Արագ պատասխան, սովորաբար օնլայն',
        telegram_name: 'Telegram Bot',
        telegram_desc: 'Ավտոմատացում + մարդ',
        
        // Footer
        footer_tagline: 'Վեբ լուծումներ, որոնք մասշտաբվում են։',
        footer_privacy: 'Գաղտնիության քաղաքականություն',
        footer_copyright: '© 2026 AydiLab. Բոլոր իրավունքները պաշտպանված են:',
        
        // Project Modal - Statistics
        project_stat_users: 'Օգտատերեր',
        project_stat_orders: 'Պատվերներ',
        project_stat_uptime: 'Ապտայմ',
        project_stat_companies: 'Ընկերություններ',
        project_stat_reports: 'Հաշվետվություններ',
        project_stat_accuracy: 'Ճշգրտություն',
        project_stat_messages: 'Հաղորդագրություններ',
        project_stat_rating: 'Վարկանիշ',
        project_stat_transactions: 'Գործարքներ',
        project_stat_accounts: 'Հաշիվներ',
        project_stat_security: 'Անվտանգություն',
        project_stat_students: 'Ուսանողներ',
        project_stat_courses: 'Դասընթացներ',
        project_stat_completion: 'Ավարտում',
        project_stat_teams: 'Թիմեր',
        project_stat_tasks: 'Առաջադրանքներ',
        project_stat_growth: 'Աճ',
        project_stat_patients: 'Հիվանդներ',
        project_stat_providers: 'Բժիշկներ',
        project_stat_satisfaction: 'Գոհություն',
        project_stat_songs: 'Երգեր',
        project_stat_streams: 'Սթրիմներ',
        project_stat_vehicles: 'Ավտո',
        project_stat_rentals: 'Վարձակալություններ',
        project_stat_cities: 'Քաղաքներ',
        project_stat_posts: 'Փոստեր',
        project_stat_engagement: 'Ներգրավվածություն',
        project_stat_listings: 'Առքուվաճառք',
        project_stat_agents: 'Գործակալներ',
        project_stat_sales: 'Վաճառքներ',
        project_stat_events: 'Միջոցառումներ',
        project_stat_live: 'Ուղիղ',
        project_stat_restaurants: 'Ռեստորաններ',
        project_stat_drivers: 'Առաքիչներ',
        project_stat_games: 'Խաղեր',
        project_stat_players: 'Խաղացողներ',
        project_stat_tournaments: 'Մրցաշարեր',
        project_stat_shipments: 'Առաքումներ',
        project_stat_routes: 'Ճանապարհներ',
        project_stat_efficiency: 'Արդյունավետություն'
    }
};

class LanguageSwitcher {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'en';
        this.dropdown = document.getElementById('langDropdown');
        this.toggle = document.getElementById('langToggle');
        this.menu = document.getElementById('langMenu');
        this.langBtns = document.querySelectorAll('.lang-btn');
        this.langCurrent = document.querySelector('.lang-current');
        
        this.init();
    }
    
    init() {
        if (!this.toggle) return;
        
        // Set initial language
        this.setLanguage(this.currentLang, false);
        
        // Toggle dropdown
        this.toggle.addEventListener('click', () => {
            this.dropdown.classList.toggle('active');
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target)) {
                this.dropdown.classList.remove('active');
            }
        });
        
        // Language buttons
        this.langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.setLanguage(lang);
                this.dropdown.classList.remove('active');
            });
        });
    }
    
    setLanguage(lang, animate = true) {
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        
        // Update dropdown UI
        this.langCurrent.textContent = lang.toUpperCase();
        this.langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        // Update all translatable elements
        this.updateContent(animate);
    }
    
    updateContent(animate) {
        const t = translations[this.currentLang];
        
        // Navigation
        document.querySelectorAll('[data-translate="nav_about"]').forEach(el => el.textContent = t.nav_about);
        document.querySelectorAll('[data-translate="nav_services"]').forEach(el => el.textContent = t.nav_services);
        document.querySelectorAll('[data-translate="nav_projects"]').forEach(el => el.textContent = t.nav_projects);
        document.querySelectorAll('[data-translate="nav_process"]').forEach(el => el.textContent = t.nav_process);
        document.querySelectorAll('[data-translate="nav_contact"]').forEach(el => el.textContent = t.nav_contact);
        document.querySelectorAll('[data-translate="nav_chat"]').forEach(el => el.textContent = t.nav_chat);
        
        // Hero
        document.querySelectorAll('[data-translate="hero_tag"]').forEach(el => el.textContent = t.hero_tag);
        document.querySelectorAll('[data-translate="hero_title_1"]').forEach(el => el.textContent = t.hero_title_1);
        document.querySelectorAll('[data-translate="hero_title_2"]').forEach(el => el.textContent = t.hero_title_2);
        document.querySelectorAll('[data-translate="hero_subtitle"]').forEach(el => el.textContent = t.hero_subtitle);
        document.querySelectorAll('[data-translate="hero_cta"]').forEach(el => el.textContent = t.hero_cta);
        document.querySelectorAll('[data-translate="hero_scroll"]').forEach(el => el.textContent = t.hero_scroll);
        
        // About
        document.querySelectorAll('[data-translate="about_label"]').forEach(el => el.textContent = t.about_label);
        document.querySelectorAll('[data-translate="about_text"]').forEach(el => el.innerHTML = t.about_text);
        document.querySelectorAll('[data-translate="stat_projects"]').forEach(el => el.textContent = t.stat_projects);
        document.querySelectorAll('[data-translate="stat_experience"]').forEach(el => el.textContent = t.stat_experience);
        document.querySelectorAll('[data-translate="stat_satisfaction"]').forEach(el => el.textContent = t.stat_satisfaction);
        
        // Services
        document.querySelectorAll('[data-translate="services_label"]').forEach(el => el.textContent = t.services_label);
        document.querySelectorAll('[data-translate="services_title"]').forEach(el => el.textContent = t.services_title);
        document.querySelectorAll('[data-translate="service_1_title"]').forEach(el => el.textContent = t.service_1_title);
        document.querySelectorAll('[data-translate="service_1_desc"]').forEach(el => el.textContent = t.service_1_desc);
        document.querySelectorAll('[data-translate="service_2_title"]').forEach(el => el.textContent = t.service_2_title);
        document.querySelectorAll('[data-translate="service_2_desc"]').forEach(el => el.textContent = t.service_2_desc);
        document.querySelectorAll('[data-translate="service_3_title"]').forEach(el => el.textContent = t.service_3_title);
        document.querySelectorAll('[data-translate="service_3_desc"]').forEach(el => el.textContent = t.service_3_desc);
        document.querySelectorAll('[data-translate="service_4_title"]').forEach(el => el.textContent = t.service_4_title);
        document.querySelectorAll('[data-translate="service_4_desc"]').forEach(el => el.textContent = t.service_4_desc);
        document.querySelectorAll('[data-translate="service_link"]').forEach(el => el.textContent = t.service_link);
        
        // Process
        document.querySelectorAll('[data-translate="process_label"]').forEach(el => el.textContent = t.process_label);
        document.querySelectorAll('[data-translate="process_title"]').forEach(el => el.textContent = t.process_title);
        document.querySelectorAll('[data-translate="step_1_title"]').forEach(el => el.textContent = t.step_1_title);
        document.querySelectorAll('[data-translate="step_1_desc"]').forEach(el => el.textContent = t.step_1_desc);
        document.querySelectorAll('[data-translate="step_2_title"]').forEach(el => el.textContent = t.step_2_title);
        document.querySelectorAll('[data-translate="step_2_desc"]').forEach(el => el.textContent = t.step_2_desc);
        document.querySelectorAll('[data-translate="step_3_title"]').forEach(el => el.textContent = t.step_3_title);
        document.querySelectorAll('[data-translate="step_3_desc"]').forEach(el => el.textContent = t.step_3_desc);
        document.querySelectorAll('[data-translate="step_4_title"]').forEach(el => el.textContent = t.step_4_title);
        document.querySelectorAll('[data-translate="step_4_desc"]').forEach(el => el.textContent = t.step_4_desc);
        
        // Projects
        document.querySelectorAll('[data-translate="projects_label"]').forEach(el => el.textContent = t.projects_label);
        document.querySelectorAll('[data-translate="projects_title"]').forEach(el => el.textContent = t.projects_title);
        
        // Locations
        document.querySelectorAll('[data-translate="locations_label"]').forEach(el => el.textContent = t.locations_label);
        document.querySelectorAll('[data-translate="locations_title"]').forEach(el => el.textContent = t.locations_title);
        
        // Contact
        document.querySelectorAll('[data-translate="contact_label"]').forEach(el => el.textContent = t.contact_label);
        document.querySelectorAll('[data-translate="contact_title"]').forEach(el => el.textContent = t.contact_title);
        document.querySelectorAll('[data-translate="contact_desc"]').forEach(el => el.textContent = t.contact_desc);
        document.querySelectorAll('[data-translate="contact_email"]').forEach(el => el.textContent = t.contact_email);
        document.querySelectorAll('[data-translate="contact_phone"]').forEach(el => el.textContent = t.contact_phone);
        document.querySelectorAll('[data-translate="contact_chat"]').forEach(el => el.textContent = t.contact_chat);
        document.querySelectorAll('[data-translate="contact_chat_value"]').forEach(el => el.textContent = t.contact_chat_value);
        
        // Form
        document.querySelectorAll('[data-translate="form_name"]').forEach(el => {
            if (el.tagName === 'LABEL') el.textContent = t.form_name;
            else if (el.tagName === 'INPUT') el.placeholder = t.form_name;
        });
        document.querySelectorAll('[data-translate="form_phone"]').forEach(el => {
            if (el.tagName === 'LABEL') el.textContent = t.form_phone;
            else if (el.tagName === 'INPUT') el.placeholder = t.form_phone;
        });
        document.querySelectorAll('[data-translate="form_email"]').forEach(el => {
            if (el.tagName === 'LABEL') el.textContent = t.form_email;
            else if (el.tagName === 'INPUT') el.placeholder = t.form_email;
        });
        document.querySelectorAll('[data-translate="form_message"]').forEach(el => {
            if (el.tagName === 'LABEL') el.textContent = t.form_message;
            else if (el.tagName === 'TEXTAREA') el.placeholder = t.form_message;
        });
        document.querySelectorAll('[data-translate="form_send"]').forEach(el => el.textContent = t.form_send);
        document.querySelectorAll('[data-translate="form_platform_title"]').forEach(el => el.textContent = t.form_platform_title);
        document.querySelectorAll('[data-translate="form_success_title"]').forEach(el => el.textContent = t.form_success_title);
        document.querySelectorAll('[data-translate="form_success_desc"]').forEach(el => el.textContent = t.form_success_desc);
        
        // Chat Modal
        document.querySelectorAll('[data-translate="chat_title"]').forEach(el => el.textContent = t.chat_title);
        document.querySelectorAll('[data-translate="chat_subtitle"]').forEach(el => el.textContent = t.chat_subtitle);
        document.querySelectorAll('[data-translate="whatsapp_name"]').forEach(el => el.textContent = t.whatsapp_name);
        document.querySelectorAll('[data-translate="whatsapp_desc"]').forEach(el => el.textContent = t.whatsapp_desc);
        document.querySelectorAll('[data-translate="telegram_name"]').forEach(el => el.textContent = t.telegram_name);
        document.querySelectorAll('[data-translate="telegram_desc"]').forEach(el => el.textContent = t.telegram_desc);
        
        // Footer
        document.querySelectorAll('[data-translate="footer_tagline"]').forEach(el => el.textContent = t.footer_tagline);
        document.querySelectorAll('[data-translate="footer_privacy"]').forEach(el => el.textContent = t.footer_privacy);
        document.querySelectorAll('[data-translate="footer_copyright"]').forEach(el => el.textContent = t.footer_copyright);
        
        // Animate content change
        if (animate && typeof gsap !== 'undefined') {
            gsap.fromTo('[data-translate]', 
                { opacity: 0.5, y: 5 },
                { opacity: 1, y: 0, duration: 0.3, stagger: 0.01 }
            );
        }
    }
    
    getCurrentLang() {
        return this.currentLang;
    }
}

// Initialize Language Switcher
document.addEventListener('DOMContentLoaded', () => {
    window.langSwitcher = new LanguageSwitcher();
});
