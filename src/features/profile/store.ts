import { defineStore as create } from '@/core/zustand'

interface ProfileState {
  userId: string
  name: string
  panNumber: string
  vatNumber: string
  province: string
  district: string
  city: string
  tole: string
  role: string
  pharmacyId: string
  pharmacyName: string
  pharmacyCode: string
  phone: string
  latitude: number | null
  longitude: number | null
  [key: string]: any
}

interface ProfileStoreState {
  profile: ProfileState
  address: string
  setProfile: (profileData: Partial<ProfileState>) => void
  loadProfile: () => void
  syncWithAuth: () => void
  $reset: () => void
}

const useProfileStore = create<ProfileStoreState>((set, get) => ({
  profile: {
    userId: '',
    name: '',
    panNumber: '',
    vatNumber: '',
    province: '',
    district: '',
    city: '',
    tole: '',
    role: '',
    pharmacyId: '',
    pharmacyName: '',
    pharmacyCode: '',
    phone: '',
    latitude: null,
    longitude: null,
  },
  address: '',
  setProfile: (profileData) =>
    set((state) => ({
      profile: { ...state.profile, ...profileData },
    })),
  loadProfile: () => {
    // Load from local auth or other source
  },
  syncWithAuth: () => {
    // Sync with local auth
  },
  $reset: () =>
    set({
      profile: {
        userId: '',
        name: '',
        panNumber: '',
        vatNumber: '',
        province: '',
        district: '',
        city: '',
        tole: '',
        role: '',
        pharmacyId: '',
        pharmacyName: '',
        pharmacyCode: '',
        phone: '',
        latitude: null,
        longitude: null,
      },
    }),
}))

export { useProfileStore }
