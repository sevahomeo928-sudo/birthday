/**
 * Real-Time Sync Manager using Supabase Realtime
 * Handles instant global state synchronization across all clients
 * When admin saves changes, all active users receive updates without page refresh
 */

import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

type StateType = 'person' | 'senders' | 'theme' | 'polaroids';
type StateListener = (data: any) => void;

interface StateUpdate {
  type: StateType;
  data: any;
  timestamp: number;
  id: string;
}

class RealtimeSyncManager {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<StateType, Set<StateListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private processedUpdateIds: Set<string> = new Set();
  private maxProcessedIds = 100;
  private isConnected = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initRealtimeChannel();
    this.setupFallbacks();
    this.monitorConnection();
  }

  private initRealtimeChannel() {
    try {
      // Subscribe to a broadcast channel for all state updates
      this.channel = supabase.channel('birthday_state_updates', {
        config: {
          broadcast: { self: true },
        },
      });

      this.channel
        .on('broadcast', { event: 'state_update' }, (payload) => {
          const update = payload.payload as StateUpdate;
          this.handleStateUpdate(update);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Real-time connected');
            this.reconnectAttempts = 0;
            this.isConnected = true;
            this.fetchLatestState(); // Get current state on connect
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error:', status);
            this.handleDisconnect();
          } else if (status === 'TIMED_OUT') {
            console.warn('Channel timed out');
            this.handleDisconnect();
          }
        });
    } catch (e) {
      console.error('Failed to initialize Supabase real-time:', e);
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    this.isConnected = false;
    console.log('Real-time sync disconnected, attempting reconnect...');
    this.attemptReconnect();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${Math.round(delay)}ms... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.initRealtimeChannel(), delay);
    } else {
      console.warn('Max reconnection attempts reached, falling back to polling');
      this.setupPolling();
    }
  }

  private setupFallbacks() {
    // Fallback 1: Storage Events (for cross-tab communication on same device)
    window.addEventListener('storage', (event) => {
      if (!event.key) return;
      const stateType = this.getStateTypeFromKey(event.key);
      if (stateType && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          this.notifyListeners(stateType, data);
        } catch (e) {
          console.error('Failed to parse storage event:', e);
        }
      }
    });

    // Fallback 2: Polling API for last-resort updates
    this.setupPolling();
  }

  private setupPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Poll every 3 seconds if real-time disconnected
    this.pollingInterval = setInterval(() => {
      if (!this.isConnected) {
        this.fetchLatestState();
      }
    }, 3000);
  }

  private async fetchLatestState() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        
        // Update all state types
        ['person', 'senders', 'theme', 'polaroids'].forEach((type) => {
          if (data[type]) {
            this.handleStateUpdate({
              type: type as StateType,
              data: data[type],
              timestamp: Date.now(),
              id: `poll-${Date.now()}-${type}`
            });
          }
        });
      }
    } catch (e) {
      console.error('Failed to fetch latest state:', e);
    }
  }

  private monitorConnection() {
    // Monitor connection status periodically
    setInterval(() => {
      if (!this.isConnected && this.channel?.state === 'SUBSCRIBED') {
        this.isConnected = true;
        this.fetchLatestState();
      }
    }, 5000);
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

    // Keep processed IDs from growing unbounded
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
  async broadcast(type: StateType, data: any): Promise<void> {
    const update: StateUpdate = {
      type,
      data,
      timestamp: Date.now(),
      id: `${type}-${Date.now()}-${Math.random()}`
    };

    try {
      // Broadcast via Supabase Realtime to all subscribers
      if (this.channel) {
        await this.channel.send({
          type: 'broadcast',
          event: 'state_update',
          payload: update,
        });
      }
    } catch (e) {
      console.error('Failed to broadcast via Supabase:', e);
    }

    // Also handle locally
    this.handleStateUpdate(update);
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.isConnected && this.channel?.state === 'SUBSCRIBED';
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const realtimeSyncManager = new RealtimeSyncManager();
