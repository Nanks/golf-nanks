// stores/data.js
export const useData = defineStore('data', () => {
  const leagues = ref(new Map())
  const courses = ref(new Map())
  const isBooted = ref(false)

  const bootstrap = async () => {
    isBooted.value = false;
    
    // ONLY fetch the small, shared collections
    const [lMap, cMap] = await Promise.all([
      fetchFullLeaguesData($db),
      fetchFullCourseData($db)
    ]);

    leagues.value = lMap;
    courses.value = cMap;
    isBooted.value = true;
  };

  // Add a helper to fetch specific players only when needed
  const fetchPlayersByIds = async (ids) => {
    if (!ids.length) return [];
    const q = query(collection($db, "players"), where('__name__', 'in', ids));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  return { leagues, courses, isBooted, bootstrap, fetchPlayersByIds }
})