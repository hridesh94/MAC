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

// Media Management State
let selectedImageFile = null;

// Handle image selection from file input
async function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    const placeholder = document.getElementById('uploadPlaceholder');
    const preview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('previewImg');

    try {
        // Optimize image before previewing to ensure performance
        selectedImageFile = await optimizeImage(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(selectedImageFile);
    } catch (err) {
        console.error('Image optimization failed:', err);
        selectedImageFile = file;
    }
}

// Remove selected image
function removeSelectedImage() {
    selectedImageFile = null;
    document.getElementById('eventImageUpload').value = '';
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('uploadPreview').classList.add('hidden');
    document.getElementById('previewImg').src = '';
}

// Upload image to Supabase Storage
async function uploadToSupabase(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
        .from('experience-media')
        .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('experience-media')
        .getPublicUrl(filePath);

    return publicUrl;
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
    await renderAccessRequests();
}

// ... (existing code)

// Render Access Requests
async function renderAccessRequests() {
    try {
        const { data: requests, error } = await supabase
            .from('access_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('adminRequestsTable');

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-white/50">No pending requests</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(req => `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-6">
                    <div class="font-bold">${req.email}</div>
                </td>
                <td class="p-6">
                    <div class="text-xs opacity-60">${new Date(req.created_at).toLocaleDateString()}</div>
                </td>
                <td class="p-6">
                    <span class="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/20">
                        ${req.status.toUpperCase()}
                    </span>
                </td>
                <td class="p-6 text-right">
                    <button onclick="openAddMemberModal('${req.email}')" class="text-green-500 hover:text-white transition-colors mr-4">Approve</button>
                    <button onclick="deleteRequest('${req.id}')" class="text-red-500 hover:text-white transition-colors">Ignore</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error rendering requests:', err.message);
    }
}

// Delete/Ignore Request
async function deleteRequest(id) {
    if (!confirm('Ignore this request?')) return;
    try {
        const { error } = await supabase.from('access_requests').delete().eq('id', id);
        if (error) throw error;
        renderAccessRequests();
    } catch (err) {
        console.error('Error deleting request:', err);
    }
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
                    <div class="text-xl font-bold">${event.registrations[0].count}</div>
                    <div class="text-xs opacity-60 uppercase tracking-widest">Active Members</div>
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
// Revoke Access (Delete Member) - Trigger Modal
let pendingRevokeUserId = null;

function deleteMember(userId) {
    pendingRevokeUserId = userId;
    const modal = document.getElementById('revokeAccessModal');
    // Reset error
    const errorEl = document.getElementById('revokeAccessError');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }
    modal.style.display = 'flex';
}

function closeRevokeAccessModal() {
    document.getElementById('revokeAccessModal').style.display = 'none';
    pendingRevokeUserId = null;
}

// Actual deletion logic attached to Modal "Revoke" button
async function confirmRevokeAccess() {
    if (!pendingRevokeUserId) return;

    const confirmBtn = document.querySelector('#revokeAccessModal button[onclick="confirmRevokeAccess()"]');
    const originalText = confirmBtn.textContent;
    const errorEl = document.getElementById('revokeAccessError');

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Revoking...';

    try {
        // Call Netlify Function to delete user from Auth (which cascades to Profile)
        const response = await fetch('/.netlify/functions/delete-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: pendingRevokeUserId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to revoke access');
        }

        closeRevokeAccessModal();
        // Refresh data
        initializeAdminData();
    } catch (err) {
        console.error('Error deleting member:', err.message);
        errorEl.textContent = 'Could not revoke access. ' + err.message;
        errorEl.classList.remove('hidden');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
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

    // Clear Image state
    removeSelectedImage();

    modal.style.display = 'flex';
}

// Open Edit Event Modal
async function openEditEventModal(identifier) {
    try {
        let query = supabase.from('events').select('*');

        // Simple heuristic: UUIDs are 36 chars and contain dashes
        // If it looks like a UUID, search by ID, otherwise by slug
        if (identifier.length === 36 && identifier.includes('-')) {
            query = query.eq('id', identifier);
        } else {
            query = query.eq('slug', identifier);
        }

        const { data: event, error } = await query.single();

        if (error) throw error;

        const modal = document.getElementById('adminEventModal');
        const form = modal.querySelector('form');

        form.querySelector('[name="title"]').value = event.title || '';
        form.querySelector('[name="category"]').value = event.category || 'Sand';
        form.querySelector('[name="date"]').value = event.date || '';
        form.querySelector('[name="location"]').value = event.location || '';
        form.querySelector('[name="duration"]').value = event.duration || '';
        form.querySelector('[name="equipment"]').value = event.equipment || 'Standard';
        form.querySelector('[name="difficulty"]').value = event.difficulty || 'All Levels';
        form.querySelector('[name="image"]').value = event.image || ''; // Ensure manual URL input is populated
        form.querySelector('[name="description"]').value = event.description || '';

        document.getElementById('eventId').value = event.id; // Always store ID for updates
        document.getElementById('modalTitle').textContent = 'Edit Event';
        document.getElementById('submitBtn').textContent = 'Update Event';

        // Set Preview if image exists
        removeSelectedImage();
        if (event.image) {
            const preview = document.getElementById('uploadPreview');
            const previewImg = document.getElementById('previewImg');
            const placeholder = document.getElementById('uploadPlaceholder');
            previewImg.src = event.image;
            placeholder.classList.add('hidden');
            preview.classList.remove('hidden');
        }

        modal.style.display = 'flex';
    } catch (err) {
        console.error('Error opening edit modal:', err.message);
        alert('Error loading event details');
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
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading Image...';

        let imageUrl = formData.get('image');

        // 1. Upload new image if selected
        if (selectedImageFile) {
            imageUrl = await uploadToSupabase(selectedImageFile);
        }

        if (!imageUrl) throw new Error('Experience image is required');

        const eventData = {
            title: formData.get('title'),
            category: formData.get('category'),
            date: formData.get('date'),
            location: formData.get('location'),
            duration: formData.get('duration'),
            equipment: formData.get('equipment'),
            difficulty: formData.get('difficulty'),
            image: imageUrl,
            description: formData.get('description'),
            slug: formData.get('title').toLowerCase().replace(/\s+/g, '-')
        };

        submitBtn.textContent = 'Saving Event...';

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
        alert(`Error: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
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
// Issue Credential (New Member)
function openAddMemberModal(prefillEmail = '') {
    openIssueCredentialModal(prefillEmail);
}

// Issue Credential Modal Logic
function openIssueCredentialModal(prefillEmail = '') {
    const modal = document.getElementById('issueCredentialModal');
    const emailInput = document.getElementById('newMemberEmail');
    const passwordInput = document.getElementById('newMemberPassword');
    const errorEl = document.getElementById('issueCredentialError');

    // Reset fields
    emailInput.value = prefillEmail || '';
    passwordInput.value = '';
    errorEl.textContent = '';
    errorEl.classList.add('hidden');

    modal.style.display = 'flex';
}

function closeIssueCredentialModal() {
    document.getElementById('issueCredentialModal').style.display = 'none';
}

async function confirmIssueCredential() {
    const email = document.getElementById('newMemberEmail').value;
    const password = document.getElementById('newMemberPassword').value;
    const errorEl = document.getElementById('issueCredentialError');
    const confirmBtn = document.querySelector('#issueCredentialModal button[onclick="confirmIssueCredential()"]');
    const originalText = confirmBtn.textContent;

    if (!email || !password) {
        errorEl.textContent = 'Email and password are required.';
        errorEl.classList.remove('hidden');
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        errorEl.classList.remove('hidden');
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Issuing...';
    errorEl.classList.add('hidden');

    try {
        const response = await fetch('/.netlify/functions/add-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            closeIssueCredentialModal();
            // Optional: nice success feedback
            renderAdminMembers();
            updateAdminStats();
            // alert('Credential issued successfully!'); // User dislikes alerts, maybe just close?
        } else {
            throw new Error(result.error || 'Failed to create member');
        }
    } catch (err) {
        console.error('Error creating member:', err);
        errorEl.textContent = err.message || 'Failed to issue credential';
        errorEl.classList.remove('hidden');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// Approve Request -> Open Issue Credential Modal
function approveRequest(email) {
    openAddMemberModal(email);
}

// Manual Add Button -> Open Issue Credential Modal
function handleManualAdd() {
    openAddMemberModal();
}
