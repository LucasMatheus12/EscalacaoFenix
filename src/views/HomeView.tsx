import { ArrowRight, Cloud, Scale, Shuffle } from "lucide-react";
import { InstallBanner } from "../components/InstallBanner";

interface HomeViewProps {
  onStart: () => void;
  canInstall: boolean;
  iosHint: boolean;
  onInstall: () => void;
}

export function HomeView({ onStart, canInstall, iosHint, onInstall }: HomeViewProps) {
  return (
    <section className="home-view card hero-card">
      <div className="hero-image-wrap">
        <img src="/fenix-hero.png" alt="Ilustracao de fenix em chamas" className="hero-image" />
      </div>
      <p className="hero-kicker">Sorteio inteligente</p>
      <h1>Escalação Fenix</h1>
      <p className="hero-copy">
        Monte times equilibrados por estrela, separe quadra e campo, e use no celular como
        aplicativo.
      </p>
      <ul className="hero-points">
        <li>
          <Scale size={16} /> Equilíbrio por nota
        </li>
        <li>
          <Shuffle size={16} /> Quadra e campo
        </li>
        <li>
          <Cloud size={16} /> Salvo na nuvem
        </li>
      </ul>
      <button type="button" className="btn primary hero-btn" onClick={onStart}>
        Começar escalação <ArrowRight size={16} />
      </button>
      <InstallBanner canInstall={canInstall} iosHint={iosHint} onInstall={onInstall} />
    </section>
  );
}
