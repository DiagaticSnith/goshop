const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getCart = async (token: string) => {
  const res = await fetch(`${API_BASE}/cart`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Unable to fetch cart');
  return res.json();
};

export const addOrUpdateCartItem = async (token: string, productId: string, quantity: number) => {
  const res = await fetch(`${API_BASE}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, quantity })
  });
  if (!res.ok) throw new Error('Unable to add/update cart item');
  return res.json();
};

export const removeCartItem = async (token: string, id: number) => {
  const res = await fetch(`${API_BASE}/cart/items/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Unable to remove cart item');
  return res.json();
};

export const clearCart = async (token: string) => {
  const res = await fetch(`${API_BASE}/cart/clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Unable to clear cart');
  return res.json();
};
