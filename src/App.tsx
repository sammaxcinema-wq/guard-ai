import React, { useState, useEffect, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy,
  getDoc,
  setDoc,
  increment,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Product, Sale, Expense, SaleItem } from './types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Receipt, 
  LogOut, 
  Plus, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  Wallet,
  Smartphone,
  Share2,
  Menu,
  X,
  ChevronRight,
  Search
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfDay, endOfDay, isToday, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'; 
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-900',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
    outline: 'border border-zinc-200 hover:bg-zinc-50 text-zinc-700'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, title, key }: { children: React.ReactNode; className?: string; title?: string; key?: string | number }) => (
  <div key={key} className={cn('bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden', className)}>
    {title && (
      <div className="px-6 py-4 border-bottom border-zinc-100">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  className,
  required,
  min
}: { 
  label?: string; 
  type?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: number;
}) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      min={min}
      className="px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-zinc-50/50"
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-bottom border-zinc-100">
            <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'products' | 'expenses'>('dashboard');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', stock: 0, buying: 0, selling: 0, threshold: 5 });
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0 });
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [searchQuery, setSearchQuery] = useState('');

  const [profileForm, setProfileForm] = useState({ businessName: '', phone: '' });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        } else {
          setIsProfileModalOpen(true);
        }
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!currentUser) return;

    const qProducts = query(collection(db, 'products'), where('userId', '==', currentUser.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    const qSales = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
    });

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubExpenses();
    };
  }, [currentUser]);

  // Calculations
  const todaySales = useMemo(() => {
    const today = startOfDay(new Date());
    return sales.filter(s => s.date?.toDate() >= today);
  }, [sales]);

  const todayExpenses = useMemo(() => {
    const today = startOfDay(new Date());
    return expenses.filter(e => e.date?.toDate() >= today);
  }, [expenses]);

  const stats = useMemo(() => {
    const totalSales = todaySales.reduce((acc, s) => acc + s.amount, 0);
    const cashSales = todaySales.filter(s => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.amount, 0);
    const mpesaSales = todaySales.filter(s => s.paymentMethod === 'mpesa').reduce((acc, s) => acc + s.amount, 0);
    const totalExp = todayExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    // Profit calculation (selling - buying)
    let profit = 0;
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          profit += (item.price - product.buyingPrice) * item.quantity;
        }
      });
    });
    profit -= totalExp;

    return { totalSales, cashSales, mpesaSales, totalExp, profit };
  }, [todaySales, todayExpenses, products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stockQuantity <= (p.lowStockThreshold || 5));
  }, [products]);

  // Actions
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const data = {
      uid: currentUser.uid,
      name: currentUser.displayName || 'User',
      businessName: profileForm.businessName,
      phone: profileForm.phone,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', currentUser.uid), data);
    setUserData(data as any);
    setIsProfileModalOpen(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await addDoc(collection(db, 'products'), {
      userId: currentUser.uid,
      name: newProduct.name,
      stockQuantity: Number(newProduct.stock),
      buyingPrice: Number(newProduct.buying),
      sellingPrice: Number(newProduct.selling),
      lowStockThreshold: Number(newProduct.threshold)
    });
    setNewProduct({ name: '', stock: 0, buying: 0, selling: 0, threshold: 5 });
    setIsProductModalOpen(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await addDoc(collection(db, 'expenses'), {
      userId: currentUser.uid,
      title: newExpense.title,
      amount: Number(newExpense.amount),
      date: serverTimestamp()
    });
    setNewExpense({ title: '', amount: 0 });
    setIsExpenseModalOpen(false);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) return;
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      if (product.stockQuantity <= 0) return;
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.sellingPrice 
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleCompleteSale = async () => {
    if (!currentUser || cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // 1. Record Sale
    await addDoc(collection(db, 'sales'), {
      userId: currentUser.uid,
      amount: total,
      paymentMethod,
      items: cart,
      date: serverTimestamp()
    });

    // 2. Update Stock
    for (const item of cart) {
      await updateDoc(doc(db, 'products', item.productId), {
        stockQuantity: increment(-item.quantity)
      });
    }

    setCart([]);
    setIsSaleModalOpen(false);
  };

  const shareReport = () => {
    const text = `*Daily Report: ${userData?.businessName}*\n` +
      `Date: ${format(new Date(), 'dd MMM yyyy')}\n\n` +
      `💰 Total Sales: KES ${stats.totalSales.toLocaleString()}\n` +
      `💵 Cash: KES ${stats.cashSales.toLocaleString()}\n` +
      `📱 M-Pesa: KES ${stats.mpesaSales.toLocaleString()}\n` +
      `📉 Expenses: KES ${stats.totalExp.toLocaleString()}\n` +
      `✨ Net Profit: KES ${stats.profit.toLocaleString()}\n\n` +
      `${lowStockProducts.length > 0 ? `⚠️ Low Stock: ${lowStockProducts.map(p => p.name).join(', ')}` : '✅ Stock levels healthy'}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!isAuthReady) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-orange-200 rounded-full" />
        <div className="h-4 w-32 bg-zinc-200 rounded" />
      </div>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center p-12">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <TrendingUp className="w-10 h-10 text-orange-600" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">Biashara POS</h1>
        <p className="text-zinc-500 mb-10 leading-relaxed">
          The simplest way to manage your kiosk, boutique, or mini-supermarket in Nairobi.
        </p>
        <Button onClick={handleLogin} className="w-full py-4 text-lg rounded-2xl">
          Sign in with Google
        </Button>
        <p className="mt-8 text-xs text-zinc-400 uppercase tracking-widest font-bold">
          Built for small businesses
        </p>
      </Card>
    </div>
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-orange-100">
      {/* Sidebar / Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-4 flex justify-around items-center z-40 md:top-0 md:bottom-auto md:flex-col md:w-24 md:h-screen md:border-r md:border-t-0 md:py-8">
        <div className="hidden md:flex flex-col items-center mb-12">
          <TrendingUp className="w-8 h-8 text-orange-600" />
        </div>
        
        <div className="flex md:flex-col gap-8 md:gap-10">
          <button onClick={() => setActiveTab('dashboard')} className={cn('p-2 transition-all', activeTab === 'dashboard' ? 'text-orange-600 scale-110' : 'text-zinc-400 hover:text-zinc-600')}>
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('sales')} className={cn('p-2 transition-all', activeTab === 'sales' ? 'text-orange-600 scale-110' : 'text-zinc-400 hover:text-zinc-600')}>
            <ShoppingCart className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('products')} className={cn('p-2 transition-all', activeTab === 'products' ? 'text-orange-600 scale-110' : 'text-zinc-400 hover:text-zinc-600')}>
            <Package className="w-6 h-6" />
          </button>
          <button onClick={() => setActiveTab('expenses')} className={cn('p-2 transition-all', activeTab === 'expenses' ? 'text-orange-600 scale-110' : 'text-zinc-400 hover:text-zinc-600')}>
            <Receipt className="w-6 h-6" />
          </button>
        </div>

        <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-600 transition-all md:mt-auto">
          <LogOut className="w-6 h-6" />
        </button>
      </nav>

      {/* Main Content */}
      <main className="pb-24 pt-8 px-6 md:pl-32 md:pt-12 md:pr-12 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-zinc-900 mb-1">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-zinc-500 font-medium">
              {userData?.businessName || 'Your Business'} • {format(new Date(), 'EEEE, dd MMMM')}
            </p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'sales' && (
              <Button onClick={() => setIsSaleModalOpen(true)} className="rounded-2xl px-6 h-12">
                <Plus className="w-5 h-5" /> New Sale
              </Button>
            )}
            {activeTab === 'products' && (
              <Button onClick={() => setIsProductModalOpen(true)} className="rounded-2xl px-6 h-12">
                <Plus className="w-5 h-5" /> Add Product
              </Button>
            )}
            {activeTab === 'expenses' && (
              <Button onClick={() => setIsExpenseModalOpen(true)} className="rounded-2xl px-6 h-12">
                <Plus className="w-5 h-5" /> Record Expense
              </Button>
            )}
            <Button onClick={shareReport} variant="secondary" className="rounded-2xl px-6 h-12">
              <Share2 className="w-5 h-5" /> Share Report
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Stats Grid */}
              <Card className="md:col-span-2 bg-orange-600 text-white border-none relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-orange-100 font-bold uppercase tracking-widest text-xs mb-2">Today's Total Sales</p>
                  <h3 className="text-6xl font-black mb-8">KES {stats.totalSales.toLocaleString()}</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Profit</p>
                      <p className="text-2xl font-bold">KES {stats.profit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Expenses</p>
                      <p className="text-2xl font-bold">KES {stats.totalExp.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              </Card>

              <Card title="Payment Split">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cash', value: stats.cashSales },
                          { name: 'M-Pesa', value: stats.mpesaSales }
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#ea580c" />
                        <Cell fill="#18181b" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-600" />
                    <span className="text-sm font-medium text-zinc-600">Cash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-900" />
                    <span className="text-sm font-medium text-zinc-600">M-Pesa</span>
                  </div>
                </div>
              </Card>

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <Card className="md:col-span-3 border-red-100 bg-red-50/30">
                  <div className="flex items-center gap-3 mb-4 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Low Stock Alerts</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-xl border border-red-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-zinc-900">{p.name}</p>
                          <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{p.stockQuantity} left</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Sales */}
              <Card title="Recent Sales" className="md:col-span-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                        <th className="pb-4">Time</th>
                        <th className="pb-4">Items</th>
                        <th className="pb-4">Method</th>
                        <th className="pb-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {sales.slice(0, 5).map(sale => (
                        <tr key={sale.id} className="group hover:bg-zinc-50 transition-colors">
                          <td className="py-4 text-sm text-zinc-500">{format(sale.date?.toDate() || new Date(), 'HH:mm')}</td>
                          <td className="py-4">
                            <p className="font-bold text-zinc-900 truncate max-w-[200px]">
                              {sale.items.map(i => i.name).join(', ')}
                            </p>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              'px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider',
                              sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            )}>
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="py-4 text-right font-black text-zinc-900">KES {sale.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <Card className="flex-1" title="All Sales History">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                          <th className="pb-4">Date</th>
                          <th className="pb-4">Items</th>
                          <th className="pb-4">Method</th>
                          <th className="pb-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {sales.map(sale => (
                          <tr key={sale.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-4 text-sm text-zinc-500">{format(sale.date?.toDate() || new Date(), 'dd MMM, HH:mm')}</td>
                            <td className="py-4 font-bold text-zinc-900">{sale.items.map(i => i.name).join(', ')}</td>
                            <td className="py-4">
                              <span className={cn(
                                'px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider',
                                sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              )}>
                                {sale.paymentMethod}
                              </span>
                            </td>
                            <td className="py-4 text-right font-black text-zinc-900">KES {sale.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-zinc-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                  <Card key={p.id} className="group hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-1">{p.name}</h3>
                        <p className="text-sm font-bold text-orange-600">KES {p.sellingPrice.toLocaleString()}</p>
                      </div>
                      <div className={cn(
                        'px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest',
                        p.stockQuantity <= (p.lowStockThreshold || 5) ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-600'
                      )}>
                        {p.stockQuantity} in stock
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Buying Price</p>
                        <p className="font-bold text-zinc-600">KES {p.buyingPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Profit/Unit</p>
                        <p className="font-bold text-green-600">KES {(p.sellingPrice - p.buyingPrice).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <Card title="Expense History">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Description</th>
                        <th className="pb-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-4 text-sm text-zinc-500">{format(exp.date?.toDate() || new Date(), 'dd MMM, HH:mm')}</td>
                          <td className="py-4 font-bold text-zinc-900">{exp.title}</td>
                          <td className="py-4 text-right font-black text-red-600">KES {exp.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add New Product">
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input label="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required placeholder="e.g. Sugar 1kg" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock Quantity" type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} required min={0} />
            <Input label="Low Stock Alert" type="number" value={newProduct.threshold} onChange={e => setNewProduct({...newProduct, threshold: Number(e.target.value)})} required min={0} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Buying Price (KES)" type="number" value={newProduct.buying} onChange={e => setNewProduct({...newProduct, buying: Number(e.target.value)})} required min={0} />
            <Input label="Selling Price (KES)" type="number" value={newProduct.selling} onChange={e => setNewProduct({...newProduct, selling: Number(e.target.value)})} required min={0} />
          </div>
          <Button type="submit" className="w-full py-4 mt-4 rounded-2xl">Save Product</Button>
        </form>
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Record Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Input label="Expense Description" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} required placeholder="e.g. Rent, Transport" />
          <Input label="Amount (KES)" type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} required min={0} />
          <Button type="submit" className="w-full py-4 mt-4 rounded-2xl">Record Expense</Button>
        </form>
      </Modal>

      <Modal isOpen={isProfileModalOpen} onClose={() => {}} title="Complete Your Profile">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <p className="text-sm text-zinc-500 mb-4">Welcome! Please tell us about your business to get started.</p>
          <Input label="Business Name" value={profileForm.businessName} onChange={e => setProfileForm({...profileForm, businessName: e.target.value})} required placeholder="e.g. Mama Njuguna Kiosk" />
          <Input label="Phone Number" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="e.g. 0712 345 678" />
          <Button type="submit" className="w-full py-4 mt-4 rounded-2xl">Start Using Biashara POS</Button>
        </form>
      </Modal>

      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="New Sale">
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-100 bg-zinc-50 focus:outline-none"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all"
              >
                <div className="text-left">
                  <p className="font-bold text-zinc-900">{p.name}</p>
                  <p className="text-xs text-zinc-500">KES {p.sellingPrice.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">{p.stockQuantity} left</span>
                  <Plus className="w-4 h-4 text-orange-600" />
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-zinc-100 pt-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400 mb-4">Current Cart</h4>
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-zinc-900">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.quantity} x KES {item.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="p-2 text-zinc-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center py-4 text-zinc-400 italic">Cart is empty</p>}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all',
                    paymentMethod === 'cash' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-zinc-100 text-zinc-400'
                  )}
                >
                  <Wallet className="w-4 h-4" /> Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('mpesa')}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all',
                    paymentMethod === 'mpesa' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-zinc-100 text-zinc-400'
                  )}
                >
                  <Smartphone className="w-4 h-4" /> M-Pesa
                </button>
              </div>

              <div className="flex justify-between items-center py-4 border-t border-zinc-100">
                <span className="text-lg font-bold text-zinc-900">Total</span>
                <span className="text-2xl font-black text-orange-600">
                  KES {cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
                </span>
              </div>

              <Button 
                onClick={handleCompleteSale} 
                className="w-full py-4 rounded-2xl text-lg"
                disabled={cart.length === 0}
              >
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
