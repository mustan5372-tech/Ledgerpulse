import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import type { Transaction, DebtRecord, User, RecycleBinItem } from '../types';
// Web app Firebase configuration provided by USER

const firebaseConfig = {
  apiKey: "AIzaSyABAsxoHQgP5Kugn2zDnecoLQFLLISo8q0",
  authDomain: "ledgerplus-7defb.firebaseapp.com",
  projectId: "ledgerplus-7defb",
  storageBucket: "ledgerplus-7defb.firebasestorage.app",
  messagingSenderId: "205757011703",
  appId: "1:205757011703:web:0a7fd778d0ab73f19f25f2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION_NAME = 'user_transactions';
const DEBTS_COLLECTION = 'user_debts';
const RECYCLE_BIN_COLLECTION = 'user_recycle_bin';
const USERS_COLLECTION = 'users';

export const isSuperAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === 'mustan5372@gmail.com';
};

// Listen to all registered users & auto-discover existing users from transactions/debts
export const subscribeToAllUsers = (
  onUpdate: (users: User[]) => void,
  onError?: (err: Error) => void
) => {
  const usersMap = new Map<string, User>();

  // Add preset user first
  const mustanUser: User = {
    uid: 'mustan5372_uid',
    email: 'mustan5372@gmail.com',
    name: 'Mustan Sanawadwala',
    isSuperAdmin: true,
  };
  usersMap.set('mustan5372_uid', mustanUser);
  usersMap.set('mustan5372@gmail.com', mustanUser);

  // Add local stored users
  try {
    const savedLocal = localStorage.getItem('ledger_pulse_registered_users_v1');
    if (savedLocal) {
      const parsedLocal = JSON.parse(savedLocal);
      Object.values(parsedLocal).forEach((item: any) => {
        const u = item?.user;
        if (u) {
          if (u.uid) usersMap.set(u.uid, { ...u, isSuperAdmin: isSuperAdminEmail(u.email) });
          if (u.email) usersMap.set(u.email.toLowerCase(), { ...u, isSuperAdmin: isSuperAdminEmail(u.email) });
        }
      });
    }
  } catch {
    // Ignore local storage error
  }


  const emitMergedUsers = () => {
    const uniqueUsers = Array.from(new Set(Array.from(usersMap.values()).map((u) => u.uid)))
      .map((uid) => {
        const match = Array.from(usersMap.values()).find((u) => u.uid === uid);
        return match!;
      })
      .filter(Boolean);

    // Sort: Super Admin top, then alphabetical
    uniqueUsers.sort((a, b) => {
      if (a.isSuperAdmin) return -1;
      if (b.isSuperAdmin) return 1;
      return a.name.localeCompare(b.name);
    });

    onUpdate(uniqueUsers);
  };

  try {
    // 1. Listen to users collection
    const unsubUsers = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const uid = data.uid || docSnap.id;
          const email = data.email || '';
          const name = data.name || (email ? email.split('@')[0] : 'User');
          const userObj: User = {
            uid,
            email,
            name,
            isSuperAdmin: isSuperAdminEmail(email),
          };
          usersMap.set(uid, userObj);
          if (email) usersMap.set(email.toLowerCase(), userObj);
        });
        emitMergedUsers();
      },
      (err) => {
        console.warn('Firestore users subscription error:', err);
        if (onError) onError(err);
      }
    );

    // 2. Discover users from transactions collection
    const unsubTxs = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docUserId = data.userId || data.user_id;
          if (docUserId && !usersMap.has(docUserId)) {
            const email = data.userEmail || data.email || `${docUserId}@user.ledger`;
            const name = data.userName || data.name || (data.email ? data.email.split('@')[0] : `User (${docUserId.substring(0, 8)})`);
            const discoveredUser: User = {
              uid: docUserId,
              email,
              name,
              isSuperAdmin: isSuperAdminEmail(email),
            };
            usersMap.set(docUserId, discoveredUser);
            // Persist discovered user doc in users collection
            setDoc(doc(db, USERS_COLLECTION, docUserId), discoveredUser, { merge: true }).catch(() => {});
          }
        });
        emitMergedUsers();
      },
      () => {}
    );

    // 3. Discover users from debts collection
    const unsubDebts = onSnapshot(
      collection(db, DEBTS_COLLECTION),
      (snapshot) => {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docUserId = data.userId || data.user_id;
          if (docUserId && !usersMap.has(docUserId)) {
            const email = data.userEmail || data.email || `${docUserId}@user.ledger`;
            const name = data.userName || data.name || (data.email ? data.email.split('@')[0] : `User (${docUserId.substring(0, 8)})`);
            const discoveredUser: User = {
              uid: docUserId,
              email,
              name,
              isSuperAdmin: isSuperAdminEmail(email),
            };
            usersMap.set(docUserId, discoveredUser);
            // Persist discovered user doc in users collection
            setDoc(doc(db, USERS_COLLECTION, docUserId), discoveredUser, { merge: true }).catch(() => {});
          }
        });
        emitMergedUsers();
      },
      () => {}
    );

    return () => {
      unsubUsers();
      unsubTxs();
      unsubDebts();
    };
  } catch (err) {
    console.error('Error starting users subscription:', err);
    return () => {};
  }
};


