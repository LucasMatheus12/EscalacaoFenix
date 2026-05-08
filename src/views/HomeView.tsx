import { ArrowRight } from "lucide-react";

interface HomeViewProps {
  onStart: () => void;
}

export function HomeView({ onStart }: HomeViewProps) {
  const phoenixImage = "/fenix-hero.png";

  return (
    <section className="home-view card hero-card">
      <div className="hero-image-wrap">
        <img src={phoenixImage} alt="Ilustracao de fenix em chamas" className="hero-image" />
      </div>
      <h1>Escalação Fenix</h1>
      <p>
        Monte times de futebol equilibrados com base em estrelas de cada jogador e sorteio
        inteligente.
      </p>
      <button type="button" className="btn primary hero-btn" onClick={onStart}>
        Comecar escalacao <ArrowRight size={16} />
      </button>
    </section>
  );
}
