const STORAGE_KEYS = {
  theme: 'robocodex-theme',
  bookmarks: 'robocodex-bookmarks',
};

const state = {
  videos: [],
  filters: { query: '', category: 'All', sort: 'newest' },
};

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookmarks) || '{}');
  } catch {
    return {};
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
}

function toggleBookmark(type, id) {
  const bookmarks = getBookmarks();
  const key = `${type}:${id}`;
  if (bookmarks[key]) {
    delete bookmarks[key];
  } else {
    bookmarks[key] = { type, id, savedAt: new Date().toISOString() };
  }
  saveBookmarks(bookmarks);
  renderBookmarks();
  renderVideoCards();
  renderResources();
}

function clearBookmarks() {
  localStorage.removeItem(STORAGE_KEYS.bookmarks);
  renderBookmarks();
  renderVideoCards();
  renderResources();
}

function isBookmarked(type, id) {
  return Boolean(getBookmarks()[`${type}:${id}`]);
}

function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || 'light';
}

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.innerHTML = theme === 'dark'
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function setTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  applyTheme(theme);
}

function formatDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Date coming soon';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function sortVideos(videos) {
  const list = [...videos];
  switch (state.filters.sort) {
    case 'oldest':
      return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'most-viewed':
      return list.sort((a, b) => (b.views || 0) - (a.views || 0));
    default:
      return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

function filterVideos(videos) {
  const query = state.filters.query.toLowerCase();
  return videos.filter((video) => {
    const matchesCategory = state.filters.category === 'All' || video.category === state.filters.category;
    const haystack = [video.title, video.description, video.category, ...(video.keywords || [])].join(' ').toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesQuery;
  });
}

function renderVideoCards() {
  const grid = document.getElementById('video-grid');
  const countTarget = document.getElementById('video-count');
  const statusTarget = document.getElementById('video-status');
  if (!grid) return;
  const visible = sortVideos(filterVideos(state.videos));
  if (countTarget) {
    countTarget.textContent = `${visible.length} video${visible.length === 1 ? '' : 's'} currently shown from the available RoboCodex library.`;
  }
  if (statusTarget) {
    const source = state.videos?.[0]?.source || 'local';
    const lastUpdated = state.videos?.[0]?.lastUpdated || state.videos?.[0]?.date;
    const label = source === 'youtube' && lastUpdated
      ? `Last refreshed ${formatDate(lastUpdated)}`
      : 'The library updates whenever new video data is added.';
    statusTarget.textContent = label;
  }
  if (!visible.length) {
    grid.innerHTML = '<div class="card list-item">No RoboCodex videos currently match this search.</div>';
    return;
  }
  grid.innerHTML = visible.map((video) => `
    <article class="card video-card">
      <img src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg" alt="${video.title}" loading="lazy">
      <div class="meta-row">
        <span>${video.category}</span>
        <span>${video.duration || 'Video'}</span>
      </div>
      <h3>${video.title}</h3>
      <p class="muted">${video.description}</p>
      <div class="meta-row">
        <span>${formatDate(video.date)}</span>
        <span>${video.views ? `${video.views.toLocaleString()} views` : 'Views pending'}</span>
      </div>
      <div class="inline-list">
        <a class="btn btn-primary" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener noreferrer">Watch</a>
        <button class="bookmark-btn ${isBookmarked('video', video.id) ? 'active' : ''}" data-type="video" data-id="${video.id}">★ Save</button>
      </div>
    </article>
  `).join('');
}

function renderFeaturedVideo() {
  const target = document.getElementById('featured-video');
  if (!target) return;
  const video = state.videos[0];
  if (!video) return;
  target.innerHTML = `
    <div class="card" style="padding:1.25rem;">
      <div class="badge">Featured video</div>
      <h3>${video.title}</h3>
      <p class="muted">${video.description}</p>
      <div class="meta-row">
        <span>${video.category}</span>
        <span>${video.duration || 'Video'}</span>
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener noreferrer">Watch now</a>
        <a class="btn btn-secondary" href="content.html">Open library</a>
      </div>
    </div>
  `;
}

function renderGuides() {
  const target = document.getElementById('guide-grid');
  if (!target) return;
  const guides = [
    { title: 'What Is FIRST Tech Challenge?', summary: 'A beginner-friendly overview of the program, structure, and goals.', slug: 'what-is-ftc', difficulty: 'Beginner' },
    { title: 'How the FTC Control System Works', summary: 'A practical explanation of the robot controller, driver station, and wiring.', slug: 'control-system', difficulty: 'Beginner' },
    { title: 'Choosing Blocks, OnBot Java, or Android Studio', summary: 'Compare common programming paths for new teams.', slug: 'programming-paths', difficulty: 'Beginner' },
    { title: 'Understanding Motor Encoders', summary: 'Learn how encoders support distance and position feedback.', slug: 'encoders', difficulty: 'Intermediate' },
    { title: 'Introduction to Autonomous Programming', summary: 'A simple first look at autonomous planning and reliability.', slug: 'autonomous-intro', difficulty: 'Intermediate' },
    { title: 'CAD for FTC with Onshape', summary: 'How CAD supports prototyping and manufacturing decisions.', slug: 'cad-ftc', difficulty: 'Intermediate' },
  ];
  target.innerHTML = guides.map((guide) => `
    <article class="card guide-card">
      <div class="badge">${guide.difficulty}</div>
      <h3>${guide.title}</h3>
      <p class="muted">${guide.summary}</p>
      <a class="btn btn-secondary" href="guides.html#${guide.slug}">Read guide</a>
    </article>
  `).join('');
}

function renderResources() {
  const target = document.getElementById('resource-grid');
  if (!target) return;
  const resources = [
    { title: 'FIRST Tech Challenge', organization: 'FIRST', summary: 'Official FTC program overview and season information.', category: 'Official FIRST', url: 'https://www.firstinspires.org/programs/ftc' },
    { title: 'FTC Docs', organization: 'FIRST Tech Challenge', summary: 'Hardware, software, and control-system documentation from FTC Docs.', category: 'Technical docs', url: 'https://ftc-docs.firstinspires.org/' },
    { title: 'Road Runner', organization: 'Road Runner', summary: 'A community-developed pathing library for FTC teams.', category: 'Autonomous libraries', url: 'https://rr.brott.dev/docs/' },
  ];
  target.innerHTML = resources.map((resource) => `
    <article class="card resource-card">
      <div class="badge">${resource.category}</div>
      <h3>${resource.title}</h3>
      <p class="muted">${resource.summary}</p>
      <div class="inline-list">
        <a class="btn btn-primary" href="${resource.url}" target="_blank" rel="noopener noreferrer">Open</a>
        <button class="bookmark-btn ${isBookmarked('resource', resource.title) ? 'active' : ''}" data-type="resource" data-id="${resource.title}">★ Save</button>
      </div>
    </article>
  `).join('');
}

function renderBookmarks() {
  const target = document.getElementById('bookmark-list');
  if (!target) return;
  const bookmarks = getBookmarks();
  const items = Object.values(bookmarks);
  if (!items.length) {
    target.innerHTML = '<div class="card list-item">No bookmarks yet. Save a video or resource to see it here.</div>';
    return;
  }
  target.innerHTML = items.map((item) => `
    <div class="card list-item">
      <strong>${item.id}</strong>
      <p class="muted">Saved ${item.type} • ${new Date(item.savedAt).toLocaleDateString()}</p>
    </div>
  `).join('');
}

function renderKnowledgeMap() {
  const target = document.getElementById('knowledge-map');
  if (!target) return;
  const nodes = [
    { title: 'Getting started', summary: 'The big-picture view of FTC for new teams.' },
    { title: 'Control system', summary: 'How the robot controller, driver station, and sensors connect.' },
    { title: 'Autonomous', summary: 'Planning reliable actions before the match starts.' },
    { title: 'Drivetrains', summary: 'How motor gearing and wheel choice affect motion.' },
  ];
  target.innerHTML = nodes.map((node) => `
    <article class="card map-card">
      <h3>${node.title}</h3>
      <p class="muted">${node.summary}</p>
      <a class="btn btn-secondary" href="guides.html">Related guides</a>
    </article>
  `).join('');
}

function renderCalculators() {
  const sections = document.querySelectorAll('.calc-card');
  sections.forEach((card) => {
    const form = card.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      let result = '';
      const type = form.dataset.type;
      if (type === 'gear') {
        const driving = Number(data.driving);
        const driven = Number(data.driven);
        const ratio = driving / driven;
        result = `<strong>Ratio:</strong> ${ratio.toFixed(2)}:1 · <strong>Output RPM:</strong> ${(Number(data.motorRpm) / ratio).toFixed(1)}`;
      }
      if (type === 'drivetrain') {
        const freeSpeed = Number(data.freeSpeed);
        const reduction = Number(data.reduction);
        const diameter = Number(data.diameter);
        const wheelRpm = freeSpeed / reduction;
        const distancePerRev = Math.PI * diameter;
        const speedMps = (wheelRpm * distancePerRev) / 60 / 100;
        result = `<strong>Wheel RPM:</strong> ${wheelRpm.toFixed(1)} · <strong>Speed:</strong> ${speedMps.toFixed(2)} m/s`;
      }
      if (type === 'encoder') {
        const ticks = Number(data.ticks);
        const ratio = Number(data.ratio);
        const diameter = Number(data.diameter);
        const distance = Number(data.distance);
        const ticksPerWheelRev = ticks * ratio;
        const distancePerTick = (Math.PI * diameter) / ticksPerWheelRev;
        const requiredTicks = distance / distancePerTick;
        result = `<strong>Ticks per wheel revolution:</strong> ${ticksPerWheelRev.toFixed(0)} · <strong>Required ticks:</strong> ${requiredTicks.toFixed(0)}`;
      }
      card.querySelector('.result-box').innerHTML = result;
    });
  });
}

