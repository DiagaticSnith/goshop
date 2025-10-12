interface IOrderItem {
    productId: string;
    quantity: number;
}

interface IOrder {
    id: int;
    amount: number;
    userId: string;
    // legacy `items` (stored as JSON) or new `details` relation
    items?: {
        product: IProduct;
        quantity: number;
    }[];
    details?: {
        id: number;
        product: IProduct;
        totalQuantity: number;
        totalPrice: number;
    }[];
    user?: User;
    address: string;
    country: string;
    sessionId: string;
    createdAt: string;
}
