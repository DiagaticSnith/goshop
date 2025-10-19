import { useState } from 'react';
import { useGetAllCategoriesQuery } from '../api/getAllCategories';
import { useCreateCategoryMutation } from '../api/createCategory';
import { useAuth } from '../../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../app/api';

const updateCategoryApi = (id: number, payload: { name: string }, token?: string) => {
  return api.patch(`/category/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data);
};

const ManageCategories = () => {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useGetAllCategoriesQuery();
  const { mutate: createCategory, isLoading: creating } = useCreateCategoryMutation();
  const [name, setName] = useState('');

  if (!isAdmin) return (
    <div className="container">
      <div className="p-8">You don't have access to manage categories.</div>
    </div>
  );

  const qc = useQueryClient();
  const { token } = useAuth();
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategoryApi(id, { name }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['category', 'all'] })
  });

  return (
    <div className="container">
      <div className="mt-6 bg-white rounded-md shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Manage Categories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded-md drop-shadow-custom">
            <h4 className="font-semibold mb-2">Create Category</h4>
            <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; createCategory({ name: name.trim() }); setName(''); }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="w-full px-4 py-2 border rounded-md mb-3" />
              <button className="px-4 py-2 bg-primary text-white rounded-md" disabled={creating}>Create</button>
            </form>
          </div>

          <div className="md:col-span-2 p-4 bg-white rounded-md drop-shadow-custom">
            <h4 className="font-semibold mb-2">All Categories</h4>
            {isLoading && <div>Loading...</div>}
            {!isLoading && data && data.length === 0 && <div>No categories yet.</div>}
            {!isLoading && data && data.length > 0 && (
              <ul className="space-y-2">
                {data.map((c: ICategory) => (
                  <li key={c.id} className="flex items-center justify-between border-b py-2">
                    <div className="flex items-center space-x-3">
                      <EditableCategoryName name={c.name} onSave={(newName) => updateMutation.mutate({ id: c.id, name: newName })} />
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">ID: {c.id}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditableCategoryName = ({ name, onSave }: { name: string; onSave: (n: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  return (
    <div className="flex items-center space-x-2">
      {editing ? (
        <>
          <input value={value} onChange={(e) => setValue(e.target.value)} className="px-2 py-1 border rounded-md" />
          <button className="px-2 py-1 bg-primary text-white rounded" onClick={() => { onSave(value); setEditing(false); }}>Save</button>
          <button className="px-2 py-1 border rounded" onClick={() => { setValue(name); setEditing(false); }}>Cancel</button>
        </>
      ) : (
        <>
          <span>{name}</span>
          <button className="px-2 py-1 text-sm text-secondary" onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
};

export default ManageCategories;
