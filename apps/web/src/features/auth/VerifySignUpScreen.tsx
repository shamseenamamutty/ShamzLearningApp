import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/lib/store';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

const codeInput =
  'min-h-tap w-full rounded-2xl border-2 border-grape-200 bg-white px-4 text-center text-3xl tracking-[0.4em] outline-none focus:border-grape-500';
const RESEND_AFTER_S = 30;

/**
 * Sign-up step 2: the parent enters the code Kidzly sent by WhatsApp and the one sent by email.
 * Both must match before the account is created.
 */
export default function VerifySignUpScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pending = useStore((s) => s.pendingSignUp);
  const verify = useStore((s) => s.verifySignUp);
  const resend = useStore((s) => s.resendSignUpCodes);
  const cancel = useStore((s) => s.cancelSignUp);
  const [phoneCode, setPhoneCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!pending) return <Navigate to="/signup" replace />;

  const waitS = Math.max(0, RESEND_AFTER_S - Math.floor((now - Date.parse(pending.sentAt)) / 1000));
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    const res = await verify(phoneCode, emailCode);
    setBusy(false);
    if (res === 'ok') return navigate('/profiles/new', { replace: true });
    if (res === 'wrong-phone') setPhoneCode('');
    if (res === 'wrong-email') setEmailCode('');
    setError(t(`verify.error.${res}`));
  };

  const again = async () => {
    setError(null);
    setPhoneCode('');
    setEmailCode('');
    setNotice((await resend()) ? t('verify.resent') : t('verify.error.network'));
  };

  return (
    <Screen
      title={t('verify.title')}
      back={() => {
        cancel();
        navigate('/signup');
      }}
      bg="bg-grape-50"
    >
      <form onSubmit={submit} className="flex flex-col gap-4 pt-4" noValidate>
        <div className="flex justify-center text-6xl" aria-hidden="true">
          🔐
        </div>
        <p className="text-center text-lg font-medium leading-snug">{t('verify.body', { name: pending.name })}</p>

        {pending.mode === 'demo' && pending.demoCodes && (
          <div data-testid="demo-codes" role="note" className="rounded-2xl border-2 border-dashed border-sun-500 bg-sun-100 p-3 text-center">
            <p className="font-extrabold">🧪 {t('verify.demoTitle')}</p>
            <p className="text-sm font-medium text-ink/70">{t('verify.demoBody')}</p>
            <p className="mt-1 font-bold" dir="ltr">
              💬 <span data-testid="demo-phone-code">{pending.demoCodes.phone}</span> · ✉️{' '}
              <span data-testid="demo-email-code">{pending.demoCodes.email}</span>
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1 font-bold">
          <span>
            💬 {t('verify.whatsapp')} <span dir="ltr" className="font-medium text-ink/60">{pending.maskedPhone}</span>
          </span>
          <input
            className={codeInput}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={phoneCode}
            onChange={(e) => setPhoneCode(digits(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          <span>
            ✉️ {t('verify.email')} <span dir="ltr" className="font-medium text-ink/60">{pending.maskedEmail}</span>
          </span>
          <input
            className={codeInput}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={emailCode}
            onChange={(e) => setEmailCode(digits(e.target.value))}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-2xl bg-coral-100 p-3 font-bold text-coral-500">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-2xl bg-leaf-100 p-3 font-bold text-leaf-600">
            {notice}
          </p>
        )}

        <Button type="submit" block disabled={busy || phoneCode.length !== 6 || emailCode.length !== 6}>
          {t('verify.submit')}
        </Button>
        <Button variant="ghost" block disabled={waitS > 0} onClick={again}>
          {waitS > 0 ? t('verify.resendIn', { s: waitS }) : t('verify.resend')}
        </Button>
      </form>
    </Screen>
  );
}
