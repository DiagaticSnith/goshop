import { Link } from "react-router-dom";
 
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../app/store";
import { addToCart, setCart } from "../../cart/cartSlice";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import * as cartApi from "../../cart/api";
import { toImageUrl } from "../../../utils/imageUrl";

export const ProductPreview = (props: IProduct) => {
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useAuth();

    const handleAddToCart = async () => {
        // Thêm 1 sản phẩm vào giỏ (optimistic)
        dispatch(addToCart({ product: props, quantity: 1 }));

        if (token) {
            try {
                await cartApi.addOrUpdateCartItem(token, props.id, 1);
                // sync server cart to local state
                const serverCart = await cartApi.getCart(token);
                const items = (serverCart.items || []).map((it: any) => ({ product: it.product as IProduct, quantity: it.totalQuantity }));
                dispatch(setCart(items));
            } catch (e) {
                console.error('Failed to sync cart to server', e);
                toast.error('Unable to save cart to server');
            }
        }

        toast.success("Product added to the cart");
    };

    return (
        <div 
            className="animate-fadeIn relative rounded-xl drop-shadow-custom bg-white mb-8 group"
            data-category={`${props.categoryId}`}
            data-created-at={`${props.createdAt}`}
            data-price={`${props.price}`}
        >
            <Link
                to={`/products/${props.id}`}
                className="transition-opacity hover:opacity-90"
            >
                <img
                    className="w-full h-[250px] sm:h-[300px] rounded-xl object-cover"
                    src={toImageUrl(props.image as string)}
                    alt="Product image"
                />
            </Link>
            {/* favorites button removed */}
            <div className="text-center py-4">
                <p className="text-secondary mb-1 transition-all hover:underline">
                    <Link to={`/products/${props.id}`}>Detail</Link>
                </p>
                <h5 className="font-semibold text-xl mb-1">{props.name}</h5>
                <h6 className="font-semibold mb-1">${props.price}</h6>
                <div className="text-sm text-gray-600 mb-1">
                    {props.brand && <div>Brand: {props.brand}</div>}
                    {props.material && <div>Material: {props.material}</div>}
                    {(props.weight || props.width || props.height) && (
                        <div>Dimensions: {props.weight ? `${props.weight}kg ` : ''}{props.width ? `${props.width}x` : ''}{props.height ? `${props.height}cm` : ''}</div>
                    )}
                </div>
                <div className="mt-3">
                    <button
                        onClick={handleAddToCart}
                        className="text-white rounded-md transition hover:bg-opacity-90 font-semibold text-sm py-2 px-4 bg-primary"
                    >
                        Add to cart
                    </button>
                </div>
            </div>
        </div>
    );
};
