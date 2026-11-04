'use client';

import React, { useState } from 'react';
import { Database, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  SupabaseConfig,
} from '@/lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrePushReview: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onOpenPrePushReview,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(() => getSupabaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig(config);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(config.url, config.anonKey);
    setTestResult(res);
    setTesting(false);
    if (res.success) {
      saveSupabaseConfig(config);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">តភ្ជាប់ Cloud Supabase</h3>
              <p className="text-xs text-slate-400">ផ្ទុកទិន្នន័យលើ Cloud &amp; ធ្វើសមកាលកម្មស្វ័យប្រវត្តិ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={config.anonKey}
              onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="font-medium text-slate-200">Auto Sync (ធ្វើសមកាលកម្មស្វ័យប្រវត្ត)</div>
              <div className="text-[11px] text-slate-400">Push ទិន្នន័យទៅ Cloud រាល់ពេលលក់រួចរាល់</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoSync}
                onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div className="text-xs leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Action to Pre-Push Review */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                saveSupabaseConfig(config);
                onOpenPrePushReview();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>ពិនិត្យការផ្លាស់ប្តូរទិន្នន័យ (Pre-Push Review Modal)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-5 py-3.5">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !config.url || !config.anonKey}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>សាកល្បងតភ្ជាប់</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
            >
              រក្សាទុកការកំណត់
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
