import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  PieChart as PieChartIcon, 
  List as ListIcon, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Calendar,
  IndianRupee,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { cn, CATEGORIES, CATEGORY_COLORS, type Expense, type Category, type Income, type Budget } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { LoginPage } from './components/LoginPage';

export default function App() {
  // --- State ---
  const [user, setUser] = useState<{ identifier: string } | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      const userKey = `data_${user.identifier}`;
      const savedData = localStorage.getItem(userKey);
      if (savedData) {
        const { expenses: e, incomes: i, budgets: b } = JSON.parse(savedData);
        setExpenses(e || []);
        setIncomes(i || []);
        setBudgets(b || []);
      } else {
        setExpenses([]);
        setIncomes([]);
        setBudgets([]);
      }
    }
  }, [user]);

  const [view, setView] = useState<'dashboard' | 'transactions' | 'budgets'>('dashboard');
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Form States
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  // --- Persistence ---
  useEffect(() => {
    if (user) {
      const userKey = `data_${user.identifier}`;
      localStorage.setItem(userKey, JSON.stringify({ expenses, incomes, budgets }));
    }
  }, [expenses, incomes, budgets, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // --- Handlers ---
  const handleLogin = (userData: { identifier: string }) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount: parseFloat(amount),
      category,
      date,
    };
    setExpenses([newExpense, ...expenses]);
    setDescription('');
    setAmount('');
  };

  const addIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeSource || !incomeAmount) return;
    const newIncome: Income = {
      id: crypto.randomUUID(),
      source: incomeSource,
      amount: parseFloat(incomeAmount),
      date,
    };
    setIncomes([newIncome, ...incomes]);
    setIncomeSource('');
    setIncomeAmount('');
  };

  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));
  const deleteIncome = (id: string) => setIncomes(incomes.filter(i => i.id !== id));

  const updateBudget = (category: Category, limit: number) => {
    const existing = budgets.find(b => b.category === category);
    if (existing) {
      setBudgets(budgets.map(b => b.category === category ? { ...b, limit } : b));
    } else {
      setBudgets([...budgets, { category, limit }]);
    }
  };

  // --- Computations ---
  const currentMonth = useMemo(() => ({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  }), []);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => isWithinInterval(parseISO(e.date), currentMonth));
  }, [expenses, currentMonth]);

  const currentMonthIncomes = useMemo(() => {
    return incomes.filter(i => isWithinInterval(parseISO(i.date), currentMonth));
  }, [incomes, currentMonth]);

  const totalSpent = useMemo(() => currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [currentMonthExpenses]);
  const totalIncome = useMemo(() => currentMonthIncomes.reduce((sum, i) => sum + i.amount, 0), [currentMonthIncomes]);
  const balance = totalIncome - totalSpent;

  const categorySpending = useMemo(() => {
    return CATEGORIES.map(cat => ({
      name: cat,
      spent: currentMonthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
      budget: budgets.find(b => b.category === cat)?.limit || 0,
      color: CATEGORY_COLORS[cat]
    }));
  }, [currentMonthExpenses, budgets]);

  const chartData = useMemo(() => {
    return categorySpending.filter(d => d.spent > 0).map(d => ({
      name: d.name,
      value: d.spent,
      color: d.color
    }));
  }, [categorySpending]);

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    currentMonthExpenses.forEach(e => {
      const day = format(parseISO(e.date), 'dd');
      days[day] = (days[day] || 0) + e.amount;
    });
    return Object.entries(days)
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [currentMonthExpenses]);

  // --- Notifications ---
  const budgetWarnings = useMemo(() => {
    return categorySpending.filter(c => c.budget > 0 && c.spent >= c.budget * 0.8);
  }, [categorySpending]);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <Wallet size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">SpendWise</h1>
          </div>
          
          <div className="flex bg-zinc-100 p-1 rounded-xl">
            {[
              { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
              { id: 'transactions', icon: ListIcon, label: 'Transactions' },
              { id: 'budgets', icon: Target, label: 'Budgets' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  view === item.id ? "bg-white shadow-sm text-emerald-600" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <item.icon size={16} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 ml-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-zinc-900 truncate max-w-[120px]">{user.identifier}</span>
              <button 
                onClick={handleLogout}
                className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
              >
                Log Out
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="sm:hidden p-2 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Budget Warnings */}
        <AnimatePresence>
          {budgetWarnings.length > 0 && view === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 space-y-2 overflow-hidden"
            >
              {budgetWarnings.map(warning => (
                <div 
                  key={warning.name}
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between",
                    warning.spent >= warning.budget 
                      ? "bg-red-50 border-red-100 text-red-700" 
                      : "bg-amber-50 border-amber-100 text-amber-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} />
                    <div>
                      <span className="font-bold">{warning.name}</span>
                      <span className="ml-2 text-sm">
                        {warning.spent >= warning.budget 
                          ? `Budget exceeded by ₹${(warning.spent - warning.budget).toFixed(2)}!` 
                          : `You've used ${Math.round((warning.spent / warning.budget) * 100)}% of your budget.`}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setView('budgets')} className="text-xs font-bold uppercase tracking-wider hover:underline">Adjust</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 text-sm font-medium">Monthly Income</span>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ArrowUpRight size={20} /></div>
                </div>
                <div className="text-3xl font-bold text-emerald-600">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 text-zinc-400 text-sm flex items-center gap-1"><Calendar size={14} /> {format(new Date(), 'MMMM yyyy')}</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 text-sm font-medium">Monthly Expenses</span>
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ArrowDownRight size={20} /></div>
                </div>
                <div className="text-3xl font-bold text-red-600">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                <div className="mt-2 text-zinc-400 text-sm flex items-center gap-1"><Calendar size={14} /> {format(new Date(), 'MMMM yyyy')}</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 text-sm font-medium">Net Balance</span>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><IndianRupee size={20} /></div>
                </div>
                <div className={cn("text-3xl font-bold", balance >= 0 ? "text-blue-600" : "text-red-600")}>
                  {balance < 0 && '-'}₹{Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-2 text-zinc-400 text-sm">Remaining funds</div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
                <h2 className="text-lg font-bold mb-8">Category Breakdown</h2>
                <div className="h-72">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-4">
                      <PieChartIcon size={48} strokeWidth={1} />
                      <p>No expense data for this month</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div className="text-xs font-semibold text-zinc-600">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
                <h2 className="text-lg font-bold mb-8">Daily Spending Trend</h2>
                <div className="h-72">
                  {dailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-4">
                      <TrendingUp size={48} strokeWidth={1} />
                      <p>Add transactions to see trends</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions View */}
        {view === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm sticky top-24">
                <div className="flex bg-zinc-100 p-1 rounded-xl mb-6">
                  <button onClick={() => setActiveTab('expense')} className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'expense' ? "bg-white shadow-sm text-red-600" : "text-zinc-500")}>Expense</button>
                  <button onClick={() => setActiveTab('income')} className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'income' ? "bg-white shadow-sm text-emerald-600" : "text-zinc-500")}>Income</button>
                </div>

                {activeTab === 'expense' ? (
                  <form onSubmit={addExpense} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Description</label>
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Rent" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none">
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
                      <Plus size={20} /> Add Expense
                    </button>
                  </form>
                ) : (
                  <form onSubmit={addIncome} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Source</label>
                      <input type="text" value={incomeSource} onChange={(e) => setIncomeSource(e.target.value)} placeholder="e.g. Salary" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                      <input type="number" step="0.01" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Date</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                      <Plus size={20} /> Add Income
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Transaction History</h2>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">{currentMonthExpenses.length} Exp</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">{currentMonthIncomes.length} Inc</span>
                  </div>
                </div>
                <div className="divide-y divide-zinc-100">
                  {[...currentMonthExpenses, ...currentMonthIncomes]
                    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
                    .map((item) => {
                      const isExpense = 'category' in item;
                      return (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", isExpense ? "" : "bg-emerald-500")} style={isExpense ? { backgroundColor: CATEGORY_COLORS[(item as Expense).category] } : {}}>
                              {isExpense ? (item as Expense).category[0] : <IndianRupee size={18} />}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900">{isExpense ? (item as Expense).description : (item as Income).source}</div>
                              <div className="text-xs text-zinc-400 flex items-center gap-2">
                                <span>{isExpense ? (item as Expense).category : 'Income'}</span>
                                <span>•</span>
                                <span>{format(parseISO(item.date), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={cn("font-bold", isExpense ? "text-red-600" : "text-emerald-600")}>
                              {isExpense ? '-' : '+'}₹{item.amount.toFixed(2)}
                            </div>
                            <button 
                              onClick={() => isExpense ? deleteExpense(item.id) : deleteIncome(item.id)}
                              className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {currentMonthExpenses.length === 0 && currentMonthIncomes.length === 0 && (
                    <div className="p-12 text-center text-zinc-400">No transactions recorded for this month.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budgets View */}
        {view === 'budgets' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Monthly Budgets</h2>
                  <p className="text-zinc-500">Set spending limits for each category</p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Target size={32} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {categorySpending.map((cat) => (
                  <div key={cat.name} className="space-y-4 p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: cat.color }}>{cat.name[0]}</div>
                        <div>
                          <h3 className="font-bold text-zinc-900">{cat.name}</h3>
                          <p className="text-xs text-zinc-500">Spent: ₹{cat.spent.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Monthly Limit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                          <input 
                            type="number" 
                            value={cat.budget || ''} 
                            onChange={(e) => updateBudget(cat.name, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-28 pl-6 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {cat.budget > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={cn(cat.spent >= cat.budget ? "text-red-600" : "text-zinc-500")}>
                            {Math.round((cat.spent / cat.budget) * 100)}% Used
                          </span>
                          <span className="text-zinc-400">Remaining: ₹{(cat.budget - cat.spent).toFixed(2)}</span>
                        </div>
                        <div className="h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((cat.spent / cat.budget) * 100, 100)}%` }}
                            className={cn(
                              "h-full transition-colors",
                              cat.spent >= cat.budget ? "bg-red-500" : cat.spent >= cat.budget * 0.8 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                          />
                        </div>
                        {cat.spent >= cat.budget && (
                          <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                            <AlertCircle size={10} /> Budget Exceeded
                          </p>
                        )}
                        {cat.spent >= cat.budget * 0.8 && cat.spent < cat.budget && (
                          <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                            <AlertCircle size={10} /> Near Limit
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
