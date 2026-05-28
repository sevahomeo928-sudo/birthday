/**
 * Real-Time Sync Manager
 * Handles WebSocket connections for instant global state synchronization
 * Ensures all clients see changes immediately when admin deploys changes
 */

type StateType = 'person' | 'senders' | 'theme' | 'polaroids';
type StateListener = (data: any) => void;

interface StateUpdate {
  type: StateType;
  data: any;
  timestamp: number;
  id: string; // Unique update ID to prevent duplicate processing
}

class RealtimeSyncManager {
  private ws: WebSocket | null = null;
  private listeners: Map<StateType, Set<StateListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pendingUpdates: StateUpdate[] = [];
  private processedUpdateIds: Set<string> = new Set();
  private maxProcessedIds = 100; // Keep last 100 to avoid memory leak

  constructor() {
    this.initWebSocket();
    this.setupFallbacks();
  }

  private initWebSocket() {
    try {
      // Use wss for HTTPS, ws for HTTP
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.host;
      this.ws = new WebSocket(`${protocol}://${host}/ws`);

      this.ws.onopen = () => {
        console.log('✅ Real-time sync connected');
        this.reconnectAttempts = 0;
        this.flushPendingUpdates();
        
        // Request current state from server
        this.sendMessage({ type: 'sync', action: 'requestState' });
      };

      this.ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as StateUpdate;
          this.handleStateUpdate(update);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('Real-time sync disconnected, attempting reconnect...');
        this.attemptReconnect();
      };
    } catch (e) {
      console.error('Failed to initialize WebSocket:', e);
      this.setupFallbacks();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.initWebSocket(), delay);
    } else {
      console.warn('Max reconnection attempts reached, falling back to polling');
      this.setupPolling();
    }
  }

  private setupFallbacks() {
    // Fallback 1: Storage Events (for cross-tab communication)
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
    // Poll server every 5 seconds for new updates if WebSocket fails
    setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.fetchLatestState();
      }
    }, 5000);
  }

  private async fetchLatestState() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        // Update local state
        this.handleStateUpdate({
          type: 'person',
          data: data.person,
          timestamp: Date.now(),
          id: `poll-${Date.now()}`
        });
        this.handleStateUpdate({
          type: 'senders',
          data: data.senders,
          timestamp: Date.now(),
          id: `poll-${Date.now()}-senders`
        });
      }
    } catch (e) {
      console.error('Failed to fetch latest state:', e);
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
    // Prevent duplicate processing of same update
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

  private sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (e) {
        console.error('Failed to send WebSocket message:', e);
      }
    } else {
      console.warn('WebSocket not connected, queuing message');
    }
  }

  private flushPendingUpdates() {
    while (this.pendingUpdates.length > 0) {
      const update = this.pendingUpdates.shift();
      if (update) {
        this.sendMessage({ type: 'sync', action: 'broadcast', data: update });
      }
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
   * Broadcast state update to all connected clients
   */
  broadcast(type: StateType, data: any) {
    const update: StateUpdate = {
      type,
      data,
      timestamp: Date.now(),
      id: `${type}-${Date.now()}-${Math.random()}`
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      // Send via WebSocket immediately
      this.sendMessage({ type: 'sync', action: 'broadcast', data: update });
    } else {
      // Queue for later
      this.pendingUpdates.push(update);
    }

    // Also handle locally
    this.handleStateUpdate(update);
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const realtimeSyncManager = new RealtimeSyncManager();
