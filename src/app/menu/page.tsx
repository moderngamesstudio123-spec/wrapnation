import React from 'react';
import { getPublicMenu } from '@/server/services/menuService';
import { getSettings } from '@/server/services/settingService';
import MenuView from './MenuView';


export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const [categories, settings] = await Promise.all([
    getPublicMenu(),
    getSettings(),
  ]);

  return (
    <MenuView
      initialCategories={categories}
      shopName={settings.shopName}
      shopPhone={settings.shopPhone}
      shopAddress={settings.shopAddress}
    />
  );
}
