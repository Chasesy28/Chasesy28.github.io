 document.addEventListener('DOMContentLoaded', function() {
            const rainContainer = document.querySelector('.rain');
            const dropDensity = 15; // Moved here to be accessible by all functions

            // --- Function to create a single drop ---
            const createDrop = () => {
                const drop = document.createElement('div');
                drop.classList.add('drop');

                // Random horizontal position, delay, and duration
                drop.style.left = `${Math.random() * 100}vw`;
                drop.style.animationDelay = `${Math.random() * 2}s`;
                drop.style.animationDuration = `${0.7 + Math.random() * 0.5}s`;

                // Event Listener for the Splash
                drop.addEventListener('animationiteration', () => {
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

