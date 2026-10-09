import { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  signInAnon, 
  logOut, 
  onAuthStateChanged, 
  User, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from '../lib/firebase';
import { Task, AppSettings } from '../types';
import { loadTasksFromStorage, saveTasksToStorage, loadSettingsFromStorage, saveSettingsToStorage } from '../utils/storage';

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsFromStorage());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    const saved = localStorage.getItem('lisburn_last_synced_at');
    return saved ? new Date(saved) : null;
  });

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Auto sign in anonymously if not signed in, so firestore sync works out of the box
        try {
          const anonUser = await signInAnon();
          if (anonUser) {
            setUser(anonUser);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.warn('Anonymous sign-in skipped, running local-only:', err);
          setUser(null);
        }
      } else {
        setUser(currentUser);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync
  useEffect(() => {
    if (!user) return;

    setSyncStatus('syncing');

    // Subscribe to tasks collection for this user
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribeTasks = onSnapshot(
      q,
      (snapshot) => {
        const cloudTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          cloudTasks.push({
            id: data.id || docSnap.id,
            title: data.title || 'Untitled',
            description: data.description || '',
            category: data.category || '',
            icon: data.icon || 'Smile',
            lastCompletedAt: data.lastCompletedAt || null,
            reminderIntervalHours: data.reminderIntervalHours ?? null,
            history: Array.isArray(data.history) ? data.history : [],
            createdAt: data.createdAt || new Date().toISOString(),
            color: data.color || 'violet',
            order: data.order ?? 0
          });
        });

        cloudTasks.sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (cloudTasks.length === 0 && snapshot.empty) {
          // If cloud is empty for this user account, upload local tasks
          const localTasks = loadTasksFromStorage();
          if (localTasks.length > 0) {
            localTasks.forEach((t) => {
              setDoc(doc(db, 'tasks', t.id), { ...t, userId: user.uid }, { merge: true });
            });
            setTasks(localTasks);
          }
        } else {
          setTasks(cloudTasks);
          saveTasksToStorage(cloudTasks);
        }
        const now = new Date();
        setLastSyncedAt(now);
        localStorage.setItem('lisburn_last_synced_at', now.toISOString());
        setSyncStatus('synced');
      },
      (err) => {
        console.error('Error fetching Firestore tasks:', err);
        setSyncStatus('error');
      }
    );

    // Subscribe to settings for this user
    const settingsDocRef = doc(db, 'settings', user.uid);
    const unsubscribeSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          setSettings(data);
          saveSettingsToStorage(data);
        } else {
          // Upload local settings to cloud
          const localSettings = loadSettingsFromStorage();
          setDoc(settingsDocRef, { ...localSettings, userId: user.uid }, { merge: true });
        }
      },
      (err) => {
        console.error('Error fetching Firestore settings:', err);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeSettings();
    };
  }, [user]);

  // Explicit Manual Sync Action
  const syncNow = useCallback(async (): Promise<{ success: boolean; message: string; count?: number }> => {
    if (!user) {
      return { success: false, message: 'Please sign in to sync with cloud.' };
    }

    setSyncStatus('syncing');
    try {
      // 1. Direct query of cloud tasks
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const cloudTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        cloudTasks.push({
          id: data.id || docSnap.id,
          title: data.title || 'Untitled',
          description: data.description || '',
          category: data.category || '',
          icon: data.icon || 'Smile',
          lastCompletedAt: data.lastCompletedAt || null,
          reminderIntervalHours: data.reminderIntervalHours ?? null,
          history: Array.isArray(data.history) ? data.history : [],
          createdAt: data.createdAt || new Date().toISOString(),
          color: data.color || 'violet',
          order: data.order ?? 0
        });
      });

      const localTasks = loadTasksFromStorage();

      if (cloudTasks.length === 0 && localTasks.length > 0) {
        // Cloud is empty, push all local tasks to cloud
        const promises = localTasks.map((t) =>
          setDoc(doc(db, 'tasks', t.id), { ...t, userId: user.uid }, { merge: true })
        );
        await Promise.all(promises);
        setTasks(localTasks);
      } else if (cloudTasks.length > 0) {
        // Cloud has tasks - merge any local-only tasks that don't exist in cloud
        const cloudTaskMap = new Map(cloudTasks.map((t) => [t.id, t]));
        const missingFromCloud = localTasks.filter((lt) => !cloudTaskMap.has(lt.id));

        if (missingFromCloud.length > 0) {
          const promises = missingFromCloud.map((t) =>
            setDoc(doc(db, 'tasks', t.id), { ...t, userId: user.uid }, { merge: true })
          );
          await Promise.all(promises);
          cloudTasks.push(...missingFromCloud);
        }

        cloudTasks.sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setTasks(cloudTasks);
        saveTasksToStorage(cloudTasks);
      }

      // Sync settings
      const settingsDocRef = doc(db, 'settings', user.uid);
      const settingsSnap = await getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        const cloudSettings = settingsSnap.data() as AppSettings;
        setSettings(cloudSettings);
        saveSettingsToStorage(cloudSettings);
      } else {
        const localSettings = loadSettingsFromStorage();
        await setDoc(settingsDocRef, { ...localSettings, userId: user.uid }, { merge: true });
      }

      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem('lisburn_last_synced_at', now.toISOString());
      setSyncStatus('synced');

      const count = Math.max(cloudTasks.length, localTasks.length);
      return { success: true, count, message: `Synced ${count} task${count === 1 ? '' : 's'} with cloud!` };
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
      return { success: false, message: err?.message || 'Sync failed. Please check your connection.' };
    }
  }, [user]);

  // Batch import tasks (replaces / merges tasks both locally and in Firestore)
  const importTasks = useCallback(
    async (importedTasks: Task[]) => {
      setTasks(importedTasks);
      saveTasksToStorage(importedTasks);

      if (user) {
        setSyncStatus('syncing');
        try {
          const promises = importedTasks.map((t, idx) =>
            setDoc(doc(db, 'tasks', t.id), { ...t, order: idx, userId: user.uid }, { merge: true })
          );
          await Promise.all(promises);
          const now = new Date();
          setLastSyncedAt(now);
          localStorage.setItem('lisburn_last_synced_at', now.toISOString());
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to upload imported tasks to Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user]
  );

  // Handler functions to update Firestore + local fallback
  const saveTask = useCallback(
    async (task: Task) => {
      // Update local state first for fast UI responsiveness
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === task.id);
        const updated = index >= 0 ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
        saveTasksToStorage(updated);
        return updated;
      });

      if (user) {
        setSyncStatus('syncing');
        try {
          await setDoc(doc(db, 'tasks', task.id), { ...task, userId: user.uid }, { merge: true });
          const now = new Date();
          setLastSyncedAt(now);
          localStorage.setItem('lisburn_last_synced_at', now.toISOString());
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to save task to Cloud Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== taskId);
        saveTasksToStorage(updated);
        return updated;
      });

      if (user) {
        setSyncStatus('syncing');
        try {
          await deleteDoc(doc(db, 'tasks', taskId));
          const now = new Date();
          setLastSyncedAt(now);
          localStorage.setItem('lisburn_last_synced_at', now.toISOString());
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to delete task from Cloud Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user]
  );

  const saveSettings = useCallback(
    async (newSettings: AppSettings) => {
      setSettings(newSettings);
      saveSettingsToStorage(newSettings);

      if (user) {
        try {
          await setDoc(doc(db, 'settings', user.uid), { ...newSettings, userId: user.uid }, { merge: true });
        } catch (e) {
          console.error('Failed to save settings to Cloud Firestore:', e);
        }
      }
    },
    [user]
  );

  const reorderTasks = useCallback(
    async (reorderedTasks: Task[]) => {
      const ordered = reorderedTasks.map((t, i) => ({ ...t, order: i }));
      setTasks(ordered);
      saveTasksToStorage(ordered);
      if (user) {
        setSyncStatus('syncing');
        try {
          const promises = ordered.map((t) =>
            setDoc(doc(db, 'tasks', t.id), { ...t, userId: user.uid }, { merge: true })
          );
          await Promise.all(promises);
          const now = new Date();
          setLastSyncedAt(now);
          localStorage.setItem('lisburn_last_synced_at', now.toISOString());
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to sync reordered tasks to Cloud Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user]
  );

  const handleSignInWithGoogle = async () => {
    try {
      const { signInWithGoogle } = await import('../lib/firebase');
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        // Immediately sync after sign in
        const localTasks = loadTasksFromStorage();
        if (localTasks.length > 0) {
          const promises = localTasks.map((t) =>
            setDoc(doc(db, 'tasks', t.id), { ...t, userId: signedInUser.uid }, { merge: true })
          );
          await Promise.all(promises);
        }
      }
    } catch (e) {
      console.error('Google Sign In failed:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      // Auto sign in anonymously after sign out
      await signInAnon();
    } catch (e) {
      console.error('Sign Out failed:', e);
    }
  };

  return {
    user,
    authLoading,
    tasks,
    settings,
    syncStatus,
    lastSyncedAt,
    syncNow,
    importTasks,
    saveTask,
    deleteTask,
    saveSettings,
    reorderTasks,
    handleSignInWithGoogle,
    handleSignOut
  };
}

