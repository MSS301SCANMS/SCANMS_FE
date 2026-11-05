export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const CHAT_IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp';
export const CHAT_DOCUMENT_ACCEPT = '.pdf,.docx,.xlsx,.txt';

export interface ChatAttachmentCard {
  type: 'ATTACHMENT';
  attachmentId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  mediaType: 'IMAGE' | 'DOCUMENT';
}

export function attachmentError(file: File): string | null {
  if (!file.size || file.size > CHAT_ATTACHMENT_MAX_BYTES) return 'Chọn tệp có dung lượng từ 1 byte đến 10 MB.';
  if (!/\.(jpe?g|png|webp|pdf|docx|xlsx|txt)$/i.test(file.name)) {
    return 'Hỗ trợ ảnh JPG, PNG, WebP và tài liệu PDF, DOCX, XLSX, TXT.';
  }
  return null;
}

export function parseChatAttachment(content: string): ChatAttachmentCard | null {
  try {
    const card = JSON.parse(content);
    return card.type === 'ATTACHMENT' && typeof card.attachmentId === 'string'
      && typeof card.fileName === 'string' && ['IMAGE', 'DOCUMENT'].includes(card.mediaType) ? card : null;
  } catch { return null; }
}

export function attachmentSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

export function chatMessagePreview(content: string): string {
  const card = parseChatAttachment(content);
  return card ? `${card.mediaType === 'IMAGE' ? 'Ảnh' : 'Tài liệu'}: ${card.fileName}` : content;
}
