import api from './api';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format?: string;
  bytes?: number;
}

export const uploadService = {
  async uploadImage(file: File, folder: string = 'scanms/images'): Promise<string> {
    if (!file) {
      throw new Error('Vui lòng chọn file ảnh để tải lên');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
      throw new Error('Chỉ chấp nhận file ảnh định dạng PNG, JPG, JPEG, WEBP hoặc SVG');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Dung lượng file không được vượt quá 5MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res: any = await api.post(`/upload/image?folder=${encodeURIComponent(folder)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const data = res?.data?.data || res?.data || res;
    const secureUrl = data?.secureUrl || data?.url;
    if (!secureUrl) {
      throw new Error('Máy chủ không trả về đường dẫn ảnh sau khi tải lên Cloudinary');
    }

    return secureUrl;
  },

  async uploadVideo(file: File, folder: string = 'scanms/videos'): Promise<string> {
    if (!file) {
      throw new Error('Vui lòng chọn file video để tải lên');
    }

    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi)$/i)) {
      throw new Error('Chỉ chấp nhận file video định dạng MP4, MOV, WEBM hoặc AVI');
    }

    if (file.size > 100 * 1024 * 1024) {
      throw new Error('Dung lượng video không được vượt quá 100MB');
    }

    const formData = new FormData();
    formData.append('file', file);

    const res: any = await api.post(`/upload/video?folder=${encodeURIComponent(folder)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    });

    const data = res?.data?.data || res?.data || res;
    const secureUrl = data?.secureUrl || data?.url;
    if (!secureUrl) {
      throw new Error('Máy chủ không trả về đường dẫn video sau khi tải lên Cloudinary');
    }

    return secureUrl;
  },

  async uploadMedia(file: File, folder: string = 'scanms/disputes'): Promise<{ url: string; type: 'image' | 'video' }> {
    const isVideo = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|mov|webm|avi)$/i));
    if (isVideo) {
      const url = await this.uploadVideo(file, folder);
      return { url, type: 'video' };
    } else {
      const url = await this.uploadImage(file, folder);
      return { url, type: 'image' };
    }
  },
};
