import { House, Trophy, Users } from "lucide-react";
import type { Screen } from "../navigation";

interface BottomNavProps {
  screen: Screen;
  hasResult: boolean;
  onNavigate: (screen: Screen) => void;
}

const items: { id: Screen; label: string; icon: typeof House }[] = [
  { id: "home", label: "Início", icon: House },
  { id: "setup", label: "Escalação", icon: Users },
  { id: "results", label: "Times", icon: Trophy },
];

export function BottomNav({ screen, hasResult, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Navegacao principal">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = screen === item.id;
          const disabled = item.id === "results" && !hasResult;
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
              disabled={disabled}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
