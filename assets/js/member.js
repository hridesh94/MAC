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
function initializeDashboard() {
    // Set greeting
    const email = sessionStorage.getItem('userEmail') || 'member@mac.com';
    document.getElementById('memberGreeting').textContent = 'Member';

    // Render available events
    renderAvailableEvents();

    // Render my events
    renderMyEvents();

    // Update stats
    updateDashboardStats();
}

// Render available events in dashboard (Dynamic)
function renderAvailableEvents() {
    const grid = document.getElementById('availableEventsGrid');
    if (!grid) return;

    const registeredEvents = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
    if (Object.keys(EXPERIENCE_DATA).length === 0) {
        initializeData();
    }
    const events = Object.values(EXPERIENCE_DATA);

    grid.innerHTML = events.map((event, index) => {
        const isRegistered = registeredEvents.includes(event.slug);
        const offsetClass = index % 2 !== 0 ? 'md:mt-24' : '';

        return `
        <div class="flex flex-col gap-6 group ${offsetClass}">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer" onclick="showExperience('${event.slug}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style="background-image: url('${event.image}');">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-60"></div>
                ${isRegistered ?
                `<div class="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        Registered
                    </div>` : ''
            }
            </div>
            <div class="px-2">
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date} • ${event.specs.duration}
                </p>
                ${isRegistered ?
                '<button class="flex items-center gap-2 opacity-60 cursor-not-allowed"><span class="text-sm font-bold uppercase-tracking">Already Registered</span></button>' :
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
    const registeredEvents = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');

    if (registeredEvents.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    // In a real app, you would fetch details for registered IDs. 
    // Here we use EXPERIENCE_DATA we already have.
    if (Object.keys(EXPERIENCE_DATA).length === 0) {
        initializeData();
    }

    grid.innerHTML = registeredEvents.map(eventId => {
        const event = EXPERIENCE_DATA[eventId];
        if (!event) return '';

        return `
        <div class="flex flex-col gap-6 group">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer"
                onclick="showExperience('${eventId}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style='background-image: url("${event.image}");'>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-60"></div>
                <div class="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Confirmed</div>
            </div>
            <div class="px-2">
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date}
                </p>
                <div class="flex gap-3">
                    <button onclick="downloadCalendar('${eventId}', '${event.title}', '${event.date}')" class="flex-1 flex items-center justify-center gap-2 rounded-full h-12 px-6 border-2 border-primary text-primary text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                        <span class="material-symbols-outlined text-sm">calendar_add_on</span>
                        <span>Add to Calendar</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Update dashboard stats
function updateDashboardStats() {
    const registeredEvents = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
    document.getElementById('registeredCount').textContent = registeredEvents.length;
}

// Open participation modal
let pendingEventId = null;
function openParticipationModal(eventId, eventName, eventDate) {
    pendingEventId = eventId;
    document.getElementById('confirmEventName').textContent = eventName;
    document.getElementById('confirmEventDate').textContent = eventDate;
    document.getElementById('participationModal').style.display = 'flex';
}

// Close participation modal
function closeParticipationModal() {
    document.getElementById('participationModal').style.display = 'none';
    pendingEventId = null;
}

// Confirm participation
function confirmParticipation() {
    if (!pendingEventId) return;

    const registeredEvents = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
    if (!registeredEvents.includes(pendingEventId)) {
        registeredEvents.push(pendingEventId);
        sessionStorage.setItem('registeredEvents', JSON.stringify(registeredEvents));
    }

    closeParticipationModal();

    // Refresh dashboard
    renderAvailableEvents();
    renderMyEvents();
    updateDashboardStats();
}

// Download calendar file (.ics)
function downloadCalendar(eventId, eventName, eventDate) {
    const event = {
        title: `MAC - ${eventName}`,
        description: 'Exclusive MAC member experience',
        location: 'Location TBD',
        start: eventDate,
        duration: 8 // hours
    };

    const icsContent = generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MAC-${eventName.replace(/\s+/g, '-')}.ics`;
    link.click();
}

// Generate ICS file content
function generateICS(event) {
    // Simple mock date logic for demo purposes as real dates are string "October 2024"
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + event.duration * 60 * 60 * 1000);

    const formatDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MAC//Events//EN
BEGIN:VEVENT
UID:${Date.now()}@mac-experiences.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}
