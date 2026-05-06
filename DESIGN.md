<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Sontocodemo
description: Family-office account management refreshed as an editorial-financial portfolio piece — warm bone surfaces, near-black ink type, mono numerics, and a single chromatic spark per screen.
---

# Design System: Sontocodemo

## 1. Overview

**Creative North Star: "The Specimen Sheet"**

The refresh borrows the posture of a type-foundry specimen sheet meeting a private-bank statement. Surfaces are warm bone, type is near-black ink, numerics live in a confident mono so every balance reads as a measured object. One chromatic moment per screen — a single saturated spark — does the work a dozen Bootstrap accents used to do.

Density is comfortable: this is software you would actually run a small office in, not a marketing mockup. Personality lives in three places — the type pairing, the tabular numeric treatment, and the choreographed reveal of dashboards and statements on first paint. Everywhere else, the surface gets out of the way.

This system explicitly rejects default Bootswatch chrome, the four-theme swap-as-feature pattern, neon and hype gradients, AI-SaaS purple, the hero-metric template, and the corporate-bank navy / gold reflex. The refresh is editorial-financial, not boardroom-financial.

**Key Characteristics:**
- Warm bone surfaces, cool near-black ink type, one saturated chromatic spark per screen.
- Three-part type pairing: a sans display, a sans body, a mono for every numeric.
- Tabular numerals are the hero feature, not an afterthought.
- One committed visual identity. A dark variant is welcome, but it is the same identity under different lighting — not a different brand.
- Choreographed motion reserved for the most-judged surfaces; everywhere else, restrained state-change only.

## 2. Colors

A committed palette built on three primitives — bone, ink, and a single chromatic spark — plus a small set of role colors for sign and state in money UI. Hex values are deferred to implementation; the doctrine is normative.

### Primary

- **The Spark** ([to be resolved during implementation]): The single saturated moment per screen. Reserved for primary CTA, the row in focus, the positive-balance moment, the brand mark. Never for chrome, never for decoration. Hue candidates to explore at implementation: deep oxblood, ink-saturated teal, deep moss. Pick one and commit. The spark must read as ink-saturated, not as bright accent.

### Neutral

- **Bone Surface** ([to be resolved]): The warm-tinted near-white application shell. Tinted slightly toward the spark hue so the whole identity coheres. Never `#fff`.
- **Bone Field** ([to be resolved]): One step warmer and deeper than Bone Surface. Inputs, table rows on hover, the active panel. Provides depth without shadow.
- **Ink** ([to be resolved]): The near-black for body type and primary numerics. Tinted slightly toward the spark hue. Never `#000`.
- **Ink Soft** ([to be resolved]): Secondary type — labels, captions, column headers.
- **Margin** ([to be resolved]): Hairline borders, dividers, table grid lines. Closer to Bone Field than to Ink.

### Functional (sign and state)

- **Negative** ([to be resolved]): Losses, debits, errors. A muted oxblood, never alarm-red.
- **Positive** ([to be resolved]): Gains, credits, success. A deep moss or tinted ink, never bright green.
- **Caution** ([to be resolved]): Pending states, warnings. A muted ochre or umber.

### Named Rules

**The One Spark Rule.** The chromatic spark appears on no more than 10% of any given screen. Its rarity is what makes it work. If a design seems to need the spark in two places at once, it needs it in zero — find the structural problem instead.

**The Tinted Neutrals Rule.** Every neutral carries a trace of the spark hue (chroma 0.005–0.01 in OKLCH). Pure greys are forbidden. Pure black and pure white are forbidden.

**The Sign Color Rule.** Negative and Positive are reserved for monetary sign in tables and balances. They are not used for general error / success UI chrome — that is the role of icons plus Ink type, not color floods.

## 3. Typography

**Display Font:** [Sans display family to be chosen at implementation — humanist or technical-leaning. Candidates: Söhne, Geist, Mona Sans, Inter Display.]
**Body Font:** [Sans body family paired with the display — usually the body cut of the same family for coherence.]
**Mono Font:** [Monospace family for every numeric. Candidates: Berkeley Mono, JetBrains Mono, IBM Plex Mono, iA Writer Mono.]

**Character:** A foundry-grade three-part pairing. A confident sans display carries page titles. A comfortable sans body carries running text and labels. A deliberate mono carries every balance, account number, trade price, and timestamp. The mono is not decoration — it is the thing that makes this app read as money software.

### Hierarchy

