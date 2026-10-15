# Reference-based glass theme refinement — 15 October 2026

Implemented against the user's two supplied dark/light UI showcases, rather than the stronger-glow generated concept.

## Changes

- Dark: navy-black background, soft rose lighting, muted translucent panels and restrained borders.
- Light: peach-to-lavender background, shaded pastel spheres and frosted panels.
- Shared glossy pink buttons in dark mode and peach/pink/lilac gradients in light mode.
- Compact Discovery rows with small portraits, names, interest pills and the existing Pass, Super Like and Like controls. Full bio and remaining interests stay available on profile detail.
- Bottom navigation aligned to the lower screen edge, retaining the person and speech-bubble icons.
- Quieter screen headings, centered onboarding headings, and translucent forms across the existing routes.
- Eight-photo grid retains all slots; spacing adjusted to keep four columns on narrow screens.

## Source files changed in this refinement

- src/components/Glass.tsx
- src/components/BottomNav.tsx
- src/theme/ThemeContext.tsx
- src/app/discovery.tsx
- src/app/matches.tsx
- src/app/chats.tsx
- src/app/profile.tsx
- src/app/settings.tsx
- src/screens/WelcomeScreen.tsx
- src/screens/LoginScreen.tsx
- src/screens/AgeVerificationScreen.tsx
- src/screens/CreateAccountScreen.tsx
- src/screens/CreateProfileScreen.tsx

No dependency versions, authentication/data repositories, SQL migrations or database configuration were changed. Existing data, bypass configuration and action handlers were retained.

## Checks and scope

- TypeScript and lint passed after the final profile-grid edit.
- Final Android JavaScript/Hermes export passed after the profile-grid edit (1338 modules); native APK installation and device testing are separate.
- Actual dark/light Discovery, theme switching, age and account screens were inspected in the web preview. Screenshots: reference-dark.png and reference-light.png.
- Final profile grid verified at 320px: four columns, two rows, all eight slots within the screen. Screenshot: reference-profile-form.png.
- This matches the supplied material/color direction, not every pixel or feature pictured. The existing SecondMeet branding and photos remain. No fake online badges, verification, distances, call controls or statistics were added.
- Welcome/Login still need separately supplied clean romantic photographs to reproduce the photographic reference. No collage was used as a screen background and no new portraits were generated.
- Live authentication, Storage uploads and matching were not exercised against Supabase during this visual pass. No SQL executed, no commit and no push.
