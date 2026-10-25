import React from 'react';
import { requireAuth } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import AdminNav from './AdminNav';


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect('/login');
  }

  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-neutral-900 flex flex-col">
      <AdminNav
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
