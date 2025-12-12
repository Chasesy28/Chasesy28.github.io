 document.addEventListener('DOMContentLoaded', function() {
            const rainContainer = document.querySelector('.rain');
            const dropDensity = 15; // Moved here to be accessible by all functions
            
            // Cache slide elements for better performance
            let cachedSlides = [];
            const updateSlideCache = () => {
                cachedSlides = Array.from(document.querySelectorAll('.swiper-slide'));
            };
            
            // Initial cache - will update after swiper is ready
            setTimeout(updateSlideCache, 100);
            
            // Shared cleanup tracking for drops
            const dropCleanupCallbacks = new Map();

            // --- Function to check if drop hits a slide ---
            const checkSlideCollision = (drop) => {
                const dropRect = drop.getBoundingClientRect();
                
                for (let slide of cachedSlides) {
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

                // Check for collisions during animation with proper cleanup
                let checkInterval = null;
                
                const startCollisionCheck = () => {
                    let lastCheck = 0;
                    checkInterval = setInterval(() => {
                        // Check if drop still exists in DOM
                        if (!drop.parentElement) {
                            clearInterval(checkInterval);
                            checkInterval = null;
                            return;
                        }
                        
                        const currentTime = Date.now();
                        if (currentTime - lastCheck > 50) { // Check every 50ms
                            lastCheck = currentTime;
                            checkSlideCollision(drop);
                        }
                    }, 50);
                };
                
                // Start initial collision checking
                startCollisionCheck();

                // Event Listener for the Ground Splash
                const handleAnimationIteration = () => {
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
                };
                
                drop.addEventListener('animationiteration', handleAnimationIteration);
                
                // Register cleanup callback for this drop
                dropCleanupCallbacks.set(drop, () => {
                    if (checkInterval) {
                        clearInterval(checkInterval);
                        checkInterval = null;
                    }
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
            
            // Shared MutationObserver for all raindrops
            const sharedObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (dropCleanupCallbacks.has(node)) {
                            dropCleanupCallbacks.get(node)();
                            dropCleanupCallbacks.delete(node);
                        }
                    });
                });
            });
            
            sharedObserver.observe(rainContainer, { childList: true });

            
        });

