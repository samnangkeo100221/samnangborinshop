'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  ShoppingCart,
  Package,
  Truck,
  Layers,
  Users,
  BarChart2,
  Database,
  Volume2,
  VolumeX,
  Palette,
  RotateCcw,
  Sparkles,
  DollarSign,
  Cloud,
  Check,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import {
  Product,
  SaleInvoice,
  Partner,
  Expense,
  StockMovementLog,
  PurchaseRecord,
  TabKey,
  ThemeKey,
} from '@/types/pos';
import { THEMES, TAB_AUTO_THEMES } from '@/lib/theme';
import { soundEffects } from '@/lib/audio';
import {
  getStoredProducts,
  saveProducts,
  getStoredInvoices,
  saveInvoices,
  getStoredPartners,
  savePartners,
  getStoredExpenses,
  saveExpenses,
  getStoredLogs,
  saveLogs,
  getStoredPurchases,
  savePurchases,
  getExchangeRate,
  saveExchangeRate,
  resetAllDataToDefault,
} from '@/lib/db';
import { useHardwareScanner } from '@/hooks/useHardwareScanner';
import { SupabaseConfigModal } from '@/components/SupabaseConfigModal';
import { PrePushReviewModal } from '@/components/PrePushReviewModal';
import { PWAInstallButton } from '@/components/PWAInstallButton';

// Tab Components
import { SaleTab } from '@/components/tabs/SaleTab';
import { ProductsTab } from '@/components/tabs/ProductsTab';
import { PurchaseTab } from '@/components/tabs/PurchaseTab';
import { InspectTab } from '@/components/tabs/InspectTab';
import { PartnerTab } from '@/components/tabs/PartnerTab';
import { DashboardTab } from '@/components/tabs/DashboardTab';

