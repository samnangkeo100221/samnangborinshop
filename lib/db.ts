import { Expense, Partner, Product, PurchaseRecord, SaleInvoice, StockMovementLog } from '@/types/pos';

const STORAGE_KEYS = {
  PRODUCTS: 'sbs_products_v2',
  INVOICES: 'sbs_invoices_v2',
  PARTNERS: 'sbs_partners_v2',
  EXPENSES: 'sbs_expenses_v2',
  PURCHASES: 'sbs_purchases_v2',
  LOGS: 'sbs_logs_v2',
  EXCHANGE_RATE: 'sbs_exchange_rate_v2',
  THEME_MODE: 'sbs_theme_mode_v2',
  SELECTED_THEME: 'sbs_selected_theme_v2',
  AUTO_THEME: 'sbs_auto_theme_v2',
  SUPABASE_CONFIG: 'sbs_supabase_config_v2',
};

export const DEFAULT_EXCHANGE_RATE = 4100; // 4,100 KHR = 1 USD

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P001',
    barcodeCase: '8841234567890',
    barcodePart: '8841234567891',
    barcodeUnit: '8841234567892',
    productname: 'ស្រាបៀរ អង្គរ (Angkor Beer Cans)',
    type: 'ស្រា & ស្រាបៀរ',
    unitName: 'កំប៉ុង',
    partName: 'យួ',
    unitCase: 24,
    partCase: 4,
    unitsPerPart: 6,
    buyUSD: 11.20,
    buyKHR: 45920,
    sellUSD: 12.50,
    sellKHR: 51250,
    partSellUSD: 3.30,
    partSellKHR: 13530,
    unitSellUSD: 0.60,
    unitSellKHR: 2500,
    profit: 1.30,
    stockHome: 35,
    stockWarehouse: 120,
    stock: 155,
    minStock: 25,
    image: 'https://picsum.photos/seed/angkorbeer/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P002',
    barcodeCase: '8852345678901',
    barcodePart: '8852345678902',
    barcodeUnit: '8852345678903',
    productname: 'ស្រាបៀរ ហនុមាន ព្រីមៀម (Hanuman Premium Beer)',
    type: 'ស្រា & ស្រាបៀរ',
    unitName: 'កំប៉ុង',
    partName: 'យួ',
    unitCase: 24,
    partCase: 4,
    unitsPerPart: 6,
    buyUSD: 13.00,
    buyKHR: 53300,
    sellUSD: 14.50,
    sellKHR: 59450,
    partSellUSD: 3.80,
    partSellKHR: 15580,
    unitSellUSD: 0.70,
    unitSellKHR: 2800,
    profit: 1.50,
    stockHome: 28,
    stockWarehouse: 85,
    stock: 113,
    minStock: 20,
    image: 'https://picsum.photos/seed/hanumanbeer/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P003',
    barcodeCase: '8843456789012',
    barcodePart: '8843456789013',
    barcodeUnit: '8843456789014',
    productname: 'ស្រាបៀរ គ្រុឌ (Krud Beer Premium Cans)',
    type: 'ស្រា & ស្រាបៀរ',
    unitName: 'កំប៉ុង',
    partName: 'យួ',
    unitCase: 24,
    partCase: 4,
    unitsPerPart: 6,
    buyUSD: 10.80,
    buyKHR: 44280,
    sellUSD: 12.00,
    sellKHR: 49200,
    partSellUSD: 3.20,
    partSellKHR: 13120,
    unitSellUSD: 0.55,
    unitSellKHR: 2200,
    profit: 1.20,
    stockHome: 15,
    stockWarehouse: 40,
    stock: 55,
    minStock: 15,
    image: 'https://picsum.photos/seed/krudbeer/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P004',
    barcodeCase: '8854567890123',
    barcodePart: '8854567890124',
    barcodeUnit: '8854567890125',
    productname: 'ភេសជ្ជៈ ស្ទីង ក្រហម (Sting Energy Drink Red)',
    type: 'ភេសជ្ជៈ & ទឹកផ្លែឈើ',
    unitName: 'ដប',
    partName: 'យួ',
    unitCase: 24,
    partCase: 4,
    unitsPerPart: 6,
    buyUSD: 8.50,
    buyKHR: 34850,
    sellUSD: 9.80,
    sellKHR: 40180,
    partSellUSD: 2.60,
    partSellKHR: 10660,
    unitSellUSD: 0.50,
    unitSellKHR: 2000,
    profit: 1.30,
    stockHome: 45,
    stockWarehouse: 90,
    stock: 135,
    minStock: 30,
    image: 'https://picsum.photos/seed/stingenergy/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P005',
    barcodeCase: '8855678901234',
    barcodePart: '8855678901235',
    barcodeUnit: '8855678901236',
    productname: 'ភេសជ្ជៈ ការ៉ាបាវ (Carabao Energy Drink)',
    type: 'ភេសជ្ជៈ & ទឹកផ្លែឈើ',
    unitName: 'កំប៉ុង',
    partName: 'យួ',
    unitCase: 24,
    partCase: 4,
    unitsPerPart: 6,
    buyUSD: 8.20,
    buyKHR: 33620,
    sellUSD: 9.50,
    sellKHR: 38950,
    partSellUSD: 2.50,
    partSellKHR: 10250,
    unitSellUSD: 0.50,
    unitSellKHR: 2000,
    profit: 1.30,
    stockHome: 8,
    stockWarehouse: 14,
    stock: 22,
    minStock: 25, // Alert low stock
    image: 'https://picsum.photos/seed/carabaocan/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P006',
    barcodeCase: '8856789012345',
    barcodePart: '8856789012346',
    barcodeUnit: '8856789012347',
    productname: 'កូកាកូឡា កំប៉ុង (Coca-Cola Original 330ml)',
    type: 'ភេសជ្ជៈ & ទឹកផ្លែឈើ',
    unitName: 'កំប៉ុង',
    partName: 'យួ',
    unitCase: 24,
    partCase: 4,
    unitsPerPart: 6,
    buyUSD: 9.00,
    buyKHR: 36900,
    sellUSD: 10.50,
    sellKHR: 43050,
    partSellUSD: 2.80,
    partSellKHR: 11480,
    unitSellUSD: 0.50,
    unitSellKHR: 2100,
    profit: 1.50,
    stockHome: 30,
    stockWarehouse: 60,
    stock: 90,
    minStock: 20,
    image: 'https://picsum.photos/seed/cocacolacan/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P007',
    barcodeCase: '8847890123456',
    barcodePart: '8847890123457',
    barcodeUnit: '8847890123458',
    productname: 'ទឹកបរិសុទ្ធ វីតាល់ (Vital Premium Water 350ml)',
    type: 'ទឹកបរិសុទ្ធ',
    unitName: 'ដប',
    partName: 'យួ',
    unitCase: 24,
    partCase: 2,
    unitsPerPart: 12,
    buyUSD: 3.20,
    buyKHR: 13120,
    sellUSD: 4.00,
    sellKHR: 16400,
    partSellUSD: 2.10,
    partSellKHR: 8610,
    unitSellUSD: 0.25,
    unitSellKHR: 1000,
    profit: 0.80,
    stockHome: 50,
    stockWarehouse: 200,
    stock: 250,
    minStock: 40,
    image: 'https://picsum.photos/seed/vitalwater/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'P008',
    barcodeCase: '8848901234567',
    barcodePart: '8848901234568',
    barcodeUnit: '8848901234569',
    productname: 'បារី ៥៥៥ អង់គ្លេស (State Express 555 Gold)',
    type: 'បារី',
    unitName: 'កញ្ចប់',
    partName: 'ឡូ',
    unitCase: 50,
    partCase: 5,
    unitsPerPart: 10,
    buyUSD: 68.00,
    buyKHR: 278800,
    sellUSD: 74.00,
    sellKHR: 303400,
    partSellUSD: 15.20,
    partSellKHR: 62320,
    unitSellUSD: 1.60,
    unitSellKHR: 6500,
    profit: 6.00,
    stockHome: 6,
    stockWarehouse: 18,
    stock: 24,
    minStock: 10,
    image: 'https://picsum.photos/seed/555cigarette/200/200',
    updatedAt: '2026-11-04T00:00:00.000Z',
  },
];

