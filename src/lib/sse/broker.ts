/**
 * In-memory Server-Sent Events (SSE) broker.
 * NOTE: This is per-process only and acts as an optional accelerator for single-instance
 * Node.js servers. On serverless hosting (e.g. Vercel), client polling is the primary source
 * of reliability across distributed lambdas.
 */

type SSEListener = (data: string) => void;

class SSEBroker {
  private adminListeners: Set<SSEListener> = new Set();
  private orderListeners: Map<string, Set<SSEListener>> = new Map();

  subscribeAdmin(listener: SSEListener): () => void {
    this.adminListeners.add(listener);
    return () => {
      this.adminListeners.delete(listener);
    };
  }

  subscribeOrder(orderId: string, listener: SSEListener): () => void {
    if (!this.orderListeners.has(orderId)) {
      this.orderListeners.set(orderId, new Set());
    }
    const set = this.orderListeners.get(orderId)!;
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.orderListeners.delete(orderId);
      }
    };
  }

  broadcast(event: string, payload: unknown, targetOrderId?: string): void {
    const formatted = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;

    // 1. Notify all admin POS listeners
    for (const listener of this.adminListeners) {
      try {
        listener(formatted);
      } catch (e) {
        console.error('SSE admin listener dispatch failed:', e);
      }
    }

    // 2. If targetOrderId is provided, notify specific customer tracking listeners
    if (targetOrderId && this.orderListeners.has(targetOrderId)) {
      const set = this.orderListeners.get(targetOrderId)!;
      for (const listener of set) {
        try {
          listener(formatted);
        } catch (e) {
          console.error('SSE order listener dispatch failed:', e);
        }
      }
    }
  }

  getAdminSubscriberCount(): number {
    return this.adminListeners.size;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __wrapNationSSEBroker: SSEBroker | undefined;
}

export const sseBroker: SSEBroker =
  globalThis.__wrapNationSSEBroker || new SSEBroker();

if (!globalThis.__wrapNationSSEBroker) {
  globalThis.__wrapNationSSEBroker = sseBroker;
}

export default sseBroker;
