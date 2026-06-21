import { createContext, useContext, useState } from 'react'
import { loadProfile, saveProfileToStorage } from '../lib/storage.js'
import { resolveTargets } from '../lib/profile.js'

const Ctx = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => loadProfile())

  function saveProfile(p) {
    saveProfileToStorage(p)
    setProfile(p)
  }

  // resolveTargets handles null gracefully (returns 2000 kcal fallbacks)
  const targets = resolveTargets(profile)

  return (
    <Ctx.Provider value={{ profile, saveProfile, targets }}>
      {children}
    </Ctx.Provider>
  )
}

export const useProfile = () => useContext(Ctx)
