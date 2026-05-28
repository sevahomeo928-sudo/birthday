/**
 * Supabase Realtime Sync Manager
 * Replaces WebSocket with Supabase Realtime for Netlify compatibility
 * Ensures all clients see instant updates when admin deploys changes
 */

import { createClient } from '@supabase/supabase-js';

type StateType = 'person' | 'senders' | 'theme' | 'polaroids';
type StateListener = (data: any) => void;

interface StateUpdate {
  type: StateType;
  data: any;
  timestamp: number;
  id: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

class SupabaseRealtimeSyncManager {
  private listeners: Map<StateType, Set<StateListener>> = new Map();
  private channel: any = null;
  private isConnectedStatus = false;
  private processedUpdateIds: Set<string> = new Set();
  private maxProcessedIds = 100;

  constructor() {
    this.initSupabaseRealtime();
  }

  private initSupabaseRealtime() {
    try {
      // Subscribe to the global_state channel
      this.channel = supabase.channel('global_state', {
        config: {
          broadcast: { self: true },
          presence: { key: `client-${Date.now()}` },
        },
      });

      // Listen for broadcast messages
      this.channel
        .on('broadcast', { event: 'state_update' }, (payload: any) => {
          try {
            const update = payload.payload as StateUpdate;
            this.handleStateUpdate(update);
          } catch (e) {
            console.error('Failed to parse Supabase message:', e);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          console.log('✅ Supabase Realtime connected');
          this.isConnectedStatus = true;
        })
        .on('presence', { event: 'leave' }, () => {
          console.log('User left the channel');
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time sync connected via Supabase');
            this.isConnectedStatus = true;
          } else if (status === 'CLOSED') {
            console.log('Real-time sync disconnected');
            this.isConnectedStatus = false;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error, attempting to reconnect...');
            this.isConnectedStatus = false;
            setTimeout(() => this.initSupabaseRealtime(), 3000);
          }
        });
    } catch (e) {
      console.error('Failed to initialize Supabase Realtime:', e);
    }
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

  private handleStateUpdate(update: StateUpdate) {
    // Prevent duplicate processing
    if (this.processedUpdateIds.has(update.id)) {
      return;
    }

    this.processedUpdateIds.add(update.id);

    // Keep memory bounded
    if (this.processedUpdateIds.size > this.maxProcessedIds) {
      const idsArray = Array.from(this.processedUpdateIds);
      this.processedUpdateIds = new Set(idsArray.slice(-this.maxProcessedIds));
    }

    // Save to localStorage
    const key = this.getKeyFromStateType(update.type);
    try {
      localStorage.setItem(key, JSON.stringify(update.data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Notify all listeners
    this.notifyListeners(update.type, update.data);
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
   * Subscribe to state changes
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
   * Broadcast state update to all connected clients via Supabase Realtime
   */
  async broadcast(type: StateType, data: any) {
    const update: StateUpdate = {
      type,
      data,
      timestamp: Date.now(),
      id: `${type}-${Date.now()}-${Math.random()}`
    };

    // Save to localStorage first
    const key = this.getKeyFromStateType(type);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Broadcast via Supabase Realtime
    if (this.channel && this.isConnectedStatus) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: update
        });
        console.log(`📤 Broadcasted ${type} update`);
      } catch (e) {
        console.error('Failed to broadcast via Supabase:', e);
      }
    } else {
      console.warn('Supabase not connected, state saved locally only');
    }

    // Notify local listeners
    this.notifyListeners(type, data);
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.isConnectedStatus;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.channel) {
      this.channel.unsubscribe();
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const realtimeSyncManager = new SupabaseRealtimeSyncManager();
