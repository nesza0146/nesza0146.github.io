window.addEventListener('DOMContentLoaded', () => {
    const loaderContainer = document.getElementById('loader-container');
    const enterOverlay = document.getElementById('enter-overlay');
    const content = document.getElementById('content');
    const audio = document.getElementById('bg-music');

    const timerBg = document.querySelector('.container .timer .bg');
    const timeDisplay = document.querySelector('.container .time');
    const playBtn = document.getElementById('play-btn');

    // ===== LANYARD DISCORD PROFILE =====
    const DISCORD_USER_ID = '1397881557234089984';

    function formatMs(ms) {
        const secs = Math.floor(ms / 1000) % 60;
        const mins = Math.floor(ms / 60000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function updateDiscordProfile(data) {
        const avatar = document.getElementById('discord-avatar');
        const username = document.getElementById('discord-username');
        const statusText = document.getElementById('discord-status');
        const statusDot = document.getElementById('status-dot');
        const activityDiv = document.getElementById('discord-activity');

        // Avatar
        if (data.discord_user) {
            const user = data.discord_user;
            const avatarHash = user.avatar;
            if (avatarHash) {
                avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=128`;
            }
            username.textContent = user.display_name || user.global_name || user.username;
        }

        // Status dot
        const status = data.discord_status || 'offline';
        statusDot.className = 'status-dot ' + status;
        statusText.textContent = status === 'dnd' ? 'Do Not Disturb' : status;

        // Activity
        activityDiv.innerHTML = '';

        // Spotify
        if (data.listening_to_spotify && data.spotify) {
            const sp = data.spotify;
            const elapsed = Date.now() - sp.timestamps.start;
            const total = sp.timestamps.end - sp.timestamps.start;
            const progress = Math.min((elapsed / total) * 100, 100);

            activityDiv.innerHTML = `
                <div class="activity-item">
                    <img class="activity-img" src="${sp.album_art_url}" alt="Album">
                    <div class="activity-details">
                        <div class="activity-label">Listening to Spotify</div>
                        <div class="activity-name">${sp.song}</div>
                        <div class="activity-state">by ${sp.artist}</div>
                    </div>
                </div>
                <div class="spotify-progress">
                    <div class="spotify-bar-bg">
                        <div class="spotify-bar-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="spotify-times">
                        <span>${formatMs(elapsed)}</span>
                        <span>${formatMs(total)}</span>
                    </div>
                </div>
            `;
            return;
        }

        // Other activities (games, etc.)
        if (data.activities && data.activities.length > 0) {
            // Filter out custom status (type 4)
            const activity = data.activities.find(a => a.type !== 4);
            if (activity) {
                let imgHtml = '';
                if (activity.assets && activity.assets.large_image) {
                    let imgSrc = activity.assets.large_image;
                    if (imgSrc.startsWith('mp:external/')) {
                        imgSrc = `https://media.discordapp.net/external/${imgSrc.slice(12)}`;
                    } else if (!imgSrc.startsWith('http')) {
                        imgSrc = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${imgSrc}.png`;
                    }
                    imgHtml = `<img class="activity-img" src="${imgSrc}" alt="Activity">`;
                }

                const typeLabels = ['Playing', 'Streaming', 'Listening to', 'Watching', '', 'Competing in'];
                const label = typeLabels[activity.type] || 'Playing';

                activityDiv.innerHTML = `
                    <div class="activity-item">
                        ${imgHtml}
                        <div class="activity-details">
                            <div class="activity-label">${label}</div>
                            <div class="activity-name">${activity.name}</div>
                            ${activity.details ? `<div class="activity-state">${activity.details}</div>` : ''}
                            ${activity.state ? `<div class="activity-state">${activity.state}</div>` : ''}
                        </div>
                    </div>
                `;
                return;
            }
        }

        // Custom status or nothing
        const customStatus = data.activities ? data.activities.find(a => a.type === 4) : null;
        if (customStatus && customStatus.state) {
            activityDiv.innerHTML = `<div class="no-activity">${customStatus.emoji ? customStatus.emoji.name + ' ' : ''}${customStatus.state}</div>`;
        } else {
            activityDiv.innerHTML = '<div class="no-activity">No current activity</div>';
        }
    }

    // Fetch initial data
    function fetchLanyard() {
        fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    updateDiscordProfile(json.data);
                }
            })
            .catch(err => console.log('Lanyard fetch error:', err));
    }

    // Connect via WebSocket for real-time updates
    function connectLanyardWS() {
        const ws = new WebSocket('wss://api.lanyard.rest/socket');

        ws.onopen = () => {
            // Subscribe to user
            ws.send(JSON.stringify({
                op: 2,
                d: { subscribe_to_id: DISCORD_USER_ID }
            }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.op === 1) {
                // Hello - start heartbeat
                setInterval(() => {
                    ws.send(JSON.stringify({ op: 3 }));
                }, msg.d.heartbeat_interval);
            }

            if (msg.op === 0) {
                // Event - initial state or presence update
                if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') {
                    updateDiscordProfile(msg.d);
                }
            }
        };

        ws.onclose = () => {
            // Reconnect after 5 seconds
            setTimeout(connectLanyardWS, 5000);
        };

        ws.onerror = () => {
            ws.close();
        };
    }

    // Start Lanyard
    fetchLanyard();
    connectLanyardWS();

    // Update Spotify progress bar every second
    setInterval(() => {
        const fill = document.querySelector('.spotify-bar-fill');
        if (fill) {
            fetchLanyard(); // Refresh to get current progress
        }
    }, 15000);


    // ===== MUSIC PLAYER =====

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
        e.stopPropagation();
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


    // ===== SITE ENTRY =====

    const enterSite = () => {
        audio.play().catch(err => console.log("Audio play failed:", err));
        playBtn.classList.remove('fa-play');
        playBtn.classList.add('fa-pause');
        enterOverlay.classList.add('hidden');
        content.classList.remove('blurry');
        enterOverlay.removeEventListener('click', enterSite);
    };

    // Simulate loading time
    setTimeout(() => {
        loaderContainer.classList.add('hidden');
        setTimeout(() => {
            content.classList.remove('hidden');
            content.classList.add('visible');
            enterOverlay.classList.remove('hidden');
            enterOverlay.addEventListener('click', enterSite);
        }, 800);
    }, 3000);
});
