document.addEventListener('DOMContentLoaded', () => {
    // Preloader functionality
    const preloader = document.getElementById('preloader');
    const body = document.body;
    
    if (preloader) {
        // Remove preloader after 2.5 seconds
        setTimeout(() => {
            preloader.classList.add('hidden');
            body.classList.remove('preloading');
            
            // Remove preloader from DOM after transition completes
            setTimeout(() => {
                preloader.remove();
            }, 800); // Match CSS transition duration
        }, 3500); // 3.5 seconds display time
    }
    
    // ===== SECURITY PROTECTION =====
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    }, true);
    
    // Disable text selection
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    }, true);
    
    // Disable drag and drop
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    }, true);
    
    // Disable copy, cut, paste
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        return false;
    }, true);
    
    document.addEventListener('cut', (e) => {
        e.preventDefault();
        return false;
    }, true);
    
    document.addEventListener('paste', (e) => {
        e.preventDefault();
        return false;
    }, true);
    
    // Disable keyboard shortcuts (Ctrl+S, Ctrl+U, Ctrl+Shift+I, F12)
    document.addEventListener('keydown', (e) => {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+I (DevTools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+S (Save Page)
        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+P (Print)
        if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+A (Select All) - only on body
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
            if (e.target === document.body) {
                e.preventDefault();
                return false;
            }
        }
    }, true);
    
    // Detect DevTools opening (basic detection)
    const devtools = { open: false };
    const threshold = 160;
    
    const checkDevTools = () => {
        const width = window.outerWidth - window.innerWidth;
        const height = window.outerHeight - window.innerHeight;
        
        if (width > threshold || height > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                // Redirect or show warning
                document.body.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;z-index:99999;"><div style="text-align:center;color:#fff;font-family:sans-serif;"><h1 style="font-size:2rem;margin-bottom:20px;">⚠️ Access Denied</h1><p>Developer tools are not allowed on this site.</p></div></div>';
            }
        } else {
            devtools.open = false;
        }
    };
    
    // Check periodically
    setInterval(checkDevTools, 1000);
    
    // Disable console methods
    const disableConsole = () => {
        const methods = ['log', 'info', 'warn', 'error', 'debug', 'table', 'clear', 'dir', 'group', 'groupEnd'];
        methods.forEach(method => {
            console[method] = function() {};
        });
    };
    disableConsole();
    
    // ===== CHAT FORM FUNCTIONALITY =====
    const chatForm = document.getElementById('chatForm');
    const platformBtns = document.querySelectorAll('.platform-btn-inline');
    const formSuccess = document.getElementById('formSuccess');
    
    let selectedPlatform = 'whatsapp';
    const WHATSAPP_NUMBER = '37493094412';
    const TELEGRAM_USERNAME = 'Code_Bard_Project';
    
    platformBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedPlatform = btn.dataset.platform;
            platformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('chatName').value;
            const phone = document.getElementById('chatPhone').value;
            const email = document.getElementById('chatEmail').value;
            const message = document.getElementById('chatMessage').value;
            
            if (!name || !message) return;
            
            let fullMessage = `Hello! I'm ${name}.`;
            if (phone) fullMessage += `\n📞 Phone: ${phone}`;
            if (email) fullMessage += `\n📧 Email: ${email}`;
            fullMessage += `\n\n${message}`;
            
            let url = '';
            
            if (selectedPlatform === 'whatsapp') {
                const encodedMessage = encodeURIComponent(fullMessage);
                url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
            } else if (selectedPlatform === 'telegram') {
                const encodedMessage = encodeURIComponent(fullMessage);
                url = `https://t.me/${TELEGRAM_USERNAME}?text=${encodedMessage}`;
            }
            
            if (url) {
                window.open(url, '_blank');
                chatForm.classList.add('hidden');
                formSuccess.classList.add('active');
                
                setTimeout(() => {
                    chatForm.reset();
                    chatForm.classList.remove('hidden');
                    formSuccess.classList.remove('active');
                }, 3000);
            }
        });
    }
});
