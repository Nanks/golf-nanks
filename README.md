Project State Summary:

Framework: Nuxt 4 (SSR enabled) + Firebase + Pinia.

Auth: Handled via 01.firebase.ts (Universal) and 02.auth.client.ts. The store uses waitForAuth to prevent middleware race conditions.

Data: Using a hydrateStore pattern in app.vue to fetch public leagues/courses on the server.

Global UI: AppToast, AppLoading, and AppConfirm are wrapped in <ClientOnly> in app.vue.

Calendar Logic: Refactored to a compact "Calendar Block" layout using semantic statuses (complete, rain, practice, handicap) instead of hardcoded MDI strings.

Security: Middleware is bypassed on the server (import.meta.server) to allow the client to handle Firebase session restoration.