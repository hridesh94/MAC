// Show admin dashboard
function showAdminDashboard() {
    // Hide main site and member dashboard
    document.getElementById('mainSite').style.display = 'none';
    document.getElementById('membersDashboard').style.display = 'none';

    // Show admin dashboard
    document.getElementById('adminDashboard').style.display = 'block';

    // Initialize admin data
    initializeAdminData();
}

// Switch admin tabs
function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Show selected tab
    document.getElementById(`admin-tab-${tabName}`).classList.remove('hidden');

    // Update nav styling
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.add('opacity-60');
        link.classList.remove('text-amber-500');
    });
    const activeNav = document.getElementById(`nav-${tabName}`);
    activeNav.classList.remove('opacity-60');
    activeNav.classList.add('text-amber-500');
}

// Initialize admin data
function initializeAdminData() {
    // Initialize default data if not exists
    if (!localStorage.getItem('macEvents')) {
        // Use default events from code (accessed from data.js)
        const defaultEvents = Object.values(EXPERIENCE_DATA).map(e => ({
            id: e.slug,
            title: e.title,
            date: e.date,
            location: e.specs.location,
            participants: []
        }));
        localStorage.setItem('macEvents', JSON.stringify(defaultEvents));
    }

    if (!localStorage.getItem('macMembers')) {
        const defaultMembers = [
            {
                email: 'member@mac.com',
                status: 'Active',
                joinedDate: new Date().toLocaleDateString()
            }
        ];
        localStorage.setItem('macMembers', JSON.stringify(defaultMembers));
    }

    updateAdminStats();
    renderAdminEvents();
    renderAdminMembers();
}

// Update admin stats
function updateAdminStats() {
    const events = JSON.parse(localStorage.getItem('macEvents') || '[]');
    const members = JSON.parse(localStorage.getItem('macMembers') || '[]');
    const registrations = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]').length; // Simple count for now

    document.getElementById('adminTotalEvents').textContent = events.length;
    document.getElementById('adminTotalMembers').textContent = members.length;
    document.getElementById('adminTotalRegistrations').textContent = registrations;
}

// Render admin events table
function renderAdminEvents() {
    const events = JSON.parse(localStorage.getItem('macEvents') || '[]');
    const tbody = document.getElementById('adminEventsTable');

    tbody.innerHTML = events.map(event => `
    <tr class="hover:bg-white/5 transition-colors">
        <td class="p-6">
            <div class="font-bold text-lg">${event.title}</div>
            <div class="text-xs opacity-60 uppercase tracking-widest">ID: ${event.id}</div>
        </td>
        <td class="p-6">
            <div class="text-sm">${event.date}</div>
            <div class="text-xs opacity-60">${event.location}</div>
        </td>
        <td class="p-6">
            <div class="text-xl font-bold">${event.participants ? event.participants.length : 0}</div>
            <div class="text-xs opacity-60 uppercase tracking-widest">Confirmed</div>
        </td>
        <td class="p-6 text-right">
            <button onclick="openEditEventModal('${event.id}')" class="text-amber-500 hover:text-white transition-colors mr-4">Edit</button>
            <button onclick="deleteEvent('${event.id}')" class="text-red-500 hover:text-white transition-colors">Delete</button>
        </td>
    </tr>
`).join('');
}

// Render admin members table
function renderAdminMembers() {
    const members = JSON.parse(localStorage.getItem('macMembers') || '[]');
    const tbody = document.getElementById('adminMembersTable');

    if (members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-white/50">No members found</td></tr>';
        return;
    }

    tbody.innerHTML = members.map(member => `
    <tr class="hover:bg-white/5 transition-colors">
        <td class="p-6">
            <div class="font-bold">${member.email}</div>
        </td>
        <td class="p-6">
            <span class="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold uppercase tracking-widest border border-green-500/20">
                ${member.status}
            </span>
        </td>
        <td class="p-6">
            <div class="text-sm opacity-60">${member.joinedDate}</div>
        </td>
        <td class="p-6 text-right">
            ${member.email !== 'member@mac.com' ?
            `<button onclick="deleteMember('${member.email}')" class="text-red-500 hover:text-white transition-colors">Revoke Access</button>` :
            '<span class="text-xs text-white/30 italic">Default Member</span>'
        }
        </td>
    </tr>
`).join('');
}

// Delete Member
function deleteMember(email) {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;

    let members = JSON.parse(localStorage.getItem('macMembers') || '[]');
    members = members.filter(m => m.email !== email);
    localStorage.setItem('macMembers', JSON.stringify(members));

    renderAdminMembers();
    updateAdminStats();
}

// Open Add Event Modal
function openAddEventModal() {
    const modal = document.getElementById('adminEventModal');
    const form = modal.querySelector('form');

    // Reset form and title for new event
    form.reset();
    document.getElementById('modalTitle').textContent = 'Add New Event'; // ensure ID exists in HTML
    const eventIdInput = document.getElementById('eventId');
    if (eventIdInput) eventIdInput.value = ''; // Clear ID for new event

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.textContent = 'Create Event';

    modal.style.display = 'flex';
}

// Open Edit Event Modal
function openEditEventModal(eventId) {
    const modal = document.getElementById('adminEventModal');
    const form = modal.querySelector('form');
    const events = JSON.parse(localStorage.getItem('macEvents') || '[]');
    const event = events.find(e => e.id === eventId);

    if (!event) return;

    // Populate form with existing data
    form.querySelector('[name="title"]').value = event.title;
    form.querySelector('[name="category"]').value = event.category;
    form.querySelector('[name="date"]').value = event.date;
    form.querySelector('[name="location"]').value = event.location;
    form.querySelector('[name="image"]').value = event.image;
    form.querySelector('[name="description"]').value = event.description;

    // Set ID for update logic
    document.getElementById('eventId').value = eventId;

    // Update Modal UI
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Event';

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.textContent = 'Update Event';

    modal.style.display = 'flex';
}

// Close Add/Edit Event Modal
function closeAddEventModal() {
    document.getElementById('adminEventModal').style.display = 'none';
}

// Handle Add/Edit Event Form Submission
function handleAdminAddEvent(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const eventId = document.getElementById('eventId').value;

    const eventData = {
        id: eventId || formData.get('title').toLowerCase().replace(/\s+/g, '-'),
        title: formData.get('title'),
        category: formData.get('category'),
        date: formData.get('date'),
        location: formData.get('location'),
        image: formData.get('image'),
        description: formData.get('description'),
        participants: [] // Preserve participants if editing, see below
    };

    const events = JSON.parse(localStorage.getItem('macEvents') || '[]');

    if (eventId) {
        // Update existing event
        const index = events.findIndex(ev => ev.id === eventId);
        if (index !== -1) {
            // Preserve existing participants
            eventData.participants = events[index].participants || [];
            events[index] = eventData;
            alert('Event updated successfully!');
        }
    } else {
        // Create new event
        events.push(eventData);
        alert('Event created successfully!');
    }

    localStorage.setItem('macEvents', JSON.stringify(events));

    // Refresh UI
    renderAdminEvents();
    updateAdminStats();

    // Re-initialize main data for public/member views
    initializeData();

    // Close modal and reset form
    closeAddEventModal();
    form.reset();
}

// Delete Event
function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    let events = JSON.parse(localStorage.getItem('macEvents') || '[]');
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem('macEvents', JSON.stringify(events));

    // Refresh UI
    renderAdminEvents();
    updateAdminStats();
    initializeData();

    // Update Public View immediately if visible (optional but good for consistency)
    if (typeof renderPublicEvents === 'function') renderPublicEvents();
}
