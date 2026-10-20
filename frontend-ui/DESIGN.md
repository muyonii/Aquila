# Aquila Design System Tokens

## Palette
- Canvas: `#f4f5f8`
- Surface: `#ffffff`
- Text Primary: `#0f172a` (Slate-900, 16.8:1)
- Text Secondary: `#475569` (Slate-600, 5.3:1 - WCAG AA)
- Border: `#cbd5e1` (Slate-300, 3.1:1 UI component contrast)
- Border Subtle: `#e2e8f0` (Slate-200)
- Brand Accent: `#0c4a6e` (Deep Ocean Sky-900, AA) | Hover: `#075985`
- Success: `#047857` (Emerald-700) | Bg: `#ecfdf5` | Border: `#a7f3d0`
- Warning: `#b45309` (Amber-700) | Bg: `#fffbeb` | Border: `#fde68a`
- Danger: `#b91c1c` (Rose-700) | Bg: `#fff1f2` | Border: `#fecdd3`

## Typography Scale
- Title: 24px (1.5rem) / 30px (1.875rem), bold, text-[#0c4a6e] or text-slate-900
- Section Heading: 18px (1.125rem) / 20px (1.25rem), semibold
- Body (Primary): 16px (1rem), line-height 1.5, regular/medium (text-slate-900)
- Secondary / Meta: 14px (0.875rem), medium (text-slate-600)
- Micro / Badge / Monospace: 12px (0.75rem), semibold, never under 12px

## Geometry & Spacing
- Spacing: 4px, 8px, 12px, 16px, 20px, 24px, 32px
- Radius Pair: Control `12px` (`rounded-xl`), Card/Modal `16px` (`rounded-2xl`)
- Shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)` (`shadow-sm`)
- Border Style: Solid 1px, `#cbd5e1` or `#e2e8f0`
- Focus Ring: `ring-2 ring-[#0c4a6e] ring-offset-2 outline-none`

## Component Patterns
- Button Primary: `bg-[#0c4a6e] hover:bg-[#075985] text-white text-sm font-semibold h-10 px-4 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0c4a6e] focus:ring-offset-2`
- Button Secondary: `bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold h-10 px-4 rounded-xl border border-slate-300 shadow-sm`
- Button Danger: `bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold h-10 px-4 rounded-xl shadow-sm`
- Input: `w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-base h-11 px-3.5 rounded-xl outline-none focus:border-[#0c4a6e] focus:ring-2 focus:ring-[#0c4a6e]/20`
- Card: `bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm`
- Badge: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border`
- Table: `w-full text-left border-collapse text-sm; th: py-3 px-4 bg-slate-50 text-slate-700 font-semibold border-b border-slate-200; td: py-3.5 px-4 text-slate-900 border-b border-slate-200`
- Modal: `bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6`
