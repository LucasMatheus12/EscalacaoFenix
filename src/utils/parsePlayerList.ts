export interface ParsedPlayer {
  name: string;
  position: string;
}

const stripDecorations = (value: string): string =>
  value
    .replace(/[*_~`]/g, "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

const isSkippableHeader = (line: string): boolean => {
  const plain = stripDecorations(line).toLowerCase();
  if (!plain) {
    return true;
  }

  return (
    /^(jogo|chegue|valor|lista|escalacao|escalação)/.test(plain) ||
    /r\$/.test(plain) ||
    /hor[aá]rio/.test(plain)
  );
};

const isGoalkeeperHeader = (line: string): boolean =>
  /goleiro/i.test(stripDecorations(line));

const isReserveHeader = (line: string): boolean =>
  /reserv/i.test(stripDecorations(line));

const numberedName = (line: string): string | null => {
  const match = stripDecorations(line).match(/^\d+\s*[-–—.)]+\s*(.*)$/);
  if (!match) {
    return null;
  }

  const name = match[1].replace(/^[-–—.)\s]+/, "").trim();
  return name.length >= 2 ? name : null;
};

export const parsePlayerList = (raw: string): ParsedPlayer[] => {
  const seen = new Set<string>();
  const players: ParsedPlayer[] = [];
  let section: "lineup" | "goalkeeper" | "reserve" = "lineup";

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (isGoalkeeperHeader(line)) {
      section = "goalkeeper";
      continue;
    }

    if (isReserveHeader(line)) {
      section = "reserve";
      continue;
    }

    if (isSkippableHeader(line)) {
      continue;
    }

    const name = numberedName(line);
    if (!name) {
      continue;
    }

    const key = name.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    players.push({
      name,
      position: section === "goalkeeper" ? "Goleiro" : section === "reserve" ? "Reserva" : "",
    });
  }

  return players;
};
