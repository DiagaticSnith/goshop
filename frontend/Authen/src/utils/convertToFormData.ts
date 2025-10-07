export const convertToFormData = (data: Partial<IProduct> | Partial<IUser>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        // Normalize possible file key `image` to `avatar` (backend expects `avatar`)
        const field = key === "image" ? "avatar" : key;

        if (value instanceof File || value instanceof Blob) {
            formData.append(field, value as Blob);
        } else if (value !== undefined && value !== null) {
            formData.append(field, String(value));
        }
    }
    return formData;
};