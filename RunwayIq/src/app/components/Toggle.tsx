interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[17px] w-[30px] items-center rounded-full transition-colors"
      style={{ backgroundColor: checked ? '#059669' : '#9CA3AF' }}
    >
      <span
        className="inline-block h-[13px] w-[13px] transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? 'translateX(15px)' : 'translateX(2px)' }}
      />
    </button>
  );
}
