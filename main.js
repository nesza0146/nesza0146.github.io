window.addEventListener('DOMContentLoaded', () => {
    const loaderContainer = document.getElementById('loader-container');
    const enterOverlay = document.getElementById('enter-overlay');
    const content = document.getElementById('content');
    const audio = document.getElementById('bg-music');

    // Function to handle entering the site
    const enterSite = () => {
        // Play audio
        audio.play().catch(err => console.log("Audio play failed:", err));
        
        // Hide overlay and remove blur
        enterOverlay.classList.add('hidden');
        content.classList.remove('blurry');
        
        // Cleanup listeners
        enterOverlay.removeEventListener('click', enterSite);
    };

    // Simulate loading time (e.g., 3 seconds)
    setTimeout(() => {
        // Fade out loader
        loaderContainer.classList.add('hidden');
        
        // Show enter overlay and blurry content
        setTimeout(() => {
            content.classList.remove('hidden');
            content.classList.add('visible');
            enterOverlay.classList.remove('hidden');
            
            // Wait for user to click to continue
            enterOverlay.addEventListener('click', enterSite);
        }, 800); 
    }, 3000);
});
