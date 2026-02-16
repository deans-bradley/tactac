import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X } from 'lucide-react';
import { postApi } from '../services/api';
import { Button, Textarea } from '../components/common';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleImageSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please select a valid image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleImageSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    handleImageSelect(file);
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      toast.error('Please select an image');
      return;
    }

    setLoading(true);
    try {
      await postApi.createPost(image, caption);
      toast.success('Post created!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                transition-colors
                ${dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }
              `}
            >
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-gray-400 text-sm">
                JPEG, PNG, GIF, or WebP up to 5MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-xl object-cover max-h-96"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Caption */}
          <Textarea
            label="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption for your post..."
            rows={3}
            maxLength={500}
          />

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!image}
            >
              Share
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
