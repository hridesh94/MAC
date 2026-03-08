// Registration states: null = not registered, 'pending_payment', 'confirmed'
let REGISTRATION_CACHE = {};

// Supabase project URL for edge function calls
const SUPABASE_FUNCTIONS_URL = 'https://azmfbhffgqqeqbxmkdqf.supabase.co/functions/v1';

// ─── Cache helpers ────────────────────────────────────────────────────────────
function saveCache() {
    sessionStorage.setItem('MAC_REGISTRATIONS', JSON.stringify(REGISTRATION_CACHE));
}

function loadCache() {
    try {
        const raw = sessionStorage.getItem('MAC_REGISTRATIONS');
        REGISTRATION_CACHE = raw ? JSON.parse(raw) : {};
    } catch {
        REGISTRATION_CACHE = {};
    }
}

function getRegistrationStatus(slug) {
    return REGISTRATION_CACHE[slug]?.status || null;
}

// ─── Show members dashboard ───────────────────────────────────────────────────
function showMemberDashboard() {
    document.getElementById('mainSite').style.display = 'none';
    const adminDash = document.getElementById('adminDashboard');
    if (adminDash) adminDash.style.display = 'none';
    document.getElementById('membersDashboard').style.display = 'block';
    initializeDashboard();
}

// ─── Dashboard init ───────────────────────────────────────────────────────────
async function initializeDashboard() {
    // Wait for event data to be ready from data.js
    if (window.dataInitialized) {
        await window.dataInitialized;
    }

    // Handle Stripe return BEFORE rendering
    await handleStripeSuccess();

    const email = sessionStorage.getItem('userEmail') || 'Member';
    document.getElementById('memberGreeting').textContent = email.split('@')[0];

    // Fetch fresh registrations (invalidates cache)
    await fetchUserRegistrations(true);

    // Initial render
    renderAvailableEvents();
    renderMyEvents();

    // Setup Realtime Listener for status updates (e.g., from Webhooks)
    setupRealtimeListener();
    updateDashboardStats();
}

/**
 * Listen for database changes to registrations and update UI in real-time
 */
