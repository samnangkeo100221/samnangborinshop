'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  Warehouse,
  Home,
  CheckCircle2,
  Receipt,
  Printer,
  X,
  FileText,
} from 'lucide-react';
import {
  Partner,
  Product,
  PurchaseItem,
  PurchaseRecord,
  SaleLevel,
  StockLocation,
  StockMovementLog,
} from '@/types/pos';
import { soundEffects } from '@/lib/audio';

interface PurchaseTabProps {
  products: Product[];
  partners: Partner[];
  purchases: PurchaseRecord[];
  exchangeRate: number;
  onSavePurchase: (po: PurchaseRecord) => void;
  onUpdateProducts: (products: Product[]) => void;
  onAddLog: (log: StockMovementLog) => void;
}

function makePoNo(): string {
  return `PO-${Date.now().toString().slice(-6)}`;
}

function makePoId(): string {
  return `PO_REC_${Date.now()}`;
}

function makePurchaseLogId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const PurchaseTab: React.FC<PurchaseTabProps> = ({
  products,
  partners,
  purchases,
  exchangeRate,
  onSavePurchase,
  onUpdateProducts,
  onAddLog,
}) => {
  // New PO State
  const suppliers = partners.filter((p) => p.type === 'supplier' || p.type === 'both');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || partners[0]?.id || ''
  );
  const [targetLocation, setTargetLocation] = useState<StockLocation>('warehouse');
  const [poNote, setPoNote] = useState('');

  // PO Items
  const [poItems, setPoItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedLevel, setSelectedLevel] = useState<SaleLevel>('case');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCostUSD, setItemCostUSD] = useState<number>(
    products[0]?.buyUSD || 10
  );

  // Selected PO Modal for viewing/printing
  const [viewingPo, setViewingPo] = useState<PurchaseRecord | null>(null);

  // When selected product changes, pre-fill its buyUSD
  const handleProductSelectChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      if (selectedLevel === 'part') {
        setItemCostUSD(Number((prod.buyUSD / (prod.partCase || 4)).toFixed(2)));
      } else if (selectedLevel === 'unit') {
        setItemCostUSD(Number((prod.buyUSD / (prod.unitCase || 24)).toFixed(2)));
      } else {
        setItemCostUSD(prod.buyUSD);
      }
    }
  };

  const handleAddItemToPo = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod || itemQty <= 0) return;

    const costUSD = Number(itemCostUSD) || 0;
    const costKHR = Math.round(costUSD * exchangeRate);
    const subtotalUSD = Number((costUSD * itemQty).toFixed(2));
    const subtotalKHR = Math.round(subtotalUSD * exchangeRate);

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.productname,
      level: selectedLevel,
      qty: itemQty,
      costUSD,
      costKHR,
      subtotalUSD,
      subtotalKHR,
    };

    setPoItems((prev) => [...prev, newItem]);
    soundEffects.playBeep();
  };

  const removeItem = (idx: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalPoUSD = poItems.reduce((acc, it) => acc + it.subtotalUSD, 0);
  const totalPoKHR = poItems.reduce((acc, it) => acc + it.subtotalKHR, 0);

  // Submit Restock PO
  const handleCompleteRestock = () => {
    if (poItems.length === 0) {
      soundEffects.playWarning();
      alert('សូមបញ្ចូលទំនិញទិញចូលយ៉ាងហោច ១ មុខ');
      return;
    }

    const supplier = partners.find((p) => p.id === selectedSupplierId) || {
      id: 'SUP-01',
      name: 'អ្នកផ្គត់ផ្គង់ទូទៅ',
    };

    const poNo = makePoNo();
    const newRecord: PurchaseRecord = {
      id: makePoId(),
      poNo,
      date: new Date().toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      location: targetLocation,
      items: [...poItems],
      totalUSD: Number(totalPoUSD.toFixed(2)),
      totalKHR: totalPoKHR,
      status: 'received',
      note: poNote || undefined,
    };

    // Update Product Stock & Buy Costs
    const prodMap = new Map(products.map((p) => [p.id, { ...p }]));

    poItems.forEach((it) => {
      const p = prodMap.get(it.productId);
      if (p) {
        // Convert fraction to cases
        let caseFraction = it.qty;
        if (it.level === 'part') {
          caseFraction = it.qty / (p.partCase || 4);
        } else if (it.level === 'unit') {
          caseFraction = it.qty / (p.unitCase || 24);
        }

        if (targetLocation === 'home') {
          p.stockHome = Number((p.stockHome + caseFraction).toFixed(2));
        } else {
          p.stockWarehouse = Number((p.stockWarehouse + caseFraction).toFixed(2));
        }
        p.stock = Number((p.stockHome + p.stockWarehouse).toFixed(2));

        // Update cost if case was bought
        if (it.level === 'case') {
          p.buyUSD = it.costUSD;
          p.buyKHR = it.costKHR;
          p.profit = Number((p.sellUSD - p.buyUSD).toFixed(2));
        }
        p.updatedAt = new Date().toISOString();

        // Add log
        onAddLog({
          id: makePurchaseLogId(),
          timestamp: new Date().toISOString(),
          productId: p.id,
          productName: p.productname,
          type: 'purchase',
          targetLocation,
          qty: it.qty,
          unit: it.level === 'case' ? 'កេស' : it.level === 'part' ? p.partName : p.unitName,
          reference: poNo,
          user: 'អ្នកគ្រប់គ្រងស្តុក',
          note: `ទិញចូលស្តុកពី ${supplier.name}`,
        });
      }
    });

    onUpdateProducts(Array.from(prodMap.values()));
    onSavePurchase(newRecord);
    soundEffects.playCashRegister();

    // Reset Form
    setPoItems([]);
    setPoNote('');
    setViewingPo(newRecord);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">ទិញទំនិញចូលស្តុក (Stock In &amp; Restock)</h2>
            <p className="text-xs text-slate-400">
              នាំចូលទំនិញថ្មី កត់ត្រាតម្លៃដើម និងដាក់ចូល ផ្ទះ ឬ ឃ្លាំង
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, PO History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: New Restock Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3.5 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 pb-2 border-b border-slate-700">
              <FileText className="w-4 h-4 text-amber-400" />
              បង្កើតប័ណ្ណទិញចូលស្តុក (Purchase Order)
            </h3>

            {/* Supplier & Target Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  អ្នកផ្គត់ផ្គង់ (Supplier)
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                  {suppliers.length === 0 && (
                    <option value="DEF">អ្នកផ្គត់ផ្គង់ទូទៅ</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ទីតាំងដាក់ទំនិញចូលស្តុក
                </label>
                <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTargetLocation('home')}
                    className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                      targetLocation === 'home'
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>ស្តុកផ្ទះ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetLocation('warehouse')}
                    className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 ${
                      targetLocation === 'warehouse'
                        ? 'bg-indigo-500 text-white font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>ស្តុកឃ្លាំង</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Item Selector Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-semibold text-slate-300 block text-[11px]">
                ជ្រើសរើសទំនិញ និងកំណត់តម្លៃដើម:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="block text-slate-400 text-[10px] mb-1">មុខទំនិញ</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs truncate"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.productname} (ស្តុកសរុប: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 text-[10px] mb-1">ឯកតា</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as SaleLevel)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="case">កេស</option>
                    <option value="part">យួ/ផ្នែក</option>
                    <option value="unit">រាយ</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 text-[10px] mb-1">ចំនួន</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={(e) => setItemQty(Number(e.target.value) || 1)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs tabular-nums font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 text-[10px] mb-1">តម្លៃដើម ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemCostUSD}
                    onChange={(e) => setItemCostUSD(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 text-xs tabular-nums font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddItemToPo}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>បញ្ចូលក្នុងបញ្ជី</span>
                </button>
              </div>
            </div>

            {/* Added PO Items Table */}
            <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-950/60">
              <div className="p-2.5 bg-slate-800 font-semibold text-white flex justify-between text-xs">
                <span>បញ្ជីទំនិញទិញចូល ({poItems.length})</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  សរុប: ${totalPoUSD.toFixed(2)} ({totalPoKHR.toLocaleString()}៛)
                </span>
              </div>

              <div className="divide-y divide-slate-800 max-h-[220px] overflow-y-auto">
                {poItems.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-white truncate">{it.productName}</div>
                      <div className="text-[10px] text-slate-400">
                        {it.qty} {it.level === 'case' ? 'កេស' : it.level === 'part' ? 'យួ' : 'រាយ'} x ${it.costUSD.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-bold text-amber-400 tabular-nums">
                        ${it.subtotalUSD.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {poItems.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    មិនទាន់មានទំនិញក្នុងប័ណ្ណទិញចូលនៅឡើយ
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">ចំណាំបន្ថែម (PO Note)</label>
              <input
                type="text"
                placeholder="ឧ. បង់លុយតាម ABA, ឡានដឹកមកដល់ថ្ងៃត្រង់..."
                value={poNote}
                onChange={(e) => setPoNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            {/* Complete Restock Button */}
            <button
              type="button"
              onClick={handleCompleteRestock}
              disabled={poItems.length === 0}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ទទួលទំនិញចូលស្តុក (${totalPoUSD.toFixed(2)})</span>
            </button>
          </div>
        </div>

        {/* RIGHT: PO History & Receipts (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 pb-2 border-b border-slate-700">
              <Receipt className="w-4 h-4 text-emerald-400" />
              ប្រវត្តិទិញចូល (Purchase History)
            </h3>

            <div className="divide-y divide-slate-700/60 max-h-[500px] overflow-y-auto pr-1">
              {purchases.map((po) => (
                <div key={po.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{po.poNo}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-amber-300">
                        {po.location === 'home' ? 'ស្តុកផ្ទះ' : 'ឃ្លាំង'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      {po.supplierName} · {po.items.length} មុខ
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(po.date).toLocaleDateString('km-KH')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-amber-400 tabular-nums">
                      ${po.totalUSD.toFixed(2)}
                    </div>
                    <button
                      onClick={() => setViewingPo(po)}
                      className="mt-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-medium"
                    >
                      មើលប័ណ្ណ
                    </button>
                  </div>
                </div>
              ))}

              {purchases.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  មិនទាន់មានប្រវត្តិទិញចូលឡើយ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW PO RECEIPT MODAL */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-white text-slate-900 p-5 shadow-2xl font-mono text-xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2 font-sans">
              <span className="font-bold text-slate-900 text-sm">ប័ណ្ណទិញទំនិញចូល (PO)</span>
              <button
                onClick={() => setViewingPo(null)}
                className="p-1 rounded bg-slate-100 text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-[11px] border-b pb-2">
              <div className="flex justify-between">
                <span>លេខ PO:</span>
                <span className="font-bold">{viewingPo.poNo}</span>
              </div>
              <div className="flex justify-between">
                <span>អ្នកផ្គត់ផ្គង់:</span>
                <span>{viewingPo.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span>ទីតាំង:</span>
                <span>{viewingPo.location === 'home' ? 'ស្តុកផ្ទះ' : 'ឃ្លាំង'}</span>
              </div>
              <div className="flex justify-between">
                <span>កាលបរិច្ឆេទ:</span>
                <span>{new Date(viewingPo.date).toLocaleString('km-KH')}</span>
              </div>
            </div>

            <div className="space-y-1.5 py-1 border-b">
              {viewingPo.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {it.productName} ({it.qty} {it.level})
                  </span>
                  <span className="font-bold tabular-nums">${it.subtotalUSD.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm pt-1">
              <span>សរុប (Total USD):</span>
              <span className="tabular-nums">${viewingPo.totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs text-emerald-700">
              <span>សរុបជាប្រាក់រៀល:</span>
              <span className="tabular-nums">{viewingPo.totalKHR.toLocaleString()} ៛</span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>បោះពុម្ព</span>
              </button>
              <button
                onClick={() => setViewingPo(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-sans text-xs"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
