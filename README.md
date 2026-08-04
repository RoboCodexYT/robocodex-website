# RoboCodex Website

Welcome to the RoboCodex website, a comprehensive resource for students transitioning from FIRST Lego League (FLL) to FIRST Tech Challenge (FTC). This site provides content, community building, and information about an upcoming FTC course, all hosted on GitHub Pages.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Features](#features)
3.  [File Structure](#file-structure)
4.  [Setup Instructions](#setup-instructions)
    *   [Local Development](#local-development)
    *   [GitHub Pages Deployment](#github-pages-deployment)
    *   [Formspree Integration](#formspree-integration)
    *   [Google Analytics Integration](#google-analytics-integration)
    *   [Customizing Videos](#customizing-videos)
    *   [Customizing Colors and Fonts](#customizing-colors-and-fonts)
5.  [Image Optimization](#image-optimization)
6.  [Accessibility & SEO](#accessibility--seo)
7.  [Credits](#credits)

## Project Overview

*   **Name:** RoboCodex
*   **Purpose:** FIRST Tech Challenge resource for students transitioning from FLL.
*   **Platform:** GitHub Pages (free hosting).
*   **Tech Stack:** Vanilla HTML5, CSS3, JavaScript (no frameworks).
*   **Creator:** Jose, 15-year-old FTC Team Captain and INSPIRE Award national winner.

## Features

*   **Responsive Design:** Optimized for mobile, tablet, and desktop.
*   **Navigation Bar:** Fixed/sticky navigation with logo, menu items, and mobile hamburger menu.
*   **Home Page (`index.html`):** Compelling hero section, value propositions, featured videos, and course teaser.
*   **Content Library (`content.html`):** Filterable video library organized by topic, dynamically loaded from `videos.json`.
*   **About Page (`about.html`):** Jose's story, achievements, and future plans.
*   **Course Page (`course.html`):** Teaser for the upcoming FTC transition course, including curriculum, benefits, testimonials (placeholder), and an FAQ section with accordion functionality.
*   **Contact Page (`contact.html`):** Contact form with client-side validation and integration with Formspree for submissions.
*   **Smooth Scrolling:** Enhanced user experience for internal page navigation.
*   **Back-to-Top Button:** Improves navigation on long pages.
*   **Vanilla JavaScript:** No external libraries or frameworks for improved performance and maintainability.

## File Structure

```
robocodex.github.io/
├── index.html          (Home page)
├── content.html        (Video library)
├── about.html          (About page)
├── course.html         (Course coming soon)
├── contact.html        (Contact form)
├── css/
│   └── style.css       (All styling)
├── js/
│   └── script.js       (All JavaScript)
├── data/
│   └── videos.json     (Video data)
├── images/             (Folder for images, e.g., hero-bg.jpg, jose-photo.jpg)
└── README.md           (Project documentation)
```

## Setup Instructions

### Local Development

### Update the video library

The site reads video data from [data/videos.json](data/videos.json).

To refresh it from YouTube, run:

```bash
node scripts/update-videos.mjs
```

You can also set one of these environment variables before running it:

- `YOUTUBE_CHANNEL_ID`
- `YOUTUBE_USERNAME`
- `YOUTUBE_HANDLE`

If none are set, the script uses the RoboCodex YouTube feed by default.

To view and develop the website locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/robocodex.github.io.git
    cd robocodex.github.io
    ```
2.  **Open `index.html`:** Simply open the `index.html` file in your web browser. You can drag and drop it into the browser window or right-click and choose "Open with...".
    *   Some JavaScript functionalities (like fetching `videos.json`) might have security restrictions when run directly from a `file://` URL. For full functionality, it's recommended to serve the files using a local web server (e.g., `python -m http.server` or a Live Server extension in VS Code).

### GitHub Pages Deployment

This website is designed for easy deployment to GitHub Pages.

1.  **Create a GitHub Repository:**
    *   Go to GitHub and create a new public repository.
    *   **Important:** Name your repository `your-username.github.io` (replace `your-username` with your GitHub username) for a personal/organization site, or `repo-name` for a project site (e.g., `robocodex.github.io`). For this project, it's already structured as `robocodex.github.io`, so if Jose's GitHub username is `robocodex`, he can use that.
2.  **Push Your Code:**
    ```bash
    git init
    git add .
    git commit -m "Initial RoboCodex website commit"
    git branch -M main
    git remote add origin https://github.com/your-username/robocodex.github.io.git
    git push -u origin main
    ```
3.  **Enable GitHub Pages:**
    *   On GitHub, navigate to your repository.
    *   Go to **Settings > Pages**.
    *   Under "Build and deployment", set "Source" to `Deploy from a branch`.
    *   Select `main` as the branch and `/ (root)` as the folder, then click "Save".
    *   Your site will be published at `https://your-username.github.io/` (or `https://your-username.github.io/repo-name/`). It might take a few minutes for the site to go live.

### Formspree Integration

The contact form uses Formspree.io to handle submissions without server-side code.

1.  **Sign up for Formspree:** Go to [Formspree.io](https://formspree.io/) and create a free account.
2.  **Create a New Form:** In your Formspree dashboard, create a new form. This will give you a unique endpoint URL (e.g., `https://formspree.io/f/xxxxxxxx`).
3.  **Update `contact.html`:** Open `contact.html` and replace `https://formspree.io/f/YOUR_FORMSPREE_ID` in the `<form>` tag's `action` attribute with your actual Formspree endpoint URL.
    ```html
    <form action="https://formspree.io/f/YOUR_FORMSPREE_ID" method="POST" id="contactForm" class="contact-form">
    ```
4.  **Test the Form:** Submit a test message from your live website. You should receive an email from Formspree.

### Google Analytics Integration

To track website traffic:

1.  **Set up Google Analytics:** If you don't have one, create a Google Analytics 4 (GA4) property in your Google Analytics account. You will get a "Measurement ID" (e.g., `G-XXXXXXXXXX`).
2.  **Add Tracking Code:** In each HTML file (`index.html`, `content.html`, `about.html`, `course.html`, `contact.html`), add the following script tags just before the closing `</head>` tag:
    ```html
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
    ```
    Replace `G-XXXXXXXXXX` with your actual Google Analytics Measurement ID.

### Customizing Videos (`data/videos.json`)

To update the video content on the `content.html` page:

1.  **Edit `data/videos.json`:** Open the `data/videos.json` file.
2.  **Modify/Add Video Objects:**
    *   `id`: A unique identifier for the video (e.g., "1", "2").
    *   `title`: The title of the video.
    *   `youtubeId`: The unique ID of the YouTube video (e.g., for `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, the `youtubeId` is `dQw4w9WgXcQ`).
    *   `date`: The upload date in `YYYY-MM-DD` format.
    *   `category`: The category of the video (e.g., "FLL to FTC", "FTC Basics", "Strategy"). These categories correspond to the filter buttons.
    *   `description`: A brief description of the video.
3.  **Ensure Consistency:** Make sure new categories added to `videos.json` also have corresponding filter buttons in `content.html` if you want them to be filterable.

### Customizing Colors and Fonts

All main colors and fonts are defined as CSS variables in `css/style.css`.

1.  **Open `css/style.css`:**
2.  **Modify `:root` variables:** Adjust the values for:
    *   `--primary-color`
    *   `--secondary-color`
    *   `--accent-color`
    *   `--dark-text`
    *   `--light-background`
    *   `--footer-background`
    *   `--heading-font`
    *   `--body-font`
    *   And other spacing/size variables as needed.
3.  **Google Fonts:** If you want to use different Google Fonts, update the `@import` rule at the top of `style.css` and the `--heading-font`/`--body-font` variables.

## Image Optimization

For best performance, always optimize your images:

*   **Compression:** Use tools like [TinyPNG](https://tinypng.com/) or [ImageOptim](https://imageoptim.com/mac) to compress `JPG` and `PNG` images without significant loss of quality.
*   **WebP Format:** Convert images to WebP format where possible for smaller file sizes. You can use online converters or command-line tools.
*   **Lazy Loading:** Images currently use `loading="lazy"` attribute, which helps defer off-screen images.
*   **Placeholders:** Replace placeholder images in `images/` folder (`hero-bg.jpg`, `jose-photo.jpg`, `robot.jpg`) with actual optimized images.

## Accessibility & SEO

The website is built with accessibility and SEO best practices in mind:

*   **Semantic HTML:** Uses appropriate HTML5 elements (`<header>`, `<nav>`, `<section>`, `<footer>`, etc.).
*   **Alt Text:** All images have `alt` attributes. Remember to provide descriptive `alt` text for your actual images.
*   **Heading Hierarchy:** Proper `h1` through `h6` structure is maintained.
*   **Color Contrast:** The color scheme is designed for good contrast, but always verify with a tool if you change colors significantly.
*   **Keyboard Navigation:** Interactive elements are accessible via keyboard.
*   **Meta Tags:** Rich meta tags for SEO and social sharing (Open Graph, Twitter Cards) are included. Remember to update the `og:image` and `twitter:image` with your actual social share image.

## Credits

*   **Creator:** Jose
*   **Platform:** RoboCodex
*   **Icons:** [Font Awesome](https://fontawesome.com/)
*   **Form Handling:** [Formspree.io](https://formspree.io/)
*   **Hosting:** [GitHub Pages](https://pages.github.com/)

---
Created with ❤️ by Jose for the FTC community.
