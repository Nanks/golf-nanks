import { computed, unref } from 'vue'

// Known league IDs mapped to their custom vector logo component, along with
// each logo's default gradient end color (used when the league has no custom theme)
export const LEAGUE_LOGOS = {
  smss: { id: 'KqyvWn81FCGEhsRx4tfI', endColor: '#10b981' },
  vegas: { id: 'I7LCsEb1va49YU1lkRmu', endColor: '#EA580C' },
  ssc: { id: 'vcx75B9fY6uqgAuNo0rL', endColor: '#34d399' },
  t4g: { id: 'XFPsVFZpDcEovzod5oJ0', endColor: 'var(--color-purple-600)' }
}

// league can be a plain league object or a ref/getter returning one
export const useLeagueLogo = (league) => {
  const resolved = computed(() => unref(typeof league === 'function' ? league() : league) || {})
  const id = computed(() => resolved.value.id || '')

  const isSmss = computed(() => id.value === LEAGUE_LOGOS.smss.id)
  const isVegas = computed(() => id.value === LEAGUE_LOGOS.vegas.id)
  const isSsc = computed(() => id.value === LEAGUE_LOGOS.ssc.id)
  const isT4g = computed(() => id.value === LEAGUE_LOGOS.t4g.id)

  // Matches the endColor actually rendered by the logo, so any UI referencing
  // the league's theme (e.g. the league name) can tie into the same color
  const themeEndColor = computed(() => {
    const customEndColor = resolved.value.theme?.endColor
    if (isSmss.value) return customEndColor || LEAGUE_LOGOS.smss.endColor
    if (isVegas.value) return customEndColor || LEAGUE_LOGOS.vegas.endColor
    if (isSsc.value) return customEndColor || LEAGUE_LOGOS.ssc.endColor
    if (isT4g.value) return customEndColor || LEAGUE_LOGOS.t4g.endColor
    return customEndColor || null
  })

  return { isSmss, isVegas, isSsc, isT4g, themeEndColor }
}
