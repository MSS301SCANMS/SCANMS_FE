export type DemoLoginRole = 'customer' | 'kol' | 'shop' | 'manager' | 'admin';

// Local development only. Production builds discard the credential branch.
export function getDemoLogin(role: DemoLoginRole): { identifier: string; password: string } | null {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'true') return null;
  const accounts = {
    customer: { identifier: import.meta.env.VITE_DEMO_CUSTOMER_IDENTIFIER, password: import.meta.env.VITE_DEMO_CUSTOMER_PASSWORD },
    kol: { identifier: import.meta.env.VITE_DEMO_KOL_IDENTIFIER, password: import.meta.env.VITE_DEMO_KOL_PASSWORD },
    shop: { identifier: import.meta.env.VITE_DEMO_SHOP_IDENTIFIER, password: import.meta.env.VITE_DEMO_SHOP_PASSWORD },
    manager: { identifier: import.meta.env.VITE_DEMO_MANAGER_IDENTIFIER, password: import.meta.env.VITE_DEMO_MANAGER_PASSWORD },
    admin: { identifier: import.meta.env.VITE_DEMO_ADMIN_IDENTIFIER, password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD },
  };
  const account = accounts[role];
  return account.identifier && account.password ? account : null;
}
