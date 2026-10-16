import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/ui/Modal';
import { scanmsService, type AiSuggestion, type ResourceRequests } from '../../services/scanms.service';
import { integerVnd, percentage } from '../../services/backend-contract';
import { eligibleVoucherReferences } from '../../services/domain-model';
import type { UserProfile } from '../../services/auth.service';
import type { Snapshot } from './snapshot';
import type { ResourcePath } from '../../services/backend-contract';
import { fieldLabels, resourceConfig, statusLabels } from './resource-config';
import { canCreate, type CreatableResource } from './capabilities';

type Field = { name: string; required?: boolean; kind?: 'text' | 'number' | 'decimal' | 'url' | 'textarea' | 'datetime-local' | 'checkbox' | 'multi'; options?: { value: string; label: string }[] };
const enumOptions = (values: string[]) => values.map(value => ({ value, label: statusLabels[value] || value }));

export default function CreateResourceForm({ resource, user, snapshot, storeId, onClose, onSaved }: {
  resource: CreatableResource; user: UserProfile; snapshot: Snapshot; storeId: string; onClose: () => void; onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({ status: 'ACTIVE', active: 'true',
    scopeType: user.roles.includes('ADMIN') ? 'PLATFORM' : 'STORE', discountType: 'FIXED',
    primaryImage: 'false', sortOrder: '0', displayOrder: '0', attributes: '{}', sizeGuide: '{}', limits: '{}' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ai, setAi] = useState<AiSuggestion | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectionIndex, setDetectionIndex] = useState('0');
  const set = (name: string, value: string) => setValues(current => ({ ...current, [name]: value }));
  const products = snapshot.products.filter(row => row.storeId === storeId);
  const options = (resourceName: ResourcePath, key: string, rows = snapshot[resourceName]) => rows.map(row => ({
    value: String(row[key]), label: String(row.name || row.title || row.sku || row[key]),
  }));
  let fields: Field[] = [];
  if (resource === 'products') fields = [
    { name: 'name', required: true }, { name: 'categoryId', options: options('product-categories', 'categoryId', snapshot['product-categories'].filter(row => row.active)) },
    { name: 'description', kind: 'textarea' }, { name: 'material' }, { name: 'priceVnd', kind: 'number', required: true },
    { name: 'status', options: enumOptions(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']) },
    { name: 'attributes', kind: 'textarea' }, { name: 'sizeGuide', kind: 'textarea' },
  ];
  if (resource === 'product-variants') fields = [
    { name: 'productId', required: true, options: options('products', 'productId', products) },
    { name: 'sku', required: true }, { name: 'size' }, { name: 'color' },
    { name: 'priceVnd', kind: 'number', required: true }, { name: 'stockQuantity', kind: 'number', required: true },
    { name: 'status', options: enumOptions(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']) },
  ];
  if (resource === 'product-images') fields = [
    { name: 'productId', required: true, options: options('products', 'productId', products) },
    { name: 'objectKey', required: true }, { name: 'imageUrl', kind: 'url', required: true },
    { name: 'primaryImage', kind: 'checkbox' }, { name: 'sortOrder', kind: 'number' }, { name: 'altText' },
  ];
  if (resource === 'product-categories') fields = [
    { name: 'name', required: true }, { name: 'slug', required: true },
    { name: 'parentId', options: options('product-categories', 'categoryId') },
    { name: 'description', kind: 'textarea' }, { name: 'active', kind: 'checkbox' }, { name: 'displayOrder', kind: 'number' },
  ];
  if (resource === 'store-applications') fields = [{ name: 'proposedStoreName', required: true }, { name: 'description', kind: 'textarea' }];
  if (resource === 'collaborators') fields = [];
  if (resource === 'livestreams') fields = [
    { name: 'title', required: true }, { name: 'description', kind: 'textarea' }, { name: 'scheduledAt', kind: 'datetime-local', required: true },
    { name: 'productIds', kind: 'multi', options: options('products', 'productId', products) },
    { name: 'collaboratorIds', kind: 'multi', options: options('collaborators', 'collaboratorId', snapshot.collaborators.filter(row => row.approvalStatus === 'APPROVED')) },
  ];
  if (resource === 'vouchers') fields = [
    { name: 'code', required: true }, { name: 'scopeType', options: enumOptions(user.roles.includes('ADMIN') ? ['PLATFORM', 'STORE', 'PRODUCT', 'LIVESTREAM'] : ['STORE', 'PRODUCT', 'LIVESTREAM']) },
    ...(values.scopeType === 'PRODUCT' ? [{ name: 'productId', required: true, options: options('products', 'productId', products) }] : []),
    ...(values.scopeType === 'LIVESTREAM' ? [{ name: 'livestreamId', required: true, options: options('livestreams', 'livestreamId', snapshot.livestreams.filter(row => row.storeId === storeId)) }] : []),
    { name: 'discountType', options: enumOptions(['FIXED', 'PERCENTAGE']) }, { name: 'value', kind: values.discountType === 'PERCENTAGE' ? 'decimal' : 'number', required: true },
    { name: 'minimumSubtotal', kind: 'number' }, { name: 'cap', kind: 'number' },
    { name: 'validFrom', kind: 'datetime-local', required: true }, { name: 'validUntil', kind: 'datetime-local', required: true },
    { name: 'limits', kind: 'textarea' },
  ];

  function json(name: string): Record<string, unknown> {
    const result: unknown = JSON.parse(values[name] || '{}');
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Thuộc tính phải là một đối tượng JSON hợp lệ.');
    return result as Record<string, unknown>;
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (!canCreate(resource, user, snapshot, storeId)) throw new Error('Bạn chưa có quyền thực hiện thao tác này hoặc shop chưa được duyệt.');
      for (const field of fields) if (field.required && !values[field.name]?.trim()) throw new Error(`Vui lòng nhập ${fieldLabels[field.name] || field.name}.`);
      const body: Record<string, unknown> = {};
      for (const field of fields) {
        const value = values[field.name];
        if (field.kind === 'number' && value !== undefined && value !== '') body[field.name] = integerVnd(value);
        else if (field.kind === 'decimal' && value) body[field.name] = percentage(value);
        else if (field.kind === 'checkbox') body[field.name] = value === 'true';
        else if (value?.trim()) body[field.name] = value.trim();
      }
      if (resource === 'products') Object.assign(body, { storeId, attributes: json('attributes'), sizeGuide: json('sizeGuide') });
      if (resource === 'product-images') {
        const url = new URL(values.imageUrl);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('URL ảnh phải dùng HTTP hoặc HTTPS.');
        if (body.primaryImage && snapshot['product-images'].some(row => row.productId === body.productId && row.primaryImage)) {
          throw new Error('Sản phẩm đã có ảnh chính. Vui lòng thêm ảnh phụ.');
        }
      }
      if (resource === 'product-variants' && snapshot['product-variants'].some(row => row.sku === body.sku)) throw new Error('SKU đã tồn tại.');
      if (resource === 'store-applications') Object.assign(body, { applicantUserId: user.userId, status: 'PENDING', submittedAt: new Date().toISOString() });
      if (resource === 'collaborators') Object.assign(body, { userId: user.userId, approvalStatus: 'PENDING' });
      if (resource === 'livestreams') {
        if (new Date(values.scheduledAt).getTime() <= Date.now()) throw new Error('Lịch phát phải ở tương lai.');
        const selectedProducts = JSON.parse(values.productIds || '[]') as string[];
        const selectedCollaborators = JSON.parse(values.collaboratorIds || '[]') as string[];
        delete body.productIds;
        delete body.collaboratorIds;
        Object.assign(body, { storeId, status: 'SCHEDULED', productRefs: { productIds: selectedProducts },
          participantRefs: {}, collaboratorRefs: { collaboratorIds: selectedCollaborators }, viewerCount: 0, uniqueViewerCount: 0, peakConcurrentViewerCount: 0 });
      }
      if (resource === 'vouchers') {
        if (values.discountType === 'PERCENTAGE' && Number(values.value) > 100) throw new Error('Tỷ lệ giảm không được vượt 100%.');
        if (new Date(values.validUntil).getTime() <= new Date(values.validFrom).getTime()) throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
        const scope = values.scopeType as 'PLATFORM' | 'STORE' | 'PRODUCT' | 'LIVESTREAM';
        if (scope !== 'PLATFORM' && !storeId) throw new Error('Vui lòng chọn shop áp dụng.');
        Object.assign(body, eligibleVoucherReferences(scope, storeId, values.productId, values.livestreamId), {
          issuerType: user.roles.includes('ADMIN') ? 'PLATFORM' : 'STORE', limits: json('limits'),
          funding: { fundedBy: user.roles.includes('ADMIN') ? 'PLATFORM' : 'STORE' },
        });
      }
      // Forms only include current DTO fields; initial lifecycle states are fixed.
      await scanmsService.create(resource, body as unknown as ResourceRequests[CreatableResource]);
      onSaved();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không lưu được dữ liệu.'); }
    finally { setBusy(false); }
  }
  async function analyze(file?: File) {
    if (!file) return;
    setError(''); setAnalyzing(true);
    try {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) throw new Error('Chọn ảnh dưới 10 MB.');
      setAi(await scanmsService.analyze(file));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không phân tích được ảnh.'); }
    finally { setAnalyzing(false); }
  }
  function confirmAi() {
    if (!ai) return;
    try {
      const detection = ai.detections?.[Number(detectionIndex)];
      set('attributes', JSON.stringify({ ...json('attributes'), clothingType: detection?.className || ai.topPrediction?.className,
        dominantColors: ai.dominantColors, style: ai.stylePrediction?.style }, null, 2));
    } catch { setError('Vui lòng sửa thuộc tính JSON trước khi áp dụng gợi ý.'); }
  }
  const extraLabels: Record<string, string> = { attributes: 'Thuộc tính sản phẩm (JSON)', sizeGuide: 'Hướng dẫn size (JSON)', limits: 'Giới hạn sử dụng (JSON)', productIds: 'Sản phẩm trong live', collaboratorIds: 'KOL / CTV trong live' };
  return <Modal isOpen onClose={() => { if (!busy && !analyzing) onClose(); }} title={`Tạo ${resourceConfig[resource].title.toLowerCase()}`} maxWidth="2xl">
    <form onSubmit={save} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {error && <p role="alert" className="rounded-xl p-3 bg-red-50 text-red-700">{error}</p>}
      {resource === 'collaborators' && <p>Gửi hồ sơ KOL / CTV bằng tài khoản hiện tại. Quyền tiếp thị được cấp sau khi hồ sơ được duyệt.</p>}
      {resource === 'products' && <section className="rounded-xl border border-[#EAE4D7] p-4 space-y-3">
        <label className="block text-sm font-bold">Gợi ý sản phẩm từ ảnh <input type="file" accept="image/*" disabled={analyzing || busy} className="block mt-2" onChange={event => void analyze(event.target.files?.[0])} /></label>
        {analyzing && <p>Đang phân tích ảnh…</p>}
        {ai && <>
          <p className="text-sm text-[#7D715E]">Kiểm tra gợi ý trước khi lưu sản phẩm. Phân tích ảnh không tự đăng sản phẩm hoặc lưu ảnh.</p>
          {ai.detections && ai.detections.length > 0 && <select aria-label="Vật thể cần đăng" value={detectionIndex} onChange={event => setDetectionIndex(event.target.value)} className="border p-2 rounded-lg w-full">{ai.detections.map((item, index) => <option key={index} value={index}>{item.className} ({Math.round(item.confidence * 100)}%)</option>)}</select>}
          <p className="text-sm">Phong cách: {ai.stylePrediction?.style || 'Chưa có'} · Màu: {ai.dominantColors?.map(color => color.name).join(', ') || 'Chưa có'}</p>
          <button type="button" onClick={confirmAi} className="text-[#B88E4F] font-bold underline">Xác nhận gợi ý vào thuộc tính</button>
        </>}
      </section>}
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map(field => <label key={field.name} className={`text-sm font-semibold space-y-1 ${field.kind === 'textarea' ? 'sm:col-span-2' : ''}`}>
          <span>{extraLabels[field.name] || fieldLabels[field.name] || field.name}{field.required ? ' *' : ''}</span>
          {field.options ? <select required={field.required} multiple={field.kind === 'multi'} value={field.kind === 'multi' ? JSON.parse(values[field.name] || '[]') : values[field.name] || ''} onChange={event => set(field.name, field.kind === 'multi' ? JSON.stringify(Array.from(event.target.selectedOptions).map(option => option.value)) : event.target.value)} className="block border border-[#EAE4D7] rounded-xl p-2.5 w-full">{field.kind !== 'multi' && <option value="">Chọn…</option>}{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            : field.kind === 'textarea' ? <textarea rows={3} value={values[field.name] || ''} onChange={event => set(field.name, event.target.value)} className="block border border-[#EAE4D7] rounded-xl p-2.5 w-full" />
              : field.kind === 'checkbox' ? <input type="checkbox" checked={values[field.name] === 'true'} onChange={event => set(field.name, String(event.target.checked))} className="ml-3" />
                : <input type={field.kind === 'decimal' ? 'number' : field.kind || 'text'} min={field.kind === 'number' || field.kind === 'decimal' ? 0 : undefined} step={field.kind === 'number' ? 1 : field.kind === 'decimal' ? 'any' : undefined} required={field.required} value={values[field.name] || ''} onChange={event => set(field.name, event.target.value)} className="block border border-[#EAE4D7] rounded-xl p-2.5 w-full" />}
        </label>)}
      </div>
      <button disabled={busy || analyzing} className="rounded-xl bg-[#B88E4F] px-5 py-3 text-white font-bold disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu'}</button>
    </form>
  </Modal>;
}
