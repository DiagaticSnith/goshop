import { api } from "../../app/api";

export const getCart = async (token: string) => {
  const res = await api.get(`/cart`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const addOrUpdateCartItem = async (token: string, productId: string, quantity: number) => {
  const res = await api.post(`/cart/items`, { productId, quantity }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const removeCartItem = async (token: string, id: number) => {
  const res = await api.delete(`/cart/items/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const clearCart = async (token: string) => {
  const res = await api.post(`/cart/clear`, undefined, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};