// Real-time Firestore sync listener for User Transactions
export const subscribeToTransactions = (
  userId: string,
  userEmail: string | undefined,
  onUpdate: (txs: Transaction[]) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const isSuperAdmin = isSuperAdminEmail(userEmail);

  try {
    const unsubscribe = onSnapshot(
      collection(db, COLLECTION_NAME),
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docUserId = data.userId;

          let belongsToUser = false;

          if (isSuperAdmin) {
            // Super Admin sees ALL user transactions across the platform
            belongsToUser = true;
          } else {
            // Regular user only sees their own transactions
            if (docUserId === userId || !docUserId) {
              belongsToUser = true;
            }
          }

          if (belongsToUser) {
            txs.push({
              id: docSnap.id,
              userId: docUserId || userId,
              title: data.title || 'Untitled',
              amount: Number(data.amount) || 0,
              type: data.type || 'expense',
              category: data.category || 'Other',
              date: data.date || new Date().toISOString().split('T')[0],
              paymentMethod: data.paymentMethod || 'UPI',
              notes: data.notes || '',
              receiptUrl: data.receiptUrl || undefined,
            });
          }
        });

        txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(txs);
      },
      (error) => {
        console.error('Firestore Real-Time Listener Error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize Firestore listener:', err);
    return () => {};
  }
};

// Save transaction (Create / Update in Cloud Firestore with userId)
export const saveTransactionToCloud = async (tx: Transaction, targetUserId: string): Promise<boolean> => {
  try {
    const uid = tx.userId || targetUserId;
    if (!uid) return false;

    const sanitized: Record<string, any> = {
      id: tx.id,
      userId: uid,
      title: tx.title || '',
      amount: Number(tx.amount) || 0,
      type: tx.type || 'expense',
      category: tx.category || 'Other',
      date: tx.date || new Date().toISOString().split('T')[0],
      paymentMethod: tx.paymentMethod || 'UPI',
      notes: tx.notes || '',
      receiptUrl: tx.receiptUrl || '',
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, COLLECTION_NAME, tx.id);
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore saveTransactionToCloud Error:', err);
    return false;
  }
};

// Delete transaction from Cloud Firestore
export const deleteTransactionFromCloud = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Firestore deleteTransactionFromCloud Error:', err);
    return false;
  }
};

