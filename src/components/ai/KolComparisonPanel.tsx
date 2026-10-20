import { useState } from 'react';
import type { KolMatchResult } from '@/services/ai-recommendation.service';
import { downloadReport } from '@/utils/report-export';
import {
  workspaceButton,
  workspaceInput,
} from '@/components/ui/FeatureWorkspace';

/** Compare actual recommendation evidence, not fabricated AI confidence. */
export function KolComparisonPanel({
  candidates,
}: {
  candidates: KolMatchResult[];
}) {
  const [ids, setIds] = useState<string[]>(['', '', '']);
  const selected = ids
    .map((id) => candidates.find((item) => item.collaboratorId === id))
    .filter((item): item is KolMatchResult => !!item);
  const metrics: Array<{
    label: string;
    value: (kol: KolMatchResult) => string | number;
  }> = [
    { label: 'Điểm phù hợp /100', value: (kol) => kol.matchScore },
    {
      label: 'Ngành hàng /35',
      value: (kol) => kol.scoreBreakdown.categoryScore,
    },
    {
      label: 'Chuyển đổi /25',
      value: (kol) => kol.scoreBreakdown.conversionRateScore,
    },
    {
      label: 'Hạng & kênh /20',
      value: (kol) => kol.scoreBreakdown.tierAndSocialScore,
    },
    {
      label: 'Khoảng giá /20',
      value: (kol) => kol.scoreBreakdown.priceFitScore,
    },
    {
      label: 'Đơn hàng lịch sử',
      value: (kol) => kol.lifetimeStats.totalOrders,
    },
    {
      label: 'Click lịch sử',
      value: (kol) => kol.lifetimeStats.totalClicks ?? 'Chưa có',
    },
    {
      label: 'CR lịch sử (%)',
      value: (kol) => kol.lifetimeStats.conversionRate,
    },
    { label: 'Cấp bậc', value: (kol) => kol.tierName },
    {
      label: 'Nguồn khớp ngành',
      value: (kol) =>
        kol.categoryMatchSource === 'SALES'
          ? 'Lịch sử bán hàng'
          : kol.categoryMatchSource === 'PROFILE'
            ? 'Khai báo hồ sơ'
            : 'Chưa có bằng chứng',
    },
    {
      label: 'Độ đầy đủ dữ liệu',
      value: (kol) => kol.lifetimeStats.dataConfidence || 'Chưa xác định',
    },
  ];
  if (!candidates.length) return null;
  return (
    <details className="my-4 rounded-2xl border border-[#EEDFC6] bg-white p-4">
      <summary className="cursor-pointer text-sm font-bold text-[#1A1612]">
        So sánh tối đa 3 KOL trước khi mời hợp tác
      </summary>
      <p className="text-xs leading-5 text-[#7D715E]">
        Điểm là kết quả thuật toán đối sánh, không phải xác suất thành công.
        Lịch sử ít click hoặc đơn có thể khiến CR chưa đại diện.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {ids.map((id, index) => (
          <label key={index} className="text-xs text-[#7D715E]">
            KOL {index + 1}
            <select
              value={
                candidates.some((item) => item.collaboratorId === id) ? id : ''
              }
              className={`${workspaceInput} mt-2`}
              onChange={(event) =>
                setIds((previous) =>
                  previous.map((value, slot) =>
                    slot === index ? event.target.value : value,
                  ),
                )
              }
            >
              <option value="">Chọn nhà sáng tạo</option>
              {candidates.map((kol) => (
                <option
                  key={kol.collaboratorId}
                  disabled={
                    ids.includes(kol.collaboratorId) &&
                    id !== kol.collaboratorId
                  }
                  value={kol.collaboratorId}
                >
                  {kol.fullName} · {kol.matchScore}/100
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {!!selected.length && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-xs">
              <caption className="sr-only">
                So sánh điểm thành phần và bằng chứng của các KOL đã chọn
              </caption>
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#FBF5EB]">
                  <th scope="col" className="p-3">
                    Tiêu chí
                  </th>
                  {selected.map((kol) => (
                    <th scope="col" className="p-3" key={kol.collaboratorId}>
                      {kol.fullName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.label} className="border-b border-[#EAE4D7]">
                    <th scope="row" className="p-3 font-medium text-[#7D715E]">
                      {metric.label}
                    </th>
                    {selected.map((kol) => (
                      <td
                        key={kol.collaboratorId}
                        className="p-3 tabular-nums text-[#1A1612]"
                      >
                        {metric.value(kol)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="p-3 text-[#7D715E]">
                    Lý do đề xuất
                  </th>
                  {selected.map((kol) => (
                    <td
                      key={kol.collaboratorId}
                      className="max-w-xs p-3 leading-5 text-[#7D715E]"
                    >
                      {kol.aiReasoning}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className={`${workspaceButton} mt-4`}
            onClick={() =>
              downloadReport('SCANMS_KOL_comparison.csv', [
                ['Tiêu chí', ...selected.map((kol) => kol.fullName)],
                ...metrics.map((metric) => [
                  metric.label,
                  ...selected.map(metric.value),
                ]),
                ['Lý do đề xuất', ...selected.map((kol) => kol.aiReasoning)],
              ])
            }
          >
            Xuất bảng so sánh CSV
          </button>
        </>
      )}
    </details>
  );
}
