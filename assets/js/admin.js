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
async function initializeAdminData() {
    await updateAdminStats();
    await renderAdminEvents();
    await renderAdminMembers();
}

// Update admin stats
async function updateAdminStats() {
    try {
        const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
        const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: regCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true });

        document.getElementById('adminTotalEvents').textContent = eventCount || 0;
        document.getElementById('adminTotalMembers').textContent = memberCount || 0;
        document.getElementById('adminTotalRegistrations').textContent = regCount || 0;
    } catch (err) {
        console.error('Error updating stats:', err.message);
    }
}

// Render admin events table
async function renderAdminEvents() {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*, registrations(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('adminEventsTable');
        tbody.innerHTML = events.map(event => `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-6">
                    <div class="font-bold text-lg">${event.title}</div>
                    <div class="text-xs opacity-60 uppercase tracking-widest">SLUG: ${event.slug}</div>
                </td>
                <td class="p-6">
                    <div class="text-sm">${event.date}</div>
                    <div class="text-xs opacity-60">${event.location}</div>
                </td>
                <td class="p-6">
                    <div class="text-xl font-bold">${event.registrations ? event.registrations[0].count : 0}</div>
                    <div class="text-xs opacity-60 uppercase tracking-widest">Participants</div>
                </td>
                <td class="p-6 text-right">
                    <button onclick="openEditEventModal('${event.id}')" class="text-amber-500 hover:text-white transition-colors mr-4">Edit</button>
                    <button onclick="deleteEvent('${event.id}')" class="text-red-500 hover:text-white transition-colors">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error rendering events:', err.message);
    }
}

// Render admin members table
async function renderAdminMembers() {
    try {
        const { data: members, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

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
                        ${member.role.toUpperCase()}
                    </span>
                </td>
                <td class="p-6">
                    <div class="text-sm opacity-60">${new Date(member.created_at).toLocaleDateString()}</div>
                </td>
                <td class="p-6 text-right">
                    ${member.role !== 'admin' ?
                `<button onclick="deleteMember('${member.id}')" class="text-red-500 hover:text-white transition-colors">Revoke Access</button>` :
                '<span class="text-xs text-white/30 italic">Administrator</span>'
            }
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error rendering members:', err.message);
    }
}

// Delete Member (Profile)
async function deleteMember(userId) {
    if (!confirm('Are you sure you want to revoke access? This will delete their profile.')) return;

    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        alert('Access revoked successfully.');
        initializeAdminData();
    } catch (err) {
        console.error('Error deleting member:', err.message);
        alert('Could not revoke access.');
    }
}

// Open Add Event Modal
function openAddEventModal() {
    const modal = document.getElementById('adminEventModal');
    const form = modal.querySelector('form');

    form.reset();
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventId').value = '';
    document.getElementById('submitBtn').textContent = 'Create Event';

    modal.style.display = 'flex';
}

// Open Edit Event Modal
async function openEditEventModal(eventId) {
    try {
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        const modal = document.getElementById('adminEventModal');
        const form = modal.querySelector('form');

        form.querySelector('[name="title"]').value = event.title;
        form.querySelector('[name="category"]').value = event.category;
        form.querySelector('[name="date"]').value = event.date;
        form.querySelector('[name="location"]').value = event.location;
        form.querySelector('[name="image"]').value = event.image;
        form.querySelector('[name="description"]').value = event.description;

        document.getElementById('eventId').value = eventId;
        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('submitBtn').textContent = 'Update Event';

        modal.style.display = 'flex';
    } catch (err) {
        console.error('Error opening edit modal:', err.message);
    }
}

// Close Modal
function closeAddEventModal() {
    document.getElementById('adminEventModal').style.display = 'none';
}

// Handle Add/Edit Event
async function handleAdminAddEvent(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const eventId = document.getElementById('eventId').value;

    const eventData = {
        title: formData.get('title'),
        category: formData.get('category'),
        date: formData.get('date'),
        location: formData.get('location'),
        image: formData.get('image'),
        description: formData.get('description'),
        slug: formData.get('title').toLowerCase().replace(/\s+/g, '-')
    };

    try {
        let error;
        if (eventId) {
            const { error: updateError } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', eventId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('events')
                .insert([eventData]);
            error = insertError;
        }

        if (error) throw error;

        alert(`Event ${eventId ? 'updated' : 'created'} successfully!`);
        closeAddEventModal();
        initializeAdminData();
        initializeData(); // Refresh global data
    } catch (err) {
        console.error('Error saving event:', err.message);
        alert('Could not save event.');
    }
}

// Delete Event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;

        alert('Event deleted successfully.');
        initializeAdminData();
        initializeData();
    } catch (err) {
        console.error('Error deleting event:', err.message);
        alert('Could not delete event.');
    }
}

// Issue Credential (New Member)
async function openAddMemberModal() {
    const email = prompt("Enter new member email:");
    if (!email) return;

    const password = prompt("Enter temporary password (min 6 chars):");
    if (!password || password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/add-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            renderAdminMembers();
            updateAdminStats();
        } else {
            throw new Error(result.error || 'Failed to create member');
        }
    } catch (err) {
        console.error('Error creating member:', err);
        alert(`Error: ${err.message}`);
    }
}
