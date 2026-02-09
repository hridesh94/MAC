// Experience Data
let EXPERIENCE_DATA = {};

// Initialize Data
function initializeData() {
    const storedEvents = localStorage.getItem('macEvents');

    if (storedEvents) {
        // Transform array back to object keyed by slug
        const eventsArray = JSON.parse(storedEvents);
        EXPERIENCE_DATA = eventsArray.reduce((acc, event) => {
            acc[event.id] = {
                slug: event.id,
                title: event.title,
                date: event.date,
                image: event.image || 'https://via.placeholder.com/800x600', // Fallback
                category: event.category || 'Experience',
                longDescription: event.description || '',
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
        // Default Data
        EXPERIENCE_DATA = {
            'dune-velocity': {
                slug: 'dune-velocity',
                category: 'Sand',
                title: 'Dune Velocity',
                date: 'October 2024',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4ADvu8l0d3h6fvmraX-Q1FDqriFMNbCCB_Kcx6m5awxtXsACJwUKMq-2FJNiLYZuy4gksXVQsa-AhC9KONEsL--vx97NupiC_46SlKWF9b7sZF7KsjS8fQrpFzYjFf0HlVWpUpOH51-Ad3kzYoDoGryfkfdFPkVgf1HIJp6OJ3HD4ENlrPV02CaSHEdFazTNIpDbtncFFxBB1lVI7VidacH4Ow-Rw6UbmAIchvM2LWMdsNQKixyFLAekMmrOzU2n4Hub9yZljbJm9',
                longDescription: 'Experience the raw majesty of the world\'s most pristine desert landscapes from behind the wheel of custom-built high-performance off-road vehicles. Dune Velocity is not just about speed—it\'s about precision navigation through one of nature\'s most dynamic terrains. Each journey is meticulously choreographed to push the boundaries of mechanical capability while respecting the delicate ecosystems we traverse.',
                specs: {
                    location: 'Rub\' al Khali Desert, UAE',
                    duration: '5 Days / 4 Nights',
                    equipment: 'Modified Rally SUVs',
                    difficulty: 'Advanced'
                }
            },
            'bluewater-throttle': {
                slug: 'bluewater-throttle',
                category: 'Water',
                title: 'Bluewater Throttle',
                date: 'November 2024',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVi8EG4kN12EKNfvPBT3w227V7O-V6G0LqX5B9UtDv9NShn2HmCUocnymKZS34Rf37VzVTpQ0Ju-l8bocmvrq1XFa_HTl_i6pKmuwTNTbvg8JCd8qgErilYEOOVcB_HUZzBy0MyHc-gdL1m6ySgsCN9T5NACSRFhK2Snwdkm3Ien592ahlxinlDf3YIADaQ4XgKSZZrEY749IuERRB40Q12aGcU49lQhfucCfJqLXEAMJvGk6wg-WviUe6UNA6YA5_T308GCgz4tkm',
                longDescription: 'Command the most advanced offshore racing vessels through azure waters in an exclusive aquatic experience. Bluewater Throttle combines the thrill of high-speed powerboat racing with the sophisticated elegance of luxury yachting. Navigate challenging coastal routes, master advanced maritime techniques, and experience the ocean from a perspective reserved for the elite few.',
                specs: {
                    location: 'Mediterranean Coast, Monaco',
                    duration: '4 Days / 3 Nights',
                    equipment: 'Custom Powerboats',
                    difficulty: 'Intermediate to Advanced'
                }
            },
            'apex-control': {
                slug: 'apex-control',
                category: 'Road',
                title: 'Apex Control',
                date: 'December 2024',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCORWcDaxL0OBxONDMsNHrwMHr8Mg3ABzHPCcGrqKHEQGY8TurbU6v_VdMxlWb4CdiZhGsX850bYw2fYOoglgv0WLV_eD3NGQHm_yhqrNmkJecOsrg8DcBwnpdRd3jtDI50aS7n_31SU1uhqpSeYVKw72VkYbcyBsUiPqvvg4qqXlegGQQbu5HEhmhC-tSlhhFJIGRkRF0rgj0hqgv1uWH_gt4rlXuAbagbtv_ObBCQJHyPCkzcqSowcYVem-Cjy1obxVhVV803j-wI',
                longDescription: 'Unlock the full potential of automotive engineering on world-class racing circuits. Apex Control provides exclusive access to FIA-certified tracks and prototype supercars, paired with coaching from professional racing drivers. This is precision driving distilled to its purest form—where every millisecond counts and perfection is the only acceptable outcome.',
                specs: {
                    location: 'Circuit de Spa-Francorchamps, Belgium',
                    duration: '3 Days / 2 Nights',
                    equipment: 'Prototype Supercars',
                    difficulty: 'Expert Level'
                }
            },
            'freefall': {
                slug: 'freefall',
                category: 'Sky',
                title: 'Freefall',
                date: 'January 2025',
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAz4kMpO4zNgdGc-pszzLAos9n-P5j4NqBbH1Pryj4p0dkSBMmh5Y6EHnbwsZrolUCws9ELqL9Qwpm4FhuAd-3_Q0WuOkGVDLiJM2t4CcIC6NR9fngNBTxDyKPcZN2UHwLqZ2_fWW-WKpt7Yy8CLUO5sxcFV4p1F-gtQXKWP8C6TQoefcZo4rbSTIG9BqrMA2v9Mwkhx5ptdnnflvQ6KZ9MAndhyDqSaNTlE5CrdzGn9HXf2u-nKKURZbz1ARt556jhE0F7xiGVI2v7',
                longDescription: 'Transcend earthbound limitations with high-altitude skydiving experiences that redefine the concept of freedom. Freefall takes you to the edge of the stratosphere for breathtaking HALO (High Altitude Low Opening) jumps. Witness curvature of the Earth, experience near-silence at terminal velocity, and discover what it means to truly fly.',
                specs: {
                    location: 'Interlaken, Swiss Alps',
                    duration: '6 Days / 5 Nights',
                    equipment: 'Military-Grade Parachute Systems',
                    difficulty: 'All Levels (Training Provided)'
                }
            }
        };

        // Save default data to localStorage for Admin use
        const flatEvents = Object.values(EXPERIENCE_DATA).map(e => ({
            id: e.slug,
            title: e.title,
            date: e.date,
            location: e.specs.location,
            category: e.category,
            description: e.longDescription,
            image: e.image,
            duration: e.specs.duration,
            equipment: e.specs.equipment,
            difficulty: e.specs.difficulty,
            participants: []
        }));
        localStorage.setItem('macEvents', JSON.stringify(flatEvents));
    }
}

// Call initialization
initializeData();
