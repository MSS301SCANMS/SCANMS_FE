import { useState } from 'react';
import { X } from 'lucide-react';
import CreatorAccountDetails from './CreatorAccountDetails';

/** Theo note: Hồ sơ collaborator chỉ giữ "Hồ sơ của tôi". */
export default function CreatorProfilePage() {
  const [showNotice, setShowNotice] = useState(true);

  return (
    <div className="w-full flex flex-col gap-3" id="creator-profile-hub" data-profile-tab="profile">
      {showNotice && (
        <div role="note" className="flex items-center justify-between gap-3 rounded-xl border border-[#C9E4E0] bg-[#F0FAF8] px-3 py-2 text-xs text-[#0F766E]">
          <span className="min-w-0 leading-5">Hồ sơ của tôi — định danh KYC chuyển sang luồng nâng cấp khi cần.</span>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            aria-label="Đóng thông báo"
            title="Đóng thông báo"
            className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-lg transition-colors hover:bg-[#DDF2ED] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <CreatorAccountDetails />
    </div>
  );
}
