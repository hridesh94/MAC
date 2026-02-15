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
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <button 
                    onclick="closeExperience()" 
                    class="absolute top-28 left-10 z-20 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
                >
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span class="small-caps text-[10px] font-bold tracking-widest">Back</span>
                </button>
                
                <span class="small-caps text-xs font-bold tracking-[0.5em] text-primary mb-4">${experience.category}</span>
                <h1 class="serif-italic text-6xl md:text-9xl font-bold mb-6">${experience.title}</h1>
                <p class="max-w-2xl text-lg font-light text-white/70 leading-relaxed uppercase tracking-widest text-[10px]">
                    ${experience.date} • Secured Admission
                </p>
            </div>
        </section>

        <!-- Detail Content -->
        <section class="mx-auto max-w-[1200px] px-6 py-32 lg:px-10">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-20">
                <!-- Main Info -->
                <div class="lg:col-span-2 space-y-12">
                    <h2 class="serif-italic text-4xl font-light">The Narrative</h2>
                    <p class="text-xl font-light leading-relaxed text-white/60">
                        ${experience.longDescription}
                    </p>
                    <p class="text-xl font-light leading-relaxed text-white/60">
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
                // Member view - show participation button
                const registeredEvents = JSON.parse(sessionStorage.getItem('registeredEvents') || '[]');
                if (registeredEvents.includes(experience.slug)) {
                    return `<button class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-white/10 border border-white/20 text-white/50 text-sm font-black uppercase tracking-widest cursor-not-allowed">
                                            Already Registered
                                        </button>`;
                }
                return `<button onclick="openParticipationModal('${experience.slug}', '${experience.title}', '${experience.date}')" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-primary text-sm font-black uppercase tracking-widest transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30">
                                        Secure Participation
                                    </button>`;
            } else {
                // Public view - prompt to login
                return `<button onclick="navigateTo('login')" class="inline-flex h-16 min-w-[300px] items-center justify-center rounded-full bg-primary text-sm font-black uppercase tracking-widest transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/30">
                                        Secure Participation
                                    </button>`;
            }
        })()}
                    </div>
                </div>

                <!-- Technical Specs Panel -->
                <div class="lg:col-span-1">
                    <div class="glass-panel p-10 rounded-2xl sticky top-32">
                        <h3 class="small-caps text-xs font-bold tracking-widest text-primary mb-8 border-b border-white/10 pb-4">Technical Details</h3>
                        <div class="space-y-8">
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Primary Location</label>
                                <span class="text-lg font-medium">${experience.specs.location}</span>
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Duration</label>
                                <span class="text-lg font-medium">${experience.specs.duration}</span>
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Equipment Profile</label>
                                <span class="text-lg font-medium">${experience.specs.equipment}</span>
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-2">Skill Rating</label>
                                <span class="text-lg font-medium">${experience.specs.difficulty}</span>
                            </div>
                        </div>

                        <div class="mt-12 pt-8 border-t border-white/10">
                            <p class="text-[10px] font-light text-white/40 italic">
                                * All equipment is maintained to aerospace standards and customized for MAC members.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Suggested Section -->
        <section class="bg-background-dark py-32 border-t border-white/5">
            <div class="mx-auto max-w-[1200px] px-6">
                <span class="small-caps text-[10px] font-bold tracking-widest text-primary block mb-12">Other Pursuits</span>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    ${otherExperiences.map(e => `
                        <div onclick="showExperience('${e.slug}')" class="group flex flex-col gap-6 cursor-pointer">
                            <div class="relative aspect-video overflow-hidden rounded-xl bg-charcoal">
                               <img src="${getCdnUrl(e.image, 600)}" alt="${e.title}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                               <div class="absolute inset-0 bg-charcoal/40 group-hover:bg-charcoal/20 transition-colors"></div>
                            </div>
                            <div>
                                <span class="small-caps text-[10px] font-bold tracking-widest text-primary">${e.category}</span>
                                <h4 class="serif-italic text-2xl mt-1">${e.title}</h4>
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

    window.scrollTo(0, 0);
}

// Close experience detail and go back
function closeExperience() {
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
                <span class="text-primary dark:text-blush text-[10px] font-bold uppercase-tracking">${event.category}</span>
                <h3 class="text-3xl font-serif mt-2 mb-3">${event.title}</h3>
                <p class="opacity-70 text-sm font-normal leading-relaxed mb-6">
                    ${event.date} • ${event.longDescription ? event.longDescription.substring(0, 100) + '...' : ''}
                </p>
                <button onclick="showExperience('${event.slug}')" class="flex items-center gap-2 group/btn cursor-pointer">
                    <span class="text-sm font-bold uppercase-tracking border-b border-primary/40 group-hover/btn:border-primary transition-all">More Info</span>
                    <span class="material-symbols-outlined text-primary text-sm transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
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
