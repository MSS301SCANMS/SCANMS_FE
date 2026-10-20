import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCw, Scale } from 'lucide-react';
import { returnService, type ReturnDisputeRecord } from '../../services/return.service';
import { ReturnTimeline } from '../../components/returns/ReturnTimeline';
import { toast } from '../../utils/toast';

type Ruling = 'APPROVE_REFUND' | 'APPROVE_EXCHANGE' | 'UPHOLD_SHOP';

export default function AdminReturnDisputesPage() {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ruling, setRuling] = useState<Ruling>('APPROVE_REFUND');
  const [notes, setNotes] = useState('');
  const disputes = useQuery({
    queryKey: ['return-disputes'],
    queryFn: returnService.getAdminDisputes,
    refetchInterval: 30_000,
  });
  const stalled = useQuery({
    queryKey: ['stalled-return-inspections'],
    queryFn: returnService.getAdminStalled,
    refetchInterval: 30_000,
  });
  const resolve = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { ruling: Ruling; notes: string } }) =>
      returnService.resolveDispute(id, data),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['return-disputes'] });
      toast.success('Đã lưu quyết định phán quyết trọng tài thành công!');
      setSelectedId(null);
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể lưu quyết định. Vui lòng thử lại.');
    },
  });
  const rows = disputes.data ?? [];
  const selected: ReturnDisputeRecord | undefined = rows.find((item) => item.id === selectedId) ?? rows[0];
  const canUpholdShop = !selected?.returnRequest.customerShipment?.receivedAt;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || notes.trim().length < 20 || (ruling === 'UPHOLD_SHOP' && !canUpholdShop)) return;
    resolve.mutate({ id: selected.id, data: { ruling, notes: notes.trim() } });
  }

  return <main className="min-h-screen bg-[#FAF8F5] p-4 text-[#1A1612] sm:p-6">
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#B88E4F]">SCANMS · Trọng tài đổi trả</p>
          <h1 className="mt-1 text-2xl font-black">Khiếu nại trả hàng đang mở</h1>
          <p className="mt-1 text-sm text-[#7D715E]">Đối chiếu lịch sử, bằng chứng và kết quả kiểm tra trước khi ra quyết định.</p>
        </div>
        <button type="button" onClick={() => { void disputes.refetch(); void stalled.refetch(); }}
          disabled={disputes.isFetching || stalled.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-4 py-2 text-sm disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Làm mới
        </button>
      </header>

      <section className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-5" aria-label="Hồ sơ quá hạn kiểm tra">
        <h2 className="font-bold">Shop chậm kiểm tra quá 48 giờ</h2>
        <p className="mt-1 text-xs text-[#7D715E]">Các hồ sơ này vẫn đang chờ Shop xử lý; khách có quyền gửi khiếu nại.</p>
        {stalled.isLoading && <p role="status" className="mt-3 text-sm">Đang tải hồ sơ quá hạn…</p>}
        {stalled.error && <p role="alert" className="mt-3 text-sm text-[#DC2626]">Không thể tải hồ sơ quá hạn.</p>}
        {!stalled.isLoading && !stalled.error && stalled.data?.length === 0 &&
          <p className="mt-3 text-sm text-[#7D715E]">Không có hồ sơ quá hạn kiểm tra.</p>}
        {!!stalled.data?.length && <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {stalled.data.map((item) => <Link key={item.id} to={`/admin/returns/${item.id}`}
            className="rounded-xl border border-[#EAE4D7] bg-white p-3 hover:border-[#C59B58]">
            <span className="block text-sm font-bold">#{item.order.externalOrderSn}</span>
            <span className="mt-1 block text-xs text-[#7D715E]">{item.order.storeName} · Nhận lúc {item.receivedAt ? new Date(item.receivedAt).toLocaleString('vi-VN') : 'Không rõ'}</span>
          </Link>)}
        </div>}
      </section>

      {disputes.isLoading && <p role="status">Đang tải khiếu nại…</p>}
      {disputes.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#DC2626]">
        Không thể tải khiếu nại. Vui lòng thử lại.
      </p>}
      {!disputes.isLoading && !disputes.error && rows.length === 0 &&
        <p className="rounded-2xl border border-[#EAE4D7] bg-white p-6 text-sm text-[#7D715E]">Không có khiếu nại đang mở.</p>}

      {selected && <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-2" aria-label="Danh sách khiếu nại">
          {rows.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setRuling('APPROVE_REFUND'); }}
            className={`w-full rounded-xl border p-4 text-left ${selected.id === item.id
              ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white'}`}>
            <span className="block text-sm font-bold">#{item.returnRequest.order.externalOrderSn}</span>
            <span className="mt-1 block text-xs text-[#7D715E]">{item.returnRequest.order.storeName}</span>
            <span className="mt-2 block text-xs">{new Date(item.openedAt).toLocaleString('vi-VN')}</span>
          </button>)}
        </aside>
        <div className="space-y-4">
          <section className="rounded-2xl border border-[#EAE4D7] bg-white p-5">
            <div className="flex items-center gap-2"><Scale className="h-5 w-5 text-[#B88E4F]" />
              <h2 className="text-lg font-bold">Hồ sơ #{selected.returnRequest.order.externalOrderSn}</h2></div>
            <p className="mt-3 text-sm"><strong>Lý do khiếu nại:</strong> {selected.reason}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{selected.details}</p>
            {selected.returnRequest.inspectionNotes && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F3EFE6] p-3 text-sm">
              <strong>Kết quả kiểm tra của Shop:</strong> {selected.returnRequest.inspectionNotes}</p>}
            {selected.returnRequest.customerShipment && <p className="mt-3 text-sm">
              <strong>Hàng khách gửi:</strong> {selected.returnRequest.customerShipment.carrierName} · {selected.returnRequest.customerShipment.trackingNumber}</p>}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#B88E4F] underline">
              {selected.returnRequest.imageUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">Ảnh {index + 1}</a>)}
              {selected.returnRequest.unboxingVideoUrl && <a href={selected.returnRequest.unboxingVideoUrl} target="_blank" rel="noreferrer">Video mở hộp</a>}
              {selected.returnRequest.customerShipment?.receiptImageUrl &&
                <a href={selected.returnRequest.customerShipment.receiptImageUrl} target="_blank" rel="noreferrer">Ảnh biên nhận</a>}
            </div>
            <Link to={`/admin/disputes`} className="mt-4 inline-block text-xs text-[#7D715E] underline">Xem khiếu nại đơn hàng cũ</Link>
          </section>
          <ReturnTimeline request={selected.returnRequest} />
          <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-5">
            <h2 className="font-bold">Phân xử</h2>
            <label className="block text-sm">Quyết định
              <select value={ruling} onChange={(event) => setRuling(event.target.value as Ruling)}
                className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white p-3">
                <option value="APPROVE_REFUND">Chấp thuận hoàn tiền</option>
                <option value="APPROVE_EXCHANGE">Chấp thuận đổi hàng</option>
                {canUpholdShop && <option value="UPHOLD_SHOP">Giữ quyết định của Shop</option>}
              </select>
            </label>
            <label className="block text-sm">Căn cứ phân xử
              <textarea required minLength={20} maxLength={3000} rows={4} value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white p-3" />
            </label>
            <p className="text-xs text-[#7D715E]">Chấp thuận hoàn tiền chỉ tạo hồ sơ chờ xử lý; chưa chuyển tiền cho khách.</p>
            {!canUpholdShop && <p className="text-xs text-[#7D715E]">Shop đang giữ hàng khách trả; không thể đóng hồ sơ nếu chưa có phương án trả hàng hoặc bồi hoàn.</p>}
            <button type="submit" disabled={resolve.isPending || notes.trim().length < 20 || (ruling === 'UPHOLD_SHOP' && !canUpholdShop)}
              className="rounded-xl bg-[#C59B58] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {resolve.isPending ? 'Đang lưu…' : 'Lưu quyết định'}</button>
            {resolve.error && <p role="alert" className="text-sm text-[#DC2626]">Không thể lưu quyết định. Vui lòng thử lại.</p>}
          </form>
        </div>
      </div>}
    </div>
  </main>;
}
