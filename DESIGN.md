---
name: Sontocodemo
description: Family-office account management styled as an editorial-financial Specimen Sheet. Warm bone surfaces, near-black ink type, mono numerics, a single chromatic spark per screen.
colors:
  bone-surface: "oklch(98% 0.005 75)"
  bone-field:   "oklch(96% 0.009 75)"
  margin:       "oklch(89% 0.013 75)"
  ink:          "oklch(20% 0.015 75)"
  ink-soft:     "oklch(48% 0.012 75)"
  positive:     "oklch(45% 0.085 145)"
  negative:     "oklch(42% 0.110 25)"
  caution:      "oklch(58% 0.100 75)"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "clamp(3rem, 8vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum, lnum"
  title:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
  mono-numeric:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.005em"
    fontFeature: "tnum, lnum"
rounded:
  hairline: "1px"
spacing:
  tight: "0.5rem"
  close: "0.875rem"
  default: "1.5rem"
  generous: "4rem"
components:
  button-balance:
    typography: "{typography.display}"
    textColor: "{colors.ink}"
    backgroundColor: "transparent"
    rounded: "{rounded.hairline}"
    padding: "0"
  button-delta-positive:
    typography: "{typography.title}"
    textColor: "{colors.positive}"
    backgroundColor: "transparent"
    rounded: "{rounded.hairline}"
    padding: "0"
  button-delta-negative:
    typography: "{typography.title}"
    textColor: "{colors.negative}"
    backgroundColor: "transparent"
    rounded: "{rounded.hairline}"
    padding: "0"
  activity-row:
    typography: "{typography.body}"
    textColor: "{colors.ink}"
    backgroundColor: "transparent"
    rounded: "{rounded.hairline}"
    padding: "0.75rem 0"
  panel-field:
    backgroundColor: "{colors.bone-field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
    padding: "2.25rem 2rem"
  label-uppercase:
    typography: "{typography.label}"
    textColor: "{colors.ink-soft}"
---

# Design System: Sontocodemo

## 1. Overview

**Creative North Star: "The Specimen Sheet"**

The system reads like a type-foundry specimen sheet meeting a private-bank statement. Surfaces are warm bone (tinted hue 75); type is near-black ink with a slight warm cast; numerics live in JetBrains Mono with tabular figures, so every balance, percentage, and date scans as a measured object. One chromatic moment per screen, sign-colored on monetary deltas, does the work that a dozen Bootstrap accents used to do.

Density is comfortable, not cramped. Personality lives in three places: the type pairing (Inter for sans, JetBrains Mono for every numeric), the tabular numeric treatment with decimal alignment, and a quiet choreographed reveal on most-judged surfaces. Everywhere else the surface gets out of the way.

The system explicitly rejects: default Bootswatch / Bootstrap chrome (sandstone, darkly, sketchy, vapor — the "swap a theme to feel different" pattern), neon and hype gradients, AI-SaaS purple, the hero-metric template, identical icon-card grids, and the corporate-bank navy / gold reflex. This is editorial-financial, not boardroom-financial.

**Key Characteristics:**
- Warm bone surfaces (hue 75), cool near-black ink type, one saturated chromatic spark per screen.
- Three-part type pairing: Inter for sans display + body + label, JetBrains Mono for every numeric.
- Tabular numerics with decimal alignment are a load-bearing detail, not an afterthought.
- One committed identity. Dark variant is the same identity in low light, not a different brand.
- Hairline 1px borders and Bone-Surface to Bone-Field tonal steps in place of shadows on static surfaces.
- Choreographed reveal (~700ms total, ease-out-quart) on entry of most-judged surfaces; restrained state-change motion everywhere else; honors `prefers-reduced-motion`.

## 2. Colors

A committed palette built on three primitives — bone, ink, and a single chromatic spark per screen — plus three role colors for monetary sign and pending state. All values are OKLCH; tinted neutrals share hue 75 (warm vellum) so the system coheres at the chromatic level.

### Primary

The "spark" role on a given surface. On the Home tab the spark lives on the period-delta indicator — sign-colored with **Positive** (green-moss) for gains and **Negative** (red-oxblood) for losses. Other surfaces will commit a single chromatic moment per screen with the same restraint.

