import type { MediaAsset } from '../services/media.service';

export const MEDIA_USAGE_GUIDE = [
  {
    title: 'Dùng để tiếp thị sản phẩm',
    content: 'Tài nguyên được cung cấp cho Nhà sáng tạo và Đối tác tiếp thị trong mạng lưới SCANMS để quảng bá sản phẩm chính hãng của gian hàng đối tác.',
  },
  {
    title: 'Kiểm tra nội dung trước khi đăng',
    content: 'Đối chiếu đúng sản phẩm, gian hàng, giá và ưu đãi đang áp dụng. Khi chỉnh sửa ảnh, video hoặc kịch bản, giữ thông tin sản phẩm chính xác và kiểm tra quyền sử dụng với Shop khi cần.',
  },
  {
    title: 'Lưu ý với video review của bạn',
    content: 'Video chờ duyệt hoặc bị từ chối trong mục “Video review của tôi” chưa phải nội dung đã được Shop phê duyệt. Kiểm tra trạng thái và trao đổi với Shop trước khi dùng cho chiến dịch.',
  },
  {
    title: 'Gói tài nguyên tải về',
    content: 'Gói ZIP gồm tài nguyên trong danh sách đang hiển thị theo bộ lọc. Kịch bản được lưu thành tệp TXT. Nguồn video chỉ cho xem trực tuyến hoặc tệp không tải được sẽ được lưu dưới dạng liên kết nguồn; xem DANH-SACH.txt trong gói để biết chi tiết.',
  },
] as const;

const MAX_PACK_BYTES = 250 * 1024 * 1024;
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v', 'ogg'];
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'video/ogg': 'ogg',
};

function safeName(value: string) {
  return value.normalize('NFC').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\.{2,}/g, '-').trim().replace(/[. ]+$/g, '').slice(0, 80) || 'tai-nguyen';
}

function isStreamingPage(url: URL) {
  return ['youtube.com', 'youtu.be', 'facebook.com', 'fb.watch', 'instagram.com', 'tiktok.com', 'v.douyin.com', 'vimeo.com']
    .some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

async function readFile(response: Response, remainingBytes: number) {
  if (!response.ok) throw new Error(`Nguồn trả lỗi HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > remainingBytes) {
    await response.body?.cancel();
    throw new Error('Tệp vượt dung lượng còn lại của gói (tối đa 250 MB)');
  }
  if (!response.body) throw new Error('Nguồn không trả nội dung tệp');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > remainingBytes) {
        await reader.cancel();
        throw new Error('Tệp vượt dung lượng còn lại của gói (tối đa 250 MB)');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error('Tệp rỗng');
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function buildMediaPack(
  assets: readonly MediaAsset[],
  options: { baseUrl: string; signal?: AbortSignal; onProgress?: (completed: number, total: number) => void },
) {
  if (!assets.length) throw new Error('Không có tài nguyên để tải.');
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const manifest: string[] = ['SCANMS — DANH SÁCH TÀI NGUYÊN', ''];
  let downloadedCount = 0;
  let linkedCount = 0;
  let failedCount = 0;
  let totalBytes = 0;

  for (const [index, asset] of assets.entries()) {
    options.signal?.throwIfAborted();
    const name = `${String(index + 1).padStart(3, '0')}-${safeName(asset.title)}`;
    manifest.push(`${index + 1}. ${asset.title}`, `Gian hàng: ${asset.store?.name || 'Không xác định'}`, `Sản phẩm: ${asset.product?.title || 'Không gắn sản phẩm'}`, `Trạng thái: ${asset.status || 'Không xác định'}`);
    if (asset.assetType === 'COPYWRITE_TEXT') {
      zip.file(`Kich-ban/${name}.txt`, asset.urlOrContent, { compression: 'DEFLATE' });
      downloadedCount++;
      manifest.push(`Tệp: Kich-ban/${name}.txt`);
    } else {
      let url: URL;
      try {
        url = new URL(asset.urlOrContent, options.baseUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL không hợp lệ');
      } catch {
        failedCount++;
        manifest.push('Không tải được: liên kết nguồn không hợp lệ.');
        options.onProgress?.(index + 1, assets.length);
        manifest.push('');
        continue;
      }
      try {
        if (isStreamingPage(url)) throw new Error('Nguồn video trực tuyến; mở liên kết để xem');
        const response = await fetch(url.href, {
          signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000),
          credentials: url.origin === new URL(options.baseUrl).origin ? 'same-origin' : 'omit',
        });
        const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
        if (mime.includes('html') || mime.includes('json')) {
          await response.body?.cancel();
          throw new Error('Nguồn trả về trang web thay vì tệp ảnh/video');
        }
        const bytes = await readFile(response, MAX_PACK_BYTES - totalBytes);
        const allowedExtensions = asset.assetType === 'VIDEO' ? VIDEO_EXTENSIONS : IMAGE_EXTENSIONS;
        const urlExtension = url.pathname.split('.').pop()?.toLowerCase() || '';
        const extension = MIME_EXTENSIONS[mime] || (allowedExtensions.includes(urlExtension) ? urlExtension : 'bin');
        const path = `${asset.assetType === 'VIDEO' ? 'Video' : 'Hinh-anh'}/${name}.${extension}`;
        zip.file(path, bytes);
        totalBytes += bytes.byteLength;
        downloadedCount++;
        manifest.push(`Tệp: ${path}`);
      } catch (error) {
        options.signal?.throwIfAborted();
        zip.file(`Lien-ket-nguon/${name}.url`, `[InternetShortcut]\r\nURL=${url.href}\r\n`);
        linkedCount++;
        manifest.push(`Liên kết nguồn: ${url.href}`, `Lý do: ${error instanceof Error ? error.message : 'Nguồn không cho phép tải tệp'}`);
      }
    }
    manifest.push('');
    options.onProgress?.(index + 1, assets.length);
  }
  if (!downloadedCount && !linkedCount) throw new Error('Các tài nguyên không có liên kết hợp lệ để tải.');
  zip.file('DANH-SACH.txt', manifest.join('\r\n'), { compression: 'DEFLATE' });
  zip.file('HUONG-DAN-SU-DUNG.txt', MEDIA_USAGE_GUIDE.map(({ title, content }) => `${title}\r\n${content}`).join('\r\n\r\n'), { compression: 'DEFLATE' });
  options.signal?.throwIfAborted();
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  options.signal?.throwIfAborted();
  return { blob, downloadedCount, linkedCount, failedCount };
}

export function saveMediaPack(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}
