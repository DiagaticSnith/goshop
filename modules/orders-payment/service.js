// Simple order + mock payment service
let orders = [];

function createOrder({userId, items, address}){
  if(!items || items.length===0) throw new Error('No items');
  const total = items.reduce((s,i)=>s+i.price,0);
  const order = {id: orders.length+1, userId, items, address, total, status:'pending', createdAt: new Date().toISOString()};
  orders.push(order);
  return order;
}

// Mock stripe charge
function chargeCard({amount, source}){
  // simulate network delay
  if(!source) throw new Error('No payment source');
  return {id: 'ch_'+Math.random().toString(36).slice(2,9), amount, status:'succeeded'};
}

function payOrder(orderId, paymentSource){
  const order = orders.find(o=>o.id===orderId);
  if(!order) throw new Error('Order not found');
  const charge = chargeCard({amount: order.total, source: paymentSource});
  if(charge.status==='succeeded') order.status='paid';
  return {order, charge};
}

function getOrder(orderId){
  return orders.find(o=>o.id===orderId);
}

module.exports = {createOrder, payOrder, getOrder, _internals:{orders}};
