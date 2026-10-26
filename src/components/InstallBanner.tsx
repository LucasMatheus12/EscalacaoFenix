import { Download, Share } from "lucide-react";

interface InstallBannerProps {
  canInstall: boolean;
  iosHint: boolean;
  onInstall: () => void;
}

export function InstallBanner({ canInstall, iosHint, onInstall }: InstallBannerProps) {
  if (!canInstall && !iosHint) {
    return null;
  }

  if (iosHint && !canInstall) {
    return (
      <p className="install-banner muted">
        <Share size={16} /> No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
      </p>
    );
  }

  return (
    <button type="button" className="btn secondary install-banner-btn" onClick={onInstall}>
      <Download size={16} /> Instalar aplicativo
    </button>
  );
}
