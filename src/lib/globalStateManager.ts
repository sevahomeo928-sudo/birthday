/**
 * Global State Manager for Cross-Tab Communication
 * Now uses Supabase Realtime instead of WebSocket
 * Broadcasts state changes across all tabs/windows and globally
 */

import { realtimeSyncManager } from './supabaseRealtimeSync';

type StateListener = (data: any) => void;
type StateType = 'person' | 'senders' | 'theme' | 'polaroids';

interface StateUpdate {
  type: StateType;
  data: any;
  timestamp: number;
}

class GlobalStateManager {
  private listeners: Map<StateType, Set<StateListener>> = new Map();
  private lastUpdate: Map<StateType, number> = new Map();
  private updateDebounceTime = 100; // ms

  constructor() {
    this.setupRealtimeSync();
    this.setupStorageListener();
  }

  private setupRealtimeSync() {
    // Subscribe to real-time updates from Supabase
    const types: StateType[] = ['person', 'senders', 'theme', 'polaroids'];
    types.forEach(type => {
      realtimeSyncManager.subscribe(type, (data) => {
        this.notifyListeners(type, data);
      });
    });
  }

  private setupStorageListener() {
    // Listen for storage changes from other tabs (fallback)
    window.addEventListener('storage', (event) => {
      if (!event.key) return;
      
      const stateType = this.getStateTypeFromKey(event.key);
      if (stateType && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          this.notifyListeners(stateType, data);
        } catch (e) {
          console.error('Failed to parse storage event data:', e);
        }
      }
    });
  }

  private getStateTypeFromKey(key: string): StateType | null {
    const mapping: { [key: string]: StateType } = {
      'chaarYaarPerson': 'person',
      'chaarYaarSenders': 'senders',
      'chaarYaarTheme': 'theme',
      'chaarYaarPolaroids': 'polaroids'
    };
    return mapping[key] || null;
  }

  private getKeyFromStateType(type: StateType): string {
    const mapping: { [key in StateType]: string } = {
      'person': 'chaarYaarPerson',
      'senders': 'chaarYaarSenders',
      'theme': 'chaarYaarTheme',
      'polaroids': 'chaarYaarPolaroids'
    };
    return mapping[type];
  }

  private notifyListeners(type: StateType, data: any) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(data);
        } catch (e) {
          console.error('Error in state listener:', e);
        }
      });
    }
  }

  /**
   * Subscribe to state changes for a specific type
   */
  subscribe(type: StateType, listener: StateListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /**
   * Broadcast a state update to all clients globally via Supabase Realtime
   */
  broadcast(type: StateType, data: any) {
    const now = Date.now();
    const lastUpdateTime = this.lastUpdate.get(type) || 0;

    // Debounce rapid updates
    if (now - lastUpdateTime < this.updateDebounceTime) {
      return;
    }

    this.lastUpdate.set(type, now);

    // Save to localStorage
    const key = this.getKeyFromStateType(type);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Broadcast via Supabase Realtime
    realtimeSyncManager.broadcast(type, data);

    // Also notify local listeners
    this.notifyListeners(type, data);
  }

  /**
   * Broadcast all current state to other tabs
   */
  broadcastAll() {
    const types: StateType[] = ['person', 'senders', 'theme', 'polaroids'];
    types.forEach(type => {
      const key = this.getKeyFromStateType(type);
      const data = localStorage.getItem(key);
      if (data) {
        try {
          this.broadcast(type, JSON.parse(data));
        } catch (e) {
          console.error(`Failed to broadcast ${type}:`, e);
        }
      }
    });
  }

  /**
   * Get connection status
   */
  isRealtimeConnected(): boolean {
    return realtimeSyncManager.isConnected();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.listeners.clear();
    realtimeSyncManager.destroy();
  }
}

// Singleton instance
export const globalStateManager = new GlobalStateManager();
