interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlMinutes: number) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    // Cleanup stale entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000).unref();
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

export const urlCache = new MemoryCache<import("../types/AnalysisResult").AnalysisResult>(360);


export const domainPresenceCache = new MemoryCache<{
  resolves: boolean;
  statusCode: number | null;
}>(1440);