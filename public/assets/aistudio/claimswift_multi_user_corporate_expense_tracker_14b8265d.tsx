import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  Receipt, 
  Plus, 
  Moon, 
  Sun, 
  Search, 
  Printer, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Wallet, 
  Download, 
  Eye, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  User, 
  Users, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Store, 
  Calendar, 
  Tag, 
  X, 
  Upload, 
  FileText, 
  Filter, 
  Check
} from 'lucide-react';

// Firebase Setup
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "demo-api-key",
  authDomain: "demo-app.firebaseapp.com",
  projectId: "demo-app",
  storageBucket: "demo-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'claimswift-app';

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Profile/Account Workspace state (e.g. Andrew vs Alex)
  const [profiles, setProfiles] = useState(['Andrew (Self)', 'Alex (Friend/Colleague)']);
  const [activeProfile, setActiveProfile] = useState('Andrew (Self)');

  // Claims state from Firestore
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // UI state
  const [currency, setCurrency] = useState('RM');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(null);
  const [receiptViewerUrl, setReceiptViewerUrl] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('Client Meals');
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState('UNSUBMITTED');
  const [formNotes, setFormNotes] = useState('');
  const [formReceiptBase64, setFormReceiptBase64] = useState(null);

  // 1. Initial Authentication Effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore sync bound strictly to logged-in user
  useEffect(() => {
    if (!user) {
      setClaims([]);
      setLoadingClaims(false);
      return;
    }

    setLoadingClaims(true);
    const claimsColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'claims');

    const unsubscribe = onSnapshot(claimsColRef, 
      (snapshot) => {
        const fetchedClaims = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setClaims(fetchedClaims);
        setLoadingClaims(false);
      },
      (error) => {
        console.error("Error fetching claims from Firestore:", error);
        setLoadingClaims(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-in failed:", error);
      alert("Sign in failed. Using current secure private workspace session.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
    } catch (e) {
      console.error(e);
    }
  };

  // Switch workspace or add friend profile
  const handleAddProfile = () => {
    const name = prompt("Enter profile or colleague's name (e.g. Sarah, Alex):");
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!profiles.includes(trimmed)) {
        setProfiles([...profiles, trimmed]);
      }
      setActiveProfile(trimmed);
    }
  };

  // Profile Specific Dashboard Stats
  const profileClaims = useMemo(() => {
    return claims.filter(item => item.profile ? item.profile === activeProfile : activeProfile === 'Andrew (Self)');
  }, [claims, activeProfile]);

  const stats = useMemo(() => {
    let unsubmittedAmt = 0, unsubmittedCount = 0;
    let pendingAmt = 0, pendingCount = 0;
    let paidAmt = 0, paidCount = 0;
    let totalAmt = 0;

    profileClaims.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      totalAmt += amt;
      if (item.status === 'UNSUBMITTED') {
        unsubmittedAmt += amt;
        unsubmittedCount++;
      } else if (item.status === 'SUBMITTED') {
        pendingAmt += amt;
        pendingCount++;
      } else if (item.status === 'PAID') {
        paidAmt += amt;
        paidCount++;
      }
    });

    return {
      unsubmittedAmt, unsubmittedCount,
      pendingAmt, pendingCount,
      paidAmt, paidCount,
      totalAmt, totalCount: profileClaims.length
    };
  }, [profileClaims]);

  // Filter claims based on selected profile, year, month, status & search text
  const filteredClaims = useMemo(() => {
    return claims.filter(item => {
      const matchesProfile = item.profile ? item.profile === activeProfile : activeProfile === 'Andrew (Self)';
      
      const itemDateObj = item.date ? new Date(item.date) : null;
      const itemYear = itemDateObj && !isNaN(itemDateObj.getTime()) ? itemDateObj.getFullYear().toString() : 'Unknown';
      const itemMonth = itemDateObj && !isNaN(itemDateObj.getTime()) ? itemDateObj.toLocaleString('en-US', { month: 'short' }) : 'Unknown';

      const matchesYear = selectedYear === 'ALL' || itemYear === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || itemMonth === selectedMonth;
      
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.merchant && item.merchant.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      return matchesProfile && matchesYear && matchesMonth && matchesStatus && matchesSearch;
    });
  }, [claims, activeProfile, selectedYear, selectedMonth, statusFilter, searchQuery]);

  // Available Years List derived from claims
  const yearList = useMemo(() => {
    const years = profileClaims.map(c => {
      const d = c.date ? new Date(c.date) : null;
      return d && !isNaN(d.getTime()) ? d.getFullYear().toString() : 'Unknown';
    });
    return [...new Set(years)].sort((a, b) => b.localeCompare(a));
  }, [profileClaims]);

  // Months available for the active year context
  const availableMonths = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(m => {
      const count = profileClaims.filter(c => {
        const d = c.date ? new Date(c.date) : null;
        if (!d || isNaN(d.getTime())) return false;
        const matchesYr = selectedYear === 'ALL' || d.getFullYear().toString() === selectedYear;
        const matchesMn = d.toLocaleString('en-US', { month: 'short' }) === m;
        return matchesYr && matchesMn;
      }).length;
      return { name: m, count };
    });
  }, [profileClaims, selectedYear]);

  // Format money helper
  const formatMoney = (val) => {
    const num = parseFloat(val) || 0;
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Direct download receipt image back to Phone / PC
  const downloadReceipt = (item) => {
    if (!item.receipt) return;
    const link = document.createElement('a');
    link.href = item.receipt;
    const cleanMerchant = (item.merchant || 'Claim').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDate = item.date || 'Receipt';
    link.download = `Receipt_${cleanMerchant}_${cleanDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Modal for Create or Edit
  const handleOpenModal = (claimToEdit = null) => {
    if (claimToEdit) {
      setEditingClaim(claimToEdit);
      setFormTitle(claimToEdit.title || '');
      setFormMerchant(claimToEdit.merchant || '');
      setFormDate(claimToEdit.date || new Date().toISOString().split('T')[0]);
      setFormCategory(claimToEdit.category || 'Client Meals');
      setFormAmount(claimToEdit.amount || '');
      setFormStatus(claimToEdit.status || 'UNSUBMITTED');
      setFormNotes(claimToEdit.notes || '');
      setFormReceiptBase64(claimToEdit.receipt || null);
    } else {
      setEditingClaim(null);
      setFormTitle('');
      setFormMerchant('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormCategory('Client Meals');
      setFormAmount('');
      setFormStatus('UNSUBMITTED');
      setFormNotes('');
      setFormReceiptBase64(null);
    }
    setIsModalOpen(true);
  };

  // File Upload Reader
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormReceiptBase64(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  // AI OCR Simulator
  const simulateAIScan = () => {
    const samples = [
      { title: 'Client Pitch Lunch', merchant: 'Din Tai Fung', category: 'Client Meals', amount: '185.50' },
      { title: 'Airport Taxi Transfer', merchant: 'Grab / Uber', category: 'Travel / Taxi', amount: '68.00' },
      { title: 'Office Stationery Pack', merchant: 'Popular Bookstore', category: 'Office Supplies', amount: '45.20' },
      { title: 'Team Coffee Sprint', merchant: 'Starbucks Coffee', category: 'Entertainment', amount: '34.80' }
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setFormTitle(pick.title);
    setFormMerchant(pick.merchant);
    setFormCategory(pick.category);
    setFormAmount(pick.amount);
  };

  // Save Claim to Firestore
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!user) return;

    const claimData = {
      profile: activeProfile,
      title: formTitle.trim(),
      merchant: formMerchant.trim(),
      date: formDate,
      category: formCategory,
      amount: parseFloat(formAmount) || 0,
      status: formStatus,
      notes: formNotes.trim(),
      receipt: formReceiptBase64,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingClaim) {
        const claimDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'claims', editingClaim.id);
        await updateDoc(claimDocRef, claimData);
      } else {
        const claimsColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'claims');
        await addDoc(claimsColRef, {
          ...claimData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save claim:", err);
      alert("Failed to save claim to online cloud database.");
    }
  };

  // Cycle Status Quick Action
  const handleCycleStatus = async (item) => {
    if (!user) return;
    let nextStatus = 'UNSUBMITTED';
    if (item.status === 'UNSUBMITTED') nextStatus = 'SUBMITTED';
    else if (item.status === 'SUBMITTED') nextStatus = 'PAID';
    
    try {
      const claimDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'claims', item.id);
      await updateDoc(claimDocRef, { status: nextStatus });
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Delete Claim
  const handleDeleteClaim = async (claimId) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this expense claim?")) {
      try {
        const claimDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'claims', claimId);
        await deleteDoc(claimDocRef);
      } catch (err) {
        console.error("Failed to delete:", err);
      }
    }
  };

  // Print Batch Summary Report
  const handleExportReport = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200 font-sans`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* HEADER & ACCOUNT SWITCHER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 gap-4 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">ClaimSwift</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Cloud Sync</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Corporate Claim Tracker & Receipt Archiver</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
              <div className="px-2.5 py-1 text-slate-400 flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline text-slate-500 dark:text-slate-400">Account:</span>
              </div>
              <select 
                value={activeProfile}
                onChange={(e) => setActiveProfile(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 pr-2 py-1 outline-none cursor-pointer"
              >
                {profiles.map(p => (
                  <option key={p} value={p} className="dark:bg-slate-800 text-slate-800 dark:text-slate-100">{p}</option>
                ))}
              </select>
              <button 
                onClick={handleAddProfile}
                title="Add new friend/colleague profile workspace"
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer shadow-sm"
            >
              <option value="RM">RM (MYR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="S$">S$ (SGD)</option>
            </select>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && !user.isAnonymous ? (
              <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl px-3 py-1.5">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}`} alt="User" className="w-6 h-6 rounded-full" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 max-w-[100px] truncate">{user.displayName || user.email}</span>
                <button onClick={handleSignOut} title="Sign Out" className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>1-Click Gmail Login</span>
              </button>
            )}

            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Claim</span>
            </button>
          </div>
        </header>

        {/* ACTIVE WORKSPACE NOTICE */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Active Workspace Profile: <strong className="text-blue-600 dark:text-blue-400 font-bold">{activeProfile}</strong>
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{profileClaims.length} items logged</span>
        </div>

        {/* DASHBOARD SUMMARY STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Yet to Submit</span>
              <span className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white">{formatMoney(stats.unsubmittedAmt)}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stats.unsubmittedCount} receipts waiting in pocket</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pending HR/Finance</span>
              <span className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white">{formatMoney(stats.pendingAmt)}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stats.pendingCount} claims submitted</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Reimbursed</span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white">{formatMoney(stats.paidAmt)}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stats.paidCount} claims settled</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">All Time Claims</span>
              <span className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-slate-600 dark:text-slate-300">
                <Wallet className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-black text-slate-900 dark:text-white">{formatMoney(stats.totalAmt)}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stats.totalCount} total claims logged</p>
            </div>
          </div>
        </section>

        {/* MONTH & YEAR FILTER CONTROLS */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5">Year:</span>
              <select 
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth('ALL');
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-slate-800">All Years</option>
                {yearList.map(y => (
                  <option key={y} value={y} className="dark:bg-slate-800">{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none max-w-full">
              <button
                onClick={() => setSelectedMonth('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedMonth === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All Months
              </button>
              
              {availableMonths.filter(m => m.count > 0).map(m => (
                <button
                  key={m.name}
                  onClick={() => setSelectedMonth(m.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedMonth === m.name
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m.name} <span className="opacity-75 font-normal">({m.count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, notes..." 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium rounded-xl px-3 py-2.5 outline-none shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNSUBMITTED">Unsubmitted Only</option>
              <option value="SUBMITTED">Submitted Only</option>
              <option value="PAID">Reimbursed Only</option>
            </select>

            <button 
              onClick={handleExportReport}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* CLAIMS LIST */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden print:hidden">
          {loadingClaims ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-600" />
              <p className="text-xs font-medium">Loading claims from cloud database...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No claim items found</p>
              <p className="text-xs text-slate-400 mt-1">Try adding a new expense for {activeProfile} or clearing filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredClaims.map((item) => (
                <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div 
                      onClick={() => item.receipt && setReceiptViewerUrl(item.receipt)}
                      className={`w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden group relative ${item.receipt ? 'cursor-pointer' : ''}`}
                    >
                      {item.receipt ? (
                        <>
                          <img src={item.receipt} alt="Receipt" className="w-full h-full object-cover group-hover:scale-110 transition" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <Receipt className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                        {item.status === 'UNSUBMITTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="w-3 h-3 mr-1" /> Unsubmitted
                          </span>
                        )}
                        {item.status === 'SUBMITTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Clock className="w-3 h-3 mr-1" /> Submitted
                          </span>
                        )}
                        {item.status === 'PAID' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 mr-1" /> Paid
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                          <Store className="w-3 h-3 inline mr-1" />{item.merchant}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 inline mr-1" />{item.date}
                        </span>
                        <span>•</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{item.category}</span>
                      </div>
                      
                      {item.notes && <p className="text-xs text-slate-400 italic mt-1 max-w-md">{item.notes}</p>}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {formatMoney(item.amount)}
                    </div>
                    
                    <div className="flex items-center space-x-1 mt-1">
                      {item.receipt && (
                        <button
                          onClick={() => downloadReceipt(item)}
                          title="Download Receipt Image directly to phone/PC"
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold transition mr-1"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Download Receipt</span>
                        </button>
                      )}

                      <button 
                        onClick={() => handleCycleStatus(item)} 
                        title="Quick change claim status"
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => handleOpenModal(item)} 
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteClaim(item.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRINTABLE REPORT SUMMARY */}
        <div className="hidden print:block p-8 bg-white text-slate-900">
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">EXPENSE CLAIM REPORT</h1>
              <p className="text-sm text-slate-600">Account Workspace: <strong>{activeProfile}</strong></p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Scope: {selectedMonth === 'ALL' ? 'All Months' : selectedMonth}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-slate-100 border-b">
                <th className="p-2">#</th>
                <th className="p-2">Date</th>
                <th className="p-2">Merchant</th>
                <th className="p-2">Title</th>
                <th className="p-2">Category</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredClaims.map((item, idx) => (
                <tr key={item.id}>
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{item.date}</td>
                  <td className="p-2 font-bold">{item.merchant}</td>
                  <td className="p-2">{item.title}</td>
                  <td className="p-2">{item.category}</td>
                  <td className="p-2">{item.status}</td>
                  <td className="p-2 text-right font-bold">{formatMoney(item.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-sm border-t">
                <td colSpan="6" className="p-3 text-right">TOTAL CLAIM:</td>
                <td className="p-3 text-right text-blue-700">
                  {formatMoney(filteredClaims.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-8 border-t pt-4">
            <h3 className="text-sm font-bold mb-4">ATTACHED RECEIPT PROOFS</h3>
            <div className="grid grid-cols-2 gap-4">
              {filteredClaims.filter(c => c.receipt).map((item, idx) => (
                <div key={idx} className="border p-2 rounded text-center">
                  <img src={item.receipt} alt="Receipt" className="max-h-48 object-contain mx-auto mb-2" />
                  <p className="text-[10px] font-medium">{item.merchant} - {formatMoney(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT CLAIM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClaim ? 'Edit Expense Claim' : `Add Claim for ${activeProfile}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">AI Receipt Scanner</p>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400">Simulate auto-reading vendor & total</p>
                  </div>
                </div>
                <button type="button" onClick={simulateAIScan} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition">
                  Auto-Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt Snapshot / Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formReceiptBase64 ? (
                      <img src={formReceiptBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Receipt className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" id="receiptFileInput" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('receiptFileInput').click()} 
                      className="w-full py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center space-x-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload / Snapshot Receipt</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title / Purpose *</label>
                  <input 
                    type="text" 
                    required 
                    value={formTitle} 
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Client Dinner" 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Merchant / Vendor *</label>
                  <input 
                    type="text" 
                    required 
                    value={formMerchant} 
                    onChange={(e) => setFormMerchant(e.target.value)}
                    placeholder="e.g. Grab, Starbucks" 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={formDate} 
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  >
                    <option value="Client Meals">Client Meals</option>
                    <option value="Travel / Taxi">Travel / Taxi</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Software / Tech">Software / Tech</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currency}</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      value={formAmount} 
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Claim Status</label>
                <select 
                  value={formStatus} 
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                >
                  <option value="UNSUBMITTED">⚠️ Unsubmitted (In My Pocket)</option>
                  <option value="SUBMITTED">⏳ Submitted (Pending HR/Finance Approval)</option>
                  <option value="PAID">✅ Paid / Reimbursed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Remarks / Project Note</label>
                <input 
                  type="text" 
                  value={formNotes} 
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Q4 pitch with client team" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md shadow-blue-500/20">
                  Save Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL RECEIPT VIEWER MODAL */}
      {receiptViewerUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 print:hidden" onClick={() => setReceiptViewerUrl(null)}>
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setReceiptViewerUrl(null)} className="absolute top-4 right-4 bg-slate-800 text-white p-2 rounded-full shadow-lg hover:bg-slate-700 z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={receiptViewerUrl} alt="Full Receipt" className="max-w-full max-h-[85vh] object-contain mx-auto rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
}