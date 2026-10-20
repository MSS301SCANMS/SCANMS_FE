import type { UserProfile } from '../../services/auth.service';

/** Never present seeded verification, metrics or bank fixtures as a person's actual identity. */
export function SeedDataNotice({ user }: { user: UserProfile | null }) {
  if (!user?.email?.toLowerCase().endsWith('@seed.scanms.test')) return null;
  const reference = user.collaboratorProfile?.socialLinksJson?.seedReference;
  return <aside className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-3 text-xs leading-relaxed text-[#7D715E]" aria-label="Nguồn dữ liệu kiểm thử">
    <strong className="text-[#231D15]">Tài khoản kiểm thử Capstone.</strong>{' '}
    KYC, cấp bậc, follower, số dư và giao dịch seed là dữ liệu minh họa, không chứng minh xác minh danh tính hoặc thanh toán thật.
    {reference?.purpose === 'PUBLIC_REFERENCE_FOR_CAPSTONE_TESTING' && <p className="mt-1">
      Tên và kênh của <strong>{String(reference.name)}</strong> chỉ dùng để tham khảo công khai; người này không đăng ký hoặc xác nhận hợp tác qua tài khoản thử nghiệm này.
    </p>}
  </aside>;
}
