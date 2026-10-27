import { ChevronLeft, Download, Flame, LogOut } from "lucide-react";

interface AppHeaderProps {
  title: string;
  showBack: boolean;
  canInstall: boolean;
  onBack: () => void;
  onInstall: () => void;
  onSignOut?: () => void;
}

export function AppHeader({
  title,
  showBack,
  canInstall,
  onBack,
  onInstall,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      {showBack ? (
        <button type="button" className="icon-btn header-back" onClick={onBack} aria-label="Voltar">
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div className="logo-chip">
          <Flame size={18} />
          <span>Escalação Fenix</span>
        </div>
      )}
      {showBack ? <h1 className="header-title">{title}</h1> : <span className="header-spacer" />}
      <div className="header-actions">
        {canInstall ? (
          <button type="button" className="btn ghost header-install" onClick={onInstall}>
            <Download size={14} /> Instalar
          </button>
        ) : null}
        {onSignOut ? (
          <button type="button" className="icon-btn" onClick={onSignOut} aria-label="Sair">
            <LogOut size={18} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
