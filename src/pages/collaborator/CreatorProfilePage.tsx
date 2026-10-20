import CreatorAccountDetails from './CreatorAccountDetails';

/** Theo note: Hồ sơ collaborator chỉ giữ "Hồ sơ của tôi". */
export default function CreatorProfilePage() {
  return (
    <div className="w-full flex flex-col gap-3" id="creator-profile-hub" data-profile-tab="profile">
      <div className="rounded-xl border border-[#C9E4E0] bg-[#F0FAF8] px-3 py-2 text-xs text-[#0F766E]">
        Hồ sơ của tôi — định danh KYC chuyển sang luồng nâng cấp khi cần.
      </div>
      <CreatorAccountDetails />
    </div>
  );
}
