import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";
import { useDeleteProductMutation } from "../api/deleteProduct";
// Link removed for admin preview
import { MdEdit } from "react-icons/md";
import { IoMdTrash } from "react-icons/io";
import EditProductPopup from "./EditProductPopup";

export const AdminProductPreview = (props: IProduct) => {
    const { token } = useAuth();
    const [isShowEditProduct, setIsShowEditProduct] = useState(false);
    const deleteMutation = useDeleteProductMutation(token);

    const handleDeleteButtonClick = () => {
        // English confirmation
        const confirmed = window.confirm('Are you sure you want to delete this product?');
        if (confirmed) {
            deleteMutation.mutate(props.id);
        }
    };
    const handleEditButtonClick = () => setIsShowEditProduct(true);

    return (
        <div className="rounded-lg drop-shadow-custom bg-white p-2 md:p-4 py-2 border-gray-200 border animate-fadeIn">
            {isShowEditProduct && (
                <EditProductPopup
                    {...props}
                    setIsShowEditProduct={setIsShowEditProduct}
                />
            )}
            <img
                className="w-full h-[200px] sm:h-[250px] rounded-xl object-cover mb-4"
                src={props.image as string}
                alt="Product image"
            />
            <div>
                <h5 className="font-medium text-secondary">
                    {props.name}
                </h5>
                <h5 className="font-semibold mb-2">${props.price}</h5>
                <div className="text-sm text-gray-600 mb-2">
                    <div>Created: {new Date(props.createdAt).toLocaleString()}</div>
                    {typeof props.category === 'object' && props.category && 'name' in props.category ? (
                        <div>Category: {(props.category as any).name}</div>
                    ) : (
                        props.categoryId && <div>Category ID: {props.categoryId}</div>
                    )}
                    {props.brand && <div>Brand: {props.brand}</div>}
                    {props.material && <div>Material: {props.material}</div>}
                    {(props.weight || props.width || props.height) && (
                        <div>Dimensions: {props.weight ? `${props.weight}kg ` : ''}{props.width ? `${props.width}x` : ''}{props.height ? `${props.height}cm` : ''}</div>
                    )}
                </div>
                <div className="flex flex-row items-center space-x-2 xs:space-x-0 xs:items-start xs:space-y-2 xs:flex-col">
                    <button
                        id="editProductButton"
                        className="flex items-center w-auto xs:w-full border border-gray-200 rounded-md p-2 px-1 xs:px-4 hover:bg-main-gray transition-colors"
                        onClick={handleEditButtonClick}
                    >
                        <MdEdit className="inline-block xs:mr-2 w-5 h-5 text-secondary" />
                        <span className="hidden xs:inline font-semibold">Edit</span>
                    </button>
                    <button
                        id="deleteProductButton"
                        className="flex items-center w-auto xs:w-full border border-gray-200 rounded-md p-2 px-1 xs:px-4 hover:bg-main-gray transition-colors text-red-500"
                        onClick={handleDeleteButtonClick}
                    >
                        <IoMdTrash className="inline-block xs:mr-2 w-5 h-5" />
                        <span className="hidden xs:inline font-semibold">Delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
