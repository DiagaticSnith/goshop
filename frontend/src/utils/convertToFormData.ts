export const convertToFormData = (data: Partial<IProduct> | Partial<IUser>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        // keep `image` field name so backend multer.single('image') receives file
        const field = key;

        // detect file-like by duck-typing to avoid TS instanceof issues
        const isFileLike = value && typeof (value as any).size === 'number' && typeof (value as any).type === 'string';
        if (isFileLike) {
            formData.append(field, value as Blob);
        } else if (value !== undefined && value !== null) {
            formData.append(field, String(value));
        }
    }
    return formData;
};