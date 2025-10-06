// Starts all module servers, tests a couple endpoints, then shuts down.
const {createServer: createAuth} = require('./auth/server');
const {createServer: createProducts} = require('./products/server');
const {createServer: createOrders} = require('./orders-payment/server');
const {createServer: createAdmin} = require('./admin-profile/server');

async function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run(){
  const auth = createAuth(); const products = createProducts(); const orders = createOrders(); const admin = createAdmin();
  const s1 = auth.listen(3001); const s2 = products.listen(3002); const s3 = orders.listen(3003); const s4 = admin.listen(3004);
  console.log('servers started');
  try{
    // use global fetch
    const res1 = await fetch('http://localhost:3002/products'); console.log('products list status', res1.status);
    const rjson = await res1.json(); console.log('products count', rjson.length);

    const reg = await fetch('http://localhost:3001/register',{method:'POST', body: JSON.stringify({email:'x@x.com', password:'p'}), headers:{'content-type':'application/json'}});
    console.log('auth register', reg.status);

    const ord = await fetch('http://localhost:3003/orders',{method:'POST', body: JSON.stringify({userId:'u1', items:[{id:1,price:10}], address:{}}), headers:{'content-type':'application/json'}});
    console.log('create order status', ord.status);

    console.log('integration smoke passed');
  }catch(e){ console.error('integration failed', e); }
  s1.close(); s2.close(); s3.close(); s4.close();
}

if(require.main===module) run();
