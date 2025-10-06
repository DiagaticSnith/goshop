const s = require('./service');

function run(){
  console.log('Orders & Payment smoke test');
  try{
    const order = s.createOrder({userId:'u1', items:[{id:1,price:100}], address:{line:'123 Street'}});
    console.log('created', order);
    const res = s.payOrder(order.id, 'tok_test_visa');
    console.log('paid', res.charge);
    console.log('order after pay', s.getOrder(order.id));
    console.log('Orders & Payment smoke test passed');
  }catch(e){
    console.error('Orders smoke failed:', e.message);
    process.exit(1);
  }
}

run();