export default function Home() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabKey>('sale');

  // Themes
  const [selectedThemeKey, setSelectedThemeKey] = useState<ThemeKey>('miami');
  const [isAutoTheme, setIsAutoTheme] = useState<boolean>(true);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);

  // Audio State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Exchange Rate
  const [exchangeRate, setExchangeRate] = useState<number>(() => getExchangeRate());
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [tempRate, setTempRate] = useState(() => String(getExchangeRate()));

  // Supabase Modals
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isPrePushReviewOpen, setIsPrePushReviewOpen] = useState(false);

  // App Data with direct initializers
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => getStoredInvoices());
  const [partners, setPartners] = useState<Partner[]>(() => getStoredPartners());
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [logs, setLogs] = useState<StockMovementLog[]>(() => getStoredLogs());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => getStoredPurchases());

  // Reload data after sync or reset
  const reloadAllData = useCallback(() => {
    setProducts(getStoredProducts());
    setInvoices(getStoredInvoices());
    setPartners(getStoredPartners());
    setExpenses(getStoredExpenses());
    setLogs(getStoredLogs());
    setPurchases(getStoredPurchases());
    setExchangeRate(getExchangeRate());
    setTempRate(String(getExchangeRate()));
  }, []);

  useEffect(() => {
    // Sync sound preference
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);


  // Determine current active theme (if auto theme enabled, pick by active tab)
  const currentTheme = useMemo(() => {
    if (isAutoTheme) {
      const tabTheme = TAB_AUTO_THEMES[activeTab] || 'miami';
      return THEMES[tabTheme];
    }
    return THEMES[selectedThemeKey] || THEMES.miami;
  }, [isAutoTheme, activeTab, selectedThemeKey]);

  // Handle Theme Selection
  const handleSelectTheme = (key: ThemeKey) => {
    setSelectedThemeKey(key);
    setIsAutoTheme(false);
    localStorage.setItem('sbs_selected_theme_v2', key);
    localStorage.setItem('sbs_auto_theme_v2', 'false');
    setIsThemeMenuOpen(false);
    soundEffects.playBeep();
  };

  const handleToggleAutoTheme = () => {
    const nextVal = !isAutoTheme;
    setIsAutoTheme(nextVal);
    localStorage.setItem('sbs_auto_theme_v2', String(nextVal));
    soundEffects.playBeep();
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundEffects.setEnabled(nextVal);
    if (nextVal) soundEffects.playBeep();
  };

  // Hardware Scanner Hook (routes scanned barcodes)
  useHardwareScanner((scannedCode) => {
    // If not currently on Sale tab, switch to Sale tab to handle scan
    if (activeTab !== 'sale') {
      setActiveTab('sale');
    }
  });

  // State Updates & Persistence
  const handleUpdateProducts = (updated: Product[]) => {
    setProducts(updated);
    saveProducts(updated);
  };

  const handleSaveInvoice = (newInvoice: SaleInvoice) => {
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);

    // Update partner stats
    const updatedPartners = partners.map((p) => {
      if (p.id === newInvoice.partnerId) {
        return {
          ...p,
          totalBoughtUSD: (p.totalBoughtUSD || 0) + newInvoice.totalUSD,
          totalBoughtKHR: (p.totalBoughtKHR || 0) + newInvoice.totalRiel,
          totalPaidUSD: (p.totalPaidUSD || 0) + newInvoice.paidUSD,
          totalPaidKHR: (p.totalPaidKHR || 0) + newInvoice.paidRiel,
          currentDebtUSD: (p.currentDebtUSD || 0) + newInvoice.dueUSD,
          currentDebtKHR: (p.currentDebtKHR || 0) + newInvoice.dueRiel,
        };
      }
      return p;
    });
    setPartners(updatedPartners);
    savePartners(updatedPartners);
  };

  const handleUpdateInvoices = (updated: SaleInvoice[]) => {
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleSaveProduct = (prod: Product) => {
    const exists = products.some((p) => p.id === prod.id);
    const updated = exists ? products.map((p) => (p.id === prod.id ? prod : p)) : [prod, ...products];
    handleUpdateProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    handleUpdateProducts(updated);
  };

  const handleImportProducts = (imported: Product[]) => {
    const mergedMap = new Map(products.map((p) => [p.id, p]));
    imported.forEach((p) => mergedMap.set(p.id, p));
    handleUpdateProducts(Array.from(mergedMap.values()));
  };

  const handleAddPartner = (partner: Partner) => {
    const updated = [partner, ...partners];
    setPartners(updated);
    savePartners(updated);
  };

  const handleDeletePartner = (id: string) => {
    const updated = partners.filter((p) => p.id !== id);
    setPartners(updated);
    savePartners(updated);
  };

  const handleAddExpense = (expense: Expense) => {
    const updated = [expense, ...expenses];
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  };

  const handleSavePurchase = (po: PurchaseRecord) => {
    const updated = [po, ...purchases];
    setPurchases(updated);
    savePurchases(updated);
  };

  const handleAddLog = (log: StockMovementLog) => {
    const updated = [log, ...logs];
    setLogs(updated);
    saveLogs(updated);
  };

  const handleSaveExchangeRate = (e: React.FormEvent) => {
    e.preventDefault();
    const r = Number(tempRate) || 4100;
    setExchangeRate(r);
    saveExchangeRate(r);
    setIsExchangeModalOpen(false);
    soundEffects.playBeep();
  };

  const handleResetData = () => {
    if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យគំរូឡើងវិញ (Reset to Demo Data) ទាំងអស់មែនទេ?')) {
      resetAllDataToDefault();
      reloadAllData();
      soundEffects.playBeep();
    }
  };

  // 6 Tabs configuration
  const tabs = [
    { key: 'sale', label: 'លក់ (POS)', icon: ShoppingCart },
    { key: 'products', label: 'ទំនិញ', icon: Package },
    { key: 'purchase', label: 'ទិញចូល', icon: Truck },
    { key: 'inspect', label: 'ស្តុក', icon: Layers },
    { key: 'partner', label: 'ដៃគូ/បំណុល', icon: Users },
    { key: 'dashboard', label: 'ស្ថិតិ/ចំណេញ', icon: BarChart2 },
  ];

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.colors.bg,
        color: currentTheme.colors.text,
      }}
    >
      {/* TOP BAR / BRAND HEADER */}
      <header
        className="sticky top-0 z-40 border-b px-3 sm:px-6 py-2.5 backdrop-blur-md transition-colors duration-300"
        style={{
          backgroundColor: `${currentTheme.colors.card}EE`,
          borderColor: currentTheme.colors.border,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Wordmark & SB Monogram Icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-0.5 border border-amber-400/50 bg-gradient-to-br from-amber-400/20 to-emerald-900/60">
              <Image
                src="/icon.svg"
                alt="ដេប៉ូ សំណាង បូរិន"
                width={38}
                height={38}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1.5">
                <span style={{ color: currentTheme.colors.primary }}>ដេប៉ូ សំណាង បូរិន</span>
                <span className="hidden md:inline-block text-[11px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                  POS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                samnang borin shop · Mobile POS &amp; Warehouse
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links (Clean single-line tabs) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as TabKey);
                    soundEffects.playBeep();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 min-h-[40px] ${
                    isActive ? 'shadow-sm' : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isActive ? currentTheme.colors.primary : 'transparent',
                    color: isActive ? currentTheme.colors.primaryText : currentTheme.colors.text,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Top Actions: Rate + Cloud Sync + Theme + Sound + PWA Install */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Currency Exchange Rate Pill */}
            <button
              onClick={() => setIsExchangeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono flex items-center gap-1 transition min-h-[40px]"
              style={{
                borderColor: currentTheme.colors.border,
                backgroundColor: `${currentTheme.colors.cardHover}80`,
                color: currentTheme.colors.highlight,
              }}
              title="ប្តូរអត្រាប្តូរប្រាក់"
            >
              <span>1$ = {exchangeRate}៛</span>
            </button>

            {/* Cloud Sync Button */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="p-2 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              style={{
                borderColor: currentTheme.colors.border,
                backgroundColor: `${currentTheme.colors.cardHover}80`,
                color: currentTheme.colors.text,
              }}
              title="កំណត់ Supabase Cloud Sync"
              aria-label="Cloud Sync"
            >
              <Database className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              style={{
                borderColor: currentTheme.colors.border,
                backgroundColor: `${currentTheme.colors.cardHover}80`,
                color: soundEnabled ? currentTheme.colors.primary : currentTheme.colors.textMuted,
              }}
              title={soundEnabled ? 'បិទសំឡេង (Mute)' : 'បើកសំឡេង (Unmute)'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-2 rounded-xl border transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                style={{
                  borderColor: currentTheme.colors.border,
                  backgroundColor: `${currentTheme.colors.cardHover}80`,
                  color: currentTheme.colors.primary,
                }}
                title="ជ្រើសរើស Theme ពណ៌"
                aria-label="Theme Selector"
              >
                <Palette className="w-4 h-4" />
              </button>

              {isThemeMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border p-2 z-50 text-xs space-y-1 backdrop-blur-xl"
                  style={{
                    backgroundColor: currentTheme.colors.card,
                    borderColor: currentTheme.colors.border,
                  }}
                >
                  <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10">
                    <span className="font-bold text-white text-[11px]">៦ ពណ៌ Theme ទំនើប</span>
                    <button
                      onClick={handleToggleAutoTheme}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                        isAutoTheme
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {isAutoTheme ? 'Auto តាម Tab' : 'Manual'}
                    </button>
                  </div>

                  <div className="space-y-1 pt-1">
                    {Object.values(THEMES).map((thm) => {
                      const isChosen = currentTheme.id === thm.id;
                      return (
                        <button
                          key={thm.id}
                          onClick={() => handleSelectTheme(thm.id)}
                          className="w-full px-3 py-2 rounded-xl text-left flex items-center justify-between hover:bg-white/10 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/30"
                              style={{ backgroundColor: thm.colors.primary }}
                            />
                            <span className="font-medium text-white">{thm.nameKhmer}</span>
                          </div>
                          {isChosen && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-white/10">
                    <button
                      onClick={handleResetData}
                      className="w-full px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 text-[11px] flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>កំណត់ទិន្នន័យគំរូឡើងវិញ (Reset)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {activeTab === 'sale' && (
          <SaleTab
            products={products}
            partners={partners}
            exchangeRate={exchangeRate}
            onSaveInvoice={handleSaveInvoice}
            onUpdateProducts={handleUpdateProducts}
            onAddLog={handleAddLog}
            onAddPartner={handleAddPartner}
          />
        )}

        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            exchangeRate={exchangeRate}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onImportProducts={handleImportProducts}
          />
        )}

        {activeTab === 'purchase' && (
          <PurchaseTab
            products={products}
            partners={partners}
            purchases={purchases}
            exchangeRate={exchangeRate}
            onSavePurchase={handleSavePurchase}
            onUpdateProducts={handleUpdateProducts}
            onAddLog={handleAddLog}
          />
        )}

        {activeTab === 'inspect' && (
          <InspectTab
            products={products}
            logs={logs}
            onUpdateProducts={handleUpdateProducts}
            onAddLog={handleAddLog}
          />
        )}

        {activeTab === 'partner' && (
          <PartnerTab
            partners={partners}
            invoices={invoices}
            exchangeRate={exchangeRate}
            onSavePartner={handleAddPartner}
            onDeletePartner={handleDeletePartner}
            onUpdateInvoices={handleUpdateInvoices}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            invoices={invoices}
            expenses={expenses}
            exchangeRate={exchangeRate}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly touch targets >= 44x44px) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl px-2 py-1 flex items-center justify-around shadow-2xl transition-colors duration-300"
        style={{
          backgroundColor: `${currentTheme.colors.card}F5`,
          borderColor: currentTheme.colors.border,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabKey);
                soundEffects.playBeep();
              }}
              className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition active:scale-90 min-h-[48px]"
              style={{
                color: isActive ? currentTheme.colors.primary : currentTheme.colors.textMuted,
              }}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* EXCHANGE RATE MODAL */}
      {isExchangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveExchangeRate}
            className="w-full max-w-xs rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-xs space-y-3"
          >
            <h3 className="font-bold text-white text-sm">កំណត់អត្រាប្តូរប្រាក់ (Exchange Rate)</h3>
            <p className="text-slate-400 text-[11px]">
              ចំនួនប្រាក់រៀល (KHR) ស្មើនឹង ១ ដុល្លារ (USD)
            </p>

            <div>
              <input
                type="number"
                step="10"
                required
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-base tabular-nums focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExchangeModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300"
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

      {/* Supabase Connection Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onOpenPrePushReview={() => {
          setIsSupabaseModalOpen(false);
          setIsPrePushReviewOpen(true);
        }}
      />

      {/* Pre-Push Review Modal */}
      <PrePushReviewModal
        isOpen={isPrePushReviewOpen}
        onClose={() => setIsPrePushReviewOpen(false)}
        onDataChanged={reloadAllData}
      />
    </div>
  );
}
