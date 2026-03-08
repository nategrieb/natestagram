# NATESTAGRAM Design Philosophy

This document captures the visual and interaction language of NATESTAGRAM so it can be reproduced in another codebase with high fidelity.

## 1. Brand Intent

NATESTAGRAM is intentionally quiet, minimal, and image-forward.

- Prioritize photographs over chrome.
- Use restrained typography and neutral surfaces.
- Keep controls geometric and understated.
- Reveal emphasis through motion and micro-interaction, not heavy decoration.

The result should feel editorial and clean, not app-store flashy.

## 2. Typography System

## Primary font

- Font family: `Manrope` via `next/font/google`.
- CSS variable: `--font-body`.
- Base stack fallback: `var(--font-body), "Avenir Next", sans-serif`.

Implementation source:

- `src/app/layout.tsx`
- `src/app/globals.css`

## Logo wordmark style

The wordmark is text-based (not an image): `NATESTAGRAM`.

- Case: all caps.
- Weight: `font-bold`.
- Tracking: `tracking-wider`.
- Size: `text-sm md:text-base`.
- Color: `text-zinc-900`.

Visual lockup pattern:

- Leading circular mark: `h-6 w-6 rounded-full`.
- Circle fill: `bg-gradient-to-br from-green-800 to-green-600`.
- Text sits to the right with `gap-3`.

Reference implementations:

- `src/app/page.tsx`
- `src/app/timeline/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/photo/[id]/page.tsx`

## Browser/tab/link title

- Metadata title: `○ NATESTAGRAM`.
- Open Graph and Twitter titles match exactly.

Reference: `src/app/layout.tsx`

## 3. Color Philosophy

The palette is neutral-first with green used only for brand punctuation.

## Core tokens (from CSS)

- `--paper: #f1f5f9` (base surface)
- `--ink: #121316` (primary text)
- `--mist: #ffffff` (white layer)

## Brand greens

- Logo gradient: `from-green-800` to `to-green-600`.
- App icon ring (BRG): `#004225`.

## Neutral UI colors

- Primary text: `zinc-900`.
- Secondary text: `zinc-600` / `zinc-500` / `zinc-400`.
- Dividers: `zinc-300/40` and `zinc-100`.
- Hover border accents: `zinc-300` or `zinc-300/80`.

## Feedback colors

- Success: emerald (`emerald-50`, `emerald-200`, `emerald-700/800`).
- Error: rose (`rose-50`, `rose-200`, `rose-700/800`).

## 4. Background and Surfaces

The app avoids flat color fields.

## Page background

Layered, subtle gradients:

- Two radial highlights near top regions.
- Vertical linear gradient from white to paper.

Reference: `body` in `src/app/globals.css`.

## Atmospheric accent

A centered top orb (`.backdrop-orb`) appears on larger screens only.

- Soft radial blend.
- Hidden on small screens to preserve clarity.

## Container treatment

- Public pages use breathable horizontal padding on web.
- Mobile can go full-bleed for image grids/timelines.
- Panels are mostly border-first and shadow-light.

## 5. Shape Language and Lines

NATESTAGRAM strongly prefers hard edges and fine lines.

- Buttons are square: `rounded-none`.
- Borders are thin and subtle.
- Grid gutters are crisp: `gap: 1px`.
- Decorative curves are minimal outside brand circles.

This creates a clean, almost print-grid feel.

## 6. Button and Control Patterns

## Square icon actions

Common dimensions:

- Header/action buttons: `h-10 w-10`.
- Carousel nav buttons: `h-11 w-11`.

Interaction states:

- Base: border transparent, muted neutral text.
- Hover/focus: border appears + soft white background.
- Active/touch: subtle scale down (`active:scale-95`), stronger foreground.

Reference examples:

- `src/app/page.tsx`
- `src/app/timeline/page.tsx`
- `src/app/photo/[id]/page.tsx`
- `src/components/photo-carousel.tsx`

## Underline reveal microinteraction

This is a signature NATESTAGRAM gesture.

Pattern:

- Add an absolutely positioned 1px line near button bottom.
- Initial state: `scale-x-0`.
- On interaction: `scale-x-100` via transition.
- Use `origin-center` for center-out reveal.
- Use `origin-left` where a directional cue is desired.

