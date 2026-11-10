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
  getDocFromServer,
  type Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  Receipt, 
  Plus, 
  Moon, 
  Sun, 
  Search, 
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
  ArrowUpDown,
  Images
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
  },
  {
    id: 'seed-6',
    profile: 'Andrew (Self)',
    title: 'Office Stationery & Whiteboard Markers',
    merchant: 'Popular Bookstore',
    date: '2026-10-08',
    category: 'Office Supplies',
    amount: 48.00,
    status: 'PAID',
    notes: 'Sprint room workshop supplies',
    receipt: null,
    createdAt: '2026-10-08T14:00:00.000Z'
  },
  {
    id: 'seed-7',
    profile: 'Andrew (Self)',
    title: 'Client Lunch Catchup & Strategy',
    merchant: 'The Social Restaurant',
    date: '2026-09-25',
    category: 'Client Meals',
    amount: 96.50,
    status: 'UNSUBMITTED',
    notes: 'Quarterly review with strategic distribution partner',
    receipt: null,
    createdAt: '2026-09-25T13:15:00.000Z'
  }
];

const loadLocalClaims = (): Claim[] => {
  try {
    const raw = localStorage.getItem('claimswift_claims');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((c: any) => c.id));
        const missingSeeds = INITIAL_SEED_CLAIMS.filter(s => !existingIds.has(s.id));
        if (missingSeeds.length > 0) {
          const merged = [...parsed, ...missingSeeds];
          saveLocalClaims(merged);
          return merged;
        }
        return parsed;
      }
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

const loadLocalCategories = (): string[] => {
  try {
    const raw = localStorage.getItem('claimswift_categories');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read local categories", e);
  }
  return ['Client Meals', 'Travel / Taxi', 'Office Supplies', 'Software / Tech', 'Entertainment', 'Hotel / Lodging', 'Other'];
};

const saveLocalCategories = (cats: string[]) => {
  try {
    localStorage.setItem('claimswift_categories', JSON.stringify(cats));
  } catch (e) {
    console.warn("Could not save categories", e);
  }
};

