// localStorage helpers — structured to support multiple profiles in future.
// Keys are namespaced; always use these functions instead of direct access.
const PROFILE_KEY = 'nutrition-profile'

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw).default ?? null
  } catch { return null }
}

export function saveProfileToStorage(p) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    const store = raw ? JSON.parse(raw) : {}
    store.default = p
    localStorage.setItem(PROFILE_KEY, JSON.stringify(store))
  } catch {}
}
