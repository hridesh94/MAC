// Check authentication status on page load
async function checkAuthStatus() {
    try {
        // Safety check: ensure waitForSupabase is defined
        if (typeof window.waitForSupabase !== 'function') {
            // This might happen if script loads are out of order or failed
            console.warn('waitForSupabase not defined yet, skipping initial auth check');
            return;
        }

        // Wait for Supabase to be ready
        const supabase = await window.waitForSupabase();

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session:', error.message);
            return;
        }

        if (session) {
            // Fetch profile role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError.message);
                return;
            }

            if (profile) {
                sessionStorage.setItem('macAuthenticated', 'true');
                sessionStorage.setItem('userEmail', session.user.email);
                sessionStorage.setItem('userRole', profile.role);

                if (profile.role === 'admin') {
                    showAdminDashboard();
                } else {
                    showMemberDashboard();
                }
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error.message);
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
                    <input class="w-full rounded-lg text-white border border-blush/50 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 h-14 placeholder:text-blush/40 px-4 transition-all" placeholder="MEMBER@MACLUB.COM" type="email" name="email" required/>
                </div>
                
                <div class="flex flex-col gap-2">
                    <label class="small-caps text-blush text-xs font-semibold">Security Key</label>
                    <input class="w-full rounded-lg text-white border border-blush/50 bg-black/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 h-14 placeholder:text-blush/40 px-4 transition-all" placeholder="••••••••••••" type="password" name="password" required/>
                </div>
                
                <button id="authBtn" class="w-full mt-4 flex cursor-pointer items-center justify-center rounded-lg h-14 bg-primary text-white text-base font-bold tracking-widest uppercase transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,17,50,0.3)]" type="submit">
                    Authenticate
                </button>
            </form>
            
            <div id="loginError" class="mt-4 text-red-500 text-xs text-center hidden"></div>
            
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
async function handleLogin(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    const authBtn = document.getElementById('authBtn');
    const errorEl = document.getElementById('loginError');

    authBtn.textContent = 'Authenticating...';
    authBtn.disabled = true;
    errorEl.classList.add('hidden');

    try {
        if (typeof window.waitForSupabase !== 'function') {
            throw new Error('System initialization failed. Please refresh the page.');
        }

        // Wait for Supabase to be ready with timeout
        const supabase = await Promise.race([
            window.waitForSupabase(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Authentication system timeout. Please refresh the page.')), 10000)
            )
        ]);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Fetch profile role after success
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;

        // Set session state
        sessionStorage.setItem('macAuthenticated', 'true');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userRole', profile.role);

        closeLoginModal();

        if (profile.role === 'admin') {
            showAdminDashboard();
        } else {
            showMemberDashboard();
        }

    } catch (err) {
        console.error('Login error:', err.message);
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
        authBtn.textContent = 'Authenticate';
        authBtn.disabled = false;
    }
}

// Handle logout
async function handleLogout() {
    await supabase.auth.signOut();

    // Clear session
    sessionStorage.clear();

    // Reset UI
    location.reload(); // Simplest way to reset the SPA state
}
