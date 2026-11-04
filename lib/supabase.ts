import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Expense, Partner, Product, PurchaseRecord, SaleInvoice, StockMovementLog } from '@/types/pos';
import {
  getStoredExpenses,
  getStoredInvoices,
  getStoredLogs,
  getStoredPartners,
  getStoredProducts,
  getStoredPurchases,
  saveExpenses,
  saveInvoices,
  saveLogs,
  savePartners,
  saveProducts,
  savePurchases,
} from './db';

const CONFIG_KEY = 'sbs_supabase_config_v2';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === 'undefined') return { url: '', anonKey: '', autoSync: false };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : { url: '', anonKey: '', autoSync: false };
  } catch {
    return { url: '', anonKey: '', autoSync: false };
  }
}

export function saveSupabaseConfig(cfg: SupabaseConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

let clientInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) return null;

  if (clientInstance && currentUrl === cfg.url && currentKey === cfg.anonKey) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(cfg.url, cfg.anonKey);
    currentUrl = cfg.url;
    currentKey = cfg.anonKey;
    return clientInstance;
  } catch (err) {
    console.error('Failed to init Supabase client', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'URL ត្រូវតែចាប់ផ្តើមដោយ https://' };
    }
    const client = createClient(url, key);
    // Simple ping to test connectivity
    const { error } = await client.from('products').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // 42P01 means relation does not exist yet (table not created), which means credentials are valid!
      if (error.message.includes('relation "products" does not exist')) {
        return { success: true, message: 'ភ្ជាប់ជោគជ័យ! (តារាង "products" មិនទាន់មានក្នុង Supabase អាច Sync ដើម្បីបង្កើត)' };
      }
      return { success: false, message: `កំហុសពី Supabase: ${error.message}` };
    }
    return { success: true, message: 'ភ្ជាប់ទៅកាន់ Supabase បានជោគជ័យ ១០០%!' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, message: `មិនអាចភ្ជាប់បាន: ${msg}` };
  }
}

// Pre-Push / Pre-Pull Analysis
export interface SyncReviewSummary {
  connected: boolean;
  localCounts: {
    products: number;
    invoices: number;
    partners: number;
    expenses: number;
    logs: number;
  };
  remoteCounts: {
    products: number;
    invoices: number;
    partners: number;
    expenses: number;
    logs: number;
  };
  changesToPush: {
    productsNew: number;
    invoicesNew: number;
  };
  statusMessage: string;
}

// Clean and sanitize string IDs to prevent SQL/JSON duplicate conflicts
export function sanitizeId(raw: string): string {
  return String(raw || '').trim().replace(/[^\w-]/g, '_');
}

export async function analyzeSyncStatus(): Promise<SyncReviewSummary> {
  const localProducts = getStoredProducts();
  const localInvoices = getStoredInvoices();
  const localPartners = getStoredPartners();
  const localExpenses = getStoredExpenses();
  const localLogs = getStoredLogs();

  const summary: SyncReviewSummary = {
    connected: false,
    localCounts: {
      products: localProducts.length,
      invoices: localInvoices.length,
      partners: localPartners.length,
      expenses: localExpenses.length,
      logs: localLogs.length,
    },
    remoteCounts: {
      products: 0,
      invoices: 0,
      partners: 0,
      expenses: 0,
      logs: 0,
    },
    changesToPush: {
      productsNew: localProducts.length,
      invoicesNew: localInvoices.length,
    },
    statusMessage: 'មិនទាន់ភ្ជាប់ទៅកាន់ Supabase (ប្រើប្រាស់ទិន្នន័យលើឧបករណ៍ Offline-First)',
  };

  const client = getSupabaseClient();
  if (!client) {
    return summary;
  }

  summary.connected = true;
  summary.statusMessage = 'បានភ្ជាប់ Supabase ត្រៀមត្រួតពិនិត្យទិន្នន័យ';

  try {
    const [pRes, iRes, ptRes, expRes, logRes] = await Promise.allSettled([
      client.from('products').select('id', { count: 'exact', head: true }),
      client.from('invoices').select('id', { count: 'exact', head: true }),
      client.from('partners').select('id', { count: 'exact', head: true }),
      client.from('expenses').select('id', { count: 'exact', head: true }),
      client.from('logs').select('id', { count: 'exact', head: true }),
    ]);

    if (pRes.status === 'fulfilled' && pRes.value.count !== null) summary.remoteCounts.products = pRes.value.count;
    if (iRes.status === 'fulfilled' && iRes.value.count !== null) summary.remoteCounts.invoices = iRes.value.count;
    if (ptRes.status === 'fulfilled' && ptRes.value.count !== null) summary.remoteCounts.partners = ptRes.value.count;
    if (expRes.status === 'fulfilled' && expRes.value.count !== null) summary.remoteCounts.expenses = expRes.value.count;
    if (logRes.status === 'fulfilled' && logRes.value.count !== null) summary.remoteCounts.logs = logRes.value.count;

    summary.changesToPush.productsNew = Math.max(0, summary.localCounts.products - summary.remoteCounts.products);
    summary.changesToPush.invoicesNew = Math.max(0, summary.localCounts.invoices - summary.remoteCounts.invoices);
  } catch (e) {
    console.warn('Sync status analysis error', e);
  }

  return summary;
}

