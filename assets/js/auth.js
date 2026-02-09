// Check authentication status on page load
function checkAuthStatus() {
    const isAuthenticated = sessionStorage.getItem('macAuthenticated') === 'true';
    const userRole = sessionStorage.getItem('userRole');

    if (isAuthenticated) {
        if (userRole === 'admin') {
            showAdminDashboard();
        } else {
            showMemberDashboard();
        }
    }
}

// Show login modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'loginModal';
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md';
    modal.innerHTML = `
    <div class="relative w-full max-w-md mx-4">
        <div class="glass-panel rounded-xl p-10 flex flex-col shadow-2xl relative">
            <button onclick="closeLoginModal()" class="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
                <span class="material-symbols-outlined text-2xl">close</span>
            </button>
            
            <div class="flex justify-center mb-6">
                <span class="material-symbols-outlined text-primary text-4xl font-light">lock_open</span>
            </div>
            
            <h1 class="text-white font-serif text-3xl md:text-4xl font-bold leading-tight text-center pb-8">Access the Vault</h1>
            
            <form class="flex flex-col gap-6" onsubmit="handleLogin(event)">
                <div class="flex flex-col gap-2">
                    <label class="small-caps text-blush text-xs font-semibold">Email Address</label>
                    <input class="w-full rounded-lg text-white border border-blush/50 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 h-14 placeholder:text-blush/40 px-4 transition-all" placeholder="MEMBER@MACLUB.COM" type="email" required/>
                </div>
                
                <div class="flex flex-col gap-2">
                    <label class="small-caps text-blush text-xs font-semibold">Security Key</label>
                    <input class="w-full rounded-lg text-white border border-blush/50 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 h-14 placeholder:text-blush/40 px-4 transition-all" placeholder="••••••••••••" type="password" required/>
                </div>
                
                <button class="w-full mt-4 flex cursor-pointer items-center justify-center rounded-lg h-14 bg-primary text-white text-base font-bold tracking-widest uppercase transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,17,50,0.3)]" type="submit">
                    Authenticate
                </button>
            </form>
            
            <div class="mt-8 flex flex-col items-center gap-3">
                <a class="text-blush text-xs font-medium uppercase tracking-widest hover:text-white transition-colors underline decoration-primary/30 underline-offset-4" href="#">Forgot Access Credentials?</a>
                <div class="h-[1px] w-12 bg-blush/50 my-2"></div>
                <p class="text-blush/60 text-[10px] uppercase tracking-[0.2em] text-center">Protected by military-grade encryption</p>
            </div>
        </div>
    </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();

    // Get form values
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;

    // Define credentials
    const adminCredentials = {
        email: 'admin@mac.com',
        password: 'mac-admin-2026'
    };

    const memberCredentials = {
        email: 'member@mac.com',
        password: 'mac2026'
    };

    // Check admin credentials first
    if (email === adminCredentials.email && password === adminCredentials.password) {
        // Set admin authentication state
        sessionStorage.setItem('macAuthenticated', 'true');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userRole', 'admin');

        // Close modal and show admin dashboard
        closeLoginModal();
        showAdminDashboard();
    }
    // Check member credentials
    else if (email === memberCredentials.email && password === memberCredentials.password) {
        // Set member authentication state
        sessionStorage.setItem('macAuthenticated', 'true');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userRole', 'member');

        // Close modal and show member dashboard
        closeLoginModal();
        showMemberDashboard();
    } else {
        alert('Invalid credentials. Please contact administration for access.');
    }
}

// Handle logout
function handleLogout() {
    // Clear session
    sessionStorage.removeItem('macAuthenticated');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('registeredEvents');

    // Hide both dashboards
    const memberDash = document.getElementById('membersDashboard');
    const adminDash = document.getElementById('adminDashboard');
    if (memberDash) memberDash.style.display = 'none';
    if (adminDash) adminDash.style.display = 'none';

    // Show main site
    document.getElementById('mainSite').style.display = 'block';

    // Scroll to top
    window.scrollTo(0, 0);
}
