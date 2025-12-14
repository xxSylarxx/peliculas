document.addEventListener('DOMContentLoaded', () => {

    // Check which page we are on
    const isIndexPage = document.getElementById('movie-grid');
    const isPlayerPage = document.getElementById('main-video');

    if (isIndexPage) {
        initIndexPage();
        initVisitCounter();
    } else if (isPlayerPage) {
        initPlayerPage();
    }

    // --- Visit Counter Logic with Server-Side PHP (12-hour cooldown) ---
    function initVisitCounter() {
        const visitCountElement = document.getElementById('visit-count');

        if (visitCountElement) {
            // Fetch visit count from server
            fetch('counter.php')
                .then(response => response.json())
                .then(data => {
                    // Display the current count with animation
                    animateCounter(visitCountElement, data.count);

                    // Optional: Log if this visit was counted
                    if (data.incremented) {
                        console.log('Nueva visita registrada!');
                    } else {
                        console.log('Visita ya contada en las últimas 12 horas');
                    }
                })
                .catch(error => {
                    console.error('Error al cargar contador de visitas:', error);
                    visitCountElement.textContent = '--';
                });
        }
    }

    function animateCounter(element, targetValue) {
        let currentValue = 0;
        const duration = 1000; // 1 second
        const increment = targetValue / (duration / 16); // 60fps

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                element.textContent = targetValue.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue).toLocaleString();
            }
        }, 16);
    }

    // --- Index Page Logic ---
    function initIndexPage() {
        const grid = document.getElementById('movie-grid');
        grid.innerHTML = '';

        movies.forEach(movie => {
            const col = document.createElement('div');
            col.className = 'col';

            col.innerHTML = `
                <a href="player.html?id=${movie.id}" class="text-decoration-none">
                    <div class="card h-100 bg-dark text-white border-0 shadow-sm movie-card">
                        <div class="position-relative overflow-hidden rounded-top">
                            <img src="${movie.thumbnail}" class="card-img-top" alt="${movie.title}" style="height: 380px; object-fit: cover;">
                            <div class="card-overlay d-flex align-items-center justify-content-center">
                                <i class="fas fa-play-circle fa-3x text-danger"></i>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title fw-bold text-truncate">${movie.title}</h5>
                            <p class="card-text text-secondary small">${movie.year} • ${movie.duration}</p>
                        </div>
                    </div>
                </a>
            `;
            grid.appendChild(col);
        });
    }

    // --- Player Page Logic ---
    function initPlayerPage() {
        const mainVideo = document.getElementById('main-video');
        const movieTitle = document.getElementById('movie-title');
        const movieDesc = document.getElementById('movie-desc');
        const movieYear = document.getElementById('movie-year');
        const movieDuration = document.getElementById('movie-duration');
        const movieListContainer = document.getElementById('movie-list');

        // Custom Controls Elements
        const playPauseBtn = document.getElementById('play-pause-btn');
        const seekBar = document.getElementById('seek-bar');
        const muteBtn = document.getElementById('mute-btn');
        const volumeBar = document.getElementById('volume-bar');
        const currentTimeEl = document.getElementById('current-time');
        const durationEl = document.getElementById('duration');
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        const videoContainer = document.getElementById('video-container');

        // Chapter Navigation Elements
        const chapterNavigation = document.getElementById('chapter-navigation');
        const prevChapterBtn = document.getElementById('prev-chapter-btn');
        const nextChapterBtn = document.getElementById('next-chapter-btn');
        let currentChapterIndex = 0;

        // Get Movie ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = parseInt(urlParams.get('id'));

        // Find current movie or default to first
        let currentMovie = movies.find(m => m.id === movieId) || movies[0];

        // Load initial movie
        if (currentMovie.chapters && currentMovie.chapters.length > 0) {
            currentChapterIndex = 0;
            loadChapter(currentMovie, currentMovie.chapters[0], 0);
            setupChapterNavigation();
        } else {
            loadMovie(currentMovie);
            hideChapterNavigation();
        }

        // Render Sidebar List
        renderSidebarList(currentMovie.id);

        // --- Video Event Listeners ---

        // Play/Pause Toggle
        playPauseBtn.addEventListener('click', togglePlay);
        mainVideo.addEventListener('click', togglePlay);

        function togglePlay() {
            if (mainVideo.paused) {
                mainVideo.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause fa-lg"></i>';
            } else {
                mainVideo.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play fa-lg"></i>';
            }
        }

        // Update UI when video plays/pauses (e.g. ended or buffering)
        mainVideo.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause fa-lg"></i>';
        });
        mainVideo.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<i class="fas fa-play fa-lg"></i>';
        });

        // Time Update & Seek Bar
        mainVideo.addEventListener('timeupdate', () => {
            const current = mainVideo.currentTime;
            const duration = mainVideo.duration;

            if (!isNaN(duration)) {
                const value = (current / duration) * 100;
                seekBar.value = value;
                currentTimeEl.textContent = formatTime(current);
                durationEl.textContent = formatTime(duration);

                // Update Progress Fill
                seekBar.style.backgroundSize = `${value}% 100%`;
            }
        });

        // Seek functionality
        seekBar.addEventListener('input', () => {
            const time = (seekBar.value / 100) * mainVideo.duration;
            mainVideo.currentTime = time;

            // Update Fill immediately while dragging
            const value = seekBar.value;
            seekBar.style.backgroundSize = `${value}% 100%`;
        });

        // Volume Control
        volumeBar.addEventListener('input', () => {
            mainVideo.volume = volumeBar.value;
            updateVolumeIcon();
        });

        muteBtn.addEventListener('click', () => {
            mainVideo.muted = !mainVideo.muted;
            updateVolumeIcon();
        });

        function updateVolumeIcon() {
            if (mainVideo.muted || mainVideo.volume === 0) {
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (mainVideo.volume < 0.5) {
                muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }

        // Fullscreen
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                videoContainer.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        });

        // Helper: Format Time
        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function loadMovie(movie) {
            mainVideo.src = movie.videoUrl;
            mainVideo.play().catch(e => console.log("Autoplay prevented:", e)); // Handle autoplay policies

            movieTitle.textContent = movie.title;
            movieDesc.textContent = movie.description;
            movieYear.textContent = movie.year;
            movieDuration.textContent = movie.duration;
        }

        function loadChapter(movie, chapter, index) {
            mainVideo.src = chapter.videoUrl;
            mainVideo.play().catch(e => console.log("Autoplay prevented:", e));

            movieTitle.textContent = `${movie.title} - ${chapter.title}`;
            movieDesc.textContent = movie.description;
            movieYear.textContent = movie.year;
            movieDuration.textContent = chapter.duration;

            // Update current chapter index
            if (index !== undefined) {
                currentChapterIndex = index;
            }

            // Update navigation button states
            updateNavigationButtons();
        }

        function setupChapterNavigation() {
            if (chapterNavigation) {
                chapterNavigation.classList.remove('d-none');

                // Previous chapter button
                prevChapterBtn.addEventListener('click', () => {
                    if (currentChapterIndex > 0) {
                        currentChapterIndex--;
                        const chapter = currentMovie.chapters[currentChapterIndex];
                        loadChapter(currentMovie, chapter, currentChapterIndex);
                        updateActiveChapterInSidebar(currentChapterIndex);
                    }
                });

                // Next chapter button
                nextChapterBtn.addEventListener('click', () => {
                    if (currentChapterIndex < currentMovie.chapters.length - 1) {
                        currentChapterIndex++;
                        const chapter = currentMovie.chapters[currentChapterIndex];
                        loadChapter(currentMovie, chapter, currentChapterIndex);
                        updateActiveChapterInSidebar(currentChapterIndex);
                    }
                });

                updateNavigationButtons();
            }
        }

        function hideChapterNavigation() {
            if (chapterNavigation) {
                chapterNavigation.classList.add('d-none');
            }
        }

        function updateNavigationButtons() {
            if (!currentMovie.chapters || currentMovie.chapters.length === 0) return;

            // Disable/enable previous button
            if (currentChapterIndex === 0) {
                prevChapterBtn.disabled = true;
                prevChapterBtn.classList.add('opacity-50');
            } else {
                prevChapterBtn.disabled = false;
                prevChapterBtn.classList.remove('opacity-50');
            }

            // Disable/enable next button
            if (currentChapterIndex === currentMovie.chapters.length - 1) {
                nextChapterBtn.disabled = true;
                nextChapterBtn.classList.add('opacity-50');
            } else {
                nextChapterBtn.disabled = false;
                nextChapterBtn.classList.remove('opacity-50');
            }
        }

        function updateActiveChapterInSidebar(index) {
            const items = document.querySelectorAll('.movie-list-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        function renderSidebarList(activeId) {
            movieListContainer.innerHTML = '';

            // Check if current movie has chapters
            if (currentMovie.chapters && currentMovie.chapters.length > 0) {
                // Render Chapters
                const header = document.createElement('div');
                header.className = 'p-2 text-secondary small text-uppercase fw-bold';
                header.textContent = 'Capítulos';
                movieListContainer.appendChild(header);

                currentMovie.chapters.forEach((chapter, index) => {
                    const item = document.createElement('a');
                    item.href = '#';
                    item.className = `list-group-item list-group-item-action bg-transparent text-white movie-list-item d-flex align-items-center p-2 ${index === 0 ? 'active' : ''}`;

                    item.innerHTML = `
                        <div class="me-3 d-flex align-items-center justify-content-center bg-secondary rounded" style="width: 40px; height: 40px;">
                            <i class="fas fa-play fa-sm"></i>
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold text-truncate" style="max-width: 180px;">${chapter.title}</h6>
                            <small class="text-secondary">${chapter.duration}</small>
                        </div>
                    `;

                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Update active state
                        document.querySelectorAll('.movie-list-item').forEach(el => el.classList.remove('active'));
                        item.classList.add('active');

                        // Play Chapter
                        currentChapterIndex = index;
                        loadChapter(currentMovie, chapter, index);
                    });

                    movieListContainer.appendChild(item);
                });

            } else {
                // Render Other Movies (Default Behavior)
                movies.forEach(movie => {
                    const item = document.createElement('a');
                    item.href = `player.html?id=${movie.id}`;
                    item.className = `list-group-item list-group-item-action bg-transparent text-white movie-list-item d-flex align-items-center p-2 ${movie.id === activeId ? 'active' : ''}`;

                    item.innerHTML = `
                        <img src="${movie.thumbnail}" alt="${movie.title}" class="movie-thumbnail me-3 shadow-sm">
                        <div>
                            <h6 class="mb-1 fw-bold text-truncate" style="max-width: 150px;">${movie.title}</h6>
                            <small class="text-secondary">${movie.duration}</small>
                        </div>
                    `;

                    movieListContainer.appendChild(item);
                });
            }
        }

        // Toggle Chapter List on Mobile
        const toggleChapterListBtn = document.getElementById('toggleChapterList');
        const chapterListContainer = document.getElementById('chapterListContainer');

        if (toggleChapterListBtn && chapterListContainer) {
            toggleChapterListBtn.addEventListener('click', () => {
                chapterListContainer.classList.toggle('collapsed');
                const icon = toggleChapterListBtn.querySelector('i');
                if (chapterListContainer.classList.contains('collapsed')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
        }
    }

    // --- Media Slider Logic (Anti-Adblocker) ---
    const mediaSlides = document.querySelectorAll('.media-slide');
    const sliderDots = document.querySelectorAll('.slider-dot');

    if (mediaSlides.length > 0) {
        let currentSlide = 0;
        const slideInterval = 5000; // 5 seconds

        function showSlide(index) {
            // Remove active class from all slides and dots
            mediaSlides.forEach(slide => slide.classList.remove('active'));
            sliderDots.forEach(dot => dot.classList.remove('active'));

            // Add active class to current slide and dot
            mediaSlides[index].classList.add('active');
            sliderDots[index].classList.add('active');
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % mediaSlides.length;
            showSlide(currentSlide);
        }

        // Auto-advance slides
        let interval = setInterval(nextSlide, slideInterval);

        // Manual navigation with dots
        sliderDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);

                // Reset interval when manually clicking
                clearInterval(interval);
                interval = setInterval(nextSlide, slideInterval);
            });
        });
    }
});
