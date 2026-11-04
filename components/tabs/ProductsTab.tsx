'use client';

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Camera,
  Layers,
  Box,
  Tag,
  DollarSign,
  PackageCheck,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, PartName, UnitName } from '@/types/pos';
import { soundEffects } from '@/lib/audio';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';

interface ProductsTabProps {
  products: Product[];
  exchangeRate: number;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportProducts: (imported: Product[]) => void;
}

const UNIT_OPTIONS: UnitName[] = ['កំប៉ុង', 'ដប', 'កញ្ចប់', 'kg', 'L', 'ថង់', 'កែវ', 'ប្រអប់'];
const PART_OPTIONS: PartName[] = ['យួ', 'ថង់', 'ឡូ', 'ខ្សែ', 'ដុំ', 'កេស'];

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  exchangeRate,
  onSaveProduct,
  onDeleteProduct,
  onImportProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Edit / Add Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Scanner modal for multi-barcode scanning
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanningField, setScanningField] = useState<'case' | 'part' | 'unit' | 'id'>('case');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.type));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.type === selectedCategory;
      const matchLow = !showLowStockOnly || p.stock <= p.minStock;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat && matchLow;
      const matchName = p.productname.toLowerCase().includes(q);
      const matchBarcode =
        p.barcodeCase?.toLowerCase().includes(q) ||
        p.barcodePart?.toLowerCase().includes(q) ||
        p.barcodeUnit?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchCat && matchLow && (matchName || matchBarcode);
    });
  }, [products, selectedCategory, showLowStockOnly, searchQuery]);

  // Open Add modal with defaults
  const handleAddNew = () => {
    const newProd: Product = {
      id: `P${(products.length + 1).toString().padStart(3, '0')}`,
      barcodeCase: '',
      barcodePart: '',
      barcodeUnit: '',
      productname: '',
      type: 'ស្រា & ស្រាបៀរ',
      unitName: 'កំប៉ុង',
      partName: 'យួ',
      unitCase: 24,
      partCase: 4,
      unitsPerPart: 6,
      buyUSD: 10,
      buyKHR: 41000,
      sellUSD: 12,
      sellKHR: 49200,
      partSellUSD: 3.2,
      partSellKHR: 13120,
      unitSellUSD: 0.6,
      unitSellKHR: 2500,
      profit: 2,
      stockHome: 10,
      stockWarehouse: 20,
      stock: 30,
      minStock: 15,
      updatedAt: new Date().toISOString(),
    };
    setEditingProduct(newProd);
    setIsEditModalOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Recalculate profit and total stock
    const stockHome = Number(editingProduct.stockHome) || 0;
    const stockWarehouse = Number(editingProduct.stockWarehouse) || 0;
    const stockTotal = Number((stockHome + stockWarehouse).toFixed(2));
    const profit = Number((editingProduct.sellUSD - editingProduct.buyUSD).toFixed(2));

    const finalProduct: Product = {
      ...editingProduct,
      stockHome,
      stockWarehouse,
      stock: stockTotal,
      profit,
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(finalProduct);
    soundEffects.playBeep();
    setIsEditModalOpen(false);
  };

  // Barcode Scanner Field Setter
  const openScannerFor = (field: 'case' | 'part' | 'unit' | 'id') => {
    setScanningField(field);
    setIsScannerOpen(true);
  };

  const handleBarcodeCaptured = (barcode: string) => {
    if (!editingProduct) return;
    if (scanningField === 'case') {
      setEditingProduct({ ...editingProduct, barcodeCase: barcode });
    } else if (scanningField === 'part') {
      setEditingProduct({ ...editingProduct, barcodePart: barcode });
    } else if (scanningField === 'unit') {
      setEditingProduct({ ...editingProduct, barcodeUnit: barcode });
    } else {
      setEditingProduct({ ...editingProduct, id: barcode });
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    try {
      const dataToExport = products.map((p) => ({
        'កូដទំនិញ (ID)': p.id,
        'ឈ្មោះទំនិញ (Name)': p.productname,
        'ប្រភេទ (Category)': p.type,
        'បាកូដកេស (Barcode Case)': p.barcodeCase,
        'បាកូដយួ (Barcode Part)': p.barcodePart,
        'បាកូដរាយ (Barcode Unit)': p.barcodeUnit,
        'ឯកតារាយ (Unit)': p.unitName,
        'ផ្នែក (Part)': p.partName,
        'ចំនួនក្នុង១កេស (Units/Case)': p.unitCase,
        'ផ្នែកក្នុង១កេស (Parts/Case)': p.partCase,
        'ទិញចូល USD': p.buyUSD,
        'ទិញចូល KHR': p.buyKHR,
        'លក់កេស USD': p.sellUSD,
        'លក់កេស KHR': p.sellKHR,
        'លក់យួ USD': p.partSellUSD,
        'លក់រាយ USD': p.unitSellUSD,
        'ស្តុកផ្ទះ (Home)': p.stockHome,
        'ស្តុកឃ្លាំង (Warehouse)': p.stockWarehouse,
        'ស្តុកសរុប (Total)': p.stock,
        'ស្តុកអប្បបរមា (Min)': p.minStock,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      XLSX.writeFile(wb, `SamnangBorin_Products_${new Date().toISOString().slice(0, 10)}.xlsx`);

      soundEffects.playBeep();
      alert('បាន Export ទិន្នន័យទំនិញជា Excel ជោគជ័យ!');
    } catch (err) {
      console.error('Export error', err);
      soundEffects.playWarning();
      alert('កំហុសពេល Export Excel');
    }
  };

  // Excel Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data || data.length === 0) {
          alert('ឯកសារ Excel គ្មានទិន្នន័យឡើយ');
          return;
        }

        const importedList: Product[] = data.map((row, idx) => {
          const id = String(row['កូដទំនិញ (ID)'] || row['ID'] || `P_IMP_${idx + 1}`);
          const name = String(row['ឈ្មោះទំនិញ (Name)'] || row['Name'] || row['productname'] || 'ទំនិញថ្មី');
          const sellUSD = Number(row['លក់កេស USD'] || row['sellUSD'] || 10);
          const buyUSD = Number(row['ទិញចូល USD'] || row['buyUSD'] || 8);
          const stockHome = Number(row['ស្តុកផ្ទះ (Home)'] || row['stockHome'] || 10);
          const stockWarehouse = Number(row['ស្តុកឃ្លាំង (Warehouse)'] || row['stockWarehouse'] || 20);

          return {
            id,
            productname: name,
            type: String(row['ប្រភេទ (Category)'] || row['type'] || 'ទូទៅ'),
            barcodeCase: String(row['បាកូដកេស (Barcode Case)'] || row['barcodeCase'] || ''),
            barcodePart: String(row['បាកូដយួ (Barcode Part)'] || row['barcodePart'] || ''),
            barcodeUnit: String(row['បាកូដរាយ (Barcode Unit)'] || row['barcodeUnit'] || ''),
            unitName: (row['ឯកតារាយ (Unit)'] || 'កំប៉ុង') as UnitName,
            partName: (row['ផ្នែក (Part)'] || 'យួ') as PartName,
            unitCase: Number(row['ចំនួនក្នុង១កេស (Units/Case)'] || 24),
            partCase: Number(row['ផ្នែកក្នុង១កេស (Parts/Case)'] || 4),
            unitsPerPart: 6,
            buyUSD,
            buyKHR: Math.round(buyUSD * exchangeRate),
            sellUSD,
            sellKHR: Math.round(sellUSD * exchangeRate),
            partSellUSD: Number(row['លក់យួ USD'] || (sellUSD / 4).toFixed(2)),
            partSellKHR: Math.round((sellUSD / 4) * exchangeRate),
            unitSellUSD: Number(row['លក់រាយ USD'] || (sellUSD / 24).toFixed(2)),
            unitSellKHR: Math.round((sellUSD / 24) * exchangeRate),
            profit: Number((sellUSD - buyUSD).toFixed(2)),
            stockHome,
            stockWarehouse,
            stock: stockHome + stockWarehouse,
            minStock: Number(row['ស្តុកអប្បបរមា (Min)'] || 15),
            updatedAt: new Date().toISOString(),
          };
        });

        onImportProducts(importedList);
        soundEffects.playCashRegister();
        alert(`បាន Import ទំនិញចំនួន ${importedList.length} មុខដោយជោគជ័យ!`);
      } catch (err) {
        console.error('Import error', err);
        soundEffects.playWarning();
        alert('មិនអាចអានឯកសារ Excel បានទេ សូមពិនិត្យទម្រង់ទិន្នន័យ');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Top Action & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">កាតាឡុកទំនិញ &amp; ការវេចខ្ចប់</h2>
            <p className="text-xs text-slate-400">
              សរុប {products.length} មុខ (ជិតអស់ស្តុក:{' '}
              {products.filter((p) => p.stock <= p.minStock).length})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold border border-slate-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold border border-slate-600 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមទំនិញថ្មី</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ ឬបាកូដ (កេស, យួ, រាយ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                showLowStockOnly
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>ជិតអស់ស្តុក (Low Stock)</span>
            </button>
          </div>
        </div>

        {/* Categories Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition shrink-0 min-h-[34px] ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 font-bold shadow'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              {cat === 'all' ? 'ទាំងអស់' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table (Desktop) & Cards (Mobile) */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/90 shadow-md overflow-hidden">
        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">ទំនិញ</th>
                <th className="px-3 py-3">ការវេចខ្ចប់</th>
                <th className="px-3 py-3">តម្លៃលក់ ($ / ៛)</th>
                <th className="px-3 py-3">តម្លៃទិញ</th>
                <th className="px-3 py-3">ស្តុកផ្ទះ</th>
                <th className="px-3 py-3">ស្តុកឃ្លាំង</th>
                <th className="px-3 py-3">ស្តុកសរុប</th>
                <th className="px-4 py-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/70">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-750 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white text-xs">{p.productname}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="font-mono">{p.id}</span>
                        <span>·</span>
                        <span>{p.type}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-[11px] font-medium text-amber-300">
                        1 កេស = {p.partCase} {p.partName} = {p.unitCase} {p.unitName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        BC: {p.barcodeCase || 'គ្មាន'}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <div className="font-bold text-amber-400 text-xs">
                        ${p.sellUSD.toFixed(2)} /កេស
                      </div>
                      <div className="text-[10px] text-slate-300">
                        ${p.partSellUSD.toFixed(2)} /{p.partName} · ${p.unitSellUSD.toFixed(2)} /{p.unitName}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <div className="text-slate-300 font-medium">
                        ${p.buyUSD.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        ចំណេញ: +${p.profit.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums font-semibold text-slate-200">
                      {p.stockHome} កេស
                    </td>
                    <td className="px-3 py-3 tabular-nums font-semibold text-slate-200">
                      {p.stockWarehouse} កេស
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-bold text-[11px] ${
                          p.stock <= 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : isLow
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {p.stock} កេស
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                          title="កែប្រែ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`តើអ្នកប្រាកដថាចង់លុបទំនិញ "${p.productname}" ដែរឬទេ?`)) {
                              onDeleteProduct(p.id);
                              soundEffects.playBeep();
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-rose-900 text-slate-300 hover:text-rose-300 transition"
                          title="លុប"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            រកមិនឃើញទំនិញដែលត្រូវគ្នានឹងការស្វែងរកឡើយ
          </div>
        )}
      </div>

      {/* EDIT / ADD PRODUCT MODAL */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleFormSubmit}
            className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-800/80">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {editingProduct.id.startsWith('P_IMP_') || !products.some((p) => p.id === editingProduct.id)
                    ? 'បន្ថែមទំនិញថ្មី'
                    : `កែប្រែទំនិញ: ${editingProduct.productname}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Product Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">កូដទំនិញ (ID / SKU) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">ឈ្មោះទំនិញ *</label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. ស្រាបៀរ អង្គរ កំប៉ុង"
                    value={editingProduct.productname}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">ប្រភេទទំនិញ</label>
                <input
                  type="text"
                  placeholder="ឧ. ស្រា & ស្រាបៀរ, ភេសជ្ជៈ, គ្រឿងទេស..."
                  value={editingProduct.type}
                  onChange={(e) => setEditingProduct({ ...editingProduct, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              {/* Multi-Packaging Configuration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4" />
                  ប្រព័ន្ធវេចខ្ចប់ (កេស, យួ/ផ្នែក, រាយ)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">ឯកតារាយ (Unit)</label>
                    <select
                      value={editingProduct.unitName}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, unitName: e.target.value as UnitName })
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">ផ្នែក (Part/Pack)</label>
                    <select
                      value={editingProduct.partName}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, partName: e.target.value as PartName })
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    >
                      {PART_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">ចំនួនរាយក្នុង១កេស</label>
                    <input
                      type="number"
                      value={editingProduct.unitCase}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, unitCase: Number(e.target.value) || 1 })
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">ផ្នែកក្នុង១កេស</label>
                    <input
                      type="number"
                      value={editingProduct.partCase}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, partCase: Number(e.target.value) || 1 })
                      }
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Barcode Inputs with Camera Scan Buttons */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  គ្រប់គ្រងបាកូដច្រើន (Multi-Barcode)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">បាកូដ កេស (Case)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="884..."
                        value={editingProduct.barcodeCase}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, barcodeCase: e.target.value })
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => openScannerFor('case')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400"
                        title="ស្កេន"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">បាកូដ យួ/ផ្នែក (Part)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="884..."
                        value={editingProduct.barcodePart}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, barcodePart: e.target.value })
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => openScannerFor('part')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400"
                        title="ស្កេន"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">បាកូដ រាយ (Unit)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="884..."
                        value={editingProduct.barcodeUnit}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, barcodeUnit: e.target.value })
                        }
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => openScannerFor('unit')}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400"
                        title="ស្កេន"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Profit */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">ទិញចូល ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.buyUSD}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        buyUSD: v,
                        buyKHR: Math.round(v * exchangeRate),
                        profit: Number((editingProduct.sellUSD - v).toFixed(2)),
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">លក់កេស ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.sellUSD}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        sellUSD: v,
                        sellKHR: Math.round(v * exchangeRate),
                        profit: Number((v - editingProduct.buyUSD).toFixed(2)),
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 tabular-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">លក់យួ ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.partSellUSD}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        partSellUSD: v,
                        partSellKHR: Math.round(v * exchangeRate),
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">លក់រាយ ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.unitSellUSD}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      setEditingProduct({
                        ...editingProduct,
                        unitSellUSD: v,
                        unitSellKHR: Math.round(v * exchangeRate),
                      });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums"
                  />
                </div>
              </div>

              {/* Dual Stock (Home vs Warehouse) & Min Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">ស្តុកនៅផ្ទះ (កេស)</label>
                  <input
                    type="number"
                    value={editingProduct.stockHome}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockHome: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">ស្តុកនៅឃ្លាំង (កេស)</label>
                  <input
                    type="number"
                    value={editingProduct.stockWarehouse}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stockWarehouse: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white tabular-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">ស្តុកទាបបំផុតព្រមាន (Min)</label>
                  <input
                    type="number"
                    value={editingProduct.minStock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStock: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-300 tabular-nums font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-950 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md transition"
              >
                រក្សាទុកទំនិញ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeCaptured}
        title={`ស្កេនបាកូដ ${
          scanningField === 'case'
            ? 'កេស'
            : scanningField === 'part'
            ? 'យួ'
            : scanningField === 'unit'
            ? 'រាយ'
            : 'ID'
        }`}
      />
    </div>
  );
};
