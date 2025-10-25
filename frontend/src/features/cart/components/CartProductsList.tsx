import { useSelector } from "react-redux";
import { selectCartItems } from "../cartSlice";
<<<<<<< Updated upstream
// Removed ProductQuantitySelectBox in favor of +/- controls
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
import { toast } from "react-toastify";
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
    const syncServerCart = useCallback(async () => {
        if (!token) return;
        try {
            const serverCart = await cartApi.getCart(token);
            const items = (serverCart.items || []).map((it: any) => ({ product: it.product as IProduct, quantity: it.totalQuantity }));
            dispatch(setCart(items));
        } catch (e) {
<<<<<<< Updated upstream
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
=======
            // ignore
        }
    }, [dispatch, token]);

    const updateQuantity = async (nextQty: number) => {
        if (nextQty < 1) return;
        if (nextQty > props.product.stockQuantity) return;
        // local update for instant UI feedback
        dispatch(addToCart({ product: props.product, quantity: nextQty }));
        // persist to server if logged in
        if (token) {
            try {
                await cartApi.addOrUpdateCartItem(token, props.product.id, nextQty);
                await syncServerCart();
            } catch (e) {
                toast.error("Unable to update cart on server");
>>>>>>> Stashed changes
            }
        }
    };

<<<<<<< Updated upstream
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
=======
    const handleDecrement = () => updateQuantity(props.quantity - 1);
    const handleIncrement = () => updateQuantity(props.quantity + 1);

    const handleProductRemove = async () => {
        // local remove first
        dispatch(removeFromCart({ id: props.product.id }));
        if (token) {
            try {
                // find server cart item id by product
                const serverCart = await cartApi.getCart(token);
                const item = (serverCart.items || []).find((it: any) => (it.product && it.product.id) === props.product.id);
                if (item) {
                    await cartApi.removeCartItem(token, item.id);
                }
                await syncServerCart();
            } catch (e) {
                toast.error("Unable to remove cart item on server");
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
                        <div className="flex items-center space-x-3 select-none">
                            <button
                                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                onClick={handleDecrement}
                                disabled={props.quantity <= 1}
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>
                            <div className="min-w-[2ch] text-center font-medium">{props.quantity}</div>
                            <button
                                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                onClick={handleIncrement}
                                disabled={props.quantity >= props.product.stockQuantity}
                                aria-label="Increase quantity"
>>>>>>> Stashed changes
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