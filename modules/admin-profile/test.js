const s = require('./service');

function run(){
  console.log('Admin/Profile smoke test');
  try{
    const p = s.createProduct({title:'Banana'});
    console.log('created product', p);
    const up = s.updateProduct(p.id, {title:'Banana Updated'});
    console.log('updated', up);
    s.deleteProduct(p.id);
    console.log('deleted, remaining products', s._internals.products);
    console.log('orders', s.listOrders());
    console.log('update order', s.updateOrder(1, {status:'shipped'}));
    console.log('update profile', s.updateProfile('u1', {name:'New Name'}));
    console.log('Admin/Profile smoke test passed');
  }catch(e){
    console.error('Admin/Profile smoke failed:', e.message);
    process.exit(1);
  }
}

run();
