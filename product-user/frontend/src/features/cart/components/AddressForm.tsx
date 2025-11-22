import { useState, useEffect } from "react";
import { useUpdateUserMutation } from "../../users/api/updateUser";

type Props = {
    defaultAddress?: string;
    onAddressChange: (address: string) => void;
    userId?: string;
    token?: string;
    onSaved?: (address: string) => void;
}

const AddressForm = ({ defaultAddress = "", onAddressChange, userId, token, onSaved }: Props) => {
    const [address, setAddress] = useState(defaultAddress);
    const [isEditing, setIsEditing] = useState(!defaultAddress);
    const canPersist = Boolean(userId && token);
    const { mutateAsync: updateUser, isLoading: isSaving } = useUpdateUserMutation(
        userId || "",
        token || ""
    );

    useEffect(() => {
        // Keep the local address in sync when the provided default changes (e.g., fetched from API)
        setAddress(defaultAddress);
        // Do not auto-toggle edit mode on prop changes to avoid interrupting typing
    }, [defaultAddress]);

    const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newAddress = e.target.value;
        setAddress(newAddress);
        onAddressChange(newAddress);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        const trimmed = address.trim();
        if (!trimmed) return;
        // Persist to user profile if possible
        if (canPersist) {
            const form = new FormData();
            form.append("address", trimmed);
            try {
                await updateUser(form);
            } catch (e) {
                // ignore; UI toast handled in hook, keep editing state
                return;
            }
        }
        setIsEditing(false);
        onSaved?.(trimmed);
    };

    return (
        <div className="w-full mb-4">
            <div className="flex justify-between items-center mb-3">
                <h5 className="font-semibold text-lg">Shipping Address</h5>
                {!isEditing && address && (
                    <button
                        onClick={handleEdit}
                        className="text-primary hover:underline text-sm font-medium"
                    >
                        Edit
                    </button>
                )}
            </div>
            
            {isEditing ? (
                <div>
                    <textarea
                        value={address}
                        onChange={handleAddressChange}
                        placeholder="Enter your full shipping address (street, city, state, postal code, country)..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={4}
                    />
                    {address.trim() && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="mt-2 text-sm text-primary hover:underline font-medium disabled:opacity-60"
                        >
                            {isSaving ? "Saving..." : "Save Address"}
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                    {address || "No address provided"}
                </div>
            )}
        </div>
    );
};

export default AddressForm;
