// Experience Data
let EXPERIENCE_DATA = {};

// Initialize Data from Supabase
async function initializeData() {
    try {
        // Wait for Supabase to be ready
        const supabase = await window.waitForSupabase();

        const { data: events, error } = await supabase
            .from('events')
            .select('*, registrations(count)');

        if (error) throw error;

        if (events && events.length > 0) {
            // Transform array back to object keyed by slug
            EXPERIENCE_DATA = events.reduce((acc, event) => {
                acc[event.slug] = {
                    slug: event.slug,
                    title: event.title,
                    date: event.date,
                    eventDate: event.event_date || '',
                    capacity: event.capacity || 20,
                    registered: event.registrations?.[0]?.count ?? 0,
                    image: event.image || 'https://via.placeholder.com/800x600',
                    category: event.category || 'Experience',
                    longDescription: event.description || '',
                    // Itinerary fields
                    departurePoint: event.departure_point || '',
                    transferType: event.transfer_type || '',
                    activeDuration: event.active_duration || '',
                    itineraryDispatch: event.itinerary_dispatch || '',
                    itinerary: event.itinerary || null,
                    is_active: event.is_active ?? true,
                    specs: {
                        location: event.location,
                        duration: event.duration || 'TBD',
                        equipment: event.equipment || 'Standard',
                        difficulty: event.difficulty || 'All Levels'
                    }
                };
                return acc;
            }, {});
        } else {
            console.warn('No events found in Supabase.');
            EXPERIENCE_DATA = {};
        }

        // Trigger UI updates if they were waiting for data
        if (typeof renderPublicEvents === 'function') renderPublicEvents();
        if (typeof renderAvailableEvents === 'function') renderAvailableEvents();

    } catch (err) {
        console.error('Error fetching data from Supabase:', err.message);
        EXPERIENCE_DATA = {};
    }
}

// Call initialization
window.dataInitialized = initializeData();
