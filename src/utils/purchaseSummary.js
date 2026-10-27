function escapeCsvValue(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function createPurchaseSummaryCsv(orders, { productName, statusName }) {
  const rows = [[
    'Order ID',
    'Date',
    'Status',
    'Product',
    'Quantity',
    'Unit price (RWF)',
    'Line total (RWF)',
    'Order total (RWF)',
    'Payment method',
  ]];

  orders.forEach((order) => {
    order.items.forEach((item) => {
      rows.push([
        order.id,
        new Date(order.date).toISOString().slice(0, 10),
        statusName(order.status),
        productName(item),
        item.quantity,
        item.price,
        item.price * item.quantity,
        order.total,
        order.paymentMethod,
      ]);
    });
  });

  return `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')}`;
}
