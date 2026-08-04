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
  renderGuides();
  renderVideoCards();
  renderResources();
}

function clearBookmarks() {
  localStorage.removeItem(STORAGE_KEYS.bookmarks);
  renderBookmarks();
  renderGuides();
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
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.body.classList.toggle('dark', isDark);
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

const GUIDES_DATA = [
  { title: 'What Is FIRST Tech Challenge?', summary: 'A beginner-friendly overview of the program, structure, and goals.', slug: 'what-is-ftc', difficulty: 'Beginner' },
  { title: 'How the FTC Control System Works', summary: 'A practical explanation of the robot controller, driver station, and wiring.', slug: 'control-system', difficulty: 'Beginner' },
  { title: 'Choosing Blocks, OnBot Java, or Android Studio', summary: 'Compare common programming paths for new teams.', slug: 'programming-paths', difficulty: 'Beginner' },
  { title: 'Understanding Motor Encoders', summary: 'Learn how encoders support distance and position feedback.', slug: 'encoders', difficulty: 'Intermediate' },
  { title: 'Introduction to Autonomous Programming', summary: 'A simple first look at autonomous planning and reliability.', slug: 'autonomous-intro', difficulty: 'Intermediate' },
  { title: 'CAD for FTC with Onshape', summary: 'How CAD supports prototyping and manufacturing decisions.', slug: 'cad-ftc', difficulty: 'Intermediate' },
];

function renderGuides() {
  const target = document.getElementById('guide-grid');
  if (!target) return;
  target.innerHTML = GUIDES_DATA.map((guide) => `
    <article class="card guide-card" id="guide-card-${guide.slug}">
      <div class="badge">${guide.difficulty}</div>
      <h3>${guide.title}</h3>
      <p class="muted">${guide.summary}</p>
      <div class="inline-list">
        <button class="btn btn-primary" type="button" onclick="openGuideReader('${guide.slug}')">Read guide</button>
        <button class="bookmark-btn ${isBookmarked('guide', guide.slug) ? 'active' : ''}" data-type="guide" data-id="${guide.slug}">★ Save</button>
      </div>
      ${guide.content
        ? `<button type="button" class="focus-link" onclick="openGuideModal('${guide.slug}')">Open in focus mode</button>`
        : ''}
    </article>
  `).join('');
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text) {
  return escapeHtml(text)
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // links: [label](url) — internal /guides/{slug} link to this page, others external
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, label, url) => {
      const safeUrl = url.startsWith('/guides/')
        ? `guides.html#guide-${encodeURIComponent(url.replace(/^\/guides\//, ''))}`
        : url;
      const external = !url.startsWith('/') && !url.startsWith('#');
      return `<a href="${safeUrl}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    });
}

function parseMarkdown(markdown, guideSlug = '') {
  const lines = markdown.split('\n');
  const blocks = [];
  let i = 0;
  let headingIndex = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Skip blank lines (they separate blocks but render nothing)
    if (trimmed === '') {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', text: buf.join('\n') });
      continue;
    }

    // Heading
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      headingIndex++;
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2], id: `${guideSlug}-h${headingIndex}` });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // List
    if (/^(\*|-)\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = ordered ? /^\d+\.\s+(.*)$/.exec(t) : /^(?:\*|-)\s+(.*)$/.exec(t);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }

    // Paragraph
    const buf = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (t === ''
        || /^(#{1,3})\s+/.test(t)
        || /^```/.test(t)
        || /^-{3,}$/.test(t)
        || /^(\*|-)\s+/.test(t)
        || /^\d+\.\s+/.test(t)) break;
      buf.push(t);
      i++;
    }
    blocks.push({ type: 'p', text: buf.join(' ') });
    while (i < lines.length && lines[i].trim() === '') i++;
  }

  return blocks.map((block) => {
    switch (block.type) {
      case 'code': return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
      case 'heading': return `<h${block.level} id="${block.id}">${renderInline(block.text)}</h${block.level}>`;
      case 'hr': return '<hr>';
      case 'ul': return `<ul>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ol>`;
      case 'p': return `<p>${renderInline(block.text)}</p>`;
      default: return '';
    }
  }).join('\n');
}

