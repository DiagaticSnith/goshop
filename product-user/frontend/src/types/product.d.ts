interface IProduct {
    id:  string;
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
    // category can be either the id (number), a name (string), or an object when included from backend
    category?: number | string | { id: number; name: string };
    createdAt: Date;
}
