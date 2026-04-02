// Mobile Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    showMainSite();
    setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = 80;
            const sectionTop = section.offsetTop - headerHeight;
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// Show main site
function showMainSite() {
    const mainSite = document.getElementById('mainSite');
    const experienceDetail = document.getElementById('experienceDetail');

    mainSite.classList.remove('page-hidden');
    mainSite.classList.add('page-visible');
    experienceDetail.classList.remove('page-visible');
    experienceDetail.classList.add('page-hidden');
    experienceDetail.innerHTML = '';

    window.scrollTo(0, 0);
}

// Track where the user came from
let previousViewId = 'mainSite';
let currentCountdownInterval = null;
let currentTimelineScrollListener = null;

// --- Countdown Timer Section ---
function buildCountdownSection(experience) {
    // Use admin-set ISO event_date for precision; fall back to display date string
    const dateStr = experience.eventDate || experience.date || '';
    const countdownId = `cd-${experience.slug.replace(/[^a-z0-9]/gi, '')}`;
    const capacity = experience.capacity || 20;
    const registered = experience.registered || 0;
    const pct = Math.min(100, Math.round((registered / capacity) * 100));
    const hasDate = !!experience.eventDate;

    return `
    <section class="relative py-24 px-6 overflow-hidden" style="background: #160e0f;">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');"></div>
        <div class="max-w-[900px] mx-auto relative z-10">
            <span class="block text-center text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-12 opacity-80">Time Remaining</span>
            <div id="${countdownId}" class="grid grid-cols-4 gap-0 mb-14">
                ${['days', 'hours', 'mins', 'secs'].map((unit, i) => `
                <div class="flex flex-col items-center ${i < 3 ? 'border-r border-white/5' : ''}">
                    <span id="${countdownId}-${unit}" class="font-serif italic font-bold text-white leading-none" style="font-size: clamp(3rem, 8vw, 7rem);">${hasDate ? '--' : '—'}</span>
                    <span class="text-[9px] font-black uppercase tracking-[0.4em] text-white/25 mt-3">${unit}</span>
                </div>`).join('')}
            </div>
            ${!hasDate ? `<p class="text-center text-[10px] text-white/20 uppercase tracking-widest -mt-8 mb-10">Event date not yet confirmed</p>` : ''}
            <div class="max-w-[560px] mx-auto">
                <div class="flex justify-between items-baseline mb-3">
                    <span class="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Capacity</span>
                    <span class="text-sm font-bold text-white/70">${registered}<span class="text-white/25"> / ${capacity}</span></span>
                </div>
                <div class="h-[3px] w-full rounded-full overflow-hidden" style="background: rgba(255,255,255,0.06);">
                    <div class="h-full rounded-full" style="width: ${pct}%; background: linear-gradient(90deg, #b99da1 0%, #d41132 100%);"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <span class="text-[9px] text-white/20 uppercase tracking-widest">${registered} secured</span>
                    <span class="text-[9px] text-white/20 uppercase tracking-widest">${capacity - registered} remaining</span>
                </div>
            </div>
        </div>
    </section>`;
}

function initCountdownTimer(dateStr, countdownId) {
    if (currentCountdownInterval) clearInterval(currentCountdownInterval);
    var target = new Date(dateStr);
    if (isNaN(target.getTime())) return;
    function tick() {
        var now = new Date(), diff = target - now;
        if (diff <= 0) { ['days', 'hours', 'mins', 'secs'].forEach(function (u) { var el = document.getElementById(countdownId + '-' + u); if (el) el.textContent = '00'; }); return; }
        var d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        var v = { days: d, hours: h, mins: m, secs: s };
        Object.keys(v).forEach(function (u) { var el = document.getElementById(countdownId + '-' + u); if (el) el.textContent = String(v[u]).padStart(2, '0'); });
    }
    tick();
    currentCountdownInterval = setInterval(tick, 1000);
}

