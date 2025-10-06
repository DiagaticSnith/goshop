// Admin CRUD and user profile
let products = [ {id:1, title:'Apple'} ];
let orders = [ {id:1, status:'pending'} ];
let users = [ {id:'u1', email:'u@test.com', name:'User'} ];

function createProduct(data){
  const p = {id: products.length+1, ...data}; products.push(p); return p;
}
function updateProduct(id, data){
  const idx = products.findIndex(p=>p.id===id); if(idx===-1) throw new Error('Not found'); products[idx] = {...products[idx], ...data}; return products[idx];
}
function deleteProduct(id){ products = products.filter(p=>p.id!==id); return true; }

function listOrders(){ return orders; }
function updateOrder(id, data){ const o = orders.find(x=>x.id===id); if(!o) throw new Error('Not found'); Object.assign(o, data); return o; }

function updateProfile(userId, data){ const u = users.find(x=>x.id===userId); if(!u) throw new Error('User not found'); Object.assign(u,data); return u; }

module.exports = {createProduct, updateProduct, deleteProduct, listOrders, updateOrder, updateProfile, _internals:{products,orders,users}};