- **Editorial Moss** (`oklch(45% 0.085 145)`): Positive monetary sign. Gains, credits, success state in tables and balances. Reads as ink-saturated, never as bright accent green.
- **Editorial Oxblood** (`oklch(42% 0.110 25)`): Negative monetary sign. Losses, distributions, error state. Muted, never alarm-red.

### Tertiary

- **Editorial Ochre** (`oklch(58% 0.100 75)`): Pending or stale state. Open transfer requests, statements past due. Muted ochre on the same hue as the neutrals, so it reads as a tonal shift rather than a separate color.

### Neutral

- **Bone Surface** (`oklch(98% 0.005 75)`): Application shell. Warm-tinted near-white, never `#fff`.
- **Bone Field** (`oklch(96% 0.009 75)`): One step warmer / deeper than Bone Surface. Inputs, hovered table rows, the active panel band (Activity zone on Home). Provides depth without shadow.
- **Margin** (`oklch(89% 0.013 75)`): Hairline 1px borders, dividers, table grid lines. Closer to Bone Field than to Ink.
- **Ink Soft** (`oklch(48% 0.012 75)`): Secondary type. Labels, captions, column headers, fine-print metadata.
- **Ink** (`oklch(20% 0.015 75)`): Primary type and primary numerics. Tinted slightly toward hue 75 so it carries the system's warmth even at near-black.

### Named Rules

**The One Spark Rule.** The chromatic spark appears on no more than 10% of any given screen. Its rarity is what makes it work. If a design seems to need the spark in two places at once, it needs it in zero — find the structural problem instead.

**The Tinted Neutrals Rule.** Every neutral carries a trace of the spark hue (chroma 0.005–0.013 in OKLCH). Pure greys are forbidden. Pure black and pure white are forbidden.

**The Sign Color Rule.** Editorial Moss and Editorial Oxblood are reserved for monetary sign in tables, balances, and the delta indicator. They are not used for general error / success UI chrome — that is the role of icons plus Ink type, not color floods.

## 3. Typography

**Display Font:** JetBrains Mono (the balance and other large mono-numeric set pieces).
**Body Font:** Inter (everything sans — page text, labels, masthead names, navigation).
**Mono Font:** JetBrains Mono (every numeric, account number, date, timestamp).

**Character:** A foundry-grade two-family pairing where the mono carries more visual weight than is conventional in product UI. The balance — the most-tested element on the Home tab — is set in mono at clamp(3rem, 8vw, 4.5rem) with `font-feature-settings: "tnum"` and a tight letter-spacing of −0.025em, so it reads as a measured object. Inter handles everything else: warm enough to pair with the bone surface, technical enough to read as money software.

### Hierarchy

- **Display / Specimen** (JetBrains Mono, 500, `clamp(3rem, 8vw, 4.5rem)`, line-height 1, letter-spacing -0.025em): Balance set pieces only. One per page maximum.
- **Title** (JetBrains Mono, 500, 1.125rem ≈ 18px, line-height 1.3, letter-spacing -0.01em): The delta figure ("+1.84% · +$22,891.40"), card and panel titles when monetary.
- **Body** (Inter, 500, 0.9375rem ≈ 15px, line-height 1.5, letter-spacing -0.005em, max 65–75ch where prose appears): Account holder names, activity row labels, descriptions.
- **Label** (Inter, 500, 0.6875rem ≈ 11px, uppercase, letter-spacing 0.12em): Section labels ("Account balance", "Activity", "Switch account"). Never narrative; always orienting.
- **Mono Numeric** (JetBrains Mono, 500, 0.8125rem ≈ 13px, letter-spacing -0.005em, `font-feature-settings: "tnum" on, "lnum" on`): Every secondary numeric — activity-row meta amounts, account numbers in masthead, dates, timestamps.

### Named Rules

**The Tabular Mono Rule.** Numerics are always set in JetBrains Mono with tabular figures (`font-feature-settings: "tnum" on, "lnum" on`). Decimal points align across rows. A column of balances scans top-to-bottom in straight vertical lines, or the table is wrong.

**The One Specimen Rule.** A page has at most one Display-scale (Specimen) element. Activity row amounts, masthead account numbers, and the delta all sit at Title or smaller. Display's authority comes from its rarity.

