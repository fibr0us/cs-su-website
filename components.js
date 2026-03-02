/* ═══════════════════════════════════════════════════════════════
   components.js — Light-DOM Web Components for SU CS Website
   ─────────────────────────────────────────────────────────────
   Provides two custom elements:
     <su-nav>    — Canonical site navigation bar
     <su-footer> — Canonical site footer

   Both render into the light DOM (no shadow DOM) so that
   theme.css styles apply directly — no style encapsulation to
   pierce.

   Architecture:
   1. Helpers determine the current page and resolve links.
   2. ACTIVE_MAP decides which nav link gets the `su-active` class.
   3. NAV_LINKS defines the 7-link canonical order.
   4. <su-nav> renders markup + attaches scroll, burger, and
      (homepage-only) IntersectionObserver / smooth-scroll behaviour.
   5. <su-footer> renders the four-column footer with dynamic
      quick-link hrefs (bare #hash on homepage, index.html#hash
      on sub-pages).
   ═══════════════════════════════════════════════════════════════ */

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Determine the current page filename from the URL.
 * Handles both dev-server paths and file:// URLs.
 * @returns {string} e.g. "programmes.html" or "index.html"
 */
function currentPage() {
  const path = location.pathname;
  return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}

/**
 * True when the user is on the homepage (index.html or bare "/").
 * Used to decide whether to run the IntersectionObserver and
 * smooth-anchor behaviours, and whether fragment hrefs need a
 * page prefix.
 * @returns {boolean}
 */
function isHome() {
  const p = currentPage();
  return p === 'index.html';
}

/**
 * Page → active nav label mapping.
 * Sub-programme pages (honours, masters, phd, undergraduate) all
 * highlight "Programmes".  Pages not listed get no active link.
 * @type {Object<string, string>}
 */
const ACTIVE_MAP = {
  'index.html':        'About',
  'programmes.html':   'Programmes',
  'honours.html':      'Programmes',
  'courses.html':      'Courses',
  'masters.html':      'Programmes',
  'phd.html':          'Programmes',
  'undergraduate.html':'Programmes',
  'resources.html':    'Resources',
  'news.html':         'News',
};

/**
 * The 7 nav links in canonical order.
 * The first three use fragment hrefs (#about, #research, #staff)
 * which point to sections on index.html.  The rest are sub-pages.
 * @type {Array<{label: string, href: string}>}
 */
const NAV_LINKS = [
  { label: 'About',      href: '#about' },
  { label: 'Research',    href: '#research' },
  { label: 'Staff',       href: '#staff' },
  { label: 'Programmes',  href: 'programmes.html' },
  { label: 'Courses',     href: 'courses.html' },
  { label: 'Resources',   href: 'resources.html' },
  { label: 'News',        href: 'news.html' },
];

/**
 * Resolve a link href depending on whether we are on the homepage.
 * Fragment-only links (e.g. "#about") need an "index.html" prefix
 * when the user is on a sub-page, otherwise the browser treats
 * them as anchors on the current page.
 * @param {string} href — raw href from NAV_LINKS
 * @returns {string} resolved href
 */
function resolveHref(href) {
  // Fragment‑only links need "index.html" prefix when NOT on the homepage
  if (href.startsWith('#') && !isHome()) {
    return 'index.html' + href;
  }
  return href;
}


/* ═══════════════════════════════════════════════════════════════
   <su-nav> — Site Navigation Custom Element
   ─────────────────────────────────────────────────────────────
   Renders: fixed-position nav bar + mobile drawer.
   Attaches: scroll class toggle, hamburger menu, and on the
   homepage only: IntersectionObserver (active link tracking)
   and smooth anchor scrolling.
   ═══════════════════════════════════════════════════════════════ */
