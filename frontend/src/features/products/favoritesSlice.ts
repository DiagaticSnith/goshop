// Favorites feature removed — provide a minimal stub to keep imports working
export type IProductStub = any;
export const selectFavorites = (_state: any) => [] as IProductStub[];
export const addFavorite = (_p: IProductStub) => ({ type: 'favorites/add' });
export const removeFavorite = (_payload: { id: string }) => ({ type: 'favorites/remove' });
export const updateFavorite = (_payload: { oldId: string; updatedProduct: IProductStub }) => ({ type: 'favorites/update' });
export default function favoritesReducer(state = { products: [] }, _action: any) { return state; }
