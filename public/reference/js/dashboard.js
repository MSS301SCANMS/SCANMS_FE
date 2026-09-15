import { compressAvatarImage, safeSaveProfile } from './image-utils.js';

const cash = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
const demo = { days: 7, mode: 'ready', metric: 'clicks', balance: 12450000, locked: 0, kyc: false, fail: false, selectedDay: null, showAllTasks: false };
let restoreFocus;
const daily = Array.from({length:30}, (_, i) => {
  const orders = 9 + i % 13;
  const revenue = orders * 459000;
  return {
    date: `2026-09-${String(i+1).padStart(2,'0')}`,
    clicks: 320 + i * 31 + (i % 3) * 72,
    orders,
    revenue,
    commission: Math.round(revenue * 0.11)
  };
});
const records = [
  {id:'IN23918', title:'Serum vitamin C 15%', qty:2, price:459000, base:8, tier:3, campaign:1, status:'Đã duyệt', source:'Coupon NHATXINH10'},
  {id:'IN23902', title:'Kem chống nắng SPF50+', qty:1, price:389000, base:10, tier:3, campaign:0, status:'Chờ đối soát', source:'Cookie, click cuối cùng'},
  {id:'IN23845', title:'Gel rửa mặt', qty:1, price:279000, base:7, tier:3, campaign:0, status:'Đã thu hồi', source:'Coupon NHATXINH10'},
];
const commission = r => Math.round(r.qty*r.price*(r.base+r.tier+r.campaign)/100);
const button = (action, label, secondary=true) => `<button class="btn ${secondary?'secondary':''}" data-dash="${action}">${label}</button>`;
function selection() { return daily.filter(r => (!demo.from || r.date>=demo.from) && (!demo.to || r.date<=demo.to)).slice(-demo.days); }

function formatMetricValue(val, metric) {
  if (metric === 'revenue' || metric === 'commission') return cash(val);
  if (metric === 'clicks') return Number(val).toLocaleString('vi-VN') + ' lượt';
  if (metric === 'orders') return Number(val).toLocaleString('vi-VN') + ' đơn';
  return Number(val).toLocaleString('vi-VN');
}

function formatCompactY(n, metric) {
  if (n === 0) return '0';
  if (metric === 'revenue' || metric === 'commission') {
    if (n >= 1000000) {
      const v = (n / 1000000).toFixed(1);
      return (v.endsWith('.0') ? v.slice(0, -2) : v) + 'M';
    }
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  }
  if (n >= 1000) {
    const v = (n / 1000).toFixed(1);
    return (v.endsWith('.0') ? v.slice(0, -2) : v) + 'k';
  }
  return String(n);
}

function getWeekday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[d.getDay()] || '';
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[d.getDay()] || '';
  const [y, m, day] = dateStr.split('-');
  return `${dayName}, ${day}/${m}/${y}`;
}

function getNiceYSteps(maxVal) {
  if (maxVal <= 5) return [5, 4, 3, 2, 1, 0];
  if (maxVal <= 20) return [20, 15, 10, 5, 0];
  const p = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const frac = maxVal / p;
  let niceCeil;
  if (frac <= 1.2) niceCeil = 1.2 * p;
  else if (frac <= 1.5) niceCeil = 1.5 * p;
  else if (frac <= 2) niceCeil = 2 * p;
  else if (frac <= 3) niceCeil = 3 * p;
  else if (frac <= 5) niceCeil = 5 * p;
  else if (frac <= 8) niceCeil = 8 * p;
  else niceCeil = 10 * p;

  return [
    niceCeil,
    Math.round(niceCeil * 0.75),
    Math.round(niceCeil * 0.5),
    Math.round(niceCeil * 0.25),
    0
  ];
}

function renderDayDetail(r, isPeak) {
  const cr = r.clicks ? ((r.orders / r.clicks) * 100).toFixed(2) : '0.00';
  return `
    <div class="ov-day-strip">
      <div class="ov-strip-left">
        <div class="ov-strip-date-wrap">
          <strong class="ov-strip-date">${formatDateFull(r.date)}</strong>
          ${isPeak ? '<span class="ov-peak-tag">Đỉnh kỳ</span>' : ''}
        </div>
        <div class="ov-strip-metrics">
          <div class="ov-strip-metric">
            <span class="ov-strip-lbl">Click</span>
            <strong class="ov-strip-val">${r.clicks.toLocaleString('vi-VN')}</strong>
          </div>
          <span class="ov-strip-sep">→</span>
          <div class="ov-strip-metric">
            <span class="ov-strip-lbl">Đơn</span>
            <strong class="ov-strip-val">${r.orders}</strong>
          </div>
          <span class="ov-strip-sep">→</span>
          <div class="ov-strip-metric">
            <span class="ov-strip-lbl">Doanh thu</span>
            <strong class="ov-strip-val text-nowrap">${cash(r.revenue)}</strong>
          </div>
          <span class="ov-strip-sep">→</span>
          <div class="ov-strip-metric">
            <span class="ov-strip-lbl">Hoa hồng dự kiến</span>
            <strong class="ov-strip-val text-emerald text-nowrap">${cash(r.commission)}</strong>
          </div>
          <span class="ov-strip-sep">→</span>
          <div class="ov-strip-metric">
            <span class="ov-strip-lbl">CR</span>
            <strong class="ov-strip-val text-brand">${cr}%</strong>
          </div>
        </div>
      </div>
      <div class="ov-strip-actions">
        <button type="button" class="btn-text ov-strip-action-btn" data-dash="day-insight" data-date="${r.date}" title="Xem giải thích & gợi ý ngày này">
          <i class="ph ph-info"></i> Chi tiết ngày
        </button>
        <button type="button" class="btn-text ov-strip-action-btn" data-dash="open-table" title="Xem bảng số liệu chi tiết">
          <i class="ph ph-table"></i> Xem bảng số liệu
        </button>
      </div>
    </div>`;
}

