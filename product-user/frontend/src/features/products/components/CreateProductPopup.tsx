import { Dispatch, SetStateAction } from "react";
import { MdClose } from "react-icons/md";
import { useCreateProductMutation } from "../api/createProduct";
import Popup from "../../../components/Elements/Popup";
import ProductForm, { ProductFormType } from "./ProductForm";
import { useAuth } from "../../../context/AuthContext";

type Props = {
  setIsShowCreateProduct: Dispatch<SetStateAction<boolean>>;
};

const CreateProductPopup = (props: Props) => {
    const { token } = useAuth();
    const { mutate: createProduct } = useCreateProductMutation(token);

    const handleCloseCreateProduct = () => props.setIsShowCreateProduct(false);

    const onFormSubmit = (data: ProductFormType, preview: string) => {
        const product: any = {
            ...data,
            image: data.image as Blob,
            imagePath: preview as string,
            // coerce numeric fields
            weight: data.weight ? Number(data.weight) : undefined,
            width: data.width ? Number(data.width) : undefined,
            height: data.height ? Number(data.height) : undefined,
            brand: data.brand || undefined,
            material: data.material || undefined,
        };
        createProduct(product);
        props.setIsShowCreateProduct(false);
    };

    return (
        <Popup setIsShowPopup={props.setIsShowCreateProduct}>
            <div className="bg-white p-4 rounded-md">
                <div className="flex justify-between mb-3">
                    <h1 className="text-xl font-semibold">Create New Product</h1>
                    <button
                        className="transition-colors text-secondary hover:text-dark"
                        onClick={handleCloseCreateProduct}
                    >
                        <MdClose className="w-6 h-6 inline-block" />
                    </button>
                </div>
                <ProductForm 
                    onFormSubmit={onFormSubmit}
                />
            </div>
        </Popup>
    );
};

export default CreateProductPopup;