// --- Itinerary Data by Category ---
function getItineraryData(category) {
    const all = {
        'Sand': {
            departure: 'Dubai International Airport', transfer: 'Private 4×4 Convoy', activeDuration: '2 Days Active', dispatch: '7 Days Prior',
            phases: [
                { time: 'Day 01 — 06:00', title: 'Convoy Departure', desc: 'Private convoy departs from a secured staging point. Full gear briefing en route.', key: true, optional: false },
                { time: 'Day 01 — 09:30', title: 'Dune Entry & First Run', desc: 'The Empty Quarter opens. Vehicles reach technical dune corridors for timed runs.', key: true, optional: false },
                { time: 'Day 01 — 13:00', title: 'Midday Camp — Debrief', desc: 'Field canteen setup. Satellite-linked telemetry review with your instructor.', key: false, optional: false },
                { time: 'Day 01 — 17:00', title: 'Sunset Slalom', desc: 'Unguided free-run through a marked descent route. Photography unit on standby.', key: false, optional: true },
                { time: 'Day 01 — 20:00', title: 'Michelin Field Dinner', desc: 'Three-course candlelit dinner under open sky, catered by a Michelin-starred field chef.', key: true, optional: false },
                { time: 'Day 02 — 07:00', title: 'Dawn Precision Course', desc: 'Timed slalom on overnight-marked course. Times recorded for personal dossier.', key: true, optional: false },
                { time: 'Day 02 — 15:00', title: 'Return Convoy', desc: 'Sealed vehicle debrief packages distributed. Valet at departure point.', key: false, optional: false },
            ]
        },
        'Water': {
            departure: 'Monaco Yacht Club', transfer: 'Private Tender Transfer', activeDuration: '3 Days / 2 Nights', dispatch: '10 Days Prior',
            phases: [
                { time: 'Day 01 — 08:00', title: 'Vessel Assignment & Briefing', desc: 'Meet your custom powerboat. Full mechanical walk-through with lead technician.', key: false, optional: false },
                { time: 'Day 01 — 10:00', title: 'Open Sea Sprint — Leg One', desc: 'First timed offshore sprint. Coastal corridor, 40 nautical miles.', key: true, optional: false },
                { time: 'Day 01 — 18:00', title: 'Night Cruise', desc: 'Sunset cruise to Saint-Jean-Cap-Ferrat with curated live jazz ensemble aboard.', key: false, optional: true },
                { time: 'Day 02 — 09:00', title: 'Grand Prix Circuit Route', desc: 'Flagged route echoing the Monaco Grand Prix waterfront. Full timing system active.', key: true, optional: false },
                { time: 'Day 02 — 19:00', title: 'Gala Dinner on Water', desc: 'Catered event aboard a private superyacht. Open bar, three-course curated menu.', key: true, optional: false },
                { time: 'Day 03 — 11:00', title: 'Final Sprint & Departure', desc: 'Closing timed run. Results couriered to your residence within 72 hours.', key: true, optional: false },
            ]
        },
        'Sky': {
            departure: 'Private Terminal, Geneva', transfer: 'MAC Charter Flight', activeDuration: '1 Day Active', dispatch: '5 Days Prior',
            phases: [
                { time: '07:00', title: 'Pre-Flight Medical & Gear Fit', desc: 'Certified aerobatic suit fitting and G-force medical clearance.', key: false, optional: false },
                { time: '09:00', title: 'Cockpit Orientation', desc: 'One-on-one cockpit briefing with your wing commander.', key: false, optional: false },
                { time: '10:30', title: 'Takeoff — First Formation', desc: 'Dual formation flight, 3,000m AGL. Radio-linked manoeuvre coordination.', key: true, optional: false },
                { time: '12:00', title: 'Aerial Acrobatics — Solo Run', desc: 'Supervised solo aerobatic sequence: barrel roll, Cuban Eight, Hammerhead.', key: true, optional: false },
                { time: '14:00', title: 'High-Altitude Lunch', desc: 'Rooftop dining at an altitude-adjacent lodge. Panoramic alpine views.', key: false, optional: false },
                { time: '16:00', title: 'Sunset Final Approach', desc: 'Optional second flight during golden hour. Photographer aboard companion aircraft.', key: true, optional: true },
            ]
        },
        'Snow': {
            departure: 'Courchevel Altiport', transfer: 'Helicopter Shuttle', activeDuration: '2 Days Active', dispatch: '7 Days Prior',
            phases: [
                { time: 'Day 01 — 07:30', title: 'Heli-Drop & Equipment Issue', desc: 'Private helicopter drops onto off-piste staging zone. Equipment issued at altitude.', key: true, optional: false },
                { time: 'Day 01 — 09:00', title: 'Black Run — Timed Descent', desc: 'Expert guide leads timed off-piste descent. GoPro and drone coverage included.', key: true, optional: false },
                { time: 'Day 01 — 13:00', title: 'Mountain Refuge Lunch', desc: 'Traditional alpine refuge, private reservation. Three-course mountain menu.', key: false, optional: false },
                { time: 'Day 01 — 20:00', title: 'Chalet Dinner & Debrief', desc: 'Private chalet evening. Footage review with your instructor.', key: true, optional: false },
                { time: 'Day 02 — 08:00', title: 'Dawn Powder Session', desc: 'First-light untracked powder on a sealed private slope. Limited to 8 participants.', key: true, optional: false },
                { time: 'Day 02 — 14:00', title: 'Ice Drive Session', desc: 'Frozen lake vehicle session in a Porsche 911 Turbo ice-spec.', key: false, optional: true },
            ]
        },
        'Road': {
            departure: 'Circuit de Monaco Paddock', transfer: 'Vehicle Self-Drive', activeDuration: '1 Day Active', dispatch: '3 Days Prior',
            phases: [
                { time: '08:00', title: 'Vehicle Assignment & Tech Check', desc: 'Allocated supercar inspected by MAC technicians. Telemetry calibrated.', key: false, optional: false },
                { time: '09:30', title: 'Pace Car Lap — Orientation', desc: 'One instructed lap behind the pace car. Line selection and braking explained.', key: false, optional: false },
                { time: '10:30', title: 'Timed Hot Laps — Session One', desc: 'First timed session. Three laps submitted to MAC leaderboard.', key: true, optional: false },
                { time: '13:00', title: 'Paddock Lunch & Telemetry', desc: 'Data download and sector analysis with your engineer.', key: false, optional: false },
                { time: '15:00', title: 'Timed Hot Laps — Session Two', desc: 'Final four laps. Best time recorded for your MAC dossier.', key: true, optional: false },
                { time: '17:30', title: 'Podium Ceremony', desc: 'Champagne podium ceremony for the day\'s top three.', key: true, optional: true },
            ]
        }
    };
    return all[category] || all['Sand'];
}

