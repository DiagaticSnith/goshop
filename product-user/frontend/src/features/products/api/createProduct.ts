import { api } from "../../../app/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { convertToFormData } from "../../../utils/convertToFormData";
import { v4 as uuid } from "uuid";

const createProduct = (product: Partial<IProduct> & { imagePath: string }, token: string): Promise<IProduct> => {
    const { imagePath, ...productData } = product;
    const fd = convertToFormData(productData);
    // log non-file fields for debugging
    const debugPayload: Record<string, any> = {};
    fd.forEach((v, k) => {
        // avoid instanceof checks in TS build; detect file-like objects by duck-typing
        const isFileLike = v && typeof (v as any).size === 'number' && typeof (v as any).type === 'string';
        if (isFileLike) return;
        debugPayload[k] = v;
    });
    // eslint-disable-next-line no-console
    console.info('[createProduct] POST', api.defaults.baseURL + '/products', debugPayload);

    return api.post("/products", fd, {
        headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
        }
    }).then((response) => response.data).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[createProduct] error', err?.response?.status, err?.response?.data || err.message || err);
        throw err;
    });
};

export const useCreateProductMutation = (token: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (product: Partial<IProduct> & { imagePath: string }) => createProduct(product, token),
        onMutate: async (product) => {
            await queryClient.cancelQueries(["products", "all"]);
            const previousProducts = queryClient.getQueryData<IProduct[]>(["products", "all"]);
            if (previousProducts) {
                queryClient.setQueryData<IProduct[]>(["products", "all"], (oldProducts) => {
                    const productsCopy: IProduct[] = JSON.parse(JSON.stringify(oldProducts));

                    const newProduct = {
                        ...product,
                        image: product.imagePath,
                        id: uuid(),
                        priceId: uuid(),
                        createdAt: new Date(),
                        categoryId: 1
                    };
                    productsCopy?.unshift(newProduct as IProduct);
                    return productsCopy;
                });                
            }
            return { previousProducts };
        },
        onError: (_err, _newProduct, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData<IProduct[]>(["products", "all"], context.previousProducts);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries(["products", "all"]);
        }
    });
};