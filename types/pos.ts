export type UnitName = 'កញ្ចប់' | 'កំប៉ុង' | 'ដប' | 'kg' | 'L' | 'ថង់' | 'កែវ' | 'ប្រអប់';
export type PartName = 'យួ' | 'ថង់' | 'ឡូ' | 'ខ្សែ' | 'ដុំ' | 'កេស';
export type StockLocation = 'home' | 'warehouse';
export type SaleLevel = 'case' | 'part' | 'unit';
export type PaymentType = 'paid' | 'credit' | 'partial';
export type DebtStatus = 'settled' | 'unpaid' | 'partial';

export interface Product {
  id: string; // SKU or original barcode
  barcodeCase: string;
  barcodePart: string;
  barcodeUnit: string;
  productname: string;
  type: string;
  unitName: UnitName;
  partName: PartName;
  unitCase: number;      // e.g. 24 units per case
  partCase: number;      // e.g. 4 parts per case
  unitsPerPart: number;  // e.g. 6 units per part
  buyUSD: number;
  buyKHR: number;
  sellUSD: number;       // sell price per case
  sellKHR: number;
  partSellUSD: number;   // sell price per part
  partSellKHR: number;
  unitSellUSD: number;   // sell price per unit
  unitSellKHR: number;
  profit: number;        // profit per case in USD
  stockHome: number;     // in case count
  stockWarehouse: number;// in case count
  stock: number;         // stockHome + stockWarehouse
  minStock: number;      // low stock threshold
  image?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string; // unique cart line id
  product: Product;
  saleLevel: SaleLevel;
  unitLabel: string;
  location: StockLocation;
  qty: number;
  priceUSD: number;
  priceKHR: number;
  costUSD: number;
  costKHR: number;
  subtotalUSD: number;
  subtotalKHR: number;
  profitUSD: number;
  profitKHR: number;
}

export interface Repayment {
  id: string;
  date: string;
  amountUSD: number;
  amountKHR: number;
  note: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  partnerId: string;
  partnerName: string;
  partnerPhone?: string;
  items: CartItem[];
  totalUSD: number;
  totalRiel: number;
  totalProfitRiel: number;
  totalProfitUSD: number;
  exchangeRate: number;
  paymentType: PaymentType;
  paidUSD: number;
  paidRiel: number;
  dueUSD: number;
  dueRiel: number;
  dueDate?: string;
  debtStatus: DebtStatus;
  repayments: Repayment[];
  note?: string;
}

export interface Partner {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: 'customer' | 'supplier' | 'both';
  totalBoughtUSD?: number;
  totalBoughtKHR?: number;
  totalPaidUSD?: number;
  totalPaidKHR?: number;
  currentDebtUSD?: number;
  currentDebtKHR?: number;
  note?: string;
}

export interface StockMovementLog {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'transfer' | 'adjustment';
  sourceLocation?: StockLocation;
  targetLocation?: StockLocation;
  qty: number;
  unit: string;
  reference: string;
  user: string;
  note?: string;
}

export type ExpenseCategory = 
  | 'ថ្លៃដឹកជញ្ជូន' 
  | 'ប្រាក់ខែ/ឈ្នួល' 
  | 'ទឹកភ្លើង/Net' 
  | 'អាហារ' 
  | 'ជួលទីតាំង' 
  | 'សម្ភារៈវេចខ្ចប់' 
  | 'ផ្សេងៗ';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  title: string;
  amountUSD: number;
  amountKHR: number;
  paidBy: string;
  note?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  level: SaleLevel;
  qty: number;
  costUSD: number;
  costKHR: number;
  subtotalUSD: number;
  subtotalKHR: number;
}

export interface PurchaseRecord {
  id: string;
  poNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  location: StockLocation;
  items: PurchaseItem[];
  totalUSD: number;
  totalKHR: number;
  status: 'received' | 'pending';
  note?: string;
}

export type ThemeKey = 'orix' | 'rakib' | 'spectra' | 'miami' | 'crypto' | 'ceramic';

export interface AppTheme {
  id: ThemeKey;
  nameKhmer: string;
  nameEn: string;
  colors: {
    bg: string;
    card: string;
    cardHover: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    primaryText: string;
    accent: string;
    accentText: string;
    highlight: string;
  };
}

export type TabKey = 'sale' | 'products' | 'purchase' | 'inspect' | 'partner' | 'dashboard';
