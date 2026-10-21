import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { PartnerUpgradeTab } from '../customer/PartnerUpgradeTab';
import './shop-application-page.css';

export default function ShopApplicationPage({ onCheckStore, checkingStore = false }: {
  onCheckStore?: () => void;
  checkingStore?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div aria-label="Hồ sơ gian hàng của chủ shop" className="shop-application-page">
      <header className="shop-application-page-header">
        <div>
          <h1>Hồ sơ gian hàng</h1><p>Thông tin đăng ký và trạng thái xét duyệt.</p>
        </div>
        {onCheckStore ? (
          <button type="button" onClick={onCheckStore} disabled={checkingStore} className="shop-application-back">
            <RefreshCw size={16} className={checkingStore ? 'animate-spin' : ''} />Kiểm tra gian hàng
          </button>
        ) : (
          <Link to="/merchant/dashboard" className="shop-application-back"><ArrowLeft size={15} />Về tổng quan</Link>
        )}
      </header>
      <PartnerUpgradeTab workspace="shop" onOpenShop={onCheckStore || (() => navigate('/merchant/dashboard'))} />
    </div>
  );
}
