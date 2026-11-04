'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  Trash2,
  Calendar,
  Receipt,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Expense, ExpenseCategory, SaleInvoice } from '@/types/pos';
import { soundEffects } from '@/lib/audio';

interface DashboardTabProps {
  invoices: SaleInvoice[];
  expenses: Expense[];
  exchangeRate: number;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

function makeExpenseId(): string {
  return `EXP-${Date.now()}`;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'ថ្លៃដឹកជញ្ជូន',
  'ប្រាក់ខែ/ឈ្នួល',
  'ទឹកភ្លើង/Net',
  'អាហារ',
  'ជួលទីតាំង',
  'សម្ភារៈវេចខ្ចប់',
  'ផ្សេងៗ',
];

const PIE_COLORS = ['#FFBA00', '#5CCDF1', '#F0C38E', '#9FA0FF', '#00C689', '#FF8A65', '#A1E6E8'];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  invoices,
  expenses,
  exchangeRate,
  onAddExpense,
  onDeleteExpense,
}) => {
  // Expense Form State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCat, setExpenseCat] = useState<ExpenseCategory>('ថ្លៃដឹកជញ្ជូន');
  const [expenseAmountUSD, setExpenseAmountUSD] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('បូរិន');
  const [expenseNote, setExpenseNote] = useState('');

  // 1. Sales & Gross Profit Totals
  const totalGrossSalesUSD = useMemo(
    () => invoices.reduce((acc, inv) => acc + inv.totalUSD, 0),
    [invoices]
  );
  const totalGrossSalesKHR = Math.round(totalGrossSalesUSD * exchangeRate);

  const totalGrossProfitUSD = useMemo(
    () => invoices.reduce((acc, inv) => acc + inv.totalProfitUSD, 0),
    [invoices]
  );
  const totalGrossProfitKHR = Math.round(totalGrossProfitUSD * exchangeRate);

  // 2. Expenses Total
  const totalExpensesUSD = useMemo(
    () => expenses.reduce((acc, e) => acc + e.amountUSD, 0),
    [expenses]
  );
  const totalExpensesKHR = Math.round(totalExpensesUSD * exchangeRate);

  // 3. Net Profit Calculation: Net Profit = Gross Profit from Sales - Total Expenses
  const netProfitUSD = Number((totalGrossProfitUSD - totalExpensesUSD).toFixed(2));
  const netProfitKHR = Math.round(netProfitUSD * exchangeRate);
  const profitMargin =
    totalGrossSalesUSD > 0
      ? ((netProfitUSD / totalGrossSalesUSD) * 100).toFixed(1)
      : '0.0';

  // 4. Daily Sales / Profit Data for Chart (last 7 days)
  const chartData = useMemo(() => {
    const daysMap: Record<string, { date: string; sales: number; profit: number; expenses: number }> = {};
    const baseTime = invoices.length > 0 ? new Date(invoices[0].date).getTime() : 1772697600000;

    // Seed 7 days relative to recent activity
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseTime - 86400000 * i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      daysMap[key] = { date: key, sales: 0, profit: 0, expenses: 0 };
    }


    invoices.forEach((inv) => {
      const dKey = inv.date.slice(5, 10);
      if (daysMap[dKey]) {
        daysMap[dKey].sales += inv.totalUSD;
        daysMap[dKey].profit += inv.totalProfitUSD;
      }
    });

    expenses.forEach((e) => {
      const dKey = e.date.slice(5, 10);
      if (daysMap[dKey]) {
        daysMap[dKey].expenses += e.amountUSD;
      }
    });

    return Object.values(daysMap);
  }, [invoices, expenses]);

  // 5. Sales by Category Breakdown
  const categorySalesData = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach((inv) => {
      inv.items.forEach((it) => {
        const cat = it.product.type || 'ផ្សេងៗ';
        map[cat] = (map[cat] || 0) + it.subtotalUSD;
      });
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [invoices]);

  // Handle Add Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expenseAmountUSD) || 0;
    if (amount <= 0 || !expenseTitle.trim()) return;

    const newExp: Expense = {
      id: makeExpenseId(),
      date: new Date().toISOString().slice(0, 10),
      category: expenseCat,
      title: expenseTitle.trim(),
      amountUSD: amount,
      amountKHR: Math.round(amount * exchangeRate),
      paidBy: expensePaidBy.trim() || 'បូរិន',
      note: expenseNote.trim() || undefined,
    };

    onAddExpense(newExp);
    soundEffects.playBeep();
    setExpenseTitle('');
    setExpenseAmountUSD('');
    setExpenseNote('');
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-6">
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Gross Revenue */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
          <div className="text-slate-400 flex items-center justify-between mb-1">
            <span>ចំណូលសរុប (Gross Sales)</span>
            <div className="p-1 rounded-lg bg-amber-400/20 text-amber-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-400 tabular-nums">
            ${totalGrossSalesUSD.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
            {totalGrossSalesKHR.toLocaleString()} ៛
          </div>
        </div>

        {/* Gross Profit from Sales */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
          <div className="text-slate-400 flex items-center justify-between mb-1">
            <span>ចំណេញដុល (Gross Profit)</span>
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-400 tabular-nums">
            ${totalGrossProfitUSD.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
            {totalGrossProfitKHR.toLocaleString()} ៛
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-md">
          <div className="text-slate-400 flex items-center justify-between mb-1">
            <span>ការចំណាយសរុប (Expenses)</span>
            <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-400 tabular-nums">
            ${totalExpensesUSD.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
            {totalExpensesKHR.toLocaleString()} ៛
          </div>
        </div>

        {/* NET PROFIT: Gross Profit - Total Expenses */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 shadow-md">
          <div className="text-emerald-300 font-semibold flex items-center justify-between mb-1">
            <span>ចំណេញសុទ្ធ (Net Profit)</span>
            <div className="p-1 rounded-lg bg-emerald-400 text-slate-950">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-xl font-black tabular-nums ${
              netProfitUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            ${netProfitUSD.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-300 tabular-nums mt-0.5">
            {netProfitKHR.toLocaleString()} ៛ (Margin: {profitMargin}%)
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sales & Profit Trend Area Chart (8 Cols) */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              និន្នាការលក់ និងចំណេញ ៧ថ្ងៃចុងក្រោយ (Sales &amp; Profit Trend)
            </h3>
            <span className="text-[10px] text-slate-400">គិតជាដុល្លារ ($)</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFBA00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FFBA00" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C689" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00C689" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#F8FAFC',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="ចំណូលលក់ ($)"
                  stroke="#FFBA00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="ចំណេញ ($)"
                  stroke="#00C689"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Chart (4 Cols) */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              ចំណូលតាមប្រភេទទំនិញ
            </h3>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center">
            {categorySalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categorySalesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#F8FAFC',
                    }}
                    formatter={(val: any) => [`$${val}`, 'ចំណូល']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs">
                មិនទាន់មានទិន្នន័យលក់តាមប្រភេទឡើយ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXPENSE MANAGER (គ្រប់គ្រងការចំណាយ) */}
      <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-700 gap-2">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-rose-400" />
              គ្រប់គ្រងការចំណាយប្រតិបត្តិការ (Expense Manager)
            </h3>
            <p className="text-[11px] text-slate-400">
              ចំណាយសរុប: ${totalExpensesUSD.toFixed(2)} ({totalExpensesKHR.toLocaleString()} ៛)
            </p>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>កត់ត្រាចំណាយថ្មី</span>
          </button>
        </div>

        {/* Expenses List Table */}
        <div className="divide-y divide-slate-700/60 max-h-[350px] overflow-y-auto pr-1">
          {expenses.map((e) => (
            <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>{e.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 font-normal">
                    {e.category}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  កាលបរិច្ឆេទ: {e.date} · បង់ដោយ: {e.paidBy} {e.note ? `· ${e.note}` : ''}
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="font-bold text-rose-400 tabular-nums">
                    -${e.amountUSD.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    -{e.amountKHR.toLocaleString()} ៛
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`តើអ្នកចង់លុបការចំណាយ "${e.title}" ដែរឬទេ?`)) {
                      onDeleteExpense(e.id);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              មិនទាន់មានការចំណាយណាមួយត្រូវបានកត់ត្រាឡើយ
            </div>
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateExpense}
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-xs space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">កត់ត្រាការចំណាយថ្មី</h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">ប្រភេទចំណាយ *</label>
              <select
                value={expenseCat}
                onChange={(e) => setExpenseCat(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">ចំណងជើងចំណាយ *</label>
              <input
                type="text"
                required
                placeholder="ឧ. ថ្លៃសាំងឡានដឹកទំនិញ..."
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">ចំនួនទឹកប្រាក់ ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={expenseAmountUSD}
                onChange={(e) => setExpenseAmountUSD(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">អ្នកបើកប្រាក់</label>
              <input
                type="text"
                value={expensePaidBy}
                onChange={(e) => setExpensePaidBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">ចំណាំបន្ថែម</label>
              <input
                type="text"
                placeholder="ព័ត៌មានលម្អិត..."
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                រក្សាទុកចំណាយ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
