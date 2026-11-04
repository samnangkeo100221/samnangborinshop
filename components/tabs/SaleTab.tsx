'use client';

import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Camera,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Home,
  Warehouse,
  Percent,
  Receipt,
  X,
  CreditCard,
  UserPlus,
  Coins,
  ChevronUp,
  ChevronDown,
  Calculator,
} from 'lucide-react';
import {
  CartItem,
  Partner,
  Product,
  SaleInvoice,
  SaleLevel,
  StockLocation,
  StockMovementLog,
} from '@/types/pos';
import { soundEffects } from '@/lib/audio';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ThermalReceipt } from '@/components/ThermalReceipt';
import { PosNumpad, NumpadMode } from '@/components/PosNumpad';

interface SaleTabProps {
  products: Product[];
  partners: Partner[];
  exchangeRate: number;
  onSaveInvoice: (invoice: SaleInvoice) => void;
  onUpdateProducts: (products: Product[]) => void;
  onAddLog: (log: StockMovementLog) => void;
  onAddPartner: (partner: Partner) => void;
}

function makeInvoiceNo(): string {
  return `SB-${Date.now().toString().slice(-6)}`;
}

function makeInvoiceId(): string {
  return `INV-${Date.now()}`;
}

function makeLogId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makePartnerId(): string {
  return `PART-${Date.now().toString().slice(-4)}`;
}

