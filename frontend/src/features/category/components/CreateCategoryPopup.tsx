import { Dispatch, SetStateAction, useState } from 'react';
import Popup from '../../../components/Elements/Popup';
import { MdClose } from 'react-icons/md';
import { useCreateCategoryMutation } from '../api/createCategory';

type Props = {
    setIsShowCreateCategory: Dispatch<SetStateAction<boolean>>;
};

const CreateCategoryPopup = ({ setIsShowCreateCategory }: Props) => {
    const [name, setName] = useState('');
    const { mutate: createCategory, isLoading } = useCreateCategoryMutation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        // eslint-disable-next-line no-console
        console.info('[CreateCategoryPopup] submit', { name: name.trim() });
        try {
            createCategory({ name: name.trim() });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[CreateCategoryPopup] createCategory threw', err);
        }
        setIsShowCreateCategory(false);
    };

    return (
        <Popup setIsShowPopup={setIsShowCreateCategory}>
            <div className="bg-white p-4 rounded-md">
                <div className="flex justify-between mb-3">
                    <h1 className="text-xl font-semibold">Create Category</h1>
                    <button
                        className="transition-colors text-secondary hover:text-dark"
                        onClick={() => setIsShowCreateCategory(false)}
                    >
                        <MdClose className="w-6 h-6 inline-block" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <label className="text-dark text-sm">Name</label>
                    <input className="w-full px-4 py-3 rounded-md border mt-2" value={name} onChange={(e) => setName(e.target.value)} />
                    <div className="mt-4 flex justify-end">
                        <button className="px-4 py-2 bg-primary text-white rounded-md" disabled={isLoading}>
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </Popup>
    );
};

export default CreateCategoryPopup;
