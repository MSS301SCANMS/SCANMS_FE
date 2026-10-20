import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Check,
} from 'lucide-react';
import { walletService, type WalletSummary, type LedgerEntry, type LedgerHistory } from '../../services/wallet.service';
import CustomerPayosTopUp from './CustomerPayosTopUp';
import { formatMoney } from '@/utils/marketplace.utils';
import { toast } from '../../utils/toast';

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export const CustomerWalletTab: React.FC = () => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [ledger, setLedger] = useState<LedgerHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [customAmount, setCustomAmount] = useState<string>('500000');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpTab, setTopUpTab] = useState<'SANDBOX' | 'PAYOS'>('PAYOS');

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, ledgerData] = await Promise.all([
        walletService.getMyWallet(),
        walletService.getMyLedger(page),
      ]);
      setWallet(walletData);
      setLedger(ledgerData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [page]);

  const handleTopUp = async (amount: number) => {
    if (!amount || amount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000 ₫');
      return;
    }
    try {
      setTopUpLoading(true);
      await walletService.topUpDemo(amount);
      toast.success(`Nạp thành công ${formatMoney(amount)} vào Ví SCANMS!`);
      await fetchWalletData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể nạp tiền thử nghiệm');
    } finally {
      setTopUpLoading(false);
    }
  };

  const getLedgerBadge = (entry: LedgerEntry) => {
    const isPositive =
      entry.transactionType === 'COMMISSION_APPROVED' ||
      entry.referenceType === 'TOPUP_DEMO' ||
      entry.referenceType === 'TOPUP_PAYOS' ||
      entry.referenceType === 'ORDER_REFUND';

    if (entry.referenceType === 'TOPUP_PAYOS') {
      return { label: 'Nạp tiền qua payOS', badgeClass: 'bg-[#FBF5EB] text-[#7D715E] border-[#EEDFC6]', sign: '+', colorClass: 'text-[#1A1612] font-bold' };
    }
    if (entry.referenceType === 'TOPUP_DEMO') {
      return {
        label: 'Nạp tiền thử nghiệm (Sandbox)',
        badgeClass: 'bg-[#FBF5EB] text-[#7D715E] border-[#EEDFC6]',
        sign: '+',
        colorClass: 'text-[#1A1612] font-bold',
      };
    }
    if (entry.referenceType === 'ORDER_REFUND') {
      return {
        label: 'Hoàn tiền đổi trả đơn hàng',
        badgeClass: 'bg-[#FBF5EB] text-[#7D715E] border-[#EEDFC6]',
        sign: '+',
        colorClass: 'text-[#1A1612] font-bold',
      };
    }
    if (entry.referenceType === 'ORDER_PAYMENT') {
      return {
        label: 'Thanh toán đơn hàng',
        badgeClass: 'bg-amber-50 text-[#B88E4F] border-[#EEDFC6]',
        sign: '-',
        colorClass: 'text-[#DC2626] font-bold',
      };
    }
    return {
      label: isPositive ? 'Cộng tiền vào ví' : 'Trừ tiền từ ví',
      badgeClass: isPositive ? 'bg-[#FBF5EB] text-[#7D715E] border-[#EEDFC6]' : 'bg-gray-50 text-gray-700 border-gray-200',
      sign: isPositive ? '+' : '-',
      colorClass: isPositive ? 'text-[#1A1612] font-bold' : 'text-[#DC2626] font-bold',
    };
  };

  return (
    <section className="@container/wallet grid gap-[14px] w-full max-w-[1120px] min-w-0 text-left text-[#1A1612] max-[767px]:pb-[64px]" aria-label="Ví mua sắm">

      <section
        className="relative grid grid-cols-[minmax(0,1fr)_240px] items-center gap-[20px] p-[18px_20px] border border-[#EAE4D7] rounded-[13px] bg-white shadow-[0_3px_12px_#231D1504] before:content-[''] before:absolute before:top-[-1px] before:left-[20px] before:w-[36px] before:h-[3px] before:rounded-b-[3px] before:bg-[#C59B58] @max-[599px]:grid-cols-[minmax(0,1fr)] @max-[599px]:gap-[14px] @max-[599px]:p-[16px]"
        aria-label="Số dư ví"
        aria-busy={loading}
      >
        <div className="flex items-center gap-[14px] min-w-0 @max-[599px]:gap-[12px]">
          <div className="grid gap-[5px] min-w-0">
            <span className="flex items-center gap-[6px] text-[11px] font-[450] text-[#7D715E]">
              Số dư khả dụng
            </span>
            <strong className="text-[32px] leading-[1.2] tracking-[-0.8px] font-[650] tabular-nums break-words text-[#1A1612] @max-[599px]:text-[28px]">
              {loading && !wallet ? '—' : formatMoney(Number(wallet?.availableBalance || 0))}
            </strong>
          </div>
        </div>
        <div className="grid gap-[6px] min-w-0 pl-[20px] border-l border-[#EAE4D7] @max-[599px]:gap-[8px] @max-[599px]:p-[12px_0_0] @max-[599px]:border-l-0 @max-[599px]:border-t @max-[599px]:border-[#EAE4D7]">
          <span className="flex items-center order-2 justify-self-start gap-[5px] text-[#7D715E] text-[10px] whitespace-nowrap">
            <Check size={12} className="text-[#059669]" /> Đang hoạt động
          </span>
          <div className="grid gap-[5px] min-w-0 @max-[599px]:flex @max-[599px]:items-center @max-[599px]:justify-between @max-[599px]:gap-[12px]">
            <span className="flex items-center gap-[6px] text-[11px] font-[450] text-[#7D715E] whitespace-nowrap">
              <Clock size={13} /> Chờ xử lý
            </span>
            <strong className="text-[22px] font-[600] tabular-nums break-words text-left text-[#1A1612] @max-[599px]:text-[18px] @max-[599px]:text-right">
              {loading && !wallet ? '—' : formatMoney(Number(wallet?.pendingBalance || 0))}
            </strong>
          </div>
        </div>
      </section>

      <section aria-labelledby="customer-topup-title" className="block min-w-0 border border-[#EAE4D7] rounded-[12px] bg-white overflow-hidden">
        <header className="flex items-center gap-[11px] min-h-[64px] p-[12px_16px] border-b border-[#EAE4D7] @max-[599px]:gap-[9px] @max-[599px]:p-[13px_12px]">
          <span className="inline-flex items-center justify-center shrink-0 w-[34px] h-[34px] rounded-[10px] bg-[#FBF5EB] text-[#B88E4F]">
            <Plus size={17} />
          </span>
          <span className="grid gap-[3px] min-w-0 text-left">
            <strong id="customer-topup-title" className="text-[14px] font-[600] text-[#1A1612] @max-[599px]:text-[13px]">Nạp tiền vào ví</strong>
            <small className="text-[11px] text-[#7D715E] @max-[599px]:text-[10px] @max-[599px]:max-w-[185px]">Chọn số tiền và phương thức nạp</small>
          </span>
        </header>
        <div className="grid gap-[12px] p-[16px] max-w-[860px] text-left @max-[599px]:p-[14px_12px]">
          <div className="flex gap-[4px] w-fit max-w-full p-[3px] border border-[#EAE4D7] rounded-[9px] bg-[#FAF8F5] @max-[599px]:w-full" role="group" aria-label="Phương thức nạp tiền">
            <button
              type="button"
              aria-pressed={topUpTab === 'SANDBOX'}
              onClick={() => setTopUpTab('SANDBOX')}
              className={`inline-flex items-center justify-center gap-[6px] min-h-[32px] px-[12px] py-[6px] border rounded-[6px] text-[12px] font-[500] cursor-pointer transition @max-[599px]:flex-1 @max-[599px]:px-[8px] @max-[599px]:py-[6px] @max-[599px]:text-[11px] ${topUpTab === 'SANDBOX' ? 'bg-white text-[#1A1612] border-[#EEDFC6] shadow-xs' : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'}`}
            >
              Sandbox (Demo)
            </button>
            <button
              type="button"
              aria-pressed={topUpTab === 'PAYOS'}
              onClick={() => setTopUpTab('PAYOS')}
              className={`inline-flex items-center justify-center gap-[6px] min-h-[32px] px-[12px] py-[6px] border rounded-[6px] text-[12px] font-[500] cursor-pointer transition @max-[599px]:flex-1 @max-[599px]:px-[8px] @max-[599px]:py-[6px] @max-[599px]:text-[11px] ${topUpTab === 'PAYOS' ? 'bg-white text-[#1A1612] border-[#EEDFC6] shadow-xs' : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'}`}
            >
              <QrCode size={14} />payOS ngân hàng
            </button>
          </div>
          {topUpTab === 'SANDBOX' ? (
            <div className="grid gap-[12px]">
              <p className="m-0 text-[11px] text-[#7D715E]">Nạp thử nghiệm · Số dư được cộng ngay sau khi nạp.</p>
              <div className="grid grid-cols-6 gap-[7px] @max-[599px]:grid-cols-3" role="group" aria-label="Chọn mức nạp nhanh">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    aria-pressed={customAmount === String(amt)}
                    onClick={() => setCustomAmount(String(amt))}
                    className={`min-h-[34px] p-[6px] border rounded-[7px] text-[12px] font-[550] cursor-pointer transition ${customAmount === String(amt) ? 'bg-[#FBF5EB] border-[#C59B58] text-[#B88E4F]' : 'bg-white border-[#EAE4D7] text-[#1A1612] hover:bg-[#FBF5EB]'}`}
                  >
                    +{amt >= 1000000 ? (amt / 1000000) + 'M' : (amt / 1000) + 'k'}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-[10px] @max-[599px]:flex-wrap">
                <div className="flex-1 min-w-0 @max-[599px]:basis-full">
                  <label htmlFor="cw-demo-amount" className="block mb-[5px] text-[11px] text-[#7D715E]">Số tiền nạp</label>
                  <div className="flex items-center gap-[8px] min-h-[38px] px-[12px] border border-[#EAE4D7] focus-within:border-[#C59B58] rounded-[8px] bg-white">
                    <input
                      id="cw-demo-amount"
                      type="number"
                      min="10000"
                      step="50000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Tối thiểu 10.000"
                      className="w-full min-w-0 py-[8px] border-0 outline-none bg-transparent text-[#1A1612] text-[14px] font-[550]"
                    />
                    <span className="text-[11px] text-[#7D715E]">VNĐ</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-[6px] min-h-[38px] px-[16px] py-[8px] border border-[#C59B58] rounded-[8px] bg-[#C59B58] hover:bg-[#B88E4F] text-white text-[12px] font-[600] cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50 disabled:cursor-wait @max-[599px]:w-full @max-[599px]:text-[12px]"
                  disabled={topUpLoading}
                  onClick={() => handleTopUp(Number(customAmount))}
                >
                  {topUpLoading ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
                  {topUpLoading ? 'Đang xử lý...' : 'Nạp tiền (Demo)'}
                </button>
              </div>
              <details className="border-t border-[#EAE4D7] pt-[10px] [&[open]>summary_svg]:rotate-180">
                <summary className="flex items-center gap-[7px] w-fit text-[11px] text-[#7D715E] cursor-pointer list-none select-none">
                  <span>Thông tin nạp thử nghiệm</span>
                  <ChevronDown size={13} className="transition-transform duration-200" />
                </summary>
                <p className="m-[8px_0_0] text-[12px] leading-[1.6] text-[#7D715E]">
                  Nạp trực tiếp vào số dư ví để kiểm thử đặt hàng và luân chuyển dòng tiền. Chính sách hoàn tiền đổi trả áp dụng trong 14 ngày (ORDER_REFUND).
                </p>
              </details>
            </div>
          ) : (
            <CustomerPayosTopUp onPaid={fetchWalletData} />
          )}
        </div>
      </section>

      <details className="block min-w-0 border border-[#EAE4D7] rounded-[12px] bg-white overflow-hidden [&[open]>summary]:border-b [&[open]>summary]:border-[#EAE4D7] [&[open]>summary_.cw-chevron]:rotate-180">
        <summary className="flex items-center gap-[11px] min-h-[64px] p-[12px_16px] cursor-pointer list-none hover:bg-[#FAF8F5] transition-colors select-none [&::-webkit-details-marker]:none @max-[599px]:gap-[9px] @max-[599px]:p-[13px_12px]">
          <span className="inline-flex items-center justify-center shrink-0 w-[34px] h-[34px] rounded-[10px] bg-[#FBF5EB] text-[#B88E4F]">
            <Clock size={17} />
          </span>
          <span className="grid gap-[3px] min-w-0 text-left">
            <strong className="text-[14px] font-[600] text-[#1A1612] @max-[599px]:text-[13px]">Lịch sử giao dịch</strong>
            <small className="text-[11px] text-[#7D715E] @max-[599px]:text-[10px]">Nạp tiền, thanh toán & hoàn tiền</small>
          </span>
          <span className="ml-auto p-[3px_7px] rounded-[6px] bg-[#F3EFE6] text-[10px] text-[#7D715E] whitespace-nowrap @max-[599px]:[&>span]:hidden">
            {ledger?.total ?? 0}<span> giao dịch</span>
          </span>
          <ChevronDown className="cw-chevron text-[#B88E4F] ml-2 shrink-0 transition-transform duration-200" size={15} />
        </summary>
        <div>
          {loading ? (
            <div className="grid justify-items-center gap-[6px] p-[22px_18px] text-[#7D715E] text-center" role="status">
              <RefreshCw className="w-5 h-5 text-[#B88E4F] animate-spin" />
              <span className="text-[12px]">Đang tải lịch sử giao dịch ví...</span>
            </div>
          ) : !ledger?.entries || ledger.entries.length === 0 ? (
            <div className="grid justify-items-center gap-[6px] p-[22px_18px] text-[#7D715E] text-center">
              <Wallet className="w-[26px] h-[26px] text-[#C59B58] stroke-[1.5] mb-[2px]" />
              <p className="m-0 text-[12px] text-[#7D715E]">Chưa có giao dịch</p>
              <p className="m-0 text-[11px] text-[#7D715E]">Các khoản nạp, thanh toán và hoàn tiền sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto" tabIndex={0} aria-label="Lịch sử biến động số dư">
              <table className="min-w-[760px] w-full text-left text-[12px]">
                <thead className="bg-[#FAF8F5] text-[#7D715E] text-[11px] font-[550] border-b border-[#EAE4D7]">
                  <tr>
                    <th className="p-[11px_16px] font-[550]">Thời Gian</th>
                    <th className="p-[11px_16px] font-[550]">Nội Dung Biến Động</th>
                    <th className="p-[11px_16px] text-right font-[550]">Số Tiền</th>
                    <th className="p-[11px_16px] text-right font-[550]">Số Dư Trước</th>
                    <th className="p-[11px_16px] text-right font-[550]">Số Dư Sau</th>
                    <th className="p-[11px_16px] text-center font-[550]">Mã Tham Chiếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F5]">
                  {ledger.entries.map((entry) => {
                    const badge = getLedgerBadge(entry);
                    return (
                      <tr key={entry.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="p-[11px_16px] text-[#7D715E] whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-[11px_16px]">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className={`p-[11px_16px] text-right font-mono font-semibold whitespace-nowrap ${badge.colorClass}`}>
                          {badge.sign}{formatMoney(Number(entry.amount))}
                        </td>
                        <td className="p-[11px_16px] text-right text-[#7D715E] font-mono whitespace-nowrap">
                          {formatMoney(Number(entry.balanceBefore))}
                        </td>
                        <td className="p-[11px_16px] text-right text-[#1A1612] font-mono font-semibold whitespace-nowrap">
                          {formatMoney(Number(entry.balanceAfter))}
                        </td>
                        <td className="p-[11px_16px] text-center text-[#7D715E] font-mono text-[11px]">
                          {entry.referenceId ? (
                            <span className="bg-[#F3EFE6] px-1.5 py-0.5 rounded truncate max-w-[120px] inline-block" title={entry.referenceId}>
                              {entry.referenceId.slice(0, 8)}...
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {ledger && ledger.total > ledger.limit && (
            <div className="flex items-center justify-between flex-wrap gap-[10px] p-[12px_16px] border-t border-[#EAE4D7] bg-[#FAF8F5] text-[11px]">
              <span className="text-[#7D715E]">
                Trang {ledger.page} / {Math.ceil(ledger.total / ledger.limit)}
              </span>
              <div className="flex items-center gap-[6px]">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-[10px] py-[5px] rounded-[7px] border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] disabled:opacity-40 transition cursor-pointer flex items-center gap-1 font-[550] text-[#1A1612]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  disabled={page >= Math.ceil(ledger.total / ledger.limit)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-[10px] py-[5px] rounded-[7px] border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] disabled:opacity-40 transition cursor-pointer flex items-center gap-1 font-[550] text-[#1A1612]"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </details>
    </section>
  );
};

