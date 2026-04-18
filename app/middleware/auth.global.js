export default defineNuxtRouteMiddleware(async (to, from) => {
  // 1. SSR BYPASS (The Magic Fix)
  // The server has no idea who the user is. If we let the server continue, 
  // it will aggressively redirect logged-in users to the login page on a hard refresh.
  if (import.meta.server) return;

  const authStore = useAuthStore();
  
  // 2. Wait for Firebase (Now guaranteed to only run in the browser)
  if (!authStore.isInitialized) {
    console.log('⏳ Middleware: Waiting for Firebase Auth...');
    await authStore.waitForAuth();
  }

  // 3. Security Logic
  const isLoginPath = to.path === '/login';
  const protectedRoutes = ['/admin', '/profile/edit'];
  const isRoundRoute = to.path.startsWith('/rounds/');

  // Redirect if logged in and trying to access login page
  if (authStore.isLoggedIn && isLoginPath) {
    return navigateTo('/');
  }

  // Redirect to login if accessing a protected route without a profile
  if (!authStore.isLoggedIn && (protectedRoutes.includes(to.path) || isRoundRoute)) {
    console.warn('🚫 Middleware: Unauthorized access, redirecting to login');
    return navigateTo('/login');
  }

  console.log('✅ Middleware: Authorized for', to.path);
});