class SuNav extends HTMLElement {
  /**
   * Called automatically when <su-nav> is inserted into the DOM.
   * Accepts an optional `data-page` attribute to override auto-
   * detection (useful for testing).
   */
  connectedCallback() {
    const page      = this.getAttribute('data-page') || currentPage();
    const active    = ACTIVE_MAP[page] || '';

    /* ── Build desktop link list ─────────────────────────────── */
    const desktopLis = NAV_LINKS.map(({ label, href }) => {
      const resolved  = resolveHref(href);
      const isActive  = label === active;
      const cls       = isActive ? ' class="su-active"' : '';
      const aria      = isActive ? ' aria-current="page"' : '';
      return `<li><a href="${resolved}"${cls}${aria}>${label}</a></li>`;
    }).join('\n          ');

    /* ── Build mobile links ──────────────────────────────────── */
    const mobileAs = NAV_LINKS.map(({ label, href }) => {
      const resolved  = resolveHref(href);
      const isActive  = label === active;
      const cls       = isActive ? ' class="su-active"' : '';
      return `<a href="${resolved}"${cls}>${label}</a>`;
    }).join('\n    ');

    /* ── Inject markup ───────────────────────────────────────── */
    this.innerHTML = `
  <nav class="su-nav" id="suNav" role="navigation" aria-label="Main navigation">
    <div class="su-nav__inner">
      <a href="index.html" class="su-nav__logo" aria-label="CS Stellenbosch University Home">
        <img src="su-logo.svg" class="su-nav__logo-icon" alt="Stellenbosch University crest" aria-hidden="true" />
        <div class="su-nav__logo-text">
          <span class="su-nav__logo-cs">CS</span>
          <span class="su-nav__logo-sub">Stellenbosch University</span>
        </div>
      </a>
      <ul class="su-nav__links" role="list">
          ${desktopLis}
      </ul>
      <button class="su-nav__burger" id="suBurger" aria-label="Toggle mobile menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <nav class="su-nav__mobile" id="suMobileNav" aria-label="Mobile navigation">
    ${mobileAs}
  </nav>`;

    /* ── Attach behaviour ────────────────────────────────────── */
    this._initScroll();
    this._initBurger();

    if (isHome()) {
      this._initSectionObserver();
      this._initSmoothAnchors();
    }
  }