export const SaleTab: React.FC<SaleTabProps> = ({
  products,
  partners,
  exchangeRate,
  onSaveInvoice,
  onUpdateProducts,
  onAddLog,
  onAddPartner,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Active default settings
  const [activeLocation, setActiveLocation] = useState<StockLocation>('home');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartLineId, setSelectedCartLineId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || 'PART-000');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Numpad State
  const [numpadMode, setNumpadMode] = useState<NumpadMode>('qty');
  const [isNumpadVisible, setIsNumpadVisible] = useState(true);

  // Modals & Drawers
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [recentInvoice, setRecentInvoice] = useState<SaleInvoice | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Payment Form State
  const [paymentType, setPaymentType] = useState<'paid' | 'credit' | 'partial'>('paid');
  const [receivedUSD, setReceivedUSD] = useState<string>('');
  const [receivedKHR, setReceivedKHR] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [invoiceNote, setInvoiceNote] = useState<string>('');

  // Quick Add Partner
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.type));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.type === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchName = p.productname.toLowerCase().includes(q);
      const matchBarcode =
        p.barcodeCase?.toLowerCase().includes(q) ||
        p.barcodePart?.toLowerCase().includes(q) ||
        p.barcodeUnit?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchCat && (matchName || matchBarcode);
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected item in cart for numpad editing
  const selectedCartItem = useMemo(
    () => cart.find((it) => it.id === selectedCartLineId) || cart[cart.length - 1] || null,
    [cart, selectedCartLineId]
  );

  // Handle Barcode Scan match
  const handleBarcodeScan = (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        p.barcodeCase?.toLowerCase() === cleanCode ||
        p.barcodePart?.toLowerCase() === cleanCode ||
        p.barcodeUnit?.toLowerCase() === cleanCode ||
        p.id.toLowerCase() === cleanCode
    );

    if (matched) {
      let levelToUse: SaleLevel = 'case';
      if (matched.barcodePart?.toLowerCase() === cleanCode) levelToUse = 'part';
      if (matched.barcodeUnit?.toLowerCase() === cleanCode) levelToUse = 'unit';

      addToCart(matched, levelToUse, activeLocation);
      soundEffects.playBeep();
    } else {
      soundEffects.playWarning();
      alert(`រកមិនឃើញទំនិញដែលមានបាកូដ: ${code}`);
    }
  };

  // Add product to cart with chosen packaging level
  const addToCart = (product: Product, level: SaleLevel, location: StockLocation, addQty: number = 1) => {
    let unitLabel = 'កេស';
    let priceUSD = product.sellUSD;
    let priceKHR = product.sellKHR;
    let costUSD = product.buyUSD;
    let costKHR = product.buyKHR;

    if (level === 'part') {
      unitLabel = product.partName || 'យួ';
      priceUSD = product.partSellUSD || product.sellUSD / (product.partCase || 1);
      priceKHR = product.partSellKHR || Math.round(priceUSD * exchangeRate);
      costUSD = product.buyUSD / (product.partCase || 1);
      costKHR = Math.round(costUSD * exchangeRate);
    } else if (level === 'unit') {
      unitLabel = product.unitName || 'កំប៉ុង';
      priceUSD = product.unitSellUSD || product.sellUSD / (product.unitCase || 1);
      priceKHR = product.unitSellKHR || Math.round(priceUSD * exchangeRate);
      costUSD = product.buyUSD / (product.unitCase || 1);
      costKHR = Math.round(costUSD * exchangeRate);
    }

    const cartLineId = `${product.id}_${level}_${location}`;
    setSelectedCartLineId(cartLineId);

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartLineId);
      if (existing) {
        return prev.map((item) => {
          if (item.id === cartLineId) {
            const nextQty = item.qty + addQty;
            const subUSD = nextQty * priceUSD;
            const subKHR = nextQty * priceKHR;
            const profUSD = nextQty * (priceUSD - costUSD);
            const profKHR = nextQty * (priceKHR - costKHR);
            return {
              ...item,
              qty: nextQty,
              subtotalUSD: subUSD,
              subtotalKHR: subKHR,
              profitUSD: profUSD,
              profitKHR: profKHR,
            };
          }
          return item;
        });
      }

      const newItem: CartItem = {
        id: cartLineId,
        product,
        saleLevel: level,
        unitLabel,
        location,
        qty: addQty,
        priceUSD,
        priceKHR,
        costUSD,
        costKHR,
        subtotalUSD: priceUSD * addQty,
        subtotalKHR: priceKHR * addQty,
        profitUSD: (priceUSD - costUSD) * addQty,
        profitKHR: (priceKHR - costKHR) * addQty,
      };

      return [...prev, newItem];
    });

    soundEffects.playBeep();
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0, item.qty + delta);
            if (newQty === 0) return null;
            return {
              ...item,
              qty: newQty,
              subtotalUSD: newQty * item.priceUSD,
              subtotalKHR: newQty * item.priceKHR,
              profitUSD: newQty * (item.priceUSD - item.costUSD),
              profitKHR: newQty * (item.priceKHR - item.costKHR),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    if (selectedCartLineId === id) setSelectedCartLineId(null);
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCartLineId(null);
    setDiscountPercent(0);
  };

  // Numpad Key Press Handler
  const handleNumpadNumber = (digit: string) => {
    if (!selectedCartItem) return;

    if (numpadMode === 'qty') {
      const currentStr = String(selectedCartItem.qty);
      const nextStr = currentStr === '0' || currentStr === '1' ? digit : currentStr + digit;
      const nextQty = Number(nextStr) || 1;
      setCart((prev) =>
        prev.map((it) => {
          if (it.id === selectedCartItem.id) {
            return {
              ...it,
              qty: nextQty,
              subtotalUSD: nextQty * it.priceUSD,
              subtotalKHR: nextQty * it.priceKHR,
              profitUSD: nextQty * (it.priceUSD - it.costUSD),
              profitKHR: nextQty * (it.priceKHR - it.costKHR),
            };
          }
          return it;
        })
      );
    } else if (numpadMode === 'discount') {
      const nextDisc = Math.min(100, Number(String(discountPercent) + digit));
      setDiscountPercent(nextDisc);
    } else if (numpadMode === 'price') {
      const currentStr = String(selectedCartItem.priceUSD);
      const nextStr = currentStr === '0' ? digit : currentStr + digit;
      const nextPrice = Number(nextStr) || selectedCartItem.priceUSD;
      setCart((prev) =>
        prev.map((it) => {
          if (it.id === selectedCartItem.id) {
            return {
              ...it,
              priceUSD: nextPrice,
              priceKHR: Math.round(nextPrice * exchangeRate),
              subtotalUSD: it.qty * nextPrice,
              subtotalKHR: Math.round(it.qty * nextPrice * exchangeRate),
              profitUSD: it.qty * (nextPrice - it.costUSD),
              profitKHR: Math.round(it.qty * (nextPrice - it.costUSD) * exchangeRate),
            };
          }
          return it;
        })
      );
    }
    soundEffects.playBeep();
  };

  const handleNumpadBackspace = () => {
    if (!selectedCartItem) return;
    if (numpadMode === 'qty') {
      const str = String(selectedCartItem.qty);
      const nextStr = str.slice(0, -1);
      const nextQty = nextStr ? Number(nextStr) : 1;
      updateCartQty(selectedCartItem.id, nextQty - selectedCartItem.qty);
    } else if (numpadMode === 'discount') {
      const str = String(discountPercent);
      setDiscountPercent(str.length > 1 ? Number(str.slice(0, -1)) : 0);
    }
  };

  const handleNumpadClear = () => {
    if (!selectedCartItem) return;
    if (numpadMode === 'qty') {
      removeFromCart(selectedCartItem.id);
    } else if (numpadMode === 'discount') {
      setDiscountPercent(0);
    }
  };

  const handleNumpadQuickAdd = (amount: number) => {
    if (selectedCartItem) {
      updateCartQty(selectedCartItem.id, amount);
      soundEffects.playBeep();
    }
  };

  // Cart Calculations
  const rawTotalUSD = useMemo(() => cart.reduce((acc, it) => acc + it.subtotalUSD, 0), [cart]);
  const rawTotalKHR = useMemo(() => cart.reduce((acc, it) => acc + it.subtotalKHR, 0), [cart]);
  const rawProfitUSD = useMemo(() => cart.reduce((acc, it) => acc + it.profitUSD, 0), [cart]);
  const rawProfitKHR = useMemo(() => cart.reduce((acc, it) => acc + it.profitKHR, 0), [cart]);

  const discountAmountUSD = (rawTotalUSD * discountPercent) / 100;
  const finalTotalUSD = Math.max(0, rawTotalUSD - discountAmountUSD);
  const finalTotalKHR = Math.round(finalTotalUSD * exchangeRate);
  const finalProfitUSD = Math.max(0, rawProfitUSD - discountAmountUSD);
  const finalProfitKHR = Math.round(finalProfitUSD * exchangeRate);

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      soundEffects.playWarning();
      return;
    }
    setPaymentType('paid');
    setReceivedUSD(finalTotalUSD.toFixed(2));
    setReceivedKHR(finalTotalKHR.toString());
    setIsCheckoutOpen(true);
  };

  // Handle Checkout submission
  const handleCompleteSale = () => {
    const partner = partners.find((p) => p.id === selectedPartnerId) || partners[0];

    const paidInUSD = Number(receivedUSD) || 0;
    const paidInKHR = Number(receivedKHR) || 0;
    const totalPaidInUSD = paidInUSD + paidInKHR / exchangeRate;

    let finalPaymentType = paymentType;
    let dueUSD = 0;
    let dueKHR = 0;
    let debtStatus: 'settled' | 'unpaid' | 'partial' = 'settled';

    if (finalPaymentType === 'credit') {
      dueUSD = finalTotalUSD;
      dueKHR = finalTotalKHR;
      debtStatus = 'unpaid';
    } else if (finalPaymentType === 'partial') {
      dueUSD = Math.max(0, finalTotalUSD - totalPaidInUSD);
      dueKHR = Math.round(dueUSD * exchangeRate);
      debtStatus = dueUSD > 0.05 ? 'partial' : 'settled';
    } else {
      // paid
      if (totalPaidInUSD < finalTotalUSD - 0.05) {
        dueUSD = Math.max(0, finalTotalUSD - totalPaidInUSD);
        dueKHR = Math.round(dueUSD * exchangeRate);
        debtStatus = 'partial';
        finalPaymentType = 'partial';
      }
    }

    const invoiceNo = makeInvoiceNo();
    const newInvoice: SaleInvoice = {
      id: makeInvoiceId(),
      invoiceNo,
      date: new Date().toISOString(),
      partnerId: partner.id,
      partnerName: partner.name,
      partnerPhone: partner.phone,
      items: [...cart],
      totalUSD: Number(finalTotalUSD.toFixed(2)),
      totalRiel: finalTotalKHR,
      totalProfitUSD: Number(finalProfitUSD.toFixed(2)),
      totalProfitRiel: finalProfitKHR,
      exchangeRate,
      paymentType: finalPaymentType,
      paidUSD: Number(paidInUSD.toFixed(2)),
      paidRiel: paidInKHR,
      dueUSD: Number(dueUSD.toFixed(2)),
      dueRiel: dueKHR,
      dueDate: dueDate || undefined,
      debtStatus,
      repayments: [],
      note: invoiceNote || undefined,
    };

    // Deduct stock for each cart item
    const updatedProductsMap = new Map(products.map((p) => [p.id, { ...p }]));

    cart.forEach((item) => {
      const prod = updatedProductsMap.get(item.product.id);
      if (prod) {
        let fraction = item.qty;
        if (item.saleLevel === 'part') {
          fraction = item.qty / (prod.partCase || 4);
        } else if (item.saleLevel === 'unit') {
          fraction = item.qty / (prod.unitCase || 24);
        }

        if (item.location === 'home') {
          prod.stockHome = Math.max(0, Number((prod.stockHome - fraction).toFixed(2)));
        } else {
          prod.stockWarehouse = Math.max(0, Number((prod.stockWarehouse - fraction).toFixed(2)));
        }
        prod.stock = Number((prod.stockHome + prod.stockWarehouse).toFixed(2));
        prod.updatedAt = new Date().toISOString();

        onAddLog({
          id: makeLogId(),
          timestamp: new Date().toISOString(),
          productId: prod.id,
          productName: prod.productname,
          type: 'sale',
          sourceLocation: item.location,
          qty: item.qty,
          unit: item.unitLabel,
          reference: invoiceNo,
          user: 'អ្នកគិតលុយ',
          note: `លក់ចេញ (${item.location === 'home' ? 'ស្តុកផ្ទះ' : 'ឃ្លាំង'})`,
        });
      }
    });

    onUpdateProducts(Array.from(updatedProductsMap.values()));
    onSaveInvoice(newInvoice);

    soundEffects.playCashRegister();
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }

    setIsCheckoutOpen(false);
    setRecentInvoice(newInvoice);
    clearCart();
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    const newPartner: Partner = {
      id: makePartnerId(),
      name: newPartnerName.trim(),
      phone: newPartnerPhone.trim() || '012 xxx xxx',
      address: 'ភ្នំពេញ',
      type: 'customer',
      totalBoughtUSD: 0,
      totalBoughtKHR: 0,
      totalPaidUSD: 0,
      totalPaidKHR: 0,
      currentDebtUSD: 0,
      currentDebtKHR: 0,
    };

    onAddPartner(newPartner);
    setSelectedPartnerId(newPartner.id);
    setNewPartnerName('');
    setNewPartnerPhone('');
    setIsAddPartnerOpen(false);
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 pb-24 lg:pb-6">
      {/* LEFT COLUMN: Catalog & Fast Touch Ordering (Cols 1-7) */}
      <div className="lg:col-span-7 flex flex-col space-y-3">
        {/* Top Control Bar: Search + Barcode Camera + Stock Location */}
        <div className="rounded-2xl p-3 bg-slate-800/90 border border-slate-700 shadow-md space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ស្វែងរកទំនិញ ឬស្កេនបាកូដ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Stock Location Deduct Selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveLocation('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 min-h-[38px] ${
                  activeLocation === 'home'
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>ផ្ទះ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLocation('warehouse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 min-h-[38px] ${
                  activeLocation === 'warehouse'
                    ? 'bg-indigo-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5" />
                <span>ឃ្លាំង</span>
              </button>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow transition active:scale-95 min-h-[44px]"
              title="ស្កេនបាកូដតាមកាមេរ៉ា"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ស្កេន</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-semibold transition shrink-0 min-h-[34px] ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 font-bold shadow'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {cat === 'all' ? 'ទាំងអស់ (All)' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid with DIRECT MULTI-PACKAGING BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[640px] overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const locStock = activeLocation === 'home' ? p.stockHome : p.stockWarehouse;
            const isLow = locStock <= p.minStock / 2;

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between p-3 rounded-2xl bg-slate-800/90 border border-slate-700/90 hover:border-amber-400/80 shadow-md transition"
              >
                <div>
                  {/* Card Header: Product Name + Stock Badge */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-white text-xs leading-snug line-clamp-2">
                      {p.productname}
                    </h4>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        locStock <= 0
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isLow
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {activeLocation === 'home' ? 'ផ្ទះ:' : 'ឃ្លាំង:'} {locStock}កេស
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-2 font-mono">
                    <span>{p.id}</span>
                    <span>·</span>
                    <span className="text-slate-300 font-sans">
                      1កេស = {p.partCase}{p.partName} = {p.unitCase}{p.unitName}
                    </span>
                  </div>
                </div>

                {/* 3 DIRECT MULTI-PACKAGING QUICK-ADD BUTTONS */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700/60">
                  {/* Add 1 Case */}
                  <button
                    type="button"
                    onClick={() => addToCart(p, 'case', activeLocation)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-amber-400/20 border border-slate-700 hover:border-amber-400 active:scale-95 transition min-h-[44px]"
                  >
                    <span className="text-[10px] font-bold text-slate-300">1 កេស</span>
                    <span className="text-xs font-black text-amber-400 tabular-nums">
                      ${p.sellUSD.toFixed(2)}
                    </span>
                  </button>

                  {/* Add 1 Part (Pack/Bundle) */}
                  <button
                    type="button"
                    onClick={() => addToCart(p, 'part', activeLocation)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-cyan-400/20 border border-slate-700 hover:border-cyan-400 active:scale-95 transition min-h-[44px]"
                  >
                    <span className="text-[10px] font-bold text-slate-300">
                      1 {p.partName}
                    </span>
                    <span className="text-xs font-black text-cyan-400 tabular-nums">
                      ${p.partSellUSD.toFixed(2)}
                    </span>
                  </button>

                  {/* Add 1 Unit (Can/Bottle) */}
                  <button
                    type="button"
                    onClick={() => addToCart(p, 'unit', activeLocation)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 hover:bg-emerald-400/20 border border-slate-700 hover:border-emerald-400 active:scale-95 transition min-h-[44px]"
                  >
                    <span className="text-[10px] font-bold text-slate-300">
                      1 {p.unitName}
                    </span>
                    <span className="text-xs font-black text-emerald-400 tabular-nums">
                      ${p.unitSellUSD.toFixed(2)}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              រកមិនឃើញទំនិញដែលត្រូវគ្នានឹង &quot;{searchQuery}&quot; ឡើយ
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: POS Cart + Interactive Touch Numpad (Cols 8-12) */}
      <div className="lg:col-span-5 flex flex-col space-y-2.5">
        {/* Customer Header Bar */}
        <div className="rounded-2xl p-3 bg-slate-800/90 border border-slate-700 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" />
              អតិថិជន (Customer)
            </span>
            <button
              onClick={() => setIsAddPartnerOpen(true)}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              បន្ថែមថ្មី
            </button>
          </div>

          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
          >
            {partners
              .filter((p) => p.type === 'customer' || p.type === 'both')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.currentDebtUSD && p.currentDebtUSD > 0 ? `(ជំពាក់ $${p.currentDebtUSD})` : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Cart Container */}
        <div className="rounded-2xl p-3 bg-slate-800/90 border border-slate-700 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                កន្ត្រកទំនិញ ({cart.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNumpadVisible(!isNumpadVisible)}
                  className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isNumpadVisible ? 'លាក់ Numpad' : 'បើក Numpad'}</span>
                </button>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                  >
                    លុបទាំងអស់
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Cart Lines */}
            <div className="divide-y divide-slate-700/60 max-h-[190px] overflow-y-auto pr-1">
              {cart.map((item) => {
                const isSelected = item.id === selectedCartLineId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCartLineId(item.id)}
                    className={`py-2 px-1.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-amber-400/15 border border-amber-400/60'
                        : 'hover:bg-slate-750'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-xs truncate">
                        {item.product.productname}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-900 rounded font-bold text-amber-300">
                          {item.unitLabel}
                        </span>
                        <span>${item.priceUSD.toFixed(2)}</span>
                        <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1 rounded">
                          {item.location === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'}
                        </span>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartQty(item.id, -1);
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-bold text-xs tabular-nums text-white">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateCartQty(item.id, 1);
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <div className="font-bold text-amber-400 text-xs tabular-nums">
                        ${item.subtotalUSD.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                        className="text-slate-400 hover:text-rose-400 text-[10px]"
                      >
                        លុប
                      </button>
                    </div>
                  </div>
                );
              })}

              {cart.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
                  <ShoppingBag className="w-7 h-7 text-slate-600 mb-1" />
                  <span>កន្ត្រកនៅទទេ (ចុចលើប៊ូតុងទំនិញខាងឆ្វេង)</span>
                </div>
              )}
            </div>
          </div>

          {/* INTEGRATED POS TOUCH NUMPAD (Displayed for high-speed entries) */}
          {isNumpadVisible && (
            <div className="mt-2 pt-2 border-t border-slate-700/80">
              <PosNumpad
                mode={numpadMode}
                onModeChange={setNumpadMode}
                onNumberPress={handleNumpadNumber}
                onBackspace={handleNumpadBackspace}
                onClear={handleNumpadClear}
                onQuickAdd={handleNumpadQuickAdd}
                quickAddPresets={[1, 5, 10, 24]}
              />
            </div>
          )}

          {/* Cart Bottom Summary & Checkout Button */}
          <div className="pt-2 border-t border-slate-700 space-y-2 text-xs">
            {/* Quick Discount Buttons */}
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                បញ្ចុះតម្លៃ:
              </span>
              <div className="flex items-center gap-1">
                {[0, 2, 5, 10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      discountPercent === d
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {/* Total figures */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">ទឹកប្រាក់សរុប (USD):</span>
                <span className="text-xl font-black text-amber-400 tabular-nums">
                  ${finalTotalUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-[11px]">សរុបជាប្រាក់រៀល (KHR):</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {finalTotalKHR.toLocaleString()} ៛
                </span>
              </div>
            </div>

            {/* Big Checkout Button */}
            <button
              type="button"
              onClick={handleOpenCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] min-h-[48px]"
            >
              <Coins className="w-5 h-5" />
              <span>ទូទាត់ប្រាក់ (${finalTotalUSD.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT & TENDER MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">ទូទាត់វិក្កយបត្រ (POS Tender)</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Grand Total Display */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-0.5">
                <span className="text-slate-400 text-[11px]">ទឹកប្រាក់ត្រូវទូទាត់សរុប</span>
                <div className="text-2xl font-black text-amber-400 tabular-nums">
                  ${finalTotalUSD.toFixed(2)}
                </div>
                <div className="text-xs font-bold text-emerald-400 tabular-nums">
                  {finalTotalKHR.toLocaleString()} ៛ (អត្រា {exchangeRate}៛/$)
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  វិធីទូទាត់:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('paid');
                      setReceivedUSD(finalTotalUSD.toFixed(2));
                      setReceivedKHR(finalTotalKHR.toString());
                    }}
                    className={`py-2 px-1 rounded-xl font-bold text-center border min-h-[42px] ${
                      paymentType === 'paid'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    បង់ដាច់ (Paid)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('credit');
                      setReceivedUSD('0');
                      setReceivedKHR('0');
                    }}
                    className={`py-2 px-1 rounded-xl font-bold text-center border min-h-[42px] ${
                      paymentType === 'credit'
                        ? 'bg-rose-600 text-white border-rose-400 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ជំពាក់ (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('partial');
                      setReceivedUSD((finalTotalUSD / 2).toFixed(2));
                      setReceivedKHR('0');
                    }}
                    className={`py-2 px-1 rounded-xl font-bold text-center border min-h-[42px] ${
                      paymentType === 'partial'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    បង់ខ្លះ (Partial)
                  </button>
                </div>
              </div>

              {/* Quick Cash Tender Buttons ($ & ៛) */}
              {paymentType !== 'credit' && (
                <div className="space-y-2">
                  {/* USD Quick Tender */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block mb-1">
                      លុយដុល្លារ ($ Quick Cash):
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { label: 'គ្រប់', val: finalTotalUSD },
                        { label: '$10', val: 10 },
                        { label: '$20', val: 20 },
                        { label: '$50', val: 50 },
                        { label: '$100', val: 100 },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setReceivedUSD(item.val.toFixed(2));
                            setReceivedKHR('0');
                          }}
                          className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-bold"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KHR Quick Tender */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block mb-1">
                      លុយរៀល (៛ Quick Cash):
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {[
                        { label: 'គ្រប់៛', val: finalTotalKHR },
                        { label: '1ម៉ឺន', val: 10000 },
                        { label: '2ម៉ឺន', val: 20000 },
                        { label: '5ម៉ឺន', val: 50000 },
                        { label: '10ម៉ឺន', val: 100000 },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setReceivedKHR(item.val.toString());
                            setReceivedUSD('0');
                          }}
                          className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[11px] font-bold"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Money Received Manual Inputs */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">ទទួលជា ដុល្លារ ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={receivedUSD}
                        onChange={(e) => setReceivedUSD(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-black text-amber-400 focus:outline-none focus:border-amber-400 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">ទទួលជា រៀល (៛)</label>
                      <input
                        type="number"
                        step="100"
                        value={receivedKHR}
                        onChange={(e) => setReceivedKHR(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-black text-emerald-400 focus:outline-none focus:border-emerald-400 tabular-nums"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Debt Due Date (for credit or partial) */}
              {(paymentType === 'credit' || paymentType === 'partial') && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    កាលបរិច្ឆេទសន្យាសង (Due Date):
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">ចំណាំបន្ថែម</label>
                <input
                  type="text"
                  placeholder="ឧ. ដឹកជញ្ជូន, បង់ ABA រួច..."
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950 px-4 py-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>បញ្ជាក់ការលក់ &amp; បោះពុម្ព</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreatePartner}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-xs space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">បន្ថែមអតិថិជនថ្មី</h3>
              <button
                type="button"
                onClick={() => setIsAddPartnerOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">ឈ្មោះអតិថិជន *</label>
              <input
                type="text"
                required
                placeholder="ឧ. ហាងកាហ្វេ ពិសិដ្ឋ"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">លេខទូរស័ព្ទ</label>
              <input
                type="text"
                placeholder="012 xxx xxx"
                value={newPartnerPhone}
                onChange={(e) => setNewPartnerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddPartnerOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold"
              >
                រក្សាទុក
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />

      {/* Thermal Receipt Preview Modal */}
      <ThermalReceipt
        isOpen={!!recentInvoice}
        invoice={recentInvoice}
        onClose={() => setRecentInvoice(null)}
      />
    </div>
  );
};