export const INITIAL_PARTNERS: Partner[] = [
  {
    id: 'PART-000',
    name: 'អតិថិជនទូទៅ (Walk-in)',
    phone: '012 000 000',
    address: 'ទូទៅ',
    type: 'customer',
    totalBoughtUSD: 0,
    totalBoughtKHR: 0,
    totalPaidUSD: 0,
    totalPaidKHR: 0,
    currentDebtUSD: 0,
    currentDebtKHR: 0,
  },
  {
    id: 'PART-001',
    name: 'ម៉ាត ផល្លា ផ្សារដើមថ្កូវ',
    phone: '012 334 455',
    address: 'ផ្លូវលេខ ៤៣០ ផ្សារដើមថ្កូវ ភ្នំពេញ',
    type: 'customer',
    totalBoughtUSD: 450.00,
    totalBoughtKHR: 1845000,
    totalPaidUSD: 350.00,
    totalPaidKHR: 1435000,
    currentDebtUSD: 100.00,
    currentDebtKHR: 410000,
    note: 'ម៉ូយប្រចាំ ជំពាក់បានត្រឹម $200',
  },
  {
    id: 'PART-002',
    name: 'តូបមីង សុខា ទួលទំពូង',
    phone: '098 776 655',
    address: 'ក្បែរវត្តទួលទំពូង ភ្នំពេញ',
    type: 'customer',
    totalBoughtUSD: 280.00,
    totalBoughtKHR: 1148000,
    totalPaidUSD: 280.00,
    totalPaidKHR: 1148000,
    currentDebtUSD: 0,
    currentDebtKHR: 0,
    note: 'បង់លុយដាច់ជាប់ជានិច្ច',
  },
  {
    id: 'PART-003',
    name: 'ដេប៉ូចែកចាយធំ ខេមរភូមិន្ទ (អ្នកផ្គត់ផ្គង់)',
    phone: '085 221 133',
    address: 'ផ្លូវជាតិលេខ ៣ ភ្នំពេញ',
    type: 'supplier',
    totalBoughtUSD: 0,
    totalBoughtKHR: 0,
    totalPaidUSD: 0,
    totalPaidKHR: 0,
    currentDebtUSD: 0,
    currentDebtKHR: 0,
    note: 'ផ្គត់ផ្គង់ស្រាបៀរ និងភេសជ្ជៈគ្រប់មុខ',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-001',
    date: '2026-11-02',
    category: 'ថ្លៃដឹកជញ្ជូន',
    title: 'ថ្លៃសាំងឡានដឹកទំនិញចូលស្តុក',
    amountUSD: 25.00,
    amountKHR: 102500,
    paidBy: 'បូរិន',
    note: 'ឡានដឹកពីភ្នំពេញ',
  },
  {
    id: 'EXP-002',
    date: '2026-11-03',
    category: 'ទឹកភ្លើង/Net',
    title: 'ថ្លៃភ្លើងហាង & ឃ្លាំងត្រជាក់',
    amountUSD: 60.00,
    amountKHR: 246000,
    paidBy: 'សំណាង',
  },
  {
    id: 'EXP-003',
    date: '2026-11-04',
    category: 'អាហារ',
    title: 'បាយថ្ងៃត្រង់កម្មករប៉ះស្តុក ៣នាក់',
    amountUSD: 12.00,
    amountKHR: 49200,
    paidBy: 'បូរិន',
  },
];

