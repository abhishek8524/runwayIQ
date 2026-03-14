export default function TopBar({ businessName }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        <span className="text-lg font-semibold text-text">RunwayIQ</span>
      </div>
      {businessName && (
        <span className="text-sm text-text-muted">{businessName}</span>
      )}
    </header>
  );
}
