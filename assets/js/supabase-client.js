// Initialize Supabase Client
const SUPABASE_URL = 'https://azmfbhffgqqeqbxmkdqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWZiaGZmZ3FxZXFieG1rZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTc1NjksImV4cCI6MjA4NjIzMzU2OX0.74VBnyYMCfgOH5IQvj1c1-O2GCQTG6ul5bXRgTizJWU';

// We use the CDN version in the HTML, so supabase is available globally
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabase = supabase; // Make it globally accessible
