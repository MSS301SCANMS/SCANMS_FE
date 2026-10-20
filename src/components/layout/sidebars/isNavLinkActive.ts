export function isNavLinkActive(path: string, currentPath: string, search: string): boolean {
  if (path.startsWith('/customer')) {
    if (path === '/customer/orders') {
      return (
        currentPath === '/customer' ||
        currentPath === '/customer/portal' ||
        currentPath === '/customer/orders' ||
        currentPath.startsWith('/customer/orders/')
      );
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
  }

  if (path === '/' || path === '/collaborator/dashboard') {
    return currentPath === '/' || currentPath === '/collaborator/dashboard';
  }

  if (path === '/collaborator/marketing') {
    return (
      currentPath.startsWith('/collaborator/marketing') ||
      currentPath.startsWith('/collaborator/referral-links') ||
      currentPath.startsWith('/collaborator/links') ||
      currentPath.startsWith('/collaborator/media-hub') ||
      currentPath.startsWith('/collaborator/coupons')
    );
  }

  if (path === '/collaborator/collaboration') {
    return (
      currentPath.startsWith('/collaborator/collaboration') ||
      currentPath.startsWith('/collaborator/sample-requests') ||
      currentPath.startsWith('/collaborator/samples') ||
      currentPath.startsWith('/collaborator/messages') ||
      currentPath.startsWith('/collaborator/campaigns') ||
      currentPath === '/chat'
    );
  }

  if (path === '/collaborator/profile') {
    return (
      currentPath.startsWith('/collaborator/profile') ||
      currentPath.startsWith('/collaborator/kyc') ||
      currentPath.startsWith('/collaborator/social-channels') ||
      currentPath.startsWith('/collaborator/tiers') ||
      currentPath.startsWith('/collaborator/leaderboard') ||
      currentPath.startsWith('/collaborator/bonus-progress')
    );
  }

  if (path === '/merchant/kol-hub') {
    return (
      currentPath.startsWith('/merchant/kol-hub') ||
      currentPath.startsWith('/merchant/sample-requests') ||
      currentPath.startsWith('/merchant/kol-recommendations') ||
      currentPath.startsWith('/merchant/collaborators') ||
      currentPath.startsWith('/merchant/messages')
    );
  }

  if (path === '/merchant/live-sessions') {
    return (
      currentPath.startsWith('/merchant/live-sessions') ||
      (currentPath.startsWith('/merchant/promotions') && search.includes('tab=live-sessions'))
    );
  }

  if (path === '/merchant/promotions') {
    return (
      (currentPath.startsWith('/merchant/promotions') && !search.includes('tab=live-sessions')) ||
      currentPath.startsWith('/merchant/coupons') ||
      currentPath.startsWith('/merchant/commission-rules') ||
      currentPath.startsWith('/merchant/referral-links')
    );
  }

  if (path === '/admin/affiliate-oversight') {
    return (
      currentPath.startsWith('/admin/affiliate-oversight') ||
      currentPath.startsWith('/admin/referral-links') ||
      currentPath.startsWith('/admin/coupons')
    );
  }

  if (path === '/admin/analytics') {
    return (
      currentPath.startsWith('/admin/analytics') ||
      currentPath.startsWith('/admin/leaderboard') ||
      currentPath.startsWith('/admin/kol-recommendations')
    );
  }

  if (path === '/admin/users') {
    return currentPath.startsWith('/admin/users') || currentPath.startsWith('/merchant/kyc-approval');
  }

  if (path === '/admin/fraud-sentinel') {
    return (
      currentPath.startsWith('/admin/fraud-sentinel') ||
      currentPath.startsWith('/merchant/fraud-sentinel') ||
      currentPath.startsWith('/merchant/ai-fraud')
    );
  }

  if (path === '/admin/audit-logs') {
    return (
      currentPath.startsWith('/admin/audit-logs') ||
      currentPath.startsWith('/admin/audit') ||
      currentPath.startsWith('/merchant/audit-logs')
    );
  }

  if (path === '/customer/profile') {
    return (
      currentPath.startsWith('/customer/profile') ||
      currentPath.startsWith('/customer/identity') ||
      currentPath.startsWith('/customer/addresses') ||
      currentPath.startsWith('/customer/security')
    );
  }

  return currentPath === path || currentPath.startsWith(`${path}/`);
}
