import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import { config } from './config';

export interface KitchenSlipData {
  slipType: 'KITCHEN';
  orderNumber: number;
  takeawayToken?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: number | null;
  createdAt: string;
  cookingNote?: string | null;
  items: Array<{
    itemName: string;
    variantName?: string | null;
    addOns: string[];
    quantity: number;
    notes?: string | null;
  }>;
  paperWidth?: '80' | '58';
}

export interface CustomerBillData {
  slipType: 'CUSTOMER_BILL';
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  gstin?: string | null;
  gstEnabled: boolean;
  gstPercentage: number;
  orderNumber: number;
  takeawayToken?: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  createdAt: string;
  items: Array<{
    itemName: string;
    variantName?: string | null;
    addOns: Array<{ name: string; price: number }>;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  subtotalFormatted: string;
  taxFormatted: string;
  totalFormatted: string;
  paymentMethod: string;
  paymentStatus: string;
  utr?: string | null;
  paperWidth?: '80' | '58';
}

export function printMockKitchenSlip(data: KitchenSlipData): void {
  const token = data.takeawayToken || `#${data.orderNumber}`;
  const width = data.paperWidth === '58' ? 32 : 48;
  const divider = '='.repeat(width);
  const subDivider = '-'.repeat(width);

  console.log('\n' + divider);
  console.log(`*** KITCHEN SLIP ***`.padStart(Math.floor((width + 20) / 2)));
  console.log(`ORDER: ${token}  [${data.orderType}]`.padStart(Math.floor((width + 22) / 2)));
  if (data.tableNumber) {
    console.log(`TABLE #${data.tableNumber}`.padStart(Math.floor((width + 10) / 2)));
  }
  console.log(`Time: ${new Date(data.createdAt).toLocaleTimeString('en-IN')}`);
  console.log(subDivider);

  for (const item of data.items) {
    console.log(`${item.quantity}x ${item.itemName.toUpperCase()}`);
    if (item.variantName) {
      console.log(`   * ${item.variantName}`);
    }
    for (const addon of item.addOns) {
      console.log(`   + ${addon}`);
    }
  }

  if (data.cookingNote) {
    console.log(subDivider);
    console.log(`NOTE: ${data.cookingNote}`);
  }

  console.log(divider);
  console.log(`[CUT PAPER]`.padStart(Math.floor((width + 11) / 2)));
  console.log(divider + '\n');
}

export function printMockCustomerBill(data: CustomerBillData): void {
  const token = data.takeawayToken || `#${data.orderNumber}`;
  const width = data.paperWidth === '58' ? 32 : 48;
  const divider = '='.repeat(width);
  const subDivider = '-'.repeat(width);

  console.log('\n' + divider);
  console.log(`${data.shopName.toUpperCase()}`.padStart(Math.floor((width + data.shopName.length) / 2)));
  console.log(`${data.shopAddress}`);
  console.log(`Tel: ${data.shopPhone}`);
  if (data.gstin) {
    console.log(`GSTIN: ${data.gstin}`);
  }
  console.log(subDivider);
  console.log(`Token: ${token} | Date: ${new Date(data.createdAt).toLocaleDateString('en-IN')} ${new Date(data.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  console.log(`Type: ${data.orderType} ${data.tableNumber ? `(Table ${data.tableNumber})` : ''}`);
  if (data.customerName) {
    console.log(`Customer: ${data.customerName} (${data.customerPhone || 'N/A'})`);
  }
  console.log(subDivider);

  for (const item of data.items) {
    const itemTotal = (item.subtotal / 100).toFixed(2);
    console.log(`${item.itemName} x${item.quantity}`.padEnd(width - itemTotal.length) + itemTotal);
    if (item.variantName) {
      console.log(`  • ${item.variantName}`);
    }
    for (const addon of item.addOns) {
      console.log(`  + ${addon.name}`);
    }
  }

  console.log(subDivider);
  console.log(`Subtotal:`.padEnd(width - data.subtotalFormatted.length) + data.subtotalFormatted);
  if (data.tax > 0) {
    console.log(`GST Tax:`.padEnd(width - data.taxFormatted.length) + data.taxFormatted);
  }
  console.log(`TOTAL:`.padEnd(width - data.totalFormatted.length) + data.totalFormatted);
  console.log(`Payment: ${data.paymentMethod} (${data.paymentStatus})`);
  if (data.utr) {
    console.log(`Ref / UTR: ${data.utr}`);
  }
  console.log(subDivider);
  console.log(`*** THANK YOU, VISIT AGAIN ***`.padStart(Math.floor((width + 30) / 2)));
  console.log(divider);
  console.log(`[CUT PAPER]`.padStart(Math.floor((width + 11) / 2)));
  console.log(divider + '\n');
}

export async function printJob(payloadJson: string): Promise<boolean> {
  const data = JSON.parse(payloadJson);

  if (config.printerInterface === 'mock') {
    if (data.slipType === 'KITCHEN') {
      printMockKitchenSlip(data);
    } else {
      printMockCustomerBill(data);
    }
    return true;
  }

  // Physical ESC/POS printer driver execution
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: config.printerInterface,
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      lineCharacter: '=',
      breakLine: BreakLine.WORD,
      width: config.printerWidth === '58' ? 32 : 48,
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error(`Thermal printer at "${config.printerInterface}" is not connected.`);
    }

    if (data.slipType === 'KITCHEN') {
      const token = data.takeawayToken || `#${data.orderNumber}`;
      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.setTextDoubleWidth();
      printer.bold(true);
      printer.println('KITCHEN SLIP');
      printer.println(token);
      printer.setTextNormal();
      printer.bold(false);
      printer.println(`Type: ${data.orderType} ${data.tableNumber ? `(Table ${data.tableNumber})` : ''}`);
      printer.println(new Date(data.createdAt).toLocaleTimeString('en-IN'));
      printer.drawLine();

      printer.alignLeft();
      for (const item of data.items) {
        printer.bold(true);
        printer.println(`${item.quantity}x ${item.itemName.toUpperCase()}`);
        printer.bold(false);
        if (item.variantName) {
          printer.println(`   * ${item.variantName}`);
        }
        for (const addon of item.addOns) {
          printer.println(`   + ${addon}`);
        }
      }

      if (data.cookingNote) {
        printer.drawLine();
        printer.bold(true);
        printer.println(`NOTE: ${data.cookingNote}`);
        printer.bold(false);
      }

      printer.cut();
    } else {
      // Customer Bill
      const token = data.takeawayToken || `#${data.orderNumber}`;
      printer.alignCenter();
      printer.bold(true);
      printer.println(data.shopName);
      printer.bold(false);
      printer.println(data.shopAddress);
      printer.println(`Phone: ${data.shopPhone}`);
      if (data.gstin) {
        printer.println(`GSTIN: ${data.gstin}`);
      }
      printer.drawLine();

      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.bold(true);
      printer.println(`TOKEN: ${token}`);
      printer.setTextNormal();
      printer.bold(false);
      printer.println(`Type: ${data.orderType} ${data.tableNumber ? `(Table ${data.tableNumber})` : ''}`);
      printer.println(new Date(data.createdAt).toLocaleString('en-IN'));
      printer.drawLine();

      printer.alignLeft();
      for (const item of data.items) {
        printer.tableCustom([
          { text: `${item.itemName} x${item.quantity}`, align: 'LEFT', width: 0.7 },
          { text: (item.subtotal / 100).toFixed(2), align: 'RIGHT', width: 0.3 },
        ]);
        if (item.variantName) {
          printer.println(`  * ${item.variantName}`);
        }
        for (const addon of item.addOns) {
          printer.println(`  + ${addon.name}`);
        }
      }

      printer.drawLine();
      printer.tableCustom([
        { text: 'Subtotal:', align: 'LEFT', width: 0.6 },
        { text: data.subtotalFormatted, align: 'RIGHT', width: 0.4 },
      ]);
      if (data.tax > 0) {
        printer.tableCustom([
          { text: 'GST Tax:', align: 'LEFT', width: 0.6 },
          { text: data.taxFormatted, align: 'RIGHT', width: 0.4 },
        ]);
      }
      printer.bold(true);
      printer.tableCustom([
        { text: 'TOTAL:', align: 'LEFT', width: 0.6 },
        { text: data.totalFormatted, align: 'RIGHT', width: 0.4 },
      ]);
      printer.bold(false);
      printer.println(`Mode: ${data.paymentMethod} (${data.paymentStatus})`);
      if (data.utr) {
        printer.println(`UTR: ${data.utr}`);
      }
      printer.drawLine();
      printer.alignCenter();
      printer.println('*** THANK YOU, VISIT AGAIN ***');
      printer.cut();
    }

    await printer.execute();
    return true;
  } catch (err) {
    console.error('Thermal printer hardware error:', err);
    throw err;
  }
}
