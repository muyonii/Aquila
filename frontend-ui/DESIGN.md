# AQUILA Design System — Authoritative Reference

> Source of truth: pages/admin/dashboard/components/*.jsx + layouts/AdminLayout.jsx

## Container
`border border-slate-200 rounded-md bg-white` — no shadow, no blur, no translucent white.
Radius: `rounded-md` only. Modals: `rounded-lg`. `rounded-full` only for dots and avatars.

## Section Header
```
flex items-baseline justify-between border-b border-slate-200 pb-3
```
Title: `text-base font-semibold text-slate-900`
Action link: `text-sm font-semibold text-[#0c4a6e] hover:underline`

## Lists
`divide-y divide-slate-200` rows — never a card per row.
Row name: `text-sm font-semibold text-slate-900`
Row meta: `text-sm text-slate-600`
Node IDs: `font-mono text-slate-700`

## Stat Strip
One bordered container, `grid divide-x divide-slate-200`.
Label: `text-sm text-slate-600`
Number: `text-[32px] font-semibold tabular-nums text-slate-900`
One factual line below in `text-sm text-slate-600`. No icons, no per-stat boxes.

## Status
Colored `●` dot + plain text label. No filled pills.
- Danger: `text-rose-600`
- Warning: `text-amber-600`
- OK: `text-emerald-600`
- Neutral: `text-slate-600`

## Typography
Body: 16px / 1rem. Secondary: 14px / `text-sm`. Minimum 12px (`text-xs`) only for IDs or timestamps.
Weights: 400, 500, 600 only — no 700+, no `font-bold` on non-headings.
Page title (h1): `text-2xl font-semibold text-slate-900`.
Section title: `text-base font-semibold text-slate-900`.

## Buttons & Inputs
Primary: `bg-[#0c4a6e] text-white h-10 px-4 rounded-md text-sm font-semibold`
Secondary: `border border-slate-300 bg-white text-slate-700 h-10 px-4 rounded-md text-sm font-semibold`
Danger: `bg-rose-700 text-white h-10 px-4 rounded-md text-sm font-semibold`
Inputs: `h-11 rounded-md border-slate-300 text-base`
Focus: `focus-visible:ring-2 focus-visible:ring-[#0c4a6e]`
Row hover: `hover:bg-slate-50`

## Tables
Sticky header `bg-slate-50`, 1px `divide-y divide-slate-200` row rules.
Numbers right-aligned with `tabular-nums`. Status as dot column.

## Sidebar Nav (AdminLayout)
Selected: `border-l-2 border-[#0c4a6e] bg-slate-100 text-slate-900 font-semibold`
Unselected: `border-l-2 border-transparent text-slate-700 hover:bg-slate-50`
Icons: 16px lucide `text-slate-500 stroke-[1.75]`

## Top-bar Nav (Tech/Resident Layouts)
Selected: `border-b-2 border-[#0c4a6e] bg-slate-50 text-slate-900 font-semibold` (desktop)
Mobile: selected = `text-[#0c4a6e] font-semibold`, dot above icon
Touch targets: min 44px

## Kill List
`backdrop-blur-*` · `bg-gradient-*` · `rounded-xl/2xl/3xl` · `text-[9px/10px/11px]`
`font-black` · `font-bold` on non-headings · `animate-pulse` on non-live elements
`shadow-lg/xl/2xl` · `UPPERCASE tracking-wider` eyebrow labels
Icon-in-colored-rounded-square · card-per-item grids · decorative sparklines
Filled pill badges · hover-translate arrows · big centered empty states with icons
