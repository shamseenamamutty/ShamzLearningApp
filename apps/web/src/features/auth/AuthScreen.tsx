import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAdminLogin, useStore } from '@/lib/store';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { Screen } from '@/ui/Screen';
import { PIN_PATTERN, ParentPinDialog, pinInput } from './ParentPinDialog';
import { DIAL_CODES, toE164 } from './phone';

const input = 'min-h-tap w-full rounded-2xl border-2 border-grape-200 bg-white px-4 text-lg outline-none focus:border-grape-500';

/** Screen 2 — Parent sign-up / sign-in with the consent step (FR-01, COPPA/GDPR-K consent). */
export default function AuthScreen({ mode }: { mode: 'signup' | 'signin' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  /** Arrived from "Forgot PIN?" — after the password check, ask for a new PIN instead of going straight in. */
  const resetPin = (location.state as { resetPin?: boolean } | null)?.resetPin === true;
  const startSignUp = useStore((s) => s.startSignUp);
  const signIn = useStore((s) => s.signIn);
  const adminSignIn = useStore((s) => s.adminSignIn);
  const [name, setName] = useState('');
  const [dial, setDial] = useState<string>(DIAL_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [newPinOpen, setNewPinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const submitAdmin = async (e: FormEvent) => {
    e.preventDefault();
    if (!(await isAdminLogin(adminEmail, adminPassword))) return setAdminError(t('auth.wrongCredentials'));
    adminSignIn();
    navigate('/profiles');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (!name.trim()) return setError(t('signup.nameRequired'));
      const fullPhone = toE164(dial, phone);
      if (!fullPhone) return setError(t('signup.phoneInvalid'));
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !consent) return setError(t('auth.invalid'));
      if (!PIN_PATTERN.test(pin)) return setError(t('pin.invalid'));
      if (pin !== pinConfirm) return setError(t('pin.mismatch'));
      setSending(true);
      const res = await startSignUp({ name, email, phone: fullPhone, password, pin });
      setSending(false);
      if (!res.ok) return setError(t(`signup.error.${res.error}`));
      navigate('/signup/verify');
    } else {
      if (!(await signIn(email, password))) return setError(t('auth.wrongCredentials'));
      if (resetPin) return setNewPinOpen(true);
      navigate('/profiles');
    }
  };

  return (
    <Screen title={mode === 'signup' ? t('auth.signUpTitle') : t('auth.signInTitle')} back="/" bg="bg-grape-50">
      <form onSubmit={submit} className="flex flex-col gap-4 pt-4" noValidate>
        <div className="mb-2 flex justify-center text-7xl">👨‍👩‍👧</div>
        {mode === 'signup' && (
          <>
            <label className="flex flex-col gap-1 font-bold">
              {t('signup.name')}
              <input className={input} type="text" autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="flex flex-col gap-1 font-bold">
              <label htmlFor="signup-phone">{t('signup.phone')}</label>
              <div dir="ltr" className="flex gap-2">
                <select
                  aria-label={t('signup.countryCode')}
                  className="min-h-tap w-28 shrink-0 rounded-2xl border-2 border-grape-200 bg-white px-2 text-lg outline-none focus:border-grape-500"
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                >
                  {DIAL_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  id="signup-phone"
                  className={input}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <span className="text-sm font-medium text-ink/60">💬 {t('signup.phoneHint')}</span>
            </div>
          </>
        )}
        <label className="flex flex-col gap-1 font-bold">
          {t('auth.email')}
          <input className={input} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 font-bold">
          {t('auth.password')}
          <input
            className={input}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === 'signup' && <span className="text-sm font-medium text-ink/60">{t('auth.passwordHint')}</span>}
        </label>
        {mode === 'signup' && (
          <fieldset className="flex flex-col gap-2 rounded-2xl bg-white p-4">
            <legend className="sr-only">{t('signup.pinTitle')}</legend>
            <p className="font-bold">🔢 {t('signup.pinTitle')}</p>
            <p className="text-sm font-medium text-ink/60">{t('signup.pinHint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-bold">
                {t('pin.label')}
                <input
                  className={pinInput}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-bold">
                {t('pin.confirm')}
                <input
                  className={pinInput}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </label>
            </div>
          </fieldset>
        )}
        {mode === 'signup' && (
          <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-base font-medium leading-snug">
            <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-grape-600" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>🛡️ {t('auth.consent')}</span>
          </label>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-coral-100 p-3 font-bold text-coral-500">
            {error}
          </p>
        )}
        <Button type="submit" block disabled={sending}>
          {mode === 'signup' ? (sending ? t('signup.sending') : t('signup.sendCodes')) : t('auth.signIn')}
        </Button>
        <Button variant="ghost" block onClick={() => navigate(mode === 'signup' ? '/signin' : '/signup')}>
          {mode === 'signup' ? t('auth.haveAccount') : t('auth.noAccount')}
        </Button>
      </form>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setAdminOpen(true)}
        className="mt-2 w-full text-center text-sm font-bold text-ink/40 underline underline-offset-2"
      >
        🛠️ {t('auth.adminAccess')}
      </button>
      <Modal
        open={adminOpen}
        title={`🛠️ ${t('auth.adminTitle')}`}
        onClose={() => {
          setAdminOpen(false);
          setAdminPassword('');
          setAdminError(null);
        }}
      >
        <form onSubmit={submitAdmin} className="flex flex-col gap-3" noValidate>
          <label className="flex flex-col gap-1 font-bold">
            {t('enroll.adminEmail')}
            <input className={input} type="email" autoComplete="username" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 font-bold">
            {t('enroll.adminPassword')}
            <input className={input} type="password" autoComplete="current-password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
          </label>
          {adminError && (
            <p role="alert" className="rounded-2xl bg-coral-100 p-3 font-bold text-coral-500">
              {adminError}
            </p>
          )}
          <Button type="submit" block>
            {t('auth.adminSignIn')}
          </Button>
        </form>
      </Modal>
      <ParentPinDialog mode="create" open={newPinOpen} onClose={() => setNewPinOpen(false)} />
      {mode === 'signin' && (
        <>
          <button
            type="button"
            onClick={() => navigate('/signin/pin')}
            className="mt-2 w-full text-center text-sm font-bold text-ink/40 underline underline-offset-2"
          >
            🔑 {t('auth.pinSignIn')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/enroll')}
            className="mt-2 w-full text-center text-sm font-bold text-ink/40 underline underline-offset-2"
          >
            🧑‍🤝‍🧑 {t('auth.enroll')}
          </button>
        </>
      )}
    </Screen>
  );
}
