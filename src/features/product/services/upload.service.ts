import apiClient from '@/api/client';

export const uploadService = {
  uploadImage: async (file: File | Blob) => {
    const formData = new FormData();
    // If it's a blob from cropper, we give it a name
    const fileToUpload = file instanceof Blob ? new File([file], 'product.jpg', { type: 'image/jpeg' }) : file;
    formData.append('image', fileToUpload);
    
    const response = await apiClient.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    const response = await apiClient.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default uploadService;