// Real-time Firestore sync listener for Debts / IOUs
export const subscribeToDebts = (
  userId: string,
  userEmail: string | undefined,
  onUpdate: (debts: DebtRecord[]) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const isSuperAdmin = isSuperAdminEmail(userEmail);

  try {
    const unsubscribe = onSnapshot(
      collection(db, DEBTS_COLLECTION),
      (snapshot) => {
        const debts: DebtRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docUserId = data.userId;

          let belongsToUser = false;
          if (isSuperAdmin) {
            belongsToUser = true;
          } else {
            if (docUserId === userId || !docUserId) belongsToUser = true;
          }

          if (belongsToUser) {
            debts.push({
              id: docSnap.id,
              userId: docUserId || userId,
              personName: data.personName || 'Anonymous',
              phoneNumber: data.phoneNumber || undefined,
              amount: Number(data.amount) || 0,
              type: data.type || 'lent',
              status: data.status || 'pending',
              date: data.date || new Date().toISOString().split('T')[0],
              dueDate: data.dueDate || undefined,
              notes: data.notes || '',
            });
          }
        });

        debts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(debts);
      },
      (error) => {
        console.error('Firestore Real-Time Debts Listener Error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to initialize Firestore debts listener:', err);
    return () => {};
  }
};

export const saveDebtToCloud = async (debt: DebtRecord, targetUserId: string): Promise<boolean> => {
  try {
    const uid = debt.userId || targetUserId;
    if (!uid) return false;

    const sanitized: Record<string, any> = {
      id: debt.id,
      userId: uid,
      personName: debt.personName || 'Anonymous',
      phoneNumber: debt.phoneNumber || '',
      amount: Number(debt.amount) || 0,
      type: debt.type || 'lent',
      status: debt.status || 'pending',
      date: debt.date || new Date().toISOString().split('T')[0],
      dueDate: debt.dueDate || '',
      notes: debt.notes || '',
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, DEBTS_COLLECTION, debt.id);
    await setDoc(docRef, sanitized, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore saveDebtToCloud Error:', err);
    return false;
  }
};

export const deleteDebtFromCloud = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, DEBTS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Firestore deleteDebtFromCloud Error:', err);
    return false;
  }
};

// -------------------------------------------------------------
// RECYCLE BIN FIREBASE SERVICE FUNCTIONS (15-day retention)
// -------------------------------------------------------------

export const RETENTION_PERIOD_MS = 15 * 24 * 60 * 60 * 1000; // 15 Days in milliseconds

export const subscribeToRecycleBin = (
  userId: string,
  userEmail: string | undefined,
  onUpdate: (items: RecycleBinItem[]) => void,
  onError?: (err: Error) => void
) => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const isSuperAdmin = isSuperAdminEmail(userEmail);
  const nowMs = Date.now();

  try {
    const unsubscribe = onSnapshot(
      collection(db, RECYCLE_BIN_COLLECTION),
      (snapshot) => {
        const items: RecycleBinItem[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const itemUserId = data.userId;
          const deletedAtMs = new Date(data.deletedAt).getTime();

          // Auto-purge check: If older than 15 days, permanently delete
          if (nowMs - deletedAtMs > RETENTION_PERIOD_MS) {
            deleteDoc(doc(db, RECYCLE_BIN_COLLECTION, docSnap.id)).catch(() => {});
            return;
          }

          let belongsToUser = false;
          if (isSuperAdmin) {
            belongsToUser = true;
          } else if (itemUserId === userId) {
            belongsToUser = true;
          }

          if (belongsToUser) {
            items.push({
              id: docSnap.id,
              userId: itemUserId || userId,
              itemType: data.itemType || 'transaction',
              title: data.title || 'Deleted Entry',
              amount: Number(data.amount) || 0,
              details: data.details || '',
              date: data.date || new Date().toISOString().split('T')[0],
              deletedAt: data.deletedAt || new Date().toISOString(),
              data: data.data || {},
            });
          }
        });

        items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
        onUpdate(items);
      },
      (err) => {
        console.warn('Recycle Bin Firestore listener error:', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Recycle Bin:', err);
    return () => {};
  }
};

export const saveToRecycleBinCloud = async (item: RecycleBinItem): Promise<boolean> => {
  try {
    const docRef = doc(db, RECYCLE_BIN_COLLECTION, item.id);
    await setDoc(docRef, item, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to save item to Recycle Bin cloud:', err);
    return false;
  }
};

export const deleteFromRecycleBinCloud = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, RECYCLE_BIN_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Failed to delete item from Recycle Bin cloud:', err);
    return false;
  }
};

