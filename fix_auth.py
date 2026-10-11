import os

filepath = os.path.join(os.environ['HOME'], 'mnt', 'fe', 'src', 'services', 'auth.service.ts')

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add normalizeUser helper function
normalize_fn = '''
/**
 * Chuyen doi response BE (userId, roles[]) sang format FE (id, role)
 */
function normalizeUser(raw: any): any {
  if (!raw) return raw;
  const user = { ...raw };
  // BE tra "userId", FE can "id"
  if (!user.id && user.userId) {
    user.id = user.userId;
  }
  // BE tra "roles" (array), FE can "role" (string)
  if (!user.role && Array.isArray(user.roles) && user.roles.length > 0) {
    const beRole = user.roles[0];
    const roleMap: Record<string, string> = {
      'ADMIN': 'SYSTEM_ADMIN',
      'MANAGER': 'SYSTEM_MANAGER',
      'SHOP_MANAGER': 'SHOP_MANAGER',
      'COLLABORATOR': 'COLLABORATOR',
      'CUSTOMER': 'CUSTOMER',
    };
    user.role = roleMap[beRole] || beRole;
  }
  return user;
}

'''

content = content.replace(
    "export const authService = {",
    normalize_fn + "export const authService = {"
)

# 2. Fix login() - remove debug logs, add normalizeUser
old_login = """        const meRes: any = await api.get('/users/me');
        console.log('[DEBUG] meRes:', JSON.stringify(meRes));
        const user = meRes?.result || meRes?.data || meRes;
        console.log('[DEBUG] user:', JSON.stringify(user), 'has id:', !!(user && user.id));
        if (user && user.id) {"""

new_login = """        const meRes: any = await api.get('/users/me');
        const user = normalizeUser(meRes?.result || meRes?.data || meRes);
        if (user && user.id) {"""

# Replace first occurrence (login)
content = content.replace(old_login, new_login, 1)
# Replace second occurrence (googleLogin)
content = content.replace(old_login, new_login, 1)

# 3. Fix getMe()
old_getme = """    const res: any = await api.get('/users/me');
    const user = res?.data || res;
    if (user && user.id) {"""

new_getme = """    const res: any = await api.get('/users/me');
    const user = normalizeUser(res?.result || res?.data || res);
    if (user && user.id) {"""

content = content.replace(old_getme, new_getme)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK - Fixed!")
