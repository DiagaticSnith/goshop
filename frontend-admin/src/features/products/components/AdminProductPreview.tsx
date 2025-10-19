import React, { useMemo, useState } from 'react';
import Popup from '../../../components/Elements/Popup';
import ProductForm from './ProductForm';
import { useAuth } from '../../../context/AuthContext';
import { useDeleteProductMutation } from '../api/deleteProduct';
import { useUpdateProductMutation } from '../api/updateProduct';
import { useSetProductStatusMutation } from '../api/setProductStatus';
import { toImageUrl } from '../../../utils/imageUrl';

export default function AdminProductPreview(props: IProduct) {
  const { token } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const del = useDeleteProductMutation(token);
  const upd = useUpdateProductMutation(token);
  const setStatus = useSetProductStatusMutation(token);
  const [imgSrc, setImgSrc] = useState<string>(toImageUrl(props.image as string));

  const categoryName = useMemo(() => {
    if (typeof props.category === 'object' && props.category) return props.category.name;
    if (typeof props.category === 'string') return props.category;
    return undefined;
  }, [props.category]);

  const createdAtText = useMemo(() => {
    const d = props.createdAt ? new Date(props.createdAt) : undefined;
    return d ? d.toLocaleString() : '';
  }, [props.createdAt]);

  const onDelete = async () => {
    if (confirm('Hide this product? You can unhide later by editing status.')) {
      await del.mutateAsync(props.id);
    }
  };

  const onUnhide = async () => {
    await setStatus.mutateAsync({ id: props.id, status: 'ACTIVE' });
  };

  const onEditSubmit = async (data: any, preview: string) => {
    await upd.mutateAsync({
      id: props.id,
      name: data.name,
      description: data.description,
      price: data.price,
      stockQuantity: data.stockQuantity,
      category: data.category,
      // image handled by ProductForm via setValue('image', file)
      image: (data as any).image || null,
      brand: data.brand,
      material: data.material,
      weight: data.weight,
      width: data.width,
      height: data.height,
    });
    setShowEdit(false);
  };
  return (
    <div className="animate-fadeIn relative rounded-xl border border-gray-200 bg-white mb-8 group p-3">
      <div className="rounded-xl overflow-hidden">
        <img
          className="w-full h-[220px] object-cover"
          src={imgSrc}
          alt={props.name}
          onError={(e) => {
            const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16">No image</text></svg>';
            setImgSrc(placeholder);
          }}
        />
      </div>
      <div className="pt-3">
        <h5 className="font-semibold text-base mb-1 truncate" title={props.name}>{props.name}</h5>
        <h6 className="font-semibold mb-2">${props.price}</h6>
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          {createdAtText && <div>Created: {createdAtText}</div>}
          {categoryName && <div>Category: {categoryName}</div>}
          {props.brand && <div>Brand: {props.brand}</div>}
          {props.material && <div>Material: {props.material}</div>}
          {(props.weight || props.width || props.height) && (
            <div>Dimensions: {props.weight ? `${props.weight}kg ` : ''}{props.width ? `${props.width}x` : ''}{props.height ? `${props.height}cm` : ''}</div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEdit(true)} className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            Edit
          </button>
          {props.status === 'HIDDEN' ? (
            <button onClick={onUnhide} className="text-xs px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">
              Unhide
            </button>
          ) : (
            <button onClick={onDelete} className="text-xs px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700">
              Hide
            </button>
          )}
        </div>
      </div>
      {showEdit && (
        <Popup setIsShowPopup={setShowEdit}>
          <h3 className="text-lg font-semibold mb-3">Edit product</h3>
          <ProductForm product={props} categoryName={typeof props.category === 'object' ? props.category?.name : (props.category as string)} onFormSubmit={onEditSubmit} />
          <div className="mt-3 text-right">
            <button onClick={() => setShowEdit(false)} className="px-3 py-1 text-sm rounded bg-gray-200">Close</button>
          </div>
        </Popup>
      )}
    </div>
  );
}
