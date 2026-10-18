import type { OsvVuln } from './types'

export function extractFixVersion(osvVuln: OsvVuln): string {
  for (const affected of osvVuln.affected ?? []) {
    for (const range of affected.ranges ?? []) {
      for (const event of range.events ?? []) {
        if (event.fixed) return event.fixed
      }
    }
  }
  return ''
}