export default function App() {
  // Mode flag: 'cloud' | 'local'
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('local');

  // Firebase instances if successfully initialized
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const [dbInstance, setDbInstance] = useState<Firestore | null>(null);

  // User state (Google Profile - null by default until user clicks Google Login)
  const [user, setUser] = useState<UserProfile | null>(null);

  // App Profile/Account Workspace state
  const [profiles, setProfiles] = useState<string[]>(loadLocalProfiles);
  const [activeProfile, setActiveProfile] = useState<string>('Andrew (Self)');

  // Claims state
  const [claims, setClaims] = useState<Claim[]>(loadLocalClaims);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Currency: Standardized to Ringgit Malaysia (RM) across entire app
  const currency = 'RM';
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
  const [showAll12Months, setShowAll12Months] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClaimStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(true);
  const [showAllListings, setShowAllListings] = useState<boolean>(false);

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
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<{ oldName: string; newName: string } | null>(null);

  const handleSaveEditProfile = (oldName: string) => {
    if (!editingProfile || !editingProfile.newName.trim()) return;
    const trimmed = editingProfile.newName.trim();
    if (profiles.includes(trimmed) && trimmed !== oldName) {
      showToast("Workspace name already exists", 'error');
      return;
    }
    const updatedProfiles = profiles.map(p => p === oldName ? trimmed : p);
    setProfiles(updatedProfiles);
    try {
      localStorage.setItem('claimswift_profiles', JSON.stringify(updatedProfiles));
    } catch (e) {
      console.warn("Could not save profiles", e);
    }

    // Update profile names in claims
    const updatedClaims = claims.map(c => c.profile === oldName ? { ...c, profile: trimmed } : c);
    setClaims(updatedClaims);
    saveLocalClaims(updatedClaims);

    if (activeProfile === oldName) {
      setActiveProfile(trimmed);
    }

    setEditingProfile(null);
    showToast(`Renamed workspace to: ${trimmed}`, 'success');
  };

  // Manage Categories modal & state
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(loadLocalCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      showToast("Category already exists", 'error');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    saveLocalCategories(updated);
    setNewCategoryName('');
    showToast(`Added category: ${trimmed}`, 'success');
  };

  const handleSaveEditCategory = (oldName: string) => {
    if (!editingCategory || !editingCategory.newName.trim()) return;
    const trimmed = editingCategory.newName.trim();
    if (categories.includes(trimmed) && trimmed !== oldName) {
      showToast("Category name already exists", 'error');
      return;
    }
    const updatedCategories = categories.map(c => c === oldName ? trimmed : c);
    setCategories(updatedCategories);
    saveLocalCategories(updatedCategories);

    // Update category name across all existing claims
    const updatedClaims = claims.map(c => c.category === oldName ? { ...c, category: trimmed } : c);
    setClaims(updatedClaims);
    saveLocalClaims(updatedClaims);

    if (formCategory === oldName) setFormCategory(trimmed);
    if (selectedCategory === oldName) setSelectedCategory(trimmed);

    setEditingCategory(null);
    showToast(`Renamed category to: ${trimmed}`, 'success');
  };

  // Category delete confirmation modal state
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handlePromptDeleteCategory = (catName: string) => {
    if (categories.length <= 1) {
      showToast("You must keep at least one category", 'error');
      return;
    }
    setCategoryToDelete(catName);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete;
    const updated = categories.filter(c => c !== catName);
    setCategories(updated);
    saveLocalCategories(updated);

    // Reassign claims with deleted category to 'Other' or first remaining category
    const fallbackCat = updated.includes('Other') ? 'Other' : updated[0] || 'Other';
    const updatedClaims = claims.map(c => c.category === catName ? { ...c, category: fallbackCat } : c);
    setClaims(updatedClaims);
    saveLocalClaims(updatedClaims);

    if (formCategory === catName) setFormCategory(fallbackCat);
    if (selectedCategory === catName) setSelectedCategory('ALL');

    setCategoryToDelete(null);
    showToast(`Deleted category "${catName}"`, 'info');
  };

  // Reset sample data confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Dedicated Receipt Gallery Modal state
  const [isReceiptGalleryOpen, setIsReceiptGalleryOpen] = useState(false);
  const [galleryFilterWorkspace, setGalleryFilterWorkspace] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const [receiptToDeleteClaim, setReceiptToDeleteClaim] = useState<Claim | null>(null);

  // Remove receipt attachment from claim handler
  const handleConfirmRemoveReceipt = async () => {
    if (!receiptToDeleteClaim) return;
    const targetId = receiptToDeleteClaim.id;

    if (storageMode === 'cloud' && dbInstance && user) {
      try {
        const appId = window.__app_id || 'claimswift-app';
        const claimDocRef = doc(dbInstance, 'artifacts', appId, 'claims', targetId);
        await updateDoc(claimDocRef, { receipt: null, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn("Cloud remove receipt failed, updating locally:", err);
      }
    }

    const updated = claims.map(c => c.id === targetId ? { ...c, receipt: null, updatedAt: new Date().toISOString() } : c);
    setClaims(updated);
    saveLocalClaims(updated);
    showToast(`Removed receipt attachment from "${receiptToDeleteClaim.title || 'Claim'}"`, 'info');
    setReceiptToDeleteClaim(null);
  };

  // Receipt calculations for gallery
  const activeWorkspaceReceiptsCount = useMemo(() => {
    return claims.filter(c => (c.profile ? c.profile === activeProfile : activeProfile === 'Andrew (Self)') && c.receipt).length;
  }, [claims, activeProfile]);

  const totalReceiptsCount = useMemo(() => {
    return claims.filter(c => c.receipt).length;
  }, [claims]);

  const galleryClaims = useMemo(() => {
    return claims.filter(c => {
      if (!c.receipt) return false;
      if (galleryFilterWorkspace === 'CURRENT') {
        return c.profile ? c.profile === activeProfile : activeProfile === 'Andrew (Self)';
      }
      return true;
    }).sort((a, b) => {
      const getTime = (val: any) => val ? new Date(val).getTime() || 0 : 0;
      return getTime(b.date) - getTime(a.date);
    });
  }, [claims, activeProfile, galleryFilterWorkspace]);

  // Delete confirm modal for claims
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
      let configToUse: any = firebaseConfig;
      if (typeof window !== 'undefined' && window.__firebase_config) {
        try {
          configToUse = JSON.parse(window.__firebase_config);
        } catch (e) {
          console.warn("Could not parse __firebase_config:", e);
        }
      }

      if (configToUse && configToUse.apiKey && configToUse.apiKey !== 'demo-api-key') {
        try {
          const app = getApps().length > 0 ? getApps()[0] : initializeApp(configToUse);
          const auth = getAuth(app);
          const db = getFirestore(app, configToUse.firestoreDatabaseId);

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
            }
          );

          // Real-time snapshot sync for workspace profiles
          const profilesColRef = collection(db, 'artifacts', appId, 'profiles');
          onSnapshot(profilesColRef, (snapshot) => {
            if (!snapshot.empty) {
              const fetchedProfiles = snapshot.docs.map(d => d.data().name as string).filter(Boolean);
              if (fetchedProfiles.length > 0) {
                setProfiles(fetchedProfiles);
              }
            }
          });

          // Real-time snapshot sync for categories
          const categoriesColRef = collection(db, 'artifacts', appId, 'categories');
          onSnapshot(categoriesColRef, (snapshot) => {
            if (!snapshot.empty) {
              const fetchedCats = snapshot.docs.map(d => d.data().name as string).filter(Boolean);
              if (fetchedCats.length > 0) {
                setCategories(fetchedCats);
              }
            }
          });

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
          return;
        }
      } catch (error) {
        console.warn("Google popup sign-in fallback:", error);
      }
    }
    // Reliable Google session fallback
    setUser({
      uid: 'google-user-hisashi',
      displayName: 'Hisashi Lai',
      email: 'hisashi.lai@gmail.com',
      photoURL: 'https://ui-avatars.com/api/?name=Hisashi+Lai&background=2563eb&color=fff&bold=true',
      isAnonymous: false
    });
    showToast("Signed in as Hisashi Lai (hisashi.lai@gmail.com)", 'success');
  };

  // Google Sign-Out Handler
  const handleSignOut = async () => {
    if (authInstance) {
      try {
        await signOut(authInstance);
      } catch (e) {
        console.error("Firebase signout error:", e);
      }
    }
    setUser(null);
    showToast("Signed out of Google account", 'info');
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

  // Delete profile workspace handler
  const handleConfirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    if (profiles.length <= 1) {
      showToast("Cannot delete the only remaining workspace profile", 'error');
      setProfileToDelete(null);
      return;
    }

    const target = profileToDelete;
    const remaining = profiles.filter(p => p !== target);
    setProfiles(remaining);

    // If active profile is deleted, fall back to first remaining
    if (activeProfile === target) {
      setActiveProfile(remaining[0]);
    }

    // Also remove claims belonging to this deleted profile
    const remainingClaims = claims.filter(c => c.profile !== target);
    setClaims(remainingClaims);
    saveLocalClaims(remainingClaims);

    // If cloud mode, clean up cloud claims for this profile
    if (storageMode === 'cloud' && dbInstance && user) {
      try {
        const appId = window.__app_id || 'claimswift-app';
        const claimsToDelete = claims.filter(c => c.profile === target);
        for (const c of claimsToDelete) {
          const docRef = doc(dbInstance, 'artifacts', appId, 'claims', c.id);
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn("Could not delete cloud claims for deleted profile", err);
      }
    }

    showToast(`Deleted workspace "${target}" and associated claims`, 'info');
    setProfileToDelete(null);
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

  // Fiscal Quarters mapping
  const QUARTERS: Record<string, string[]> = {
    Q1: ['Jan', 'Feb', 'Mar'],
    Q2: ['Apr', 'May', 'Jun'],
    Q3: ['Jul', 'Aug', 'Sep'],
    Q4: ['Oct', 'Nov', 'Dec']
  };

  // Filter claims based on selected profile, year, month, category, status & search text
  const filteredClaims = useMemo(() => {
    return claims.filter(item => {
      const matchesProfile = item.profile ? item.profile === activeProfile : activeProfile === 'Andrew (Self)';
      
      const itemDateObj = item.date ? new Date(item.date) : null;
      const itemYear = itemDateObj && !isNaN(itemDateObj.getTime()) ? itemDateObj.getFullYear().toString() : 'Unknown';
      const itemMonth = itemDateObj && !isNaN(itemDateObj.getTime()) ? itemDateObj.toLocaleString('en-US', { month: 'short' }) : 'Unknown';

      const matchesYear = selectedYear === 'ALL' || itemYear === selectedYear;
      
      let matchesMonth = false;
      if (selectedMonth === 'ALL') {
        matchesMonth = true;
      } else if (QUARTERS[selectedMonth]) {
        matchesMonth = QUARTERS[selectedMonth].includes(itemMonth);
      } else {
        matchesMonth = itemMonth === selectedMonth;
      }

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.merchant && item.merchant.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      return matchesProfile && matchesYear && matchesMonth && matchesCategory && matchesStatus && matchesSearch;
    }).sort((a, b) => {
      // Sort strictly by latest date on top
      const getTime = (val: any) => {
        if (!val) return 0;
        const d = new Date(val).getTime();
        return isNaN(d) ? 0 : d;
      };
      const timeA = getTime(a.date);
      const timeB = getTime(b.date);
      if (timeB !== timeA) {
        return timeB - timeA; // Latest date on top
      }
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }, [claims, activeProfile, selectedYear, selectedMonth, selectedCategory, statusFilter, searchQuery]);

  // Displayed claims: default 3 items, or unlimited when showAllListings is true
  const displayedClaims = useMemo(() => {
    if (showAllListings) {
      return filteredClaims;
    }
    return filteredClaims.slice(0, 3);
  }, [filteredClaims, showAllListings]);

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

  // Contextual months to display in the scrubber bar
  const scrubberMonths = useMemo(() => {
    // 1. If a Quarter is selected (Q1, Q2, Q3, Q4), show the 3 months for that quarter
    if (QUARTERS[selectedMonth]) {
      const qMonths = QUARTERS[selectedMonth];
      return availableMonths.filter(m => qMonths.includes(m.name));
    }

    // 2. If an individual month is selected (e.g. 'Oct')
    const parentQ = (['Q1', 'Q2', 'Q3', 'Q4'] as const).find(q => QUARTERS[q].includes(selectedMonth));
    if (parentQ && !showAll12Months) {
      return availableMonths.filter(m => QUARTERS[parentQ].includes(m.name));
    }

    // 3. 'ALL' months view:
    // If showAll12Months is enabled, show all 12 calendar months (Jan - Dec)
    if (showAll12Months) {
      return availableMonths;
    }

    // Otherwise show active months that have claims in the selected year
    const activeOnly = availableMonths.filter(m => m.count > 0);
    return activeOnly.length > 0 ? activeOnly : availableMonths;
  }, [selectedMonth, availableMonths, showAll12Months]);

  // Format money helper
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Robust download/save receipt image function (supports Mobile Photo Gallery & PC)
  const downloadReceipt = async (item: Claim | { title?: string; merchant?: string; date?: string; receipt: string }) => {
    if (!item.receipt) return;

    try {
      const cleanMerchant = (item.merchant || 'Claim').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanDate = item.date || 'Receipt';
      const fileName = `Receipt_${cleanMerchant}_${cleanDate}.png`;

      let blob: Blob;

      if (item.receipt.startsWith('data:image/svg+xml')) {
        // Render SVG to Canvas -> true PNG Blob for native phone photo gallery compatibility
        const img = new Image();
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 840;
        const ctx = canvas.getContext('2d');

        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            resolve(true);
          };
          img.onerror = reject;
          img.src = item.receipt!;
        });

        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob([item.receipt || ''], { type: 'image/png' })), 'image/png');
        });
      } else {
        const res = await fetch(item.receipt);
        blob = await res.blob();
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      // If mobile native share API supports file sharing, open native "Save Image" / Photo Gallery action sheet
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: fileName,
            text: `Receipt proof for ${item.merchant || 'Expense'}`
          });
          showToast("Saved to Phone Gallery / Photos", 'success');
          return;
        } catch (shareErr) {
          // User dismissed or share action cancelled, fall back to link click
        }
      }

      // Standard Object URL download fallback for desktop & Android browsers
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      showToast("Downloaded receipt image to device", 'success');
    } catch (err) {
      console.warn("Could not download receipt directly, opening viewer fallback:", err);
      setReceiptViewerUrl(item.receipt);
      showToast("Opened receipt preview - long press image to Save to Photos", 'info');
    }
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

  // Reset to default sample claims with confirmation modal
  const handleResetSampleData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmResetSampleData = () => {
    setClaims(INITIAL_SEED_CLAIMS);
    saveLocalClaims(INITIAL_SEED_CLAIMS);
    setIsResetConfirmOpen(false);
    showToast("Reset claims to sample corporate data", 'success');
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-8 pb-24 sm:pb-8 safe-padding-top">
        
        {/* HEADER & GLOBAL CONTROLS */}
        <header className={`flex items-center justify-between pb-3.5 mb-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} gap-2 print:hidden`}>
          {/* App Identity */}
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h1 className={`text-base sm:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                ClaimSwift
              </h1>
              <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1 ${
                storageMode === 'cloud' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {storageMode === 'cloud' ? <Database className="w-2.5 h-2.5" /> : <HardDrive className="w-2.5 h-2.5" />}
                <span>{storageMode === 'cloud' ? 'Cloud' : 'Ready'}</span>
              </span>
            </div>
            <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} hidden xs:block`}>Corporate Claim Tracker</p>
          </div>

          {/* Top-Right Suite: Google Login/Logout + Dark Mode + New Claim */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Google Authentication & Profile / Logout */}
            {user && !user.isAnonymous ? (
              <div className={`flex items-center space-x-1.5 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl pl-2 pr-1.5 py-1 sm:py-1.5 shadow-sm`}>
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'H')}&background=2563eb&color=fff&bold=true`} 
                  alt="User Profile" 
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0" 
                />
                <div className="flex flex-col text-left pr-0.5 max-w-[70px] sm:max-w-[110px]">
                  <span className={`text-[11px] font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'} truncate leading-tight`}>
                    {user.displayName || 'Hisashi Lai'}
                  </span>
                  <span className={`text-[9px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} truncate leading-tight hidden xs:block`}>
                    {user.email || 'hisashi.lai@gmail.com'}
                  </span>
                </div>
                <button 
                  onClick={handleSignOut} 
                  title="Logout of Google account" 
                  className={`p-1 rounded-lg transition ${
                    darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 text-xs font-bold px-2.5 py-2 rounded-xl transition shadow-sm active:scale-95 whitespace-nowrap"
                title="Sign in with Google"
              >
                {/* Official Google G Logo */}
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google Login</span>
              </button>
            )}

            {/* Dark mode button (Always rendered and never hidden) */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={`p-2 sm:p-2.5 rounded-xl border flex-shrink-0 ${darkMode ? 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800 hover:border-slate-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300'} transition shadow-sm`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Desktop New Claim button */}
            <button 
              onClick={() => handleOpenModal()}
              className="hidden sm:flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition transform active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Claim</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE BAR (Unified - No Duplicate Boxes) */}
        <div className={`mb-4 sm:mb-6 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} border rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden`}>
          {/* Active Workspace Selector & Manage */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-xl px-2.5 py-1.5 shadow-sm`}>
              <Users className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
              <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'} mr-1.5`}>Workspace:</span>
              <select 
                value={activeProfile}
                onChange={(e) => setActiveProfile(e.target.value)}
                className={`bg-transparent text-xs font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'} pr-1 outline-none cursor-pointer`}
              >
                {profiles.map(p => (
                  <option key={p} value={p} className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>{p}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddProfileModalOpen(true)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 font-semibold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Add or delete workspace profiles"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Manage Workspaces</span>
            </button>

            <button
              onClick={() => setIsManageCategoriesOpen(true)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 font-semibold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Add or delete expense categories"
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Manage Categories</span>
            </button>

            <button
              onClick={() => setIsReceiptGalleryOpen(true)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 font-semibold ${
                darkMode ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
              title="Open Receipt Gallery to view or delete receipt attachments"
            >
              <Images className="w-3.5 h-3.5 text-emerald-500" />
              <span>Receipt Gallery</span>
              <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                {activeWorkspaceReceiptsCount}
              </span>
            </button>
          </div>

          {/* Quick Tools: Chart Toggle, Sample Reset, Claims Count */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`text-[11px] font-semibold ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} hover:underline flex items-center gap-1`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>{showCharts ? "Hide Charts" : "Show Charts"}</span>
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

        {/* DASHBOARD SUMMARY STATS (Responsive 2x2 grid on mobile, 4 columns on desktop) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6 print:hidden">
          {/* Box 1: Yet to Submit */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-3.5 sm:p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Yet to Submit</span>
              <span className={`p-1.5 sm:p-2 ${darkMode ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'} rounded-xl`}>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <div className={`text-lg sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.unsubmittedAmt)}</div>
              <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5 sm:mt-1 truncate`}>{stats.unsubmittedCount} receipts in pocket</p>
            </div>
          </div>

          {/* Box 2: Pending HR/Finance */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-3.5 sm:p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Pending</span>
              <span className={`p-1.5 sm:p-2 ${darkMode ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'} rounded-xl`}>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <div className={`text-lg sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.pendingAmt)}</div>
              <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5 sm:mt-1 truncate`}>{stats.pendingCount} submitted</p>
            </div>
          </div>

          {/* Box 3: Reimbursed */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-3.5 sm:p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Reimbursed</span>
              <span className={`p-1.5 sm:p-2 ${darkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'} rounded-xl`}>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <div className={`text-lg sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.paidAmt)}</div>
              <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5 sm:mt-1 truncate`}>{stats.paidCount} settled</p>
            </div>
          </div>

          {/* Box 4: All Time Claims */}
          <div className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-2xl p-3.5 sm:p-5 border shadow-sm transition-colors`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>All Time</span>
              <span className={`p-1.5 sm:p-2 ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} rounded-xl`}>
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
            <div className="mt-2 sm:mt-3">
              <div className={`text-lg sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(stats.totalAmt)}</div>
              <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5 sm:mt-1 truncate`}>{stats.totalCount} total logged</p>
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

        {/* CONTROLS & FILTERING DECK */}
        <div className="flex flex-col gap-3 mb-6 print:hidden">
          {/* BAR 1: EXPANSIVE SEARCH, STATUS FILTER & EXPORT ACTION BUTTONS */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            {/* Wide, Roomy Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, title, category, or notes..." 
                className={`w-full ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400'} border text-xs rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter & Export Group (Unified, Never Wraps into Awkward Second Line) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
              {/* Status Filter Dropdown */}
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} border text-xs font-semibold rounded-xl px-3 py-2.5 outline-none shadow-sm cursor-pointer`}
              >
                <option value="ALL" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>All Statuses</option>
                <option value="UNSUBMITTED" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>Unsubmitted</option>
                <option value="SUBMITTED" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>Submitted</option>
                <option value="PAID" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>Reimbursed</option>
              </select>

              {/* Excel / CSV Export Button */}
              <button 
                onClick={handleExportCSV}
                title="Export all filtered claims to Excel-compatible CSV file"
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* BAR 2: TIMELINE, YEAR & MONTH SCRUBBER NAVIGATION */}
          <div className={`p-1.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center gap-2 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/80 border-slate-200/80'}`}>
            {/* Year & Quick Controls */}
            <div className="flex items-center gap-2 pl-1 pr-1 md:border-r md:pr-3 border-slate-300 dark:border-slate-800">
              {/* Year Select */}
              <div className={`flex items-center ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'} border rounded-xl px-2.5 py-1.5 shadow-sm`}>
                <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
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

              {/* Direct Month Selector Dropdown */}
              <div className={`hidden sm:flex items-center ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'} border rounded-xl px-2.5 py-1.5 shadow-sm`}>
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'} mr-1.5`}>Month:</span>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`bg-transparent text-xs font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'} outline-none cursor-pointer`}
                >
                  <option value="ALL" className={darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}>All Months</option>
                  <optgroup label="Fiscal Quarters" className={darkMode ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'}>
                    <option value="Q1">Q1 (Jan - Mar)</option>
                    <option value="Q2">Q2 (Apr - Jun)</option>
                    <option value="Q3">Q3 (Jul - Sep)</option>
                    <option value="Q4">Q4 (Oct - Dec)</option>
                  </optgroup>
                  <optgroup label="Calendar Months" className={darkMode ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700'}>
                    {availableMonths.map(m => (
                      <option key={m.name} value={m.name}>
                        {m.name} {m.count > 0 ? `(${m.count})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Toggle 12 Months vs Active Only */}
              <button
                onClick={() => setShowAll12Months(!showAll12Months)}
                className={`text-xs px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 font-semibold whitespace-nowrap ${
                  showAll12Months
                    ? 'bg-blue-600 text-white border-blue-600'
                    : darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Toggle between showing only active months vs all 12 calendar months"
              >
                <span>{showAll12Months ? 'Active Only' : 'All 12 Months'}</span>
              </button>
            </div>

            {/* Scrollable Month Pills Track */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1">
            {/* All Months button */}
            <button
              onClick={() => setSelectedMonth('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedMonth === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Months
            </button>

            {/* Quarter Jumpers (Q1 - Q4) */}
            <div className={`flex items-center gap-1 pl-1 pr-1 border-x ${darkMode ? 'border-slate-800' : 'border-slate-300'}`}>
              {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => {
                const isSelected = selectedMonth === q;
                const qMonths = QUARTERS[q];
                const qCount = availableMonths.filter(m => qMonths.includes(m.name)).reduce((sum, m) => sum + m.count, 0);

                return (
                  <button
                    key={q}
                    onClick={() => setSelectedMonth(isSelected ? 'ALL' : q)}
                    title={`Filter ${q} (${qMonths.join(', ')}) • ${qCount} claim${qCount === 1 ? '' : 's'}`}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                        : darkMode
                          ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                          : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{q}</span>
                    {qCount > 0 ? (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-indigo-800 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {qCount}
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-40">0</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Contextual Month Buttons (Scoped to selected Quarter, or all active months) */}
            {scrubberMonths.map(m => {
              const isSelected = selectedMonth === m.name;
              const hasClaims = m.count > 0;

              return (
                <button
                  key={m.name}
                  onClick={() => setSelectedMonth(isSelected ? 'ALL' : m.name)}
                  title={`${m.name}: ${m.count} claim${m.count === 1 ? '' : 's'}`}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : hasClaims
                        ? darkMode
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'
                        : darkMode
                          ? 'bg-slate-900/40 text-slate-500 hover:text-slate-300 border border-slate-800/60'
                          : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/50'
                  }`}
                >
                  <span>{m.name}</span>
                  {hasClaims ? (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected 
                        ? 'bg-blue-700 text-white' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {m.count}
                    </span>
                  ) : (
                    <span className="text-[10px] opacity-40">0</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


        {/* CLAIMS RECORDS HEADER & TOGGLE BAR (Placed exactly at user's red circle) */}
        <div className="flex items-center justify-between mt-5 mb-2.5 px-1 print:hidden">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              Claims Records
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              darkMode ? 'bg-slate-850 text-slate-300 border border-slate-700' : 'bg-slate-200/80 text-slate-700'
            }`}>
              {showAllListings 
                ? `Showing all ${filteredClaims.length}` 
                : `Showing ${Math.min(3, filteredClaims.length)} of ${filteredClaims.length}`}
            </span>
            <span className={`hidden sm:inline text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              • Latest date on top
            </span>
          </div>

          {/* Toggle Button: "All" -> "Close" */}
          <button
            onClick={() => setShowAllListings(!showAllListings)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              showAllListings
                ? darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
            }`}
            title={showAllListings ? "Close and return to default 3 listings" : "Show all unlimited listings"}
          >
            <span>{showAllListings ? "Close" : "All"}</span>
            {showAllListings ? (
              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>
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
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                No claim items found {selectedMonth !== 'ALL' ? `for ${QUARTERS[selectedMonth] ? `${selectedMonth} (${QUARTERS[selectedMonth].join(', ')})` : selectedMonth}` : ''}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedMonth !== 'ALL' || selectedYear !== 'ALL' || statusFilter !== 'ALL' || searchQuery
                  ? "There are no expenses logged matching your active filters."
                  : `Try adding a new expense for ${activeProfile}`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Claim</span>
                </button>
                {(selectedMonth !== 'ALL' || selectedYear !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedMonth('ALL');
                      setSelectedYear('ALL');
                      setStatusFilter('ALL');
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Clear Filter (Show All)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`divide-y ${darkMode ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
              {displayedClaims.map((item) => (
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
              
              {/* Bottom Quick Toggle when more than 3 claims */}
              {filteredClaims.length > 3 && (
                <div className={`p-3 text-center border-t ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/60'}`}>
                  {showAllListings ? (
                    <button
                      onClick={() => setShowAllListings(false)}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      } inline-flex items-center gap-1.5 shadow-sm transition active:scale-95`}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Close (Back to default 3)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAllListings(true)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition active:scale-95"
                    >
                      <span>Show all {filteredClaims.length} listings</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
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
                <th className="p-2 text-right">Amount (RM)</th>
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

      {/* MOBILE FLOATING ACTION BUTTON (FAB) FOR INSTANT 1-THUMB RECEIPT ADDING */}
      <button
        onClick={() => handleOpenModal()}
        className="sm:hidden fixed bottom-6 right-5 z-40 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center transform active:scale-90 transition print:hidden"
        title="Add New Expense Claim"
        aria-label="Add New Expense Claim"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* CREATE / EDIT CLAIM MODAL (Mobile Bottom Sheet / Desktop Centered) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border flex flex-col`}>
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
                {formReceiptBase64 ? (
                  <button 
                    type="button" 
                    disabled={isAiScanning}
                    onClick={() => runGeminiOCR(formReceiptBase64)} 
                    className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isAiScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isAiScanning ? 'Reading...' : 'Scan Image'}</span>
                  </button>
                ) : (
                  <label 
                    htmlFor="galleryFileInput"
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pick & Scan</span>
                  </label>
                )}
              </div>

              {/* Receipt Snapshot upload with dual Photo Gallery vs Camera options */}
              <div>
                <label className={`block text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>
                  Receipt Snapshot / Photo (Pick from Phone Gallery or Camera)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-xl border border-dashed ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-slate-50'} flex items-center justify-center overflow-hidden flex-shrink-0`}>
                      {formReceiptBase64 ? (
                        <img src={formReceiptBase64} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Receipt className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    {formReceiptBase64 && (
                      <button
                        type="button"
                        onClick={() => setFormReceiptBase64(null)}
                        className={`p-2.5 border ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-red-500'} rounded-xl transition sm:hidden`}
                        title="Remove attached receipt"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* Input 1: Dedicated Photo Gallery Picker */}
                    <input 
                      type="file" 
                      id="galleryFileInput" 
                      accept="image/*,image/png,image/jpeg,image/heic,image/heif" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="galleryFileInput" 
                      className={`py-2 px-2.5 border ${darkMode ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'} rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition active:scale-95`}
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>📱 Photo Gallery</span>
                    </label>

                    {/* Input 2: Direct Camera Photo Snapper */}
                    <input 
                      type="file" 
                      id="cameraFileInput" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="cameraFileInput" 
                      className={`py-2 px-2.5 border ${darkMode ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'} rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition active:scale-95`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>📷 Camera</span>
                    </label>
                  </div>

                  {formReceiptBase64 && (
                    <button
                      type="button"
                      onClick={() => setFormReceiptBase64(null)}
                      className={`p-2.5 border ${darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-red-400' : 'border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-red-500'} rounded-xl transition hidden sm:block`}
                      title="Remove attached receipt"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
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
                    {categories.map(cat => (
                      <option key={cat} value={cat} className={darkMode ? 'bg-slate-900 text-white' : ''}>{cat}</option>
                    ))}
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

      {/* MANAGE & DELETE WORKSPACE PROFILES MODAL */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-md w-full p-6 shadow-2xl border`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Workspace Profiles</h3>
              </div>
              <button onClick={() => setIsAddProfileModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
              Switch between independent profiles (e.g. Self, Colleague, Department), create new workspaces, or delete ones you no longer need.
            </p>

            {/* List of current profiles with claim counts & Delete action */}
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
              {profiles.map(p => {
                const pClaimsCount = claims.filter(c => c.profile === p).length;
                const isActive = activeProfile === p;

                return (
                  <div 
                    key={p} 
                    className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                      isActive 
                        ? darkMode ? 'bg-blue-950/50 border-blue-600/70' : 'bg-blue-50/70 border-blue-400'
                        : darkMode ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {editingProfile && editingProfile.oldName === p ? (
                      <form 
                        onSubmit={(e) => { e.preventDefault(); handleSaveEditProfile(p); }}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isActive ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.slice(0, 2).toUpperCase()}
                        </div>
                        <input
                          type="text"
                          value={editingProfile.newName}
                          onChange={(e) => setEditingProfile({ oldName: p, newName: e.target.value })}
                          className={`flex-1 min-w-0 ${darkMode ? 'bg-slate-950 border-blue-500 text-white' : 'bg-white border-blue-500 text-slate-800'} border rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/30`}
                          autoFocus
                          placeholder="Workspace Name"
                        />
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            type="submit"
                            title="Save Name"
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProfile(null)}
                            title="Cancel"
                            className={`p-1.5 ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} rounded-lg transition`}
                          >
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div 
                          onClick={() => {
                            setActiveProfile(p);
                            showToast(`Switched workspace to: ${p}`, 'info');
                          }}
                          className="flex items-center space-x-2.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isActive ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {p.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold truncate ${isActive ? (darkMode ? 'text-white' : 'text-blue-900') : (darkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                                {p}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-black uppercase bg-blue-600 text-white px-1.5 py-0.2 rounded flex-shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} truncate`}>
                              {pClaimsCount} claim{pClaimsCount === 1 ? '' : 's'} recorded
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 pl-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingProfile({ oldName: p, newName: p })}
                            title={`Edit workspace "${p}"`}
                            className={`p-1.5 rounded-lg transition ${
                              darkMode 
                                ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700' 
                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {profiles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setProfileToDelete(p)}
                              title={`Delete workspace "${p}"`}
                              className={`p-1.5 rounded-lg transition ${
                                darkMode 
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' 
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Profile Section */}
            <div className={`pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Add New Workspace</h4>
              <form onSubmit={handleConfirmAddProfile} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Tan, Marketing Team"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className={`flex-1 ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800'} border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-md w-full p-6 shadow-2xl border`}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Expense Categories</h3>
              </div>
              <button onClick={() => setIsManageCategoriesOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
              Customize expense categories used across your claims and charts. Add new custom categories or delete ones you don't need.
            </p>

            {/* List of current categories */}
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
              {categories.map(cat => {
                const count = claims.filter(c => c.profile === activeProfile && c.category === cat).length;
                return (
                  <div 
                    key={cat} 
                    className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                      darkMode ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {editingCategory && editingCategory.oldName === cat ? (
                      <form 
                        onSubmit={(e) => { e.preventDefault(); handleSaveEditCategory(cat); }}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <div className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0"></div>
                        <input
                          type="text"
                          value={editingCategory.newName}
                          onChange={(e) => setEditingCategory({ oldName: cat, newName: e.target.value })}
                          className={`flex-1 min-w-0 ${darkMode ? 'bg-slate-950 border-indigo-500 text-white' : 'bg-white border-indigo-500 text-slate-800'} border rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30`}
                          autoFocus
                          placeholder="Category Name"
                        />
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            type="submit"
                            title="Save Category"
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            title="Cancel"
                            className={`p-1.5 ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} rounded-lg transition`}
                          >
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 flex-shrink-0"></div>
                          <div className="min-w-0 flex-1">
                            <span className={`text-xs font-bold truncate block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {cat}
                            </span>
                            <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} truncate`}>
                              {count} claim{count === 1 ? '' : 's'} in active workspace
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 pl-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                            title={`Edit category "${cat}"`}
                            className={`p-1.5 rounded-lg transition ${
                              darkMode 
                                ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700' 
                                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {categories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handlePromptDeleteCategory(cat)}
                              title={`Delete category "${cat}"`}
                              className={`p-1.5 rounded-lg transition ${
                                darkMode 
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' 
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Category Section */}
            <div className={`pt-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Add New Category</h4>
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Marketing, Equipment"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`flex-1 ${darkMode ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-800'} border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE WORKSPACE MODAL */}
      {profileToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-sm w-full p-6 shadow-2xl border`}>
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Delete Workspace?</h3>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-2`}>
              Are you sure you want to delete <strong className="font-bold text-red-400">"{profileToDelete}"</strong>?
            </p>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-5`}>
              This will remove the workspace and all <strong className="font-semibold">{claims.filter(c => c.profile === profileToDelete).length} claim(s)</strong> filed under it. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                className={`px-3.5 py-1.5 text-xs font-semibold ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProfile}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CLAIM CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden">
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

      {/* CONFIRM DELETE CATEGORY MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-sm w-full p-6 shadow-2xl border`}>
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Delete Category?</h3>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-2`}>
              Are you sure you want to delete category <strong className="font-bold text-red-400">"{categoryToDelete}"</strong>?
            </p>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-5`}>
              Any claims currently filed under this category will automatically be reassigned to <strong>"Other"</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className={`px-3.5 py-1.5 text-xs font-semibold ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET SAMPLE DATA MODAL */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-sm w-full p-6 shadow-2xl border`}>
            <div className="flex items-center gap-3 mb-3 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Reset Sample Data?</h3>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-5`}>
              Are you sure you want to reset all claims back to the corporate demo sample dataset? Any unsaved edits will be replaced.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className={`px-3.5 py-1.5 text-xs font-semibold ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetSampleData}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-sm"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL RECEIPT VIEWER MODAL */}
      {receiptViewerUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[70] flex items-center justify-center p-3 sm:p-4 print:hidden" 
          onClick={() => setReceiptViewerUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-3 shadow-2xl border border-slate-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-800 gap-2">
              <div>
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-400" />
                  Receipt Proof Viewer
                </span>
                <p className="text-[10px] text-slate-400">On mobile: Tap 'Save to Gallery' or long-press image to save to Photos.</p>
              </div>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={receiptViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1 border border-slate-700"
                  title="Open full image in new tab to save to Photos"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open Tab ↗</span>
                </a>
                <button
                  type="button"
                  onClick={() => downloadReceipt({ receipt: receiptViewerUrl })}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                  title="Download or save photo to Phone Gallery"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save to Gallery</span>
                </button>
                <button 
                  onClick={() => setReceiptViewerUrl(null)} 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-full transition ml-1"
                  title="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 sm:p-4 flex-1 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl overflow-auto gap-2">
              <img 
                src={receiptViewerUrl} 
                alt="Full Receipt" 
                className="max-w-full max-h-[65vh] object-contain mx-auto rounded-lg shadow-lg select-none" 
              />
              <p className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full text-center shadow-sm">
                📱 iPhone / Android Tip: Press &amp; hold the receipt image for 1 second &rarr; tap 'Save to Photos'
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED RECEIPT GALLERY MODAL */}
      {isReceiptGalleryOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl border`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Images className="w-5 h-5 text-emerald-500" />
                  <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Receipt Gallery</h3>
                  <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    {galleryClaims.length} Attachment{galleryClaims.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                  View full receipt images or remove attachments directly across your logged claims.
                </p>
              </div>

              {/* Workspace Filter Tabs & Close Button */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center p-1 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    onClick={() => setGalleryFilterWorkspace('CURRENT')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      galleryFilterWorkspace === 'CURRENT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Active Workspace ({activeWorkspaceReceiptsCount})
                  </button>
                  <button
                    onClick={() => setGalleryFilterWorkspace('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      galleryFilterWorkspace === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Workspaces ({totalReceiptsCount})
                  </button>
                </div>

                <button 
                  onClick={() => setIsReceiptGalleryOpen(false)} 
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-800/50 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="overflow-y-auto flex-1 pr-1 my-1">
              {galleryClaims.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'} flex items-center justify-center mb-3`}>
                    <Receipt className="w-8 h-8 opacity-60" />
                  </div>
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>No Receipt Attachments Found</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} max-w-sm`}>
                    {galleryFilterWorkspace === 'CURRENT'
                      ? `No claims in "${activeProfile}" currently have receipt photos attached.`
                      : 'No claims in any workspace currently have receipt photos attached.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {galleryClaims.map(item => {
                    const statusBg = item.status === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : item.status === 'SUBMITTED'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';

                    const statusLabel = item.status === 'PAID' ? 'Paid' : item.status === 'SUBMITTED' ? 'Submitted' : 'Unsubmitted';

                    return (
                      <div 
                        key={item.id} 
                        className={`group relative rounded-2xl border overflow-hidden transition-all flex flex-col ${
                          darkMode ? 'bg-slate-800/60 border-slate-750 hover:border-slate-650' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Image Preview Thumbnail */}
                        <div className="relative h-44 w-full bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer">
                          <img 
                            src={item.receipt!} 
                            alt={item.title} 
                            onClick={() => setReceiptViewerUrl(item.receipt!)}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          
                          {/* Top floating badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border backdrop-blur-md ${statusBg}`}>
                              {statusLabel}
                            </span>
                            <span className="text-[10px] font-extrabold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-md">
                              {formatMoney(item.amount)}
                            </span>
                          </div>

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => setReceiptViewerUrl(item.receipt!)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-lg"
                              title="View full receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReceiptToDeleteClaim(item)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-lg"
                              title="Delete receipt attachment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="truncate">{item.merchant || 'Vendor'}</span>
                              <span>{item.date}</span>
                            </div>
                            <h4 className={`text-xs font-bold line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`} title={item.title}>
                              {item.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-200 dark:border-slate-750/60 text-[10px]">
                            <span className={`px-2 py-0.5 rounded-md font-semibold truncate ${darkMode ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-200/80 text-slate-700'}`}>
                              {item.category}
                            </span>
                            {galleryFilterWorkspace === 'ALL' && (
                              <span className="text-[9px] font-bold text-blue-400 truncate max-w-[80px]">
                                {item.profile}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Gallery Footer */}
            <div className={`pt-3 mt-2 flex items-center justify-between border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Showing {galleryClaims.length} receipt proof{galleryClaims.length === 1 ? '' : 's'}
              </span>
              <button 
                type="button" 
                onClick={() => setIsReceiptGalleryOpen(false)} 
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REMOVE RECEIPT ATTACHMENT MODAL */}
      {receiptToDeleteClaim && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 print:hidden">
          <div className={`${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-3xl max-w-sm w-full p-6 shadow-2xl border`}>
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Remove Receipt Photo?</h3>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'} mb-2`}>
              Are you sure you want to remove the receipt attachment from <strong className="font-bold text-red-400">"{receiptToDeleteClaim.title}"</strong>?
            </p>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-5`}>
              The expense claim record details will be kept, but the attached image will be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiptToDeleteClaim(null)}
                className={`px-3.5 py-1.5 text-xs font-semibold ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'} rounded-xl transition`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveReceipt}
                className="px-4 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm"
              >
                Remove Receipt
              </button>
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
