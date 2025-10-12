import prismaClient from '../config/prisma-client';
const prisma: any = prismaClient as any;

async function main() {
  console.log('Starting population script...');

  // Update up to 50 products with random values for new fields
  const products = await prisma.product.findMany({ take: 50 });
  console.log(`Found ${products.length} products`);

  const updatePromises = products.map((p: any, idx: number) => {
    const weight = parseFloat((Math.random() * 10).toFixed(2));
    const width = parseFloat((Math.random() * 200).toFixed(1));
    const height = parseFloat((Math.random() * 200).toFixed(1));
    const brands = ['Acme', 'Globex', 'Umbrella', 'Initech', 'FalsoBrand'];
    const materials = ['Wood', 'Metal', 'Plastic', 'Leather', 'Fabric'];
    return prisma.product.update({
      where: { id: p.id },
      data: {
        weight,
        width,
        height,
        brand: brands[idx % brands.length],
        material: materials[idx % materials.length]
      } as any
    });
  });

  await Promise.all(updatePromises);
  console.log('Products updated with new fields.');

  // For existing orders, create OrderDetails entries summarizing items totalQuantity/totalPrice
  const orders = await prisma.order.findMany({ include: { user: true } });
  console.log(`Found ${orders.length} orders`);

  for (const order of orders) {
    const existing = await (prisma.orderDetails?.findMany ? prisma.orderDetails.findMany({ where: { orderId: order.id } }) : []);
    if (existing.length > 0) continue;

    let items: any[] = [];
    try {
      items = JSON.parse(order.items as any);
    } catch (e) {
      items = [];
    }

    if (items.length === 0) {
      await prisma.orderDetails.create({
        data: {
          orderId: order.id,
          productId: (await prisma.product.findFirst())?.id || '',
          totalQuantity: 1,
          totalPrice: order.amount
        }
      });
    } else {
      for (const it of items) {
        const productId = it.id || it.productId || it.product?.id;
        const qty = it.quantity || it.qty || (it.product ? it.product.quantity : 1);
        const unitPrice = it.price || it.unitPrice || it.product?.price || (order.amount / Math.max(1, items.length));
        if (!productId) continue;
        await prisma.orderDetails.create({
          data: {
            orderId: order.id,
            productId: productId,
            totalQuantity: qty || 1,
            totalPrice: (unitPrice || 0) * (qty || 1)
          }
        });
      }
    }
  }

  console.log('OrderDetails populated.');
}

main()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
