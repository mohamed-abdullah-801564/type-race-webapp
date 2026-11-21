# AGENTS.md - Project Guidelines & Workspace Instructions

## Webpage Design & SEO Standards

Whenever asked to create or update any webpage, route, or landing view in this project:

### 1. Aesthetic & Usability Standards (`frontend-design`)
- **Distinctive Visual Direction**: Ground the UI in the mechanical keyboard and typing realm — tactile keycaps, satisfying tactile state feedback, clean borders, and physical depth.
- **No AI Design Tells**:
  - Never use all-caps micro-labels with extreme tracking (e.g. `text-[9px] uppercase tracking-[0.3em]`).
  - Never use fluorescent cyan on white or unreadable low-contrast color combinations. Light mode must maintain at least 5:1 contrast ratio.
  - Never use identical generic rounded SaaS cards with soft grey dropshadows and purple/cyan decorative gradient washes.
  - Never accent just a single random word with bold/gradient.
- **Readable Typography**: Clear type hierarchy, comfortable body font sizes (`text-sm` or `text-base`, never unreadable `text-[9px]` or `text-[10px]`), generous line-height, and purposeful headings.

### 2. SEO & Ranking Standards (Marketing & Agentic SEO Skills)
- **Semantic HTML**: Proper document hierarchy using `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, `<footer>`, `<aside>`, and `<h1-h6>` without skipping levels.
- **Search-Intent-Matched Headings**: Headings must clearly address search queries and user intent (e.g., "Custom Key Practice & Weak-Key Training" rather than cryptic sci-fi names like "Temporal Node").
- **Optimized Metadata**:
  - Distinct `<title>` under 60 characters with primary intent keyword.
  - Concise `<meta name="description">` (140-160 characters) with active value proposition.
  - OpenGraph (`og:title`, `og:description`, `og:image`, `og:type`) and Twitter Cards.
  - Canonical URL tag `<link rel="canonical" href="...">`.
- **Structured Data (JSON-LD)**: Every public page must declare appropriate Schema.org structured data (e.g., `WebApplication`, `SoftwareApplication`, `Course`, `FAQPage`, `ItemPage`).
- **Internal Linking**: Clean semantic `<a>` links with keyword-rich descriptive anchor text connecting pages (e.g., Solo Mode, Academy, Key Practice, Heatmap, Multiplayer).
- **GEO & AI Search Citability**: Write concise, self-contained 130-170 word explanatory passages with concrete facts and statistics for AI Overviews, Perplexity, and ChatGPT Search visibility.
