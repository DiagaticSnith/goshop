import React from 'react'
import { toImageUrl } from '../../utils/imageUrl'

const PreviewImage = ({ control, setValue, error, preview, setPreview }: any) => {
  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
      setValue('image', file);
    }
  }

  const src = typeof preview === 'string' ? toImageUrl(preview) : undefined;
  return (
    <div className="w-1/3">
      <div className="h-48 w-full bg-gray-100 rounded mb-2">
        {preview ? <img src={src as string} className="w-full h-full object-cover"/> : <div className="p-4">No preview</div>}
      </div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}

export default PreviewImage