  /**
   * Add `.su-nav--scrolled` class when the page is scrolled past
   * 40px.  This triggers the glassmorphism background in theme.css.
   * @private
   */
  _initScroll() {
    const nav = this.querySelector('#suNav');
    if (!nav) return;
    const handler = () => nav.classList.toggle('su-nav--scrolled', window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    handler();                       // fire once on load
  }

  /**
   * Wire up the hamburger button and mobile nav drawer.
   * - Toggle open/close on click
   * - Close when a mobile link is clicked
   * - Close when clicking outside the nav
   * @private
   */
  _initBurger() {
    const burger = this.querySelector('#suBurger');
    const mobile = this.querySelector('#suMobileNav');
    if (!burger || !mobile) return;

    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('su-open');
      mobile.classList.toggle('su-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('su-open');
        mobile.classList.remove('su-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    const nav = this.querySelector('#suNav');
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !mobile.contains(e.target) && !burger.contains(e.target)) {
        mobile.classList.remove('su-open');
        burger.classList.remove('su-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /**
   * Homepage only: observe the #about, #research, #staff sections
   * and toggle `su-active` on the corresponding nav link as the
   * user scrolls.  Only watches sections that have a matching nav
   * link (excludes #publications, #programmes which have no link).
   * @private
   */
  _initSectionObserver() {
    const sectionIds = ['about', 'research', 'staff'];
    const navLinks   = this.querySelectorAll('.su-nav__links a, .su-nav__mobile a');
    if (!navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            const href     = link.getAttribute('href');
            const isActive = href === `#${id}`;
            link.classList.toggle('su-active', isActive);
            if (isActive) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { threshold: 0.35 });

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /**
   * Homepage only: intercept clicks on `#hash` links and smooth-
   * scroll to the target with an 80px offset (nav height).
   * @private
   */
  _initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const offset = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      });
    });
  }
}

customElements.define('su-nav', SuNav);


/* ═══════════════════════════════════════════════════════════════
   <su-footer> — Site Footer Custom Element
   ─────────────────────────────────────────────────────────────
   Renders the canonical four-column footer (Brand, Programmes,
   Quick Links, Contact).  Quick-link hrefs are resolved via
   resolveHref() so they work from any page.
   ═══════════════════════════════════════════════════════════════ */
class SuFooter extends HTMLElement {
  /** Called when <su-footer> is inserted into the DOM. */
  connectedCallback() {
    /* Quick-links use bare #hash on homepage, index.html#hash elsewhere */
    const qAbout    = resolveHref('#about');
    const qResearch = resolveHref('#research');
    const qStaff    = resolveHref('#staff');

    this.innerHTML = `
  <footer role="contentinfo">
    <div class="container">
      <div class="footer-grid">

        <!-- Brand -->
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="su-logo.svg" class="footer-logo__img" alt="Stellenbosch University crest" aria-hidden="true" />
            <div class="nav-logo-text">
              <span class="nav-logo-cs" style="font-size:1.1rem;">Computer Science</span>
              <span class="nav-logo-sub">Stellenbosch University</span>
            </div>
          </div>
          <p class="footer-desc">
            Advancing the frontiers of computing through rigorous research, excellent teaching, and meaningful collaboration since 1972.
            <span class="footer-tagline">Forward together &middot; Sonke siya phambili</span>
          </p>
          <div class="footer-socials">
            <a href="https://www.linkedin.com/school/stellenbosch-university/" class="footer-social" aria-label="LinkedIn" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a href="https://x.com/StellenboschUni" class="footer-social" aria-label="Twitter / X" target="_blank" rel="noopener">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>

        <!-- Programmes -->
        <div class="footer-col">
          <h4>Programmes</h4>
          <ul class="footer-links" role="list">
            <li><a href="undergraduate.html">BSc Computer Science</a></li>
            <li><a href="undergraduate.html">BDatSci Data Science</a></li>
            <li><a href="honours.html">BCmp Honours</a></li>
            <li><a href="masters.html">Master&rsquo;s Degree</a></li>
            <li><a href="phd.html">PhD</a></li>
          </ul>
        </div>

        <!-- Quick Links -->
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul class="footer-links" role="list">
            <li><a href="${qAbout}">About Us</a></li>
            <li><a href="${qResearch}">Research</a></li>
            <li><a href="${qStaff}">Staff</a></li>
            <li><a href="courses.html">Courses</a></li>
            <li><a href="resources.html">Resources</a></li>
          </ul>
        </div>

        <!-- Contact -->
        <div class="footer-col">
          <h4>Contact</h4>
          <div class="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Dept of Mathematical Sciences,<br/>Stellenbosch University,<br/>Matieland 7602</span>
          </div>
          <div class="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>+27 21 808 4232</span>
          </div>
          <div class="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <a href="mailto:secretary@cs.sun.ac.za">secretary@cs.sun.ac.za</a>
          </div>
          <div class="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <a href="mailto:postgrad@cs.sun.ac.za">postgrad@cs.sun.ac.za</a>
          </div>
          <div class="footer-contact-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <a href="mailto:undergrad@cs.sun.ac.za">undergrad@cs.sun.ac.za</a>
          </div>
        </div>

      </div>

      <div class="footer-bottom">
        <p>&copy; 2026 30668301@sun.ac.za &mdash; Div &amp; Conquer Hackathon 1st Place</p>
        <div class="footer-bottom-right">
          <span>Part of the</span>
          <a href="https://www.sun.ac.za/english/faculty/science/Mathematics-and-Statistical-Sciences" target="_blank" rel="noopener">Department of Mathematical Sciences</a>
        </div>
      </div>
    </div>
  </footer>`;
  }
}

customElements.define('su-footer', SuFooter);
