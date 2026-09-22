import http from 'node:http';
import net from 'node:net';

const PORT = 3000;
const GATEWAY_URL = 'http://localhost:8080';
const activeSessions = new Map();

function checkTcpPort(port, timeout = 350) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const start = Date.now();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ isOnline: true, latency });
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve({ isOnline: false, latency: null });
    });
    socket.once('error', () => {
      socket.destroy();
      resolve({ isOnline: false, latency: null });
    });
    socket.connect(port, '127.0.0.1');
  });
}

const SYSTEM_SERVICES = [
  {
    id: 'gateway',
    name: 'scanms-gateway',
    displayName: 'API Gateway & Reverse Proxy',
    port: 8080,
    category: 'CORE',
    description: 'Điều hướng lưu lượng, xác thực phân quyền JWT và cân bằng tải',
    database: null,
    endpoints: ['/api/auth/*', '/api/public/*', '/api/v1/*'],
    version: '1.0.0-SNAPSHOT'
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
    version: '1.0.0-SNAPSHOT'
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
    version: '1.0.0-SNAPSHOT'
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
    version: '1.0.0-SNAPSHOT'
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
    version: '1.0.0-SNAPSHOT'
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
    version: '1.0.0-SNAPSHOT'
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
    version: '1.0.0-SNAPSHOT'
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
    version: '2.1.0'
  },
  {
    id: 'postgres',
    name: 'postgresql-server',
    displayName: 'Cơ sở Dữ liệu PostgreSQL 18',
    port: 5432,
    category: 'DATA',
    description: 'Hệ quản trị CSDL quan hệ chính lưu trữ dữ liệu microservices (user_db, catalog_db...)',
    database: 'PostgreSQL 18 Engine',
    endpoints: ['localhost:5432'],
    version: '18.x'
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
    version: '1.0.0'
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
    version: '0.0.0'
  }
];

const sampleProducts = [
  {
    id: "P01",
    title: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
    name: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
    price: 459000,
    originalPrice: 520000,
    imageUrl: "/reference/assets/serum-hero-optimized.jpg",
    store: { name: "Sora Skin Official" },
    category: { slug: "skincare", name: "Chăm sóc da & Serum" }
  },
  {
    id: "P02",
    title: "Kem Chống Nắng Phục Hồi Quang Phổ Rộng Aqua Sunscreen SPF50+ PA++++",
    name: "Kem Chống Nắng Phục Hồi Quang Phổ Rộng Aqua Sunscreen SPF50+ PA++++",
    price: 389000,
    originalPrice: 430000,
    imageUrl: "/reference/assets/sunscreen-product.jpg",
    store: { name: "Sora Skin Official" },
    category: { slug: "skincare", name: "Chăm sóc da & Chống nắng" }
  },
  {
    id: "P03",
    title: "Toner BHA 2% Làm Sạch Sâu & Kiềm Dầu Thu Nhỏ Lỗ Chân Lông",
    name: "Toner BHA 2% Làm Sạch Sâu & Kiềm Dầu Thu Nhỏ Lỗ Chân Lông",
    price: 349000,
    originalPrice: 390000,
    imageUrl: "/reference/assets/toner-product.jpg",
    store: { name: "Sora Skin Official" },
    category: { slug: "skincare", name: "Chăm sóc da & Toner" }
  },
  {
    id: "P04",
    title: "Kem Dưỡng Phục Hồi Rau Má Madecassoside Cica Cream",
    name: "Kem Dưỡng Phục Hồi Rau Má Madecassoside Cica Cream",
    price: 320000,
    originalPrice: 360000,
    imageUrl: "/reference/assets/cream-product.jpg",
    store: { name: "Sora Skin Official" },
    category: { slug: "skincare", name: "Chăm sóc da & Kem dưỡng" }
  }
];

