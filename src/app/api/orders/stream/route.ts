import { NextRequest } from 'next/server';
import { sseBroker } from '@/lib/sse/broker';


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    start(controller) {
      // 1. Send initial connected notification
      controller.enqueue(encoder.encode(`event: CONNECTED\ndata: {"time":"${new Date().toISOString()}"}\n\n`));

      let unsubscribe: () => void;

      if (orderId) {
        // Customer tracking a specific order
        unsubscribe = sseBroker.subscribeOrder(orderId, (data) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {}
        });
      } else {
        // Admin POS live feed
        unsubscribe = sseBroker.subscribeAdmin((data) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {}
        });
      }

      // Heartbeat every 20 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