export const INITIAL_INVOICES: SaleInvoice[] = [
  {
    id: 'INV-20261103-001',
    invoiceNo: 'SB-00101',
    date: '2026-11-02T10:30:00.000Z',
    partnerId: 'PART-002',
    partnerName: 'តូបមីង សុខា ទួលទំពូង',
    partnerPhone: '098 776 655',
    items: [
      {
        id: 'ci_1',
        product: INITIAL_PRODUCTS[0],
        saleLevel: 'case',
        unitLabel: 'កេស',
        location: 'home',
        qty: 10,
        priceUSD: 12.50,
        priceKHR: 51250,
        costUSD: 11.20,
        costKHR: 45920,
        subtotalUSD: 125.00,
        subtotalKHR: 512500,
        profitUSD: 13.00,
        profitKHR: 53300,
      },
      {
        id: 'ci_2',
        product: INITIAL_PRODUCTS[3],
        saleLevel: 'case',
        unitLabel: 'កេស',
        location: 'warehouse',
        qty: 5,
        priceUSD: 9.80,
        priceKHR: 40180,
        costUSD: 8.50,
        costKHR: 34850,
        subtotalUSD: 49.00,
        subtotalKHR: 200900,
        profitUSD: 6.50,
        profitKHR: 26650,
      },
    ],
    totalUSD: 174.00,
    totalRiel: 713400,
    totalProfitUSD: 19.50,
    totalProfitRiel: 79950,
    exchangeRate: 4100,
    paymentType: 'paid',
    paidUSD: 174.00,
    paidRiel: 713400,
    dueUSD: 0,
    dueRiel: 0,
    debtStatus: 'settled',
    repayments: [],
    note: 'បង់លុយសុទ្ធគ្រប់ចំនួន',
  },
  {
    id: 'INV-20261104-002',
    invoiceNo: 'SB-00102',
    date: '2026-11-03T14:15:00.000Z',
    partnerId: 'PART-001',
    partnerName: 'ម៉ាត ផល្លា ផ្សារដើមថ្កូវ',
    partnerPhone: '012 334 455',
    items: [
      {
        id: 'ci_3',
        product: INITIAL_PRODUCTS[1],
        saleLevel: 'case',
        unitLabel: 'កេស',
        location: 'home',
        qty: 15,
        priceUSD: 14.50,
        priceKHR: 59450,
        costUSD: 13.00,
        costKHR: 53300,
        subtotalUSD: 217.50,
        subtotalKHR: 891750,
        profitUSD: 22.50,
        profitKHR: 92250,
      },
      {
        id: 'ci_4',
        product: INITIAL_PRODUCTS[6],
        saleLevel: 'case',
        unitLabel: 'កេស',
        location: 'warehouse',
        qty: 10,
        priceUSD: 4.00,
        priceKHR: 16400,
        costUSD: 3.20,
        costKHR: 13120,
        subtotalUSD: 40.00,
        subtotalKHR: 164000,
        profitUSD: 8.00,
        profitKHR: 32800,
      },
    ],
    totalUSD: 257.50,
    totalRiel: 1055750,
    totalProfitUSD: 30.50,
    totalProfitRiel: 125050,
    exchangeRate: 4100,
    paymentType: 'partial',
    paidUSD: 157.50,
    paidRiel: 645750,
    dueUSD: 100.00,
    dueRiel: 410000,
    dueDate: '2026-11-10',
    debtStatus: 'partial',
    repayments: [
      {
        id: 'rep_1',
        date: '2026-11-03T16:00:00.000Z',
        amountUSD: 57.50,
        amountKHR: 235750,
        note: 'កក់ប្រាក់លើកទី១',
      },
    ],
    note: 'ជំពាក់ $100 សន្យាសងចុងសប្តាហ៍',
  },
];