async function setupRealtimeListener() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    console.log('Setting up Realtime listener for payment updates...');

    // Subscribe to changes in the registrations table for the current user
    const channel = supabase.channel(`public:registrations:user_id=eq.${session.user.id}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'registrations',
            filter: `user_id=eq.${session.user.id}`
        }, async (payload) => {
            console.log('Realtime registration update received:', payload);

            // Fetch registration info to get the event slug (payload might not have joined data)
            const { data: reg, error } = await supabase
                .from('registrations')
                .select('status, events(slug)')
                .eq('id', payload.new.id)
                .single();

            if (!error && reg && reg.events) {
                const slug = reg.events.slug;
                // Update local cache
                REGISTRATION_CACHE[slug] = {
                    eventId: payload.new.event_id,
                    status: reg.status
                };
                saveCache();

                // Refresh UI for this specific event
                refreshExperienceUI(slug);
                renderMyEvents();

                // If it just became confirmed, show success modal
                if (payload.old && payload.old.status === 'pending_payment' && reg.status === 'confirmed') {
                    showSuccessModal(slug);
                }
            }
        })
        .subscribe();
}

// ─── Stripe return handler ────────────────────────────────────────────────────
async function handleStripeSuccess() {
    const pendingSlug = sessionStorage.getItem('pendingEventSlug');

    // Nothing pending — nothing to do
    if (!pendingSlug) return;

    const params = new URLSearchParams(window.location.search);

    // If the user explicitly cancelled on Stripe, just clear the pending key
    // and leave the DB record as pending_payment (they can try again later)
    const isCancelled = params.get('cancelled') === 'true' || params.get('payment') === 'cancelled';
    if (isCancelled) {
        console.log('Payment cancelled by user, keeping pending_payment state.');
        sessionStorage.removeItem('pendingEventSlug');
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname + window.location.hash);
        return;
    }

    // At this point: pendingSlug exists and no cancellation — user is back from Stripe.
    // Attempt to promote pending_payment → confirmed.
    console.log('Detected return from Stripe for slug:', pendingSlug);

    // Clean the URL
    window.history.replaceState({}, document.title, window.location.origin + window.location.pathname + window.location.hash);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('No Supabase session on Stripe return — will retry on next login');
            return;
        }

        const { data: event, error: eventError } = await supabase
            .from('events').select('id').eq('slug', pendingSlug).single();
        if (eventError || !event) throw new Error('Event not found: ' + pendingSlug);

        // Explicit UPDATE first (avoids upsert creating a duplicate if unique constraint is missing)
        const { error: updateError } = await supabase.from('registrations')
            .update({ status: 'confirmed' })
            .eq('user_id', session.user.id)
            .eq('event_id', event.id);

        if (updateError) {
            // Fallback: try upsert in case the pending record somehow doesn't exist yet
            const { error: upsertError } = await supabase.from('registrations').upsert([
                { user_id: session.user.id, event_id: event.id, status: 'confirmed' }
            ], { onConflict: 'user_id, event_id' });
            if (upsertError) throw upsertError;
        }

        // Clear pending state NOW (after successful DB write)
        sessionStorage.removeItem('pendingEventSlug');

        // Update local cache immediately so UI is instant
        REGISTRATION_CACHE[pendingSlug] = { eventId: event.id, status: 'confirmed' };
        saveCache();

        // Sync both dashboard card & detail view buttons
        refreshExperienceUI(pendingSlug);

        // Show success modal
        showSuccessModal(pendingSlug);

        console.log('Payment confirmed for:', pendingSlug);

    } catch (err) {
        console.error('Stripe confirmation error:', err.message);
    }
}

// ─── Fetch user registrations ─────────────────────────────────────────────────
async function fetchUserRegistrations(forceRefresh = false) {
    // Use in-memory cache if already populated and not forced
    if (!forceRefresh && Object.keys(REGISTRATION_CACHE).length > 0) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('registrations')
            .select('event_id, status, events(slug)')
            .eq('user_id', session.user.id)
            .neq('status', 'cancelled');

        if (error) throw error;

        REGISTRATION_CACHE = {};
        data.forEach(r => {
            if (r.events?.slug) {
                REGISTRATION_CACHE[r.events.slug] = {
                    eventId: r.event_id,
                    status: r.status
                };
            }
        });
        saveCache();

    } catch (err) {
        console.error('Error fetching registrations:', err.message);
    }
}

// ─── Centralized UI refresh — the single source of truth for button state ─────
// Updates BOTH the dashboard card AND the currently open detail view for a slug.
function refreshExperienceUI(slug) {
    const status = getRegistrationStatus(slug);

    // 1. Update dashboard available-events card button
    const cardBtn = document.querySelector(`[data-reg-btn="${slug}"]`);
    if (cardBtn) {
        applyButtonState(cardBtn, slug, status);
    }

    // 2. Update dashboard available-events card badge
    const cardBadge = document.querySelector(`[data-reg-badge="${slug}"]`);
    if (cardBadge) {
        applyBadgeState(cardBadge, status);
    }

    // 3. Update detail view button if it's open for this slug
    const detailBtn = document.getElementById('detailParticipationBtn');
    if (detailBtn && detailBtn.dataset.slug === slug) {
        applyButtonState(detailBtn, slug, status);
    }

    // 4. Re-render My Events if status affects it
    renderMyEvents();
    updateDashboardStats();
}

function applyButtonState(btn, slug, status) {
    btn.disabled = false;
    if (status === 'confirmed') {
        btn.textContent = 'Already Registered';
        btn.className = 'flex items-center justify-center rounded-full h-12 px-8 bg-white/10 text-white/50 text-sm font-bold uppercase tracking-widest cursor-not-allowed';
        btn.onclick = null;
    } else if (status === 'pending_payment') {
        btn.textContent = 'Complete Payment';
        btn.className = 'flex items-center justify-center rounded-full h-12 px-8 bg-amber-500 text-black text-sm font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-amber-500/30 transition-all hover-scale';
        btn.onclick = (e) => { e.stopPropagation(); triggerCheckout(slug); };
    } else {
        const ev = EXPERIENCE_DATA[slug];
        const title = ev?.title || slug;
        const date = ev?.date || '';
        btn.textContent = 'Secure Participation';
        btn.className = 'flex items-center justify-center rounded-full h-12 px-8 bg-primary text-white text-sm font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/20 transition-all hover-scale';
        btn.onclick = (e) => { e.stopPropagation(); openParticipationModal(slug, title, date); };
    }
}

function applyBadgeState(badge, status) {
    if (status === 'confirmed') {
        badge.textContent = 'Confirmed';
        badge.className = 'absolute top-4 right-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg';
        badge.style.display = 'block';
    } else if (status === 'pending_payment') {
        badge.textContent = 'Payment Pending';
        badge.className = 'absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg';
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// ─── Render available events (dashboard) ─────────────────────────────────────
function renderAvailableEvents() {
    const grid = document.getElementById('availableEventsGrid');
    if (!grid) return;

    const events = Object.values(EXPERIENCE_DATA);

    grid.innerHTML = events.map((event, index) => {
        const status = getRegistrationStatus(event.slug);
        const offsetClass = index % 2 !== 0 ? 'md:mt-24' : '';

        let btnHtml;
        if (status === 'confirmed') {
            btnHtml = `<button data-reg-btn="${event.slug}" class="flex items-center justify-center rounded-full h-12 px-8 bg-white/10 text-white/50 text-sm font-bold uppercase tracking-widest cursor-not-allowed" disabled>Already Registered</button>`;
        } else if (status === 'pending_payment') {
            btnHtml = `<button data-reg-btn="${event.slug}" onclick="event.stopPropagation(); triggerCheckout('${event.slug}')" class="flex items-center justify-center rounded-full h-12 px-8 bg-amber-500 text-black text-sm font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-amber-500/30 transition-all hover-scale">Complete Payment</button>`;
        } else {
            btnHtml = `<button data-reg-btn="${event.slug}" onclick="event.stopPropagation(); openParticipationModal('${event.slug}', '${event.title}', '${event.date}')" class="flex items-center justify-center rounded-full h-12 px-8 bg-primary text-white text-sm font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/20 transition-all hover-scale">Secure Participation</button>`;
        }

        let badgeHtml;
        if (status === 'confirmed') {
            badgeHtml = `<div data-reg-badge="${event.slug}" class="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Confirmed</div>`;
        } else if (status === 'pending_payment') {
            badgeHtml = `<div data-reg-badge="${event.slug}" class="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Payment Pending</div>`;
        } else {
            badgeHtml = `<div data-reg-badge="${event.slug}" style="display:none"></div>`;
        }

        return `
        <div class="flex flex-col gap-6 group ${offsetClass}">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer" onclick="showExperience('${event.slug}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style="background-image: url('${getCdnUrl(event.image)}');">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-60"></div>
                ${badgeHtml}
            </div>
            <div class="px-2">
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date} • ${event.specs.location}
                </p>
                ${btnHtml}
            </div>
        </div>
        `;
    }).join('');
}

