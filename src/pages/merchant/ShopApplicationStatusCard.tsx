import { ArrowRight, CheckCircle2, CircleAlert, Clock3, RefreshCw, Store } from 'lucide-react';
import type { UpgradeStatusResponse } from '../../services/kyc.service';

function dateLabel(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return '—';
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function ShopApplicationStatusCard({ application, onEdit, onRefresh, onOpenShop }: {
  application: NonNullable<UpgradeStatusResponse['shopApplication']>;
  onEdit: () => void;
  onRefresh: () => void;
  onOpenShop: () => void;
}) {
  const verified = application.onboardingStatus === 'VERIFIED' || application.isVerified;
  const missingDetails = !verified && Object.keys(application.onboardingData || {}).length === 0;
  return (
    <section className="shop-application-status-card" data-state={verified ? 'verified' : 'pending'} aria-label="Trạng thái hồ sơ gian hàng">
      <div className="shop-application-status-bar">
        {verified ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
        <h2>{verified ? 'Gian hàng đã được xác minh' : 'Hồ sơ đang chờ xét duyệt'}</h2>
        <span className="shop-application-status-badge">{verified ? 'Đã duyệt' : 'Chờ duyệt'}</span>
      </div>
      <div className="shop-application-status-main">
        <div className="shop-application-store-summary">
          <span className="shop-application-store-icon"><Store size={23} /></span>
          <div>
            <h3>{application.name || 'Gian hàng của bạn'}</h3>
            <p>{verified ? 'Hồ sơ đã được phê duyệt. Bạn có thể vào quản lý sản phẩm và đơn hàng.' : 'Hồ sơ đã được gửi. Bạn có thể kiểm tra trạng thái hoặc cập nhật thông tin.'}</p>
            <dl className="shop-application-status-meta">
              <div><dt>Ngày gửi</dt><dd>{dateLabel(application.submittedAt)}</dd></div>
              <div><dt>Cập nhật</dt><dd>{dateLabel(application.updatedAt)}</dd></div>
            </dl>
          </div>
        </div>
        <div className="shop-application-status-actions">
          {verified ? (
            <button type="button" className="shop-application-primary" onClick={onOpenShop}>Vào quản lý gian hàng<ArrowRight size={15} /></button>
          ) : (
            <>
              <button type="button" className="shop-application-secondary" onClick={onEdit}>Bổ sung thông tin hồ sơ</button>
              <button type="button" className="shop-application-primary" onClick={onRefresh}><RefreshCw size={14} />Kiểm tra trạng thái</button>
            </>
          )}
        </div>
      </div>
      {missingDetails && (
        <div role="alert" className="shop-application-status-notice"><CircleAlert size={17} /><div><strong>Hồ sơ trên máy chủ chưa có thông tin chi tiết và giấy tờ.</strong><p>Manager hiện chỉ thấy tên gian hàng. Chọn “Bổ sung thông tin hồ sơ” để gửi cập nhật vào hồ sơ này.</p></div></div>
      )}
      {application.onboardingReviewNote && !verified && (
        <div className="shop-application-status-notice"><CircleAlert size={17} /><div><strong>Ghi chú xét duyệt</strong><p>{application.onboardingReviewNote}</p></div></div>
      )}
    </section>
  );
}
