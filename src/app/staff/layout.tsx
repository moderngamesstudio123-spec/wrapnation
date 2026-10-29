import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import StaffNav from './StaffNav';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 flex flex-col">
      <StaffNav
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      />
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

