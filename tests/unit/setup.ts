// Minimal in-memory Storage polyfill for Node/Vitest environment
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

const createStorage = () => new MemoryStorage()

// Attach polyfills to the global scope so application code and tests
// can use `localStorage` / `sessionStorage` as usual.
// @ts-expect-error - Node test environment globals
if (typeof globalThis.localStorage === 'undefined') {
  // @ts-expect-error
  globalThis.localStorage = createStorage()
}

// @ts-expect-error
if (typeof globalThis.sessionStorage === 'undefined') {
  // @ts-expect-error
  globalThis.sessionStorage = createStorage()
}

