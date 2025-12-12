 document.addEventListener('DOMContentLoaded', function() {
            const rainContainer = document.querySelector('.rain');
            const dropDensity = 15; // Moved here to be accessible by all functions

            // --- Function to check if drop hits a slide ---
            const checkSlideCollision = (drop) => {
                const dropRect = drop.getBoundingClientRect();
                const slides = document.querySelectorAll('.swiper-slide');
                
                for (let slide of slides) {
                    const slideRect = slide.getBoundingClientRect();
                    
                    // Check if drop overlaps with slide
                    if (dropRect.left < slideRect.right &&
                        dropRect.right > slideRect.left &&
                        dropRect.top < slideRect.bottom &&
                        dropRect.bottom > slideRect.top) {
                        
                        // Create splash on slide
                        const splash = document.createElement('div');
                        splash.classList.add('slide-splash');
                        
                        // Position splash relative to slide
                        const relativeX = dropRect.left - slideRect.left;
                        const relativeY = dropRect.top - slideRect.top;
                        
                        splash.style.left = `${relativeX}px`;
                        splash.style.top = `${relativeY}px`;
                        
                        slide.appendChild(splash);
                        
                        // Remove splash after animation
                        setTimeout(() => {
                            splash.remove();
                        }, 400);
                        
                        return true;
                    }
                }
                return false;
            };

            // --- Function to create a single drop ---
            const createDrop = () => {
                const drop = document.createElement('div');
                drop.classList.add('drop');

                // Random horizontal position, delay, and duration
                drop.style.left = `${Math.random() * 100}vw`;
                drop.style.animationDelay = `${Math.random() * 2}s`;
                drop.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;

                // Check for collisions during animation
                let lastCheck = 0;
                const checkInterval = setInterval(() => {
                    const currentTime = Date.now();
                    if (currentTime - lastCheck > 50) { // Check every 50ms
                        lastCheck = currentTime;
                        checkSlideCollision(drop);
                    }
                }, 50);

                // Event Listener for the Ground Splash
                drop.addEventListener('animationiteration', () => {
                    // Create splash on ground
                    const splash = document.createElement('div');
                    splash.classList.add('splash');
                    splash.style.left = drop.style.left;
                    splash.style.bottom = '5px';
                    rainContainer.appendChild(splash);

                    setTimeout(() => {
                        splash.classList.add('splash-animation');
                    }, 10);

                    splash.addEventListener('animationend', () => {
                        splash.remove();
                    }, { once: true });
                });

                rainContainer.appendChild(drop);
            };

            // --- Function to handle resizing ---
            const handleResize = () => {
                const newNumberOfDrops = Math.floor(window.innerWidth / dropDensity);
                const currentDrops = rainContainer.querySelectorAll('.drop');
                const diff = newNumberOfDrops - currentDrops.length;

                if (diff > 0) {
                    // If the screen got bigger, add more drops
                    for (let i = 0; i < diff; i++) {
                        createDrop();
                    }
                } else if (diff < 0) {
                    // If the screen got smaller, remove some drops
                    for (let i = 0; i < Math.abs(diff); i++) {
                        // Remove the last drop to be less noticeable
                        if (currentDrops[currentDrops.length - 1 - i]) {
                             currentDrops[currentDrops.length - 1 - i].remove();
                        }
                    }
                }
            };
            
            // --- Initial Setup ---
            const initRain = () => {
                const initialNumberOfDrops = Math.floor(window.innerWidth / dropDensity);
                for (let i = 0; i < initialNumberOfDrops; i++) {
                    createDrop();
                }
            };

            initRain();

            // Use the new resize handler
            window.addEventListener('resize', handleResize);

            
        });