**The No Decorative Type Rule.** No gradient text. No `background-clip: text`. No outlined or hollow display type. No script faces. No emoji-as-glyph in body text. The two-family pairing is the personality; nothing else gets layered onto it.

## 4. Elevation

The system is largely flat. Depth is conveyed by tonal layering — Bone Surface to Bone Field — and by hairline 1px Margin borders. Shadows are reserved for true elevation (dropdowns, dialogs, popovers anchored to a trigger); they never decorate static surfaces. The Activity band on Home, for example, is a Bone Field tonal step inside Bone Surface, with a 1px top-rule above the row list — no shadow, no rounded corners, no card.

### Shadow Vocabulary

- **Lift Low** (`box-shadow: 0 8px 24px oklch(20% 0.015 75 / 0.06)`): Dropdowns, tooltips, command-palette overlays anchored to a trigger. Diffuse, low-chroma, ink-tinted. Used by the AccountSelector's `.dropdown-menu` and nowhere else on the Home tab today.

### Named Rules

**The Tonal-First Rule.** Cards, panels, and table rows convey hierarchy through Bone Surface to Bone Field tonal shifts before reaching for borders or shadows. If a surface needs a shadow to feel like a surface, the tonal contrast is wrong.

**The No Decorative Shadow Rule.** Shadows answer the question "is this thing detached from the page?". If the answer is no, no shadow. Drop-shadows on cards, hover-glow on buttons, and ambient shadows on hero panels are forbidden.

## 5. Components

### Buttons

- **Shape:** rectangular with 1px hairline radius (functionally square; the radius prevents anti-alias artifacts only).
- **Balance (Specimen).** Display-scale JetBrains Mono, 500 weight, color `Ink`, fully transparent background, no border, no padding. Cents render in a softer Ink-Soft span suffix so the integer dollar figure carries the visual weight. Hover transitions color from Ink to a one-step-deeper Ink (`oklch(28% 0.018 75)`) over 180ms ease-out-quart. Click routes into the Statements tab.
- **Delta.** Title-scale JetBrains Mono, 500 weight, color is sign-driven: Editorial Moss for positive, Editorial Oxblood for negative, Ink-Soft for neutral. Transparent background, no border, no padding, no shadow. Pairs the percent and signed dollar amount on one line separated by interpunct (`·`), with a Label-scale "Since [period name]" caption below.
- **Ghost link** (e.g. "View full statement history →"). Inter, 500 weight, 0.8125rem, color Ink-Soft → Ink on hover. Underline removed; the right-arrow trailing character is the affordance. No background, no padding chrome.
- **Switcher dropdown trigger.** JetBrains Mono, 500, 0.8125rem, transparent background, 1px Margin border, 1px radius, 0.5rem 0.875rem padding. On hover: border color shifts to Ink. No box-shadow, no fill, no Bootstrap blue ever.

### Cards / Containers

The system mostly does not use cards. The Activity band is the closest equivalent: a tonal Bone-Field band that bleeds to the column edges with `margin: 0 -2rem; padding: 2.25rem 2rem 2.5rem` (negative-margin trick). No corner radius. No border. No shadow. Internal rows are hairline-divided.

### Inputs / Fields

- **Stroke.** 1px solid Margin border with 1px radius. Background Bone Surface. On focus: border color shifts to Ink, box-shadow stays explicitly `none`, outline `none`. No glow, no Bootstrap focus-ring blue.
- **Typography inside fields.** Mono for searchable lists (the AccountSelector typeahead), Inter for free-text entry elsewhere. Same 0.875rem size in both cases.

### Lists / Tables

- **Activity row.** 3-column grid (`4.5rem 1fr auto`) of mono date · sans body name · sign-colored mono amount. Hairline Margin border on the bottom of each row; 0.75rem vertical padding. Hover translates the row 0.5rem to the right via `padding-left` (NOT a layout property — `padding-left` here works because the cells are baseline-aligned and grid cells absorb the shift). Mobile collapse: the amount drops below the name in a 2-line layout.
- **Selector row** (inline list, 1–3 other accounts): 3-column grid (name, balance, account-number tag) with hairline dividers. Same color and type vocabulary.

### Navigation

