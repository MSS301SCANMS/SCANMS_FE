const STEP_MS = 30_000;
const stages = [
  { status: 'ready_to_pick', title: 'Chờ bưu tá lấy hàng tại Shop' },
  { status: 'picked', title: 'Bưu tá đã lấy hàng tại kho Shop' },
  { status: 'storing', title: 'Nhập kho trung chuyển' },
  { status: 'delivering', title: 'Shipper đang đi giao' },
  { status: 'delivered', title: 'Giao hàng thành công' },
];

export function customerShippingPreview(orderCode: string, startedAt: number, now: number) {
  const step = Math.min(stages.length - 1, Math.max(0, Math.floor((now - startedAt) / STEP_MS)));
  const stageAt = startedAt + step * STEP_MS;
  return {
    orderCode,
    status: stages[step].status,
    statusText: stages[step].title,
    isSimulation: true,
    isStale: false,
    lastCheckedAt: new Date(stageAt).toISOString(),
    nextEventAt: step < stages.length - 1 ? new Date(stageAt + STEP_MS).toISOString() : null,
    expectedDeliveryTime: new Date(startedAt + (stages.length - 1) * STEP_MS).toISOString(),
    shipperName: null,
    shipperPhone: null,
    timeline: stages.slice(0, step + 1).map((stage, index) => ({
      ...stage,
      time: new Date(startedAt + index * STEP_MS).toISOString(),
    })),
  };
}
