import { useEffect, useRef } from 'react'
import websocketService, { WebSocketEvent } from '@/services/websocket.service'
import { useAuthStore } from '@/store/authStore'

/**
 * Hook to listen to WebSocket events
 * @param event - The WebSocket event to listen to
 * @param callback - Callback function when event is received
 */
export function useWebSocketEvent<T = any>(
  event: WebSocketEvent,
  callback: (data: T) => void
): void {
  const callbackRef = useRef(callback)

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const unsubscribe = websocketService.on<T>(event, (data) => {
      callbackRef.current(data)
    })

    return unsubscribe
  }, [event])
}

/**
 * Hook to manage WebSocket connection lifecycle
 */
export function useWebSocketConnection(): {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
} {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = !!user && !!token

  useEffect(() => {
    if (isAuthenticated && token) {
      websocketService.connect(token)
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
      // Only disconnect when user logs out
    }
  }, [isAuthenticated, token])

  return {
    isConnected: websocketService.isConnected(),
    connect: () => websocketService.connect(token || undefined),
    disconnect: () => websocketService.disconnect(),
  }
}

/**
 * Hook to emit WebSocket events
 */
export function useWebSocketEmit() {
  return {
    emit: <T = any>(event: string, data?: T) => {
      websocketService.emit(event, data)
    },
  }
}
