const http = require('http');
const {list, addToCart, removeFromCart, toggleFavorite} = require('./service');

function parseJson(req){
  return new Promise((resolve,reject)=>{let body=''; req.on('data',c=>body+=c); req.on('end',()=>{ if(!body) return resolve({}); try{ resolve(JSON.parse(body)); }catch(e){ reject(e); } });});
}

function createServer(){
  return http.createServer(async (req,res)=>{
    const url = new URL(req.url, `http://localhost`);
    try{
      if(req.method==='GET' && url.pathname==='/products'){
        const q = url.searchParams.get('q'); const sortBy = url.searchParams.get('sortBy');
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(list({q, sortBy}))); return;
      }
      if(req.method==='POST' && url.pathname==='/cart'){
        const {userId, productId} = await parseJson(req);
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(addToCart(userId, productId))); return;
      }
      if(req.method==='DELETE' && url.pathname==='/cart'){
        const {userId, productId} = await parseJson(req);
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(removeFromCart(userId, productId))); return;
      }
      if(req.method==='POST' && url.pathname==='/favorite'){
        const {userId, productId} = await parseJson(req);
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(toggleFavorite(userId, productId))); return;
      }
      res.writeHead(404); res.end('Not found');
    }catch(e){ res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error: e.message})); }
  });
}

if(require.main===module){ const port = process.env.PORT || 3002; createServer().listen(port, ()=>console.log('Products server',port)); }
module.exports = {createServer};
