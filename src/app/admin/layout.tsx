import React from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';
import { Role } from '@prisma/client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Strict separation: If user is STAFF, redirect to dedicated Staff Orders board!
  if (user.role === Role.STAFF) {
    redirect('/staff/orders');
  }

  if (user.mustChangePassword) {
    redirect('/change-password');
  }

  return (
    <AdminLayoutClient
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
