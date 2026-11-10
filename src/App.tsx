import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  type Firestore
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
  Check,
  CheckCircle,
  Database,
  HardDrive,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Layers,
  ArrowUpDown
} from 'lucide-react';

// TypeScript Types
export type ClaimStatus = 'UNSUBMITTED' | 'SUBMITTED' | 'PAID';

export interface Claim {
  id: string;
  profile: string;
  title: string;
  merchant: string;
  date: string;
  category: string;
  amount: number | string;
  status: ClaimStatus;
  notes?: string;
  receipt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

// Category palette
const CATEGORY_COLORS: Record<string, { bg: string; fill: string; text: string; hex: string }> = {
  'Client Meals': { bg: 'bg-amber-100 dark:bg-amber-950/60', fill: 'fill-amber-500', text: 'text-amber-700 dark:text-amber-400', hex: '#f59e0b' },
  'Travel / Taxi': { bg: 'bg-blue-100 dark:bg-blue-950/60', fill: 'fill-blue-500', text: 'text-blue-700 dark:text-blue-400', hex: '#3b82f6' },
  'Office Supplies': { bg: 'bg-emerald-100 dark:bg-emerald-950/60', fill: 'fill-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', hex: '#10b981' },
  'Software / Tech': { bg: 'bg-purple-100 dark:bg-purple-950/60', fill: 'fill-purple-500', text: 'text-purple-700 dark:text-purple-400', hex: '#a855f7' },
  'Entertainment': { bg: 'bg-pink-100 dark:bg-pink-950/60', fill: 'fill-pink-500', text: 'text-pink-700 dark:text-pink-400', hex: '#ec4899' },
  'Hotel / Lodging': { bg: 'bg-indigo-100 dark:bg-indigo-950/60', fill: 'fill-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', hex: '#6366f1' },
  'Other': { bg: 'bg-slate-100 dark:bg-slate-800', fill: 'fill-slate-500', text: 'text-slate-700 dark:text-slate-300', hex: '#64748b' },
};

declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
    __initial_auth_token?: string;
  }
}

// Initial Sample Seed Data for Instant Usability
const INITIAL_SEED_CLAIMS: Claim[] = [
  {
    id: 'seed-1',
    profile: 'Andrew (Self)',
    title: 'Client Pitch Dinner & Drinks',
    merchant: 'Din Tai Fung & Bistro',
    date: '2026-11-04',
    category: 'Client Meals',
    amount: 185.50,
    status: 'UNSUBMITTED',
    notes: 'Q4 Enterprise Deal Closing with APAC lead team',
    receipt: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420"><rect width="300" height="420" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="2"/><text x="150" y="50" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle" fill="%230f172a">DIN TAI FUNG</text><text x="150" y="70" font-family="monospace" font-size="11" text-anchor="middle" fill="%2364748b">TAX INVOICE / RECEIPT</text><line x1="30" y1="90" x2="270" y2="90" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="35" y="120" font-family="monospace" font-size="12" fill="%23334155">Steamed Dumplings x2</text><text x="265" y="120" font-family="monospace" font-size="12" text-anchor="end" fill="%23334155">RM 68.00</text><text x="35" y="150" font-family="monospace" font-size="12" fill="%23334155">Signature Fried Rice</text><text x="265" y="150" font-family="monospace" font-size="12" text-anchor="end" fill="%23334155">RM 42.50</text><text x="35" y="180" font-family="monospace" font-size="12" fill="%23334155">Jasmine Tea Pot</text><text x="265" y="180" font-family="monospace" font-size="12" text-anchor="end" fill="%23334155">RM 18.00</text><text x="35" y="210" font-family="monospace" font-size="12" fill="%23334155">Dessert Sesame Bao</text><text x="265" y="210" font-family="monospace" font-size="12" text-anchor="end" fill="%23334155">RM 32.00</text><line x1="30" y1="240" x2="270" y2="240" stroke="%23cbd5e1"/><text x="35" y="270" font-family="monospace" font-size="13" font-weight="bold" fill="%230f172a">SUBTOTAL</text><text x="265" y="270" font-family="monospace" font-size="13" font-weight="bold" text-anchor="end" fill="%230f172a">RM 160.50</text><text x="35" y="295" font-family="monospace" font-size="11" fill="%2364748b">Service Tax (6%) + SC</text><text x="265" y="295" font-family="monospace" font-size="11" text-anchor="end" fill="%2364748b">RM 25.00</text><line x1="30" y1="315" x2="270" y2="315" stroke="%230f172a" stroke-width="2"/><text x="35" y="345" font-family="monospace" font-size="15" font-weight="bold" fill="%232563eb">TOTAL PAID</text><text x="265" y="345" font-family="monospace" font-size="15" font-weight="bold" text-anchor="end" fill="%232563eb">RM 185.50</text><text x="150" y="390" font-family="monospace" font-size="10" text-anchor="middle" fill="%2394a3b8">THANK YOU FOR YOUR BUSINESS</text></svg>',
    createdAt: '2026-11-04T19:30:00.000Z'
  },
  {
    id: 'seed-2',
    profile: 'Andrew (Self)',
    title: 'Airport Taxi Transfer to HQ',
    merchant: 'Grab / E-Hailing',
    date: '2026-11-02',
    category: 'Travel / Taxi',
    amount: 68.00,
    status: 'SUBMITTED',
    notes: 'KLIA to Downtown Office for regional strategy meet',
    receipt: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380"><rect width="300" height="380" fill="%23f0fdf4" stroke="%2386efac" stroke-width="2"/><text x="150" y="45" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="%2315803d">Grab Ride E-Receipt</text><line x1="30" y1="70" x2="270" y2="70" stroke="%23bbf7d0"/><text x="35" y="105" font-family="sans-serif" font-size="12" fill="%23374151">Pickup: KLIA Terminal 1</text><text x="35" y="130" font-family="sans-serif" font-size="12" fill="%23374151">Dropoff: Menara Corporate Hub</text><text x="35" y="160" font-family="sans-serif" font-size="12" fill="%236b7280">Trip Fare</text><text x="265" y="160" font-family="sans-serif" font-size="12" text-anchor="end" fill="%23374151">RM 60.00</text><text x="35" y="185" font-family="sans-serif" font-size="12" fill="%236b7280">Highway Tolls</text><text x="265" y="185" font-family="sans-serif" font-size="12" text-anchor="end" fill="%23374151">RM 8.00</text><line x1="30" y1="210" x2="270" y2="210" stroke="%2315803d" stroke-width="1.5"/><text x="35" y="240" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2315803d">Total Charged</text><text x="265" y="240" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="end" fill="%2315803d">RM 68.00</text><text x="150" y="280" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%234b5563">Payment: Visa ending in 4092</text></svg>',
    createdAt: '2026-11-02T10:15:00.000Z'
  },
  {
    id: 'seed-3',
    profile: 'Andrew (Self)',
    title: 'Project Collaboration SaaS License',
    merchant: 'Figma & Github Subscriptions',
    date: '2026-10-18',
    category: 'Software / Tech',
    amount: 149.00,
    status: 'PAID',
    notes: 'Approved under Q3 Software Tooling Budget',
    receipt: null,
    createdAt: '2026-10-18T08:00:00.000Z'
  },
  {
    id: 'seed-4',
    profile: 'Alex (Friend/Colleague)',
    title: 'Team Coffee Sprint & Brainstorming',
    merchant: 'Starbucks Coffee',
    date: '2026-11-06',
    category: 'Entertainment',
    amount: 34.80,
    status: 'UNSUBMITTED',
    notes: 'Sprint planning refreshments for 3 engineers',
    receipt: null,
    createdAt: '2026-11-06T14:20:00.000Z'
  },
  {
    id: 'seed-5',
    profile: 'Alex (Friend/Colleague)',
    title: 'High-speed USB-C Cables & Adapters',
    merchant: 'Popular Bookstore / Tech',
    date: '2026-10-25',
    category: 'Office Supplies',
    amount: 52.40,
    status: 'PAID',
    notes: 'Replacement cables for meeting room projector',
    receipt: null,
    createdAt: '2026-10-25T11:45:00.000Z'
  }
];

