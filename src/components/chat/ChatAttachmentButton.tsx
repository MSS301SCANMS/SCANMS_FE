import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, Send, X } from 'lucide-react';
import api from '@/services/api';
import { getChatSocket } from '@/services/chat-socket.service';
import type { ChatAttachmentType } from '@/types/chat.types';

interface UploadedAttachment {
  mediaUrl: string;
  mediaType: ChatAttachmentType;
  mediaName: string;
}

export function ChatAttachmentButton({
  conversationId,
  connected,
}: {
  conversationId: string;
  connected: boolean;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [uploaded, setUploaded] = useState<UploadedAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const messageId = useRef('');
  useEffect(() => {
    if (!file) return;
    dialog.current?.showModal();
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview('');
    };
  }, [file]);
  const close = () => {
    if (!sending.current) {
      dialog.current?.close();
      setFile(null);
      setUploaded(null);
      setError('');
    }
  };
  const send = async () => {
    if (!file || sending.current) return;
    if (!getChatSocket().connected) {
      setError('Mất kết nối. Tệp được giữ lại để bạn thử gửi lại.');
      return;
    }
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      let payload = uploaded;
      if (!payload) {
        const form = new FormData();
        form.append('file', file);
        const response = await api.post(
          `/chat/conversations/${conversationId}/attachments`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        const body = response?.data?.data ?? response?.data ?? response;
        payload = {
          mediaUrl: body.url,
          mediaType: body.type,
          mediaName: body.fileName,
        };
        if (!payload?.mediaUrl || !payload.mediaType)
          throw new Error('Chưa nhận được tệp tải lên.');
        setUploaded(payload);
      }
      await new Promise<void>((resolve, reject) => {
        getChatSocket()
          .timeout(12_000)
          .emit(
            'send_message',
            {
              conversationId,
              ...payload,
              messageText: '',
              messageId: messageId.current,
            },
            (
              timeout: Error | null,
              result?: { ok: boolean; error?: string },
            ) => {
              if (timeout || !result?.ok)
                reject(
                  new Error(
                    result?.error ||
                      'Chưa xác nhận được tin nhắn. Thử lại sẽ dùng cùng mã gửi để tránh trùng.',
                  ),
                );
              else resolve();
            },
          );
      });
      dialog.current?.close();
      setFile(null);
      setUploaded(null);
    } catch (cause) {
      const failure = cause as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        failure.response?.data?.message ||
          failure.message ||
          'Không gửi được tệp.',
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <button
        type="button"
        id="chat-attach-btn"
        disabled={!connected}
        onClick={() => picker.current?.click()}
        title="Gửi ảnh, video hoặc tài liệu"
        aria-label="Đính kèm tệp"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#B88E4F] hover:bg-[#FBF5EB] disabled:opacity-40"
      >
        <Paperclip size={20} />
      </button>
      <input
        ref={picker}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.mp4,.mov,.webm,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          event.target.value = '';
          if (!selected) return;
          const max = selected.type.startsWith('image/')
            ? 5
            : selected.type.startsWith('video/')
              ? 50
              : 20;
          setFile(selected);
          setUploaded(null);
          setError(
            selected.size > max * 1024 * 1024
              ? `Tệp này vượt giới hạn ${max} MB.`
              : '',
          );
          messageId.current = crypto.randomUUID();
        }}
      />
      {file && (
        <dialog
          ref={dialog}
          aria-labelledby="attachment-title"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          className="fixed inset-0 m-auto w-[calc(100%-32px)] max-w-md rounded-2xl border border-[#EAE4D7] bg-white p-5 text-[#1A1612] shadow-2xl backdrop:bg-[#231D15]/50"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id="attachment-title" className="m-0 text-base font-bold">
              Gửi tệp vào hội thoại
            </h2>
            <button
              type="button"
              disabled={busy}
              onClick={close}
              aria-label="Đóng"
              className="rounded-lg p-2 hover:bg-[#F3EFE6]"
            >
              <X size={18} />
            </button>
          </div>
          {preview ? (
            <img
              src={preview}
              alt="Xem trước tệp đính kèm"
              className="mb-3 max-h-64 w-full rounded-xl bg-[#FAF8F5] object-contain"
            />
          ) : (
            <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]">
              <FileText size={38} />
            </div>
          )}
          <p className="break-all text-sm font-semibold">{file.name}</p>
          <p className="mt-1 text-xs text-[#7D715E]">
            {(file.size / 1024 / 1024).toFixed(2)} MB · Ảnh tối đa 5 MB, video
            50 MB, tài liệu 20 MB
          </p>
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-[#DC2626]/5 p-3 text-xs text-[#DC2626]"
            >
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={close}
              className="min-h-10 rounded-xl border border-[#EAE4D7] px-4 text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={busy || !connected || /vượt giới hạn/.test(error)}
              onClick={() => void send()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-[#231D15] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {busy ? 'Đang gửi...' : uploaded ? 'Thử gửi lại' : 'Gửi tệp'}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
