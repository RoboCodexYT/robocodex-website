document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Close menu when a link is clicked (for single-page navigation)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });
    }

    // --- Admin / Hidden Course Access Logic ---
    const logo = document.querySelector('.logo');
    let logoClicks = 0;
    
    if (logo) {
        logo.addEventListener('click', (e) => {
            // Prevent actual navigation if we want to use clicks as a trigger
            // But usually, clicking a logo goes to home, so we just count them.
            logoClicks++;
            if (logoClicks === 5) {
                const isAdmin = localStorage.getItem('robocodex_admin') === 'true';
                localStorage.setItem('robocodex_admin', isAdmin ? 'false' : 'true');
                alert(isAdmin ? 'Admin mode deactivated.' : 'Admin mode activated! Course link is now visible.');
                location.reload();
            }
            
            // Reset clicks after 2 seconds of inactivity
            setTimeout(() => { logoClicks = 0; }, 2000);
        });
    }

    // Restore course link if admin
    if (localStorage.getItem('robocodex_admin') === 'true' && navMenu) {
        if (!navMenu.querySelector('a[href="course.html"]')) {
            const li = document.createElement('li');
            li.innerHTML = '<a href="course.html">Course (Hidden)</a>';
            navMenu.appendChild(li);
        }
    }

    // Block course page if not admin
    if (window.location.pathname.includes('course.html') && localStorage.getItem('robocodex_admin') !== 'true') {
        document.body.innerHTML = `
            <div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center; padding: 20px;">
                <h1 style="font-size: 4rem; margin-bottom: 0;">404</h1>
                <h2>Oops! Page Not Found</h2>
                <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
                <a href="index.html" class="button button-primary" style="margin-top: 20px; text-decoration:none; padding: 10px 20px; background:#007bff; color:white; border-radius:5px;">Go to Homepage</a>
            </div>
        `;
    }

    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Back to top button (optional, but good for long pages)
    const backToTopButton = document.createElement('button');
    backToTopButton.classList.add('back-to-top');
    backToTopButton.innerHTML = '&uarr;'; // Up arrow
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) { // Show button after scrolling 200px
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // --- Content Page: Video Filtering ---
    const videoGrid = document.getElementById('videoGrid');
    const filterButtonsContainer = document.getElementById('filterButtons');
    let allVideosData = []; // To store all fetched video data

    const fetchVideos = async () => {
        if (!videoGrid || !filterButtonsContainer) return;

        try {
            const response = await fetch('data/videos.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allVideosData = data.videos;
            displayVideos('all'); // Display all videos initially
        } catch (error) {
            console.error('Error fetching videos:', error);
            videoGrid.innerHTML = '<p class="no-videos-message">Failed to load videos. Please try again later.</p>';
        }
    };

    const displayVideos = (category) => {
        if (!videoGrid) return;

        videoGrid.innerHTML = ''; // Clear current videos
        const filteredVideos = category === 'all'
            ? allVideosData
            : allVideosData.filter(video => video.category === category);

        if (filteredVideos.length === 0) {
            videoGrid.innerHTML = '<p class="no-videos-message">No videos in this category yet.</p>';
            return;
        }

        filteredVideos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');
            videoCard.innerHTML = `
                <img src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg" alt="${video.title}" loading="lazy">
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <span class="video-date">${new Date(video.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span class="category-badge ${video.category.toLowerCase().replace(/\s/g, '-')}-badge">${video.category}</span>
                    <a href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener noreferrer" class="watch-link">Watch on YouTube <i class="fas fa-external-link-alt"></i></a>
                </div>
            `;
            videoGrid.appendChild(videoCard);
        });
    };

    if (filterButtonsContainer) {
        filterButtonsContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('filter-button')) {
                // Remove active class from all buttons
                filterButtonsContainer.querySelectorAll('.filter-button').forEach(button => {
                    button.classList.remove('active');
                });
                // Add active class to clicked button
                target.classList.add('active');
                const category = target.dataset.category;
                displayVideos(category);
            }
        });
        fetchVideos(); // Fetch and display videos on content page load
    }

    // --- Contact Page: Form Validation ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let isValid = true;

            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
            document.getElementById('success-message').style.display = 'none';

            // Validate Name
            const nameInput = document.getElementById('name');
            if (nameInput && nameInput.value.trim() === '') {
                document.getElementById('name-error').textContent = 'Name is required.';
                document.getElementById('name-error').style.display = 'block';
                isValid = false;
            }

            // Validate Email
            const emailInput = document.getElementById('email');
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && (!emailInput.value.trim() === '' || !emailPattern.test(emailInput.value))) {
                document.getElementById('email-error').textContent = 'Please enter a valid email address.';
                document.getElementById('email-error').style.display = 'block';
                isValid = false;
            }

            // Validate Subject
            const subjectInput = document.getElementById('subject');
            if (subjectInput && subjectInput.value.trim() === '') {
                document.getElementById('subject-error').textContent = 'Subject is required.';
                document.getElementById('subject-error').style.display = 'block';
                isValid = false;
            }

            // Validate Message
            const messageInput = document.getElementById('message');
            if (messageInput && (messageInput.value.trim().length < 10 || messageInput.value.trim() === '')) {
                document.getElementById('message-error').textContent = 'Message must be at least 10 characters long.';
                document.getElementById('message-error').style.display = 'block';
                isValid = false;
            }

            if (isValid) {
                // Submit the form (Formspree)
                const form = e.target;
                const formData = new FormData(form);
                const response = await fetch(form.action, {
                    method: form.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    document.getElementById('success-message').style.display = 'block';
                    form.reset(); // Clear the form
                } else {
                    alert('Oops! There was a problem submitting your form.');
                }
            }
        });
    }

    // --- Course Page: FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    if (faqQuestions.length > 0) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                question.classList.toggle('active');
                answer.classList.toggle('show');
            });
        });
    }

}); // End DOMContentLoaded
