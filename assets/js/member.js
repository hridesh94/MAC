// Local state for registrations
let REGISTERED_EVENT_IDS = [];

// Show members dashboard
function showMemberDashboard() {
    // Hide main site
    document.getElementById('mainSite').style.display = 'none';

    // Hide admin dashboard if visible
    const adminDash = document.getElementById('adminDashboard');
    if (adminDash) adminDash.style.display = 'none';

    // Show member dashboard
    const dashboard = document.getElementById('membersDashboard');
    dashboard.style.display = 'block';

    // Initialize dashboard
    initializeDashboard();
}

// Initialize dashboard content
async function initializeDashboard() {
    // Set greeting
    const email = sessionStorage.getItem('userEmail') || 'Member';
    document.getElementById('memberGreeting').textContent = email.split('@')[0];

    // Fetch user registrations
    await fetchUserRegistrations();

    // Render components
    renderAvailableEvents();
    renderMyEvents();
    updateDashboardStats();
}

// Fetch user registrations from Supabase
async function fetchUserRegistrations() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('registrations')
            .select('event_id, status, events(slug)')
            .eq('user_id', session.user.id)
            .neq('status', 'cancelled');

        if (error) throw error;

        // Extract slugs for easy lookup
        REGISTERED_EVENT_IDS = data.map(r => r.events.slug);

    } catch (err) {
        console.error('Error fetching registrations:', err.message);
    }
}

// Render available events in dashboard (Dynamic)
function renderAvailableEvents() {
    const grid = document.getElementById('availableEventsGrid');
    if (!grid) return;

    const events = Object.values(EXPERIENCE_DATA);

    grid.innerHTML = events.map((event, index) => {
        const isRegistered = REGISTERED_EVENT_IDS.includes(event.slug);
        const offsetClass = index % 2 !== 0 ? 'md:mt-24' : '';

        return `
        <div class="flex flex-col gap-6 group ${offsetClass}">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer" onclick="showExperience('${event.slug}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style="background-image: url('${getCdnUrl(event.image)}');">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-60"></div>
                ${isRegistered ?
                `<div class="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        Confirmed
                    </div>` : ''
            }
            </div>
            <div class="px-2">
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date} • ${event.specs.location}
                </p>
                ${isRegistered ?
                '<button class="flex items-center gap-2 opacity-60 cursor-not-allowed"><span class="text-sm font-bold uppercase-tracking">Already Secured</span></button>' :
                `<button onclick="event.stopPropagation(); openParticipationModal('${event.slug}', '${event.title}', '${event.date}')" class="flex items-center justify-center rounded-full h-12 px-8 bg-primary text-white text-sm font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/20 transition-all hover-scale">Secure Participation</button>`
            }
            </div>
        </div>
        `;
    }).join('');
}

// Render my events section
function renderMyEvents() {
    const grid = document.getElementById('myEventsGrid');
    const empty = document.getElementById('myEventsEmpty');

    if (REGISTERED_EVENT_IDS.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = REGISTERED_EVENT_IDS.map(slug => {
        const event = EXPERIENCE_DATA[slug];
        if (!event) return '';

        return `
        <div class="flex flex-col gap-6 group">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer"
                onclick="showExperience('${slug}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style='background-image: url("${getCdnUrl(event.image)}");'>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-60"></div>
                <div class="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Confirmed</div>
            </div>
            <div class="px-2">
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date} • ${event.specs.location}
                </p>
                <div class="flex flex-col gap-3">
                    <button onclick="downloadCalendarDetail('${slug}')" class="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 border-2 border-primary text-primary text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                        <span class="material-symbols-outlined text-sm">calendar_add_on</span>
                        <span>Add to Calendar</span>
                    </button>
                    <button onclick="triggerCancelParticipation('${event.slug}', '${event.title}', '${event.date}')" class="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 border border-white/20 text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 hover:border-red-500/50 transition-all">
                        <span>Cancel Participation</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Update dashboard stats
function updateDashboardStats() {
    document.getElementById('registeredCount').textContent = REGISTERED_EVENT_IDS.length;
}

// Open participation modal
let pendingEventSlug = null;
let pendingAction = 'join'; // 'join' or 'cancel'

function openParticipationModal(slug, eventName, eventDate, action = 'join') {
    pendingEventSlug = slug;
    pendingAction = action;

    // Reset error
    const errorEl = document.getElementById('participationError');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    // Update Modal Content based on Action
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

// Close participation modal
function closeParticipationModal() {
    document.getElementById('participationModal').style.display = 'none';
    pendingEventSlug = null;
    pendingAction = 'join';
}

// Confirm participation (or cancellation)
async function confirmParticipation() {
    if (!pendingEventSlug) return;

    const errorEl = document.getElementById('participationError');
    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.textContent = '';
    }

    const confirmBtn = document.getElementById('participationModal').querySelector('button[onclick="confirmParticipation()"]');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        // First find the event UUID from the slug
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id')
            .eq('slug', pendingEventSlug)
            .single();

        if (eventError) throw new Error('Event not found or access denied. Please contact support.');

        if (pendingAction === 'cancel') {
            // Handle Cancellation
            const { error } = await supabase
                .from('registrations')
                .delete()
                .eq('user_id', session.user.id)
                .eq('event_id', event.id);

            if (error) throw error;
        } else {
            // Handle Registration
            const { error } = await supabase
                .from('registrations')
                .upsert([
                    { user_id: session.user.id, event_id: event.id, status: 'confirmed' }
                ], { onConflict: 'user_id, event_id' });

            if (error) {
                console.error('Supabase Upsert Error:', error);
                // Improve error message for common RLS issues
                if (error.code === '42501') throw new Error('Permission denied. You may not be allowed to register.');
                if (error.code === '23505') throw new Error('You are already registered for this event.');
                throw error;
            }
        }

        closeParticipationModal();

        // Refresh dashboard
        await initializeDashboard();

    } catch (err) {
        console.error('Registration error details:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'An unexpected error occurred.';
            errorEl.classList.remove('hidden');
        } else {
            alert(err.message); // Fallback if element missing
        }
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// Cancel participation trigger
function triggerCancelParticipation(slug, title, date) {
    openParticipationModal(slug, title, date, 'cancel');
}




// Simple redirect or placeholder for calendar (simplified for now)
function downloadCalendarDetail(slug) {
    const event = EXPERIENCE_DATA[slug];
    alert(`Calendar invite for ${event.title} downloaded (Simulated).`);
}
