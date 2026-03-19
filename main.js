window.addEventListener('DOMContentLoaded', () => {
    const loaderContainer = document.getElementById('loader-container');
    const enterOverlay = document.getElementById('enter-overlay');
    const content = document.getElementById('content');
    const audio = document.getElementById('bg-music');

    const timerBg = document.querySelector('.container .timer .bg');
    const timeDisplay = document.querySelector('.container .time');
    const playBtn = document.getElementById('play-btn');

    // Format time in mm:ss
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Update timer and progress bar
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            timerBg.style.setProperty('--progress', `${progress}%`);
            timeDisplay.textContent = formatTime(audio.currentTime);
        }
    });

    // Seek on click
    document.querySelector('.container .timer').addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = x / width;
        audio.currentTime = percentage * audio.duration;
    });

    // Play/Pause toggle
    playBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger enterSite
        if (audio.paused) {
            audio.play().catch(err => console.log("Play failed:", err));
            playBtn.classList.remove('fa-play');
            playBtn.classList.add('fa-pause');
        } else {
            audio.pause();
            playBtn.classList.remove('fa-pause');
            playBtn.classList.add('fa-play');
        }
    });

    // Rewind 10 seconds
    const rewindBtn = document.getElementById('rewind-btn');
    rewindBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    // Forward 10 seconds
    const forwardBtn = document.getElementById('forward-btn');
    forwardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });

    // Restart from beginning
    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.currentTime = 0;
    });

    // Function to handle entering the site
    const enterSite = () => {
        // Play audio
        audio.play().catch(err => console.log("Audio play failed:", err));
        
        // Sync play button UI
        playBtn.classList.remove('fa-play');
        playBtn.classList.add('fa-pause');

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
