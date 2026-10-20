import { ArrowRight, ChevronDown, HelpCircle, KeyRound, Loader2, Mail } from 'lucide-react';
import './CustomerSecurityMethod.css';

interface CustomerSecurityMethodProps {
  email: string;
  sending: boolean;
  onSendCode: () => void;
  onUsePassword: () => void;
}

export function CustomerSecurityMethod({ email, sending, onSendCode, onUsePassword }: CustomerSecurityMethodProps) {
  return (
    <div className="customer-security-method">
      <div className="customer-security-method-layout">
        <section className="customer-security-method-card" aria-labelledby="security-method-title">
          <header className="customer-security-method-heading">
            <span className="customer-security-method-icon" aria-hidden="true"><Mail size={20} /></span>
            <div>
              <h3 id="security-method-title">Xác minh qua email</h3>
              <p>Nhận mã xác minh để thiết lập mật khẩu mới.</p>
            </div>
          </header>
          <div className="customer-security-method-body">
            <div className="customer-security-email">
              <span>Email nhận mã</span>
              <strong>{email}</strong>
            </div>
            <button type="button" className="customer-security-send-code" onClick={onSendCode} disabled={sending} aria-busy={sending}>
              {sending ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
              <span>{sending ? 'Đang gửi mã xác minh…' : 'Gửi mã xác minh'}</span>
            </button>
          </div>
          <footer className="customer-security-method-footer">
            <button type="button" className="customer-security-use-password" onClick={onUsePassword}>
              <KeyRound size={16} aria-hidden="true" />
              <span>Đổi bằng mật khẩu hiện tại</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </footer>
        </section>

        <aside className="customer-security-help" aria-labelledby="security-help-title">
          <h3 id="security-help-title"><HelpCircle size={17} aria-hidden="true" />Trợ giúp xác minh</h3>
          <details>
            <summary><span>Vì sao cần xác minh?</span><ChevronDown size={14} aria-hidden="true" /></summary>
            <p>SCANMS xác minh email trước khi cho phép thiết lập mật khẩu mới để bảo vệ tài khoản của bạn.</p>
          </details>
          <details>
            <summary><span>Chưa nhận được email?</span><ChevronDown size={14} aria-hidden="true" /></summary>
            <p>Kiểm tra thư mục Spam. Nếu vẫn chưa nhận được, hãy liên hệ CSKH qua Chat hỗ trợ.</p>
          </details>
        </aside>
      </div>
    </div>
  );
}
