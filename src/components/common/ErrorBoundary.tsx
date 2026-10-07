import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: unknown;
  componentStack: string | null;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.stack || error.message;
  if (typeof error === 'string') return error;
  try {
    const serialized = JSON.stringify(error, null, 2);
    if (serialized) return serialized;
  } catch { /* Some thrown values contain circular references. */ }
  try {
    return String(error);
  } catch { /* Objects without a primitive conversion can reach React.lazy. */ }
  return '[Không thể hiển thị đối tượng lỗi]';
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    componentStack: null,
  };

  public static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error, componentStack: null };
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    const errorStr = describeError(error);
    console.error(
      'ErrorBoundary caught an unhandled error:',
      errorStr,
      errorInfo.componentStack || '',
    );
    this.setState({ componentStack: errorInfo.componentStack || null });

    // Tự động tải lại trang nếu gặp lỗi dynamic import module do Vite reload / kết nối gián đoạn
    const isChunkError =
      errorStr.includes('Failed to fetch dynamically imported module') ||
      errorStr.includes('Loading chunk') ||
      errorStr.includes('ERR_CONNECTION_REFUSED');

    if (isChunkError) {
      const lastReload = Number(sessionStorage.getItem('scanms_chunk_last_reload') || '0');
      const now = Date.now();
      // Chỉ auto reload nếu cách lần trước > 10 giây để tránh reload loop
      if (now - lastReload > 10000) {
        sessionStorage.setItem('scanms_chunk_last_reload', String(now));
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] w-full flex items-center justify-center p-6 bg-[#FAF8F5]">
          <div className="max-w-md w-full rounded-2xl border border-[#EAE4D7] bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF5EB] text-[#C59B58] border border-[#EEDFC6]">
              <AlertCircle className="h-7 w-7 text-[#B88E4F]" />
            </div>
            <h2 className="mb-2 text-lg sm:text-xl font-bold text-[#1A1612]">
              Đã xảy ra sự cố khi tải trang
            </h2>
            <p className="mb-6 text-xs sm:text-sm text-[#7D715E] leading-relaxed">
              Trang web gặp gián đoạn tạm thời trong quá trình hiển thị dữ liệu. Vui lòng tải lại hoặc quay về trang chủ.
            </p>

            {import.meta.env.DEV && this.state.error != null && (
              <details className="mb-5 text-left text-xs text-[#7D715E]">
                <summary className="cursor-pointer">Chi tiết lỗi để báo cho nhóm phát triển</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-[#FAF8F5] p-3">
                  {describeError(this.state.error)}
                  {this.state.componentStack ? `\n\nComponent stack:${this.state.componentStack}` : ''}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null, componentStack: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#231D15] hover:bg-[#B88E4F] transition active:scale-95 cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null, componentStack: null });
                  window.location.href = '/marketplace';
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#1A1612] hover:bg-[#F3EFE6] transition active:scale-95 cursor-pointer"
              >
                <Home className="h-4 w-4 text-[#7D715E]" />
                <span>Về Sàn SCANMS</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
