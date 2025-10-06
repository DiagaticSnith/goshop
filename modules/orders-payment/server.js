const http = require('http');
const {createOrder, payOrder, getOrder} = require('./service');

function parseJson(req){
  return new Promise((resolve,reject)=>{let body=''; req.on('data',c=>body+=c); req.on('end',()=>{ if(!body) return resolve({}); try{ resolve(JSON.parse(body)); }catch(e){ reject(e); } });});
}

function createServer(){
  return http.createServer(async (req,res)=>{
    const url = new URL(req.url, `http://localhost`);
    try{
      if(req.method==='POST' && url.pathname==='/orders'){
        const body = await parseJson(req); const o = createOrder(body); res.writeHead(201,{'Content-Type':'application/json'}); res.end(JSON.stringify(o)); return;
      }
      if(req.method==='POST' && url.pathname.startsWith('/pay')){
        const body = await parseJson(req); const {orderId, source} = body; const r = payOrder(orderId, source); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(r)); return;
      }
      if(req.method==='GET' && url.pathname==='/orders'){
        const id = Number(url.searchParams.get('id')); const o = getOrder(id); res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(o)); return;
      }
      res.writeHead(404); res.end('Not found');
    }catch(e){ res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error: e.message})); }
  });
}

if(require.main===module){ createServer().listen(process.env.PORT || 3003, ()=>console.log('Orders server')); }
module.exports = {createServer};
