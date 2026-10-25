import dotenv from 'dotenv';
dotenv.config();

export const config = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
  printerKey: process.env.PRINTER_KEY || 'wn_print_agent_secret_key_prod_80mm',
  printerInterface: process.env.PRINTER_INTERFACE || 'mock', // 'mock', 'tcp://192.168.1.200', '//./COM3'
  printerWidth: (process.env.PRINTER_WIDTH === '58' ? '58' : '80') as '80' | '58',
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '2500', 10),
  heartbeatIntervalMs: 15000,
};
