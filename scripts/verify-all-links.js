const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('=== VERIFYING ALL WRAP NATION ROUTES & LINKS ===\n');

  const publicRoutes = [
    { path: '/', expected: 200, name: 'Landing / Home Page' },
    { path: '/takeaway', expected: 307, name: 'Takeaway Redirect to Menu' },
    { path: '/menu', expected: 200, name: 'Customer Menu Page' },
    { path: '/cart', expected: 200, name: 'Customer Cart Page' },
    { path: '/login', expected: 200, name: 'Login Page (Admin & Staff)' },
    { path: '/change-password', expected: 200, name: 'Password Change Page' },
  ];

  const protectedRoutes = [
    { path: '/admin', expected: 307, name: 'Admin Dashboard (Unauthenticated -> /login)' },
    { path: '/admin/billing', expected: 307, name: 'Admin Quick Billing (Unauthenticated)' },
    { path: '/admin/menu', expected: 307, name: 'Admin Menu Manager (Unauthenticated)' },
    { path: '/admin/tables', expected: 307, name: 'Admin Tables & QR (Unauthenticated)' },
    { path: '/admin/reports', expected: 307, name: 'Admin Reports (Unauthenticated)' },
    { path: '/admin/settings', expected: 307, name: 'Admin Settings (Unauthenticated)' },
  ];

  const apiRoutes = [
    { path: '/api/menu', expected: 200, name: 'Public Menu API' },
    { path: '/api/settings', expected: 200, name: 'Public Settings API' },
    { path: '/api/auth/me', expected: 401, name: 'Auth Check API (No cookie -> 401)' },
    { path: '/api/orders', expected: 401, name: 'Orders API (No cookie -> 401)' },
    { path: '/api/tables/qr', expected: 401, name: 'Table QR API (No cookie -> 401)' },
  ];

  let hasFailure = false;

  console.log('1. Testing Public Pages:');
  for (const r of publicRoutes) {
    const res = await fetch(`${BASE_URL}${r.path}`, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    const ok = res.status === r.expected || (r.expected === 307 && (res.status === 302 || res.status === 307 || res.status === 308));
    if (!ok) hasFailure = true;
    console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'} [${res.status}] ${r.name} (${r.path}) ${loc ? '-> ' + loc : ''}`);
  }

  console.log('\n2. Testing Protected Pages (Redirect to /login):');
  for (const r of protectedRoutes) {
    const res = await fetch(`${BASE_URL}${r.path}`, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    const ok = res.status === 307 || res.status === 302 || res.status === 308;
    if (!ok) hasFailure = true;
    console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'} [${res.status}] ${r.name} (${r.path}) ${loc ? '-> ' + loc : ''}`);
  }

  console.log('\n3. Testing Core APIs:');
  for (const r of apiRoutes) {
    const res = await fetch(`${BASE_URL}${r.path}`);
    const ok = res.status === r.expected;
    if (!ok) hasFailure = true;
    console.log(`  ${ok ? '✓ PASS' : '✗ FAIL'} [${res.status}] ${r.name} (${r.path})`);
  }

  console.log('\n4. Testing Authentication Flow (Login as Owner & Staff):');
  // Login as Owner
  const ownerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@wrapnation.com', password: 'Owner@123456' }),
  });
  const ownerCookie = ownerLoginRes.headers.get('set-cookie');
  const ownerJson = await ownerLoginRes.json();
  console.log(`  Owner Login: [${ownerLoginRes.status}] ${ownerJson.user?.email || ownerJson.error} (Role: ${ownerJson.user?.role})`);

  if (ownerCookie) {
    // Test access to /admin with owner cookie
    const adminRes = await fetch(`${BASE_URL}/admin`, {
      headers: { cookie: ownerCookie },
      redirect: 'manual'
    });
    console.log(`  Owner Access to /admin: [${adminRes.status}] (Expected: 200)`);
    
    // Test access to /api/tables/qr
    const qrRes = await fetch(`${BASE_URL}/api/tables/qr`, {
      headers: { cookie: ownerCookie }
    });
    const qrData = await qrRes.json();
    console.log(`  Owner Access to Table QRs: [${qrRes.status}] Found ${qrData.tables?.length || 0} tables`);
    if (qrData.tables && qrData.tables.length > 0) {
      const sampleTable = qrData.tables[0];
      console.log(`    Sample Table #${sampleTable.tableNumber} Token Link: /t/${sampleTable.signedToken}`);
      
      // Test the Table Token Route /t/[token]
      const tokenPageRes = await fetch(`${BASE_URL}/t/${sampleTable.signedToken}`, { redirect: 'manual' });
      console.log(`    Testing Customer Table QR /t/${sampleTable.signedToken}: [${tokenPageRes.status}] -> Location: ${tokenPageRes.headers.get('location') || 'Rendered'}`);
    }
  }

  // Login as Staff
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@wrapnation.com', password: 'Staff@123456' }),
  });
  const staffCookie = staffLoginRes.headers.get('set-cookie');
  const staffJson = await staffLoginRes.json();
  console.log(`  Staff Login: [${staffLoginRes.status}] ${staffJson.user?.email || staffJson.error} (Role: ${staffJson.user?.role})`);

  console.log('\n5. Testing End-to-End Customer Order Placement:');
  // Create an order via API
  const menuRes = await fetch(`${BASE_URL}/api/menu`);
  const menuData = await menuRes.json();
  const firstCategory = menuData.categories?.[0];
  const firstItem = firstCategory?.items?.[0];

  if (firstItem) {
    const orderPayload = {
      type: 'TAKEAWAY',
      customerName: 'Aman Test',
      customerPhone: '9876543210',
      paymentMethod: 'UPI',
      cookingNote: 'Extra spicy wrap test',
      items: [
        {
          menuItemId: firstItem.id,
          quantity: 1,
          variantId: firstItem.variants?.[0]?.id || null,
          addOnIds: [],
        }
      ]
    };

    const placeOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const orderCreated = await placeOrderRes.json();
    const orderToken = orderCreated.order?.takeawayToken || orderCreated.order?.orderNumber;
    const trackingId = orderCreated.order?.id;
    console.log(`  Place Order Result: [${placeOrderRes.status}] Order Token: ${orderToken} ID: ${trackingId}`);
    
    if (trackingId) {
      const trackingPageRes = await fetch(`${BASE_URL}/order/${trackingId}`);
      console.log(`  Order Tracking Page (/order/${trackingId}): [${trackingPageRes.status}] (Expected 200)`);
    }
  }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
}

main().catch(console.error);
