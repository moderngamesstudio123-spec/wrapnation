import React from 'react';
import OrderTrackingView from './OrderTrackingView';


export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderTrackingView orderId={id} />;
}
