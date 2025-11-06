import { useSelector } from "react-redux";
import { selectCartItems } from "../cartSlice";
import { Link } from "react-router-dom";
import { RxCross1 } from "react-icons/rx";
import { BsCartX } from "react-icons/bs";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../app/store";
import { useCallback } from "react";
import { FcCheckmark } from "react-icons/fc";
import { addToCart, removeFromCart, setCart } from "../cartSlice";
import { useAuth } from "../../../context/AuthContext";
import * as cartApi from "../api";
import { toast } from "react-toastify";

type Props = {
    context?: "cart" | "checkout";
}

const CartProductsList = (props: Props) => {
    const cartItems = useSelector(selectCartItems);

    return (
        <div
            className={`flex flex-col space-y-5 w-full ${
                props.context === "cart" ? "mr-0 md:mr-5" : "max-h-[400px]"
            } overflow-y-auto`}
        >
            {cartItems.length > 0 ? cartItems.map((cartItem) => (
                <CartProductView key={cartItem.product.id} {...cartItem} {...props} />
            )) : (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <BsCartX className="w-16 h-16" />
                    <h4 className="font-semibold text-xl mt-2">The cart is currently empty</h4>
                </div>
            )}
        </div>
    );
};


type CartItemProp = {
  product: IProduct;
  quantity: number;
  context?: "cart" | "checkout";
};

const CartProductView = (props: CartItemProp) => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useAuth();
    const syncServerCart = useCallback(async () => {
        if (!token) return;
        try {
            const serverCart = await cartApi.getCart(token);
            const items = (serverCart.items || []).map((it: any) => ({ product: it.product as IProduct, quantity: it.totalQuantity }));
            dispatch(setCart(items));
        } catch (e) {
            console.error('Failed to sync cart from server', e);
        }
    }, [token, dispatch]);

    const updateQuantity = async (newQuantity: number) => {
        if (newQuantity <= 0) {
            // remove if quantity goes to 0
            dispatch(removeFromCart({ id: props.product.id }));
            if (token) {
                // find cart item id from latest server cart
                try {
                    const serverCart = await cartApi.getCart(token);
                    const toRemove = (serverCart.items || []).find((it: any) => it.productId === props.product.id);
                    if (toRemove) await cartApi.removeCartItem(token, toRemove.id);
                    await syncServerCart();
                } catch (e) { console.error('remove item failed', e); }
            }
            return;
        }
        // optimistic local update
        dispatch(addToCart({ product: props.product, quantity: newQuantity }));
        if (token) {
            try {
                await cartApi.addOrUpdateCartItem(token, props.product.id, newQuantity);
                await syncServerCart();
            } catch (e) {
                console.error('update quantity failed', e);
            }
        }
    };

    const handleProductRemove = async () => {
        dispatch(removeFromCart({ id: props.product.id }));
        if (token) {
            try {
                const serverCart = await cartApi.getCart(token);
                const toRemove = (serverCart.items || []).find((it: any) => it.productId === props.product.id);
                if (toRemove) await cartApi.removeCartItem(token, toRemove.id);
                await syncServerCart();
            } catch (e) {
                console.error('remove item failed', e);
            }
        }
    };

    return (
        <div className="flex h-fit">
            <Link
                className={`mr-2 sm:mr-6 md:mr-8 shrink-0 ${
                    props.context === "cart" ? "w-36 sm:w-48 2xl:w-60" : "w-36 2xl:w-40"
                }`}
                to="/"
            >
                <img
                    className={`w-full ${
                        props.context === "cart" ? "sm:h-48 2xl:h-60" : "h-36 2xl:h-40"
                    } rounded-xl object-cover`}
                    src={props.product.image as string}
                    alt="Product image"
                />
            </Link>
            <div className="relative w-full">
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center w-full mb-1">
                        <h5 className="font-semibold text-lg mr-2 xs:mr-0 sm:text-xl">
                            {props.product.name}
                        </h5>
                        {props.context === "cart" && (
                            <button onClick={handleProductRemove}>
                                <RxCross1 className="w-4 h-4 xs:w-5 xs:h-5" />
                            </button>
                        )}
                    </div>
                    {/* <p className="text-secondary mb-1">{props.product.category}</p> */}
                    <h5 className="font-semibold text-lg sm:text-xl mb-3 lg:mb-0">
              ${props.product.price}
                    </h5>
                    {props.context === "cart" && (
                        <div className="inline-flex items-center border rounded-md overflow-hidden">
                            <button
                                className="px-3 py-2 text-lg"
                                onClick={() => updateQuantity(props.quantity - 1)}
                                aria-label="Decrease quantity"
                            >
                                -
                            </button>
                            <div className="px-4 select-none">{props.quantity}</div>
                            <button
                                className="px-3 py-2 text-lg"
                                onClick={() => updateQuantity(props.quantity + 1)}
                                aria-label="Increase quantity"
                                disabled={props.quantity >= props.product.stockQuantity}
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>

                {props.context === "cart" && (
                    <div className="absolute bottom-0 left-0 text-secondary">
                        {props.product.stockQuantity > 0 ? (
                            <p className="flex items-center">
                                <FcCheckmark className="mr-1 w-5 h-5" />
                  In Stock
                            </p>
                        ) : (
                            <p className="flex items-center">
                                <RxCross1 className="mr-1 w-5 h-5 text-red-500" />
                  Out of Stock
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


export default CartProductsList;