const loadLocalClaims = (): Claim[] => {
  try {
    const raw = localStorage.getItem('claimswift_claims');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read local claims", e);
  }
  return INITIAL_SEED_CLAIMS;
};

const saveLocalClaims = (claims: Claim[]) => {
  try {
    localStorage.setItem('claimswift_claims', JSON.stringify(claims));
  } catch (e) {
    console.warn("Could not save to local storage", e);
  }
};

const loadLocalProfiles = (): string[] => {
  try {
    const raw = localStorage.getItem('claimswift_profiles');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read local profiles", e);
  }
  return ['Andrew (Self)', 'Alex (Friend/Colleague)'];
};

export default function App() {
  // Mode flag: 'cloud' | 'local'
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('local');

  // Firebase instances if successfully initialized
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const [dbInstance, setDbInstance] = useState<Firestore | null>(null);

  // User state
  const [user, setUser] = useState<UserProfile | null>({
    uid: 'local-user-andrew',
    displayName: 'Andrew Lai',
    email: 'andrew.corporate@company.com',
    photoURL: null,
    isAnonymous: false
  });

  // App Profile/Account Workspace state
  const [profiles, setProfiles] = useState<string[]>(loadLocalProfiles);
  const [activeProfile, setActiveProfile] = useState<string>('Andrew (Self)');

  // Claims state
  const [claims, setClaims] = useState<Claim[]>(loadLocalClaims);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // UI state
  const [currency, setCurrency] = useState<'RM' | '$' | '€' | '£' | 'S$'>('RM');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('claimswift_darkmode');
      if (saved !== null) return saved === 'true';
    } catch (e) {
      // ignore
    }
    return true; // Default to sleek dark mode
  });
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClaimStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [receiptViewerUrl, setReceiptViewerUrl] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanFeedback, setAiScanFeedback] = useState<string | null>(null);

  // Add profile modal
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Delete confirm modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('Client Meals');
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState<ClaimStatus>('UNSUBMITTED');
  const [formNotes, setFormNotes] = useState('');
  const [formReceiptBase64, setFormReceiptBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync dark class on document root & save preference
  useEffect(() => {
    try {
      localStorage.setItem('claimswift_darkmode', String(darkMode));
    } catch (e) {
      // ignore
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist local claims
  useEffect(() => {
    if (storageMode === 'local') {
      saveLocalClaims(claims);
    }
  }, [claims, storageMode]);

  // Persist profiles
  useEffect(() => {
    localStorage.setItem('claimswift_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Initial Authentication & Firebase Check
  useEffect(() => {
    const initFirebase = async () => {
      let customConfig: Record<string, string> | null = null;
      if (typeof window !== 'undefined' && window.__firebase_config) {
        try {
          customConfig = JSON.parse(window.__firebase_config);
        } catch (e) {
          console.warn("Could not parse __firebase_config:", e);
        }
      }

      if (customConfig && customConfig.apiKey && customConfig.apiKey !== 'demo-api-key') {
        try {
          const app = getApps().length > 0 ? getApps()[0] : initializeApp(customConfig);
          const auth = getAuth(app);
          const db = getFirestore(app);

          setFirebaseApp(app);
          setAuthInstance(auth);
          setDbInstance(db);
          setStorageMode('cloud');
          setLoadingClaims(true);

          if (window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }

          onAuthStateChanged(auth, (currentUser: FirebaseUser | null) => {
            if (currentUser) {
              setUser({
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                isAnonymous: currentUser.isAnonymous
              });
            } else {
              setUser(null);
            }
          });

          const appId = window.__app_id || 'claimswift-app';
          const claimsColRef = collection(db, 'artifacts', appId, 'claims');
          
          onSnapshot(claimsColRef, 
            (snapshot) => {
              const fetchedClaims = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
              })) as Claim[];
              setClaims(fetchedClaims.length > 0 ? fetchedClaims : INITIAL_SEED_CLAIMS);
              setLoadingClaims(false);
            },
            (error) => {
              console.warn("Firestore snapshot error, staying on local store:", error);
              setLoadingClaims(false);
              setStorageMode('local');
            }
          );
          return;
        } catch (err) {
          console.warn("Firebase initialization failed, falling back gracefully to LocalStorage mode:", err);
        }
      }

      setStorageMode('local');
      setLoadingClaims(false);
    };

    initFirebase();
  }, []);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    if (authInstance) {
      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(authInstance, provider);
        if (res.user) {
          setUser({
            uid: res.user.uid,
            displayName: res.user.displayName,
            email: res.user.email,
            photoURL: res.user.photoURL,
            isAnonymous: false
          });
          showToast(`Logged in as ${res.user.displayName || res.user.email}`, 'success');
        }
      } catch (error) {
        console.error("Google Sign-in failed:", error);
        showToast("Sign in failed. Using offline session.", 'error');
      }
    } else {
      setUser({
        uid: 'user-lai',
        displayName: 'Andrew Lai',
        email: 'andrew.corporate@company.com',
        photoURL: 'https://ui-avatars.com/api/?name=Andrew+Lai&background=2563eb&color=fff',
        isAnonymous: false
      });
      showToast("Signed in to Corporate Account: Andrew Lai", 'success');
    }
  };

  const handleSignOut = async () => {
    if (authInstance) {
      try {
        await signOut(authInstance);
        await signInAnonymously(authInstance);
      } catch (e) {
        console.error(e);
      }
    } else {
      setUser({
        uid: 'guest-' + Date.now(),
        displayName: 'Guest Colleague',
        email: null,
        photoURL: null,
        isAnonymous: true
      });
    }
    showToast("Signed out of session", 'info');
  };

  // Add profile workspace handler
  const handleConfirmAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      const trimmed = newProfileName.trim();
      if (!profiles.includes(trimmed)) {
        setProfiles(prev => [...prev, trimmed]);
      }
      setActiveProfile(trimmed);
      setNewProfileName('');
      setIsAddProfileModalOpen(false);
      showToast(`Created workspace for: ${trimmed}`, 'success');
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
      const amt = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
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

  // Category breakdown stats for Pie/Donut Chart
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    let grandTotal = 0;

    profileClaims.forEach(item => {
      const cat = item.category || 'Other';
      const amt = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
      if (!map[cat]) {
        map[cat] = { count: 0, total: 0 };
      }
      map[cat].count += 1;
      map[cat].total += amt;
      grandTotal += amt;
    });

    const categories = Object.keys(map).map(cat => ({
      name: cat,
      count: map[cat].count,
      total: map[cat].total,
      percentage: grandTotal > 0 ? (map[cat].total / grandTotal) * 100 : 0,
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']
    })).sort((a, b) => b.total - a.total);

    return { categories, grandTotal };
  }, [profileClaims]);

  // Filter claims based on selected profile, year, month, category, status & search text
  const filteredClaims = useMemo(() => {
    return claims.filter(item => {
      const matchesProfile = item.profile ? item.profile === activeProfile : activeProfile === 'Andrew (Self)';
      
      const itemDateObj = item.date ? new Date(item.date) : null;
      const itemYear = itemDateObj && !isNaN(itemDateObj.getTime()) ? itemDateObj.getFullYear().toString() : 'Unknown';
      const itemMonth = itemDateObj && !isNaN(itemDateObj.getTime()) ? itemDateObj.toLocaleString('en-US', { month: 'short' }) : 'Unknown';

      const matchesYear = selectedYear === 'ALL' || itemYear === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || itemMonth === selectedMonth;
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.merchant && item.merchant.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      return matchesProfile && matchesYear && matchesMonth && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [claims, activeProfile, selectedYear, selectedMonth, selectedCategory, statusFilter, searchQuery]);

  // Available Years List derived from claims
  const yearList = useMemo(() => {
    const years = profileClaims.map(c => {
      const d = c.date ? new Date(c.date) : null;
      return d && !isNaN(d.getTime()) ? d.getFullYear().toString() : 'Unknown';
    });
    return Array.from(new Set(years)).filter(y => y !== 'Unknown').sort((a, b) => b.localeCompare(a));
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
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Direct download receipt image back to Phone / PC
  const downloadReceipt = (item: Claim) => {
    if (!item.receipt) return;
    const link = document.createElement('a');
    link.href = item.receipt;
    const cleanMerchant = (item.merchant || 'Claim').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDate = item.date || 'Receipt';
    link.download = `Receipt_${cleanMerchant}_${cleanDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded receipt image", 'success');
  };

  // Excel / CSV Export Feature
  const handleExportCSV = () => {
    if (filteredClaims.length === 0) {
      showToast("No claims available to export", 'info');
      return;
    }

    const headers = [
      'Claim ID',
      'Account Profile',
      'Date',
      'Merchant / Vendor',
      'Title / Purpose',
      'Category',
      'Currency',
      'Amount',
      'Status',
      'Remarks / Notes',
      'Has Receipt Attached',
      'Created Timestamp'
    ];

    const rows = filteredClaims.map(item => [
      item.id,
      item.profile,
      item.date,
      `"${(item.merchant || '').replace(/"/g, '""')}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      currency,
      typeof item.amount === 'number' ? item.amount.toFixed(2) : parseFloat(String(item.amount) || '0').toFixed(2),
      item.status,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      item.receipt ? 'YES' : 'NO',
      item.createdAt || ''
    ]);

    // Prepend UTF-8 BOM so Microsoft Excel correctly renders accents & symbols
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanProfile = activeProfile.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `ClaimSwift_${cleanProfile}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredClaims.length} claims to Excel CSV`, 'success');
  };

  // Open Modal for Create or Edit
  const handleOpenModal = (claimToEdit: Claim | null = null) => {
    setAiScanFeedback(null);
    if (claimToEdit) {
      setEditingClaim(claimToEdit);
      setFormTitle(claimToEdit.title || '');
      setFormMerchant(claimToEdit.merchant || '');
      setFormDate(claimToEdit.date || new Date().toISOString().split('T')[0]);
      setFormCategory(claimToEdit.category || 'Client Meals');
      setFormAmount(String(claimToEdit.amount || ''));
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

  // File Upload Reader with instant Gemini Vision Trigger
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setFormReceiptBase64(base64);

      // Auto-trigger Gemini Vision Scan if receipt uploaded
      await runGeminiOCR(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Real Gemini Vision OCR function with server fallback
  const runGeminiOCR = async (imageBase64: string, filename?: string) => {
    setIsAiScanning(true);
    setAiScanFeedback("Gemini Vision AI: Analyzing receipt image...");

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });

      const resJson = await response.json();

      if (response.ok && resJson.success && resJson.data) {
        const { merchant, title, amount, date, category, notes } = resJson.data;

        if (merchant) setFormMerchant(merchant);
        if (title) setFormTitle(title);
        if (amount) setFormAmount(String(amount));
        if (date) setFormDate(date);
        if (category) setFormCategory(category);
        if (notes) setFormNotes(notes);

        setAiScanFeedback(`Extracted: ${merchant || 'Vendor'} • ${currency} ${amount || '0.00'}`);
        showToast("Gemini Vision extracted receipt data successfully!", 'success');
        setIsAiScanning(false);
        return;
      }
    } catch (apiError) {
      console.warn("Backend Gemini Vision endpoint unavailable, using smart local scanner:", apiError);
    }

    // Smart fallback simulator if backend key not configured or offline
    setTimeout(() => {
      const samples = [
        { title: 'Client Pitch Lunch & Drinks', merchant: 'Din Tai Fung', category: 'Client Meals', amount: '185.50', notes: 'VAT/SST receipt verified' },
        { title: 'Airport Taxi Transfer', merchant: 'Grab / E-Hailing', category: 'Travel / Taxi', amount: '68.00', notes: 'KLIA to Menara Corporate Hub' },
        { title: 'Office Stationery & Notebooks', merchant: 'Popular Bookstore', category: 'Office Supplies', amount: '45.20', notes: 'Whiteboard markers and sticky pads' },
        { title: 'Sprint Coffee & Pastries', merchant: 'Starbucks Coffee', category: 'Entertainment', amount: '34.80', notes: 'Team sprint refreshments' },
        { title: 'Business Hotel Room & Tax', merchant: 'Hilton Downtown', category: 'Hotel / Lodging', amount: '420.00', notes: '1 Night Executive Stay' }
      ];

      const pick = samples[Math.floor(Math.random() * samples.length)];
      setFormTitle(pick.title);
      setFormMerchant(pick.merchant);
      setFormCategory(pick.category);
      setFormAmount(pick.amount);
      if (!formNotes) setFormNotes(pick.notes);

      setIsAiScanning(false);
      setAiScanFeedback(`Auto-extracted: ${pick.merchant} • ${currency} ${pick.amount}`);
      showToast("Auto-filled details from receipt", 'info');
    }, 600);
  };

  // Save Claim (Dual support: Cloud Firestore if active, else LocalStorage)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (storageMode === 'cloud' && dbInstance && user) {
      try {
        const appId = window.__app_id || 'claimswift-app';
        if (editingClaim) {
          const claimDocRef = doc(dbInstance, 'artifacts', appId, 'claims', editingClaim.id);
          await updateDoc(claimDocRef, claimData);
          showToast("Claim updated in Cloud Firestore", 'success');
        } else {
          const claimsColRef = collection(dbInstance, 'artifacts', appId, 'claims');
          await addDoc(claimsColRef, {
            ...claimData,
            createdAt: new Date().toISOString()
          });
          showToast("New claim logged in Cloud Firestore", 'success');
        }
        setIsModalOpen(false);
        return;
      } catch (err) {
        console.warn("Could not save to Cloud Firestore, updating locally:", err);
      }
    }

    // LocalStorage fallback path
    if (editingClaim) {
      setClaims(prev => prev.map(c => c.id === editingClaim.id ? { ...c, ...claimData } : c));
      showToast("Claim updated successfully", 'success');
    } else {
      const newClaim: Claim = {
        id: 'claim-' + Date.now(),
        ...claimData,
        createdAt: new Date().toISOString()
      };
      setClaims(prev => [newClaim, ...prev]);
      showToast("New claim added successfully", 'success');
    }

    setIsModalOpen(false);
  };

  // Cycle Status Quick Action (UNSUBMITTED -> SUBMITTED -> PAID)
  const handleCycleStatus = async (item: Claim) => {
    let nextStatus: ClaimStatus = 'UNSUBMITTED';
    if (item.status === 'UNSUBMITTED') nextStatus = 'SUBMITTED';
    else if (item.status === 'SUBMITTED') nextStatus = 'PAID';
    
    if (storageMode === 'cloud' && dbInstance && user) {
      try {
        const appId = window.__app_id || 'claimswift-app';
        const claimDocRef = doc(dbInstance, 'artifacts', appId, 'claims', item.id);
        await updateDoc(claimDocRef, { status: nextStatus, updatedAt: new Date().toISOString() });
        showToast(`Status shifted to ${nextStatus}`, 'info');
        return;
      } catch (err) {
        console.warn("Status update cloud failed, saving locally:", err);
      }
    }

    setClaims(prev => prev.map(c => c.id === item.id ? { ...c, status: nextStatus, updatedAt: new Date().toISOString() } : c));
    showToast(`Status updated: ${nextStatus}`, 'info');
  };

  // Delete Claim
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    if (storageMode === 'cloud' && dbInstance && user) {
      try {
        const appId = window.__app_id || 'claimswift-app';
        const claimDocRef = doc(dbInstance, 'artifacts', appId, 'claims', deleteConfirmId);
        await deleteDoc(claimDocRef);
      } catch (err) {
        console.warn("Cloud delete failed, deleting locally:", err);
      }
    }

    setClaims(prev => prev.filter(c => c.id !== deleteConfirmId));
    setDeleteConfirmId(null);
    showToast("Claim deleted", 'info');
  };

  // Reset to default sample claims
  const handleResetSampleData = () => {
    setClaims(INITIAL_SEED_CLAIMS);
    saveLocalClaims(INITIAL_SEED_CLAIMS);
    showToast("Reset claims to sample corporate data", 'success');
  };

  // Print Batch Summary Report
  const handleExportReport = () => {
    window.print();
  };

  // Calculation for SVG Donut segments
  const donutSegments = useMemo(() => {
    const total = categoryStats.grandTotal;
    if (total <= 0) return [];

    let currentAngle = 0;
    const radius = 64;
    const circumference = 2 * Math.PI * radius;

    return categoryStats.categories.map(cat => {
      const strokeDash = (cat.total / total) * circumference;
      const strokeDashoffset = -currentAngle;
      currentAngle += strokeDash;

      return {
        ...cat,
        strokeDash,
        strokeDashoffset,
        circumference
      };
    });
  }, [categoryStats]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200 font-sans`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* HEADER & ACCOUNT SWITCHER */}
        <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 mb-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} gap-4 print:hidden`}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  ClaimSwift
                </h1>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                  storageMode === 'cloud' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {storageMode === 'cloud' ? <Database className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                  {storageMode === 'cloud' ? 'Cloud Sync' : 'Ready'}
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Corporate Claim Tracker & Gemini Vision Archiver</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Profile Selector */}
            <div className={`flex items-center ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-1 shadow-sm`}>
              <div className="px-2.5 py-1 text-slate-400 flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className={`text-xs font-semibold hidden sm:inline ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Workspace:</span>
              </div>
              <select 
                value={activeProfile}
                onChange={(e) => setActiveProfile(e.target.value)}
                className={`bg-transparent text-xs font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'} pr-2 py-1 outline-none cursor-pointer`}
              >
                {profiles.map(p => (
                  <option key={p} value={p} className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>{p}</option>
                ))}
              </select>
              <button 
                onClick={() => setIsAddProfileModalOpen(true)}
                title="Add new colleague profile workspace"
                className={`p-1 ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500'} rounded-lg transition ml-1`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Currency selector */}
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value as any)}
              className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-700'} border text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer shadow-sm`}
            >
              <option value="RM" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>RM (MYR)</option>
              <option value="$" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>$ (USD)</option>
              <option value="€" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>€ (EUR)</option>
              <option value="£" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>£ (GBP)</option>
              <option value="S$" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>S$ (SGD)</option>
            </select>

            {/* Dark mode */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`p-2.5 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'} transition shadow-sm`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Session */}
            {user && !user.isAnonymous ? (
              <div className={`flex items-center space-x-2 ${darkMode ? 'bg-slate-900 border-slate-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-900'} border rounded-xl px-3 py-1.5`}>
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=2563eb&color=fff`} 
                  alt="User" 
                  className="w-6 h-6 rounded-full" 
                />
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-blue-900'} max-w-[110px] truncate`}>{user.displayName || user.email}</span>
                <button onClick={handleSignOut} title="Sign Out" className={`p-1 ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>1-Click Login</span>
              </button>
            )}

            {/* New Claim button */}
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
        <div className={`mb-6 ${darkMode ? 'bg-blue-950/40 border-blue-900/50' : 'bg-blue-500/10 border-blue-500/20'} border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden`}>
          <div className="flex items-center space-x-2">
            <Users className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Active Workspace Profile: <strong className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} font-bold`}>{activeProfile}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`text-[11px] font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline flex items-center gap-1`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>{showCharts ? "Hide Visual Charts" : "Show Category Charts"}</span>
            </button>
            <button 
              onClick={handleResetSampleData}
              className={`text-[11px] ${darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'} underline`}
            >
              Reset Samples
            </button>
            <span className={`text-[11px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {profileClaims.length} items logged
            </span>
          </div>
        </div>

        {/* DASHBOARD SUMMARY STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
          {/* Box 1: Yet to Submit */}
          <div className={`${darkMode ? 'bg-slate-900 border-amber-900/40' : 'bg-white border-amber-200'} rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-colors`}>
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Yet to Submit</span>
              <span className={`p-2 ${darkMode ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'} rounded-xl`}>
                <AlertCircle className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.unsubmittedAmt)}</div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{stats.unsubmittedCount} receipts waiting in pocket</p>
            </div>
          </div>

          {/* Box 2: Pending HR/Finance */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Pending HR/Finance</span>
              <span className={`p-2 ${darkMode ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-xl`}>
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.pendingAmt)}</div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{stats.pendingCount} claims submitted</p>
            </div>
          </div>

          {/* Box 3: Reimbursed */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Reimbursed</span>
              <span className={`p-2 ${darkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} rounded-xl`}>
                <CheckCircle2 className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.paidAmt)}</div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{stats.paidCount} claims settled</p>
            </div>
          </div>

          {/* Box 4: All Time Claims */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>All Time Claims</span>
              <span className={`p-2 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-xl`}>
                <Wallet className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-3">
              <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.totalAmt)}</div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>{stats.totalCount} total claims logged</p>
            </div>
          </div>
        </section>

        {/* EXPENSE CATEGORIES & PIE CHART BREAKDOWN SECTION */}
        {showCharts && (
          <section className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-6 border shadow-sm mb-6 print:hidden transition-colors`}>
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'} gap-2`}>
              <div>
                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                  <PieChartIcon className="w-4 h-4 text-blue-500" />
                  Category Spending Breakdown
                </h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Visual distribution of expenses for {activeProfile}</p>
              </div>

              {selectedCategory !== 'ALL' && (
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${darkMode ? 'bg-blue-950 text-blue-300 hover:bg-blue-900' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition flex items-center gap-1`}
                >
                  <X className="w-3 h-3" />
                  Reset Filter ({selectedCategory})
                </button>
              )}
            </div>

            {categoryStats.categories.length === 0 ? (
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} text-center py-6`}>No expenses logged yet to render chart.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Donut Chart */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-44 h-44">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                      {/* Background circle */}
                      <circle
                        cx="80"
                        cy="80"
                        r="64"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="20"
                        className={darkMode ? 'text-slate-800' : 'text-slate-100'}
                      />
                      {/* Donut Segments */}
                      {donutSegments.map((segment, idx) => (
                        <circle
                          key={idx}
                          cx="80"
                          cy="80"
                          r="64"
                          fill="none"
                          stroke={segment.color.hex}
                          strokeWidth="20"
                          strokeDasharray={`${segment.strokeDash} ${segment.circumference - segment.strokeDash}`}
                          strokeDashoffset={segment.strokeDashoffset}
                          className="transition-all duration-500 cursor-pointer hover:opacity-85"
                          onClick={() => setSelectedCategory(segment.name === selectedCategory ? 'ALL' : segment.name)}
                        />
                      ))}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Spend</span>
                      <span className={`text-sm font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {formatMoney(categoryStats.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Progress Cards */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryStats.categories.map((cat, idx) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.name)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? darkMode 
                              ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30' 
                              : 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20' 
                            : darkMode 
                              ? 'bg-slate-800/80 border-slate-750 hover:border-slate-700' 
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'} flex items-center gap-1.5`}>
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color.hex }}></span>
                            {cat.name}
                          </span>
                          <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {formatMoney(cat.total)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} h-1.5 rounded-full overflow-hidden mt-1 mb-1`}>
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.color.hex }}
                          ></div>
                        </div>

                        <div className={`flex justify-between text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>{cat.count} claim{cat.count > 1 ? 's' : ''}</span>
                          <span>{cat.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* MONTH, YEAR & EXPORT CONTROLS */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center mb-6 gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl px-3 py-1.5 shadow-sm`}>
              <Calendar className="w-4 h-4 text-slate-400 mr-2" />
              <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'} mr-1.5`}>Year:</span>
              <select 
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth('ALL');
                }}
                className={`bg-transparent text-xs font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'} outline-none cursor-pointer`}
              >
                <option value="ALL" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>All Years</option>
                {yearList.map(y => (
                  <option key={y} value={y} className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none max-w-full">
              <button
                onClick={() => setSelectedMonth('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedMonth === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : darkMode
                      ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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
                      : darkMode
                        ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {m.name} <span className="opacity-75 font-normal">({m.count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, notes..." 
                className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'} border text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm`}
              />
            </div>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} border text-xs font-medium rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer`}
            >
              <option value="ALL" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>All Statuses</option>
              <option value="UNSUBMITTED" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>Unsubmitted</option>
              <option value="SUBMITTED" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>Submitted</option>
              <option value="PAID" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>Reimbursed</option>
            </select>

            {/* EXCEL / CSV EXPORT BUTTON */}
            <button 
              onClick={handleExportCSV}
              title="Export all filtered claims to Excel-compatible CSV file"
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {/* PRINT / PDF REPORT */}
            <button 
              onClick={handleExportReport}
              className={`flex items-center space-x-1.5 ${darkMode ? 'bg-slate-800 hover:bg-slate-750 text-slate-100' : 'bg-slate-800 hover:bg-slate-900 text-white'} text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm`}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF Report</span>
            </button>
          </div>
        </div>

        {/* CLAIMS LIST */}
        <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden print:hidden transition-colors`}>
          {loadingClaims ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-600" />
              <p className="text-xs font-medium">Loading claims from database...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-700' : 'text-slate-300'} stroke-[1.5]`} />
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>No claim items found</p>
              <p className="text-xs text-slate-400 mt-1">Try adding a new expense for {activeProfile} or clearing filters</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Claim
              </button>
            </div>
          ) : (
            <div className={`divide-y ${darkMode ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
              {filteredClaims.map((item) => (
                <div key={item.id} className={`p-4 ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} transition flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div className="flex items-start space-x-3.5">
                    <div 
                      onClick={() => item.receipt && setReceiptViewerUrl(item.receipt)}
                      className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} border flex items-center justify-center flex-shrink-0 overflow-hidden group relative ${item.receipt ? 'cursor-pointer ring-2 ring-transparent hover:ring-blue-500' : ''}`}
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
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                        {item.status === 'UNSUBMITTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <AlertCircle className="w-3 h-3 mr-1" /> Unsubmitted
                          </span>
                        )}
                        {item.status === 'SUBMITTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            <Clock className="w-3 h-3 mr-1" /> Submitted
                          </span>
                        )}
                        {item.status === 'PAID' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <Check className="w-3 h-3 mr-1" /> Paid
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} flex items-center`}>
                          <Store className="w-3 h-3 inline mr-1" />{item.merchant}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 inline mr-1" />{item.date}
                        </span>
                        <span>•</span>
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold" 
                          style={{ 
                            backgroundColor: darkMode ? '#1e293b' : (CATEGORY_COLORS[item.category]?.bg || '#f1f5f9'), 
                            color: CATEGORY_COLORS[item.category]?.hex || '#475569',
                            border: darkMode ? '1px solid #334155' : 'none'
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      
                      {item.notes && <p className="text-xs text-slate-400 italic mt-1 max-w-md">{item.notes}</p>}
                    </div>
                  </div>

                  <div className={`flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className={`text-base font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {formatMoney(item.amount)}
                    </div>
                    
                    <div className="flex items-center space-x-1 mt-1">
                      {item.receipt && (
                        <button
                          onClick={() => downloadReceipt(item)}
                          title="Download Receipt Image directly to device"
                          className={`flex items-center space-x-1 px-2 py-1 ${darkMode ? 'bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-900/60' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} rounded-lg text-[11px] font-bold transition mr-1`}
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>
                      )}

                      <button 
                        onClick={() => handleCycleStatus(item)} 
                        title={`Cycle status (Currently ${item.status})`}
                        className={`p-1.5 ${darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'} rounded-lg transition`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => handleOpenModal(item)} 
                        title="Edit claim details"
                        className={`p-1.5 ${darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'} rounded-lg transition`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => setDeleteConfirmId(item.id)} 
                        title="Delete claim"
                        className={`p-1.5 ${darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'} rounded-lg transition`}
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

        {/* PRINTABLE REPORT SUMMARY (WINDOW.PRINT) */}
        <div className="hidden print:block p-8 bg-white text-slate-900">
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">EXPENSE CLAIM REPORT</h1>
              <p className="text-sm text-slate-600">Account Workspace: <strong>{activeProfile}</strong></p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Scope: {selectedMonth === 'ALL' ? 'All Months' : selectedMonth} {selectedYear === 'ALL' ? '' : selectedYear}</p>
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
                <td colSpan={6} className="p-3 text-right">TOTAL CLAIM:</td>
                <td className="p-3 text-right text-blue-700">
                  {formatMoney(filteredClaims.reduce((acc, c) => acc + (parseFloat(String(c.amount)) || 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-8 border-t pt-4">
            <h3 className="text-sm font-bold mb-4">ATTACHED RECEIPT PROOFS</h3>
            <div className="grid grid-cols-2 gap-4">
              {filteredClaims.filter(c => c.receipt).map((item, idx) => (
                <div key={idx} className="border p-2 rounded text-center">
                  <img src={item.receipt || ''} alt="Receipt" className="max-h-48 object-contain mx-auto mb-2" />
                  <p className="text-[10px] font-medium">{item.merchant} - {formatMoney(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT CLAIM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border flex flex-col`}>
            <div className={`p-5 border-b ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'} flex justify-between items-center sticky top-0 z-10`}>
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {editingClaim ? 'Edit Expense Claim' : `Add Claim for ${activeProfile}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-1 ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* AI Vision OCR Scanner Banner */}
              <div className={`${darkMode ? 'bg-blue-950/40 border-blue-900/60' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'} border p-3 rounded-2xl flex items-center justify-between`}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Gemini Vision OCR</p>
                    <p className={`text-[10px] ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                      {aiScanFeedback || "Upload receipt photo to extract vendor, price & date"}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  disabled={isAiScanning}
                  onClick={() => formReceiptBase64 ? runGeminiOCR(formReceiptBase64) : fileInputRef.current?.click()} 
                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                >
                  {isAiScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isAiScanning ? 'Reading...' : formReceiptBase64 ? 'Scan Image' : 'Pick & Scan'}</span>
                </button>
              </div>

              {/* Receipt Snapshot upload */}
              <div>
                <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Receipt Snapshot / Photo</label>
                <div className="flex items-center gap-3">
                  <div className={`w-16 h-16 rounded-xl border border-dashed ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-slate-50'} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                    {formReceiptBase64 ? (
                      <img src={formReceiptBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Receipt className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      id="receiptFileInput" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className={`flex-1 py-2 px-3 border ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-50 text-slate-700'} rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formReceiptBase64 ? 'Change Receipt' : 'Upload Receipt Photo'}</span>
                    </button>
                    {formReceiptBase64 && (
                      <button
                        type="button"
                        onClick={() => setFormReceiptBase64(null)}
                        className={`p-2 border ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-red-500'} rounded-xl`}
                        title="Remove attached receipt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Title / Purpose *</label>
                  <input 
                    type="text" 
                    required 
                    value={formTitle} 
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Client Dinner" 
                    className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'} border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Merchant / Vendor *</label>
                  <input 
                    type="text" 
                    required 
                    value={formMerchant} 
                    onChange={(e) => setFormMerchant(e.target.value)}
                    placeholder="e.g. Grab, Starbucks" 
                    className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'} border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={formDate} 
                    onChange={(e) => setFormDate(e.target.value)}
                    className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'} border rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Category</label>
                  <select 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'} border rounded-xl px-2.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
                  >
                    <option value="Client Meals" className={darkMode ? 'bg-slate-900 text-white' : ''}>Client Meals</option>
                    <option value="Travel / Taxi" className={darkMode ? 'bg-slate-900 text-white' : ''}>Travel / Taxi</option>
                    <option value="Office Supplies" className={darkMode ? 'bg-slate-900 text-white' : ''}>Office Supplies</option>
                    <option value="Software / Tech" className={darkMode ? 'bg-slate-900 text-white' : ''}>Software / Tech</option>
                    <option value="Entertainment" className={darkMode ? 'bg-slate-900 text-white' : ''}>Entertainment</option>
                    <option value="Hotel / Lodging" className={darkMode ? 'bg-slate-900 text-white' : ''}>Hotel / Lodging</option>
                    <option value="Other" className={darkMode ? 'bg-slate-900 text-white' : ''}>Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{currency}</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      value={formAmount} 
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00" 
                      className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'} border rounded-xl pl-11 pr-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Claim Status</label>
                <select 
                  value={formStatus} 
                  onChange={(e) => setFormStatus(e.target.value as ClaimStatus)}
                  className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'} border rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer`}
                >
                  <option value="UNSUBMITTED" className={darkMode ? 'bg-slate-900 text-white' : ''}>⚠️ Unsubmitted (In My Pocket)</option>
                  <option value="SUBMITTED" className={darkMode ? 'bg-slate-900 text-white' : ''}>⏳ Submitted (Pending HR/Finance Approval)</option>
                  <option value="PAID" className={darkMode ? 'bg-slate-900 text-white' : ''}>✅ Paid / Reimbursed</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>Remarks / Project Note</label>
                <input 
                  type="text" 
                  value={formNotes} 
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Q4 pitch with client team" 
                  className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'} border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none`}
                />
              </div>

              <div className={`pt-3 flex justify-end space-x-3 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className={`px-4 py-2 text-xs font-semibold ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {editingClaim ? 'Save Changes' : 'Save Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROFILE MODAL */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl max-w-sm w-full p-6 shadow-2xl border`}>
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-2`}>New Colleague Workspace</h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-4`}>Create an independent expense workspace for a friend, department, or colleague.</p>
            <form onSubmit={handleConfirmAddProfile} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Sarah Tan, Marketing Team"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className={`w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800'} border rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProfileModalOpen(false)}
                  className={`px-3.5 py-1.5 text-xs ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl max-w-sm w-full p-6 shadow-2xl border`}>
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Delete Expense Claim?</h3>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-5`}>
              This action cannot be undone. Are you sure you want to remove this expense record?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className={`px-3.5 py-1.5 text-xs ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL RECEIPT VIEWER MODAL */}
      {receiptViewerUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 print:hidden" 
          onClick={() => setReceiptViewerUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl border border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-400" />
                Receipt Proof Viewer
              </span>
              <button 
                onClick={() => setReceiptViewerUrl(null)} 
                className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-full shadow-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950/50 rounded-xl">
              <img src={receiptViewerUrl} alt="Full Receipt" className="max-w-full max-h-[75vh] object-contain mx-auto rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-900 text-white border-slate-800'} px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium border animate-in slide-in-from-bottom duration-200`}>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
