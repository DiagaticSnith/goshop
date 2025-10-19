import Popup from '../../../components/Elements/Popup';
import ProductForm, { ProductFormType } from './ProductForm';
import { useAuth } from '../../../context/AuthContext';
import { useCreateProductMutation } from '../api/createProduct';

export default function CreateProductPopup({ setIsShowCreateProduct }: { setIsShowCreateProduct: (v: boolean) => void }) {
  const { token } = useAuth();
  const createMut = useCreateProductMutation(token);

  const onFormSubmit = async (data: ProductFormType, preview: string) => {
    await createMut.mutateAsync({
      name: data.name,
      description: data.description,
      price: data.price,
      stockQuantity: data.stockQuantity,
      category: data.category,
      image: (data as any).image,
      brand: (data as any).brand,
      material: (data as any).material,
      weight: (data as any).weight,
      width: (data as any).width,
      height: (data as any).height
    });
    setIsShowCreateProduct(false);
  };

  return (
    <Popup setIsShowPopup={setIsShowCreateProduct}>
      <h3 className="text-lg font-semibold mb-3">Create product</h3>
      <ProductForm onFormSubmit={onFormSubmit} />
    </Popup>
  );
}
