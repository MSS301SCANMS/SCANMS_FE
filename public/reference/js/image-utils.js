/**
 * SCANMS Image & Profile Utilities
 * Xử lý nén ảnh tự động trước khi lưu vào LocalStorage để:
 * 1. Chống lỗi QuotaExceededError (trình duyệt chỉ cho phép tối đa 5MB cho toàn bộ origin)
 * 2. Tối ưu tốc độ tải và render UI (ảnh avatar chỉ cần kích thước 256x256 px ~ 15KB - 30KB)
 * 3. Đảm bảo ảnh đại diện tồn tại vĩnh viễn qua các lần F5 reload web và chuyển đổi Role
 */

/**
 * Nén tệp hình ảnh thành chuỗi base64 nhẹ (WebP/JPEG) sử dụng HTML5 Canvas
 * @param {File} file - File ảnh người dùng tải lên từ máy tính
 * @param {number} maxSize - Chiều dài/rộng tối đa (mặc định 256px cho avatar)
 * @param {number} quality - Mức chất lượng nén (0.82)
 * @returns {Promise<string>} Chuỗi Data URL base64 sau khi nén
 */
export function compressAvatarImage(file, maxSize = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Tệp tải lên không phải định dạng hình ảnh hợp lệ'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh từ máy tính'));
    reader.onload = (loadEvt) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Trình duyệt không thể giải mã hình ảnh này'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Giữ tỉ lệ khung hình (Aspect Ratio)
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(loadEvt.target.result);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Ưu tiên WebP để tối ưu dung lượng nhất, fallback sang JPEG
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (e) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.src = loadEvt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Lưu object hồ sơ an toàn vào LocalStorage, xử lý dọn dẹp nếu có lỗi tràn bộ nhớ
 * @param {string} storageKey 
 * @param {object} profileData 
 * @returns {boolean} Thành công hay thất bại
 */
export function safeSaveProfile(storageKey, profileData) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(profileData));
    return true;
  } catch (err) {
    console.warn(`[SCANMS Storage] Cảnh báo tràn bộ nhớ khi lưu ${storageKey}, đang thử dọn dẹp...`, err);
    try {
      // Dọn bớt các key tạm thời nếu có
      localStorage.removeItem('scanms_temp_preview');
      localStorage.removeItem('scanms_audit_filter_temp');
      localStorage.setItem(storageKey, JSON.stringify(profileData));
      return true;
    } catch (finalErr) {
      console.error(`[SCANMS Storage] Không thể lưu hồ sơ vào LocalStorage:`, finalErr);
      return false;
    }
  }
}
