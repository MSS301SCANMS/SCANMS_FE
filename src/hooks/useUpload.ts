import { useMutation } from '@tanstack/react-query';
import { uploadService } from '../services/upload.service';

/**
 * Upload ảnh lên Cloudinary.
 * @returns url ảnh (secureUrl)
 */
export function useUploadImage(folder?: string) {
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadImage(file, folder),
  });
}

/**
 * Upload video lên Cloudinary.
 * @returns url video (secureUrl)
 */
export function useUploadVideo(folder?: string) {
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadVideo(file, folder),
  });
}

/**
 * Upload ảnh hoặc video, tự phát hiện loại file.
 * @returns { url, type }
 */
export function useUploadMedia(folder?: string) {
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadMedia(file, folder),
  });
}
