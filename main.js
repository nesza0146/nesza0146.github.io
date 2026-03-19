window.addEventListener('DOMContentLoaded', () => {
    const loaderContainer = document.getElementById('loader-container');
    const content = document.getElementById('content');

    // Simulate loading time (e.g., 3 seconds)
    setTimeout(() => {
        // Fade out loader
        loaderContainer.classList.add('hidden');
        
        // After fade out, show content
        setTimeout(() => {
            content.classList.remove('hidden');
            content.classList.add('visible');
        }, 800); // Wait for loader fade transition (0.8s)
    }, 3000); // 3 second loading simulation
});
