'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Warehouse,
  Home,
  AlertTriangle,
  History,
  CheckCircle2,
  Search,
  Filter,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Product, StockLocation, StockMovementLog } from '@/types/pos';
import { soundEffects } from '@/lib/audio';

interface InspectTabProps {
  products: Product[];
  logs: StockMovementLog[];
  onUpdateProducts: (products: Product[]) => void;
  onAddLog: (log: StockMovementLog) => void;
}

function makeInspectLogId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const InspectTab: React.FC<InspectTabProps> = ({
  products,
  logs,
  onUpdateProducts,
  onAddLog,
}) => {
  // Search and view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'transfer' | 'sale' | 'purchase'>('all');

  // Transfer State
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [transferDirection, setTransferDirection] = useState<'warehouseToHome' | 'homeToWarehouse'>('warehouseToHome');
  const [transferQty, setTransferQty] = useState<number>(5);
  const [transferNote, setTransferNote] = useState('');

  // Dual Stock Totals
  const totalHomeStock = useMemo(() => products.reduce((acc, p) => acc + p.stockHome, 0), [products]);
  const totalWarehouseStock = useMemo(() => products.reduce((acc, p) => acc + p.stockWarehouse, 0), [products]);

  // Valuation
  const totalStockValueUSD = useMemo(
    () => products.reduce((acc, p) => acc + p.stock * p.buyUSD, 0),
    [products]
  );

  // Low stock products
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= p.minStock),
    [products]
  );

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (logTypeFilter !== 'all' && l.type !== logTypeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        l.productName.toLowerCase().includes(q) ||
        l.reference.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q)
      );
    });
  }, [logs, logTypeFilter, searchQuery]);

  // Execute Transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod || transferQty <= 0) return;

    const source: StockLocation = transferDirection === 'warehouseToHome' ? 'warehouse' : 'home';
    const target: StockLocation = transferDirection === 'warehouseToHome' ? 'home' : 'warehouse';

    const sourceAvailable = source === 'home' ? prod.stockHome : prod.stockWarehouse;

    if (transferQty > sourceAvailable) {
      soundEffects.playWarning();
      alert(`ស្តុកនៅ ${source === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'} មានត្រឹមតែ ${sourceAvailable} កេសប៉ុណ្ណោះ!`);
      return;
    }

    const updated = products.map((p) => {
      if (p.id === prod.id) {
        let newHome = p.stockHome;
        let newWh = p.stockWarehouse;

        if (transferDirection === 'warehouseToHome') {
          newWh = Number((newWh - transferQty).toFixed(2));
          newHome = Number((newHome + transferQty).toFixed(2));
        } else {
          newHome = Number((newHome - transferQty).toFixed(2));
          newWh = Number((newWh + transferQty).toFixed(2));
        }

        return {
          ...p,
          stockHome: newHome,
          stockWarehouse: newWh,
          stock: Number((newHome + newWh).toFixed(2)),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    onUpdateProducts(updated);

    // Record Log
    onAddLog({
      id: makeInspectLogId(),
      timestamp: new Date().toISOString(),
      productId: prod.id,
      productName: prod.productname,
      type: 'transfer',
      sourceLocation: source,
      targetLocation: target,
      qty: transferQty,
      unit: 'កេស',
      reference: `TR-${Date.now().toString().slice(-4)}`,
      user: 'អ្នកគ្រប់គ្រងស្តុក',
      note: transferNote || `${source === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'} ➔ ${target === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'}`,
    });

    soundEffects.playBeep();
    setTransferNote('');
    alert(`បានផ្ទេរ ${transferQty} កេស "${prod.productname}" ដោយជោគជ័យ!`);
  };

  // Quick 1-click restock to home from warehouse for low stock items
  const handleQuickTransferToHome = (p: Product, qty: number = 5) => {
    if (p.stockWarehouse < qty) {
      soundEffects.playWarning();
      alert(`ឃ្លាំងមានសល់ត្រឹមតែ ${p.stockWarehouse} កេសប៉ុណ្ណោះ!`);
      return;
    }

    const updated = products.map((item) => {
      if (item.id === p.id) {
        const newHome = Number((item.stockHome + qty).toFixed(2));
        const newWh = Number((item.stockWarehouse - qty).toFixed(2));
        return {
          ...item,
          stockHome: newHome,
          stockWarehouse: newWh,
          stock: Number((newHome + newWh).toFixed(2)),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    onUpdateProducts(updated);

    onAddLog({
      id: makeInspectLogId(),
      timestamp: new Date().toISOString(),
      productId: p.id,
      productName: p.productname,
      type: 'transfer',
      sourceLocation: 'warehouse',
      targetLocation: 'home',
      qty,
      unit: 'កេស',
      reference: `TR-QUICK`,
      user: 'អ្នកគ្រប់គ្រងស្តុក',
      note: `ផ្ទេររហ័សមកផ្ទះព្រោះជិតអស់ស្តុក`,
    });

    soundEffects.playBeep();
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* 3 Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Home className="w-4 h-4 text-emerald-400" />
              ស្តុកនៅផ្ទះ/ហាងមុខ (Home)
            </span>
          </div>
          <div className="text-2xl font-black text-white tabular-nums">
            {totalHomeStock.toFixed(0)} <span className="text-xs font-normal text-slate-400">កេស</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-medium">
            ត្រៀមសម្រាប់លក់ចេញរហ័ស
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Warehouse className="w-4 h-4 text-indigo-400" />
              ស្តុកនៅឃ្លាំងធំ (Warehouse)
            </span>
          </div>
          <div className="text-2xl font-black text-white tabular-nums">
            {totalWarehouseStock.toFixed(0)} <span className="text-xs font-normal text-slate-400">កេស</span>
          </div>
          <div className="text-[11px] text-indigo-300 mt-1 font-medium">
            ស្តុកបំរុង និងបោះដុំ
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              តម្លៃទុនស្តុកសរុប (Asset Value)
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 tabular-nums">
            ${totalStockValueUSD.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            គិតតាមតម្លៃដើមទិញចូល
          </div>
        </div>
      </div>

      {/* Main Grid: Stock Transfer & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Stock Transfer Form (6 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          <form
            onSubmit={handleExecuteTransfer}
            className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3 text-xs"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
              <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">ផ្ទេរស្តុក (Stock Transfer ផ្ទះ ⇄ ឃ្លាំង)</h3>
                <p className="text-[11px] text-slate-400">ផ្ទេរទំនិញរវាងទីតាំងផ្ទះ និងឃ្លាំងដោយសុវត្ថិភាព</p>
              </div>
            </div>

            {/* Select Direction */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ទិសដៅនៃការផ្ទេរ:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferDirection('warehouseToHome')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition min-h-[44px] ${
                    transferDirection === 'warehouseToHome'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  ឃ្លាំង ➔ ផ្ទះ (ដាក់ហាង)
                </button>
                <button
                  type="button"
                  onClick={() => setTransferDirection('homeToWarehouse')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition min-h-[44px] ${
                    transferDirection === 'homeToWarehouse'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  ផ្ទះ ➔ ឃ្លាំង (យកទុក)
                </button>
              </div>
            </div>

            {/* Select Product */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ជ្រើសរើសទំនិញដែលត្រូវផ្ទេរ:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productname} (ផ្ទះ: {p.stockHome} | ឃ្លាំង: {p.stockWarehouse})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity with quick chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">
                  ចំនួនត្រូវផ្ទេរ (គិតជាកេស):
                </label>
                <div className="flex items-center gap-1">
                  {[1, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTransferQty(num)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[10px] font-bold"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-black text-base tabular-nums"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">មូលហេតុ / ចំណាំ:</label>
              <input
                type="text"
                placeholder="ឧ. បំពេញស្តុកបន្ថែមសម្រាប់លក់ចុងសប្តាហ៍..."
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>យល់ព្រមផ្ទេរស្តុក ({transferQty} កេស)</span>
            </button>
          </form>

          {/* Low Stock Alert List with Quick Transfer CTA */}
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                ទំនិញជិតអស់ស្តុក (Alert: {lowStockProducts.length})
              </span>
              <span className="text-[10px] text-slate-400">ចុចផ្ទេរពីឃ្លាំងរហ័ស</span>
            </div>

            <div className="divide-y divide-slate-700/60 max-h-[220px] overflow-y-auto">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{p.productname}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ផ្ទះ: <span className="text-rose-300 font-bold">{p.stockHome}</span> · ឃ្លាំង: <span className="text-indigo-300 font-bold">{p.stockWarehouse}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.stockWarehouse > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickTransferToHome(p, 5)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] shadow active:scale-95 transition"
                        title="ផ្ទេរ 5 កេសពីឃ្លាំងមកផ្ទះ"
                      >
                        +5 កេស ➔ ផ្ទះ
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded font-bold text-rose-300 bg-rose-950/70 border border-rose-800 text-[10px]">
                      សរុប {p.stock}
                    </span>
                  </div>
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="py-6 text-center text-emerald-400 text-xs">
                  គ្រប់មុខទំនិញទាំងអស់សុទ្ធតែមានស្តុកគ្រប់គ្រាន់
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Stock Movement Audit Log (6 Cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                ប្រវត្តិចលនាស្តុក (Movement Logs)
              </span>

              {/* Filter Type */}
              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px]"
              >
                <option value="all">ទាំងអស់ (All)</option>
                <option value="sale">លក់ចេញ (Sale)</option>
                <option value="purchase">ទិញចូល (Purchase)</option>
                <option value="transfer">ផ្ទេរស្តុក (Transfer)</option>
              </select>
            </div>

            <div className="divide-y divide-slate-700/60 max-h-[520px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const isSale = log.type === 'sale';
                const isPurchase = log.type === 'purchase';

                return (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                            isSale
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isPurchase
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {isSale ? 'លក់' : isPurchase ? 'ទិញចូល' : 'ផ្ទេរ'}
                        </span>
                        <span className="truncate">{log.productName}</span>
                      </div>

                      <div className="text-[11px] text-slate-300 mt-1">
                        ចំនួន:{' '}
                        <span className="font-bold text-white">
                          {log.qty} {log.unit}
                        </span>{' '}
                        {log.sourceLocation ? `(ពី ${log.sourceLocation === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'})` : ''}
                        {log.targetLocation ? ` ➔ ${log.targetLocation === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'}` : ''}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{new Date(log.timestamp).toLocaleString('km-KH')}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-300">{log.reference}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  មិនមានកំណត់ត្រាចលនាស្តុកឡើយ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
