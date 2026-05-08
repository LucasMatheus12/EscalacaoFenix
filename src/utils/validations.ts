import type { DrawConfig } from "../types/team";

export const validatePlayerName = (name: string): string | null => {
  if (!name.trim()) {
    return "Informe o nome do jogador.";
  }

  if (name.trim().length < 2) {
    return "Use ao menos 2 caracteres no nome.";
  }

  return null;
};

export const validatePlayerRating = (rating: number): string | null => {
  const isHalfStep = Number.isInteger(rating * 2);

  if (!rating || rating < 0.5 || rating > 5 || !isHalfStep) {
    return "Selecione uma nota de 0.5 a 5 estrelas.";
  }

  return null;
};

export const validateDrawConfig = (
  config: DrawConfig,
  totalPlayers: number,
): string | null => {
  if (config.teamCount < 2) {
    return "A quantidade de times deve ser de pelo menos 2.";
  }

  if (config.playersPerTeam < 1) {
    return "A quantidade de jogadores por time deve ser maior que 0.";
  }

  const requiredPlayers = config.teamCount * config.playersPerTeam;

  if (totalPlayers < requiredPlayers) {
    return `Faltam ${requiredPlayers - totalPlayers} jogador(es) para esse formato.`;
  }

  return null;
};