// Push Local -> Cloud
export async function pushLocalToSupabase(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'សូមបញ្ចូល Supabase URL និង Anon Key ជាមុនសិន' };
  }

  try {
    const products = getStoredProducts().map(p => ({
      ...p,
      id: sanitizeId(p.id),
    }));
    const invoices = getStoredInvoices().map(i => ({
      ...i,
      id: sanitizeId(i.id),
      items_json: JSON.stringify(i.items),
      repayments_json: JSON.stringify(i.repayments),
    }));
    const partners = getStoredPartners().map(pt => ({
      ...pt,
      id: sanitizeId(pt.id),
    }));
    const expenses = getStoredExpenses().map(e => ({
      ...e,
      id: sanitizeId(e.id),
    }));

    // Upsert into Supabase
    if (products.length > 0) {
      await client.from('products').upsert(products, { onConflict: 'id' });
    }
    if (partners.length > 0) {
      await client.from('partners').upsert(partners, { onConflict: 'id' });
    }
    if (expenses.length > 0) {
      await client.from('expenses').upsert(expenses, { onConflict: 'id' });
    }
    if (invoices.length > 0) {
      // Store cleaned invoices
      const cleanInv = invoices.map(({ items, repayments, ...rest }) => rest);
      await client.from('invoices').upsert(cleanInv, { onConflict: 'id' });
    }

    return {
      success: true,
      message: `បាន Push ទិន្នន័យទៅកាន់ Supabase ជោគជ័យ! (${products.length} ទំនិញ, ${invoices.length} វិក្កយបត្រ, ${partners.length} ដៃគូ)`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `ការ Push បរាជ័យ: ${msg}` };
  }
}

// Pull Cloud -> Local
export async function pullSupabaseToLocal(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'សូមបញ្ចូល Supabase URL និង Anon Key ជាមុនសិន' };
  }

  try {
    const [pRes, iRes, ptRes, eRes] = await Promise.all([
      client.from('products').select('*'),
      client.from('invoices').select('*'),
      client.from('partners').select('*'),
      client.from('expenses').select('*'),
    ]);

    if (pRes.data && pRes.data.length > 0) {
      saveProducts(pRes.data as Product[]);
    }
    if (ptRes.data && ptRes.data.length > 0) {
      savePartners(ptRes.data as Partner[]);
    }
    if (eRes.data && eRes.data.length > 0) {
      saveExpenses(eRes.data as Expense[]);
    }
    if (iRes.data && iRes.data.length > 0) {
      const restoredInvoices: SaleInvoice[] = iRes.data.map((row: any) => ({
        ...row,
        items: row.items_json ? JSON.parse(row.items_json) : [],
        repayments: row.repayments_json ? JSON.parse(row.repayments_json) : [],
      }));
      saveInvoices(restoredInvoices);
    }

    return {
      success: true,
      message: 'បានទាញយកទិន្នន័យពី Supabase Cloud មកក្នុងទូរស័ព្ទដៃជោគជ័យ!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `ការ Pull បរាជ័យ: ${msg}` };
  }
}
