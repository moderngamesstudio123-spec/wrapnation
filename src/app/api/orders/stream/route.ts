import { NextRequest } from 'next/server';
import { sseBroker } from '@/lib/sse/broker';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    start(controller) {
      let isClosed = false;

      const safeEnqueue = (payload: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          isClosed = true;
        }
      };

      // 1. Send initial connected notification
      safeEnqueue(`event: CONNECTED\ndata: {"time":"${new Date().toISOString()}"}\n\n`);

      let unsubscribe: () => void;

      if (orderId) {
        // Customer tracking a specific order
        unsubscribe = sseBroker.subscribeOrder(orderId, (data) => {
          safeEnqueue(data);
        });
      } else {
        // Admin POS live feed
        unsubscribe = sseBroker.subscribeAdmin((data) => {
          safeEnqueue(data);
        });
      }

      // Heartbeat every 15 seconds to prevent timeout on mobile / proxies
      const heartbeatInterval = setInterval(() => {
        safeEnqueue(': heartbeat\n\n');
      }, 15000);

      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Pragma': 'no-cache',
    },
  });
}
