import { useQuery } from '@tanstack/react-query';
import { collaborationChat } from '@/services/collaboration-chat.service';
import { CollaborationResourceCard } from '@/components/chat/CollaborationResourceCard';
import { Button } from '@/components/ui/Button';

export default function ChatSampleRequestsPage({shop = false}: { shop?: boolean }) {
  const userId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}').id;
    } catch {
      return '';
    }
  })();
  const query = useQuery({
    queryKey: ['chat-samples', userId, shop],
    queryFn: () => collaborationChat.samples(shop),
    refetchInterval: 10000,
    retry: false
  });
  return <div className="mx-auto max-w-[1400px] space-y-5 p-6">
    <header className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold">Yêu cầu hàng dùng thử</h1><p
        className="mt-2 text-sm text-[#7D715E]">Yêu cầu tạo từ chat được quản lý và cập nhật tại đây.</p></div>
      <Button variant="outline" onClick={() => void query.refetch()}>Làm mới</Button></header>
    {query.isPending && <p role="status">Đang tải yêu cầu…</p>}
    {query.isError &&
      <p role="alert" className="text-red-600">Không tải được yêu cầu hàng mẫu. Vui lòng thử lại.</p>}
    {query.data?.length === 0 &&
      <p className="rounded-2xl border border-[#EAE4D7] bg-white p-8">Chưa có yêu cầu hàng mẫu. KOL có thể gửi yêu
        cầu trong cuộc trò chuyện với shop đã hợp tác.</p>}
    <div className="grid grid-cols-2 gap-4">{query.data?.map(row => <CollaborationResourceCard key={row.id}
                                                 kind="SAMPLE_REQUEST"
                                                 id={row.id}
                                                 isStoreOwner={shop}/>)}</div>
  </div>;
}
