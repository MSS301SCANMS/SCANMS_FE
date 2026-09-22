import api from './api';

export type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED';
export type ServiceCategory = 'CORE' | 'BUSINESS' | 'DATA' | 'AI';

export interface SystemServiceItem {
  id: string;
  name: string;
  displayName: string;
  port: number;
  category: ServiceCategory;
  description: string;
  database: string | null;
  endpoints: string[];
  version: string;
  status: ServiceStatus;
  latency: number | null;
  lastChecked: string;
  uptime: string;
  cpuUsage: string;
  memoryUsage: string;
}

export interface SystemServicesSummary {
  total: number;
  online: number;
  offline: number;
  avgLatencyMs: number;
  dbStatus: 'CONNECTED' | 'DISCONNECTED';
}

export interface SystemServicesData {
  timestamp: string;
  summary: SystemServicesSummary;
  services: SystemServiceItem[];
}

const FALLBACK_DATA: SystemServicesData = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 11,
    online: 3,
    offline: 8,
    avgLatencyMs: 3,
    dbStatus: 'CONNECTED',
  },
  services: [
    {
      id: 'gateway',
      name: 'scanms-gateway',
      displayName: 'API Gateway & Reverse Proxy',
      port: 8080,
      category: 'CORE',
      description: 'Điều hướng lưu lượng, xác thực phân quyền JWT và cân bằng tải',
      database: null,
      endpoints: ['/api/auth/*', '/api/public/*', '/api/v1/*'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'user-service',
      name: 'user-service',
      displayName: 'Quản lý Người dùng & Phân quyền',
      port: 8081,
      category: 'CORE',
      description: 'Dịch vụ xác thực, phân quyền RBAC, tài khoản KOL/CTV/Shop và duyệt KYC',
      database: 'user_db',
      endpoints: ['/api/users', '/api/kyc', '/api/roles'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'catalog-service',
      name: 'catalog-service',
      displayName: 'Danh mục Sản phẩm & Kho hàng',
      port: 8082,
      category: 'BUSINESS',
      description: 'Quản lý kho hàng, sản phẩm đa biến thể, tồn kho và thông tin Shop',
      database: 'catalog_db',
      endpoints: ['/api/products', '/api/categories', '/api/stores'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'order-service',
      name: 'order-service',
      displayName: 'Quản lý Đơn hàng & Vận chuyển',
      port: 8083,
      category: 'BUSINESS',
      description: 'Xử lý đơn đặt hàng, cập nhật trạng thái đơn, tích hợp vận chuyển GHTK/GHN',
      database: 'order_db',
      endpoints: ['/api/orders', '/api/orders/tracking', '/api/shipments'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'payment-service',
      name: 'payment-service',
      displayName: 'Thanh toán & Ví Hoa hồng',
      port: 8084,
      category: 'BUSINESS',
      description: 'Thanh toán VietQR động, đối soát dòng tiền và giải ngân chi trả hoa hồng',
      database: 'payment_db',
      endpoints: ['/api/payments/vietqr', '/api/payouts', '/api/wallets'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'promotion-affiliate-service',
      name: 'promotion-affiliate-service',
      displayName: 'Tiếp thị Liên kết & Khuyến mãi',
      port: 8085,
      category: 'BUSINESS',
      description: 'Tạo link referral, tracking click attribution, mã coupon và tỷ lệ hoa hồng',
      database: 'promotion_db',
      endpoints: ['/api/referrals', '/api/coupons', '/api/commission-rules'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'livestream-service',
      name: 'livestream-service',
      displayName: 'Livestream & Tương tác Trực tiếp',
      port: 8086,
      category: 'BUSINESS',
      description: 'Phát sóng trực tiếp, ghim sản phẩm thời gian thực, WebSocket chat phòng live',
      database: 'livestream_db',
      endpoints: ['/api/livestreams', '/api/pinned-products', '/ws/chat'],
      version: '1.0.0-SNAPSHOT',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'ai-service',
      name: 'ai-service',
      displayName: 'AI Anti-Fraud & Gợi ý KOL',
      port: 8000,
      category: 'AI',
      description: 'Mô hình máy học phát hiện click ảo, chống gian lận traffic và gợi ý matching KOL',
      database: null,
      endpoints: ['/api/ai/fraud-score', '/api/ai/recommendations'],
      version: '2.1.0',
      status: 'DOWN',
      latency: null,
      lastChecked: new Date().toISOString(),
      uptime: '0%',
      cpuUsage: '0%',
      memoryUsage: '0 MB',
    },
    {
      id: 'postgres',
      name: 'postgresql-server',
      displayName: 'Cơ sở Dữ liệu PostgreSQL 18',
      port: 5432,
      category: 'DATA',
      description: 'Hệ quản trị CSDL quan hệ chính lưu trữ dữ liệu microservices',
      database: 'PostgreSQL 18 Engine',
      endpoints: ['localhost:5432'],
      version: '18.x',
      status: 'UP',
      latency: 2,
      lastChecked: new Date().toISOString(),
      uptime: '99.9%',
      cpuUsage: '2.4%',
      memoryUsage: '145 MB',
    },
    {
      id: 'dev-proxy',
      name: 'dev-api-proxy',
      displayName: 'Local Dev API Proxy Server',
      port: 3000,
      category: 'CORE',
      description: 'Cầu nối proxy dev và cung cấp mock API dự phòng cho frontend',
      database: null,
      endpoints: ['http://localhost:3000/api/*'],
      version: '1.0.0',
      status: 'UP',
      latency: 1,
      lastChecked: new Date().toISOString(),
      uptime: '99.9%',
      cpuUsage: '1.1%',
      memoryUsage: '52 MB',
    },
    {
      id: 'frontend',
      name: 'scanms-frontend',
      displayName: 'Giao diện Web Client (React 19 + Vite)',
      port: 5173,
      category: 'CORE',
      description: 'Ứng dụng SPA cho người mua, KOL, Chủ shop và Quản trị viên hệ thống',
      database: null,
      endpoints: ['http://localhost:5173'],
      version: '0.0.0',
      status: 'UP',
      latency: 1,
      lastChecked: new Date().toISOString(),
      uptime: '99.9%',
      cpuUsage: '1.5%',
      memoryUsage: '78 MB',
    },
  ],
};

export const systemService = {
  async getServicesStatus(): Promise<SystemServicesData> {
    try {
      const res: any = await api.get('/admin/system/services');
      if (res?.data && Array.isArray(res.data.services)) {
        return res.data;
      }
      if (res?.services && Array.isArray(res.services)) {
        return res;
      }
      return FALLBACK_DATA;
    } catch (error) {
      console.warn('Không thể gọi API status service, sử dụng dữ liệu dự phòng cục bộ:', error);
      return FALLBACK_DATA;
    }
  },
};
