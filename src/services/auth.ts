import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc
} from 'firebase/firestore';
import { app, isSuperAdminEmail } from './firebase';
import type { User } from '../types';

export const auth = getAuth(app);
const db = getFirestore(app);

// Enable local persistence so user STAYS logged in
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase persistence warning:', err);
});

const AUTH_STORAGE_KEY = 'ledger_pulse_user_session_v1';
const LOCAL_USERS_KEY = 'ledger_pulse_registered_users_v1';

// Preset default user credentials requested by user
export const PRESET_USER: User = {
  uid: 'mustan5372_uid',
  email: 'mustan5372@gmail.com',
  name: 'Mustan Sanawadwala',
  isSuperAdmin: true
};

const PRESET_PASSWORD = 'Mustan@525';

// Helper to get local user registry
const getLocalUsers = (): Record<string, { user: User; passwordHash: string }> => {
  try {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Error reading local users registry:', err);
  }
  // Initialize with preset user
  return {
    ['mustan5372@gmail.com']: {
      user: PRESET_USER,
      passwordHash: PRESET_PASSWORD
    }
  };
};

const saveLocalUsers = (users: Record<string, { user: User; passwordHash: string }>) => {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving local user registry:', err);
  }
};

export const getAllStoredLocalUsers = (): User[] => {
  const map = getLocalUsers();
  return Object.values(map).map((item) => item.user);
};


// 1. Get initial persistent user session
export const getSavedUserSession = (): User | null => {
  try {
    // Check Firebase auth first if available
    const fbUser = auth.currentUser;
    if (fbUser && fbUser.email) {
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email.split('@')[0],
        isSuperAdmin: isSuperAdminEmail(fbUser.email)
      };
    }

    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.email) {
        return {
          ...parsed,
          isSuperAdmin: isSuperAdminEmail(parsed.email)
        };
      }
    }
  } catch (err) {
    console.error('Error parsing stored user session:', err);
  }
  return null;
};

// Save session so user STAYS logged in
export const saveUserSession = (user: User | null) => {
  try {
    if (user) {
      const updatedUser = {
        ...user,
        isSuperAdmin: isSuperAdminEmail(user.email)
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error persisting user session:', err);
  }
};

// 2. Sign In function
export const loginAccount = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (!normalizedEmail || !password) {
    return { success: false, error: 'Please enter both email and password' };
  }

  // A. Check Firebase Auth first
  try {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    if (cred.user && cred.user.email) {
      const user: User = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || cred.user.email.split('@')[0],
        isSuperAdmin: isSuperAdminEmail(cred.user.email)
      };
      saveUserSession(user);
      return { success: true, user };
    }
  } catch (fbErr: any) {
    console.log('Firebase auth login attempt note:', fbErr.message);
  }

  // B. Fallback / Seed Account check
  const localUsers = getLocalUsers();

  // Special check for preset mustan5372@gmail.com
  if (normalizedEmail === 'mustan5372@gmail.com' && password === PRESET_PASSWORD) {
    const user = PRESET_USER;
    saveUserSession(user);
    // Also try to create in Firestore users collection
    try {
      await setDoc(doc(db, 'users', user.uid), user, { merge: true });
    } catch {
      // Ignore cloud write error if offline
    }
    return { success: true, user };
  }

  const existingLocal = localUsers[normalizedEmail];
  if (existingLocal) {
    if (existingLocal.passwordHash === password) {
      const user = {
        ...existingLocal.user,
        isSuperAdmin: isSuperAdminEmail(existingLocal.user.email)
      };
      saveUserSession(user);
      return { success: true, user };
    } else {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
  }

  // C. Try Firestore user check
  try {
    const userDocRef = doc(db, 'users', normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_'));
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.password === password || normalizedEmail === 'mustan5372@gmail.com') {
        const user: User = {
          uid: data.uid || docSnap.id,
          email: data.email || normalizedEmail,
          name: data.name || normalizedEmail.split('@')[0],
          isSuperAdmin: isSuperAdminEmail(normalizedEmail)
        };
        saveUserSession(user);
        return { success: true, user };
      } else {
        return { success: false, error: 'Incorrect password.' };
      }
    }
  } catch (err) {
    console.error('Firestore user lookup error:', err);
  }

  return { 
    success: false, 
    error: 'Account not found. Please create a new account if you do not have one yet.' 
  };
};

// 3. Register New Account function
export const registerAccount = async (name: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name.trim() || normalizedEmail.split('@')[0];

  if (!normalizedEmail || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long' };
  }

  // Check if account exists locally or is preset
  const localUsers = getLocalUsers();
  if (localUsers[normalizedEmail]) {
    return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
  }

  let newUser: User = {
    uid: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    name: displayName,
    isSuperAdmin: isSuperAdminEmail(normalizedEmail)
  };

  // Try Firebase Auth creation
  try {
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName });
      newUser = {
        uid: cred.user.uid,
        email: cred.user.email || normalizedEmail,
        name: displayName,
        isSuperAdmin: isSuperAdminEmail(cred.user.email || normalizedEmail)
      };
    }
  } catch (fbErr: any) {
    console.warn('Firebase Auth signup note (fallback to Firestore & Local):', fbErr.message);
  }

  // Store in Local Users registry
  localUsers[normalizedEmail] = {
    user: newUser,
    passwordHash: password
  };
  saveLocalUsers(localUsers);

  // Store in Firestore users collection
  try {
    await setDoc(doc(db, 'users', newUser.uid), {
      ...newUser,
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Cloud user registry save note:', err);
  }

  // Automatically log in and save session
  saveUserSession(newUser);
  return { success: true, user: newUser };
};

// 4. Log out function
export const logoutAccount = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase logout note:', err);
  }
  saveUserSession(null);
};

