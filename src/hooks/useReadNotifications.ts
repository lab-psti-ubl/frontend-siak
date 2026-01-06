import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

// Cache for read notifications data per user
let readNotificationsCache: Map<string, string[]> = new Map();
let cacheTimestamp: Map<string, number> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let refreshListeners: Map<string, (() => void)[]> = new Map();

export const useReadNotifications = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  const [readNotifications, setReadNotifications] = useState<string[]>(readNotificationsCache.get(userId) || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReadNotifications = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setReadNotifications([]);
      return;
    }

    const now = Date.now();
    const userCacheTimestamp = cacheTimestamp.get(userId) || 0;
    
    // Return cached data if still valid
    if (!forceRefresh && readNotificationsCache.has(userId) && (now - userCacheTimestamp) < CACHE_DURATION) {
      setReadNotifications(readNotificationsCache.get(userId) || []);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getReadNotificationsByUserId(userId);
      if (response.success && response.data) {
        const notificationIds = response.data.readNotificationIds || [];
        readNotificationsCache.set(userId, notificationIds);
        cacheTimestamp.set(userId, now);
        setReadNotifications(notificationIds);
        // Notify all listeners for this user
        const listeners = refreshListeners.get(userId) || [];
        listeners.forEach(listener => listener());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch read notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshReadNotifications = useCallback(() => {
    return fetchReadNotifications(true);
  }, [fetchReadNotifications]);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!userId || !notificationId) {
      return Promise.resolve();
    }

    try {
      const response = await apiService.markNotificationAsRead(userId, notificationId);
      if (response.success && response.data) {
        const notificationIds = response.data.readNotificationIds || [];
        readNotificationsCache.set(userId, notificationIds);
        cacheTimestamp.set(userId, Date.now());
        setReadNotifications(notificationIds);
        // Notify all listeners for this user
        const listeners = refreshListeners.get(userId) || [];
        listeners.forEach(listener => listener());
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err; // Re-throw to allow .catch() to work
    }
  }, [userId]);

  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    if (!userId || !notificationIds || notificationIds.length === 0) return;

    try {
      const response = await apiService.markMultipleNotificationsAsRead(userId, notificationIds);
      if (response.success && response.data) {
        const updatedIds = response.data.readNotificationIds || [];
        readNotificationsCache.set(userId, updatedIds);
        cacheTimestamp.set(userId, Date.now());
        setReadNotifications(updatedIds);
        // Notify all listeners for this user
        const listeners = refreshListeners.get(userId) || [];
        listeners.forEach(listener => listener());
      }
    } catch (err) {
      console.error('Error marking multiple notifications as read:', err);
    }
  }, [userId]);

  const upsertReadNotifications = useCallback(async (notificationIds: string[]) => {
    if (!userId) return;

    try {
      const response = await apiService.upsertReadNotifications(userId, notificationIds);
      if (response.success && response.data) {
        const updatedIds = response.data.readNotificationIds || [];
        readNotificationsCache.set(userId, updatedIds);
        cacheTimestamp.set(userId, Date.now());
        setReadNotifications(updatedIds);
        // Notify all listeners for this user
        const listeners = refreshListeners.get(userId) || [];
        listeners.forEach(listener => listener());
      }
    } catch (err) {
      console.error('Error upserting read notifications:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchReadNotifications();
    
    const listener = () => {
      const cached = readNotificationsCache.get(userId) || [];
      setReadNotifications([...cached]);
    };
    
    if (!refreshListeners.has(userId)) {
      refreshListeners.set(userId, []);
    }
    refreshListeners.get(userId)!.push(listener);
    
    return () => {
      const listeners = refreshListeners.get(userId) || [];
      refreshListeners.set(userId, listeners.filter(l => l !== listener));
    };
  }, [userId, fetchReadNotifications]);

  return {
    readNotifications,
    loading,
    error,
    refreshReadNotifications,
    markAsRead,
    markMultipleAsRead,
    upsertReadNotifications
  };
};

// Export function to clear all cache (useful when logging out)
export const clearReadNotificationsCache = () => {
  readNotificationsCache.clear();
  cacheTimestamp.clear();
  refreshListeners.clear();
};

