'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, DownloadCloud, X, CheckCircle, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import {
  analyzeSyncStatus,
  pushLocalToSupabase,
  pullSupabaseToLocal,
  SyncReviewSummary,
} from '@/lib/supabase';
import { soundEffects } from '@/lib/audio';

interface PrePushReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const PrePushReviewModal: React.FC<PrePushReviewModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SyncReviewSummary | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setActionResult(null);
    const data = await analyzeSyncStatus();
    setSummary(data);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      analyzeSyncStatus().then((data) => {
        if (isMounted) {
          setSummary(data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePush = async () => {
    setLoading(true);
    setActionResult(null);
    const res = await pushLocalToSupabase();
    setActionResult(res);
    setLoading(false);
    if (res.success) {
      soundEffects.playCashRegister();
      await fetchSummary();
      onDataChanged();
    } else {
      soundEffects.playWarning();
    }
  };

  const handlePull = async () => {
    if (!confirm('ការ Pull នឹងជំនួសទិន្នន័យ Local ដោយទិន្នន័យពី Supabase Cloud។ តើអ្នកចង់បន្តដែរឬទេ?')) {
      return;
    }
    setLoading(true);
    setActionResult(null);
    const res = await pullSupabaseToLocal();
    setActionResult(res);
    setLoading(false);
    if (res.success) {
      soundEffects.playBeep();
      await fetchSummary();
      onDataChanged();
    } else {
      soundEffects.playWarning();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Pre-Push Review (ត្រួតពិនិត្យមុន Sync)</h3>
              <p className="text-xs text-slate-400">ប្រៀបធៀបទិន្នន័យលើឧបករណ៍ ⇄ Cloud Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <span className="text-slate-300 font-medium">ស្ថានភាពតភ្ជាប់ Cloud:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                summary?.connected
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {summary?.connected ? 'Online (បានភ្ជាប់)' : 'Offline (មិនទាន់ភ្ជាប់)'}
            </span>
          </div>

          {/* Data Comparison Table */}
          <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-950/40">
            <div className="grid grid-cols-12 bg-slate-800 px-3 py-2 font-medium text-slate-300 text-[11px]">
              <div className="col-span-5">ប្រភេទតារាងទិន្នន័យ</div>
              <div className="col-span-3 text-right">លើម៉ាស៊ីន (Local)</div>
              <div className="col-span-4 text-right">លើ Supabase Cloud</div>
            </div>

            <div className="divide-y divide-slate-800 text-slate-300">
              <div className="grid grid-cols-12 px-3 py-2 items-center">
                <span className="col-span-5 font-medium text-white">ទំនិញ (Products)</span>
                <span className="col-span-3 text-right tabular-nums font-bold text-amber-400">
                  {summary?.localCounts.products ?? '-'}
                </span>
                <span className="col-span-4 text-right tabular-nums text-emerald-400">
                  {summary?.remoteCounts.products ?? 0}
                </span>
              </div>

              <div className="grid grid-cols-12 px-3 py-2 items-center">
                <span className="col-span-5 font-medium text-white">វិក្កយបត្រ (Invoices)</span>
                <span className="col-span-3 text-right tabular-nums font-bold text-amber-400">
                  {summary?.localCounts.invoices ?? '-'}
                </span>
                <span className="col-span-4 text-right tabular-nums text-emerald-400">
                  {summary?.remoteCounts.invoices ?? 0}
                </span>
              </div>

              <div className="grid grid-cols-12 px-3 py-2 items-center">
                <span className="col-span-5 font-medium text-white">ដៃគូ/អតិថិជន (Partners)</span>
                <span className="col-span-3 text-right tabular-nums font-bold text-amber-400">
                  {summary?.localCounts.partners ?? '-'}
                </span>
                <span className="col-span-4 text-right tabular-nums text-emerald-400">
                  {summary?.remoteCounts.partners ?? 0}
                </span>
              </div>

              <div className="grid grid-cols-12 px-3 py-2 items-center">
                <span className="col-span-5 font-medium text-white">ចំណាយ (Expenses)</span>
                <span className="col-span-3 text-right tabular-nums font-bold text-amber-400">
                  {summary?.localCounts.expenses ?? '-'}
                </span>
                <span className="col-span-4 text-right tabular-nums text-emerald-400">
                  {summary?.remoteCounts.expenses ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Sanitize & Safety Notice */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-blue-200 flex items-start gap-2 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <span className="font-semibold text-white">សុវត្ថិភាពទិន្នន័យ (Sanitized IDs):</span> ប្រព័ន្ធនឹងធ្វើការសំអាត ID ស្វ័យប្រវត្តិកុំឱ្យជាន់គ្នា និង Upsert ដោយសុវត្ថិភាព មិនធ្វើឱ្យបាត់បង់ទិន្នន័យចាស់ឡើយ។
            </div>
          </div>

          {/* Result Alert */}
          {actionResult && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 ${
                actionResult.success
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {actionResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div className="text-xs leading-relaxed">{actionResult.message}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-800 bg-slate-950 px-5 py-3.5">
          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>ពិនិត្យឡើងវិញ</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePull}
              disabled={loading || !summary?.connected}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 text-xs font-semibold border border-slate-700"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Pull (ទាញយក)</span>
            </button>
            <button
              type="button"
              onClick={handlePush}
              disabled={loading || !summary?.connected}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 text-xs font-bold shadow-md transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Push ទៅ Cloud</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
