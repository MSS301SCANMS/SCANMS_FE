export type DemoLoginRole = 'customer' | 'kol' | 'shop' | 'manager' | 'admin';

// Local development only. Production builds discard the credential branch.
export function getDemoLogin(role: DemoLoginRole): { identifier: string; password: string } | null {
  if (!import.meta.env.DEV) return null;
  const accounts = {
    customer: {
      identifier: import.meta.env.VITE_DEMO_CUSTOMER_IDENTIFIER || 'customer01@scanms.com',
      password: import.meta.env.VITE_DEMO_CUSTOMER_PASSWORD || '123456',
    },
    kol: {
      identifier: import.meta.env.VITE_DEMO_KOL_IDENTIFIER || 'kolctv01@scanms.com',
      password: import.meta.env.VITE_DEMO_KOL_PASSWORD || '123456',
    },
    shop: {
      identifier: import.meta.env.VITE_DEMO_SHOP_IDENTIFIER || 'shopowner01@scanms.com',
      password: import.meta.env.VITE_DEMO_SHOP_PASSWORD || '123456',
    },
    manager: {
      identifier: import.meta.env.VITE_DEMO_MANAGER_IDENTIFIER || 'manager01@scanms.com',
      password: import.meta.env.VITE_DEMO_MANAGER_PASSWORD || '123456',
    },
    admin: {
      identifier: import.meta.env.VITE_DEMO_ADMIN_IDENTIFIER || 'admin@scanms.com',
      password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '123456',
    },
  };
  const account = accounts[role];
  return account?.identifier && account?.password ? account : null;
}
