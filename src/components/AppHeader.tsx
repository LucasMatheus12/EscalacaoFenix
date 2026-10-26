import { ChevronLeft, Download, Flame } from "lucide-react";

interface AppHeaderProps {
  title: string;
  showBack: boolean;
  canInstall: boolean;
  onBack: () => void;
  onInstall: () => void;
}

export function AppHeader({ title, showBack, canInstall, onBack, onInstall }: AppHeaderProps) {
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
      {canInstall ? (
        <button type="button" className="btn ghost header-install" onClick={onInstall}>
          <Download size={14} /> Instalar
        </button>
      ) : (
        <span className="header-spacer" />
      )}
    </header>
  );
}
