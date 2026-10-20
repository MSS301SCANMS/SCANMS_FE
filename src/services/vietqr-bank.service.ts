import { VIETNAM_BANKS, type VietQrBank } from '@/config/banks.config';

const VIETQR_API_URL = 'https://api.vietqr.io/v2/banks';
const CACHE_KEY = 'scanms_vietqr_banks_cache';
const CACHE_TIME_KEY = 'scanms_vietqr_banks_cache_time';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export class VietQrBankService {
  private static cachedBanks: VietQrBank[] | null = null;

  /**
   * Lấy danh sách toàn bộ ngân hàng tại Việt Nam (kết nối trực tiếp API VietQR, có fallback tức thì)
   */
  public static async getBanks(): Promise<VietQrBank[]> {
    if (this.cachedBanks && this.cachedBanks.length > 0) {
      return this.cachedBanks;
    }

    // Kiểm tra LocalStorage
    try {
      const localData = localStorage.getItem(CACHE_KEY);
      const localTime = localStorage.getItem(CACHE_TIME_KEY);
      if (localData && localTime) {
        const timeDiff = Date.now() - Number(localTime);
        if (timeDiff < CACHE_DURATION_MS) {
          const parsed = JSON.parse(localData) as VietQrBank[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedBanks = parsed;
            return parsed;
          }
        }
      }
    } catch {
      // Bỏ qua lỗi parse storage
    }

    // Gọi API VietQR
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(VIETQR_API_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          const formatted: VietQrBank[] = json.data.map((item: any) => ({
            id: item.id || Math.random(),
            name: item.name || '',
            code: item.code || '',
            bin: String(item.bin || ''),
            shortName: item.shortName || item.short_name || item.code || '',
            logo: item.logo || `https://cdn.vietqr.io/img/${item.code}.png`,
            isPopular: ['VCB', 'MB', 'TCB', 'ICB', 'BIDV', 'ACB', 'VPB', 'TPB', 'STB', 'HDB', 'VIB', 'VBA', 'OCB', 'SHB', 'MSB'].includes(item.code),
            isBig4: ['VCB', 'ICB', 'BIDV', 'VBA'].includes(item.code),
          }));

          this.cachedBanks = formatted;
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
            localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
          } catch {
            // Ignored storage error
          }
          return formatted;
        }
      }
    } catch (err) {
      console.warn('Không thể gọi API VietQR trực tiếp, dùng danh sách 65 ngân hàng dự phòng:', err);
    }

    // Fallback danh sách 65 ngân hàng chuẩn
    this.cachedBanks = VIETNAM_BANKS;
    return VIETNAM_BANKS;
  }
}
