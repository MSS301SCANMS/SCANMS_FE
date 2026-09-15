import { useState } from 'react';
import { toast } from '../../utils/toast';

export default function SamplesPage() {
  const [selectedId, setSelectedId] = useState('SMP-9821');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const samplesList = [
    {
      id: 'SMP-9821',
      title: 'Serum vitamin C 15%',
      sku: 'SKIN-C15',
      price: 459000,
      status: 'shipping',
      statusLabel: 'Đang vận chuyển',
      statusColor: '#D97706',
      date: '02/09/2026',
      carrier: 'GHTK Express',
      trackingCode: '88992211',
      shipperName: 'Nguyễn Văn Hùng',
      shipperPhone: '0912 345 678',
      shipperPlate: '29-X1 889.22',
      receiver: 'Trần Văn Nhật',
      receiverPhone: '0987123456',
      address: '12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh',
      channel: 'TikTok (@nhat_skincare) • 128K Followers',
      format: 'Video review 9:16 (Routine buổi sáng, 45 giây)',
      deadline: '15/09/2026',
      image: '/assets/serum-hero-optimized.jpg',
    },
    {
      id: 'SMP-9810',
      title: 'Kem chống nắng SPF50+',
      sku: 'SUN-AQUA',
      price: 389000,
      status: 'pending',
      statusLabel: 'Chờ Shop duyệt',
      statusColor: '#EA580C',
      date: '05/09/2026',
      image: '/assets/sunscreen-product.jpg',
    },
    {
      id: 'SMP-9795',
      title: 'Nước hoa hồng BHA 2%',
      sku: 'TONER-BHA',
      price: 320000,
      status: 'received',
      statusLabel: 'Đã nhận hàng',
      statusColor: '#059669',
      date: '20/08/2026',
      image: '/assets/toner-bha-product.jpg',
    },
    {
      id: 'SMP-9780',
      title: 'Mặt nạ phục hồi Cica (Hộp 5 miếng)',
      sku: 'MASK-CICA',
      price: 69000,
      status: 'approved',
      statusLabel: 'Shop đã duyệt',
      statusColor: '#2563EB',
      date: '06/09/2026',
      image: '/assets/cica-mask-product.jpg',
    },
    {
      id: 'SMP-9755',
      title: 'Gel rửa mặt dịu nhẹ',
      sku: 'CLEANSER-02',
      price: 279000,
      status: 'rejected',
      statusLabel: 'Từ chối duyệt',
      statusColor: '#B83A42',
      date: '15/08/2026',
      image: '/assets/cleanser-product.jpg',
    },
  ];

  const current = samplesList.find((s) => s.id === selectedId) || samplesList[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toastMsg && <div className="toast show">{toastMsg}</div>}

      <header className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
            Hàng mẫu dùng thử
          </h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--muted)' }}>
            Gửi yêu cầu nhận mẫu và theo dõi quá trình giao hàng.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => toast.info('Chính sách: KOL Hạng Vàng được tài trợ 5 sản phẩm dùng thử miễn phí mỗi tháng.')}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '9px 14px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Chính sách Shop
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setShowRequestModal(true)}
            style={{ background: 'var(--brand-strong)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="ph ph-plus"></i> Xin mẫu mới
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-soft)', color: 'var(--brand-strong)', display: 'grid', placeItems: 'center', fontSize: '16px' }}>
            <i className="ph ph-storefront"></i>
          </div>
          <div>
            <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>Shop Sora Skin • Chiến dịch Thu Đông 2026</strong>
            <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>Hỗ trợ mẫu thử cho nhà sáng tạo nội dung tham gia review sản phẩm.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px', fontWeight: 700 }}>
          <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706' }}>• Chờ duyệt 1</span>
          <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#FFEDD5', color: '#EA580C' }}>• Đang giao 1</span>
          <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#D1FAE5', color: '#059669' }}>• Đã nhận 1</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.9fr)', gap: '20px', alignItems: 'start' }}>

        <div className="card" style={{ padding: '16px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{samplesList.length} yêu cầu</span>
            <select
              className="select"
              defaultValue="all"
              style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-2)', fontSize: '11.5px', color: 'var(--ink)' }}
            >
              <option value="all">Tất cả ({samplesList.length})</option>
              <option value="shipping">Đang vận chuyển (1)</option>
              <option value="pending">Chờ duyệt (1)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {samplesList.map((s) => {
              const isSelected = s.id === selectedId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--surface-2)' : 'transparent',
                    border: isSelected ? '1px solid var(--brand)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--line)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '13px', color: 'var(--ink)', display: 'block' }}>{s.title}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: s.statusColor }}>{s.statusLabel}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>• {s.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '24px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'var(--shadow)' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img
                src={current.image}
                alt={current.title}
                style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--line)' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--muted)' }}>{current.id}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706' }}>
                    {current.statusLabel}
                  </span>
                </div>
                <h3 style={{ margin: '2px 0 4px', fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>{current.title}</h3>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Giá trị hàng mẫu tài trợ: <strong>{current.price.toLocaleString('vi-VN')} ₫</strong> (Miễn phí) • SKU: {current.sku}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn secondary"
              onClick={() => showToast('Đang kết nối tin nhắn trực tiếp với Shop Sora Skin...')}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="ph ph-chat-circle"></i> Nhắn tin Shop
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>Tiến trình xử lý &amp; Giao nhận hàng mẫu</strong>
              <span style={{ fontSize: '11px', color: 'var(--brand-strong)', cursor: 'pointer', fontWeight: 600 }}>Xem chi tiết lịch trình</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ background: 'var(--surface-2)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'grid', placeItems: 'center', margin: '0 auto 6px', fontSize: '14px' }}>
                  <i className="ph ph-check"></i>
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--ink)', display: 'block' }}>1. Đã gửi đề xuất</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>02/09, 09:42</span>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', display: 'grid', placeItems: 'center', margin: '0 auto 6px', fontSize: '14px' }}>
                  <i className="ph ph-check"></i>
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--ink)', display: 'block' }}>2. Shop xét duyệt</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>03/09, 14:15</span>
              </div>

              <div style={{ background: 'var(--brand-soft)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--brand)' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand-strong)', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 6px', fontSize: '14px' }}>
                  <i className="ph ph-truck"></i>
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--brand-strong)', display: 'block' }}>3. Đang giao hàng</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--brand-strong)' }}>Dự kiến hôm nay</span>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '12px 8px', borderRadius: '8px', border: '1px solid var(--line)', opacity: 0.6 }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface)', color: 'var(--muted)', display: 'grid', placeItems: 'center', margin: '0 auto 6px', fontSize: '12px', fontWeight: 800 }}>
                  4
                </div>
                <strong style={{ fontSize: '12px', color: 'var(--muted)', display: 'block' }}>4. Đã nhận mẫu</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Chờ xác nhận</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#EA580C', color: '#fff' }}>GHTK</span>
                <span style={{ fontSize: '12.5px', color: 'var(--ink)' }}>Đơn vị vận chuyển: <strong>GHTK Express</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Mã vận đơn:</span>
                <strong style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'monospace' }}>{current.trackingCode || '88992211'}</strong>
                <button
                  type="button"
                  onClick={() => showToast('Đã chép mã vận đơn GHTK')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-strong)' }}
                >
                  <i className="ph ph-copy"></i>
                </button>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Shipper: <strong>{current.shipperName || 'Nguyễn Văn Hùng'}</strong> • SĐT: <strong>{current.shipperPhone || '0912 345 678'}</strong> • Biển số: <strong>{current.shipperPlate || '29-X1 889.22'}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
              <button
                type="button"
                className="btn secondary small"
                onClick={() => toast.info('Đang kết nối cuộc gọi tới Shipper: 0912 345 678')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className="ph ph-phone"></i> Gọi Shipper
              </button>
              <button
                type="button"
                className="btn secondary small"
                onClick={() => showToast('Vị trí Shipper: Cách bạn 800m (GHTK Hub Gò Vấp)')}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className="ph ph-map-pin"></i> Theo dõi trực tiếp
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '12px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--ink)' }}>Thông tin nhận hàng</strong>
                <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Đã khóa</span>
              </div>
              <div>Người nhận: <strong>{current.receiver || 'Trần Văn Nhật'}</strong></div>
              <div>SĐT: <strong>{current.receiverPhone || '0987123456'}</strong></div>
              <div style={{ color: 'var(--muted)' }}>Địa chỉ: {current.address || '12 Nguyễn Văn Bảo, Gò Vấp, TP.HCM'}</div>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '12px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: 'var(--ink)' }}>Kế hoạch đăng tải review</strong>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--brand-strong)' }}>128K Followers</span>
              </div>
              <div>Kênh: <strong>{current.channel || 'TikTok (@nhat_skincare)'}</strong></div>
              <div>Định dạng: {current.format || 'Video review 9:16 (45 giây)'}</div>
              <div>Hạn nộp link: <strong style={{ color: '#b83a42' }}>{current.deadline || '15/09/2026'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {showRequestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '28px', maxWidth: '500px', width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>Đăng Ký Xin Mẫu Thử Mới</h3>
              <button type="button" onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)' }}>
                <i className="ph ph-x"></i>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px', display: 'block' }}>Sản phẩm muốn xin mẫu</label>
                <select className="select" style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}>
                  <option>Serum vitamin C 15% (Còn 18 mẫu)</option>
                  <option>Kem chống nắng SPF50+ (Còn 12 mẫu)</option>
                  <option>Nước hoa hồng BHA 2% (Còn 8 mẫu)</option>
                </select>
              </div>

              <div className="field">
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px', display: 'block' }}>Kế hoạch nội dung (Brief)</label>
                <textarea
                  placeholder="Mô tả ý tưởng video review, khung giờ đăng và kênh chia sẻ..."
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRequestModal(false)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer' }}>
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Đã gửi yêu cầu nhận hàng mẫu tới Shop!');
                    setShowRequestModal(false);
                  }}
                  style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--brand-strong)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
