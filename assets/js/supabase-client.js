// Initialize Supabase Client
const SUPABASE_URL = 'https://azmfbhffgqqeqbxmkdqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWZiaGZmZ3FxZXFieG1rZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTc1NjksImV4cCI6MjA4NjIzMzU2OX0.74VBnyYMCfgOH5IQvj1c1-O2GCQTG6ul5bXRgTizJWU';

// We use the CDN version in the HTML, so supabase is available globally
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabase = supabase; // Make it globally accessible

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
