export const MIN_REVIEW_LENGTH = 10;
export const MAX_REVIEW_LENGTH = 1000;
export const MAX_REVIEW_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function validateReviewComment(value: string): string | null {
  const comment = value.trim();
  if (comment.length < MIN_REVIEW_LENGTH)
    return "Nhận xét cần ít nhất 10 ký tự, không tính khoảng trắng đầu/cuối.";
  if (comment.length > MAX_REVIEW_LENGTH)
    return "Nhận xét không được vượt quá 1000 ký tự.";
  if (
    /([^\s])\1{14,}/u.test(comment) ||
    /(?:^|\s)(?:fuck|shit|địt|đụ mẹ)(?:\s|[.!?,]|$)/iu.test(comment) ||
    (comment.match(/https?:\/\//gi)?.length ?? 0) >= 3
  )
    return "Vui lòng viết nhận xét lịch sự, không spam hoặc quảng cáo.";
  return null;
}

export function validateReviewFile(
  file: Pick<File, "name" | "type" | "size">,
  kind: "image" | "video",
): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowed: Record<string, string[]> =
    kind === "image"
      ? {
          "image/jpeg": ["jpg", "jpeg"],
          "image/png": ["png"],
          "image/webp": ["webp"],
        }
      : { "video/mp4": ["mp4"], "video/quicktime": ["mov"] };
  if (!extension || !allowed[file.type]?.includes(extension))
    return kind === "image"
      ? "Chỉ chấp nhận ảnh JPG, PNG, WEBP."
      : "Chỉ chấp nhận video MP4, MOV.";
  if (file.size <= 0) return "File trống hoặc không đọc được.";
  if (file.size > (kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES))
    return kind === "image" ? "Mỗi ảnh tối đa 5MB." : "Video tối đa 50MB.";
  return null;
}