// ─── Render My Events (confirmed only) ───────────────────────────────────────
function renderMyEvents() {
    const grid = document.getElementById('myEventsGrid');
    const empty = document.getElementById('myEventsEmpty');
    if (!grid) return;

    // Include both confirmed AND pending_payment events
    const activeEntries = Object.entries(REGISTRATION_CACHE)
        .filter(([, v]) => v.status === 'confirmed' || v.status === 'pending_payment');

    if (activeEntries.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = activeEntries.map(([slug, reg]) => {
        const event = EXPERIENCE_DATA[slug];
        if (!event) return '';

        const isPending = reg.status === 'pending_payment';

        const badgeHtml = isPending
            ? `<div class="absolute top-4 right-4 bg-amber-500 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Payment Pending</div>`
            : `<div class="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Confirmed</div>`;

        const actionsHtml = isPending
            ? `
                <button onclick="triggerCheckout('${slug}')" class="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-amber-500 text-black text-sm font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-amber-500/30 transition-all">
                    <span class="material-symbols-outlined text-sm">payments</span>
                    <span>Complete Payment</span>
                </button>
                <button onclick="triggerCancelParticipation('${event.slug}', '${event.title}', '${event.date}')" class="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 border border-white/20 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 hover:border-red-500/50 transition-all">
                    <span>Cancel</span>
                </button>`
            : `
                <button onclick="downloadCalendarDetail('${slug}')" class="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 border-2 border-primary text-primary text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    <span class="material-symbols-outlined text-sm">calendar_add_on</span>
                    <span>Add to Calendar</span>
                </button>
                <button onclick="triggerCancelParticipation('${event.slug}', '${event.title}', '${event.date}')" class="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 border border-white/20 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 hover:border-red-500/50 transition-all">
                    <span>Cancel Participation</span>
                </button>`;

        return `
        <div class="flex flex-col gap-6 group">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer"
                onclick="showExperience('${slug}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style='background-image: url("${getCdnUrl(event.image)}");'>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent ${isPending ? 'opacity-80' : 'opacity-60'}"></div>
                ${badgeHtml}
                ${isPending ? `<div class="absolute inset-0 border-2 border-amber-500/30 rounded-xl pointer-events-none"></div>` : ''}
            </div>
            <div class="px-2">
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date} • ${event.specs.location}
                </p>
                <div class="flex flex-col gap-3">
                    ${actionsHtml}
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
function updateDashboardStats() {
    const totalEvents = Object.keys(EXPERIENCE_DATA).length;
    const registered = Object.values(REGISTRATION_CACHE).filter(r => r.status === 'confirmed' || r.status === 'pending_payment').length;

    // Registered count (confirmed only)
    const confirmedCount = Object.values(REGISTRATION_CACHE).filter(r => r.status === 'confirmed').length;
    const regEl = document.getElementById('registeredCount');
    if (regEl) regEl.textContent = confirmedCount;

    // Available count (Total - (Confirmed or Pending))
    const availableCount = Math.max(0, totalEvents - registered);
    const availEl = document.getElementById('availableCount');
    if (availEl) availEl.textContent = availableCount;
}

// ─── Open participation modal ─────────────────────────────────────────────────
let pendingEventSlug = null;
let pendingAction = 'join'; // 'join' or 'cancel'

function openParticipationModal(slug, eventName, eventDate, action = 'join') {
    pendingEventSlug = slug;
    pendingAction = action;

    const errorEl = document.getElementById('participationError');
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }

    const modalTitle = document.getElementById('participationModal').querySelector('h3');
    const confirmBtn = document.getElementById('participationModal').querySelector('button[onclick="confirmParticipation()"]');
    const iconSpan = document.getElementById('participationIcon');

    document.getElementById('confirmEventName').textContent = eventName;
    document.getElementById('confirmEventDate').textContent = eventDate;

    if (action === 'cancel') {
        modalTitle.textContent = 'Cancel Participation?';
        confirmBtn.textContent = 'Confirm Cancellation';
        confirmBtn.classList.replace('bg-primary', 'bg-red-600');
        confirmBtn.classList.replace('hover:shadow-primary/20', 'hover:shadow-red-600/20');
        if (iconSpan) {
            iconSpan.textContent = 'warning';
            iconSpan.className = 'material-symbols-outlined text-red-500 text-3xl';
            iconSpan.parentElement.className = 'w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6';
        }
    } else {
        modalTitle.textContent = 'Confirm Participation';
        confirmBtn.textContent = 'Confirm';
        confirmBtn.classList.replace('bg-red-600', 'bg-primary');
        confirmBtn.classList.replace('hover:shadow-red-600/20', 'hover:shadow-primary/20');
        if (iconSpan) {
            iconSpan.textContent = 'check_circle';
            iconSpan.className = 'material-symbols-outlined text-primary text-3xl';
            iconSpan.parentElement.className = 'w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6';
        }
    }

    document.getElementById('participationModal').style.display = 'flex';
}

function closeParticipationModal() {
    document.getElementById('participationModal').style.display = 'none';
    pendingEventSlug = null;
    pendingAction = 'join';
}

// ─── Confirm participation or cancellation ────────────────────────────────────
// ─── Trigger Dynamic Checkout ────────────────────────────────────────────────
async function triggerCheckout(slug) {
    try {
        const authInfo = await supabase.auth.getSession();
        const session = authInfo.data.session;
        if (!session) throw new Error('User not authenticated');

        console.log('Initiating dynamic checkout for:', slug);

        // CRITICAL: Save pending slug immediately so we can handle the return 
        // even if the dynamic session fails and we use the fallback link.
        sessionStorage.setItem('pendingEventSlug', slug);

        const origin = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');

        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': window.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                eventSlug: slug,
                userId: session.user.id,
                successUrl: `${origin}member.html?payment=success`,
                cancelUrl: `${origin}member.html?payment=cancelled`,
            }),
        });

        if (!response.ok) {
            console.warn('Backend checkout failed (perhaps missing Stripe key?), falling back to static payment link');
            window.location.href = 'https://buy.stripe.com/test_bJebJ131T3TW2uF8Wc9Ve00';
            return;
        }

        const { url } = await response.json();
        if (!url) throw new Error('No checkout URL returned from server');

        window.location.href = url;
    } catch (err) {
        console.error('Checkout error, falling back to static link:', err);
        window.location.href = 'https://buy.stripe.com/test_bJebJ131T3TW2uF8Wc9Ve00';
    }
}

async function confirmParticipation() {
    if (!pendingEventSlug) return;

    const errorEl = document.getElementById('participationError');
    if (errorEl) { errorEl.classList.add('hidden'); errorEl.textContent = ''; }

    const confirmBtn = document.getElementById('participationModal').querySelector('button[onclick="confirmParticipation()"]');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        const { data: event, error: eventError } = await supabase
            .from('events').select('id').eq('slug', pendingEventSlug).single();
        if (eventError) throw new Error('Event not found or access denied.');

        if (pendingAction === 'cancel') {
            const { error } = await supabase.from('registrations')
                .delete()
                .eq('user_id', session.user.id)
                .eq('event_id', event.id);
            if (error) throw error;

            // Remove from cache
            delete REGISTRATION_CACHE[pendingEventSlug];
            saveCache();

            closeParticipationModal();
            refreshExperienceUI(pendingEventSlug);

        } else {
            // 1. Create a pending_payment record in DB first
            const { error: pendingError } = await supabase.from('registrations').upsert([
                { user_id: session.user.id, event_id: event.id, status: 'pending_payment' }
            ], { onConflict: 'user_id, event_id' });
            if (pendingError) throw pendingError;

            // 2. Save to cache + sessionStorage before navigating away
            REGISTRATION_CACHE[pendingEventSlug] = { eventId: event.id, status: 'pending_payment' };
            saveCache();
            sessionStorage.setItem('pendingEventSlug', pendingEventSlug);

            // 3. Sync UI immediately so user sees the state change
            refreshExperienceUI(pendingEventSlug);
            closeParticipationModal();

            // 4. Call the create-checkout-session Edge Function to get a
            //    dynamic Stripe URL with user_id + event_slug metadata embedded.
            //    The stripe-webhook function will read this metadata and auto-confirm.
            confirmBtn.textContent = 'Redirecting to payment...';
            const origin = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
            const { data: { session: authSession } } = await supabase.auth.getSession();

            const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authSession.access_token}`,
                    'apikey': window.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    eventSlug: pendingEventSlug,
                    userId: session.user.id,
                    successUrl: `${origin}member.html?payment=success`,
                    cancelUrl: `${origin}member.html?payment=cancelled`,
                }),
            });

            if (!response.ok) {
                // Fallback to static link if edge function fails
                console.warn('Edge function failed, falling back to static Stripe link');
                let errorMsg = 'Failed to create checkout session';
                try {
                    const errData = await response.json();
                    if (errData.error) errorMsg += ': ' + errData.error;
                } catch (e) { }
                console.warn(errorMsg);
                window.location.href = 'https://buy.stripe.com/test_bJebJ131T3TW2uF8Wc9Ve00';
                return;
            }

            const { url } = await response.json();
            if (!url) throw new Error('No checkout URL returned from server');

            // 5. Redirect to the dynamic Stripe checkout URL
            window.location.href = url;
        }

    } catch (err) {
        console.error('Participation error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'An unexpected error occurred.';
            errorEl.classList.remove('hidden');
        }
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

function triggerCancelParticipation(slug, title, date) {
    openParticipationModal(slug, title, date, 'cancel');
}

// ─── Success modal ────────────────────────────────────────────────────────────
function showSuccessModal(slug) {
    const event = EXPERIENCE_DATA[slug];
    const eventName = event ? event.title : 'Experience';

    const modal = document.createElement('div');
    modal.id = 'successPaymentModal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl';
    modal.innerHTML = `
    <div class="glass-card max-w-sm w-full mx-4 p-10 rounded-3xl text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-primary"></div>
        <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <span class="material-symbols-outlined text-primary text-5xl">verified</span>
        </div>
        <h3 class="text-3xl font-serif italic mb-4">Welcome Aboard</h3>
        <p class="text-white/60 text-sm leading-relaxed mb-8">
            Your participation in <span class="text-white font-medium">${eventName}</span> has been secured. Your digital dossier will be dispatched shortly.
        </p>
        <button onclick="document.getElementById('successPaymentModal').remove()"
                class="w-full rounded-full h-14 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/40 transition-all">
            Enter Dashboard
        </button>
    </div>
    `;
    document.body.appendChild(modal);
}

// ─── Download Calendar ────────────────────────────────────────────────────────
function downloadCalendarDetail(slug) {
    const event = EXPERIENCE_DATA[slug];
    if (!event) return;

    const rawDate = event.eventDate || event.date || '';
    let dtStart, dtEnd;
    const parsed = new Date(rawDate);
    const pad = n => String(n).padStart(2, '0');

    if (!isNaN(parsed.getTime())) {
        const fmt = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T090000Z`;
        dtStart = fmt(parsed);
        dtEnd = `${parsed.getUTCFullYear()}${pad(parsed.getUTCMonth() + 1)}${pad(parsed.getUTCDate())}T180000Z`;
    } else {
        const now = new Date();
        dtStart = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T090000Z`;
        dtEnd = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T180000Z`;
    }

    const location = event.specs?.location || event.departurePoint || '';
    const description = (event.longDescription || event.description || '').replace(/\n/g, '\\n');
    const uid = `mac-${slug}-${Date.now()}@joinmac.app`;
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

    const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MAC - The Limitless Club//EN',
        'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
        `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
        `SUMMARY:MAC — ${event.title}`, `LOCATION:${location}`, `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAC-${event.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ─── Auto-init on page load ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadCache(); // hydrate from sessionStorage
    if (document.getElementById('membersDashboard')) {
        initializeDashboard();
    }
});
