import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000'

export type WebSocketEvent =
  | 'leaderboard:update'
  | 'submission:new'
  | 'submission:graded'
  | 'exercise:created'
  | 'exercise:updated'
  | 'team:updated'

export interface WebSocketMessage<T = any> {
  event: WebSocketEvent
  data: T
}

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<WebSocketEvent, Set<(data: any) => void>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000

  connect(token?: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected')
      return
    }

    console.log('Connecting to WebSocket:', WS_URL)

    this.socket = io(WS_URL, {
      auth: {
        token: token || localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id)
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Giving up.')
        this.disconnect()
      }
    })

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    // Listen for all registered events
    this.listeners.forEach((_, event) => {
      this.socket?.on(event, (data) => {
        this.notifyListeners(event, data)
      })
    })
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket')
      this.socket.disconnect()
      this.socket = null
    }
  }

  on<T = any>(event: WebSocketEvent, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())

      // Register event listener on socket if connected
      if (this.socket) {
        this.socket.on(event, (data) => {
          this.notifyListeners(event, data)
        })
      }
    }

    const callbacks = this.listeners.get(event)!
    callbacks.add(callback)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
        this.socket?.off(event)
      }
    }
  }

  emit<T = any>(event: string, data?: T): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected. Cannot emit event:', event)
      return
    }

    this.socket.emit(event, data)
  }

  private notifyListeners(event: WebSocketEvent, data: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket listener for ${event}:`, error)
        }
      })
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

// Export singleton instance
const websocketService = new WebSocketService()
export default websocketService
