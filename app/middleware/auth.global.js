export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  // Define routes that REQUIRE being logged in
  const protectedRoutes = ['/round/start', '/admin', '/profile/edit'];

  // If the user is trying to access a protected route and isn't logged in
  if (protectedRoutes.includes(to.path) && !authStore.userProfile) {
    return navigateTo('/login');
  }
});