export const INITIAL_LOGS: StockMovementLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-11-01T08:00:00.000Z',
    productId: 'P001',
    productName: 'ស្រាបៀរ អង្គរ (Angkor Beer Cans)',
    type: 'purchase',
    targetLocation: 'warehouse',
    qty: 100,
    unit: 'កេស',
    reference: 'PO-20261101',
    user: 'សំណាង',
    note: 'នាំចូលស្តុកធំ',
  },
  {
    id: 'LOG-002',
    timestamp: '2026-11-02T09:30:00.000Z',
    productId: 'P001',
    productName: 'ស្រាបៀរ អង្គរ (Angkor Beer Cans)',
    type: 'transfer',
    sourceLocation: 'warehouse',
    targetLocation: 'home',
    qty: 20,
    unit: 'កេស',
    reference: 'TR-001',
    user: 'បូរិន',
    note: 'ផ្ទេរមកដាក់ហាងខាងមុខ',
  },
];

// Offline DB Access Functions
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function getStoredInvoices(): SaleInvoice[] {
  if (typeof window === 'undefined') return INITIAL_INVOICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: SaleInvoice[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}

export function getStoredPartners(): Partner[] {
  if (typeof window === 'undefined') return INITIAL_PARTNERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTNERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(INITIAL_PARTNERS));
      return INITIAL_PARTNERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PARTNERS;
  }
}

export function savePartners(partners: Partner[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
}

export function getStoredExpenses(): Expense[] {
  if (typeof window === 'undefined') return INITIAL_EXPENSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function getStoredLogs(): StockMovementLog[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOGS;
  }
}

export function saveLogs(logs: StockMovementLog[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function getStoredPurchases(): PurchaseRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePurchases(purchases: PurchaseRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
}

export function getExchangeRate(): number {
  if (typeof window === 'undefined') return DEFAULT_EXCHANGE_RATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE);
    return raw ? Number(raw) || DEFAULT_EXCHANGE_RATE : DEFAULT_EXCHANGE_RATE;
  } catch {
    return DEFAULT_EXCHANGE_RATE;
  }
}

export function saveExchangeRate(rate: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, String(rate));
}

export function resetAllDataToDefault(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(INITIAL_PARTNERS));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, String(DEFAULT_EXCHANGE_RATE));
}
