// Auto-initialize admin data when admin.html loads
window.addEventListener('load', () => {
    if (document.getElementById('adminDashboard')) {
        initializeAdminData();
    }
});

// ── Itinerary Builder ────────────────────────────────────────────────────────
let _itinRowId = 0;

function addItineraryRow(data = {}) {
    const id = ++_itinRowId;
    const container = document.getElementById('itineraryRows');
    const row = document.createElement('div');
    row.id = `irow-${id}`;
    row.className = 'relative border border-white/10 rounded-xl p-4 space-y-3 bg-white/[0.02]';
    row.innerHTML = `
        <button type="button" onclick="removeItineraryRow(${id})"
            class="absolute top-3 right-3 text-white/30 hover:text-red-500 transition-colors">
            <span class="material-symbols-outlined text-sm">close</span>
        </button>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1">Time / Phase Label</label>
                <input type="text" name="itin_time_${id}" placeholder="e.g. Day 01 — 06:00" value="${data.time || ''}"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors">
            </div>
            <div>
                <label class="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1">Title</label>
                <input type="text" name="itin_title_${id}" placeholder="e.g. Convoy Departure" value="${data.title || ''}"
                    class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors">
            </div>
        </div>
        <div>
            <label class="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1">Description</label>
            <textarea name="itin_desc_${id}" rows="2" placeholder="Short description of this phase…"
                class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors resize-none">${data.desc || ''}</textarea>
        </div>
        <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" name="itin_key_${id}" ${data.key ? 'checked' : ''}
                    class="accent-primary w-4 h-4">
                <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Key Moment</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" name="itin_optional_${id}" ${data.optional ? 'checked' : ''}
                    class="accent-primary w-4 h-4">
                <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Optional</span>
            </label>
        </div>`;
    container.appendChild(row);
}

function removeItineraryRow(id) {
    const el = document.getElementById(`irow-${id}`);
    if (el) el.remove();
}

function getItineraryFormData() {
    const rows = document.querySelectorAll('#itineraryRows > div[id^="irow-"]');
    const phases = [];
    rows.forEach(row => {
        const idNum = row.id.replace('irow-', '');
        const time = row.querySelector(`[name="itin_time_${idNum}"]`)?.value?.trim();
        const title = row.querySelector(`[name="itin_title_${idNum}"]`)?.value?.trim();
        const desc = row.querySelector(`[name="itin_desc_${idNum}"]`)?.value?.trim();
        const key = row.querySelector(`[name="itin_key_${idNum}"]`)?.checked ?? false;
        const opt = row.querySelector(`[name="itin_optional_${idNum}"]`)?.checked ?? false;
        if (title) phases.push({ time: time || '', title, desc: desc || '', key, optional: opt });
    });
    return phases.length ? phases : null;
}

function clearItineraryRows() {
    document.getElementById('itineraryRows').innerHTML = '';
    _itinRowId = 0;
}
// ── End Itinerary Builder ────────────────────────────────────────────────────

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
    await renderAdminRegistrations();
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





// Update admin stats
async function updateAdminStats() {
    try {
        const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
        const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: confirmedCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed');

        document.getElementById('adminTotalEvents').textContent = eventCount || 0;
        document.getElementById('adminTotalMembers').textContent = memberCount || 0;
        document.getElementById('adminTotalRegistrations').textContent = confirmedCount || 0;
    } catch (err) {
        console.error('Error updating stats:', err.message);
    }
}