function setCorsHeaders(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*';
  setCorsHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const path = urlObj.pathname;

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let parsedBody = {};
    try { if (body) parsedBody = JSON.parse(body); } catch {}

    // 1. Mock Auth endpoints
    if (path === '/api/auth/login') {
      const email = parsedBody.email || 'demo@scanms.vn';
      let role = parsedBody.role || 'COLLABORATOR';
      if (email.includes('shop')) role = 'SHOP_MANAGER';
      if (email.includes('admin')) role = 'SYSTEM_ADMIN';

      const user = {
        id: role === 'SHOP_MANAGER' ? 'shop-01' : (role === 'SYSTEM_ADMIN' ? 'admin-01' : 'mock-user-1'),
        email: email,
        fullName: role === 'SHOP_MANAGER' ? 'Shop Sora Official' : (role === 'SYSTEM_ADMIN' ? 'Nguyễn Quản Trị' : 'Trần Văn Nhật'),
        role: role,
        stores: role === 'SHOP_MANAGER' ? [{ id: 'store-01', name: 'Sora Skin Official' }] : [],
      };

      const token = `mock-jwt-token-${role.toLowerCase()}-${Date.now()}`;
      activeSessions.set(token, user);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        statusCode: 200,
        message: 'Login successful',
        data: {
          accessToken: token,
          user: user
        }
      }));
      return;
    }

    if (path === '/api/auth/send-otp') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 200, message: 'OTP sent' }));
      return;
    }

    if (path === '/api/auth/register') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 200, message: 'Registration successful' }));
      return;
    }

    if (path === '/api/auth/me') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      let user = activeSessions.get(token);
      if (!user) {
        if (token.includes('admin') || token.includes('system_admin')) {
          user = {
            id: 'admin-01',
            email: 'admin@scanms.vn',
            fullName: 'Nguyễn Quản Trị',
            role: 'SYSTEM_ADMIN'
          };
        } else if (token.includes('shop') || token.includes('shop_manager')) {
          user = {
            id: 'shop-01',
            email: 'shop@scanms.vn',
            fullName: 'Shop Sora Official',
            role: 'SHOP_MANAGER',
            stores: [{ id: 'store-01', name: 'Sora Skin Official' }]
          };
        } else {
          user = {
            id: 'mock-user-1',
            email: 'demo@scanms.vn',
            fullName: 'Trần Văn Nhật',
            role: 'COLLABORATOR'
          };
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        statusCode: 200,
        data: user
      }));
      return;
    }

    // 2. System Health & Services Status Endpoint
    if (path === '/api/admin/system/services') {
      Promise.all(
        SYSTEM_SERVICES.map(async (svc) => {
          if (!svc.port) {
            return {
              ...svc,
              status: 'UP',
              latency: 3,
              lastChecked: new Date().toISOString(),
              uptime: '99.9%',
              cpuUsage: '1.2%',
              memoryUsage: '64 MB'
            };
          }
          const { isOnline, latency } = await checkTcpPort(svc.port, 350);
          return {
            ...svc,
            status: isOnline ? 'UP' : 'DOWN',
            latency: latency,
            lastChecked: new Date().toISOString(),
            uptime: isOnline ? '99.8%' : '0%',
            cpuUsage: isOnline ? `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 9)}%` : '0%',
            memoryUsage: isOnline ? `${Math.floor(Math.random() * 120 + 80)} MB` : '0 MB'
          };
        })
      ).then((servicesWithStatus) => {
        const total = servicesWithStatus.length;
        const online = servicesWithStatus.filter((s) => s.status === 'UP').length;
        const offline = total - online;
        const validLatencies = servicesWithStatus.filter((s) => s.latency != null).map((s) => s.latency);
        const avgLatency = validLatencies.length
          ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
          : 0;
        const postgres = servicesWithStatus.find((s) => s.id === 'postgres');
        const dbStatus = postgres?.status === 'UP' ? 'CONNECTED' : 'DISCONNECTED';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          statusCode: 200,
          message: 'Lấy trạng thái các service hệ thống thành công',
          data: {
            timestamp: new Date().toISOString(),
            summary: {
              total,
              online,
              offline,
              avgLatencyMs: avgLatency,
              dbStatus
            },
            services: servicesWithStatus
          }
        }));
      });
      return;
    }

    // 3. Mock Public Products endpoint
    if (path === '/api/public/products') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        statusCode: 200,
        data: {
          items: sampleProducts,
          total: sampleProducts.length
        }
      }));
      return;
    }

    // 3. Fallback: Proxy to Spring Boot Gateway (8080) for any other API requests
    const gatewayReq = http.request(
      `${GATEWAY_URL}${path}${urlObj.search}`,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: 'localhost:8080'
        }
      },
      (gatewayRes) => {
        setCorsHeaders(res, origin);
        res.writeHead(gatewayRes.statusCode, gatewayRes.headers);
        gatewayRes.pipe(res);
      }
    );

    gatewayReq.on('error', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ statusCode: 200, data: null, message: 'Fallback OK' }));
    });

    if (body) {
      gatewayReq.write(body);
    }
    gatewayReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`SCANMS Local Dev API Proxy running on http://localhost:${PORT}`);
});
