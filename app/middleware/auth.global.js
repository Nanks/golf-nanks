export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();

  if (!authStore.isInitialized) {
    console.log('⏳ Middleware: Waiting for Firebase Auth...');
    await authStore.waitForAuth();
  }

  const authOnlyRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthOnlyRoute = authOnlyRoutes.includes(to.path);

  // Viewing (home, league menus, calendar, roster, results, leaderboards) is
  // public -- anyone, signed in or not, can look at live and past rounds.
  // Only routes that start a round, edit data, or expose admin/debug tooling
  // require a signed-in user; Firestore rules enforce the same boundary
  // server-side regardless of what this middleware allows.
  const protectedPrefixes = ['/rounds/', '/profile', '/migrate', '/handicap-debug', '/admin'];
  const isProtectedRoute = protectedPrefixes.some(prefix => to.path.startsWith(prefix));

  // 1. User is NOT logged in, trying to reach a route that requires it
  if (!authStore.isLoggedIn && isProtectedRoute) {
    console.warn('🚫 Middleware: Unauthorized access, redirecting to login');
    return navigateTo('/login');
  }

  // 2. User IS logged in, but trying to access the login/register page
  if (authStore.isLoggedIn && isAuthOnlyRoute) {
    console.log('🔄 Middleware: Already logged in, redirecting to home');
    return navigateTo('/');
  }

  console.log('✅ Middleware: Authorized for', to.path);
});