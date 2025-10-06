const s = require('./service');

function run(){
  console.log('Products smoke test');
  try{
    console.log('all', s.list());
    console.log('search b', s.list({q:'b'}));
    console.log('sort price asc', s.list({sortBy:'price_asc'}));
    console.log('add to cart', s.addToCart('u1', 2));
    console.log('add to cart again', s.addToCart('u1', 3));
    console.log('remove from cart', s.removeFromCart('u1',2));
    console.log('toggle fav', s.toggleFavorite('u1',1));
    console.log('toggle fav again', s.toggleFavorite('u1',1));
    console.log('Products smoke test passed');
  }catch(e){
    console.error('Products smoke failed:', e.message);
    process.exit(1);
  }
}

run();