// Render admin registrations table (pending + confirmed)
async function renderAdminRegistrations() {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select('id, status, created_at, events(title, slug), profiles(email)')
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('adminRegistrationsTable');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-white/50">No registrations found</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(reg => {
            const statusBadge = reg.status === 'confirmed'
                ? `<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">Confirmed</span>`
                : `<span class="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/20">Pending Payment</span>`;

            return `
            <tr class="hover:bg-white/5 transition-colors">
                <td class="p-6">
                    <div class="font-bold text-sm">${reg.profiles?.email || '—'}</div>
                </td>
                <td class="p-6">
                    <div class="text-sm">${reg.events?.title || '—'}</div>
                    <div class="text-xs opacity-40 uppercase tracking-widest">${reg.events?.slug || ''}</div>
                </td>
                <td class="p-6">${statusBadge}</td>
                <td class="p-6">
                    <div class="text-xs opacity-60">${new Date(reg.created_at).toLocaleDateString()}</div>
                </td>
                <td class="p-6 text-right">
                    ${reg.status === 'pending_payment'
                    ? `<button onclick="confirmRegistration('${reg.id}')" class="text-amber-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Confirm</button>`
                    : '<span class="text-white/20 text-xs">—</span>'}
                </td>
            </tr>
        `;
        }).join('');
    } catch (err) {
        console.error('Error rendering registrations:', err.message);
    }
}

// Confirm Registration Manually
async function confirmRegistration(regId) {
    if (!confirm('Are you sure you want to mark this payment as confirmed?')) return;

    try {
        const { error } = await supabase
            .from('registrations')
            .update({ status: 'confirmed' })
            .eq('id', regId);

        if (error) throw error;

        // Refresh UI
        await initializeAdminData();
    } catch (err) {
        console.error('Error confirming registration:', err.message);
        alert('Error: ' + err.message);
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

// Generic Danger Modal State
let pendingDangerAction = null;

function openDangerModal(title, message, buttonText, action) {
    document.getElementById('dangerTitle').textContent = title;
    document.getElementById('dangerMessage').textContent = message;

    const btn = document.getElementById('dangerConfirmBtn');
    btn.textContent = buttonText;

    pendingDangerAction = action;

    // Reset error
    const errorEl = document.getElementById('dangerError');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    document.getElementById('dangerModal').style.display = 'flex';
}

function closeDangerModal() {
    document.getElementById('dangerModal').style.display = 'none';
    pendingDangerAction = null;
}

async function confirmDangerAction() {
    if (!pendingDangerAction) return;

    const btn = document.getElementById('dangerConfirmBtn');
    const originalText = btn.textContent;
    const errorEl = document.getElementById('dangerError');

    btn.disabled = true;
    btn.textContent = 'Processing...';
    errorEl.classList.add('hidden');

    try {
        await pendingDangerAction();
        closeDangerModal();
        // Refresh all data just in case
        initializeAdminData();
    } catch (err) {
        console.error('Error in danger action:', err);
        errorEl.textContent = err.message || 'Action failed.';
        errorEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Helper: get Supabase Edge Function URL and auth headers
async function getEdgeFunctionConfig() {
    const SUPABASE_URL = 'https://azmfbhffgqqeqbxmkdqf.supabase.co';
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bWZiaGZmZ3FxZXFieG1rZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTc1NjksImV4cCI6MjA4NjIzMzU2OX0.74VBnyYMCfgOH5IQvj1c1-O2GCQTG6ul5bXRgTizJWU'
    };
    return { SUPABASE_URL, headers };
}

// Delete Member (Revoke Access) - Uses Danger Modal
function deleteMember(userId) {
    openDangerModal(
        'Revoke Access?',
        "This will permanently delete the member's profile and data.",
        'Revoke',
        async () => {
            const { SUPABASE_URL, headers } = await getEdgeFunctionConfig();
            const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-member`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                let result;
                const text = await response.text();
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    throw new Error(`Server returned ${response.status}. Please try again or contact support.`);
                }
                throw new Error(result.error || 'Failed to revoke access');
            }
        }
    );
}

// Delete Event - Uses Danger Modal
function deleteEvent(eventId) {
    openDangerModal(
        'Delete Event?',
        "Are you sure you want to delete this event? This cannot be undone.",
        'Delete',
        async () => {
            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) throw error;
        }
    );
}

// Delete/Ignore Request - Uses Danger Modal
function deleteRequest(requestId) {
    openDangerModal(
        'Ignore Request?',
        "Are you sure you want to ignore this request?",
        'Ignore',
        async () => {
            const { error } = await supabase.from('access_requests').delete().eq('id', requestId);
            if (error) throw error;
        }
    );
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
    // Clear itinerary rows
    clearItineraryRows();

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
        form.querySelector('[name="event_date"]').value = event.event_date || '';
        form.querySelector('[name="capacity"]').value = event.capacity || '';
        form.querySelector('[name="departure_point"]').value = event.departure_point || '';
        form.querySelector('[name="transfer_type"]').value = event.transfer_type || '';
        form.querySelector('[name="active_duration"]').value = event.active_duration || '';
        form.querySelector('[name="itinerary_dispatch"]').value = event.itinerary_dispatch || '';
        form.querySelector('[name="image"]').value = event.image || '';
        form.querySelector('[name="description"]').value = event.description || '';

        // Load itinerary phases
        clearItineraryRows();
        const phases = Array.isArray(event.itinerary) ? event.itinerary : (typeof event.itinerary === 'string' ? JSON.parse(event.itinerary || '[]') : []);
        phases.forEach(p => addItineraryRow(p));

        document.getElementById('eventId').value = event.id;
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
    const errorEl = document.getElementById('eventModalError');

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading Image...';
        if (errorEl) errorEl.classList.add('hidden');

        let imageUrl = formData.get('image');

        // 1. Upload new image if selected
        if (selectedImageFile) {
            imageUrl = await uploadToSupabase(selectedImageFile);
        }

        if (!imageUrl) throw new Error('Experience image is required');

        const itineraryPhases = getItineraryFormData();

        const eventData = {
            title: formData.get('title'),
            category: formData.get('category'),
            date: formData.get('date'),
            location: formData.get('location'),
            event_date: formData.get('event_date') || null,
            capacity: formData.get('capacity') ? parseInt(formData.get('capacity')) : null,
            departure_point: formData.get('departure_point'),
            transfer_type: formData.get('transfer_type'),
            active_duration: formData.get('active_duration'),
            itinerary_dispatch: formData.get('itinerary_dispatch'),
            itinerary: itineraryPhases,
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

        // Success - Close Modal and Refresh
        closeAddEventModal();
        initializeAdminData();
        initializeData(); // Refresh global data
    } catch (err) {
        console.error('Error saving event:', err.message);
        if (errorEl) {
            errorEl.textContent = `Error: ${err.message}`;
            errorEl.classList.remove('hidden');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Delete Event


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
        const { SUPABASE_URL, headers } = await getEdgeFunctionConfig();
        const response = await fetch(`${SUPABASE_URL}/functions/v1/add-member`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, password })
        });

        let result;
        const text = await response.text();

        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            throw new Error(`Server returned ${response.status}. Please try again or contact support.`);
        }

        if (response.ok) {
            closeIssueCredentialModal();
            renderAdminMembers();
            updateAdminStats();
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