- **Display** ([weight + clamp range to be resolved]): Page titles only — Accounts, Statements, Trades. One Display per page.
- **Headline** ([to be resolved]): Section-level headings inside a page (e.g. a statement's month header).
- **Title** ([to be resolved]): Card, panel, and dialog titles.
- **Body** ([to be resolved], 65–75ch max line length): Running text and descriptions. Rare in this product; when it appears it should be comfortable.
- **Label** ([weight, size, letter-spacing to be resolved]): Form labels, table column headers, badge text.
- **Mono Numeric** ([to be resolved], `font-feature-settings: "tnum"`): Every balance, account number, trade price, percentage, date, time. The single most-tested treatment in the system.

### Named Rules

**The Tabular Mono Rule.** Numerics are always set in the mono with tabular figures. Decimal points align across rows. A column of balances scans top-to-bottom in straight vertical lines, or the table is wrong.

**The One Display Rule.** A page has at most one Display-scale element. Statement headers, card titles, and the dashboard greeting use Headline or Title, never Display. Display's authority comes from its rarity.

**The No Decorative Type Rule.** No gradient text. No `background-clip: text`. No outlined or hollow display type. No script faces. No emoji-as-glyph in body text. The type pairing is the personality; nothing else gets layered onto it.

## 4. Elevation

The system is largely flat. Depth is conveyed by tonal layering — Bone Surface to Bone Field — and by hairline Margin borders. Shadows are reserved for true elevation (dialogs, popovers, the active drag state); they never decorate static surfaces.

### Shadow Vocabulary

- **Lift Low** ([exact value to be resolved]): Dropdowns, tooltips, command-palette overlays anchored to a trigger.
- **Lift High** ([exact value to be resolved]): Modal dialogs and full popovers detached from a trigger. Diffuse, low-chroma, no harsh undershadow.

### Named Rules

**The Tonal-First Rule.** Cards, panels, and table rows convey hierarchy through bone-on-bone tonal shifts (Surface vs. Field) before reaching for borders or shadows. If a surface needs a shadow to feel like a surface, the tonal contrast is wrong.

**The No Decorative Shadow Rule.** Shadows answer the question "is this thing detached from the page?". If the answer is no, no shadow. Drop-shadows on cards, hover-glow on buttons, and ambient shadows on hero panels are forbidden.

## 5. Components

[Deferred until the first refresh PR. The current component vocabulary is Bootswatch — explicitly the thing being escaped — so promoting it into a "target" spec would only encode what we're leaving behind. Re-run `/impeccable document` after the first refresh PR lands to capture the real button, input, table, panel, and navigation primitives.]

The first refresh PR should produce, at minimum: primary button, ghost button, text input, financial table row, account / statement card, and top navigation. Each will be specified here on the next pass.

## 6. Do's and Don'ts

### Do:

- **Do** carry the warm bone + ink + single-spark identity through every surface — admin, dashboard, login, application onboarding. One coherent identity, not four swappable themes.
- **Do** set every balance, account number, trade price, and date in the mono with tabular figures. Decimal alignment is a load-bearing detail.
- **Do** tint every neutral toward the spark hue (chroma 0.005–0.01 in OKLCH). Pure greys are forbidden.
- **Do** reserve Display type for one element per page, maximum.
- **Do** convey panel and card hierarchy through tonal Bone Surface to Bone Field shifts before reaching for borders or shadows.
- **Do** earn the chromatic spark on every appearance: primary CTA, focused row, positive-balance moment, brand mark. Never decoration.
- **Do** reserve choreographed motion for the most-judged surfaces (login, dashboard first paint, statement open). Everywhere else, restrained state-change motion only.
- **Do** honor `prefers-reduced-motion` for any choreographed sequence.

### Don't:

- **Don't** ship default Bootswatch or Bootstrap chrome — sandstone brown / gold, darkly grey / blue, sketchy, vapor. The swap-themes-as-feature pattern is what is being escaped.
- **Don't** use neon-on-black, hype gradients, emoji rockets, or any crypto / fintech-bro signaling. Wrong register for this product.
- **Don't** use AI-SaaS purple gradients, the hero-metric template (big number + small label + gradient accent), or identical icon-card grids. Direct anti-references from PRODUCT.md.
- **Don't** reach for the corporate-bank navy / gold reflex. Editorial-financial, not boardroom-financial.
- **Don't** use `#000` or `#fff` anywhere. Don't combine `background-clip: text` with a gradient. Don't use a `border-left` greater than 1px as a colored side stripe on cards or rows. Don't use glassmorphism decoratively. Don't reach for a modal as the first thought.
- **Don't** use em dashes in product copy. Commas, colons, semicolons, parentheses.
- **Don't** allow more than one chromatic-spark moment per screen.
- **Don't** ship balances or numerics in the proportional sans. Numerics live in the mono, always, with tabular figures.
- **Don't** add Layout, Motion, or Responsive as top-level sections to this spec. They fold into Overview (philosophy) and Components (per-component behavior) on the next pass.
