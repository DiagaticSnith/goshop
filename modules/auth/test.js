const service = require('./service');

function run(){
  console.log('Auth module smoke test');
  try{
    const u = service.register({email:'a@test.com', password:'pass', role:'user'});
    console.log('registered', u);
    const login = service.login({email:'a@test.com', password:'pass'});
    console.log('login ok', login.user);
    const payload = service.verifyToken(login.token);
    console.log('token payload', payload);
    console.log('logout', service.logout());
    // role test
    const admin = service.register({email:'admin@test.com', password:'pass', role:'admin'});
    const l2 = service.login({email:'admin@test.com', password:'pass'});
    console.log('admin token', service.verifyToken(l2.token));
    console.log('Auth smoke test passed');
  }catch(e){
    console.error('Auth smoke failed:', e.message);
    process.exit(1);
  }
}

run();
