# Publish Synthecists Post Implementation Plan

## Overview

Convert `posts/synthecists.md` to a published HTML post, list it on the blog index, and fix a logo inconsistency in the two existing posts.

## Current State Analysis

- The site is a hand-authored static HTML site — no SSG, no templates
- Two posts are published: `posts/the-review-bottleneck.html` and `posts/adaptive-rag-chatbot.html`
- `posts/synthecists.md` exists but has no corresponding `.html` file and is not listed in `blog.html`
- `blog.html` and `index.html` use logo "Tassan Saidi" (correct); both published posts incorrectly use "Tonderai Saidi" in their nav logo

## Desired End State

- `posts/synthecists.html` exists and renders the full article
- `blog.html` lists the new post at the top (newest first), dated March 18, 2026
- All three post HTML files use "Tassan Saidi" in the nav logo
- Visiting `posts/synthecists.html` displays the full essay with correct nav, meta, references, and back link

### Key Discoveries:
- Post template pattern: `posts/the-review-bottleneck.html` (prose-only, no diagrams/code)
- Logo inconsistency: `posts/the-review-bottleneck.html:14` and `posts/adaptive-rag-chatbot.html:14` both say "Tonderai Saidi"
- Blog listing pattern: `blog.html:29-38` — `<article class="blog-post">` with `h3` link, `.post-meta`, `.post-excerpt`, `.read-more` link
- Posts link back with `<a href="../blog.html" class="back-link">&larr; Back to Blog</a>`
- CSS loaded via `../style.css` (relative from inside `/posts/`)
- Tailwind loaded from CDN in existing posts (`<script src="https://cdn.tailwindcss.com"></script>`) — include for consistency

## What We're NOT Doing

- Not converting the site to a static site generator
- Not adding Open Graph / SEO meta tags
- Not adding previous/next post navigation
- Not modifying any CSS
- Not touching `posts/we-not-ready.md`

## Implementation Approach

Manually author the HTML post by following `the-review-bottleneck.html` exactly, converting each markdown element. Then prepend a blog listing entry and do a targeted logo text replacement in the two existing posts.

---

## Phase 1: Create `posts/synthecists.html`

### Overview
Convert the markdown article to a self-contained HTML post page.

### Changes Required:

#### 1. New file: `posts/synthecists.html`
**File**: `posts/synthecists.html`
**Changes**: Create from scratch following the post template

Key conversion decisions:
- All paragraphs → `<p>` tags
- `*italic*` → `<em>`, `**bold**` → `<strong>`
- `---` horizontal rule → `<hr>`
- References section: `<h3>References</h3>` + `<ol>` with `<li>` per entry, URLs as `<a href>` links
- `post-meta` content: `March 18, 2026 · The Case for Humanity: What Chess Got Right About AI`
- Logo: `Tassan Saidi`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Case for Humanity: What Chess Got Right About AI - Tassan Saidi</title>
    <link rel="stylesheet" href="../style.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <header>
        <nav>
            <div class="nav-container">
                <h1 class="logo">Tassan Saidi</h1>
                <ul class="nav-links">
                    <li><a href="../index.html">Home</a></li>
                    <li><a href="../blog.html">Blog</a></li>
                </ul>
            </div>
        </nav>
    </header>

    <main>
        <article class="post-content">
            <h1 class="post-title">The Case for Humanity: What Chess Got Right About AI</h1>
            <p class="post-meta">March 18, 2026 · The Case for Humanity: What Chess Got Right About AI</p>

            <!-- all paragraphs converted from markdown -->
            <!-- <hr> for the --- separator -->
            <!-- <h3>References</h3> + <ol> for the numbered refs -->

            <a href="../blog.html" class="back-link">&larr; Back to Blog</a>
        </article>
    </main>

    <footer>
        <p>&copy; 2026 Tassan Saidi</p>
    </footer>
</body>
</html>
```

### Success Criteria:

#### Automated Verification:
- [x] File exists: `posts/synthecists.html`
- [x] File contains `class="post-content"`, `class="post-title"`, `class="post-meta"`, `class="back-link"`
- [x] File contains `Tassan Saidi` in the logo (not "Tonderai")
- [x] File links back to `../blog.html`
- [x] File loads `../style.css`

#### Manual Verification:
- [x] Opening `posts/synthecists.html` in browser shows the full article
- [x] Nav links (Home, Blog) work correctly
- [x] References section renders as a numbered list with clickable links
- [x] Back link returns to blog index

**Implementation Note**: After completing Phase 1 and verifying the file renders correctly in a browser, confirm before proceeding to Phase 2.

---

## Phase 2: Update `blog.html` listing

### Overview
Prepend a new `<article class="blog-post">` entry at the top of the blog listing in `blog.html`.

### Changes Required:

#### 1. `blog.html` — add new listing entry
**File**: `blog.html`
**Changes**: Insert new article before the existing first entry (line 29)

Excerpt text (summarising the essay):
> From Kasparov vs Deep Blue to AI agents today — why the amateur chess players who beat the grandmasters give us the best model for humanity's role in an AI-powered world.

```html
<article class="blog-post">
    <h3><a href="posts/synthecists.html">The Case for Humanity: What Chess Got Right About AI</a></h3>
    <p class="post-meta">March 18, 2026</p>
    <p class="post-excerpt">
        From Kasparov vs Deep Blue to AI agents today — why the amateur chess players
        who beat the grandmasters give us the best model for humanity's role
        in an AI-powered world.
    </p>
    <a href="posts/synthecists.html" class="read-more">Read more</a>
</article>
```

### Success Criteria:

#### Automated Verification:
- [x] `blog.html` contains `href="posts/synthecists.html"` (appears twice: in h3 and read-more)
- [x] `blog.html` contains `March 18, 2026`
- [x] New entry appears before the "Review Bottleneck" entry

#### Manual Verification:
- [x] Blog page lists three posts in correct date order (March 18 → Feb 10 → Jan 4)
- [x] Clicking the new entry title or "Read more" navigates to the post

---

## Phase 3: Fix logo inconsistency in existing posts

### Overview
Replace "Tonderai Saidi" with "Tassan Saidi" in the nav logo of the two existing published posts.

### Changes Required:

#### 1. `posts/the-review-bottleneck.html:14`
**File**: `posts/the-review-bottleneck.html`
**Change**: `Tonderai Saidi` → `Tassan Saidi`

#### 2. `posts/adaptive-rag-chatbot.html:14`
**File**: `posts/adaptive-rag-chatbot.html`
**Change**: `Tonderai Saidi` → `Tassan Saidi`

### Success Criteria:

#### Automated Verification:
- [x] `grep "Tonderai Saidi" posts/*.html` returns no matches

#### Manual Verification:
- [x] Opening each existing post shows "Tassan Saidi" in the top-left logo

---

## Testing Strategy

### Manual Testing Steps:
1. Open `blog.html` — verify three posts listed newest-first
2. Click new entry → verify `synthecists.html` loads with correct title, date, full article
3. Verify references render as a numbered `<ol>` with working links
4. Click "← Back to Blog" → verify returns to blog index
5. Open `posts/the-review-bottleneck.html` and `posts/adaptive-rag-chatbot.html` → verify logo reads "Tassan Saidi"

## References

- Post template: `posts/the-review-bottleneck.html`
- Blog listing pattern: `blog.html:29-38`
- Article source: `posts/synthecists.md`
