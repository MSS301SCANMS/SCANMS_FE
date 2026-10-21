import React from 'react';

interface ScanMSLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'full' | 'icon';
}

export const ScanMSLogo: React.FC<ScanMSLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'full',
}) => {
  const iconDimensions = {
    sm: { w: 34, h: 34, textMain: 'text-base', textSub: 'text-[9px]' },
    md: { w: 42, h: 42, textMain: 'text-xl', textSub: 'text-[10px]' },
    lg: { w: 52, h: 52, textMain: 'text-2xl sm:text-3xl', textSub: 'text-xs' },
    xl: { w: 64, h: 64, textMain: 'text-3xl sm:text-4xl', textSub: 'text-sm' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Biểu tượng Huy hiệu ScanMS: Dáng hình chữ S non sông Việt Nam + Hoàng Sa & Trường Sa */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl p-1 shadow-md shadow-[#C59B58]/20 transition-transform duration-300 hover:scale-105 group"
        style={{
          width: iconDimensions.w,
          height: iconDimensions.h,
          background: 'linear-gradient(145deg, #261F17 0%, #17130F 100%)',
          border: '1.5px solid #C59B58',
        }}
        title="ScanMS - Mạng Lưới Tiếp Thị Non Sông Liền Một Dải (Việt Nam • Hoàng Sa • Trường Sa)"
      >
        <svg
          viewBox="0 0 54 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Gradient Vàng Hoàng Kim Độc Quyền ScanMS */}
            <linearGradient id="scanms-vn-gold" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#FFF5C6" />
              <stop offset="25%" stopColor="#DEBE85" />
              <stop offset="65%" stopColor="#C59B58" />
              <stop offset="100%" stopColor="#936B2B" />
            </linearGradient>

            <linearGradient id="scanms-stroke-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF0" />
              <stop offset="50%" stopColor="#E5BC6E" />
              <stop offset="100%" stopColor="#B88E4F" />
            </linearGradient>

            <linearGradient id="star-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#E8C67E" />
              <stop offset="100%" stopColor="#A57D3C" />
            </linearGradient>

            {/* Bóng đổ 3D mềm mại tự nhiên */}
            <filter id="scanms-soft-shadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0.35" dy="0.5" stdDeviation="0.35" floodColor="#000000" floodOpacity="0.65" />
            </filter>

            {/* Hào quang Biển Đông ấm áp lan tỏa */}
            <radialGradient id="sea-ambient" cx="65%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#C59B58" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#C59B58" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#C59B58" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="glow-hs" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DEBE85" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#C59B58" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#C59B58" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="glow-ts" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DEBE85" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#C59B58" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#C59B58" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Vầng hào quang Biển Đông lan tỏa */}
          <circle cx="36" cy="32" r="18" fill="url(#sea-ambient)" />
          <circle cx="34" cy="25.8" r="7.5" fill="url(#glow-hs)" />
          <circle cx="40.5" cy="41.5" r="8.5" fill="url(#glow-ts)" />

          {/* 
            BẢN ĐỒ LÃNH THỔ & HẢI ĐẢO QUỐC GIA VIỆT NAM (CHUẨN XÁC THEO ẢNH VỆ TINH)
            Bao gồm toàn vẹn đất liền hình chữ S, Vịnh Bắc Bộ, dải bờ biển Miền Trung,
            vùng biển Tây Nam (Phú Quốc, Thổ Chu), Cực Nam (Hòn Khoai), Côn Đảo,
            và hai quần đảo thiêng liêng HOÀNG SA & TRƯỜNG SA trên Biển Đông.
          */}
          <g filter="url(#scanms-soft-shadow)">
            {/* Dải đất hình chữ S Việt Nam nguyên bản */}
            <path
              d="M 15.4 6.0 L 16.8 7.4 L 17.3 7.1 L 17.9 7.5 L 18.6 7.3 L 19.3 7.7 L 18.6 8.7 L 19.0 10.0 L 19.9 10.3 L 19.8 10.5 L 20.6 10.9 L 20.8 11.3 L 22.1 11.1 L 22.5 11.5 L 21.9 11.4 L 21.3 12.2 L 21.0 12.0 L 20.9 12.4 L 21.4 12.4 L 20.9 12.8 L 20.8 12.6 L 20.3 13.2 L 19.9 12.9 L 19.3 13.4 L 19.2 13.9 L 18.5 14.5 L 18.7 15.2 L 17.0 16.3 L 16.6 17.3 L 16.6 18.2 L 16.1 19.1 L 16.8 20.5 L 18.1 21.8 L 18.3 21.7 L 18.4 22.7 L 18.0 22.7 L 22.1 27.1 L 22.6 27.0 L 22.9 27.3 L 22.8 27.5 L 23.6 28.5 L 24.1 29.6 L 24.6 30.1 L 24.7 29.8 L 24.9 30.2 L 24.7 30.5 L 25.3 31.7 L 25.9 34.3 L 25.9 34.6 L 25.7 34.3 L 25.7 35.2 L 26.0 35.6 L 25.8 35.4 L 25.7 35.7 L 26.3 37.2 L 25.6 37.9 L 26.0 38.7 L 25.5 38.6 L 25.7 39.4 L 25.4 40.3 L 25.7 40.6 L 25.1 41.2 L 25.2 41.7 L 24.0 42.2 L 23.3 43.1 L 22.9 43.0 L 22.5 43.7 L 20.5 44.7 L 20.0 44.3 L 19.9 43.8 L 19.1 45.1 L 19.1 44.9 L 18.4 45.0 L 19.3 45.4 L 18.7 46.0 L 19.0 46.2 L 18.7 46.3 L 17.9 45.7 L 18.7 46.7 L 18.6 47.1 L 17.8 46.9 L 17.7 47.7 L 16.1 48.3 L 14.8 49.8 L 13.8 50.0 L 13.5 49.3 L 13.6 48.2 L 13.9 46.8 L 14.2 45.4 L 13.6 44.6 L 14.2 43.8 L 14.8 43.7 L 14.7 43.1 L 15.4 43.3 L 16.6 42.9 L 16.9 43.4 L 17.6 43.5 L 17.7 42.6 L 16.8 41.9 L 16.7 41.0 L 17.2 40.6 L 18.2 40.8 L 18.3 39.9 L 19.0 40.0 L 19.8 39.6 L 20.2 39.0 L 20.9 39.1 L 21.3 38.7 L 21.1 36.7 L 21.5 35.3 L 20.7 33.5 L 21.2 32.6 L 21.4 31.3 L 21.1 30.9 L 21.5 30.6 L 21.5 29.7 L 20.9 29.5 L 20.4 28.7 L 21.1 27.8 L 20.3 27.4 L 19.4 26.3 L 19.0 26.6 L 18.7 26.1 L 18.7 25.0 L 18.3 24.9 L 18.0 24.1 L 17.7 24.1 L 16.6 22.9 L 16.0 21.6 L 15.1 21.0 L 15.0 19.9 L 13.7 19.6 L 12.7 18.7 L 11.5 18.1 L 12.1 17.6 L 12.0 17.1 L 12.9 17.0 L 13.3 17.3 L 14.1 16.6 L 14.5 15.8 L 13.5 15.3 L 13.5 14.6 L 12.8 14.8 L 13.4 14.1 L 12.3 13.1 L 11.4 13.4 L 11.0 14.0 L 9.5 13.4 L 8.7 12.2 L 9.2 10.9 L 8.8 10.9 L 8.7 10.5 L 8.3 11.0 L 8.2 10.3 L 7.0 8.9 L 7.8 7.8 L 9.2 8.8 L 10.0 7.7 L 10.5 8.3 L 10.9 7.8 L 11.7 8.6 L 12.1 7.7 L 12.4 7.6 L 12.7 8.0 L 13.3 7.6 L 13.7 7.7 L 14.1 7.2 L 13.9 6.8 L 15.4 6.0 Z"
              fill="url(#scanms-vn-gold)"
              stroke="url(#scanms-stroke-gold)"
              strokeWidth="0.75"
              strokeLinejoin="round"
            />

            {/* Ngôi sao vàng 5 cánh thiêng liêng ở Bắc Bộ */}
            <path
              d="M 15.2 9.2 L 15.8 10.8 L 17.5 10.8 L 16.1 11.8 L 16.6 13.4 L 15.2 12.4 L 13.8 13.4 L 14.3 11.8 L 12.9 10.8 L 14.6 10.8 Z"
              fill="url(#star-gold)"
              stroke="#B88E4F"
              strokeWidth="0.35"
            />

            {/* HẢI ĐẢO TIỀN TIÊU VỊNH BẮC BỘ & MIỀN TRUNG */}
            {/* Đảo Bạch Long Vĩ (Tâm Vịnh Bắc Bộ) */}
            <circle cx="23.5" cy="14.5" r="0.38" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
            {/* Quần đảo Cát Bà / Cô Tô */}
            <circle cx="20.8" cy="12.5" r="0.28" fill="#DEBE85" />
            {/* Đảo Cồn Cỏ */}
            <circle cx="18.2" cy="19.2" r="0.25" fill="#DEBE85" />
            {/* Đảo Lý Sơn */}
            <circle cx="25.0" cy="28.5" r="0.32" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
            {/* Đảo Phú Quý */}
            <circle cx="26.5" cy="42.5" r="0.32" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />

            {/* HẢI ĐẢO TIỀN TIÊU PHÍA NAM CHUẨN XÁC ĐỊA LÝ */}
            {/* 1. Đảo Phú Quốc & Quần đảo An Thới (Vùng biển Kiên Giang, dưới vĩ độ Hà Tiên) */}
            <g id="dao-phu-quoc">
              <path
                d="M 12.2 45.2 C 12.5 45.0, 12.8 45.1, 12.8 45.4 C 12.9 45.8, 12.7 46.2, 12.5 46.6 C 12.4 46.8, 12.3 46.8, 12.2 46.8 C 12.1 46.8, 12.0 46.6, 12.0 46.2 C 11.9 45.7, 12.0 45.3, 12.2 45.2 Z"
                fill="url(#scanms-vn-gold)"
                stroke="url(#scanms-stroke-gold)"
                strokeWidth="0.15"
              />
              <circle cx="12.2" cy="47.1" r="0.14" fill="#DEBE85" />
            </g>

            {/* 2. Quần đảo Nam Du (Kiên Giang) */}
            <circle cx="13.1" cy="47.6" r="0.2" fill="#DEBE85" />

            {/* 3. Quần đảo Thổ Chu (Mốc cực Tây Nam Tổ quốc) */}
            <circle cx="10.8" cy="48.6" r="0.24" fill="#DEBE85" />

            {/* 4. Quần đảo Hòn Khoai (Mốc cực Nam ngoài khơi Mũi Cà Mau) */}
            <circle cx="14.0" cy="51.0" r="0.24" fill="#DEBE85" />

            {/* 5. Quần đảo Côn Đảo (Biển Đông Nam Bộ) */}
            <ellipse
              cx="19.5"
              cy="48.6"
              rx="0.5"
              ry="0.26"
              transform="rotate(35 19.5 48.6)"
              fill="url(#scanms-vn-gold)"
              stroke="url(#scanms-stroke-gold)"
              strokeWidth="0.16"
            />

            {/* QUẦN ĐẢO HOÀNG SA (Chuẩn xác theo ảnh vệ tinh: Ngang bờ biển Đà Nẵng - Quảng Nam) */}
            <g id="quan-dao-hoang-sa" transform="translate(34.0, 25.8)">
              {/* Ngôi sao vàng chủ quyền */}
              <path
                d="M 0 -1.8 L 0.45 -0.55 L 1.8 -0.55 L 0.7 0.3 L 1.1 1.6 L 0 0.8 L -1.1 1.6 L -0.7 0.3 L -1.8 -0.55 L -0.45 -0.55 Z"
                fill="url(#star-gold)"
                stroke="#B88E4F"
                strokeWidth="0.22"
              />
              <circle cx="0" cy="0" r="0.55" fill="#FFFFFF" />
              {/* Nhóm đảo An Vĩnh (Đông Bắc) & Nhóm Lưỡi Liềm (Tây Nam) */}
              <ellipse cx="1.7" cy="-0.6" rx="0.55" ry="0.38" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
              <circle cx="2.5" cy="0.6" r="0.35" fill="#DEBE85" />
              <circle cx="1.1" cy="1.1" r="0.4" fill="#DEBE85" />
              <ellipse cx="-1.5" cy="-0.8" rx="0.52" ry="0.35" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
              <circle cx="-0.8" cy="1.3" r="0.38" fill="#DEBE85" />
              <circle cx="-2.3" cy="0.5" r="0.32" fill="#DEBE85" />
            </g>

            {/* QUẦN ĐẢO TRƯỜNG SA (Chuẩn xác theo ảnh vệ tinh: Đông Nam Biển Đông ngoài khơi Nam Trung Bộ & Nam Bộ) */}
            <g id="quan-dao-truong-sa" transform="translate(40.5, 41.5)">
              {/* Ngôi sao vàng chủ quyền */}
              <path
                d="M 0 -2.1 L 0.5 -0.65 L 2.1 -0.65 L 0.85 0.35 L 1.3 1.85 L 0 0.95 L -1.3 1.85 L -0.85 0.35 L -2.1 -0.65 L -0.5 -0.65 Z"
                fill="url(#star-gold)"
                stroke="#B88E4F"
                strokeWidth="0.22"
              />
              <circle cx="0" cy="0" r="0.65" fill="#FFFFFF" />
              {/* Các cụm đảo Song Tử, Nam Yết, Sinh Tồn, Trường Sa Lớn, Thuyền Chài, An Bang */}
              <circle cx="-2.1" cy="-2.2" r="0.55" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
              <circle cx="-0.7" cy="-1.6" r="0.42" fill="#DEBE85" />
              <circle cx="1.5" cy="-1.8" r="0.48" fill="#DEBE85" />
              <ellipse cx="-2.9" cy="0.7" rx="0.6" ry="0.42" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
              <circle cx="-1.4" cy="1.6" r="0.46" fill="#DEBE85" />
              <circle cx="-2.1" cy="2.7" r="0.38" fill="#DEBE85" />
              <circle cx="1.7" cy="1.1" r="0.52" fill="url(#scanms-vn-gold)" stroke="url(#scanms-stroke-gold)" strokeWidth="0.15" />
              <circle cx="2.9" cy="0.2" r="0.46" fill="#DEBE85" />
              <circle cx="0.5" cy="2.9" r="0.45" fill="#DEBE85" />
              <circle cx="2.4" cy="2.5" r="0.4" fill="#DEBE85" />
            </g>
          </g>
        </svg>
      </div>

      {/* Typography Tên Thương Hiệu: ScanMS */}
      {variant === 'full' && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-baseline tracking-tight">
            <span
              className={`font-black tracking-tight text-[#1A1612] ${iconDimensions.textMain}`}
              style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
            >
              Scan
            </span>
            <span
              className={`font-black italic text-transparent bg-clip-text bg-gradient-to-r from-[#B88E4F] via-[#C59B58] to-[#B88E4F] ml-0.5 ${iconDimensions.textMain}`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              MS
            </span>
            <span className="text-[#B88E4F] text-xs ml-1 font-serif font-bold animate-pulse">✦</span>
          </div>

          {showSubtitle && (
            <span
              className={`scanms-logo-subtitle text-[#7D715E] font-bold uppercase tracking-widest mt-1 ${iconDimensions.textSub}`}
            >
              Affiliate Commerce Network
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanMSLogo;
