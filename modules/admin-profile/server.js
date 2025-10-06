const http = require('http');
const {createProduct, updateProduct, deleteProduct, listOrders, updateOrder, updateProfile} = require('./service');

function parseJson(req){
  return new Promise((resolve,reject)=>{let body=''; req.on('data',c=>body+=c); req.on('end',()=>{ if(!body) return resolve({}); try{ resolve(JSON.parse(body)); }catch(e){ reject(e); } });});
}

function createServer(){
  return http.createServer(async (req,res)=>{
    const url = new URL(req.url, `http://localhost`);
    try{
      if(req.method==='POST' && url.pathname==='/products'){
        const b = await parseJson(req); const p = createProduct(b); res.writeHead(201,{'Content-Type':'application/json'}); res.end(JSON.stringify(p)); return;
      }
      if(req.method==='PUT' && url.pathname.startsWith('/products/')){
        const id = Number(url.pathname.split('/')[2]); const b = await parseJson(req); const p = updateProduct(id,b); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(p)); return;
      }
      if(req.method==='DELETE' && url.pathname.startsWith('/products/')){
        const id = Number(url.pathname.split('/')[2]); deleteProduct(id); res.writeHead(204); res.end(); return;
      }
      if(req.method==='GET' && url.pathname==='/orders'){
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(listOrders())); return;
      }
      if(req.method==='PUT' && url.pathname.startsWith('/orders/')){
        const id = Number(url.pathname.split('/')[2]); const b = await parseJson(req); const o = updateOrder(id,b); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(o)); return;
      }
      if(req.method==='PUT' && url.pathname.startsWith('/profile/')){
        const id = url.pathname.split('/')[2]; const b = await parseJson(req); const u = updateProfile(id,b); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(u)); return;
      }
      res.writeHead(404); res.end('Not found');
    }catch(e){ res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error: e.message})); }
  });
}

if(require.main===module){ createServer().listen(process.env.PORT || 3004, ()=>console.log('Admin server')); }
module.exports = {createServer};
