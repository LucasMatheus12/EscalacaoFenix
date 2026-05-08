import { Flame } from "lucide-react";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="logo-chip">
        <Flame size={18} />
        <span>Escalação Fenix</span>
      </div>
    </header>
  );
}
