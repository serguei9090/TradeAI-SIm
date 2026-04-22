---
name: TradeAI Simulator Default
version: "alpha"
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
  on-primary: "#FFFFFF"
  on-tertiary: "#FFFFFF"
  tertiary-container: "#A13824"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: 3rem
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.tertiary-container}"
---

## Overview

Architectural Minimalism meets Journalistic Gravitas. The UI evokes a premium matte finish — a high-end broadsheet or contemporary gallery.

## Colors

The palette is rooted in high-contrast neutrals and a single accent color.

- **Primary (#1A1C1E):** Deep ink for headlines and core text.
- **Secondary (#6C7278):** Sophisticated slate for borders, captions, metadata.
- **Tertiary (#B8422E):** "Boston Clay" — the sole driver for interaction.
- **Neutral (#F7F5F2):** Warm limestone foundation, softer than pure white.

## Typography

- **Public Sans:** Used for all body copy and headlines. Clean and neutral.
- **Space Grotesk:** Used for small caps labels and metadata. Adds a touch of technical precision.

## Layout

Standard 8px grid system.

- **Spacing Small:** 8px for tight groupings.
- **Spacing Medium:** 16px for standard separation.

## Elevation & Depth

Flat UI. No drop shadows. Contrast is achieved through color and borders.

## Shapes

Slightly rounded corners to soften the harshness of a purely orthogonal layout.

- **Small:** 4px for most interactive elements like buttons and inputs.
- **Medium:** 8px for cards and larger containers.

## Components

### Primary Button

The primary button uses the "Boston Clay" tertiary color for high visibility. It is the main driver of action on any given screen.

## Do's and Don'ts

- **Do** use the tertiary color sparingly, only for primary actions.
- **Don't** use drop shadows. Rely on borders and background colors for depth.
