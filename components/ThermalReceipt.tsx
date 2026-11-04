'use client';

import React from 'react';
import { Printer, Share2, X, CheckCircle2, QrCode } from 'lucide-react';
import { SaleInvoice } from '@/types/pos';

interface ThermalReceiptProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `វិក្កយបត្រ ${invoice.invoiceNo} - ដេប៉ូ សំណាង បូរិន`,
          text: `វិក្កយបត្រ ${invoice.invoiceNo}\nអតិថិជន: ${invoice.partnerName}\nសរុប: $${invoice.totalUSD.toFixed(2)} (${invoice.totalRiel.toLocaleString()}៛)`,
        });
      } catch (err) {
        console.warn('Share error', err);
      }
    } else {
      navigator.clipboard.writeText(
        `វិក្កយបត្រ ${invoice.invoiceNo}\nអតិថិជន: ${invoice.partnerName}\nសរុប: $${invoice.totalUSD.toFixed(2)} (${invoice.totalRiel.toLocaleString()}៛)`
      );
      alert('បានចម្លងព័ត៌មានវិក្កយបត្រទៅក្នុង Clipboard!');
    }
  };

  const formattedDate = new Date(invoice.date).toLocaleString('km-KH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden my-auto border border-slate-300">
        {/* Modal Action Bar (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3 print:hidden">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>វិក្កយបត្រជោគជ័យ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>បោះពុម្ព</span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              title="ចែករំលែក"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
              title="បិទ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt (58mm - 80mm format) */}
        <div id="thermal-receipt" className="p-5 font-mono text-[13px] leading-tight text-slate-900 bg-white">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            {/* SB Monogram Stamp */}
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full border-2 border-slate-900 mb-1 font-sans font-black text-base text-slate-950">
              SB
            </div>
            <div className="font-extrabold text-base tracking-wide uppercase font-sans text-slate-950">
              ដេប៉ូ សំណាង បូរិន
            </div>
            <div className="text-[11px] font-sans font-semibold text-slate-600 mt-0.5">
              SAMNANG BORIN SHOP
            </div>
            <div className="text-[11px] text-slate-700 mt-1 font-sans">
              លក់ដុំ &amp; រាយ ស្រាបៀរ ភេសជ្ជៈ គ្រឿងទេសគ្រប់មុខ
            </div>
            <div className="text-[10px] text-slate-600 font-sans mt-0.5">
              ទូរស័ព្ទ: 012 888 999 / 098 777 666
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">លេខវិក្កយបត្រ:</span>
              <span className="font-bold">{invoice.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">កាលបរិច្ឆេទ:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">អ្នកគិតលុយ:</span>
              <span>សំណាង / បូរិន</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">អតិថិជន:</span>
              <span className="font-semibold text-right max-w-[170px] truncate">{invoice.partnerName}</span>
            </div>
            {invoice.partnerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-600">លេខទូរស័ព្ទ:</span>
                <span>{invoice.partnerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">អត្រាប្តូរប្រាក់:</span>
              <span>1$ = {invoice.exchangeRate.toLocaleString()} ៛</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="py-2 border-b border-slate-400 text-[11px] font-bold grid grid-cols-12 gap-1 text-slate-800">
            <div className="col-span-6">មុខទំនិញ</div>
            <div className="col-span-3 text-right">ចំនួន</div>
            <div className="col-span-3 text-right">សរុប($)</div>
          </div>

          {/* Items */}
          <div className="py-2 space-y-2 border-b border-dashed border-slate-400">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="text-[11px]">
                <div className="font-sans font-semibold text-slate-900 leading-snug">
                  {item.product.productname}
                </div>
                <div className="flex justify-between items-center text-slate-600 text-[10px] mt-0.5">
                  <span>
                    {item.qty} {item.unitLabel} x ${item.priceUSD.toFixed(2)}
                    <span className="ml-1 text-[9px] bg-slate-100 px-1 rounded">
                      {item.location === 'home' ? 'ផ្ទះ' : 'ឃ្លាំង'}
                    </span>
                  </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    ${item.subtotalUSD.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-400 text-xs">
            <div className="flex justify-between font-bold text-sm text-slate-950 pt-1">
              <span>សរុប (Total USD):</span>
              <span className="tabular-nums">${invoice.totalUSD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-emerald-800">
              <span>សរុបជាប្រាក់រៀល:</span>
              <span className="tabular-nums">{invoice.totalRiel.toLocaleString()} ៛</span>
            </div>

            <div className="border-t border-slate-200 pt-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>វិធីទូទាត់:</span>
                <span className="font-bold uppercase">
                  {invoice.paymentType === 'paid' ? 'បង់ដាច់ (Paid)' : invoice.paymentType === 'credit' ? 'ជំពាក់ (Credit)' : 'បង់ខ្លះ (Partial)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>ប្រាក់បានបង់ (Paid):</span>
                <span className="tabular-nums font-semibold">${invoice.paidUSD.toFixed(2)} ({invoice.paidRiel.toLocaleString()} ៛)</span>
              </div>
              {invoice.dueUSD > 0 && (
                <div className="flex justify-between font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                  <span>នៅខ្វះ / ជំពាក់ (Due):</span>
                  <span className="tabular-nums">${invoice.dueUSD.toFixed(2)} ({invoice.dueRiel.toLocaleString()} ៛)</span>
                </div>
              )}
              {invoice.dueDate && invoice.dueUSD > 0 && (
                <div className="flex justify-between text-[10px] text-rose-600">
                  <span>ថ្ងៃកំណត់សង:</span>
                  <span>{invoice.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* BAKONG KHQR PAYMENT STAMP */}
          <div className="my-3 p-2.5 border-2 border-red-600 rounded-xl bg-white text-center space-y-1.5">
            <div className="bg-red-600 text-white font-extrabold text-[12px] py-0.5 rounded tracking-widest font-sans flex items-center justify-center gap-1">
              <span>KHQR</span>
            </div>
            <div className="text-[10px] font-sans font-bold text-slate-800 uppercase">
              SAMNANG BORIN SHOP
            </div>
            {/* SVG Visual of KHQR */}
            <div className="flex justify-center py-1">
              <svg width="120" height="120" viewBox="0 0 100 100" className="mx-auto">
                <rect width="100" height="100" fill="white" />
                {/* 3 Corner Anchor Marks */}
                <rect x="5" y="5" width="25" height="25" fill="#E11D48" rx="3" />
                <rect x="9" y="9" width="17" height="17" fill="white" rx="2" />
                <rect x="13" y="13" width="9" height="9" fill="#E11D48" />

                <rect x="70" y="5" width="25" height="25" fill="#E11D48" rx="3" />
                <rect x="74" y="9" width="17" height="17" fill="white" rx="2" />
                <rect x="78" y="13" width="9" height="9" fill="#E11D48" />

                <rect x="5" y="70" width="25" height="25" fill="#E11D48" rx="3" />
                <rect x="9" y="74" width="17" height="17" fill="white" rx="2" />
                <rect x="13" y="78" width="9" height="9" fill="#E11D48" />

                {/* Simulated QR matrix points */}
                <rect x="36" y="8" width="5" height="5" fill="#1E293B" />
                <rect x="46" y="8" width="5" height="5" fill="#1E293B" />
                <rect x="56" y="8" width="5" height="5" fill="#1E293B" />
                <rect x="36" y="18" width="5" height="5" fill="#1E293B" />
                <rect x="46" y="18" width="5" height="5" fill="#1E293B" />
                <rect x="56" y="18" width="5" height="5" fill="#1E293B" />

                <rect x="10" y="36" width="5" height="5" fill="#1E293B" />
                <rect x="20" y="36" width="5" height="5" fill="#1E293B" />
                <rect x="30" y="36" width="5" height="5" fill="#1E293B" />
                <rect x="45" y="45" width="10" height="10" fill="#E11D48" rx="2" />
                <rect x="60" y="36" width="5" height="5" fill="#1E293B" />
                <rect x="70" y="36" width="5" height="5" fill="#1E293B" />
                <rect x="80" y="36" width="5" height="5" fill="#1E293B" />

                <rect x="36" y="60" width="5" height="5" fill="#1E293B" />
                <rect x="46" y="60" width="5" height="5" fill="#1E293B" />
                <rect x="56" y="60" width="5" height="5" fill="#1E293B" />
                <rect x="36" y="75" width="5" height="5" fill="#1E293B" />
                <rect x="46" y="75" width="5" height="5" fill="#1E293B" />
                <rect x="60" y="75" width="5" height="5" fill="#1E293B" />
                <rect x="75" y="75" width="15" height="15" fill="#1E293B" />
              </svg>
            </div>
            <div className="text-[10px] text-slate-700 font-sans">
              ស្កេនទូទាត់តាម <strong>Bakong / ABA / ACLEDA / Wing</strong>
            </div>
            <div className="font-extrabold text-[11px] text-slate-900 font-sans tabular-nums">
              ${invoice.totalUSD.toFixed(2)} ({invoice.totalRiel.toLocaleString()}៛)
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[10px] font-sans text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">សូមអរគុណដែលបានគាំទ្រ ដេប៉ូ សំណាង បូរិន!</p>
            <p>ទំនិញទិញរួចមិនអាចប្តូរយកប្រាក់វិញបានទេ</p>
            <div className="pt-1 text-[9px] text-slate-400">
              * Powered by Samnang Borin Mobile POS *
            </div>
          </div>
        </div>

        {/* Modal Done Button (Hidden in print) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition"
          >
            រួចរាល់ (បិទ)
          </button>
        </div>
      </div>
    </div>
  );
};