function openGuideModal(slug) {
  const guide = GUIDES_DATA.find(g => g.slug === slug);
  if (!guide || !guide.content) return;

  // Create modal if it doesn't exist
  let modal = document.getElementById('guide-reader-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'guide-reader-modal';
    modal.className = 'guide-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'guide-modal-title');
    modal.innerHTML = `
      <div class="guide-modal-overlay"></div>
      <div class="guide-modal-content">
        <header class="guide-modal-header">
          <div>
            <span id="guide-modal-difficulty" class="badge"></span>
            <h2 id="guide-modal-title"></h2>
          </div>
          <button id="close-guide-modal" class="close-btn" type="button" aria-label="Close guide">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>
        <div id="guide-modal-body" class="guide-modal-body prose"></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('close-guide-modal').addEventListener('click', closeGuideModal);
    modal.querySelector('.guide-modal-overlay').addEventListener('click', closeGuideModal);
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeGuideModal();
    });
  }

  document.getElementById('guide-modal-title').textContent = guide.title;
  document.getElementById('guide-modal-difficulty').textContent = guide.difficulty;
  document.getElementById('guide-modal-body').innerHTML = parseMarkdown(guide.content, guide.slug);

  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('close-guide-modal').focus(), 50);
}

function closeGuideModal() {
  const modal = document.getElementById('guide-reader-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function renderGuideReader(guide) {
  const reader = document.getElementById('guide-reader');
  const body = document.getElementById('reader-body');
  if (!reader || !body || !guide || !guide.content) return null;

  const titleEl = document.getElementById('reader-title');
  const difficultyEl = document.getElementById('reader-difficulty');
  const toc = document.getElementById('reader-toc');
  const prevBtn = document.getElementById('reader-prev');
  const nextBtn = document.getElementById('reader-next');

  if (titleEl) titleEl.textContent = guide.title;
  if (difficultyEl) { difficultyEl.textContent = guide.difficulty; difficultyEl.className = 'badge'; }

  body.innerHTML = parseMarkdown(guide.content, guide.slug);

  if (toc) {
    const headings = Array.from(body.querySelectorAll('h2, h3')).filter((h) => h.textContent.trim());
    toc.innerHTML = headings.map((h) => {
      const level = Number(h.tagName[1]);
      return `<li style="margin-left:${(level - 2) * 12}px"><a href="#${h.id}">${escapeHtml(h.textContent.trim())}</a></li>`;
    }).join('');
    const wrap = toc.closest('.reader-toc-wrap');
    if (wrap) wrap.classList.toggle('empty', !headings.length);
  }

  const index = GUIDES_DATA.findIndex((g) => g.slug === guide.slug);
  const prev = GUIDES_DATA[index - 1];
  const next = GUIDES_DATA[index + 1];
  if (prevBtn) {
    prevBtn.disabled = !prev;
    prevBtn.dataset.slug = prev ? prev.slug : '';
    prevBtn.innerHTML = prev ? `<i class="fa-solid fa-arrow-left"></i><span>${escapeHtml(prev.title)}</span>` : '';
  }
  if (nextBtn) {
    nextBtn.disabled = !next;
    nextBtn.dataset.slug = next ? next.slug : '';
    nextBtn.innerHTML = next ? `<span>${escapeHtml(next.title)}</span><i class="fa-solid fa-arrow-right"></i>` : '';
  }

  return reader;
}

function openGuideReader(slug, { scroll = true } = {}) {
  const guide = GUIDES_DATA.find((g) => g.slug === slug);
  const reader = renderGuideReader(guide);
  if (!reader) return;

  closeGuideModal();
  reader.hidden = false;
  reader.classList.add('is-open');
  history.replaceState(null, '', `#guide-${slug}`);
  if (scroll) reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeGuideReader() {
  const reader = document.getElementById('guide-reader');
  if (!reader) return;
  reader.classList.remove('is-open');
  reader.hidden = true;
  history.replaceState(null, '', window.location.pathname);
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
  target.innerHTML = items.map((item) => {
    let label = item.id;
    let link = null;
    if (item.type === 'guide') {
      const guide = GUIDES_DATA.find((g) => g.slug === item.id);
      if (guide) label = guide.title;
      link = `guides.html#guide-${item.id}`;
    }
    if (item.type === 'video') {
      const video = state.videos.find((v) => v.id === item.id || v.youtubeId === item.id);
      if (video) label = video.title;
    }
    const linkHtml = link
      ? ` <a class="bookmark-open" href="${link}">Open →</a>`
      : '';
    return `
      <div class="card list-item">
        <strong>${escapeHtml(label)}</strong>
        <p class="muted">Saved ${item.type} • ${item.id} • ${new Date(item.savedAt).toLocaleDateString()}${linkHtml}</p>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Interactive FTC Robotics Knowledge Map Logic
// ==========================================================================

const KNOWLEDGE_MAP_DATA = {
  programming: {
    title: 'Programming',
    icon: 'fa-code',
    x: 50, y: 50,
    summary: 'Learn to write clean, modular Java or Blocks code for your robot.',
    description: 'Software is the brain of the robot. In FTC, teams write code to read sensor values, run motor algorithms, compute coordinate paths, and handle driver inputs. Choosing the right environment (Blocks, OnBot Java, or Android Studio) and structuring your code using OOP or sub-systems is key to a reliable robot.',
    connections: ['autonomous', 'sensors', 'vision', 'wiring'],
    videos: ['noN-R8Zt6GQ', 'HIBxntPlIus'],
    guides: ['programming-paths', 'encoders'],
    calculators: ['#encoder-distance'],
    docs: [{ title: 'FTC Docs Software Section', url: 'https://ftc-docs.firstinspires.org/en/latest/programming_resources/index.html' }]
  },
  drivetrains: {
    title: 'Drivetrains',
    icon: 'fa-circle-nodes',
    x: 80, y: 35,
    summary: 'Design and program drivetrains like Mecanum, Swerve, or Tank drive.',
    description: 'The drivetrain is the foundation of robot movement. FTC matches require quick positioning, defense navigation, and precise trajectories. Mecanum is popular for its omnidirectional movement, while swerve drive offers unmatched maneuverability, and tank drive provides high traction.',
    connections: ['mechanisms', 'autonomous', 'cad'],
    videos: ['7jyLT9H6CSI'],
    guides: ['control-system'],
    calculators: ['#drivetrain-speed', '#gear-ratio'],
    docs: [{ title: 'FTC Docs Drivetrain Guide', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_references/drivetrains/drivetrains.html' }]
  },
  mechanisms: {
    title: 'Mechanisms',
    icon: 'fa-wrench',
    x: 80, y: 55,
    summary: 'Build intakes, lifts, claws, and arm mechanisms to score points.',
    description: 'Custom mechanisms allow your robot to interact with game elements. From simple slide lifts and surgical tubing intakes to articulated claws, design mechanisms with proper gear ratios and torque limits to prevent motor burnouts.',
    connections: ['drivetrains', 'wiring', 'cad', 'manufacturing'],
    videos: ['7jyLT9H6CSI'],
    guides: ['encoders'],
    calculators: ['#gear-ratio'],
    docs: [{ title: 'FTC Robot Design Guidelines', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_references/robot_design/index.html' }]
  },
  sensors: {
    title: 'Sensors',
    icon: 'fa-microchip',
    x: 20, y: 40,
    summary: 'Use encoders, touch, distance, and IMU sensors for feedback.',
    description: 'Sensors allow your robot to perceive its environment. Distance sensors detect game elements, encoders track wheel rotation, and the Control Hub\'s built-in IMU reports heading. Combining these inputs allows for precise closed-loop control (like PID loops).',
    connections: ['programming', 'wiring', 'autonomous'],
    videos: ['HIBxntPlIus'],
    guides: ['encoders', 'control-system'],
    calculators: ['#encoder-distance'],
    docs: [{ title: 'FTC Control Hub Sensors Docs', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_references/sensors/sensors.html' }]
  },
  vision: {
    title: 'Vision',
    icon: 'fa-eye',
    x: 20, y: 20,
    summary: 'Implement OpenCV, AprilTags, and TensorFlow for object tracking.',
    description: 'Computer vision is critical for modern FTC autonomous tasks. Detecting AprilTags provides absolute position updates, while custom OpenCV pipelines allow your robot to locate and classify game pieces dynamically on the field.',
    connections: ['programming', 'sensors', 'autonomous'],
    videos: ['HIBxntPlIus'],
    guides: ['control-system'],
    calculators: [],
    docs: [{ title: 'AprilTag FTC Documentation', url: 'https://ftc-docs.firstinspires.org/en/latest/apriltags/index.html' }]
  },
  autonomous: {
    title: 'Autonomous',
    icon: 'fa-robot',
    x: 50, y: 25,
    summary: 'Program your robot to drive and score automatically in the first 30 seconds.',
    description: 'Autonomous period scoring can make or break a match. Using localization libraries (like Road Runner or PedroPathing), PID control, and state machines allows your robot to execute complex pre-programmed tasks reliably regardless of field friction.',
    connections: ['programming', 'drivetrains', 'sensors', 'vision'],
    videos: ['leWZTYAR42s', 'bdOogbHBDNY', 'QK5E3F7vqrE', 'HIBxntPlIus'],
    guides: ['autonomous-intro', 'encoders'],
    calculators: ['#encoder-distance'],
    docs: [{ title: 'Pedro Pathing Docs', url: 'https://pedropathing.com/' }, { title: 'Road Runner Docs', url: 'https://rr.brott.dev/docs/' }]
  },
  cad: {
    title: 'CAD',
    icon: 'fa-drafting-table',
    x: 80, y: 15,
    summary: 'Design and verify your robot virtually before building.',
    description: 'Computer-Aided Design (CAD) is essential for modern FTC teams. Using Onshape or Fusion 360, teams model their entire robot to verify clearances, check gear spacing, calculate weight distribution, and design custom parts for 3D printing.',
    connections: ['mechanisms', 'drivetrains', 'manufacturing'],
    videos: ['7jyLT9H6CSI'],
    guides: ['cad-ftc'],
    calculators: ['#gear-ratio'],
    docs: [{ title: 'Onshape Learning Center', url: 'https://learn.onshape.com/' }]
  },
  manufacturing: {
    title: 'Manufacturing',
    icon: 'fa-industry',
    x: 80, y: 75,
    summary: 'Fabricate parts using 3D printing, laser cutting, and CNC routing.',
    description: 'Manufacturing turns virtual CAD files into physical parts. Understanding 3D printing parameters (infill, walls), tolerances for laser-cut acrylic or wood, and basic tool operations allows you to manufacture robust custom parts.',
    connections: ['cad', 'mechanisms', 'competition-prep'],
    videos: ['7jyLT9H6CSI'],
    guides: ['cad-ftc'],
    calculators: [],
    docs: [{ title: 'FTC Manufacturing Guidelines', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_references/manufacturing/index.html' }]
  },
  wiring: {
    title: 'Wiring',
    icon: 'fa-bolt',
    x: 20, y: 65,
    summary: 'Wire the Control Hub, Expansion Hub, battery, and motors securely.',
    description: 'Electrical failure is a major cause of robot disconnections during matches. Solid wiring involves anchoring cables, labeling connections, separating power lines from high-current motor wires, and securing battery connections.',
    connections: ['programming', 'sensors', 'mechanisms'],
    videos: ['HIBxntPlIus'],
    guides: ['control-system'],
    calculators: [],
    docs: [{ title: 'FTC Docs Wiring Guide', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_references/control_hub/wiring.html' }]
  },
  'competition-prep': {
    title: 'Competition Preparation',
    icon: 'fa-trophy',
    x: 50, y: 75,
    summary: 'Prepare your engineering portfolio, practice driving, and build a strategy.',
    description: 'Winning in FTC is about more than just a great robot. Teams must present an engineering portfolio, execute a solid game strategy with alliance partners, practice drive controls for hours, and perform systematic pre-match checklists.',
    connections: ['programming', 'wiring', 'manufacturing'],
    videos: ['h60NvS6MYV8', 'leWZTYAR42s'],
    guides: ['what-is-ftc'],
    calculators: [],
    docs: [{ title: 'FIRST FTC Official Resource Library', url: 'https://www.firstinspires.org/resource-library/ftc/game-and-season-info' }]
  }
};

let lastActiveFocusedElement = null;

function renderKnowledgeMap() {
  const nodesContainer = document.getElementById('knowledge-map-nodes');
  const svgContainer = document.getElementById('map-connections-svg');
  if (!nodesContainer || !svgContainer) return;

  // 1. Render Nodes
  nodesContainer.innerHTML = Object.entries(KNOWLEDGE_MAP_DATA).map(([id, node]) => `
    <button type="button" class="node-button" id="node-${id}" data-id="${id}" style="left: ${node.x}%; top: ${node.y}%;" aria-haspopup="dialog" aria-expanded="false">
      <i class="fa-solid ${node.icon}"></i>
      <span>${node.title}</span>
    </button>
  `).join('');

  // 2. Render Connection Lines
  const drawnConnections = new Set();
  let svgContent = '';

  Object.entries(KNOWLEDGE_MAP_DATA).forEach(([fromId, node]) => {
    node.connections.forEach(toId => {
      const connKey = [fromId, toId].sort().join('-');
      if (!drawnConnections.has(connKey) && KNOWLEDGE_MAP_DATA[toId]) {
        drawnConnections.add(connKey);
        const targetNode = KNOWLEDGE_MAP_DATA[toId];
        svgContent += `
          <line x1="${node.x}%" y1="${node.y}%" x2="${targetNode.x}%" y2="${targetNode.y}%" 
                class="connection-line" data-from="${fromId}" data-to="${toId}" id="line-${connKey}">
          </line>
        `;
      }
    });
  });
  svgContainer.innerHTML = svgContent;

  // 3. Set up mobile view list
  renderMobileAccordion();

  // 4. Initialize interactions
  setupMapInteractions();
}

function renderMobileAccordion() {
  const target = document.getElementById('mobile-topic-accordion');
  if (!target) return;

  target.innerHTML = Object.entries(KNOWLEDGE_MAP_DATA).map(([id, node]) => `
    <div class="accordion-item" id="accordion-${id}" data-search-text="${node.title.toLowerCase()} ${node.summary.toLowerCase()} ${node.description.toLowerCase()}">
      <button type="button" class="accordion-header" aria-expanded="false" aria-controls="panel-${id}" data-id="${id}">
        <span class="accordion-header-title">
          <i class="fa-solid ${node.icon}"></i>
          <span>${node.title}</span>
        </span>
        <i class="fa-solid fa-chevron-down chevron"></i>
      </button>
      <div id="panel-${id}" class="accordion-panel" role="region" aria-labelledby="accordion-${id}">
        <div class="accordion-content">
          <p>${node.description}</p>
          ${renderTopicLinks(node)}
        </div>
      </div>
    </div>
  `).join('');
}

function renderTopicLinks(node) {
  let content = '';

  // Related Guides
  if (node.guides && node.guides.length > 0) {
    content += `<h3>Related Guides</h3>`;
    node.guides.forEach(slug => {
      const guide = GUIDES_DATA.find(g => g.slug === slug);
      if (guide) {
        content += `
          <button type="button" class="drawer-link-card" data-guide="${slug}" onclick="openGuideReader('${slug}')">
            <i class="fa-solid fa-book-open"></i>
            <div>
              <strong>${guide.title}</strong>
              <p style="margin:0;font-size:0.8rem;color:var(--muted);">${guide.summary}</p>
            </div>
          </button>
        `;
      }
    });
  }

  // Related Calculators
  if (node.calculators && node.calculators.length > 0) {
    content += `<h3>Calculators</h3>`;
    node.calculators.forEach(hash => {
      let title = '';
      if (hash === '#encoder-distance') title = 'Encoder Distance Calculator';
      if (hash === '#gear-ratio') title = 'Gear Ratio Calculator';
      if (hash === '#drivetrain-speed') title = 'Drivetrain Speed Calculator';
      if (title) {
        content += `
          <a class="drawer-link-card" href="calculators.html${hash}">
            <i class="fa-solid fa-calculator"></i>
            <div><strong>${title}</strong></div>
          </a>
        `;
      }
    });
  }

  // Related Videos
  if (node.videos && node.videos.length > 0) {
    content += `<h3>RoboCodex Videos</h3>`;
    content += `<div class="drawer-video-list">`;
    node.videos.forEach(videoId => {
      const video = state.videos.find(v => v.youtubeId === videoId || v.id === videoId);
      if (video) {
        content += `
          <a class="drawer-video-card" href="https://www.youtube.com/watch?v=${video.youtubeId}" target="_blank" rel="noopener noreferrer">
            <img src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg" alt="${video.title}" loading="lazy">
            <div class="drawer-video-info">
              <h4>${video.title}</h4>
              <span>${video.category}</span>
            </div>
          </a>
        `;
      } else {
        // Fallback placeholder if videos not fully loaded
        content += `
          <a class="drawer-link-card" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-youtube" style="color:#ff0000;"></i>
            <div><strong>Watch Related Video on YouTube</strong></div>
          </a>
        `;
      }
    });
    content += `</div>`;
  }

  // Official Docs
  if (node.docs && node.docs.length > 0) {
    content += `<h3>Official Documentation</h3>`;
    node.docs.forEach(doc => {
      content += `
        <a class="drawer-link-card" href="${doc.url}" target="_blank" rel="noopener noreferrer">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <div><strong>${doc.title}</strong></div>
        </a>
      `;
    });
  }

  return content;
}

function setupMapInteractions() {
  const nodes = document.querySelectorAll('.node-button');
  const lines = document.querySelectorAll('.connection-line');
  const drawer = document.getElementById('detail-drawer');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const drawerOverlay = drawer ? drawer.querySelector('.drawer-overlay') : null;
  const mobileSearch = document.getElementById('mobile-search-input');

  // Node Hover / Focus Highlights
  nodes.forEach(node => {
    const id = node.dataset.id;
    const itemData = KNOWLEDGE_MAP_DATA[id];
    if (!itemData) return;

    const highlightHandler = () => {
      // 1. Dim all nodes except hovered and its connections
      const connectedSet = new Set([id, ...itemData.connections]);
      nodes.forEach(n => {
        const nid = n.dataset.id;
        if (!connectedSet.has(nid)) {
          n.classList.add('dimmed');
        } else if (nid !== id) {
          n.classList.add('highlight-connected');
        }
      });

      // 2. Highlight matching connection lines
      lines.forEach(line => {
        const from = line.dataset.from;
        const to = line.dataset.to;
        if (from === id || to === id) {
          line.classList.add('highlighted');
        }
      });
    };

    const clearHighlightHandler = () => {
      nodes.forEach(n => {
        n.classList.remove('dimmed', 'highlight-connected');
      });
      lines.forEach(line => {
        line.classList.remove('highlighted');
      });
    };

    node.addEventListener('mouseenter', highlightHandler);
    node.addEventListener('mouseleave', clearHighlightHandler);
    node.addEventListener('focus', highlightHandler);
    node.addEventListener('blur', clearHighlightHandler);

    // Node Click -> Open Drawer
    node.addEventListener('click', () => {
      openDetailDrawer(id);
    });
  });

  // Drawer Close Actions
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeDetailDrawer);
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDetailDrawer);
  }

  // Keyboard trapping for Drawer
  if (drawer) {
    drawer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDetailDrawer();
      }
      if (event.key === 'Tab') {
        const focusables = drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    });
  }

  // Mobile Accordion Toggles
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.parentElement;
      const panel = parent.querySelector('.accordion-panel');
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      // Toggle current
      header.setAttribute('aria-expanded', !isExpanded);
      parent.classList.toggle('active', !isExpanded);
      if (!isExpanded) {
        panel.style.maxHeight = panel.scrollHeight + "px";
      } else {
        panel.style.maxHeight = null;
      }
    });
  });

  // Mobile Search Filter
  if (mobileSearch) {
    mobileSearch.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase();
      const accordionItems = document.querySelectorAll('.accordion-item');

      accordionItems.forEach(item => {
        const text = item.dataset.searchText;
        if (text.includes(query)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
}

function openDetailDrawer(id) {
  const node = KNOWLEDGE_MAP_DATA[id];
  if (!node) return;

  lastActiveFocusedElement = document.activeElement;

  const drawer = document.getElementById('detail-drawer');
  const titleTarget = document.getElementById('drawer-title');
  const iconBadge = document.getElementById('drawer-icon-badge');
  const bodyTarget = document.getElementById('drawer-body');
  const nodeButton = document.getElementById(`node-${id}`);

  if (!drawer || !bodyTarget) return;

  // Set header info
  if (titleTarget) titleTarget.textContent = node.title;
  if (iconBadge) iconBadge.innerHTML = `<i class="fa-solid ${node.icon}"></i>`;

  // Render Body Details
  bodyTarget.innerHTML = `
    <p style="font-size:1.05rem;font-weight:500;margin-top:0;">${node.summary}</p>
    <p>${node.description}</p>
    ${renderTopicLinks(node)}
  `;

  // Show Drawer
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('active');
  if (nodeButton) nodeButton.setAttribute('aria-expanded', 'true');

  // Focus on close button inside the drawer
  const closeBtn = document.getElementById('close-drawer-btn');
  if (closeBtn) {
    setTimeout(() => closeBtn.focus(), 50);
  }
}

function closeDetailDrawer() {
  const drawer = document.getElementById('detail-drawer');
  if (!drawer) return;

  drawer.setAttribute('aria-hidden', 'true');
  drawer.classList.remove('active');

  // Set all node expansion states to false
  document.querySelectorAll('.node-button').forEach(n => {
    n.setAttribute('aria-expanded', 'false');
  });

  // Restore focus
  if (lastActiveFocusedElement) {
    lastActiveFocusedElement.focus();
  }
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

  const readerBack = document.getElementById('reader-back');
  if (readerBack) {
    readerBack.addEventListener('click', () => {
      closeGuideReader();
      const grid = document.getElementById('guide-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const readerFocus = document.getElementById('reader-focus');
  if (readerFocus) {
    readerFocus.addEventListener('click', () => {
      const m = /#guide-([\w-]+)/.exec(window.location.hash);
      if (m) openGuideModal(m[1]);
    });
  }

  document.querySelectorAll('#reader-prev, #reader-next').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled || !btn.dataset.slug) return;
      openGuideReader(btn.dataset.slug);
    });
  });

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

  // Load guide content from guides.json and merge with GUIDES_DATA
  try {
    const guideResponse = await fetch('data/guides.json');
    if (guideResponse.ok) {
      const guidePayload = await guideResponse.json();
      if (Array.isArray(guidePayload)) {
        guidePayload.forEach(remote => {
          const local = GUIDES_DATA.find(g => g.slug === remote.slug);
          if (local) {
            // Merge any new fields from JSON into the local entry
            Object.assign(local, remote);
          } else {
            // Brand-new guide from JSON — add it
            GUIDES_DATA.push(remote);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not load guides.json — using built-in guide stubs.', err);
  }

  renderGuides();
  renderResources();
  renderKnowledgeMap();
  renderCalculators();
  renderBookmarks();

  // Deep-link: auto-open a guide when the hash is #guide-{slug}
  const hashMatch = /#guide-([\w-]+)/.exec(window.location.hash);
  if (hashMatch) {
    const target = GUIDES_DATA.find((g) => g.slug === hashMatch[1]);
    if (target && target.content) openGuideReader(target.slug, { scroll: false });
  }

  try {
    const response = await fetch('data/videos.json');
    const payload = await response.json();
    state.videos = payload.videos || [];
    if (payload.lastUpdated) {
      state.videos = state.videos.map((video) => ({ ...video, lastUpdated: payload.lastUpdated, source: payload.source || 'local' }));
    }
    renderFeaturedVideo();
    renderVideoCards();
    // Re-render knowledge map now that videos are loaded
    renderKnowledgeMap();
  } catch (error) {
    console.error('Unable to load video data', error);
    if (document.getElementById('video-grid')) {
      document.getElementById('video-grid').innerHTML = '<div class="card list-item">Video data could not be loaded. The fallback library will be restored soon.</div>';
    }
  }
}

document.addEventListener('DOMContentLoaded', initApp);
