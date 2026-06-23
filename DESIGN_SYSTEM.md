# IPL Verse Design System

This design system establishes the visual foundation for IPL Verse, ensuring a premium, dark-first, product-grade experience inspired by Linear, Raycast, and Vercel.

## 1. Color Scale (Dark-First)

The application uses a strict dark theme foundation. Light mode support is disabled or muted to maintain a consistent premium feel.

- **Background:** `#09090b` (hsl(240 10% 3.9%)) - The deepest background color.
- **Card / Surface:** `#0c0c0e` - A slight elevation for cards and sections.
- **Foreground (Text):** `#fafafa` - Pure high-contrast white for primary text.
- **Muted (Text):** `#a1a1aa` - For secondary text and captions.
- **Border:** `#27272a` (hsl(240 3.7% 15.9%)) - A very subtle outline for definition.

### Brand Colors
- **Primary:** `#10b981` (Emerald Green) - Used for primary actions, active states, and positive indicators.
- **Secondary:** `#27272a` - Used for secondary buttons and passive UI elements.
- **Success:** Emerald
- **Warning:** `#f59e0b` (Amber)
- **Danger:** `#ef4444` (Red)

## 2. Typography Hierarchy

We use a two-font system: **Outfit** for Display and Headings, **Inter** for Body text. Arbitrary sizes are avoided.

| Token | Class | Font | Weight | Description |
|---|---|---|---|---|
| **Display** | `.text-display` | Outfit | Bold/ExtraBold | Large hero sections, tight tracking, leading none. |
| **Heading** | `.text-heading` | Outfit | SemiBold | Page titles, major sections, modal headers. |
| **Subheading** | `.text-subheading` | Outfit | Medium | Secondary titles, card headers. |
| **Body** | `.text-body` | Inter | Normal | Standard reading text, descriptions, informational text. |
| **Caption** | `.text-caption` | Inter | Normal (sm/xs) | Metadata, timestamps, helper text. |

## 3. Spacing System

Layouts and padding use a strict multiple-of-4 scale to maintain a predictable rhythm.

| Token | Class | Value | Usage |
|---|---|---|---|
| **Compact** | `p-1`, `p-2` | 4px, 8px | Inside badges, tight icon groups, inputs. |
| **Normal** | `p-4` | 16px | Standard card padding, list items. |
| **Relaxed** | `p-6` | 24px | Large card padding, modal content. |
| **Loose** | `p-8`, `p-12` | 32px, 48px | Page sections, hero padding. |

*Rule:* Never use arbitrary padding like `p-[15px]` or `gap-7`. Stick to standard tailwind scales.

## 4. Sharp Corners (Border Radius)

We avoid heavily rounded elements to maintain a sharp, professional look.

- **6px (`rounded-md`):** Buttons, Badges, Inputs, small interactive elements.
- **8px (`rounded-lg`):** Standard Cards, small modals.
- **12px (`rounded-xl`):** Large structural containers or major sections.

*Rule:* Avoid `rounded-2xl`, `rounded-3xl`, and `rounded-full` (except for actual circles like avatars).

## 5. Component Library

We extract repeated UI patterns into a library of reusable primitives located in `components/ui` and `components/game`.

- **Card (`components/ui/card.tsx`)**: The foundational container with correct surface color, border, and 8px/12px radius.
- **GameCard (`components/game/game-card.tsx`)**: A specific card layout for showcasing playable games with consistent hover motion.
- **StatCard (`components/game/stat-card.tsx`)**: A dense, metric-focused card for analytics and profile stats.
- **LeaderboardCard (`components/game/leaderboard-card.tsx`)**: A standardized list item layout for rankings.
- **GameHeader (`components/game/game-header.tsx`)**: A unified page header for game modes (Title, back button, timer/action slot).

## 6. Motion Guidelines

- **Duration:** Fast (`duration-200` or `duration-150`).
- **Easing:** `ease-out`.
- **Effects:** Opacity changes, subtle scaling (`hover:scale-[1.01]`).
- *Rule:* No bouncing, no floating, no dramatic transforms.
