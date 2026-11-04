'use client';

import React from 'react';
import { Delete, RotateCcw, Percent, Hash, Tag, Plus } from 'lucide-react';

export type NumpadMode = 'qty' | 'discount' | 'price';

interface PosNumpadProps {
  mode: NumpadMode;
  onModeChange: (mode: NumpadMode) => void;
  onNumberPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onQuickAdd: (amount: number) => void;
  quickAddPresets?: number[];
  primaryColor?: string;
}

export const PosNumpad: React.FC<PosNumpadProps> = ({
  mode,
  onModeChange,
  onNumberPress,
  onBackspace,
  onClear,
  onQuickAdd,
  quickAddPresets = [1, 5, 10, 24],
  primaryColor = '#FFBA00',
}) => {
  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner select-none">
      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => onModeChange('qty')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
            mode === 'qty'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>ចំនួន (Qty)</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('discount')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
            mode === 'discount'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>បញ្ចុះ (Disc)</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange('price')}
          className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
            mode === 'price'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>តម្លៃ (Price)</span>
        </button>
      </div>

      {/* Quick Increments Chips (e.g., +1, +5, +10, +24) */}
      <div className="grid grid-cols-4 gap-1 text-xs">
        {quickAddPresets.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => onQuickAdd(val)}
            className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center justify-center gap-0.5 active:scale-95 transition"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>{val}</span>
          </button>
        ))}
      </div>

      {/* Keypad Grid (1-9, C, 0, ⌫) */}
      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
        {/* Row 1 */}
        <button
          type="button"
          onClick={() => onNumberPress('7')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('8')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('9')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          9
        </button>
        <button
          type="button"
          onClick={onClear}
          className="h-11 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
          title="លុបចោលទាំងអស់"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>C</span>
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => onNumberPress('4')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('5')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('6')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          6
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center active:scale-95 transition"
          title="លុប១ខ្ទង់"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => onNumberPress('1')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('2')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('3')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('.')}
          className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          .
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => onNumberPress('0')}
          className="col-span-2 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base shadow active:scale-95 transition"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onNumberPress('00')}
          className="col-span-2 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shadow active:scale-95 transition"
        >
          00
        </button>
      </div>
    </div>
  );
};
