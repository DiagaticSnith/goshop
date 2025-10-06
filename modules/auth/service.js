// Simple in-memory auth service for testing
// Lightweight token helpers for smoke tests (not secure)
const SECRET = 'test-secret';

function sign(payload){
  // naive base64 JSON token: <payload>.<secret>
  const p = Buffer.from(JSON.stringify(payload)).toString('base64');
  const s = Buffer.from(SECRET).toString('base64');
  return `${p}.${s}`;
}

function verify(token){
  const parts = token.split('.');
  if(parts.length !== 2) throw new Error('Invalid token');
  const [p, s] = parts;
  const secretB = Buffer.from(SECRET).toString('base64');
  if(s !== secretB) throw new Error('Invalid signature');
  try{ return JSON.parse(Buffer.from(p, 'base64').toString('utf8')); }catch(e){ throw new Error('Invalid token payload'); }
}

const users = [];

function register({email, password, role = 'user'}){
  if(users.find(u => u.email === email)) throw new Error('User exists');
  const user = {id: users.length+1, email, password, role};
  users.push(user);
  return user;
}


function login({email, password}){
  const user = users.find(u => u.email === email && u.password === password);
  if(!user) throw new Error('Invalid credentials');
  const token = sign({id: user.id, role: user.role});
  return {user: {id: user.id, email: user.email, role: user.role}, token};
}

function verifyToken(token){
  return verify(token);
}

function logout(){
  // in-memory stateless token -> just a placeholder
  return true;
}

module.exports = {register, login, verifyToken, logout, _internals: {users, SECRET}};
