interface StockEntry {
  id: string;
  name: string;
  "bse-code": string;
  "nse-code": string;
}

let catalog: StockEntry[] = [];
let lastFetched = 0;
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const API_KEY = () => process.env.INDIAN_API_KEY || process.env.VITE_INDIAN_API_KEY || '';

export async function loadCatalog(): Promise<void> {
  try {
    console.log('[Catalog] Fetching stock list from IndianAPI...');
    const t0 = Date.now();
    const res = await fetch('https://dev.indianapi.in/static/all_stocks.json', {
      headers: { 'X-API-Key': API_KEY() }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      catalog = data;
      lastFetched = Date.now();
      console.log(`[Catalog] Loaded ${catalog.length} stocks (${Math.round(Date.now() - t0)}ms)`);
    } else {
      console.error('[Catalog] Invalid response — keeping existing catalog');
    }
  } catch (err: any) {
    console.error(`[Catalog] Failed to fetch: ${err.message} — keeping existing catalog`);
  }
}

export function getCatalog(): StockEntry[] {
  return catalog;
}

export function getCatalogAge(): { count: number; ageMinutes: number } {
  return {
    count: catalog.length,
    ageMinutes: lastFetched ? Math.round((Date.now() - lastFetched) / 60000) : -1
  };
}

export function startCatalogRefresh(): void {
  setInterval(() => {
    loadCatalog();
    loadMfCatalog();
  }, REFRESH_INTERVAL);
}

// ---- Mutual Fund Catalog ----
interface MfEntry {
  id: string;
  mfName: string;
  [key: string]: any;
}

let mfCatalog: MfEntry[] = [];

export async function loadMfCatalog(): Promise<void> {
  try {
    console.log('[MfCatalog] Fetching MF list from IndianAPI...');
    const t0 = Date.now();
    const res = await fetch('https://dev.indianapi.in/static/all_mf.json', {
      headers: { 'X-API-Key': API_KEY() }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    const allFunds: MfEntry[] = [];
    for (const category of Object.values(data)) {
      if (typeof category === 'object' && category !== null) {
        for (const subCat of Object.values(category as Record<string, any>)) {
          if (Array.isArray(subCat)) {
            allFunds.push(...subCat);
          }
        }
      }
    }
    if (allFunds.length > 0) {
      mfCatalog = allFunds;
      console.log(`[MfCatalog] Loaded ${mfCatalog.length} funds (${Math.round(Date.now() - t0)}ms)`);
    }
  } catch (err: any) {
    console.error(`[MfCatalog] Failed to fetch: ${err.message}`);
  }
}

export function getMfCatalog(): MfEntry[] {
  return mfCatalog;
}

export function findMfId(fundName: string): string | null {
  const lower = fundName.toLowerCase();
  const exact = mfCatalog.find(f => f.mfName?.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = mfCatalog.find(f => f.mfName?.toLowerCase().includes(lower) || lower.includes(f.mfName?.toLowerCase()));
  return partial?.id || null;
}
