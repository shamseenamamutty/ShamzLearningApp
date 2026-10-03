import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/lib/store';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';

export const PIN_PATTERN = /^\d{4}$/;
export const pinInput =
  'min-h-tap w-full rounded-2xl border-2 border-grape-200 bg-white px-4 text-center text-3xl tracking-[0.6em] outline-none focus:border-grape-500';

/**
 * Asked every time "Let's go" is tapped. `unlock` checks the parent PIN; `create` is shown once for an
 * account that has no PIN yet (older accounts, admin sign-in) so every later visit is PIN-checked too.
 */
export function ParentPinDialog({ mode, open, onClose }: { mode: 'unlock' | 'create'; open: boolean; onClose(): void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const unlock = useStore((s) => s.unlockWithPin);
  const setPin = useStore((s) => s.setParentPin);
  const [pin, setPinValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setPinValue('');
    setConfirm('');
    setError(null);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'unlock') {
      if (!(await unlock(pin))) {
        setPinValue('');
        return setError(t('pin.wrong'));
      }
    } else {
      if (!PIN_PATTERN.test(pin)) return setError(t('pin.invalid'));
      if (pin !== confirm) return setError(t('pin.mismatch'));
      await setPin(pin);
    }
    close();
    navigate('/profiles');
  };

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4);

  return (
    <Modal open={open} onClose={close} title={mode === 'unlock' ? t('pin.unlockTitle') : t('pin.createTitle')}>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <p className="text-base font-medium text-ink/70">{mode === 'unlock' ? t('pin.unlockBody') : t('pin.createBody')}</p>
        <label className="flex flex-col gap-1 font-bold">
          {t('pin.label')}
          <input
            className={pinInput}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPinValue(digits(e.target.value))}
          />
        </label>
        {mode === 'create' && (
          <label className="flex flex-col gap-1 font-bold">
            {t('pin.confirm')}
            <input
              className={pinInput}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={confirm}
              onChange={(e) => setConfirm(digits(e.target.value))}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-coral-100 p-3 font-bold text-coral-500">
            {error}
          </p>
        )}
        <Button type="submit" block disabled={pin.length !== 4}>
          {mode === 'unlock' ? t('pin.unlock') : t('pin.save')}
        </Button>
        {mode === 'unlock' && (
          <button
            type="button"
            onClick={() => {
              close();
              navigate('/signin', { state: { resetPin: true } });
            }}
            className="text-center text-sm font-bold text-ink/50 underline underline-offset-2"
          >
            {t('pin.forgot')}
          </button>
        )}
      </form>
    </Modal>
  );
}
