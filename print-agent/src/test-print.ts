import { printJob } from './printer';

async function runTestPrint() {
  console.log('Running Wrap Nation Thermal Printer Test...\n');

  // Sample Kitchen Slip
  const kitchenPayload = {
    slipType: 'KITCHEN',
    orderNumber: 101,
    takeawayToken: null,
    orderType: 'DINE_IN',
    tableNumber: 3,
    createdAt: new Date().toISOString(),
    cookingNote: 'Extra crispy chicken, less spicy please',
    items: [
      {
        itemName: 'Chicken Wrap',
        variantName: 'Combo (Adds Fries + Cold Drink)',
        addOns: ['Extra Cheese'],
        quantity: 2,
      },
      {
        itemName: 'Peri Peri Fries',
        addOns: ['Extra Mayonnaise'],
        quantity: 1,
      },
    ],
    paperWidth: '80',
  };

  // Sample Customer Bill
  const billPayload = {
    slipType: 'CUSTOMER_BILL',
    shopName: 'Wrap Nation',
    shopAddress: 'Shop 4, Food Street, Indiranagar, Bengaluru',
    shopPhone: '+91 98765 43210',
    gstin: '29AAAAA0000A1Z5',
    gstEnabled: true,
    gstPercentage: 5,
    orderNumber: 101,
    takeawayToken: null,
    orderType: 'DINE_IN',
    tableNumber: 3,
    createdAt: new Date().toISOString(),
    items: [
      {
        itemName: 'Chicken Wrap',
        variantName: 'Combo (Adds Fries + Cold Drink)',
        addOns: [{ name: 'Extra Cheese', price: 1000 }],
        quantity: 2,
        unitPrice: 20000,
        subtotal: 40000,
      },
      {
        itemName: 'Peri Peri Fries',
        variantName: null,
        addOns: [{ name: 'Extra Mayonnaise', price: 1000 }],
        quantity: 1,
        unitPrice: 10000,
        subtotal: 10000,
      },
    ],
    subtotal: 50000,
    tax: 2500,
    total: 52500,
    subtotalFormatted: '₹500.00',
    taxFormatted: '₹25.00',
    totalFormatted: '₹525.00',
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    utr: '492198421092',
    paperWidth: '80',
  };

  console.log('1. PRINTING TEST KITCHEN SLIP:');
  await printJob(JSON.stringify(kitchenPayload));

  console.log('2. PRINTING TEST CUSTOMER BILL:');
  await printJob(JSON.stringify(billPayload));

  console.log('Test print completed successfully!');
}

runTestPrint().catch((err) => {
  console.error('Test print failed:', err);
});
