export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return;

  const authStore = useAuthStore();
  
  if (!authStore.isInitialized) {
    console.log('⏳ Middleware: Waiting for Firebase Auth...');
    await authStore.waitForAuth();
  }

  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(to.path);
  
  // NEW: Hard-protected routes that even guests cannot see
  const strictProtectedRoutes = ['/admin', '/profile/edit'];
  const isStrictProtected = strictProtectedRoutes.includes(to.path) || to.path.startsWith('/rounds/setup');

  // Check for the guest cookie
  const isGuest = useCookie('golf_nanks_guest').value === 'true';

  // 1. User is NOT logged in
  if (!authStore.isLoggedIn) {
    
    // If they are a guest trying to access a strictly protected route -> send to login
    if (isGuest && isStrictProtected) {
      console.warn('🚫 Middleware: Guest trying to access protected route.');
      return navigateTo('/login');
    }

    // If they are NOT a guest, and trying to access a non-public route -> send to login
    if (!isGuest && !isPublicRoute) {
      console.warn('🚫 Middleware: Unauthorized access, redirecting to login');
      return navigateTo('/login');
    }
  }

  // 2. User IS logged in, but trying to access the login/register page
  if (authStore.isLoggedIn && isPublicRoute) {
    console.log('🔄 Middleware: Already logged in, redirecting to home');
    // Optional: Clear the guest cookie if they log in
    useCookie('golf_nanks_guest').value = null; 
    return navigateTo('/');
  }

  console.log('✅ Middleware: Authorized for', to.path);
});