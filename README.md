# Stellenbosch University — Computer Science Division Website

**Div & Conquer Hackathon 2026** submission by `30668301@sun.ac.za`

A ground-up redesign of the [SU CS Department website](https://cs.sun.ac.za) built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no dependencies.

---

## Quick Start

```bash
# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8000
```

Open `index.html` in a browser. All 9 pages are statically linked — no routing or bundling required.

---

## Pages

| File | Description |
|------|-------------|
| `index.html` | Homepage — hero, about, research groups, publications, staff, programmes |
| `programmes.html` | Academic programmes overview (BSc, BDatSci, Honours, MSc, PhD) |
| `undergraduate.html` | BSc Computer Science & BDatSci programme details |
| `honours.html` | BScHons Computer Science — tracks, timeline, application |
| `masters.html` | MSc Computer Science — research areas, supervisors, funding |
| `phd.html` | PhD Computer Science — phases, requirements, FAQ |
| `courses.html` | Module catalogue with search, filtering, and year tabs |
| `resources.html` | Student resources, links, FAQ, contact info, campus map |
| `news.html` | Department news, events, seminars, spotlight features |

---

## Architecture

### No frameworks. No build step.

Every page is a self-contained HTML file that loads two shared assets:

- **`theme.css`** — Design system with CSS custom properties, dark mode, nav styles, footer styles, animations, and responsive utilities (~1800 lines, 18 documented sections with a table of contents)
- **`components.js`** — Web Components for `<su-nav>` and `<su-footer>` (~380 lines, JSDoc-documented)

### Web Components

Navigation and footer are defined as custom elements using the Web Components API:

```html
<script src="components.js"></script>
<su-nav></su-nav>
<!-- page content -->
<su-footer></su-footer>
```

Both render into the **light DOM** (no Shadow DOM) so `theme.css` styles apply directly. The nav auto-detects the current page and highlights the active link. On the homepage, an `IntersectionObserver` tracks which section is in view for scroll-aware active highlighting.

### Design Token System

All colours, spacing, shadows, and typography are defined as CSS custom properties in `theme.css :root`. Dark mode works by redefining these tokens under `html[data-theme="dark"]`.

**Brand colours:**
- Primary (maroon): `#991832`
- Accent (gold): `#c9a227`

**Key tokens:** `--surface`, `--surface-alt`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--shadow-sm/md/lg/xl`, `--radius-sm/md/lg/xl`, `--font-heading`, `--font-body`

### Dark Mode

Toggle via the floating button (bottom-right). State is persisted in `localStorage` under key `su-theme`. An anti-FOUC script in each page's `<head>` applies the saved theme before first paint:

```html
<script>var t=localStorage.getItem("su-theme");if(t)document.documentElement.setAttribute("data-theme",t);</script>
```

---

## Design Decisions

- **Hackathon-tier aesthetic**: Dark backgrounds with vivid gradients, sharp edges (`border-radius: 0`), bold `font-weight: 800`, dramatic box-shadows, glowing accents, uppercase text — brutalist-modern feel
- **SU brand alignment**: Official maroon `#991832` and gold `#c9a227` throughout, matching [Stellenbosch University brand guidelines](https://www.sun.ac.za/english/Pages/Branding.aspx)
- **Real staff data**: 24 academic staff with photos, titles, offices, emails, and research tags sourced from [cs.sun.ac.za/people/staff/](https://cs.sun.ac.za/people/staff/)
- **Accessibility**: Skip-to-content links, ARIA labels, semantic HTML, lazy-loaded images, keyboard-navigable dark mode toggle, scroll-to-top button
- **Zero dependencies**: Pure HTML/CSS/JS, deployable to any static host

---

## File Structure

```
su-website/
├── index.html              # Homepage
├── programmes.html         # Programmes overview
├── undergraduate.html      # BSc / BDatSci details
├── honours.html            # Honours programme
├── masters.html            # Master's programme
├── phd.html                # PhD programme
├── courses.html            # Module catalogue
├── resources.html          # Student resources & FAQ
├── news.html               # News & events
├── theme.css               # Design system (tokens, dark mode, nav, footer, animations)
├── components.js           # Web Components (<su-nav>, <su-footer>)
├── su-logo.svg             # SU gold "S" crest mark
├── staff-photos/           # 24 staff headshots (.jpg/.png)
└── README.md               # This file
```

---

## Adding a New Page

1. Copy any existing page as a template
2. Update `<title>` and `<meta name="description">`
3. Add the page to `ACTIVE_MAP` in `components.js` to set nav highlighting
4. The `<su-nav>` and `<su-footer>` components handle themselves — just include the tags

---

## Deployment

Works on any static hosting:

```bash
# GitHub Pages
git push origin main  # enable Pages in repo settings

# Cloudflare Pages
# Connect repo → build command: (none) → output: /

# Vercel
vercel --prod
```

---

## Judging Criteria Coverage

| Criterion | How We Address It |
|-----------|-------------------|
| **Design** | Cohesive hackathon-tier dark aesthetic, SU brand colours, consistent token system, dramatic hero sections |
| **Functionality** | Course search & filtering, dark mode toggle with persistence, scroll-to-top, interactive FAQ accordions, smooth scroll navigation |
| **Completeness** | All 10 required content areas covered across 9 pages — programmes, staff, research, news, resources, publications, seminars, map |
| **Responsiveness** | CSS Grid/Flexbox layouts, mobile hamburger nav, media queries at 1024/768/480px breakpoints |
| **Usability** | Skip-to-content links, semantic HTML, ARIA labels, lazy loading, keyboard navigation, sticky filter bars |
| **Creativity** | Web Components architecture, brutalist-modern design language, hexagonal "years of excellence" animation, gradient research cards |