Canonical class pattern:

`absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 ... transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100`

## Hover-only border behavior

Many square actions feel nearly invisible at rest, then resolve on intent.

- Rest: `border-transparent`.
- Hover/focus: `hover:border-zinc-300/80` + `hover:bg-white/70`.

This keeps UI quiet until user intent appears.

## 7. Motion Principles

Motion is restrained and functional.

- Durations are short (about 150-300ms).
- Scale interactions are subtle, never bouncy.
- Emphasis is mostly opacity/underline/scale.
- No gratuitous page-level animation loops.

Examples:

- Grid tile touch feedback: small press scale and flash overlay.
- Icon button underline reveal.
- Carousel control activation and hover response.

Reduced motion is respected in CSS.

Reference: `@media (prefers-reduced-motion: reduce)` in `src/app/globals.css`.

## 8. Imagery and Grid Behavior

Photos are the product.

## Grid

- Dense 3-column rhythm on mobile and desktop contexts.
- 1px separation lines.
- Full-bleed behavior on mobile where requested.
- Side breathing room preserved on web layouts.

## Tile ratio

- Current tile ratio: `4 / 5` for slight portrait bias.
- This balances vertical presence with familiar feed density.

## Timeline/detail behavior

- Timeline prioritizes full image visibility over forced crop when requested.
- Detail view supports carousel navigation with same control language.

## 9. Iconography and Metadata

App icon is intentionally simple and brand-coherent.

- File: `src/app/icon.svg`
- Form: stroked circle
- Stroke color: BRG `#004225`
- No fill, no extra ornament

Metadata wiring:

- `icons.icon`, `icons.shortcut`, and `icons.apple` point to `/icon.svg`.
- Social metadata titles use `○ NATESTAGRAM`.

Reference: `src/app/layout.tsx`

## 10. Accessibility and UX Notes

- Interactive elements expose focus-visible styles.
- Buttons maintain visible hit areas (`40px+` square for primary icon controls).
- Contrast remains neutral but legible.
- Decorative text effects are disabled globally to avoid readability artifacts.

## 11. Implementation Rules for Porting

If recreating this style in another project, keep these rules intact:

- Use Manrope as the default UI and logo text font.
- Keep wordmark uppercase, bold, wide-tracked.
- Preserve square controls with hover-emergent borders.
- Preserve 1px underline reveal animation as a standard action motif.
- Keep palette neutral with green reserved for brand marks.
- Maintain 1px grid gutters and clean border geometry.
- Keep mobile image areas edge-to-edge where image immersion is desired.
- Avoid rounded-heavy, shadow-heavy, or colorful UI components.

## 12. Copy-Paste Starter Snippets

## Logo lockup

```tsx
<div className="flex items-center gap-3">
  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-800 to-green-600" aria-hidden="true" />
  <h1 className="font-bold text-sm md:text-base text-zinc-900 tracking-wider">NATESTAGRAM</h1>
</div>
```

## Square action button with underline reveal

```tsx
<button className="group relative inline-flex h-10 w-10 items-center justify-center rounded-none border border-transparent text-zinc-400 transition-all duration-200 hover:border-zinc-300/80 hover:bg-white/70 hover:text-zinc-800 focus-visible:border-zinc-300/80 focus-visible:bg-white/70 focus-visible:text-zinc-800 active:scale-95">
  <span className="text-2xl leading-none">+</span>
  <span
    aria-hidden="true"
    className="absolute bottom-1.5 left-2 right-2 h-px origin-center scale-x-0 bg-zinc-500/70 transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 group-active:scale-x-100"
  />
</button>
```

## Grid tile base

```tsx
<section className="photo-grid -mx-5 grid grid-cols-3 gap-px pb-8 sm:mx-0 sm:grid-cols-3">
  <button className="photo-tile group relative overflow-hidden transition-transform duration-150 ease-out active:scale-[0.97]">
    {/* image */}
  </button>
</section>
```

```css
.photo-grid { gap: 1px; }
.photo-tile {
  border-radius: 0;
  border: 0;
  box-shadow: none;
  aspect-ratio: 4 / 5;
}
```

---

If this design language evolves, update this file first so all downstream projects can stay in sync.
