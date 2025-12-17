import { isExpiringSoon as isExpiringSoonImpl } from './dateUtils'

// Thin compatibility wrapper so older imports from `src/utils/date`
// continue to work while the real implementation lives in `dateUtils.ts`.
export const isExpiringSoon = isExpiringSoonImpl

export default {
  isExpiringSoon,
}

