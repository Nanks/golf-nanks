Project State Summary:

Framework: Nuxt 4 (SSR enabled) + Firebase + Pinia.

Auth: Handled via 01.firebase.ts (Universal) and 02.auth.client.ts. The store uses waitForAuth to prevent middleware race conditions.

Data: Using a hydrateStore pattern in app.vue to fetch public leagues/courses on the server.

Global UI: AppToast, AppLoading, and AppConfirm are wrapped in <ClientOnly> in app.vue.

Calendar Logic: Refactored to a compact "Calendar Block" layout using semantic statuses (complete, rain, practice, handicap) instead of hardcoded MDI strings.

Security: Middleware is bypassed on the server (import.meta.server) to allow the client to handle Firebase session restoration.

Project Recap: Golf Nanks (Nuxt 4 Migration)
Current Tech Stack:

Framework: Nuxt 4 (SSR enabled) + Pinia + Firebase.

Styling: Tailwind v4 (using CSS-first configuration in main.css).

Auth: Firebase Universal/Client pattern with waitForAuth in stores to prevent middleware race conditions.

What We Accomplished Today:

Global Design System:

Standardized the UI using a custom @theme in Tailwind v4.

Color Remapping: Remapped emerald to lime and slate to stone globally to create a high-contrast "Golf" aesthetic.

Component Classes: Defined .card-base, .card-interactive, .text-primary (bold/italic/high-tracking), and .text-secondary (uppercase labels) to ensure consistency across all pages.

Component Refactoring:

LeagueHeader: Refactored to use semantic slots and global typography classes.

Roster Page: Cleaned up the player list. Fixed the Admin Mode logic (switched to isAdminForLeague) and moved the Admin Crown icon inline with the player name. Standardized the GHIN edit badge to a circular "floating pencil" style.

Standings Page: Refactored the game-specific standings (e.g., Birds, Deuces). Implemented a "Season Selector" that matches the calendar and a details modal for individual round breakdowns.

Calendar Logic & Navigation Fixes:

Navigation: Replaced problematic dynamic <NuxtLink> components with programmatic navigation (MapsTo) to solve hydration mismatches.

Routing: Established logic where completed/past rounds route to /history while current/live rounds route to /live.

Visuals: Refined the "Calendar Block" layout (Date | Tee | Games). Added logic to hide "Stroke Play" from the games list to reduce clutter, as it is the league default.

Mobile Optimization:

Stripped out all :hover states (since this is a mobile-first field app) and replaced them with active:scale-[0.98] and group-active color flashes for tactile feedback.

Next Steps for the Next Session:

Continue standardizing remaining pages (like the actual scoring/live leaderboard) using the new .text-primary and .card-interactive classes.

Ensure the isClickable logic remains consistent across all list-based views.