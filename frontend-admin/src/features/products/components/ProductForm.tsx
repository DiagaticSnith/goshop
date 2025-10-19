import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import PreviewImage from "../../../components/Elements/PreviewImage";
import { useMemo, useState } from "react";
import { useGetAllCategoriesQuery } from "../../category";

type Props = {
  product?: IProduct;
  categoryName?: string;
  onFormSubmit: (data: ProductFormType, preview: string) => void;
};

const fieldRequiredError = "This field is required.";
const productValidationSchema = yup.object({
  name: yup.string().required(fieldRequiredError),
  description: yup.string().required(fieldRequiredError),
  price: yup.number().typeError(fieldRequiredError).required(fieldRequiredError).positive(),
  stockQuantity: yup.number().typeError(fieldRequiredError).required(fieldRequiredError).integer().min(0),
  category: yup.string().required(fieldRequiredError),
  brand: yup.string().optional(),
  material: yup.string().optional(),
  weight: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
  width: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
  height: yup.number().transform((v, o) => (o === '' ? undefined : v)).optional(),
  image: yup.mixed().test('imageRequired', fieldRequiredError, function (value) {
    const isEdit = (this as any).options?.context?.isEdit as boolean;
    if (isEdit) return true; // optional when editing
    return value != null;
  })
});
export type ProductFormType = yup.InferType<typeof productValidationSchema>;

const ProductForm = (props: Props) => {
    const isEdit = useMemo(() => Boolean(props.product), [props.product]);
    const categoriesQuery = useGetAllCategoriesQuery();
    const categories = (categoriesQuery.data || []) as any[];
    const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<ProductFormType>({
        resolver: yupResolver(productValidationSchema, { context: { isEdit } }),
        defaultValues: {
            ...props.product,
            category: (
                props.categoryName ??
                (typeof props.product?.category === 'string'
                    ? props.product?.category
                    : typeof props.product?.category === 'object'
                        ? props.product?.category?.name
                        : '')
            ) as unknown as string,
            brand: (props.product as any)?.brand ?? '',
            material: (props.product as any)?.material ?? '',
            weight: (props.product as any)?.weight ?? undefined,
            width: (props.product as any)?.width ?? undefined,
            height: (props.product as any)?.height ?? undefined,
        }
    });
    const [preview, setPreview] = useState<string | ArrayBuffer | null | undefined>(props.product?.image as string);

    const onSubmit = (data: ProductFormType) => props.onFormSubmit(data, preview as string);

    return (
        <div className="flex items-start gap-4">
            <PreviewImage
                control={control}
                setValue={setValue}
                error={errors.image?.message}
                preview={preview}
                setPreview={setPreview}
            />
            <form
                className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="flex flex-col">
                    <label htmlFor="productName" className="text-dark text-sm">
              Product Name
                    </label>
                    <input
                        {...register("name")}
                        type="text"
                        id="productName"
                        placeholder="Name the product"
                        className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none placeholder:text-sm"
                    />
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label htmlFor="productDescription" className="text-dark text-sm">
              Description
                    </label>
                    <textarea
                        {...register("description")}
                        id="productDescription"
                        placeholder="Describe the product"
                        className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:outline-none placeholder:text-sm whitespace-pre-line"
                    />
                </div>
                {/* Price and stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col w-full">
                        <label htmlFor="productPrice" className="text-dark text-sm">Price</label>
                        <input {...register("price")} type="number" step={0.01} id="productPrice" placeholder="Enter the price" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:outline-none placeholder:text-sm" />
                    </div>
                    <div className="flex flex-col w-full">
                        <label htmlFor="productStockQuantity" className="text-dark text-sm">Stock quantity</label>
                        <input {...register("stockQuantity")} type="number" id="productStockQuantity" placeholder="Enter the stock quantity" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:outline-none placeholder:text-sm" />
                    </div>
                </div>
                {/* Category and brand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label htmlFor="productCategory" className="text-dark text-sm">Category</label>
                        <select id="productCategory" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none text-sm" {...register('category')}>
                            <option value="" disabled>Select category</option>
                            {categories.map((c: any) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="productBrand" className="text-dark text-sm">Brand</label>
                        <input {...register('brand')} type="text" id="productBrand" placeholder="e.g. Acme" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none placeholder:text-sm" />
                    </div>
                </div>
                {/* Material */}
                <div className="flex flex-col md:col-span-2">
                    <label htmlFor="productMaterial" className="text-dark text-sm">Material</label>
                    <input {...register('material')} type="text" id="productMaterial" placeholder="e.g. Wood" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none placeholder:text-sm" />
                </div>
                {/* Dimensions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                    <div className="flex flex-col w-full">
                        <label htmlFor="productWeight" className="text-dark text-sm">Weight (kg)</label>
                        <input {...register('weight')} type="number" step={0.01} id="productWeight" placeholder="e.g. 2.5" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none placeholder:text-sm" />
                    </div>
                    <div className="flex flex-col w-full">
                        <label htmlFor="productWidth" className="text-dark text-sm">Width</label>
                        <input {...register('width')} type="number" step={0.01} id="productWidth" placeholder="e.g. 11.2" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none placeholder:text-sm" />
                    </div>
                    <div className="flex flex-col w-full">
                        <label htmlFor="productHeight" className="text-dark text-sm">Height (cm)</label>
                        <input {...register('height')} type="number" step={0.01} id="productHeight" placeholder="e.g. 95" className="px-4 py-3 rounded-lg mt-1 border border-gray-200 focus:border-primary focus:bg-white focus:outline-none placeholder:text-sm" />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <button 
                        id="submitProductForm"
                        className="px-4 py-2 text-sm block rounded-lg bg-primary text-white mt-3 hover:bg-primary-hover transition-colors focus:outline-none hover:bg-opacity-90"
                    >
                        {props.product ? "Edit" : "Add"} product
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
