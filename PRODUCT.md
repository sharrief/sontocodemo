# Product

## Register

product

## Users

Two real audiences, ranked.

**Primary: portfolio viewers and hiring managers.** They land at sontocodemo.sharrief.com because Sharrief sent them. They will poke at every flow — log in, browse accounts, open a statement, drill into a trade, follow the application onboarding. They are evaluating craft: information design, financial data presentation, attention to detail under inspection.

**Secondary: family-office admins and account holders.** The original audience the tool was built for — admins managing client accounts, statements, trades, and transfer requests; account holders viewing their own statements and bank info. The product must still feel operationally real, not like a mockup. If a flow only "looks good in the demo," it fails both audiences.

The job-to-be-done for both: see the truth about money quickly and trust the surface that's showing it.

## Product Purpose

Sontocodemo is a financial account management platform — accounts, statements, trades, transfers, applicant onboarding, admin portal. Originally built in 2018 to administrate a small family investment office; now also serving as a long-running portfolio piece demonstrating end-to-end product, design, and engineering craft.

Success looks like: a hiring manager opens the demo, navigates the admin and dashboard surfaces, and comes away thinking *"this person ships money software at a high standard."* Simultaneously, every workflow continues to be coherent enough that someone could plausibly run an investment office with it.

## Brand Personality

**Three words: quiet, financial, institutional** — but Mercury-flavored, not retail-bank-flavored. Modern banking confidence: restrained palette, careful typography, comfortable density, calm motion. Personality emerges from precision and restraint, not from chrome or color.

Voice and tone are sober and direct. Money software earns trust by being exact, not by being friendly. Zero exclamation points, zero emoji-as-decoration, zero marketing language inside the product surface.

Emotional goal when a viewer first opens the dashboard: *"oh — this is real."* Not delight, not surprise. Recognition.

## Anti-references

The refresh must not look like:

- **Default Bootswatch / Bootstrap.** The current sandstone/darkly/sketchy/vapor theme switcher is the single biggest tell that the UI is unfinished. Brown-and-gold sandstone, generic Bootstrap card grids, default Roboto everywhere. The whole "swap a Bootswatch theme to feel different" pattern is the thing being escaped.
- **Crypto / fintech-bro neon.** Neon-on-black, aggressive gradients, hype energy, emoji rockets. Wrong register for a steady, long-running money tool.
- **AI-SaaS purple gradient cliche.** Gradient text, gradient buttons, the hero-metric template (big number + small label + gradient accent), identical icon-card grids, "AI made that" energy. The absolute bans in the impeccable shared laws apply with extra force here.
- **Trend-chasing in general.** This app has existed since 2018 and is maintained, not relaunched. The refresh should read as considered evolution, not a rewrite chasing 2026 design memes.

Notably *not* an anti-reference: navy/gold institutional finance was offered and not rejected, so it's available as one inspiration vector — but Mercury's quieter, more contemporary read is the closer target.

## Design Principles

1. **Workflow clarity beats visual flair.** Every surface is judged twice — once by a hiring manager scanning for craft, once by an imagined operator trying to do their job. If a design move helps the first and breaks the second, it's wrong. Real-product realism is the floor.

2. **Quiet by default, expressive at the edges.** Restraint is the personality. Surfaces stay calm; identity lives in typography choices, numeric treatment, micro-interactions, and a single committed accent. No chrome. No decorative gradients. No "design system" logos sitting on top of surfaces.

3. **Money UI is numeric UI.** Tables, statements, balances, trades — these are the soul of the product and where craft is most visible. Tabular numerals, deliberate alignment, careful use of weight and color to convey sign and significance. A reviewer who opens a statement should feel the discipline immediately.

4. **One committed identity, not four swappable themes.** The four-Bootswatch-themes setup is a portfolio liability disguised as a feature. The refresh moves toward one coherent visual identity. A dark mode is welcome if it's the same identity in different lighting — not a different brand.

5. **Show ten years of restraint.** This is a maintained codebase, not a new launch. The refresh should feel like the considered next step from a thoughtful operator, not like 2018-Sharrief discovered a Figma trend. Permanence over novelty.

## Accessibility & Inclusion

Best-effort, not a hard compliance gate. Aim for WCAG AA contrast on text and interactive elements as the working default; honor `prefers-reduced-motion` for any added motion; keep the app keyboard-navigable. Don't let a11y debate block bolder visual moves, but don't ship anything obviously broken (unreadable contrast on financial figures, trapped focus, motion that can't be disabled).
