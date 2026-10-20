import { Check, Clock, Package, Truck, Star } from 'lucide-react';

export function CustomerOrderProgress({ status, trackingStatus }: { status: string; trackingStatus: string | null }) {
  const beforePickup = ['ready_to_pick', 'picking', 'money_collect_picking', 'unavailable', 'cancel'];
  const delivered = trackingStatus ? trackingStatus === 'delivered' : ['DELIVERED', 'COMPLETED'].includes(status);
  const shipping = trackingStatus ? !beforePickup.includes(trackingStatus) : ['SHIPPING', 'DELIVERED', 'COMPLETED'].includes(status);
  const confirmed = status !== 'PENDING' && status !== 'CANCELLED';
  const currentStep = delivered ? 3 : shipping ? 2 : confirmed ? 1 : 0;
  const steps = [
    { title: 'Đặt hàng', icon: Package },
    { title: 'Xác nhận', icon: Clock },
    { title: 'Đang giao', icon: Truck },
    { title: 'Hoàn tất', icon: Star },
  ];

  return (
    <ol aria-label="Tiến độ đơn hàng" className="m-0 flex list-none items-start rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3.5 text-center text-xs">
      {steps.map(({ title, icon: Icon }, index) => {
        const done = index < currentStep || (index === 3 && delivered);
        const current = index === currentStep;
        const reached = index <= currentStep;
        return (
          <li key={title} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5">
            {index > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-3.5 h-0.5 w-full transition-colors duration-300 ${reached ? 'bg-[#C59B58]' : 'bg-[#EAE4D7]'}`} />}
            <span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border transition-colors duration-300 ${done ? 'border-[#C59B58] bg-[#C59B58] text-white' : current ? 'border-[#C59B58] bg-[#FBF5EB] text-[#B88E4F]' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'}`}>
              {done ? <Check size={16} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
            </span>
            <span className={`relative z-10 font-semibold ${reached ? 'text-[#1A1612]' : 'text-[#7D715E]'}`}>{title}</span>
          </li>
        );
      })}
    </ol>
  );
}
