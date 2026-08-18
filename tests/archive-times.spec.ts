import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  archiveTimeOf,
  formatArchiveTime,
  readArchiveTimes,
  recordArchivedIds,
} from '../src/client/workbench/archive-times.ts'

function installStorage(initial: Record<string, string> = {}): void {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string): string | null => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string): void => { store.set(k, v) },
    removeItem: (k: string): void => { store.delete(k) },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('archive-time ledger', () => {
  it('stamps new archived ids once and keeps earlier stamps', () => {
    installStorage()
    const first = recordArchivedIds(['a', 'b'], 1000)
    expect(first).toEqual({ a: 1000, b: 1000 })
    // A later call must not overwrite existing stamps, only add new ids.
    const second = recordArchivedIds(['b', 'c'], 2000)
    expect(second).toEqual({ a: 1000, b: 1000, c: 2000 })
    expect(readArchiveTimes()).toEqual({ a: 1000, b: 1000, c: 2000 })
  })

  it('leaves the ledger untouched when there is nothing new', () => {
    installStorage()
    recordArchivedIds(['x'], 5)
    expect(recordArchivedIds(['x'], 99)).toEqual({ x: 5 })
  })

  it('ignores a corrupted ledger', () => {
    installStorage({ 'dsh-workbench-archive-times': '{not json' })
    expect(readArchiveTimes()).toEqual({})
    expect(recordArchivedIds(['a'], 7)).toEqual({ a: 7 })
  })

  it('prefers the recorded archive time and falls back to last activity', () => {
    installStorage()
    recordArchivedIds(['a'], 10)
    expect(archiveTimeOf({ a: 10 }, 'a', 20)).toEqual({ at: 10, source: 'archivedAt' })
    expect(archiveTimeOf({}, 'b', 20)).toEqual({ at: 20, source: 'lastActive' })
    expect(archiveTimeOf({}, 'c', 0)).toEqual({ at: 0, source: 'lastActive' })
  })

  it('formats a minute-resolution local timestamp', () => {
    const at = new Date(2026, 7, 18, 9, 5).getTime()
    expect(formatArchiveTime(at)).toBe('2026-08-18 09:05')
    expect(formatArchiveTime(0)).toBe('')
  })
})
