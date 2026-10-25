import { config } from './config';
import { printJob } from './printer';

interface PrintJobRecord {
  id: string;
  orderId: string;
  slipType: 'KITCHEN' | 'CUSTOMER_BILL';
  payloadJson: string;
}

const processedJobIds = new Set<string>();

async function sendHeartbeat() {
  try {
    const res = await fetch(`${config.serverUrl}/api/printer/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Printer-Key': config.printerKey,
      },
      body: JSON.stringify({
        printerConnected: true,
        paperStatus: 'OK',
      }),
    });
    if (!res.ok) {
      console.warn(`[PrintAgent] Heartbeat warning: Server returned ${res.status}`);
    }
  } catch (err) {
    console.warn('[PrintAgent] Server unreachable for heartbeat.');
  }
}

async function acknowledgeJob(jobId: string, success: boolean, error?: string) {
  try {
    await fetch(`${config.serverUrl}/api/printer/ack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Printer-Key': config.printerKey,
      },
      body: JSON.stringify({ jobId, success, error }),
    });
  } catch (err) {
    console.error(`[PrintAgent] Failed to acknowledge job ${jobId}:`, err);
  }
}

async function pollAndPrint() {
  try {
    const res = await fetch(`${config.serverUrl}/api/printer/jobs`, {
      headers: {
        'X-Printer-Key': config.printerKey,
      },
    });

    if (res.status === 401) {
      console.error('[PrintAgent] ERROR: Invalid printer API key. Please verify PRINTER_KEY.');
      return;
    }

    if (!res.ok) {
      return;
    }

    const data = await res.json();
    const jobs: PrintJobRecord[] = data.jobs || [];

    for (const job of jobs) {
      if (processedJobIds.has(job.id)) {
        continue;
      }

      console.log(`[PrintAgent] Received ${job.slipType} job: ${job.id} for Order ${job.orderId}`);

      try {
        await printJob(job.payloadJson);
        processedJobIds.add(job.id);
        await acknowledgeJob(job.id, true);
        console.log(`[PrintAgent] Successfully printed and acknowledged job ${job.id}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Print execution error';
        console.error(`[PrintAgent] Failed to print job ${job.id}:`, errorMsg);
        await acknowledgeJob(job.id, false, errorMsg);
      }
    }
  } catch {
    // Network or server unreachable - silent wait until next poll
  }
}

async function main() {
  console.log('====================================================');
  console.log('   WRAP NATION — OUTBOUND ESC/POS PRINT AGENT       ');
  console.log('====================================================');
  console.log(`Server URL:        ${config.serverUrl}`);
  console.log(`Printer Interface: ${config.printerInterface}`);
  console.log(`Paper Width:       ${config.printerWidth}mm`);
  console.log(`Poll Interval:     ${config.pollIntervalMs}ms`);
  console.log('Outbound mode active. Waiting for paid order slips...\n');

  // Initial heartbeat
  await sendHeartbeat();

  // Heartbeat loop
  setInterval(sendHeartbeat, config.heartbeatIntervalMs);

  // Print polling loop
  setInterval(pollAndPrint, config.pollIntervalMs);
}

main().catch((err) => {
  console.error('[PrintAgent] Fatal error:', err);
  process.exit(1);
});
