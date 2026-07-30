# Van-Link Design System

## Color Tokens
```css
--vl-orange:     #F97316;   /* Primary — Van-Link orange */
--vl-orange-dk:  #EA6A0A;   /* Hover / pressed */
--vl-orange-lt:  #FFF0E6;   /* Tinted background */
--vl-black:      #0F0F0F;   /* Headings */
--vl-grey-900:   #1A1A1A;   /* Body text */
--vl-grey-600:   #6B7280;   /* Muted text */
--vl-grey-200:   #E5E7EB;   /* Borders */
--vl-grey-50:    #F9FAFB;   /* Page background */
--vl-white:      #FFFFFF;   /* Cards */
--vl-green:      #16A34A;   /* Success / delivered */
--vl-green-lt:   #F0FDF4;
--vl-amber:      #D97706;   /* Warning / broadcasting */
--vl-amber-lt:   #FFFBEB;
--vl-red:        #DC2626;   /* Error / suspended */
--vl-red-lt:     #FEF2F2;
--vl-blue:       #2563EB;   /* Info / accepted */
--vl-blue-lt:    #EFF6FF;
```

## Typography
- Display/headings: `font-extrabold tracking-tight` — Botswana-strong, no-nonsense
- Body: system font stack, `text-sm` or `text-base`
- Labels: `text-xs font-semibold uppercase tracking-wide text-grey-600`
- Numbers/stats: `font-bold tabular-nums`

## Spacing & Radius
- Cards: `rounded-2xl` consistently
- Buttons: `rounded-xl` for primary, `rounded-lg` for small
- Page padding: `px-4` mobile
- Card padding: `p-4` standard, `p-5` hero cards

## Signature Element
**The orange status pill** — a full-bleed orange bar at top of driver screens 
showing online status + earnings today. This is the one bold, memorable element 
that makes the driver experience feel purpose-built.

## Bottom Nav
- 5 items max
- Active: orange icon + label, orange dot indicator above
- Inactive: grey icon, no label on inactive (saves space)
- Height: 64px, white bg, top border `--vl-grey-200`, safe-area padding
