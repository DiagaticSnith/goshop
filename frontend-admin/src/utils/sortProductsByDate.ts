export const sortProductsByPriceAscending = (products: IProduct[]) => {
  return products.sort((a, b) => a.price - b.price);
};

export const sortProductsByPriceDescending = (products: IProduct[]) => {
  return products.sort((a, b) => b.price - a.price);
};
