const http = require('http');
const {register, login, verifyToken, logout} = require('./service');

function parseJson(req){
  return new Promise((resolve,reject)=>{
    let body=''; req.on('data',c=>body+=c); req.on('end',()=>{ if(!body) return resolve({}); try{ resolve(JSON.parse(body)); }catch(e){ reject(e); } });
  });
}

function createServer(){
  return http.createServer(async (req,res)=>{
    const url = new URL(req.url, `http://localhost`);
    try{
      if(req.method==='POST' && url.pathname==='/register'){
        const body = await parseJson(req);
        const u = register(body);
        res.writeHead(201,{'Content-Type':'application/json'}); res.end(JSON.stringify(u));
        return;
      }
      if(req.method==='POST' && url.pathname==='/login'){
        const body = await parseJson(req);
        const r = login(body);
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(r));
        return;
      }
      if(req.method==='GET' && url.pathname==='/verify'){
        const token = url.searchParams.get('token');
        const p = verifyToken(token);
        res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify(p));
        return;
      }
      if(req.method==='POST' && url.pathname==='/logout'){
        logout(); res.writeHead(200); res.end('ok'); return;
      }
      res.writeHead(404); res.end('Not found');
    }catch(e){ res.writeHead(400,{'Content-Type':'application/json'}); res.end(JSON.stringify({error: e.message})); }
  });
}

if(require.main===module){
  const port = process.env.PORT || 3001; const srv = createServer(); srv.listen(port, ()=>console.log(`Auth server listening ${port}`));
}

module.exports = {createServer};
