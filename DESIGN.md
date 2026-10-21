# AQUILA DESIGN SYSTEM: Soft Refined Water Blue

## 1. Palette & Contrast (WCAG AA)
- Canvas: #f2f6f9 | Surface: #ffffff | Line: #dde6ec (1px borders)
- Ink: #0f1f2b | Ink Muted: #4a5b67 (never lighter)
- Brand: #0c4a6e | Primary Button: linear-gradient(180deg, #0f5c85, #0c4a6e), white text
- Tint Gradient (cards/panels): linear-gradient(160deg, #ffffff 0%, #e6f0f6 100%) (only gradient allowed)
- Chart Blues (light to dark): #bcd8e6, #7fb3cc, #3b82a6, #0c4a6e
- State: ok #0f766e (#ecfdf5), warn #b45309 (#fffbeb), danger #b42318 (#fef2f2) (dots, text & pale notices only)

## 2. Radii, Shadows & Spacing
- Radii: card 16px, tile 12px, control 12px, pill rounded-full (chips, tabs, search)
- Shadow: soft = 0 1px 2px rgba(15,31,43,.04), 0 4px 12px rgba(15,31,43,.04) (no heavier shadow)
- Spacing: page padding 24px (p-6), grid gap 20px (gap-5), card padding 20px (p-5)

## 3. Typography & Focus
- Scale: body 16px, secondary 14px, min 12px (IDs, timestamps only). Numbers/KPIs: 32px semibold tabular-nums
- Weights: 400 (normal), 500 (medium), 600 (semibold). No font-bold or font-black
- Hierarchy: Greeting 14px ink-muted over 24px semibold page title
- Focus: 2px solid brand ring on every interactive element (`focus-visible:ring-2 focus-visible:ring-[#0c4a6e]`)

## 4. Components & Layouts
- `.card`: border #dde6ec, rounded-2xl (16px), tint gradient, shadow-soft, p-5
- `.tile`: white, border #dde6ec, rounded-xl (12px), p-4 (at most 1 tile nested in card)
- `.card-foot`: border-t #dde6ec, bg-[#f2f6f9], px-5 py-3, flex justify-between, link-style
- `.icon-chip`: 36px, white, border #dde6ec, rounded-xl, neutral ink icon 18px (no colored bg)
- `.chip`: rounded-full, border #dde6ec, white, h-9 px-3 text-sm font-medium
- `.tab`: text-sm font-medium ink-muted, active = ink + 2px brand underline
- `.btn-primary`: brand gradient, rounded-xl, h-11 px-4 text-white font-medium shadow-soft
- `.btn-secondary`: white, border #dde6ec, rounded-xl, h-11 px-4 text-ink font-medium
- `.input`: h-11 rounded-xl, border #dde6ec, bg-white, px-3 text-sm text-ink
- `.status-dot`: inline-block w-2 h-2 rounded-full

## 5. Guardrails
- No backdrop-blur, glow, colored shadows, neon, extra gradients, emoji, confetti, or animate-pulse
- Icons: Lucide 18px, stroke 1.75, ink/ink-muted only
- Modals: white, rounded-2xl, shadow-soft, border #dde6ec, overlay bg-slate-900/40 (no blur)
- Tables: inside .card, rounded header row on pale tint, 1px row rules, right-aligned numbers