- **Top NavigationBar (on Home).** Bone-on-bone with a 1px Margin bottom rule. The Bootswatch theme bg / variant is overridden under `.dashboard--home` to bone, with the dropdown link colors forced to Ink. Off-Home, the NavigationBar reverts to the existing Bootswatch theme (transitional state — full chrome refresh is a separate phase).
- **Bottom mobile nav and inline tab strip:** hidden on Home. Navigation lives in the masthead and inline activity-row links.

### Signature Components

- **Masthead.** 2-column baseline-aligned grid: account holder name (Body, Ink) on the left, mono metaline ("account-number · period · last-updated") on the right. Hairline Margin bottom rule. Becomes a stack on mobile (≤540px) with the metaline left-aligned. Stale data tints the metaline Editorial Ochre.
- **Specimen.** The page set piece. Display-mono balance with cents in a softer Ink-Soft span; below it, a Title-mono delta carrying the chromatic spark and a Label-scale "Since [period]" caption. 5rem top padding on desktop, 3.25rem on mobile, generous bottom padding. No frame around it; whitespace is the framing device.
- **Switch account control.** Two-column row: "SWITCH ACCOUNT" label on the left (Label scale, Ink-Soft), the existing Bootstrap Dropdown trigger on the right wrapped in a `__switcher-control` rule that overrides every Sandstone style (background, border, radius, font, shadow) so the typeahead reads as a native part of the masthead and not as bolted-on chrome. Replaces the inline list when more than 3 other accounts exist.

## 6. Do's and Don'ts

### Do:

- **Do** carry the warm bone + ink + single-spark identity through every surface. One coherent identity, not four swappable themes.
- **Do** set every balance, account number, trade price, and date in JetBrains Mono with tabular figures (`font-feature-settings: "tnum" on, "lnum" on`). Decimal alignment is a load-bearing detail.
- **Do** tint every neutral toward hue 75 (chroma 0.005–0.013 in OKLCH). Pure greys are forbidden.
- **Do** reserve Display / Specimen scale for one element per page, maximum.
- **Do** convey panel and card hierarchy through tonal Bone Surface to Bone Field shifts before reaching for borders or shadows.
- **Do** earn the chromatic spark on every appearance: sign-colored delta, primary CTA, brand mark. Never decoration.
- **Do** reserve choreographed reveals for most-judged surfaces (Home first paint, Login, Statement open). Restrained state-change motion everywhere else.
- **Do** honor `prefers-reduced-motion`: when set, every reveal sequence resolves instantly to the default state with no Y-translation, opacity, or stagger.
- **Do** apply the `.dashboard--home` chrome override (bone-on-bone NavigationBar, hidden tab strip, hidden BottomNav) on any new surface that wants Specimen Sheet feel; the rest of the shell still renders Bootswatch until the wider chrome refresh.

### Don't:

- **Don't** ship default Bootswatch or Bootstrap chrome on Specimen Sheet surfaces. Sandstone brown / gold, Darkly grey / blue, Sketchy, Vapor — the "swap themes as a feature" pattern is what is being escaped.
- **Don't** use neon-on-black, hype gradients, emoji rockets, or any crypto / fintech-bro signaling.
- **Don't** use AI-SaaS purple gradients, the hero-metric template (big number + small label + gradient accent), or identical icon-card grids.
- **Don't** reach for the corporate-bank navy / gold reflex. Editorial-financial, not boardroom-financial.
- **Don't** use `#000` or `#fff`. Don't combine `background-clip: text` with a gradient. Don't use a `border-left` greater than 1px as a colored side stripe on cards or rows. Don't use glassmorphism decoratively. Don't reach for a modal as the first thought.
- **Don't** use em dashes in product copy. Use commas, colons, semicolons, parentheses, or interpunct (`·`) for inline separators.
- **Don't** allow more than one chromatic-spark moment per screen.
- **Don't** ship balances or numerics in Inter (or any proportional sans). Numerics live in JetBrains Mono, always, with tabular figures.
- **Don't** add box-shadow to static surfaces. Shadows answer "is this detached from the page?" — if the answer is no, no shadow.
- **Don't** branch the Home view by user role. Admin, manager, account-holder all see exactly the same render — that is the point: managers service accounts on behalf of clients, and admins verify what clients see when there are issues.
