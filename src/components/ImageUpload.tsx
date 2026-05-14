import React, { useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  icon?: any;
}

export default function ImageUpload({ label, value, onChange, icon: Icon = Camera }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Quality 0.7 for good balance
        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        onChange(base64String);
        setLoading(false);
      };
      img.onerror = () => {
        setLoading(false);
        alert('ছবিটি প্রসেস করতে সমস্যা হয়েছে।');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setLoading(false);
      alert('ছবি আপলোড করতে সমস্যা হয়েছে।');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] text-stone-400 font-black uppercase tracking-widest pl-2 flex items-center gap-2">
        <Icon className="w-3 h-3 text-emerald-500" />
        {label}
      </label>
      
      {!value ? (
        <label className="flex flex-col items-center justify-center w-full h-32 bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl cursor-pointer hover:bg-stone-100 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-stone-300 group-hover:text-emerald-500 transition-colors mb-2" />
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">ছবি সিলেক্ট করুন</p>
              </>
            )}
          </div>
          <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} disabled={loading} />
        </label>
      ) : (
        <div className="relative group overflow-hidden rounded-3xl h-32 w-full border border-stone-200">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button 
              type="button"
              onClick={() => onChange('')}
              className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
