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
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from '../lib/firebase';
import { Task, AppSettings } from '../types';
import { getStoredSyncCode } from '../utils/syncCode';
import { loadTasksFromStorage, saveTasksToStorage, loadSettingsFromStorage, saveSettingsToStorage } from '../utils/storage';

export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettingsFromStorage());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [activeSyncCode, setActiveSyncCode] = useState(() => getStoredSyncCode());

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

  // Sync tasks in real-time when user changes or is logged in
  useEffect(() => {
    if (!user) return;

    setSyncStatus('syncing');

    // Subscribe to tasks collection for this user
    const q = query(collection(db, 'tasks'), where('syncId', '==', activeSyncCode));
    const unsubscribeTasks = onSnapshot(
      q,
      (snapshot) => {
        const cloudTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          cloudTasks.push({
            id: data.id,
            title: data.title,
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

        // If cloud is empty but local storage has tasks, upload local tasks to cloud
        cloudTasks.sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        if (cloudTasks.length === 0 && snapshot.empty) {
          const localTasks = loadTasksFromStorage();
          if (localTasks.length > 0) {
            localTasks.forEach((t) => {
              setDoc(doc(db, 'tasks', t.id), { ...t, syncId: activeSyncCode }, { merge: true });
            });
            setTasks(localTasks);
          }
        } else {
          // Sort tasks or keep local order if specified
          setTasks(cloudTasks);
          saveTasksToStorage(cloudTasks);
        }
        setSyncStatus('synced');
      },
      (err) => {
        console.error('Error fetching Firestore tasks:', err);
        setSyncStatus('error');
      }
    );

    // Subscribe to settings for this user
    const settingsDocRef = doc(db, 'settings', activeSyncCode);
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
          setDoc(settingsDocRef, { ...localSettings, syncId: activeSyncCode }, { merge: true });
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
  }, [user, activeSyncCode]);

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
          await setDoc(doc(db, 'tasks', task.id), { ...task, syncId: activeSyncCode }, { merge: true });
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to save task to Cloud Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user, activeSyncCode]
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
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to delete task from Cloud Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user, activeSyncCode]
  );

  const saveSettings = useCallback(
    async (newSettings: AppSettings) => {
      setSettings(newSettings);
      saveSettingsToStorage(newSettings);

      if (user) {
        try {
          await setDoc(doc(db, 'settings', activeSyncCode), { ...newSettings, syncId: activeSyncCode }, { merge: true });
        } catch (e) {
          console.error('Failed to save settings to Cloud Firestore:', e);
        }
      }
    },
    [user, activeSyncCode]
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
            setDoc(doc(db, 'tasks', t.id), { ...t, syncId: activeSyncCode }, { merge: true })
          );
          await Promise.all(promises);
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to sync reordered tasks to Cloud Firestore:', e);
          setSyncStatus('error');
        }
      }
    },
    [user, activeSyncCode]
  );

  

  
  const updateSyncCode = (newCode: string) => {
    import('../utils/syncCode').then(({ setStoredSyncCode }) => {
      setStoredSyncCode(newCode);
      setActiveSyncCode(newCode.toUpperCase().trim());
      setTasks([]); // clear local to force pull
    });
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
    saveTask,
    deleteTask,
    saveSettings,
    reorderTasks,
    handleSignOut,
    activeSyncCode,
    updateSyncCode
  };
}
