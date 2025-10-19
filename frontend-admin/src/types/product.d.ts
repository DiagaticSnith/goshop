interface IProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  image: string | Blob;
  categoryId: number;
  weight?: number;
  width?: number;
  height?: number;
  brand?: string;
  material?: string;
  category?: number | string | { id: number; name: string };
  createdAt: Date | string;
  status?: 'ACTIVE' | 'HIDDEN';
}
