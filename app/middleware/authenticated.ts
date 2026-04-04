export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, isInitialLoading } = useAuth();

  // If we are still doing the initial Firebase check, wait for it
  if (isInitialLoading.value) {
    await new Promise((resolve) => {
      const stopWatch = watch(isInitialLoading, (loading) => {
        if (!loading) {
          stopWatch();
          resolve(true);
        }
      });
    });
  }

  // Now we can safely check the login status
  if (!isLoggedIn.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});
