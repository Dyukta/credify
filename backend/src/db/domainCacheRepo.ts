import db from "./database";

export interface DomainCacheEntry {
  domain: string;
  domainAgeDays: number | null;
  webPresenceResolves: boolean | null;
  webPresenceStatusCode: number | null;
  isJobBoard: boolean;
  whoisLastChecked: string | null;
  presenceLastChecked: string | null;
}

const WHOIS_TTL_DAYS = 30;
const PRESENCE_TTL_HOURS = 24;

function isStale(lastChecked: string | null, ttlHours: number): boolean {
  if (!lastChecked) return true;
  const checked = new Date(lastChecked).getTime();
  const now = Date.now();
  return now - checked > ttlHours * 60 * 60 * 1000;
}

export function getCachedDomain(domain: string): DomainCacheEntry | null {
  try {
    const row = db
      .prepare(`SELECT * FROM domain_cache WHERE domain = ? LIMIT 1`)
      .get(domain) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      domain: row.domain as string,
      domainAgeDays:
        row.domain_age_days != null ? (row.domain_age_days as number) : null,
      webPresenceResolves:
        row.web_presence_resolves != null
          ? Boolean(row.web_presence_resolves)
          : null,
      webPresenceStatusCode:
        row.web_presence_status_code != null
          ? (row.web_presence_status_code as number)
          : null,
      isJobBoard: Boolean(row.is_job_board),
      whoisLastChecked: row.whois_last_checked as string | null,
      presenceLastChecked: row.presence_last_checked as string | null,
    };
  } catch {
    return null;
  }
}

export function isWhoisStale(entry: DomainCacheEntry): boolean {
  return isStale(entry.whoisLastChecked, WHOIS_TTL_DAYS * 24);
}

export function isPresenceStale(entry: DomainCacheEntry): boolean {
  return isStale(entry.presenceLastChecked, PRESENCE_TTL_HOURS);
}

export function upsertDomainCache(
  domain: string,
  updates: Partial<Omit<DomainCacheEntry, "domain">>
): void {
  try {
    const existing = getCachedDomain(domain);

    if (!existing) {
      db.prepare(
        `INSERT INTO domain_cache
           (domain, domain_age_days, web_presence_resolves,
            web_presence_status_code, is_job_board,
            whois_last_checked, presence_last_checked)
         VALUES
           (@domain, @domainAgeDays, @webPresenceResolves,
            @webPresenceStatusCode, @isJobBoard,
            @whoisLastChecked, @presenceLastChecked)`
      ).run({
        domain,
        domainAgeDays: updates.domainAgeDays ?? null,
        webPresenceResolves:
          updates.webPresenceResolves != null
            ? Number(updates.webPresenceResolves)
            : null,
        webPresenceStatusCode: updates.webPresenceStatusCode ?? null,
        isJobBoard: Number(updates.isJobBoard ?? false),
        whoisLastChecked: updates.whoisLastChecked ?? null,
        presenceLastChecked: updates.presenceLastChecked ?? null,
      });
    } else {
      const fields: string[] = [];
      const values: Record<string, unknown> = { domain };

      if ("domainAgeDays" in updates) {
        fields.push("domain_age_days = @domainAgeDays");
        values.domainAgeDays = updates.domainAgeDays;
        fields.push("whois_last_checked = @whoisLastChecked");
        values.whoisLastChecked = updates.whoisLastChecked ?? new Date().toISOString();
      }
      if ("webPresenceResolves" in updates) {
        fields.push("web_presence_resolves = @webPresenceResolves");
        values.webPresenceResolves =
          updates.webPresenceResolves != null
            ? Number(updates.webPresenceResolves)
            : null;
        fields.push("web_presence_status_code = @webPresenceStatusCode");
        values.webPresenceStatusCode = updates.webPresenceStatusCode ?? null;
        fields.push("presence_last_checked = @presenceLastChecked");
        values.presenceLastChecked =
          updates.presenceLastChecked ?? new Date().toISOString();
      }
      if ("isJobBoard" in updates) {
        fields.push("is_job_board = @isJobBoard");
        values.isJobBoard = Number(updates.isJobBoard);
      }

      if (fields.length === 0) return;

      db.prepare(
        `UPDATE domain_cache SET ${fields.join(", ")} WHERE domain = @domain`
      ).run(values);
    }
  } catch {
   
  }
}