function wireEvents() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = getTheme() === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  const clearButton = document.getElementById('clear-bookmarks');
  if (clearButton) {
    clearButton.addEventListener('click', clearBookmarks);
  }

  document.querySelectorAll('[data-bookmark]').forEach((button) => {
    button.addEventListener('click', () => toggleBookmark(button.dataset.type, button.dataset.id));
  });

  const searchInput = document.getElementById('video-search');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.filters.query = event.target.value;
      renderVideoCards();
    });
  }
  const categorySelect = document.getElementById('video-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', (event) => {
      state.filters.category = event.target.value;
      renderVideoCards();
    });
  }
  const sortSelect = document.getElementById('video-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
      state.filters.sort = event.target.value;
      renderVideoCards();
    });
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.bookmark-btn');
    if (button) {
      event.preventDefault();
      toggleBookmark(button.dataset.type, button.dataset.id);
    }
  });
}

async function initApp() {
  applyTheme(getTheme());
  wireEvents();
  renderGuides();
  renderResources();
  renderKnowledgeMap();
  renderCalculators();
  renderBookmarks();
  try {
    const response = await fetch('data/videos.json');
    const payload = await response.json();
    state.videos = payload.videos || [];
    if (payload.lastUpdated) {
      state.videos = state.videos.map((video) => ({ ...video, lastUpdated: payload.lastUpdated, source: payload.source || 'local' }));
    }
    renderFeaturedVideo();
    renderVideoCards();
  } catch (error) {
    console.error('Unable to load video data', error);
    if (document.getElementById('video-grid')) {
      document.getElementById('video-grid').innerHTML = '<div class="card list-item">Video data could not be loaded. The fallback library will be restored soon.</div>';
    }
  }
}

document.addEventListener('DOMContentLoaded', initApp);
