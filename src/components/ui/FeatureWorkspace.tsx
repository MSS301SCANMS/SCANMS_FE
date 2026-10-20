import type { ReactNode } from 'react';
import { AlertCircle, ArrowRight, Inbox } from 'lucide-react';

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-[#EEDFC6] bg-[#FBF5EB] p-5 text-left sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full border-[38px] border-[#C59B58]/10"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-2xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8C6226]">
            {eyebrow}
          </p>
          <h1 className="m-0 text-2xl font-bold tracking-tight text-[#1A1612] sm:text-3xl">
            {title}
          </h1>
          <p className="mb-0 mt-2 text-xs leading-6 text-[#7D715E] sm:text-sm">
            {description}
          </p>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}

export function WorkspaceMetrics({
  items,
}: {
  items: Array<{
    label: string;
    value: ReactNode;
    detail?: string;
    alert?: boolean;
  }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5"
        >
          <p className="m-0 text-[11px] font-semibold text-[#7D715E]">
            {item.label}
          </p>
          <div
            className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${item.alert ? 'text-[#DC2626]' : 'text-[#1A1612]'}`}
          >
            {item.value}
          </div>
          {item.detail && (
            <p className="mb-0 mt-2 text-[10px] leading-4 text-[#7D715E]">
              {item.detail}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function WorkspaceState({
  title,
  description,
  error,
  action,
  onAction,
}: {
  title: string;
  description: string;
  error?: boolean;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      role={error ? 'alert' : 'status'}
      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[#EEDFC6] bg-white p-8 text-center"
    >
      {error ? (
        <AlertCircle className="mb-3 text-[#DC2626]" size={28} />
      ) : (
        <Inbox className="mb-3 text-[#B88E4F]" size={28} />
      )}
      <strong className="text-sm text-[#1A1612]">{title}</strong>
      <p className="mb-0 mt-2 max-w-md text-xs leading-5 text-[#7D715E]">
        {description}
      </p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-[#231D15]"
        >
          {action}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export const workspaceButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-4 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] disabled:cursor-wait disabled:opacity-50';
export const workspaceInput =
  'min-h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs text-[#1A1612] outline-[#C59B58] placeholder:text-[#7D715E]';
