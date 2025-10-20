interface IOrderItemLegacy {
    product: IProduct;
    quantity: number;
}

interface IOrderDetailItem {
    id: number;
    product: IProduct;
    totalQuantity: number;
    totalPrice: number;
}

interface IOrder {
    id: number;
    amount: number;
    userId: string;
    items?: IOrderItemLegacy[] | string; // legacy JSON string or parsed array
    details?: IOrderDetailItem[];
    user?: IUser;
    address: string;
    country: string;
    sessionId: string;
    createdAt: string;
    }
