import { Link } from 'react-router-dom';
import { Clock3 } from 'lucide-react';

export default function PendingFeaturePage({ title = 'Chức năng đang được hoàn thiện', description = 'Chức năng này chưa sẵn sàng trong phiên bản hiện tại.' }: { title?: string; description?: string }) {
  return <section className="rounded-2xl bg-white border border-[#EAE4D7] p-8 space-y-4 max-w-2xl"><Clock3 className="w-9 h-9 text-[#B88E4F]" /><h1 className="text-2xl font-bold">{title}</h1><p className="text-[#7D715E]">{description}</p><Link className="inline-block text-[#B88E4F] font-bold underline" to="/portal">Về không gian của tôi</Link></section>;
}
