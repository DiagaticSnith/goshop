// Simple product service with in-memory data
const products = [
  {id:1, title:'Apple', price:100, createdAt: '2025-01-01'},
  {id:2, title:'Banana', price:50, createdAt: '2025-06-01'},
  {id:3, title:'Carrot', price:30, createdAt: '2025-07-01'}
];
const carts = {};
const favorites = {};

function list({q, sortBy} = {}){
  let res = products.slice();
  if(q) res = res.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
  if(sortBy === 'price_asc') res.sort((a,b)=>a.price-b.price);
  if(sortBy === 'price_desc') res.sort((a,b)=>b.price-a.price);
  if(sortBy === 'newest') res.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  return res;
}

function addToCart(userId, productId){
  carts[userId] = carts[userId] || [];
  if(!carts[userId].includes(productId)) carts[userId].push(productId);
  return carts[userId];
}

function removeFromCart(userId, productId){
  carts[userId] = (carts[userId] || []).filter(id=>id!==productId);
  return carts[userId]||[];
}

function toggleFavorite(userId, productId){
  favorites[userId] = favorites[userId] || new Set();
  if(favorites[userId].has(productId)) favorites[userId].delete(productId);
  else favorites[userId].add(productId);
  return Array.from(favorites[userId]);
}

module.exports = {list, addToCart, removeFromCart, toggleFavorite, _internals:{products,carts,favorites}};
