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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  // Don't throw if it's just an offline message, as Firestore handles this gracefully
  if (errMessage.includes('the client is offline')) {
    console.warn(`Firestore Offline (${operationType} at ${path}): Operation will sync when online.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { auth, db } from './firebase';
import { User, Product, Sale, Expense, SaleItem, Customer } from './types';
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
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  MoreVertical,
  Download,
  CheckCircle2,
  Clock,
  Store,
  Users,
  UserPlus,
  History
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
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { format, startOfDay, endOfDay, isToday, subDays, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Pro UI Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  type = 'button',
  icon: Icon
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'brand'; 
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: any;
}) => {
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
    brand: 'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_8px_24px_rgba(242,125,38,0.25)]',
    secondary: 'bg-white text-zinc-900 border border-zinc-100 hover:bg-zinc-50 shadow-sm',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
    outline: 'border border-zinc-100 hover:bg-zinc-50 text-zinc-700'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 text-sm tracking-tight',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Card = ({ children, className, title, subtitle, icon: Icon, action, onClick }: { 
  children: React.ReactNode; 
  className?: string; 
  title?: string; 
  subtitle?: string;
  icon?: any;
  action?: React.ReactNode;
  key?: React.Key;
  onClick?: () => void;
}) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white rounded-[32px] border border-zinc-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col',
      onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
      className
    )}
  >
    {(title || Icon) && (
      <div className="px-6 py-6 md:px-10 md:py-8 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-5">
          {Icon && (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          )}
          <div>
            {title && <h3 className="text-base md:text-lg font-black text-zinc-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[10px] md:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="px-6 pb-6 md:px-10 md:pb-10 flex-1">{children}</div>
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
  min,
  icon: Icon
}: { 
  label?: string; 
  type?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  className?: string;
  required?: boolean;
  min?: number;
  icon?: any;
}) => (
  <div className={cn('flex flex-col gap-2.5', className)}>
    {label && <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className={cn(
          "w-full px-5 py-4 rounded-2xl border border-zinc-100 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all bg-zinc-50/50 text-base md:text-sm font-bold placeholder:text-zinc-300",
          Icon && "pl-12"
        )}
      />
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, description }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; description?: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-zinc-100"
        >
          <div className="md:hidden w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
          
          <div className="px-8 py-8 md:px-12 md:py-12 border-b border-zinc-50 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tighter">{title}</h3>
              <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>
            {description && <p className="text-sm font-bold text-zinc-400 tracking-tight">{description}</p>}
          </div>
          <div className="p-8 md:p-12 overflow-y-auto pb-24 md:pb-12">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand' }) => {
  const variants = {
    neutral: 'bg-zinc-100 text-zinc-500',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    brand: 'bg-brand-50 text-brand-500'
  };
  return (
    <span className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest', variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncingStatus, setSyncingStatus] = useState({ products: false, sales: false, expenses: false, customers: false });
  const isSyncing = useMemo(() => Object.values(syncingStatus).some(v => v), [syncingStatus]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'products' | 'expenses' | 'reports' | 'customers'>('dashboard');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Date range for reports
  const [reportRange, setReportRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', stock: 0, buying: 0, selling: 0, threshold: 5 });
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0 });
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [saleCustomerId, setSaleCustomerId] = useState<string>('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa'>('cash');
  const [searchQuery, setSearchQuery] = useState('');

  const [profileForm, setProfileForm] = useState({ businessName: '', phone: '' });

  // Auth & Connectivity Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsOffline(false);
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          setIsOffline(true);
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as User);
          } else {
            setIsProfileModalOpen(true);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      }
      setIsAuthReady(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!currentUser) return;

    const qProducts = query(collection(db, 'products'), where('userId', '==', currentUser.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setSyncingStatus(prev => ({ ...prev, products: snapshot.metadata.hasPendingWrites }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const qSales = query(collection(db, 'sales'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      setSyncingStatus(prev => ({ ...prev, sales: snapshot.metadata.hasPendingWrites }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', currentUser.uid), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
      setSyncingStatus(prev => ({ ...prev, expenses: snapshot.metadata.hasPendingWrites }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    const qCustomers = query(collection(db, 'customers'), where('userId', '==', currentUser.uid), orderBy('name', 'asc'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      setCustomers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      setSyncingStatus(prev => ({ ...prev, customers: snapshot.metadata.hasPendingWrites }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubExpenses();
      unsubCustomers();
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

  const reportData = useMemo(() => {
    const start = startOfDay(parseISO(reportRange.start));
    const end = endOfDay(parseISO(reportRange.end));
    
    const filteredSales = sales.filter(s => {
      const d = s.date?.toDate();
      return d && isWithinInterval(d, { start, end });
    });

    const filteredExpenses = expenses.filter(e => {
      const d = e.date?.toDate();
      return d && isWithinInterval(d, { start, end });
    });

    const days = eachDayOfInterval({ start, end });
    const dailyTrends = days.map(day => {
      const daySales = filteredSales.filter(s => format(s.date?.toDate(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
      const total = daySales.reduce((acc, s) => acc + s.amount, 0);
      return {
        date: format(day, 'dd MMM'),
        sales: total
      };
    });

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.amount, 0);
    const totalExp = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    let totalCOGS = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) totalCOGS += product.buyingPrice * item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExp;

    const productStats: Record<string, { name: string, quantity: number, revenue: number, profit: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.name, quantity: 0, revenue: 0, profit: 0 };
        }
        const stats = productStats[item.productId];
        stats.quantity += item.quantity;
        stats.revenue += item.price * item.quantity;
        const product = products.find(p => p.id === item.productId);
        if (product) stats.profit += (item.price - product.buyingPrice) * item.quantity;
      });
    });

    const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    return { dailyTrends, totalRevenue, totalCOGS, grossProfit, totalExp, netProfit, topProducts };
  }, [sales, expenses, products, reportRange]);

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
    try {
      await setDoc(doc(db, 'users', currentUser.uid), data);
      setUserData(data as any);
      setIsProfileModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        userId: currentUser.uid,
        title: newExpense.title,
        amount: Number(newExpense.amount),
        date: serverTimestamp()
      });
      setNewExpense({ title: '', amount: 0 });
      setIsExpenseModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'customers'), {
        userId: currentUser.uid,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        createdAt: serverTimestamp()
      });
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setIsCustomerModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Stock,Buying Price,Selling Price,Low Stock Threshold\nSugar 1kg,50,120,150,10\nMilk 500ml,100,50,65,20";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        const productsToImport = lines.slice(1).filter(line => line.trim() !== '');
        
        let successCount = 0;
        let failCount = 0;

        for (const line of productsToImport) {
          // Simple CSV split that handles quotes
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (!values || values.length < 4) {
            failCount++;
            continue;
          }

          const [name, stock, buying, selling, threshold] = values.map(v => v.replace(/^"|"$/g, '').trim());
          
          if (!name) {
            failCount++;
            continue;
          }

          await addDoc(collection(db, 'products'), {
            userId: currentUser.uid,
            name,
            stockQuantity: Number(stock) || 0,
            buyingPrice: Number(buying) || 0,
            sellingPrice: Number(selling) || 0,
            lowStockThreshold: Number(threshold) || 5
          });
          successCount++;
        }

        alert(`Import complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
        setIsImportModalOpen(false);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to parse CSV file. Please ensure it follows the template.');
      }
    };
    reader.readAsText(file);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) return;
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stockQuantity <= 0) return;
      setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellingPrice }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleCompleteSale = async () => {
    if (!currentUser || cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    try {
      await addDoc(collection(db, 'sales'), {
        userId: currentUser.uid,
        customerId: saleCustomerId || null,
        amount: total,
        paymentMethod,
        items: cart,
        date: serverTimestamp()
      });
      for (const item of cart) {
        await updateDoc(doc(db, 'products', item.productId), { stockQuantity: increment(-item.quantity) });
      }
      setCart([]);
      setSaleCustomerId('');
      setIsSaleModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    }
  };

  const shareReport = () => {
    if (isOffline) {
      // In a real app we'd use a toast, but for now we'll just log or show a subtle UI hint
      console.warn("Cannot share report while offline.");
      return;
    }
    const text = `*Daily Report: ${userData?.businessName}*\n` +
      `Date: ${format(new Date(), 'dd MMM yyyy')}\n\n` +
      `💰 Total Sales: KES ${stats.totalSales.toLocaleString()}\n` +
      `✨ Net Profit: KES ${stats.profit.toLocaleString()}\n\n` +
      `${lowStockProducts.length > 0 ? `⚠️ Low Stock: ${lowStockProducts.map(p => p.name).join(', ')}` : '✅ Stock levels healthy'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSeedData = async () => {
    if (!currentUser || isSeeding) return;
    setIsSeeding(true);
    try {
      const sampleProducts = [
        { name: 'Sugar 1kg', stockQuantity: 25, buyingPrice: 120, sellingPrice: 155, lowStockThreshold: 5 },
        { name: 'Milk 500ml', stockQuantity: 40, buyingPrice: 50, sellingPrice: 65, lowStockThreshold: 10 },
        { name: 'Bread 400g', stockQuantity: 15, buyingPrice: 55, sellingPrice: 65, lowStockThreshold: 5 },
        { name: 'Cooking Oil 1L', stockQuantity: 12, buyingPrice: 280, sellingPrice: 330, lowStockThreshold: 3 },
        { name: 'Maize Flour 2kg', stockQuantity: 30, buyingPrice: 185, sellingPrice: 215, lowStockThreshold: 8 }
      ];
      const productRefs: string[] = [];
      for (const p of sampleProducts) {
        const docRef = await addDoc(collection(db, 'products'), { ...p, userId: currentUser.uid });
        productRefs.push(docRef.id);
      }
      for (let i = 0; i < 14; i++) {
        const date = subDays(new Date(), i);
        const numSales = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < numSales; j++) {
          const pIndex = Math.floor(Math.random() * sampleProducts.length);
          const qty = Math.floor(Math.random() * 2) + 1;
          await addDoc(collection(db, 'sales'), {
            userId: currentUser.uid,
            amount: sampleProducts[pIndex].sellingPrice * qty,
            paymentMethod: Math.random() > 0.5 ? 'mpesa' : 'cash',
            items: [{ productId: productRefs[pIndex], name: sampleProducts[pIndex].name, quantity: qty, price: sampleProducts[pIndex].sellingPrice }],
            date: date
          });
        }
      }
      alert('Demo data seeded successfully!');
    } catch (error) { console.error(error); } finally { setIsSeeding(false); }
  };

  if (!isAuthReady) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-12 bg-brand-500 rounded-2xl shadow-xl shadow-brand-500/20" 
      />
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center p-12 border-none shadow-2xl shadow-zinc-200/50">
        <div className="w-24 h-24 bg-brand-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 rotate-3">
          <Store className="w-12 h-12 text-brand-600" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tighter">Biashara POS</h1>
        <p className="text-zinc-500 mb-12 font-medium leading-relaxed">
          The professional toolkit for Nairobi's growing businesses. Manage stock, track sales, and grow faster.
        </p>
        <Button onClick={handleLogin} variant="brand" className="w-full py-4 text-lg rounded-2xl">
          Get Started with Google
        </Button>
        <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale">
          <Smartphone className="w-5 h-5" />
          <TrendingUp className="w-5 h-5" />
          <Package className="w-5 h-5" />
        </div>
      </Card>
    </div>
  );

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-zinc-100 h-screen sticky top-0 px-8 py-12">
        <div className="flex items-center gap-4 px-2 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-zinc-900">Biashara</h1>
        </div>

        <nav className="space-y-3 flex-1">
          {[
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'sales', label: 'Sales', icon: ShoppingCart },
            { id: 'products', label: 'Inventory', icon: Package },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'expenses', label: 'Expenses', icon: Receipt },
            { id: 'reports', label: 'Analytics', icon: TrendingUp },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                'w-full flex items-center justify-between px-5 py-4 rounded-[24px] font-bold text-sm transition-all group',
                activeTab === item.id 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/10' 
                  : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className={cn('w-5 h-5', activeTab === item.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600')} />
                {item.label}
              </div>
              <ChevronRight className={cn('w-4 h-4 opacity-50', activeTab === item.id ? 'text-white' : 'text-zinc-300')} />
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-zinc-50">
          <div className="flex items-center gap-4 px-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden shadow-sm">
              <img src={currentUser.photoURL || ''} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-zinc-900 truncate tracking-tight">{userData?.businessName || 'Business'}</p>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Pro Account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-[24px] font-bold text-sm text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 z-50 border border-zinc-50">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'sales', icon: ShoppingCart, label: 'Sales' },
          { id: 'products', icon: Package, label: 'Stock' },
          { id: 'customers', icon: Users, label: 'People' },
          { id: 'reports', icon: TrendingUp, label: 'Data' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all',
              activeTab === item.id ? 'text-brand-500' : 'text-zinc-300'
            )}
          >
            <item.icon className={cn('w-5 h-5', activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[2px]')} />
            <span className={cn('text-[10px] font-black uppercase tracking-widest', activeTab === item.id ? 'opacity-100' : 'opacity-0')}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Mobile FAB */}
      <AnimatePresence>
        {['dashboard', 'sales'].includes(activeTab) && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            onClick={() => setIsSaleModalOpen(true)}
            className="md:hidden fixed bottom-28 right-6 w-16 h-16 bg-brand-500 text-white rounded-full shadow-2xl shadow-brand-500/40 flex items-center justify-center z-40 active:scale-90 transition-transform"
          >
            <Plus className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 px-5 py-8 md:px-12 md:py-16 max-w-6xl mx-auto w-full pb-36 md:pb-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="brand">Live</Badge>
              {isOffline && <Badge variant="danger">Offline</Badge>}
              {isSyncing && <Badge variant="warning">Syncing...</Badge>}
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{format(new Date(), 'EEEE, dd MMMM')}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-zinc-900">
              {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeTab === 'sales' && <Button onClick={() => setIsSaleModalOpen(true)} variant="brand" icon={Plus} className="flex-1 md:flex-none">New Sale</Button>}
            {activeTab === 'products' && <Button onClick={() => setIsProductModalOpen(true)} variant="brand" icon={Plus} className="flex-1 md:flex-none">Add Product</Button>}
            {activeTab === 'expenses' && <Button onClick={() => setIsExpenseModalOpen(true)} variant="brand" icon={Plus} className="flex-1 md:flex-none">Record Expense</Button>}
            {activeTab === 'customers' && <Button onClick={() => setIsCustomerModalOpen(true)} variant="brand" icon={UserPlus} className="flex-1 md:flex-none">Add Customer</Button>}
            <Button onClick={shareReport} variant="secondary" icon={Share2} className="flex-1 md:flex-none">Report</Button>
            {sales.length === 0 && <Button onClick={handleSeedData} variant="outline" disabled={isSeeding} className="flex-1 md:flex-none">{isSeeding ? 'Seeding...' : 'Seed Data'}</Button>}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 bg-brand-500 text-white border-none relative overflow-hidden p-0">
                  <div className="p-8 md:p-12 relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-100 mb-2">Today's Revenue</p>
                      <h3 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">KES {stats.totalSales.toLocaleString()}</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>+12.5% from yesterday</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-12 md:mt-16">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-100 mb-1">Gross Profit</p>
                        <p className="text-2xl md:text-3xl font-black tracking-tight">KES {stats.profit.toLocaleString()}</p>
                      </div>
                      <div className="flex md:block items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-100 mb-1">Expenses</p>
                          <p className="text-2xl md:text-3xl font-black tracking-tight text-white/60">KES {stats.totalExp.toLocaleString()}</p>
                        </div>
                        <div className="md:hidden">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-100 mb-1">Customers</p>
                          <p className="text-2xl font-black tracking-tight text-white/80">{customers.length}</p>
                        </div>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-100 mb-1">Customers</p>
                        <p className="text-3xl font-black tracking-tight text-white/80">{customers.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-[80px] md:blur-[100px] -mr-24 -mt-24 md:-mr-32 md:-mt-32" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-black/10 rounded-full blur-[60px] md:blur-[80px] -ml-24 -mb-24 md:-ml-32 md:-mb-32" />
                </Card>

                <Card title="Payment Split" subtitle="Cash vs M-Pesa">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ name: 'Cash', value: stats.cashSales }, { name: 'M-Pesa', value: stats.mpesaSales }]}
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#ea580c" />
                          <Cell fill="#f4f4f5" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3 mt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                        <span className="text-sm font-bold text-zinc-600">Cash</span>
                      </div>
                      <span className="text-sm font-black">KES {stats.cashSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-100" />
                        <span className="text-sm font-bold text-zinc-600">M-Pesa</span>
                      </div>
                      <span className="text-sm font-black">KES {stats.mpesaSales.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {lowStockProducts.length > 0 && (
                <Card className="bg-red-50/50 border-red-100" title="Inventory Alerts" icon={AlertCircle}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-2xl border border-red-100 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-bold text-zinc-900">{p.name}</p>
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">{p.stockQuantity} left</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card title="Recent Activity" subtitle="Last 5 transactions" icon={Clock}>
                <div className="space-y-4 mt-6">
                  {sales.slice(0, 5).map(sale => {
                    const customer = customers.find(c => c.id === sale.customerId);
                    return (
                      <div key={sale.id} className="flex items-center gap-5 p-4 rounded-[24px] bg-zinc-50/50 border border-zinc-50 hover:bg-brand-50/50 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-brand-500 shadow-sm group-hover:scale-110 transition-transform">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-zinc-900 truncate tracking-tight">{sale.items.map(i => i.name).join(', ')}</p>
                            <p className="font-black text-brand-500 ml-4">KES {sale.amount.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{format(sale.date?.toDate() || new Date(), 'HH:mm')}</span>
                            <div className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{customer?.name || 'Walk-in'}</span>
                            <div className="w-1 h-1 rounded-full bg-zinc-200" />
                            <Badge variant={sale.paymentMethod === 'cash' ? 'brand' : 'neutral'}>{sale.paymentMethod}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div key="sales" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card title="Transaction Ledger" icon={Receipt}>
                <div className="space-y-4 mt-6">
                  {sales.map(sale => {
                    const customer = customers.find(c => c.id === sale.customerId);
                    return (
                      <div key={sale.id} className="flex items-center gap-5 p-5 rounded-[32px] bg-zinc-50/50 border border-zinc-50 hover:bg-brand-50/50 transition-all group">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-brand-500 shadow-sm group-hover:scale-110 transition-transform">
                          <Receipt className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-zinc-900 truncate tracking-tight text-lg">{sale.items.map(i => i.name).join(', ')}</p>
                            <p className="font-black text-brand-500 text-lg">KES {sale.amount.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{format(sale.date?.toDate() || new Date(), 'dd MMM, HH:mm')}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{customer?.name || 'Walk-in'}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                            <Badge variant={sale.paymentMethod === 'cash' ? 'brand' : 'neutral'}>{sale.paymentMethod}</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {sales.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Receipt className="w-10 h-10 text-zinc-200" />
                      </div>
                      <p className="text-zinc-400 font-bold">No transactions yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <Input icon={Search} placeholder="Search inventory..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-md w-full" />
                <div className="flex items-center gap-4">
                  <Button variant="outline" icon={Download} onClick={() => setIsImportModalOpen(true)}>Import</Button>
                  <Button variant="brand" icon={Plus} onClick={() => setIsProductModalOpen(true)}>Add Product</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(p => (
                  <Card key={p.id} className="hover:border-brand-100 transition-all group cursor-pointer">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 rounded-[24px] bg-brand-50 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                        <Package className="w-8 h-8" />
                      </div>
                      <Badge variant={p.stockQuantity <= (p.lowStockThreshold || 5) ? 'danger' : 'success'}>
                        {p.stockQuantity} Units
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tighter mb-1">{p.name}</h3>
                    <p className="text-xl font-black text-brand-500 mb-8">KES {p.sellingPrice.toLocaleString()}</p>
                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zinc-50">
                      <div>
                        <p className="stat-label">Buying Price</p>
                        <p className="font-bold text-zinc-400 text-sm">KES {p.buyingPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="stat-label">Unit Profit</p>
                        <p className="font-bold text-emerald-500 text-sm">KES {(p.sellingPrice - p.buyingPrice).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div key="expenses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card title="Expense Ledger" icon={Download}>
                <div className="space-y-1">
                  {expenses.map(exp => (
                    <div key={exp.id} className="data-grid-row grid grid-cols-2 md:grid-cols-[120px_1fr_120px] gap-y-2 md:gap-y-0 border-none rounded-2xl px-4 py-4 md:px-6">
                      <span className="text-xs font-bold text-zinc-400">{format(exp.date?.toDate() || new Date(), 'dd MMM, HH:mm')}</span>
                      <span className="md:hidden text-right font-black text-red-500">KES {exp.amount.toLocaleString()}</span>
                      <span className="font-bold text-zinc-900 col-span-2 md:col-span-1">{exp.title}</span>
                      <span className="hidden md:block text-right font-black text-red-500">KES {exp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'customers' && (
            <motion.div key="customers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <Input icon={Search} placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-md w-full" />
                <Button variant="brand" icon={UserPlus} onClick={() => setIsCustomerModalOpen(true)}>Add Customer</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery)).map(c => {
                  const customerSales = sales.filter(s => s.customerId === c.id);
                  const totalSpent = customerSales.reduce((acc, s) => acc + s.amount, 0);
                  return (
                    <Card key={c.id} className="hover:border-brand-100 transition-all group cursor-pointer" onClick={() => { setSelectedCustomerId(c.id); setIsCustomerDetailModalOpen(true); }}>
                      <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 rounded-[24px] bg-brand-50 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                          <Users className="w-8 h-8" />
                        </div>
                        <Badge variant="neutral">{customerSales.length} Orders</Badge>
                      </div>
                      <h3 className="text-2xl font-black text-zinc-900 tracking-tighter mb-1">{c.name}</h3>
                      <p className="text-sm font-bold text-zinc-400 mb-8">{c.phone || 'No phone provided'}</p>
                      <div className="pt-8 border-t border-zinc-50">
                        <p className="stat-label">Total Lifetime Spend</p>
                        <p className="text-xl font-black text-brand-500">KES {totalSpent.toLocaleString()}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <Card className="flex flex-col md:flex-row items-center gap-8" icon={Calendar}>
                <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                  <Input label="Start Date" type="date" value={reportRange.start} onChange={e => setReportRange({ ...reportRange, start: e.target.value })} className="w-full md:w-56" />
                  <Input label="End Date" type="date" value={reportRange.end} onChange={e => setReportRange({ ...reportRange, end: e.target.value })} className="w-full md:w-56" />
                </div>
                <div className="flex-1" />
                <Badge variant="brand">Period: {format(parseISO(reportRange.start), 'dd MMM')} - {format(parseISO(reportRange.end), 'dd MMM yyyy')}</Badge>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Revenue', value: reportData.totalRevenue, color: 'text-zinc-900', icon: TrendingUp },
                  { label: 'COGS', value: reportData.totalCOGS, color: 'text-zinc-400', icon: Package },
                  { label: 'Expenses', value: reportData.totalExp, color: 'text-red-500', icon: Receipt },
                  { label: 'Net Profit', value: reportData.netProfit, color: 'text-brand-500', highlight: true, icon: CheckCircle2 },
                ].map((stat, i) => (
                  <Card key={i} className={cn(stat.highlight && 'bg-brand-500 text-white border-none')}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.highlight ? 'bg-white/20 text-white' : 'bg-zinc-50 text-zinc-400')}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <p className={cn('stat-label mb-0', stat.highlight ? 'text-brand-100' : 'text-zinc-400')}>{stat.label}</p>
                    </div>
                    <p className={cn('text-3xl font-black tracking-tighter', stat.color)}>KES {stat.value.toLocaleString()}</p>
                  </Card>
                ))}
              </div>

              <Card title="Sales Performance" subtitle="Daily revenue trend" icon={TrendingUp}>
                <div className="h-96 w-full mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.dailyTrends}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#a1a1aa' }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#a1a1aa' }} tickFormatter={(v) => `KSh ${v}`} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Top Products" subtitle="By total revenue" icon={ArrowUpRight}>
                  <div className="space-y-1 mt-6">
                    {reportData.topProducts.map((p, i) => (
                      <div key={i} className="data-grid-row grid-cols-[1fr_60px_120px] border-none rounded-2xl">
                        <span className="font-bold text-zinc-900">{p.name}</span>
                        <span className="text-center text-zinc-400 font-bold text-xs">{p.quantity}</span>
                        <span className="text-right font-black text-zinc-900">KES {p.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card title="Top Customers" subtitle="By total spend" icon={Users}>
                  <div className="space-y-1 mt-6">
                    {(() => {
                      const customerStats = customers.map(c => {
                        const customerSales = sales.filter(s => s.customerId === c.id);
                        const totalSpent = customerSales.reduce((acc, s) => acc + s.amount, 0);
                        return { ...c, totalSpent, orderCount: customerSales.length };
                      }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

                      return customerStats.map((c, i) => (
                        <div key={i} className="data-grid-row grid grid-cols-[1fr_60px_120px] border-none rounded-2xl px-4 py-3">
                          <span className="font-bold text-zinc-900">{c.name}</span>
                          <span className="text-center text-zinc-400 font-bold text-xs">{c.orderCount}</span>
                          <span className="text-right font-black text-brand-600">KES {c.totalSpent.toLocaleString()}</span>
                        </div>
                      ));
                    })()}
                    {customers.length === 0 && (
                      <p className="text-center py-8 text-zinc-300 font-medium italic">No customer data available</p>
                    )}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="New Product" description="Add a new item to your inventory.">
        <form onSubmit={handleAddProduct} className="space-y-6">
          <Input label="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required placeholder="e.g. Sugar 1kg" />
          <div className="grid grid-cols-2 gap-6">
            <Input label="Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} required min={0} />
            <Input label="Low Stock Alert" type="number" value={newProduct.threshold} onChange={e => setNewProduct({...newProduct, threshold: Number(e.target.value)})} required min={0} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Input label="Buying Price" type="number" value={newProduct.buying} onChange={e => setNewProduct({...newProduct, buying: Number(e.target.value)})} required min={0} />
            <Input label="Selling Price" type="number" value={newProduct.selling} onChange={e => setNewProduct({...newProduct, selling: Number(e.target.value)})} required min={0} />
          </div>
          <Button type="submit" variant="brand" className="w-full py-4 mt-4">Save Product</Button>
        </form>
      </Modal>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Bulk Import" description="Upload a CSV file to add multiple products.">
        <div className="space-y-8">
          <div className="p-12 border-2 border-dashed border-zinc-200 rounded-[32px] bg-zinc-50/50 text-center group hover:border-brand-200 transition-all">
            <div className="w-20 h-20 bg-white rounded-[24px] shadow-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Download className="w-10 h-10 text-zinc-400 group-hover:text-brand-600 transition-colors" />
            </div>
            <h4 className="text-xl font-black text-zinc-900 mb-2 tracking-tight">Upload CSV File</h4>
            <p className="text-sm font-medium text-zinc-500 mb-8">Select your product inventory file to begin</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkImport}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <div className="flex justify-center">
                <Button variant="brand" className="px-8 py-4 rounded-2xl" icon={Plus}>Select CSV File</Button>
              </div>
            </label>
          </div>

          <div className="bg-zinc-900 rounded-[32px] p-8 text-white">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-6">Import Instructions</h4>
            <div className="space-y-6">
              {[
                { step: '1', text: 'CSV must have headers: Name, Stock, Buying Price, Selling Price, Low Stock Threshold' },
                { step: '2', text: 'Ensure prices and stock are numbers without currency symbols or commas' },
                { step: '3', text: 'Maximum 500 products per import recommended for best performance' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{item.step}</div>
                  <p className="text-sm font-medium text-zinc-300 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-10 text-white hover:bg-white/10 py-4 rounded-2xl border border-white/10" icon={Download} onClick={downloadTemplate}>
              Download CSV Template
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Record Expense" description="Track your business costs.">
        <form onSubmit={handleAddExpense} className="space-y-6">
          <Input label="Description" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} required placeholder="e.g. Rent, Transport" />
          <Input label="Amount" type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} required min={0} />
          <Button type="submit" variant="brand" className="w-full py-4 mt-4">Save Expense</Button>
        </form>
      </Modal>

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Add Customer" description="Keep track of your loyal customers.">
        <form onSubmit={handleAddCustomer} className="space-y-6">
          <Input label="Full Name" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required placeholder="e.g. John Doe" />
          <Input label="Phone Number" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="e.g. 0712 345 678" />
          <Input label="Email Address" type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="e.g. john@example.com" />
          <Input label="Address" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="e.g. Nairobi, Kenya" />
          <Button type="submit" variant="brand" className="w-full py-4 mt-4" icon={UserPlus}>Add Customer</Button>
        </form>
      </Modal>

      <Modal isOpen={isCustomerDetailModalOpen} onClose={() => setIsCustomerDetailModalOpen(false)} title="Customer Profile" description="View purchase history and details.">
        {selectedCustomerId && (
          <div className="space-y-8">
            {(() => {
              const customer = customers.find(c => c.id === selectedCustomerId);
              if (!customer) return null;
              const customerSales = sales.filter(s => s.customerId === customer.id);
              const totalSpent = customerSales.reduce((acc, s) => acc + s.amount, 0);
              
              return (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="bg-zinc-50 border-none">
                      <p className="stat-label">Total Spent</p>
                      <p className="text-2xl font-black text-brand-600">KES {totalSpent.toLocaleString()}</p>
                    </Card>
                    <Card className="bg-zinc-50 border-none">
                      <p className="stat-label">Total Orders</p>
                      <p className="text-2xl font-black text-zinc-900">{customerSales.length}</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                        <Smartphone className="w-4 h-4 text-zinc-400" />
                        {customer.phone || 'No phone provided'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        Joined {format(customer.createdAt?.toDate() || new Date(), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Purchase History</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {customerSales.map(sale => (
                        <div key={sale.id} className="p-4 rounded-2xl bg-zinc-50 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-zinc-400">{format(sale.date?.toDate() || new Date(), 'dd MMM, HH:mm')}</p>
                            <p className="font-bold text-zinc-900">{sale.items.length} items</p>
                          </div>
                          <p className="font-black text-brand-600">KES {sale.amount.toLocaleString()}</p>
                        </div>
                      ))}
                      {customerSales.length === 0 && (
                        <p className="text-center py-8 text-zinc-300 font-medium italic">No purchase history found</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      <Modal isOpen={isProfileModalOpen} onClose={() => {}} title="Welcome to Biashara" description="Let's set up your business profile.">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Input label="Business Name" value={profileForm.businessName} onChange={e => setProfileForm({...profileForm, businessName: e.target.value})} required placeholder="e.g. Mama Njuguna Kiosk" />
          <Input label="Phone Number" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="e.g. 0712 345 678" />
          <Button type="submit" variant="brand" className="w-full py-4 mt-4">Complete Setup</Button>
        </form>
      </Modal>

      <Modal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} title="New Sale" description="Select items to checkout.">
        <div className="space-y-10">
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Customer (Optional)</h4>
            <div className="relative">
              <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select
                value={saleCustomerId}
                onChange={(e) => setSaleCustomerId(e.target.value)}
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all appearance-none"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
          </div>

          <Input icon={Search} placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Available Items</h4>
            <div className="grid grid-cols-1 gap-3 max-h-[40vh] md:max-h-80 overflow-y-auto pr-2">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="w-full flex justify-between items-center p-4 md:p-5 rounded-[24px] bg-zinc-50/30 hover:bg-brand-50/50 border border-zinc-50 hover:border-brand-100 transition-all group">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center text-brand-500 shadow-sm group-hover:scale-110 transition-transform">
                      <Package className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-zinc-900 tracking-tight text-sm md:text-base">{p.name}</p>
                      <p className="text-[10px] md:text-xs font-bold text-zinc-400">KES {p.sellingPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <Badge variant={p.stockQuantity <= (p.lowStockThreshold || 5) ? 'danger' : 'neutral'}>{p.stockQuantity} left</Badge>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20"><Plus className="w-4 h-4 md:w-5 md:h-5" /></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-50 pt-8">
            <h4 className="stat-label mb-6">Current Cart</h4>
            <div className="space-y-4 mb-8">
              {cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-zinc-900">{item.name}</p>
                    <p className="text-xs font-bold text-zinc-400">{item.quantity} x KES {item.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center py-8 text-zinc-300 font-medium italic">Cart is empty</p>}
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                {[
                  { id: 'cash', label: 'Cash', icon: Wallet },
                  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      'flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border-2 transition-all',
                      paymentMethod === method.id ? 'border-brand-600 bg-brand-50 text-brand-600' : 'border-zinc-100 text-zinc-400'
                    )}
                  >
                    <method.icon className="w-4 h-4" /> {method.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center py-6 border-t border-zinc-50">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Total Amount</span>
                <span className="text-4xl font-black text-brand-600 tracking-tighter">
                  KES {cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
                </span>
              </div>
              <Button onClick={handleCompleteSale} variant="brand" className="w-full py-5 text-lg rounded-2xl" disabled={cart.length === 0}>Complete Transaction</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
