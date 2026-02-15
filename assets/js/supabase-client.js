// Initialize Supabase Client
const SUPABASE_URL = 'https://azmfbhffgqqeqbxmkdqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWZiaGZmZ3FxZXFieG1rZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTc1NjksImV4cCI6MjA4NjIzMzU2OX0.74VBnyYMCfgOH5IQvj1c1-O2GCQTG6ul5bXRgTizJWU';

// Global Supabase client
let _supabaseClient;
let supabaseReady = false;
let supabaseInitPromise = null;

// Ensure waitForSupabase is defined immediately
window.waitForSupabase = async function () {
    return initSupabase();
};

/**
 * Initialize Supabase client and return a Promise that resolves when ready
 * @returns {Promise<Object>} Promise that resolves to the Supabase client
 */
function initSupabase() {
    // Return existing promise if already initializing
    if (supabaseInitPromise) {
        return supabaseInitPromise;
    }

    // Return immediately if already initialized
    if (supabaseReady && _supabaseClient) {
        return Promise.resolve(_supabaseClient);
    }

    // Create new initialization promise
    supabaseInitPromise = new Promise((resolve, reject) => {
        // Set a timeout to reject if CDN takes too long
        const timeout = setTimeout(() => {
            console.error('❌ Supabase initialization timed out after 10s');
            reject(new Error('Supabase CDN failed to load within 10 seconds. Please check your internet connection.'));
        }, 10000);

        const checkAndInit = () => {
            // Check if Supabase SDK is loaded
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                clearTimeout(timeout);
                try {
                    if (!_supabaseClient) {
                        _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                        window.supabase = _supabaseClient; // Make specific client globally accessible
                        supabaseReady = true;
                    }
                    resolve(_supabaseClient);
                } catch (error) {
                    console.error('❌ Error creating Supabase client:', error);
                    reject(error);
                }
            } else {
                // Check again in 50ms
                setTimeout(checkAndInit, 50);
            }
        };

        checkAndInit();
    });

    return supabaseInitPromise;
}

// Start initialization immediately
initSupabase().catch(error => {
    // We catch here to prevent unhandled promise rejection logging, 
    // but the error state is handled by callers of waitForSupabase
});

/**
 * MAC Image CDN Helper
 * Prefixes URLs with Netlify Image CDN for on-the-fly optimization (WebP/Resizing)
 */
function getCdnUrl(url, width = 800) {
    if (!url) return 'https://via.placeholder.com/800x600?text=No+Image';
    // If it's a data URL, blob, or localhost, don't use CDN
    if (url.startsWith('data:') || url.startsWith('blob:') || url.includes('localhost') || url.includes('127.0.0.1')) return url;
    // Prefix for Netlify optimization
    return `/.netlify/images?url=${encodeURIComponent(url)}&w=${width}&q=80`;
}

window.getCdnUrl = getCdnUrl; // Make it globally accessible
