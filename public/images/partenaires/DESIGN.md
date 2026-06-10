---
name: Le Flux Électrique
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e1eb'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e2e1eb'
  inverse-on-surface: '#2f3037'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#d1ffd7'
  on-secondary: '#003919'
  secondary-container: '#00f781'
  on-secondary-container: '#006c35'
  tertiary: '#ffb77a'
  on-tertiary: '#4c2700'
  tertiary-container: '#d7790d'
  on-tertiary-container: '#432100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#61ff97'
  secondary-fixed-dim: '#00e477'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ffb77a'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6d3a00'
  background: '#12131a'
  on-background: '#e2e1eb'
  surface-variant: '#33343c'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  technical-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  score-display:
    fontFamily: JetBrains Mono
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system for the premier esports platform in Pointe-Noire moves away from tired "gamer" tropes toward a **Precision Cockpit HUD** aesthetic. The personality is focused, high-performance, and "Gaming-Premium"—evoking the intensity of professional EA Sports FC competition through deep spatial layering rather than superficial decoration.

The style, **Le Flux Électrique**, prioritizes atmospheric depth and luminescent hierarchy. It avoids carbon fiber and heavy borders in favor of "No-Line" depth, using tonal surface shifts and subtle colored glows to guide the eye. The emotional response should be one of serious athletic competition, technical sophistication, and high-energy momentum.

## Colors
This design system utilizes a tiered dark-mode architecture. The palette is anchored by a deep blue-black background, with three successive surface levels that create a sense of mechanical depth without the need for borders.

The **Primary Violet** represents the energy of the "Flux," used for interactive states and focus indicators. **Neon Green** is reserved strictly for success states and financial transactions (paid status), providing a high-contrast visual punch. To ensure local relevance, official **MTN Yellow** and **Airtel Red** are integrated specifically for payment methods and regional partnerships, treated with the same precision as the core brand colors.

## Typography
The typographic hierarchy is split between **Inter** for UI and narrative elements, and **JetBrains Mono** for all technical, numeric, and competitive data. 

Headers are always uppercase with wider tracking to evoke a widescreen cinematic feel. Body text utilizes lighter weights (300-400) to maintain a clean, high-tech aesthetic. JetBrains Mono is used exclusively for countdowns, match scores, prize pools, and player statistics to reinforce the "HUD" concept, ensuring that data is always legible and distinct from the UI labels.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to maintain a concentrated, "cockpit" focus, transitioning to a fluid layout for mobile devices. 

A 12-column grid is used for the main dashboard, with 24px gutters. Spacing follows a strictly linear 8px scale. On mobile, margins are reduced to 16px to maximize screen real estate for game data. All content containers should prioritize internal padding over external margins to emphasize the "No-Line" layering strategy, where blocks of color define the structure rather than empty space or rules.

## Elevation & Depth
This design system employs a **No-Line Rule**. Separation is achieved through **Tonal Layers** (moving from Surface-1 to Surface-3) and **Inner Glows** rather than traditional strokes or drop shadows.

Instead of black shadows, use **Atmospheric Luminescence**. Primary interactive elements (like active buttons or focused inputs) cast a subtle #8b5cf6 glow. Success states and "paid" badges cast a #22ff88 glow. This creates a "backlit" effect, as if the UI is projected on a high-end glass display within a cockpit. The depth hierarchy is always: Background (Lowest) -> Surface-1 (Navigation/Sidebars) -> Surface-2 (Main Cards/Content) -> Surface-3 (Modals/Popovers).

## Shapes
The shape language is sophisticated and varied, moving away from aggressive sharp angles in favor of a range of radii that dictate element importance. 

Small utility items like inputs use an 8px radius for precision. Buttons use 12px for better "tap-ability." Large content containers use 24px or 32px to create a softer, more premium aesthetic that contrasts with the technical, uppercase typography. Full "Pill" shapes are reserved for status badges (e.g., "Live", "Registered") to make them instantly recognizable against the more rectangular layout.

## Components
- **Buttons**: Primary buttons feature a solid #8b5cf6 fill with a scale-down interaction (0.98) on click. No borders. Secondary buttons use Surface-3 with a subtle violet inner glow.
- **Inputs**: Use Surface-2 as the base. On focus, the background transitions slightly toward Surface-3 with a 2px violet glow. Labels use JetBrains Mono in `label-caps`.
- **Match Cards**: Use Surface-2. The "vs" indicator and match time use JetBrains Mono. Team names use Inter Bold. Hovering over a card should trigger a subtle lift and a faint outer glow matching the tournament category color.
- **Progress Bars**: Used for tournament brackets or experience points. Background is Surface-3; the fill is a horizontal gradient from Primary-Dim to Primary-Violet.
- **Chips/Badges**: Small pill-shaped containers. "Live" matches use a pulsing #ff4444 (Danger) dot. "Paid/Confirmed" uses a #22ff88 (Success) background with dark text.
- **Navigation**: Sidebar-based on desktop. Active links are indicated by a vertical "Flux" bar (violet) on the left edge and a subtle tonal shift in the background—no outlines.
- **Motion**: All transitions (hover, focus, page entry) are set to 300ms using a "Power-Out" easing profile to feel snappy and responsive.