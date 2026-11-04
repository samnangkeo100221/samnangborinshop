'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Receipt,
  Plus,
  Coins,
  X,
  CreditCard,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Partner, Repayment, SaleInvoice } from '@/types/pos';
import { soundEffects } from '@/lib/audio';

interface PartnerTabProps {
  partners: Partner[];
  invoices: SaleInvoice[];
  exchangeRate: number;
  onSavePartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
  onUpdateInvoices: (invoices: SaleInvoice[]) => void;
}

function makeRepaymentId(): string {
  return `REP-${Date.now()}`;
}

function makeNewPartnerId(): string {
  return `PART-${Date.now().toString().slice(-4)}`;
}

export const PartnerTab: React.FC<PartnerTabProps> = ({
  partners,
  invoices,
  exchangeRate,
  onSavePartner,
  onDeletePartner,
  onUpdateInvoices,
}) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    partners[0]?.id || ''
  );
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Repayment Modal
  const [isRepaymentOpen, setIsRepaymentOpen] = useState(false);
  const [targetInvoiceForRepay, setTargetInvoiceForRepay] = useState<SaleInvoice | null>(null);
  const [repayAmountUSD, setRepayAmountUSD] = useState<string>('');
  const [repayAmountKHR, setRepayAmountKHR] = useState<string>('');
  const [repayNote, setRepayNote] = useState<string>('');

  // Selected Partner Details & Invoices
  const currentPartner = useMemo(
    () => partners.find((p) => p.id === selectedPartnerId) || partners[0],
    [partners, selectedPartnerId]
  );

  const partnerInvoices = useMemo(
    () => invoices.filter((inv) => inv.partnerId === currentPartner?.id),
    [invoices, currentPartner]
  );

  // Calculations for Current Partner
  const totalBoughtUSD = useMemo(
    () => partnerInvoices.reduce((acc, inv) => acc + inv.totalUSD, 0),
    [partnerInvoices]
  );
  const totalPaidUSD = useMemo(
    () =>
      partnerInvoices.reduce(
        (acc, inv) =>
          acc +
          inv.paidUSD +
          inv.repayments.reduce((rAcc, r) => rAcc + r.amountUSD, 0),
        0
      ),
    [partnerInvoices]
  );
  const totalDebtUSD = useMemo(
    () => Math.max(0, partnerInvoices.reduce((acc, inv) => acc + inv.dueUSD, 0)),
    [partnerInvoices]
  );
  const totalDebtKHR = Math.round(totalDebtUSD * exchangeRate);

  // Open Repayment modal
  const handleOpenRepayment = (inv: SaleInvoice) => {
    setTargetInvoiceForRepay(inv);
    setRepayAmountUSD(inv.dueUSD.toFixed(2));
    setRepayAmountKHR(inv.dueRiel.toString());
    setRepayNote('សងប្រាក់បំណុល');
    setIsRepaymentOpen(true);
  };

  // Submit Repayment
  const handleSubmitRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForRepay) return;

    const paidUSD = Number(repayAmountUSD) || 0;
    const paidKHR = Number(repayAmountKHR) || 0;
    const totalRepayUSD = paidUSD + paidKHR / exchangeRate;

    if (totalRepayUSD <= 0) {
      alert('សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រូវសង');
      return;
    }

    const newRepayment: Repayment = {
      id: makeRepaymentId(),
      date: new Date().toISOString(),
      amountUSD: Number(totalRepayUSD.toFixed(2)),
      amountKHR: Math.round(totalRepayUSD * exchangeRate),
      note: repayNote || 'សងប្រាក់បំណុល',
    };

    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === targetInvoiceForRepay.id) {
        const remainingDueUSD = Math.max(0, Number((inv.dueUSD - totalRepayUSD).toFixed(2)));
        const remainingDueKHR = Math.round(remainingDueUSD * exchangeRate);
        const debtStatus = remainingDueUSD <= 0.05 ? 'settled' : 'partial';

        return {
          ...inv,
          dueUSD: remainingDueUSD,
          dueRiel: remainingDueKHR,
          debtStatus: debtStatus as 'settled' | 'partial',
          repayments: [...inv.repayments, newRepayment],
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvoices);
    soundEffects.playCashRegister();
    setIsRepaymentOpen(false);
    alert('បានកត់ត្រាការសងប្រាក់បំណុលដោយជោគជ័យ!');
  };

  // Handle Save New or Edit Partner
  const handleSavePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    onSavePartner(editingPartner);
    soundEffects.playBeep();
    setIsAddPartnerOpen(false);
    setEditingPartner(null);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* Top Header Card */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">ដៃគូអាជីវកម្ម &amp; សៀវភៅបំណុល (CRM &amp; Debt)</h2>
            <p className="text-xs text-slate-400">
              គ្រប់គ្រងអតិថិជន អ្នកផ្គត់ផ្គង់ និងតាមដានបំណុលលម្អិត
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingPartner({
              id: makeNewPartnerId(),
              name: '',
              phone: '',
              address: '',
              type: 'customer',
              totalBoughtUSD: 0,
              totalBoughtKHR: 0,
              totalPaidUSD: 0,
              totalPaidKHR: 0,
              currentDebtUSD: 0,
              currentDebtKHR: 0,
            });
            setIsAddPartnerOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>បន្ថែមដៃគូថ្មី</span>
        </button>
      </div>

      {/* Main Grid: Partner List Left (4 cols), Ledger Details Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Partner Directory (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md">
            <h3 className="font-semibold text-white text-xs mb-2.5">
              បញ្ជីដៃគូ ({partners.length})
            </h3>

            <div className="divide-y divide-slate-700/60 max-h-[520px] overflow-y-auto pr-1">
              {partners.map((p) => {
                // calculate partner debt dynamically
                const pInvs = invoices.filter((i) => i.partnerId === p.id);
                const pDebtUSD = pInvs.reduce((acc, i) => acc + i.dueUSD, 0);

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPartnerId(p.id)}
                    className={`w-full py-2.5 px-2 rounded-xl text-left transition flex items-start justify-between gap-2 ${
                      selectedPartnerId === p.id
                        ? 'bg-slate-700/80 border border-amber-400/50 shadow'
                        : 'hover:bg-slate-750'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white text-xs">{p.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{p.phone || 'គ្មានលេខ'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {pDebtUSD > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          ជំពាក់ ${pDebtUSD.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          គ្មានបំណុល
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Selected Partner Debt Ledger (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          {currentPartner ? (
            <>
              {/* Partner Profile & Summary */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700 gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      {currentPartner.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
                        {currentPartner.type === 'supplier'
                          ? 'អ្នកផ្គត់ផ្គង់'
                          : currentPartner.type === 'both'
                          ? 'អតិថិជន & អ្នកផ្គត់ផ្គង់'
                          : 'អតិថិជន'}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        {currentPartner.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {currentPartner.address || 'ភ្នំពេញ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPartner({ ...currentPartner });
                        setIsAddPartnerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition"
                    >
                      កែប្រែ
                    </button>
                    {currentPartner.id !== 'PART-000' && (
                      <button
                        onClick={() => {
                          if (confirm(`តើអ្នកចង់លុបដៃគូ "${currentPartner.name}" ដែរឬទេ?`)) {
                            onDeletePartner(currentPartner.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-rose-900 text-rose-300 text-xs font-medium transition"
                      >
                        លុប
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">ទិញសរុប (Purchased):</span>
                    <div className="text-base font-bold text-white tabular-nums mt-0.5">
                      ${totalBoughtUSD.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">បានទូទាត់ (Paid):</span>
                    <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5">
                      ${totalPaidUSD.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60">
                    <span className="text-rose-300 font-semibold">បំណុលនៅខ្វះសរុប (Due):</span>
                    <div className="text-base font-black text-rose-400 tabular-nums mt-0.5">
                      ${totalDebtUSD.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-rose-300 tabular-nums">
                      {totalDebtKHR.toLocaleString()} ៛
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices & Debt Ledger Table */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-400" />
                    វិក្កយបត្រទាំងអស់របស់ {currentPartner.name} ({partnerInvoices.length})
                  </span>
                </div>

                <div className="divide-y divide-slate-700/60 max-h-[380px] overflow-y-auto">
                  {partnerInvoices.map((inv) => (
                    <div key={inv.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{inv.invoiceNo}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              inv.debtStatus === 'settled'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : inv.debtStatus === 'unpaid'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {inv.debtStatus === 'settled'
                              ? 'បង់ដាច់'
                              : inv.debtStatus === 'unpaid'
                              ? 'មិនទាន់បង់'
                              : 'បង់ខ្លះ'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(inv.date).toLocaleString('km-KH')} · {inv.items.length} មុខទំនិញ
                        </div>
                        {inv.dueDate && inv.dueUSD > 0 && (
                          <div className="text-[10px] text-rose-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>សន្យាសង: {inv.dueDate}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right flex items-center justify-between sm:justify-end gap-3">
                        <div>
                          <div className="font-bold text-white tabular-nums">
                            សរុប: ${inv.totalUSD.toFixed(2)}
                          </div>
                          {inv.dueUSD > 0 ? (
                            <div className="text-rose-400 font-bold text-xs tabular-nums">
                              នៅខ្វះ: ${inv.dueUSD.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-emerald-400 text-[10px]">
                              ទូទាត់រួចរាល់
                            </div>
                          )}
                        </div>

                        {inv.dueUSD > 0 && (
                          <button
                            onClick={() => handleOpenRepayment(inv)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95"
                          >
                            សងប្រាក់
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {partnerInvoices.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      ដៃគូនេះមិនទាន់មានវិក្កយបត្រទិញលក់នៅឡើយទេ
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              សូមជ្រើសរើសដៃគូនៅខាងឆ្វេង
            </div>
          )}
        </div>
      </div>

      {/* REPAYMENT MODAL */}
      {isRepaymentOpen && targetInvoiceForRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitRepayment}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-xs space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                កត់ត្រាការសងប្រាក់បំណុល
              </h3>
              <button
                type="button"
                onClick={() => setIsRepaymentOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">លេខវិក្កយបត្រ:</span>
                <span className="font-bold text-white">{targetInvoiceForRepay.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">អតិថិជន:</span>
                <span className="font-semibold text-white">{targetInvoiceForRepay.partnerName}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold">
                <span>បំណុលនៅខ្វះ:</span>
                <span className="tabular-nums">
                  ${targetInvoiceForRepay.dueUSD.toFixed(2)} ({targetInvoiceForRepay.dueRiel.toLocaleString()}៛)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                ចំនួនទឹកប្រាក់សង ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={repayAmountUSD}
                onChange={(e) => setRepayAmountUSD(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">ចំណាំ (Note)</label>
              <input
                type="text"
                placeholder="ឧ. សងដាច់ទាំងអស់ / វេរតាម ABA..."
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRepaymentOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow"
              >
                បញ្ជាក់ការសងប្រាក់
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD / EDIT PARTNER MODAL */}
      {isAddPartnerOpen && editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSavePartnerSubmit}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-xs space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">
                {partners.some((p) => p.id === editingPartner.id) ? 'កែប្រែដៃគូ' : 'បន្ថែមដៃគូថ្មី'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPartnerOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">ឈ្មោះដៃគូ *</label>
              <input
                type="text"
                required
                placeholder="ឧ. ម៉ាត សុខា ផ្សារបឹងកេងកង"
                value={editingPartner.name}
                onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">លេខទូរស័ព្ទ</label>
              <input
                type="text"
                placeholder="012 345 678"
                value={editingPartner.phone}
                onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">អាសយដ្ឋាន</label>
              <input
                type="text"
                placeholder="ឧ. ផ្ទះលេខ ១២ ផ្លូវ ៦៣ ភ្នំពេញ"
                value={editingPartner.address}
                onChange={(e) => setEditingPartner({ ...editingPartner, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">តួនាទី</label>
              <select
                value={editingPartner.type}
                onChange={(e) =>
                  setEditingPartner({
                    ...editingPartner,
                    type: e.target.value as 'customer' | 'supplier' | 'both',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="customer">អតិថិជន (Customer)</option>
                <option value="supplier">អ្នកផ្គត់ផ្គង់ (Supplier)</option>
                <option value="both">ទាំងពីរ (Customer &amp; Supplier)</option>
              </select>
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
    </div>
  );
};
