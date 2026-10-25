import React from 'react';
import { verifyTableToken } from '@/lib/security/hmac';
import TableTokenClientHandler from './TableTokenClientHandler';
import Link from 'next/link';
import { AlertCircle, QrCode } from 'lucide-react';

export default async function TableQRPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const verification = verifyTableToken(token);

  if (!verification.valid || !verification.tableNumber) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white border border-rose-200 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-rose-600">Invalid Table QR Code</h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The scanned table security token is invalid, expired, or has been tampered with. For your security and accurate order delivery, please scan the QR code sticker placed on your table using your phone camera.
          </p>
          <div className="pt-2">
            <Link
              href="/takeaway"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-sm shadow-md transition"
            >
              <QrCode className="w-4 h-4" />
              Order as Takeaway Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TableTokenClientHandler
      token={token}
      tableNumber={verification.tableNumber}
    />
  );
}