function buildItinerarySection(experience) {
    const d = getItineraryData(experience.category);
    // Prefer DB-stored values, fall back to category defaults
    const departure = experience.departurePoint || d.departure;
    const transfer = experience.transferType || d.transfer;
    const duration = experience.activeDuration || d.activeDuration;
    const dispatch = experience.itineraryDispatch || d.dispatch;
    // Use DB itinerary phases if the admin has set them, else fall back to category defaults
    const phases = (experience.itinerary && experience.itinerary.length > 0)
        ? experience.itinerary
        : d.phases;
    return `
    <section id="itinerarySection-${experience.slug}" class="relative py-28 px-4 md:px-6 border-t border-white/5 overflow-hidden" style="background: #120b0c;">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');"></div>
        
        <div class="max-w-[1200px] mx-auto relative z-10">
            <div class="mb-20">
                <div class="opt-eyebrow with-line mb-6"><span>Event Itinerary</span></div>
                <h2 class="opt-title mb-6">The Schedule</h2>
                <p class="opt-desc max-w-sm">Every moment is curated. Nothing is left to chance.</p>
            </div>
            
            <div class="relative max-w-7xl mx-auto pb-20" id="timelineContainer-${experience.slug}">
                <div class="absolute left-8 md:left-48 top-0 bottom-0 w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-white/10 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"></div>
                <div id="timelineProgress-${experience.slug}" class="absolute left-8 md:left-48 top-0 w-[2px] bg-gradient-to-b from-transparent via-[#c9293a] to-transparent opacity-0 duration-200 [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] transition-[height] ease-linear" style="height: 0%; opacity: 1;"></div>
                
                ${phases.map((p, i) => `
                <div class="flex justify-start pt-10 md:pt-40 md:gap-10 timeline-item">
                    <div class="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start w-32 md:w-48 flex-shrink-0">
                        <div class="h-10 absolute left-8 md:left-48 w-10 rounded-full bg-[#120b0c] flex items-center justify-center -translate-x-1/2">
                            <div class="h-3 w-3 rounded-full ${p.key ? 'bg-[#c9293a] border border-[#c9293a]/50 shadow-[0_0_12px_rgba(201,41,58,0.6)] always-active' : 'bg-white/10 border border-white/20 transition-all duration-300'} timeline-dot"></div>
                        </div>
                        <h3 class="hidden md:block opt-subtitle md:pl-8 opacity-80 pr-4 w-full">
                            ${p.time.split(' — ')[0] || p.time}<br/>
                            <span class="text-[10px] md:text-sm font-sans not-italic text-white/40 block mt-3 font-semibold tracking-widest uppercase">${p.time.split(' — ')[1] || ''}</span>
                        </h3>
                    </div>

                    <div class="relative pl-16 pr-4 md:pl-20 w-full">
                        <h3 class="md:hidden block opt-subtitle mb-4 text-left opacity-80">
                            ${p.time}
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="flex items-center gap-3 flex-wrap">
                                ${p.optional ? '<span class="px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest border border-[#c9293a]/25 text-[#c9293a]/80">Optional</span>' : ''}
                                <h4 class="opt-subtitle md:!text-3xl mb-2">${p.title}</h4>
                            </div>
                            <p class="opt-desc max-w-2xl">${p.desc}</p>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>`;
}

function initTimelineScroll(containerId, progressId) {
    if (currentTimelineScrollListener) {
        window.removeEventListener('scroll', currentTimelineScrollListener);
    }

    const container = document.getElementById(containerId);
    const progress = document.getElementById(progressId);
    if (!container || !progress) return;

    currentTimelineScrollListener = function () {
        const rect = container.getBoundingClientRect();
        const wHeight = window.innerHeight;

        // Timeline fills from top edge entering center, to bottom edge leaving center
        const start = rect.top - wHeight * 0.5;
        const end = rect.height;

        let scrolled = -start / end;
        scrolled = Math.max(0, Math.min(1, scrolled));

        progress.style.height = (scrolled * 100) + '%';

        // Light up dots dynamically!
        const items = container.querySelectorAll('.timeline-item');
        items.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const dot = item.querySelector('.timeline-dot');
            if (!dot) return;

            // If the item passes the middle of the screen (where the line finishes drawing)
            if (itemRect.top < wHeight * 0.5) {
                dot.classList.add('bg-primary', 'border-primary/50', 'shadow-[0_0_12px_rgba(212,17,50,0.6)]');
                dot.classList.remove('bg-white/10', 'border-white/20');
            } else if (!dot.classList.contains('always-active')) {
                dot.classList.remove('bg-primary', 'border-primary/50', 'shadow-[0_0_12px_rgba(212,17,50,0.6)]');
                dot.classList.add('bg-white/10', 'border-white/20');
            }
        });
    };

    window.addEventListener('scroll', currentTimelineScrollListener, { passive: true });
    currentTimelineScrollListener(); // Initial check
}

// Show experience detail page
function showExperience(slug) {
    const experience = EXPERIENCE_DATA[slug];
    if (!experience) return;

    const mainSite = document.getElementById('mainSite');
    const membersDashboard = document.getElementById('membersDashboard');
    const experienceDetail = document.getElementById('experienceDetail');

    // Determine current view
    if (membersDashboard && membersDashboard.style.display !== 'none' && !membersDashboard.classList.contains('hidden')) {
        previousViewId = 'membersDashboard';
        membersDashboard.style.display = 'none'; // Hide member dashboard (it uses inline style display)
    } else {
        previousViewId = 'mainSite';
        mainSite.classList.remove('page-visible');
        mainSite.classList.add('page-hidden');
    }

    // Get other experiences for suggestions
    const otherExperiences = Object.values(EXPERIENCE_DATA)
        .filter(e => e.slug !== slug)
        .slice(0, 2);

    experienceDetail.innerHTML = `
    <div class="bg-charcoal text-white min-h-screen">
        <!-- Hero Section -->
        <section class="relative h-[85vh] w-full overflow-hidden">
            <div 
                class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[15s] hover:scale-105"
                style="background-image: linear-gradient(rgba(24, 17, 18, 0.3) 0%, rgba(24, 17, 18, 0.9) 100%), url('${getCdnUrl(experience.image, 1600)}')"
            ></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 mt-16">
                <button 
                    onclick="closeExperience()" 
                    class="absolute top-28 left-10 z-20 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                >
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span class="small-caps text-[10px] font-bold tracking-widest">Back</span>
                </button>
                
                <span class="opt-eyebrow block mb-6">${experience.category}</span>
                <h1 class="opt-title mb-6 md:!text-8xl">${experience.title}</h1>
                <p class="opt-eyebrow text-white/70">
                    ${experience.date} • Secured Admission
                </p>
            </div>
        </section>

        <!-- Detail Content -->
        <section class="max-w-[1200px] mx-auto opt-section">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-20">
                <!-- Main Info -->
                <div class="lg:col-span-2 space-y-10">
                    <h2 class="opt-title">The Narrative</h2>
                    <p class="opt-desc">
                        ${experience.longDescription}
                    </p>
                    <p class="opt-desc">
                        Every detail is meticulously planned to ensure total immersion. From satellite logistics to personalized catering by Michelin-starred field chefs, MAC ensures that your pursuit of the extreme never compromises on refinement.
                    </p>

                    <div class="pt-20 border-t border-white/5">
                        ${(() => {
            const userRole = sessionStorage.getItem('userRole');
            const isAdmin = userRole === 'admin';

            if (isAdmin) {
                // Admin view - show Edit button
                return `<button onclick="openEditEventModal('${experience.slug}')" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-amber-600 text-sm font-black uppercase tracking-widest transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-600/30">
                                        <span class="material-symbols-outlined mr-2">edit</span>
                                        Edit Event Details
                                    </button>`;
            } else if (previousViewId === 'membersDashboard') {
                // Member view - show 3-state participation button
                const regStatus = (typeof getRegistrationStatus === 'function')
                    ? getRegistrationStatus(experience.slug)
                    : null;

                if (regStatus === 'confirmed') {
                    return `<button id="detailParticipationBtn" data-reg-btn="${experience.slug}" data-slug="${experience.slug}" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/50 text-sm font-black uppercase tracking-widest cursor-not-allowed" disabled>
                                            Already Registered
                                        </button>`;
                } else if (regStatus === 'pending_payment') {
                    return `<button id="detailParticipationBtn" data-reg-btn="${experience.slug}" data-slug="${experience.slug}" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/50 text-sm font-black uppercase tracking-widest cursor-not-allowed" disabled>
                                            Registration Requested
                                        </button>`;
                }
                return `<button id="detailParticipationBtn" data-reg-btn="${experience.slug}" data-slug="${experience.slug}" onclick="event.stopPropagation(); openParticipationModal('${experience.slug}', '${experience.title}', '${experience.date}')" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-primary text-white text-sm font-black uppercase tracking-widest transition-all hover-scale hover:shadow-2xl hover:shadow-primary/20">
                                        Secure Participation
                                    </button>`;
            } else {
                // Public view - prompt to login
                return `<button onclick="event.stopPropagation(); navigateTo('login')" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-primary text-white text-sm font-black uppercase tracking-widest transition-all hover-scale hover:shadow-2xl hover:shadow-primary/20">
                                        Secure Participation
                                    </button>`;
            }
        })()}
                    </div>
                </div>

                <!-- Technical Specs Panel -->
                <div class="lg:col-span-1">
                    <div class="glass-panel p-10 rounded-2xl sticky top-32">
                        <span class="opt-eyebrow mb-8 border-b border-white/10 pb-4 block">Event Details</span>
                        <div class="space-y-8">
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Departure Point</label>
                                <span class="text-lg font-medium">${experience.departurePoint || '—'}</span>
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Transfer Type</label>
                                <span class="text-lg font-medium">${experience.transferType || '—'}</span>
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Active Duration</label>
                                <span class="text-lg font-medium">${experience.activeDuration || '—'}</span>
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Itinerary Dispatch</label>
                                <span class="text-lg font-medium">${experience.itineraryDispatch || '—'}</span>
                            </div>
                        </div>

                        <div class="mt-12 pt-8 border-t border-white/10">
                            <p class="text-[10px] font-light text-white/40 italic">
                                * Full itinerary dispatched to confirmed members only.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        ${buildCountdownSection(experience)}
        ${buildItinerarySection(experience)}

        <!-- Suggested Section -->
        <section class="bg-[#111010] opt-section border-t border-white/5">
            <div class="mx-auto max-w-[1200px]">
                <div class="opt-eyebrow with-line mb-12"><span>Other Pursuits</span></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    ${otherExperiences.map(e => `
                        <div onclick="showExperience('${e.slug}')" class="group flex flex-col gap-6 cursor-pointer">
                            <div class="relative aspect-video overflow-hidden rounded-xl bg-charcoal">
                               <img src="${getCdnUrl(e.image, 600)}" alt="${e.title}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                               <div class="absolute inset-0 bg-charcoal/40 group-hover:bg-charcoal/20 transition-colors"></div>
                            </div>
                            <div>
                                <span class="opt-eyebrow block mb-2">${e.category}</span>
                                <h4 class="opt-subtitle mt-1 md:!text-3xl">${e.title}</h4>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    </div>
`;

    experienceDetail.classList.remove('page-hidden');
    experienceDetail.classList.add('page-visible');

    // Initialize scripts (Javascript doesn't execute inside innerHTML)
    const countdownId = `cd-${experience.slug.replace(/[^a-z0-9]/gi, '')}`;
    const dateStr = experience.eventDate || experience.date || '';
    initCountdownTimer(dateStr, countdownId);
    initTimelineScroll(`timelineContainer-${experience.slug}`, `timelineProgress-${experience.slug}`);

    window.scrollTo(0, 0);
}

// Close experience detail and go back
function closeExperience() {
    if (currentCountdownInterval) clearInterval(currentCountdownInterval);
    if (currentTimelineScrollListener) window.removeEventListener('scroll', currentTimelineScrollListener);

    const experienceDetail = document.getElementById('experienceDetail');

    // Hide details
    experienceDetail.classList.remove('page-visible');
    experienceDetail.classList.add('page-hidden');

    // Show previous view
    if (previousViewId === 'membersDashboard') {
        const dashboard = document.getElementById('membersDashboard');
        if (dashboard) dashboard.style.display = 'block';
    } else {
        const mainSite = document.getElementById('mainSite');
        if (mainSite) {
            mainSite.classList.remove('page-hidden');
            mainSite.classList.add('page-visible');
        }
    }

    // Clear content after animation
    setTimeout(() => {
        experienceDetail.innerHTML = '';
    }, 500);

    window.scrollTo(0, 0);
}

// Navigate to login (separate page functionality)
function navigateTo(page) {
    if (page === 'login') {
        showLoginModal();
    }
}

// Show members-only content after authentication (legacy function for public site)
function showMembersContent() {
    const membersOnlyElements = document.querySelectorAll('.members-only');
    membersOnlyElements.forEach(element => {
        element.style.display = '';
    });
}

// Render public events on landing page (Dynamic)
function renderPublicEvents() {
    const eventsSection = document.getElementById('events');
    if (!eventsSection) return;
    const grid = eventsSection.querySelector('.grid');
    if (!grid) return;

    if (Object.keys(EXPERIENCE_DATA).length === 0) {
        initializeData();
    }
    const events = Object.values(EXPERIENCE_DATA);

    grid.innerHTML = events.map((event, index) => {
        const offsetClass = index % 2 !== 0 ? 'md:mt-24' : '';

        return `
        <div class="flex flex-col gap-6 group ${offsetClass}">
            <div class="relative overflow-hidden rounded-xl aspect-[3/4] bg-charcoal hover-scale cursor-pointer" onclick="showExperience('${event.slug}')">
                <div class="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105"
                    style="background-image: url('${getCdnUrl(event.image)}');">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent opacity-60"></div>
            </div>
            <div class="px-2">
                <span class="opt-eyebrow block mt-6 mb-2">${event.category}</span>
                <h3 class="opt-subtitle mb-3">${event.title}</h3>
                <p class="opt-desc mb-6 line-clamp-2">
                    ${event.date} • ${event.longDescription ? event.longDescription.substring(0, 100) + '...' : ''}
                </p>
                <button onclick="showExperience('${event.slug}')" class="flex items-center gap-2 group/btn cursor-pointer !opacity-100">
                    <span class="text-[11px] font-semibold uppercase tracking-widest text-[#f5f2ed] border-b border-[#c9293a]/40 group-hover/btn:border-[#c9293a] transition-all">More Info</span>
                    <span class="material-symbols-outlined text-[#c9293a] text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                </button>
            </div>
        </div>
        `;
    }).join('');
}


// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

// Observe all page sections
document.querySelectorAll('.page-section').forEach(section => {
    observer.observe(section);
});

// Add active class to nav links on scroll
window.addEventListener('scroll', () => {
    // Nav dark background on scroll
    const nav = document.getElementById('nav');
    if (nav) {
        if (window.scrollY > 40) {
            nav.classList.add('on');
        } else {
            nav.classList.remove('on');
        }
    }

    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('text-primary');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('text-primary');
                }
            });
        }
    });
});

// Trigger fade-in animations on page load
window.addEventListener('load', () => {
    document.querySelectorAll('.fade-in-up').forEach(el => {
        el.style.opacity = '1';
    });

    // Initialize data from localStorage
    initializeData();

    // Render public events
    renderPublicEvents();

    // Check authentication status
    checkAuthStatus();
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('mobileMenu');
    const menuButton = e.target.closest('button[onclick="toggleMobileMenu()"]');

    if (!menu.contains(e.target) && !menuButton && menu.classList.contains('open')) {
        toggleMobileMenu();
    }
});