function openTableDrawer(rows) {
  restoreFocus = document.activeElement;
  const peakRow = rows.reduce((maxR, cur) => cur[demo.metric] > maxR[demo.metric] ? cur : maxR, rows[0]);
  const modalRoot = document.querySelector('#modal-root');

  modalRoot.innerHTML = `
    <div class="ov-drawer-backdrop" id="ov-drawer-backdrop">
      <aside class="ov-drawer" role="dialog" aria-modal="true" aria-labelledby="ov-drawer-title">
        <header class="ov-drawer-header">
          <div class="ov-drawer-header-info">
            <h2 id="ov-drawer-title"><i class="ph ph-table"></i> Bảng số liệu chi tiết</h2>
            <p class="ov-drawer-subtitle">${rows.length} ngày trong chu kỳ lọc (${rows[0].date} — ${rows.at(-1).date})</p>
          </div>
          <button class="icon-btn" data-close-drawer aria-label="Đóng bảng số liệu">×</button>
        </header>
        <div class="ov-drawer-body">
          <div class="table-wrap">
            <table class="dash-custom-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Thứ</th>
                  <th class="text-right">Lượt click</th>
                  <th class="text-right">Đơn chốt</th>
                  <th class="text-right">CR%</th>
                  <th class="text-right">Doanh thu GMV</th>
                  <th class="text-right">Hoa hồng CTV</th>
                  <th class="text-center">Hiệu suất</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => {
                  const cr = r.clicks ? ((r.orders / r.clicks) * 100).toFixed(2) : '0.00';
                  const isPeak = r[demo.metric] === peakRow[demo.metric];
                  const isSelected = r.date === (demo.selectedDay || peakRow.date);
                  return `
                  <tr class="${isPeak ? 'tr-peak' : ''} ${isSelected ? 'tr-selected' : ''}">
                    <td><strong>${r.date}</strong></td>
                    <td><span class="badge-weekday">${getWeekday(r.date)}</span></td>
                    <td class="text-right">${r.clicks.toLocaleString('vi-VN')}</td>
                    <td class="text-right"><strong>${r.orders}</strong></td>
                    <td class="text-right text-brand"><strong>${cr}%</strong></td>
                    <td class="text-right text-nowrap">${cash(r.revenue)}</td>
                    <td class="text-right font-bold text-emerald text-nowrap">${cash(r.commission)}</td>
                    <td class="text-center">
                      ${isPeak ? '<span class="badge-table peak"><i class="ph ph-crown"></i> Cao nhất</span>' : '<span class="badge-table normal">Ổn định</span>'}
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </div>`;

  const backdrop = modalRoot.querySelector('#ov-drawer-backdrop');
  const close = () => {
    modalRoot.innerHTML = '';
    restoreFocus?.isConnected && restoreFocus.focus();
  };
  backdrop.querySelector('[data-close-drawer]').onclick = close;
  backdrop.onclick = e => { if (e.target === backdrop) close(); };
  backdrop.onkeydown = e => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const items = [...backdrop.querySelectorAll('button,input,select,textarea')].filter(n => !n.disabled);
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  backdrop.querySelector('[data-close-drawer]').focus();
}

function openDayInsight(dateStr) {
  const r = daily.find(item => item.date === dateStr);
  if (!r) return;
  const rows = selection();
  const peakRow = rows.reduce((maxR, cur) => cur[demo.metric] > maxR[demo.metric] ? cur : maxR, rows[0]);
  const isPeak = r.date === peakRow.date;
  const [y, m, d] = r.date.split('-');

  dialog(
    `Chi tiết & gợi ý ngày ${d}/${m}/${y}`,
    `<div class="ov-insight-body">
      <div class="ov-insight-item">
        <div class="ov-insight-icon"><i class="ph ph-shield-check"></i></div>
        <div>
          <strong>Cơ chế tính hoa hồng</strong>
          <p>Hoa hồng dự kiến được tính theo tỷ lệ chi trả hiện hành của Shop kết hợp mức thưởng cấp bậc Hạng Vàng (+3%).</p>
        </div>
      </div>
      <div class="ov-insight-item">
        <div class="ov-insight-icon"><i class="ph ph-tag"></i></div>
        <div>
          <strong>Ghi nhận đơn hàng</strong>
          <p>Đơn hàng được phân bổ tự động thông qua mã coupon tiếp thị và cơ chế cookie click cuối cùng (last-click attribution).</p>
        </div>
      </div>
      <div class="ov-insight-item">
        <div class="ov-insight-icon"><i class="ph ph-clock-countdown"></i></div>
        <div>
          <strong>Thời gian đối soát chuyển khả dụng</strong>
          <p>Khoản hoa hồng này sẽ chuyển sang số dư khả dụng sau 14 ngày kể từ khi đơn giao thành công và người mua không có yêu cầu đổi trả.</p>
        </div>
      </div>
      ${isPeak ? `
      <div class="ov-insight-peak-box">
        <i class="ph ph-crown"></i>
        <div>
          <strong>Đỉnh chu kỳ lọc</strong>
          <p>Ngày này ghi nhận lưu lượng và đơn hàng bứt phá nhất chu kỳ nhờ khung giờ chia sẻ link tiếp thị hiệu quả.</p>
        </div>
      </div>` : ''}
    </div>`
  );
}

function bindDayDetailButtons(container) {
  if (!container) return;
  container.querySelectorAll('[data-dash="day-insight"]').forEach(btn => {
    btn.onclick = () => openDayInsight(btn.dataset.date || demo.selectedDay || selection().slice(-1)[0]?.date);
  });
  container.querySelectorAll('[data-dash="open-table"]').forEach(btn => {
    btn.onclick = () => openTableDrawer(selection());
  });
}

export function dashboard() {
  const rows=selection();
  const sum=key=>rows.reduce((a,r)=>a+r[key],0);
  const metrics=[['Lượt nhấp',sum('clicks').toLocaleString('vi-VN')],['Đơn thành công',sum('orders')],['Tỷ lệ chuyển đổi',sum('clicks')?(sum('orders')/sum('clicks')*100).toFixed(2)+'%':'0%'],['Doanh thu',cash(sum('revenue'))]];
  const controls=`<header class="page-head"><div><h1>Tổng quan CTV/KOL</h1><p>Theo dõi kết quả bán hàng, hoa hồng và việc cần làm của bạn.</p></div>${button('links','Tạo link tiếp thị',false)}</header><div class="dash-filter-card"><div class="filter-group"><div class="filter-field"><label class="filter-label"><i class="ph ph-calendar"></i> Khoảng thời gian</label><div class="input-icon-box"><i class="ph ph-clock-countdown"></i><select class="select" data-period><option value="7" ${demo.days===7?'selected':''}>7 ngày gần nhất</option><option value="30" ${demo.days===30?'selected':''}>30 ngày gần nhất</option></select></div></div><div class="filter-field"><label class="filter-label"><i class="ph ph-calendar-blank"></i> Từ ngày</label><div class="input-icon-box"><i class="ph ph-calendar-dots"></i><input class="input" type="date" data-from value="${demo.from||''}"></div></div><div class="filter-field"><label class="filter-label"><i class="ph ph-calendar-check"></i> Đến ngày</label><div class="input-icon-box"><i class="ph ph-calendar-check"></i><input class="input" type="date" data-to value="${demo.to||''}"></div></div><div class="filter-actions"><button class="btn btn-filter-apply" data-dash="apply"><i class="ph ph-funnel"></i> Áp dụng</button><button class="btn secondary btn-filter-reset" data-dash="reset"><i class="ph ph-arrow-counter-clockwise"></i> Đặt lại</button></div></div><div class="filter-field ux-mode-field"><label class="filter-label"><i class="ph ph-flask"></i> Xem trạng thái UX</label><div class="input-icon-box"><i class="ph ph-sliders-horizontal"></i><select class="select" data-mode>${[['ready','Có dữ liệu'],['loading','Đang tải'],['empty','Chưa có dữ liệu'],['error','Lỗi kết nối']].map(([v,t])=>`<option value="${v}" ${demo.mode===v?'selected':''}>${t}</option>`).join('')}</select></div></div></div><p class="dash-error" role="alert" id="range-error"></p>`;
  if(demo.mode==='loading') return controls+`<section class="card" aria-busy="true"><h2>Đang tải báo cáo…</h2><div class="dash-skeleton"></div>${button('ready','Kết thúc mô phỏng tải')}</section>`;
  if(demo.mode==='error') return controls+`<section class="card empty" role="alert"><h2>Chưa tải được số liệu</h2><p>Số dư không bị thay đổi. Kiểm tra kết nối rồi thử lại.</p>${button('ready','Thử lại',false)}</section>`;
  if(demo.mode==='empty'||!rows.length) return controls+`<section class="card empty"><h2>Chưa có kết quả trong khoảng này</h2><p>Tạo link tiếp thị đầu tiên hoặc chọn khoảng thời gian khác.</p>${button('links','Tạo link đầu tiên',false)} ${button('reset','Xem dữ liệu mẫu')}</section>`;
  
  const totalMetric = sum(demo.metric);
  const avgMetric = Math.round(totalMetric / (rows.length || 1));
  const peakRow = rows.reduce((maxR, cur) => cur[demo.metric] > maxR[demo.metric] ? cur : maxR, rows[0]);
  const totalOrders = sum('orders');
  const totalClicks = sum('clicks');
  const totalRevenue = sum('revenue');
  const avgCR = totalClicks ? ((totalOrders / totalClicks) * 100).toFixed(2) + '%' : '0%';
  const estCommission = Math.round(totalRevenue * 0.11);
  
  const ySteps = getNiceYSteps(peakRow[demo.metric]);
  const niceCeil = ySteps[0];
  
  const selectedDate = demo.selectedDay || peakRow.date;
  const selectedRow = rows.find(r => r.date === selectedDate) || peakRow;

  const allTasks = [
    {
      id: 'kyc',
      name: 'Xác minh tài khoản nhận tiền (KYC)',
      status: demo.kyc ? 'Đã xác minh CCCD & Ngân hàng' : 'Cần hoàn tất trước khi rút tiền',
      isDone: demo.kyc,
      action: 'kyc',
      actionLabel: demo.kyc ? 'Xem hồ sơ' : 'Xác minh ngay',
      isSecondary: demo.kyc,
      icon: demo.kyc ? 'ph-check-circle' : 'ph-identification-card'
    },
    {
      id: 'samples',
      name: 'Theo dõi hàng mẫu Serum Vitamin C',
      status: 'Đang giao • GHN',
      isDone: false,
      action: 'samples',
      actionLabel: 'Theo dõi mẫu',
      isSecondary: true,
      icon: 'ph-package'
    },
    {
      id: 'media',
      name: 'Lấy tư liệu video & kịch bản mẫu',
      status: '12 tư liệu mới',
      isDone: false,
      action: 'media',
      actionLabel: 'Tải tư liệu',
      isSecondary: true,
      icon: 'ph-video-camera'
    },
    {
      id: 'channels',
      name: 'Quản lý kênh & Gắn Bio Link',
      status: '2/3 kênh kết nối',
      isDone: false,
      action: 'channels',
      actionLabel: 'Cấu hình',
      isSecondary: true,
      icon: 'ph-share-network'
    }
  ];

  const pendingTasks = allTasks.filter(t => !t.isDone);
  const doneTasks = allTasks.filter(t => t.isDone);
  const visiblePending = demo.showAllTasks ? pendingTasks : pendingTasks.slice(0, 2);

  return controls+`<section class="card wallet-hero"><small>Số dư khả dụng • Toàn bộ thời gian</small><div class="balance">${cash(demo.balance)}</div><div class="wallet-meta">${button('withdraw','Yêu cầu rút tiền',false)}<span>Chờ đối soát: 1.850.000 ₫</span><span>Đang xử lý rút: ${cash(demo.locked)}</span></div></section>
  <div class="grid kpis dash-kpis">
    <article class="card kpi-card-modern">
      <div class="kpi-card-header">
        <div class="kpi-icon-pill kpi-clicks"><i class="ph ph-cursor-click"></i></div>
        <span class="kpi-badge-trend up"><i class="ph ph-trend-up"></i> +18.4%</span>
      </div>
      <div class="kpi-card-content">
        <span class="kpi-card-label">Lượt nhấp tiếp thị (Traffic)</span>
        <strong class="kpi-card-number">${totalClicks.toLocaleString('vi-VN')}</strong>
      </div>
      <div class="kpi-card-bottom">
        <div class="kpi-mini-bar"><div class="mini-bar-fill fill-clicks" style="width: 82%"></div></div>
        <span class="kpi-card-meta">82% chỉ tiêu chu kỳ • +1.310 lượt</span>
      </div>
    </article>

    <article class="card kpi-card-modern">
      <div class="kpi-card-header">
        <div class="kpi-icon-pill kpi-orders"><i class="ph ph-shopping-bag"></i></div>
        <span class="kpi-badge-trend up"><i class="ph ph-trend-up"></i> +12.5%</span>
      </div>
      <div class="kpi-card-content">
        <span class="kpi-card-label">Đơn chốt thành công</span>
        <strong class="kpi-card-number">${totalOrders} <small class="kpi-unit">đơn</small></strong>
      </div>
      <div class="kpi-card-bottom">
        <div class="kpi-mini-bar"><div class="mini-bar-fill fill-orders" style="width: 76%"></div></div>
        <span class="kpi-card-meta">Tỷ lệ hủy hoàn chỉ 0.9% • Đã giao 88</span>
      </div>
    </article>

    <article class="card kpi-card-modern">
      <div class="kpi-card-header">
        <div class="kpi-icon-pill kpi-cr"><i class="ph ph-target"></i></div>
        <span class="kpi-badge-trend up"><i class="ph ph-trend-up"></i> +0.32%</span>
      </div>
      <div class="kpi-card-content">
        <span class="kpi-card-label">Tỷ lệ chuyển đổi đơn (CR%)</span>
        <strong class="kpi-card-number">${avgCR}</strong>
      </div>
      <div class="kpi-card-bottom">
        <div class="kpi-mini-bar"><div class="mini-bar-fill fill-cr" style="width: 70%"></div></div>
        <span class="kpi-card-meta">Mức trung bình ngành mỹ phẩm: 1.05%</span>
      </div>
    </article>

    <article class="card kpi-card-modern">
      <div class="kpi-card-header">
        <div class="kpi-icon-pill kpi-revenue"><i class="ph ph-wallet"></i></div>
        <span class="kpi-badge-trend up"><i class="ph ph-trend-up"></i> +24.8%</span>
      </div>
      <div class="kpi-card-content">
        <span class="kpi-card-label">Doanh thu phát sinh (GMV)</span>
        <strong class="kpi-card-number">${cash(totalRevenue)}</strong>
      </div>
      <div class="kpi-card-bottom">
        <div class="kpi-mini-bar"><div class="mini-bar-fill fill-revenue" style="width: 88%"></div></div>
        <span class="kpi-card-meta">Hoa hồng ước tính: <strong class="text-emerald">${cash(estCommission)}</strong></span>
      </div>
    </article>
  </div>
  <div class="split ov-chart-split">
    <section class="card dash-chart-card">
      <div class="dash-chart-header">
        <div class="dash-chart-title-group">
          <div class="chart-title-with-icon">
            <div class="chart-icon-box"><i class="ph ph-chart-bar"></i></div>
            <div>
              <h2>Hiệu suất bán hàng & Tiếp thị</h2>
              <p class="chart-subtitle">Lưu lượng truy cập link, đơn hàng và hoa hồng theo từng ngày</p>
            </div>
          </div>
        </div>
        <div class="chart-controls-wrap">
          <div class="chart-metric-select-box">
            <i class="ph ph-funnel"></i>
            <select class="select" data-metric aria-label="Chọn chỉ số biểu đồ">
              ${[
                ['clicks','Lượt nhấp (Traffic)'],
                ['orders','Đơn hàng (Orders)'],
                ['revenue','Doanh thu GMV (₫)'],
                ['commission','Hoa hồng ước tính (₫)']
              ].map(([v,t])=>`<option value="${v}" ${demo.metric===v?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="chart-kpi-ribbon">
        <div class="chart-kpi-pill">
          <div class="kpi-pill-icon"><i class="ph ph-activity"></i></div>
          <div class="kpi-pill-content">
            <span class="kpi-pill-label">Tổng chu kỳ</span>
            <strong class="kpi-pill-val">${formatMetricValue(totalMetric, demo.metric)}</strong>
          </div>
        </div>
        <div class="chart-kpi-pill">
          <div class="kpi-pill-icon peak"><i class="ph ph-trophy"></i></div>
          <div class="kpi-pill-content">
            <span class="kpi-pill-label">Đỉnh cao nhất</span>
            <strong class="kpi-pill-val">${formatMetricValue(peakRow[demo.metric], demo.metric)} <span class="kpi-peak-date">(${peakRow.date.slice(8)}/09)</span></strong>
          </div>
        </div>
        <div class="chart-kpi-pill">
          <div class="kpi-pill-icon"><i class="ph ph-chart-bar"></i></div>
          <div class="kpi-pill-content">
            <span class="kpi-pill-label">Trung bình ngày</span>
            <strong class="kpi-pill-val">${formatMetricValue(avgMetric, demo.metric)}</strong>
          </div>
        </div>
        <div class="chart-kpi-pill">
          <div class="kpi-pill-icon cr"><i class="ph ph-target"></i></div>
          <div class="kpi-pill-content">
            <span class="kpi-pill-label">Tỷ lệ chuyển đổi TB</span>
            <strong class="kpi-pill-val">${avgCR}</strong>
          </div>
        </div>
      </div>

      <div class="chart-help-hint">
        <i class="ph ph-cursor-click"></i>
        <span>Chạm hoặc click vào từng cột để xem chi tiết doanh số & hoa hồng ngày đó.</span>
      </div>

      <div class="dash-chart-stage">
        <div class="chart-y-axis">
          ${ySteps.map(val => `
            <div class="chart-y-row">
              <span class="chart-y-val">${formatCompactY(val, demo.metric)}</span>
              <span class="chart-grid-line ${val === 0 ? 'chart-grid-base' : ''}"></span>
            </div>
          `).join('')}
        </div>

        <div class="chart-bars-container">
          ${rows.map(r => {
            const isPeak = r[demo.metric] === peakRow[demo.metric];
            const isSelected = r.date === selectedRow.date;
            const heightPct = Math.max(6, Math.min(100, Math.round((r[demo.metric] / niceCeil) * 100)));
            const cr = r.clicks ? ((r.orders / r.clicks) * 100).toFixed(1) : '0';
            return `
            <button type="button" class="dash-column-box ${isPeak ? 'is-peak' : ''} ${isSelected ? 'is-selected' : ''}" 
                    data-day="${r.date}" 
                    data-clicks="${r.clicks}"
                    data-orders="${r.orders}"
                    data-revenue="${r.revenue}"
                    data-commission="${r.commission}"
                    aria-label="Ngày ${r.date}: ${formatMetricValue(r[demo.metric], demo.metric)}">
              
              ${isPeak ? `
                <div class="peak-indicator">
                  <i class="ph ph-crown-simple"></i>
                  <span>Đỉnh</span>
                </div>
              ` : ''}

              <span class="column-val-badge">${formatCompactY(r[demo.metric], demo.metric)}</span>

              <div class="column-bar-track">
                <div class="column-bar-fill" style="height: ${heightPct}%">
                  <div class="bar-shine"></div>
                </div>
              </div>

              <div class="column-x-label">
                <span class="x-day-num">${r.date.slice(8)}</span>
                <span class="x-weekday">${getWeekday(r.date)}</span>
              </div>

              <div class="chart-hover-card" role="tooltip">
                <div class="thc-head">
                  <strong>${formatDateFull(r.date)}</strong>
                  <span class="thc-cr-badge">CR: ${cr}%</span>
                </div>
                <div class="thc-body">
                  <div class="thc-item">
                    <span><i class="ph ph-cursor-click"></i> Lượt nhấp:</span>
                    <strong>${r.clicks.toLocaleString('vi-VN')}</strong>
                  </div>
                  <div class="thc-item">
                    <span><i class="ph ph-shopping-bag"></i> Đơn hàng:</span>
                    <strong>${r.orders} đơn</strong>
                  </div>
                  <div class="thc-item">
                    <span><i class="ph ph-chart-line-up"></i> Doanh thu:</span>
                    <strong>${cash(r.revenue)}</strong>
                  </div>
                  <div class="thc-item highlight">
                    <span><i class="ph ph-coins"></i> Hoa hồng:</span>
                    <strong class="text-brand">${cash(r.commission)}</strong>
                  </div>
                </div>
              </div>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div id="day-detail" class="day-insight-wrapper" aria-live="polite">
        ${renderDayDetail(selectedRow, selectedRow.date === peakRow.date)}
      </div>
    </section>
    <section class="card ov-recent-card"><div class="card-title"><h2>Hoa hồng gần đây</h2>${button('wallet','Xem ví')}</div>${records.map((r,i)=>`<button class="dash-record" data-record="${i}"><strong>#${r.id} <span class="text-nowrap">${cash(commission(r))}</span></strong><small>${r.title} • ${r.status}</small></button>`).join('')}<p class="ov-recent-note">Các đơn bên trên là ví dụ từng trạng thái, không phải toàn bộ lịch sử.</p></section>
  </div>

  <div class="ov-bottom-grid">
    <!-- Hạng Vàng Card -->
    <section class="card ov-tier-card">
      <div class="ov-tier-header">
        <div class="ov-tier-title-wrap">
          <h2 class="ov-tier-title">Hạng Vàng <span class="ov-tier-dot">·</span> <span class="ov-tier-bonus">+3% hoa hồng</span></h2>
        </div>
        <button class="ov-tier-rules-btn" data-dash="tiers" type="button">
          <i class="ph ph-book-open"></i> Quy tắc & quyền lợi
        </button>
      </div>

      <div class="ov-tier-progress-row">
        <span class="ov-tier-label">Doanh số tháng 09/2026:</span>
        <strong class="ov-tier-values text-nowrap">37,5 / 50 triệu ₫</strong>
      </div>
      
      <div class="ov-tier-bar-slim">
        <div class="ov-tier-bar-fill" style="width: 75%"></div>
      </div>

      <div class="ov-tier-meta-row">
        <span class="ov-tier-remaining">Còn thiếu <strong>12,5 triệu ₫</strong> để đạt mốc <strong>Kim Cương</strong></span>
        <span class="ov-tier-pct">75%</span>
      </div>
    </section>

    <!-- Việc cần làm Card -->
    <section class="card ov-task-card">
      <div class="ov-task-header">
        <h2>Việc cần làm</h2>
        <span class="ov-task-counter">${doneTasks.length}/${allTasks.length} hoàn tất</span>
      </div>

      <div class="ov-task-list">
        ${visiblePending.map(t => `
          <div class="ov-task-row">
            <div class="ov-task-icon"><i class="ph ${t.icon}"></i></div>
            <div class="ov-task-info">
              <div class="ov-task-name">${t.name}</div>
              <div class="ov-task-status">${t.status}</div>
            </div>
            <button class="btn ${t.isSecondary ? 'secondary' : ''} ov-task-btn" data-dash="${t.action}">${t.actionLabel}</button>
          </div>
        `).join('')}

        ${pendingTasks.length > 2 ? `
          <button type="button" class="ov-task-toggle-btn" data-dash="toggle-tasks">
            <i class="ph ${demo.showAllTasks ? 'ph-caret-up' : 'ph-caret-down'}"></i>
            ${demo.showAllTasks ? 'Thu gọn' : `Xem tất cả (${pendingTasks.length})`}
          </button>
        ` : ''}

        ${doneTasks.length > 0 ? `
          <details class="ov-completed-group" ${demo.kyc ? 'open' : ''}>
            <summary class="ov-completed-summary">
              <span>Đã hoàn tất (${doneTasks.length})</span>
              <i class="ph ph-caret-down"></i>
            </summary>
            <div class="ov-completed-list">
              ${doneTasks.map(t => `
                <div class="ov-task-row is-done">
                  <div class="ov-task-icon done"><i class="ph ${t.icon}"></i></div>
                  <div class="ov-task-info">
                    <div class="ov-task-name">${t.name}</div>
                    <div class="ov-task-status status-done">${t.status}</div>
                  </div>
                  <button class="btn secondary ov-task-btn" data-dash="${t.action}">${t.actionLabel}</button>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}
      </div>
    </section>
  </div>

  <!-- Gợi ý sản phẩm tiềm năng (Sleek Compact Opportunity Widget) -->
  <section class="card ov-opp-card">
    <div class="ov-opp-inner">
      <div class="ov-opp-thumb">
        <img src="./assets/serum-hero-optimized.jpg" alt="Serum Vitamin C 15%" class="ov-opp-img" />
      </div>

      <div class="ov-opp-main">
        <div class="ov-opp-topline">
          <span class="ov-opp-sub"><i class="ph ph-lightning"></i> Gợi ý đẩy số hôm nay • Shop Nhật Xinh</span>
          <span class="ov-opp-comm-rate">Hoa hồng 11%</span>
        </div>
        <h3 class="ov-opp-title">Serum Vitamin C 15% Dưỡng Sáng & Chống Lão Hóa</h3>
        
        <div class="ov-opp-meta-line">
          <span>Giá: <strong>459.000 ₫</strong></span>
          <span class="ov-opp-dot">·</span>
          <span>Thực nhận: <strong class="text-emerald">50.490 ₫/đơn</strong></span>
          <span class="ov-opp-dot">·</span>
          <span>Đã bán: <strong>142 chai</strong></span>
          <span class="ov-opp-dot">·</span>
          <details class="ov-opp-details-inline">
            <summary class="ov-opp-details-summary">Chính sách đối soát</summary>
            <span class="ov-opp-details-text">Tỷ lệ hoàn hủy 0.8%. Thưởng Hạng Vàng +3% tự động cộng vào mỗi đơn.</span>
          </details>
        </div>
      </div>

      <div class="ov-opp-actions">
        <button class="btn ov-opp-btn" data-dash="links">
          <i class="ph ph-qr-code"></i> Tạo Link & QR
        </button>
        <button class="btn secondary ov-opp-btn" data-dash="samples">
          <i class="ph ph-gift"></i> Xin mẫu thử
        </button>
        <button type="button" class="ov-opp-catalog-btn" data-dash="links" title="Khám phá toàn bộ 142 sản phẩm của gian hàng Shop Nhật Xinh">
          <i class="ph ph-storefront"></i>
          <span>Xem 142 sp</span>
          <i class="ph ph-arrow-right ov-arrow-icon"></i>
        </button>
      </div>
    </div>
  </section>`;
}

function dialog(title,body) {
  restoreFocus=document.activeElement;
  document.querySelector('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dash-dialog-title"><div class="modal-head"><h2 id="dash-dialog-title">${title}</h2><button class="icon-btn" data-close-modal aria-label="Đóng">×</button></div>${body}</section></div>`;
  const backdrop=document.querySelector('.modal-backdrop');
  const close=()=>{document.querySelector('#modal-root').innerHTML='';restoreFocus?.isConnected&&restoreFocus.focus();};
  backdrop.querySelector('[data-close-modal]').onclick=close;
  backdrop.onclick=e=>{if(e.target===backdrop)close();};
  backdrop.onkeydown=e=>{
    if(e.key==='Escape'){close();return;}
    if(e.key==='Tab') {const items=[...backdrop.querySelectorAll('button,input,select,textarea')].filter(n=>!n.disabled); const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  };
  backdrop.querySelector('input,button').focus();
}

export function withdrawal() {
  if(!demo.kyc){
    dialog('Cần xác minh trước khi rút tiền','<p>Hồ sơ CCCD, mã số thuế và tài khoản ngân hàng chưa được xác nhận. Không tạo yêu cầu rút tiền khi KYC chưa hoàn tất.</p><button class="btn" id="verify-demo">Mô phỏng KYC đã duyệt</button>');
    const vBtn = document.querySelector('#verify-demo');
    if(vBtn) {
      vBtn.onclick=()=>{
        demo.kyc=true;
        handlers?.refresh ? handlers.refresh() : null;
        withdrawal();
      };
    }
    return;
  }
  dialog('Yêu cầu rút tiền',`<p>Chỉ mô phỏng UX, không thực hiện giao dịch thật.</p><p>Vietcombank • **** 8842 • Trần Văn Nhật</p><p>Khả dụng: ${cash(demo.balance)}. Tối thiểu: 200.000 ₫.</p><form id="withdraw-form" novalidate><label class="field">Số tiền rút<input class="input" type="number" id="amount" min="200000" max="${demo.balance}" value="2000000" step="1" aria-describedby="withdraw-error"></label><div class="summary" id="withdraw-summary"></div><p>Quy tắc thuế demo theo đặc tả: 10% với yêu cầu từ 2 triệu; cần xác minh lại trước triển khai thực tế.</p><p id="withdraw-error" class="dash-error" role="alert"></p><label><input type="checkbox" id="simulate-failure"> Mô phỏng lỗi xử lý</label><button class="btn" type="submit">Tiếp tục xác thực OTP</button></form>`);
  const input=document.querySelector('#amount');
  const update=()=>{const n=Number(input.value),tax=n>=2000000?Math.round(n*.1):0;document.querySelector('#withdraw-summary').innerHTML=`<div><span>Yêu cầu</span><strong>${cash(n||0)}</strong></div><div><span>Thuế mẫu</span><strong>${cash(tax)}</strong></div><div><span>Thực nhận</span><strong>${cash((n||0)-tax)}</strong></div>`;};input.oninput=update;update();
  document.querySelector('#withdraw-form').onsubmit=e=>{e.preventDefault();const n=Number(input.value);if(!Number.isSafeInteger(n)||n<200000||n>demo.balance){document.querySelector('#withdraw-error').textContent='Nhập số tiền nguyên từ 200.000 ₫ và không vượt số dư khả dụng.';input.setAttribute('aria-invalid','true');return;}demo.fail=document.querySelector('#simulate-failure').checked;otp(n);};
}
function otp(amount) {
  dialog('Xác thực yêu cầu rút tiền',`<p>Số tiền: ${cash(amount)}. Mã demo: <strong>123456</strong>. Không có SMS thật.</p><form id="otp-form"><label class="field">Mã OTP<input class="input" id="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label><p class="dash-error" id="otp-error" role="alert"></p><button class="btn" id="otp-submit">Xác nhận yêu cầu</button><button class="btn secondary" type="button" id="resend">Gửi lại mã demo</button></form>`);
  let expires=Date.now()+60000,busy=false;
  document.querySelector('#resend').onclick=()=>{expires=Date.now()+60000;document.querySelector('#otp-error').textContent='Mã mới: 123456. Hiệu lực 60 giây.';};
  document.querySelector('#otp-form').onsubmit=e=>{e.preventDefault();if(busy)return;const error=document.querySelector('#otp-error');if(Date.now()>expires){error.textContent='Mã hết hạn. Hãy gửi lại mã.';return;}if(document.querySelector('#otp').value!=='123456'){error.textContent='Mã chưa đúng. Nhập 123456 để thử bản demo.';return;}busy=true;const submit=document.querySelector('#otp-submit');submit.disabled=true;submit.textContent='Đang xử lý…';document.querySelector('#resend').disabled=true;
    setTimeout(()=>{if(demo.fail){dialog('Chưa tạo được yêu cầu','<p>Lỗi xử lý mô phỏng. Số dư chưa bị trừ.</p><button class="btn" id="retry-withdraw">Thử lại</button>');document.querySelector('#retry-withdraw').onclick=withdrawal;return;}demo.balance-=amount;demo.locked+=amount;dialog('Đã gửi yêu cầu',`<p>Yêu cầu demo đang chờ Shop duyệt.</p><div class="summary"><div><span>Số tiền đang xử lý</span><strong>${cash(amount)}</strong></div><div><span>Khả dụng còn lại</span><strong>${cash(demo.balance)}</strong></div></div><p>Chưa chuyển tiền ngân hàng. Dữ liệu này chỉ giữ trong phiên xem prototype.</p>`);if(location.hash==='#kol-dashboard'||!location.hash){document.querySelector('.page').innerHTML=dashboard();bindDashboard(document.querySelector('.page'),handlers);}},500);
  };
}
let handlers;
export function bindDashboard(root, actions) {
  handlers=actions;
  const periodSel = root.querySelector('[data-period]');
  if(periodSel) periodSel.onchange = e => { demo.days=Number(e.target.value); demo.from=demo.to=''; demo.selectedDay=null; actions.refresh(); };
  const modeSel = root.querySelector('[data-mode]');
  if(modeSel) modeSel.onchange = e => { demo.mode=e.target.value; actions.refresh(); };
  const metricSel = root.querySelector('[data-metric]');
  if(metricSel) metricSel.onchange = e => { demo.metric=e.target.value; actions.refresh(); };

  root.querySelectorAll('[data-day]').forEach(b=>{
    b.onclick=()=>{
      demo.selectedDay = b.dataset.day;
      root.querySelectorAll('.dash-column-box').forEach(el=>el.classList.remove('is-selected'));
      b.classList.add('is-selected');
      const r=daily.find(item=>item.date===b.dataset.day);
      if(r){
        const rows = selection();
        const peakRow = rows.reduce((maxR, cur) => cur[demo.metric] > maxR[demo.metric] ? cur : maxR, rows[0]);
        const dayDetailEl = root.querySelector('#day-detail');
        if(dayDetailEl) {
          dayDetailEl.innerHTML = renderDayDetail(r, r.date === peakRow.date);
          bindDayDetailButtons(dayDetailEl);
        }
      }
    };
  });

  bindDayDetailButtons(root.querySelector('#day-detail'));

  root.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>{const r=records[Number(b.dataset.record)];dialog(`Hoa hồng #${r.id}`,`<p>${r.title} • ${r.status}</p><p>Nguồn ghi nhận: ${r.source}</p><div class="summary"><div><span>Giá trị sản phẩm</span><strong>${r.qty} × ${cash(r.price)}</strong></div><div><span>Cơ bản + hạng + chiến dịch</span><strong>${r.base}% + ${r.tier}% + ${r.campaign}%</strong></div><div><span>Hoa hồng</span><strong>${cash(commission(r))}</strong></div></div><p>${r.status==='Chờ đối soát'?'Chuyển khả dụng sau 14 ngày kể từ giao thành công nếu không hoàn trả.':r.status==='Đã thu hồi'?'Đơn hoàn trả: hoa hồng bị thu hồi, không cộng vào số dư khả dụng.':'Đã kết thúc kỳ chờ đối soát.'}</p>`);});

  root.querySelectorAll('[data-dash]').forEach(b=>{
    b.onclick=()=>{
      const a=b.dataset.dash;
      if(a==='links'){
        if(actions.go) return actions.go('links');
        location.hash = '#links';
        return;
      }
      if(a==='withdraw')return withdrawal();
      if(a==='ready'){demo.mode='ready';return actions.refresh();}
      if(a==='reset'){demo.days=7;demo.from=demo.to='';demo.mode='ready';demo.selectedDay=null;demo.showAllTasks=false;return actions.refresh();}
      if(a==='apply'){const from=root.querySelector('[data-from]').value,to=root.querySelector('[data-to]').value;if(!from||!to||from>to){root.querySelector('#range-error').textContent='Chọn đủ hai ngày; ngày bắt đầu không được sau ngày kết thúc.';return;}demo.from=from;demo.to=to;demo.days=30;demo.selectedDay=null;return actions.refresh();}
      if(a==='open-table'){
        return openTableDrawer(selection());
      }
      if(a==='day-insight'){
        const date = b.dataset.date || demo.selectedDay || selection().slice(-1)[0]?.date;
        return openDayInsight(date);
      }
      if(a==='toggle-tasks'){
        demo.showAllTasks = !demo.showAllTasks;
        return actions.refresh();
      }
      if(a==='kyc'){
        dialog('Xác minh tài khoản nhận tiền',`<p>Trạng thái mẫu: ${demo.kyc?'Đã xác minh':'Chưa xác minh'}.</p><p>Hồ sơ cần: CCCD, mã số thuế, ngân hàng chính chủ. Prototype không thu thập giấy tờ thật.</p><button class="btn" id="toggle-kyc">${demo.kyc?'Mô phỏng chưa xác minh':'Mô phỏng đã xác minh'}</button>`);
        const toggleBtn = document.querySelector('#toggle-kyc');
        if(toggleBtn) {
          toggleBtn.onclick=()=>{
            demo.kyc=!demo.kyc;
            document.querySelector('#modal-root').innerHTML='';
            actions.refresh();
          };
        }
        return;
      }
      if(a==='tiers'){
        dialog('Quy tắc & Quyền lợi cấp bậc KOL',`
          <div class="ov-tier-modal-wrap">
            <div class="ov-tier-modal-block">
              <h3 class="ov-tier-block-title"><i class="ph ph-shield-star"></i> Quyền lợi Hạng Vàng của bạn</h3>
              <ul class="ov-tier-perks-list">
                <li><i class="ph ph-check-circle"></i> <span><strong>+3% hoa hồng:</strong> Tự động cộng dồn vào mức hoa hồng cơ bản trên mọi sản phẩm.</span></li>
                <li><i class="ph ph-check-circle"></i> <span><strong>3 mẫu thử/tháng:</strong> Được đăng ký tối đa 3 sản phẩm dùng thử miễn phí mỗi tháng.</span></li>
                <li><i class="ph ph-check-circle"></i> <span><strong>Rút tiền ưu tiên 4h:</strong> Lệnh rút tiền được duyệt và xử lý nhanh trong 4 giờ làm việc.</span></li>
                <li><i class="ph ph-check-circle"></i> <span><strong>Hỗ trợ 1-1 từ Shop:</strong> Có quản lý đối tác hỗ trợ tư vấn chiến dịch và cấp voucher riêng.</span></li>
              </ul>
            </div>
            <div class="ov-tier-modal-block">
              <h3 class="ov-tier-block-title"><i class="ph ph-chart-line-up"></i> Bảng cấp bậc & Điều kiện xét hạng</h3>
              <div class="table-wrap">
                <table class="dash-custom-table" style="font-size:13px">
                  <thead>
                    <tr>
                      <th>Cấp bậc</th>
                      <th>Thưởng hoa hồng</th>
                      <th>Doanh số tháng</th>
                      <th>Quyền lợi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Đồng</td><td>+0%</td><td>Dưới 10 triệu ₫</td><td>1 mẫu thử/tháng</td></tr>
                    <tr><td>Bạc</td><td>+1%</td><td>Từ 10 triệu ₫</td><td>2 mẫu thử, rút tiền 24h</td></tr>
                    <tr class="tr-selected"><td><strong>Vàng (Hiện tại)</strong></td><td><strong class="text-brand">+3%</strong></td><td><strong>Từ 25 triệu ₫</strong></td><td><strong>3 mẫu thử, rút tiền 4h, hỗ trợ 1-1</strong></td></tr>
                    <tr><td>Kim Cương</td><td>+5%</td><td>Từ 50 triệu ₫</td><td>Không giới hạn mẫu thử, rút tức thì</td></tr>
                  </tbody>
                </table>
              </div>
              <p class="ov-tier-note-text">Doanh số xét hạng chốt vào 23:59 ngày cuối tháng. Chỉ tính đơn hàng giao thành công, không tính đơn hoàn hủy.</p>
            </div>
          </div>
        `);
        return;
      }
      actions.go(a);
    };
  });
}

// ==========================================================================
// SCANMS KOL PROFILE & ACCOUNT MANAGEMENT
// ==========================================================================
export const kolProfileState = {
  activeTab: 'personal', // 'personal' | 'social' | 'bank' | 'security'
  profile: {
    avatar: 'N',
    name: 'Trần Văn Nhật',
    nickname: 'nhatbeauty',
    email: 'kol@scanms.vn',
    phone: '0988 776 655',
    dob: '1998-10-15',
    gender: 'male',
    idCard: '079098001234',
    taxCode: '8492019281',
    address: '12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP. Hồ Chí Minh',
    kycStatus: 'verified', // 'verified' | 'pending'
    tier: 'KOL Hạng Vàng',
    tierBonus: '+3% hoa hồng',
    bio: 'KOL chuyên review mỹ phẩm dưỡng da, đồ chăm sóc cơ thể & công nghệ làm đẹp. 3 năm đồng hành cùng SCANMS.',
    categories: ['Mỹ phẩm & Skincare', 'Chăm sóc cá nhân', 'Review đồ công nghệ làm đẹp'],
    channels: [
      { platform: 'tiktok', name: 'TikTok', handle: '@nhatbeauty', followers: '185,400 followers', url: 'https://tiktok.com/@nhatbeauty', icon: 'ph-tiktok-logo', verified: true },
      { platform: 'youtube', name: 'YouTube', handle: 'Nhật Beauty Official', followers: '42,800 subs', url: 'https://youtube.com/@nhatbeauty', icon: 'ph-youtube-logo', verified: true },
      { platform: 'instagram', name: 'Instagram', handle: '@nhat.beauty', followers: '68,200 followers', url: 'https://instagram.com/nhat.beauty', icon: 'ph-instagram-logo', verified: true },
      { platform: 'facebook', name: 'Facebook Fanpage', handle: 'Trần Văn Nhật - Beauty Care', followers: '35,000 followers', url: 'https://facebook.com/nhatbeauty', icon: 'ph-facebook-logo', verified: false },
    ],
    bank: {
      bankName: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam',
      accountNumber: '1018928374',
      accountName: 'TRAN VAN NHAT',
      branch: 'Chi nhánh Nam Sài Gòn, TP.HCM',
    }
  }
};

// Khôi phục từ localStorage nếu có
try {
  const saved = localStorage.getItem('scanms_profile_kol');
  if (saved) {
    const parsed = JSON.parse(saved);
    kolProfileState.profile = { ...kolProfileState.profile, ...parsed };
  }
} catch (e) {}

export function kolProfileScreen() {
  // Luôn đồng bộ dữ liệu mới nhất từ localStorage để cập nhật avatar kể cả sau khi đổi role hay F5
  try {
    const saved = localStorage.getItem('scanms_profile_kol');
    if (saved) {
      const parsed = JSON.parse(saved);
      kolProfileState.profile = { ...kolProfileState.profile, ...parsed };
    }
  } catch (e) {}

  const p = kolProfileState.profile;
  const tab = kolProfileState.activeTab;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>KOL / </span><strong>Hồ sơ cá nhân</strong></div>
        <h1>Hồ Sơ & Tài Khoản KOL / Creator</h1>
        <p>Quản lý thông tin định danh KYC, liên kết mạng xã hội, tài khoản nhận hoa hồng VietQR và bảo mật đăng nhập.</p>
      </div>
      <div class="actions">
        <span class="badge-kyc-verified"><i class="ph ph-check-circle"></i> ĐÃ XÁC THỰC KYC</span>
        <span class="badge warning" style="font-size:12px"><i class="ph ph-crown"></i> ${p.tier}</span>
      </div>
    </header>

    <div class="profile-view-wrap">
      <!-- Navigation Tabs -->
      <div class="profile-tab-nav" role="tablist">
        <button class="profile-tab-btn ${tab === 'personal' ? 'active' : ''}" data-kol-tab="personal">
          <i class="ph ph-user"></i> Thông tin cá nhân & KYC
        </button>
        <button class="profile-tab-btn ${tab === 'social' ? 'active' : ''}" data-kol-tab="social">
          <i class="ph ph-share-network"></i> Kênh mạng xã hội & Bio
        </button>
        <button class="profile-tab-btn ${tab === 'bank' ? 'active' : ''}" data-kol-tab="bank">
          <i class="ph ph-bank"></i> Ngân hàng nhận hoa hồng
        </button>
        <button class="profile-tab-btn ${tab === 'security' ? 'active' : ''}" data-kol-tab="security">
          <i class="ph ph-lock-key"></i> Mật khẩu & Bảo mật 2FA
        </button>
      </div>

      <!-- Tab 1: Thông tin cá nhân & KYC -->
      ${tab === 'personal' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-identification-card" style="color:var(--brand)"></i> Thông tin định danh cá nhân
            </h3>

            <div class="profile-avatar-uploader">
              <div class="profile-avatar-uploader-circle" id="kol-avatar-circle-trigger" onclick="document.getElementById('kol-avatar-file')?.click()" style="background:var(--brand-soft);color:var(--brand-strong);cursor:pointer" title="Click để chọn ảnh từ máy">
                ${p.avatarImg ? `<img src="${p.avatarImg}" alt="${p.name}" />` : p.avatar}
                <div class="profile-avatar-uploader-overlay">
                  <i class="ph ph-camera"></i>
                  <span>Đổi ảnh</span>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <strong style="font-size:16px;color:var(--text)">${p.name}</strong>
                  <span class="badge-kyc-verified"><i class="ph ph-shield-check"></i> Căn cước công dân đã đối soát</span>
                </div>
                <span style="font-size:12.5px;color:var(--muted);display:block;margin:3px 0 8px">Biệt danh Creator: <strong>@${p.nickname}</strong> • ${p.tier}</span>
                <div class="profile-avatar-actions">
                  <input type="file" id="kol-avatar-file" accept="image/*" style="display:none" />
                  <label for="kol-avatar-file" class="btn small outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin:0">
                    <i class="ph ph-upload-simple"></i> Tải ảnh từ máy
                  </label>
                  ${p.avatarImg ? `
                    <button type="button" class="btn small text-danger" id="kol-avatar-remove-btn" style="border:1px solid #fecaca;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;gap:6px;cursor:pointer" title="Gỡ ảnh đại diện">
                      <i class="ph ph-trash"></i> Gỡ ảnh
                    </button>
                  ` : ''}
                  <span style="font-size:11.5px;color:var(--muted)">Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)</span>
                </div>
              </div>
            </div>

            <form id="kol-personal-form" class="form-stack">
              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Họ và tên *</label>
                  <input class="input" id="kol-name" value="${p.name}" required />
                </div>
                <div class="field">
                  <label>Biệt danh Creator</label>
                  <input class="input" id="kol-nickname" value="${p.nickname}" required />
                </div>
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Email liên hệ nhận báo cáo</label>
                  <input class="input" id="kol-email" value="${p.email}" required />
                </div>
                <div class="field">
                  <label>Số điện thoại xác thực OTP *</label>
                  <input class="input" id="kol-phone" value="${p.phone}" required />
                </div>
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Ngày sinh</label>
                  <input class="input" type="date" id="kol-dob" value="${p.dob}" />
                </div>
                <div class="field">
                  <label>Giới tính</label>
                  <select class="select" id="kol-gender">
                    <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Nam</option>
                    <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Nữ</option>
                    <option value="other" ${p.gender === 'other' ? 'selected' : ''}>Khác</option>
                  </select>
                </div>
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Số CCCD / CMND (Đã xác minh)</label>
                  <input class="input" id="kol-idcard" value="${p.idCard}" />
                </div>
                <div class="field">
                  <label>Mã số thuế TNCN</label>
                  <input class="input" id="kol-taxcode" value="${p.taxCode}" />
                </div>
              </div>

              <div class="field">
                <label>Địa chỉ liên hệ nhận hàng mẫu & thư từ</label>
                <input class="input" id="kol-address" value="${p.address}" required />
              </div>

              <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-floppy-disk"></i> Lưu thay đổi hồ sơ
                </button>
              </div>
            </form>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px">
            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 14px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-shield-star" style="color:#d97706"></i> Quyền lợi Hạng Vàng
              </h4>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.7">
                <li><strong style="color:var(--text)">+3.0% hoa hồng</strong> cộng dồn trên toàn bộ đơn hàng hợp lệ.</li>
                <li>Hạn mức đăng ký nhận <strong>3 sản phẩm dùng thử</strong> miễn phí mỗi tháng.</li>
                <li>Duyệt chi trả rút tiền siêu tốc trong <strong>4 giờ làm việc</strong>.</li>
                <li>Có chuyên viên hỗ trợ 1-1 từ nhãn hàng độc quyền.</li>
              </ul>
            </div>

            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-clock-counter-clockwise" style="color:var(--brand)"></i> Hoạt động gần đây
              </h4>
              <div style="font-size:12.5px;color:var(--muted);line-height:1.6">
                <div>• Cập nhật hồ sơ CCCD: <strong>Đã duyệt</strong></div>
                <div>• Đơn rút tiền gần nhất: <strong>12.450.000 ₫ (Thành công)</strong></div>
                <div>• Doanh số tháng này: <strong>38.620.000 ₫</strong></div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 2: Kênh mạng xã hội & Bio -->
      ${tab === 'social' ? `
        <div class="card" style="padding:26px">
          <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
            <i class="ph ph-share-network" style="color:var(--brand)"></i> Kênh truyền thông & Lĩnh vực thế mạnh
          </h3>

          <div class="field" style="margin:16px 0">
            <label>Tiểu sử Creator (Bio) - Hiển thị trên danh bạ KOL cho các Shop</label>
            <textarea class="input" id="kol-bio" rows="3" style="resize:vertical">${p.bio}</textarea>
          </div>

          <h4 style="font-size:15px;font-weight:750;margin:22px 0 12px;color:var(--text)">Các kênh mạng xã hội đã kết nối</h4>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
            ${p.channels.map(ch => `
              <div class="profile-social-item">
                <i class="ph ${ch.icon}" style="color:var(--brand-strong)"></i>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px">
                    <strong style="font-size:14px;color:var(--text)">${ch.name}</strong>
                    ${ch.verified ? '<span class="badge success" style="font-size:10.5px">Đã liên kết</span>' : '<span class="badge" style="font-size:10.5px">Chưa xác minh</span>'}
                  </div>
                  <div style="font-size:12px;color:var(--muted);margin-top:2px">${ch.handle} • <strong>${ch.followers}</strong></div>
                  <a href="${ch.url}" target="_blank" style="font-size:11.5px;color:var(--brand);text-decoration:none;display:inline-block;margin-top:4px">${ch.url}</a>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top:22px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:flex-end">
            <button id="btn-save-social" class="btn" style="padding:10px 24px;font-weight:750">
              <i class="ph ph-floppy-disk"></i> Lưu thông tin kênh & Bio
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Tab 3: Ngân hàng nhận hoa hồng -->
      ${tab === 'bank' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-bank" style="color:var(--brand)"></i> Tài khoản Ngân hàng nhận chi trả (VietQR / Napas)
            </h3>
            <p style="font-size:13px;color:var(--muted);margin:10px 0 18px">
              Tài khoản này được dùng để nhận tiền khi bạn tạo yêu cầu rút hoa hồng. Tên chủ tài khoản phải trùng khớp 100% với tên trên CCCD định danh.
            </p>

            <form id="kol-bank-form" class="form-stack">
              <div class="field">
                <label>Ngân hàng thụ hưởng *</label>
                <select class="select" id="kol-bankname">
                  <option value="Vietcombank - Ngân hàng Ngoại thương Việt Nam" ${p.bank.bankName.includes('Vietcombank') ? 'selected' : ''}>Vietcombank - Ngân hàng Ngoại thương Việt Nam</option>
                  <option value="MB Bank - Ngân hàng Quân Đội" ${p.bank.bankName.includes('MB') ? 'selected' : ''}>MB Bank - Ngân hàng Quân Đội</option>
                  <option value="Techcombank - Ngân hàng Kỹ Thương" ${p.bank.bankName.includes('Techcombank') ? 'selected' : ''}>Techcombank - Ngân hàng Kỹ Thương</option>
                  <option value="ACB - Ngân hàng Á Châu" ${p.bank.bankName.includes('ACB') ? 'selected' : ''}>ACB - Ngân hàng Á Châu</option>
                  <option value="VPBank - Ngân hàng Việt Nam Thịnh Vượng" ${p.bank.bankName.includes('VPBank') ? 'selected' : ''}>VPBank - Ngân hàng Việt Nam Thịnh Vượng</option>
                </select>
              </div>

              <div class="field">
                <label>Số tài khoản ngân hàng *</label>
                <input class="input" id="kol-accountnumber" value="${p.bank.accountNumber}" required />
              </div>

              <div class="field">
                <label>Tên chủ tài khoản (In hoa không dấu) *</label>
                <input class="input" id="kol-accountname" value="${p.bank.accountName}" required />
              </div>

              <div class="field">
                <label>Chi nhánh mở tài khoản</label>
                <input class="input" id="kol-branch" value="${p.bank.branch}" />
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-check"></i> Cập nhật tài khoản thanh toán
                </button>
              </div>
            </form>
          </div>

          <div class="card" style="padding:22px;background:linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%);color:#fff;border-radius:18px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
              <span style="font-size:13px;font-weight:700;letter-spacing:1px;opacity:0.8">SCANMS PAYOUT CARD</span>
              <i class="ph ph-contactless-payment" style="font-size:28px"></i>
            </div>
            <div style="font-size:20px;font-weight:800;letter-spacing:2px;font-family:monospace;margin-bottom:18px">
              •••• •••• •••• ${p.bank.accountNumber.slice(-4) || '8374'}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end">
              <div>
                <small style="font-size:10px;opacity:0.75;display:block">CHỦ TÀI KHOẢN</small>
                <strong style="font-size:14px;letter-spacing:0.5px">${p.bank.accountName}</strong>
              </div>
              <div style="text-align:right">
                <small style="font-size:10px;opacity:0.75;display:block">NGÂN HÀNG</small>
                <strong style="font-size:13px">${p.bank.bankName.split(' - ')[0]}</strong>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 4: Mật khẩu & Bảo mật 2FA -->
      ${tab === 'security' ? `
        <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-lock-key" style="color:var(--brand)"></i> Đổi mật khẩu tài khoản
            </h3>
            <form id="kol-password-form" class="form-stack" style="margin-top:16px">
              <div class="field">
                <label>Mật khẩu hiện tại *</label>
                <input class="input" type="password" id="kol-cur-pass" placeholder="••••••••" required />
              </div>
              <div class="field">
                <label>Mật khẩu mới * (Tối thiểu 8 ký tự)</label>
                <input class="input" type="password" id="kol-new-pass" placeholder="Nhập mật khẩu mới" required />
              </div>
              <div class="field">
                <label>Xác nhận mật khẩu mới *</label>
                <input class="input" type="password" id="kol-confirm-pass" placeholder="Nhập lại mật khẩu mới" required />
              </div>
              <button type="submit" class="btn" style="margin-top:8px;font-weight:750">
                <i class="ph ph-shield-check"></i> Cập nhật mật khẩu mới
              </button>
            </form>
          </div>

          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-shield" style="color:var(--brand)"></i> Xác thực 2 bước (2FA) & Phiên
            </h3>
            <div style="margin:16px 0;display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surface-2);border-radius:12px">
              <div>
                <strong style="font-size:14px;display:block;color:var(--text)">Xác thực qua SMS / Email OTP</strong>
                <span style="font-size:12px;color:var(--muted)">Gửi mã OTP khi đăng nhập từ thiết bị lạ</span>
              </div>
              <span class="badge success">Đang bật</span>
            </div>
            <div style="padding-top:14px;border-top:1px solid var(--line)">
              <small style="color:var(--muted);display:block;margin-bottom:8px">Thiết bị đang hoạt động: <strong>Windows PC • Chrome 128 (TP.HCM)</strong></small>
              <button id="btn-kol-logout-others" class="btn secondary danger small">Đăng xuất khỏi thiết bị khác</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function bindKolProfile(root, { toast, renderCurrentPage }) {
  // Avatar upload & remove
  const avatarCircle = root.querySelector('#kol-avatar-circle-trigger');
  const avatarInput = root.querySelector('#kol-avatar-file');
  const avatarRemoveBtn = root.querySelector('#kol-avatar-remove-btn');

  if (avatarCircle && avatarInput) {
    avatarCircle.addEventListener('click', () => {
      avatarInput.click();
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast?.('Vui lòng chọn tệp định dạng hình ảnh hợp lệ!', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast?.('Kích thước ảnh tối đa là 10MB!', 'error');
        return;
      }

      try {
        const compressedBase64 = await compressAvatarImage(file, 256, 0.82);
        kolProfileState.profile.avatarImg = compressedBase64;
        safeSaveProfile('scanms_profile_kol', kolProfileState.profile);
        toast?.('Đã đổi ảnh đại diện KOL thành công!', 'success');
        renderCurrentPage();
      } catch (err) {
        console.error('Lỗi khi nén ảnh đại diện KOL:', err);
        toast?.('Không thể xử lý ảnh này. Vui lòng chọn ảnh khác!', 'error');
      }
    });
  }

  if (avatarRemoveBtn) {
    avatarRemoveBtn.addEventListener('click', () => {
      kolProfileState.profile.avatarImg = null;
      safeSaveProfile('scanms_profile_kol', kolProfileState.profile);
      toast?.('Đã gỡ ảnh đại diện, chuyển về chữ cái mặc định!', 'info');
      renderCurrentPage();
    });
  }

  // Chuyển Tab
  root.querySelectorAll('[data-kol-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      kolProfileState.activeTab = btn.dataset.kolTab;
      renderCurrentPage();
    });
  });

  // Lưu thông tin cá nhân
  const personalForm = root.querySelector('#kol-personal-form');
  if (personalForm) {
    personalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = root.querySelector('#kol-name')?.value || kolProfileState.profile.name;
      const nickname = root.querySelector('#kol-nickname')?.value || kolProfileState.profile.nickname;
      const email = root.querySelector('#kol-email')?.value || kolProfileState.profile.email;
      const phone = root.querySelector('#kol-phone')?.value || kolProfileState.profile.phone;
      const dob = root.querySelector('#kol-dob')?.value || kolProfileState.profile.dob;
      const gender = root.querySelector('#kol-gender')?.value || kolProfileState.profile.gender;
      const idCard = root.querySelector('#kol-idcard')?.value || kolProfileState.profile.idCard;
      const taxCode = root.querySelector('#kol-taxcode')?.value || kolProfileState.profile.taxCode;
      const address = root.querySelector('#kol-address')?.value || kolProfileState.profile.address;

      kolProfileState.profile = {
        ...kolProfileState.profile,
        name,
        avatar: name.charAt(0).toUpperCase(),
        nickname,
        email,
        phone,
        dob,
        gender,
        idCard,
        taxCode,
        address,
      };

      safeSaveProfile('scanms_profile_kol', kolProfileState.profile);

      toast?.('Đã cập nhật hồ sơ cá nhân KOL thành công!', 'success');
      renderCurrentPage();
    });
  }

  // Lưu Bio & Kênh
  const btnSaveSocial = root.querySelector('#btn-save-social');
  if (btnSaveSocial) {
    btnSaveSocial.addEventListener('click', () => {
      const bio = root.querySelector('#kol-bio')?.value || kolProfileState.profile.bio;
      kolProfileState.profile.bio = bio;
      safeSaveProfile('scanms_profile_kol', kolProfileState.profile);
      toast?.('Đã lưu thông tin tiểu sử & kênh mạng xã hội!', 'success');
      renderCurrentPage();
    });
  }

  // Lưu Ngân hàng
  const bankForm = root.querySelector('#kol-bank-form');
  if (bankForm) {
    bankForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bankName = root.querySelector('#kol-bankname')?.value || kolProfileState.profile.bank.bankName;
      const accountNumber = root.querySelector('#kol-accountnumber')?.value || kolProfileState.profile.bank.accountNumber;
      const accountName = (root.querySelector('#kol-accountname')?.value || kolProfileState.profile.bank.accountName).toUpperCase();
      const branch = root.querySelector('#kol-branch')?.value || kolProfileState.profile.bank.branch;

      kolProfileState.profile.bank = { bankName, accountNumber, accountName, branch };
      safeSaveProfile('scanms_profile_kol', kolProfileState.profile);
      toast?.('Đã cập nhật tài khoản nhận thanh toán VietQR!', 'success');
      renderCurrentPage();
    });
  }

  // Đổi mật khẩu
  const passForm = root.querySelector('#kol-password-form');
  if (passForm) {
    passForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newP = root.querySelector('#kol-new-pass')?.value;
      const confP = root.querySelector('#kol-confirm-pass')?.value;
      if (!newP || newP.length < 8) {
        toast?.('Mật khẩu mới phải có tối thiểu 8 ký tự!', 'error');
        return;
      }
      if (newP !== confP) {
        toast?.('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }
      toast?.('Đã đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.', 'success');
      passForm.reset();
    });
  }

  // Đăng xuất phiên khác
  const btnLogoutOthers = root.querySelector('#btn-kol-logout-others');
  if (btnLogoutOthers) {
    btnLogoutOthers.addEventListener('click', () => {
      toast?.('Đã đăng xuất khỏi tất cả các thiết bị khác!', 'success');
    });
  }
}

