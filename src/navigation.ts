export type Screen = "home" | "setup" | "results";

export const SCREEN_PATHS: Record<Screen, string> = {
  home: "/",
  setup: "/escalacao",
  results: "/resultado",
};

export const SCREEN_TITLES: Record<Screen, string> = {
  home: "Escalação Fenix",
  setup: "Escalação",
  results: "Times",
};

export const screenFromPath = (pathname: string): Screen => {
  if (pathname.startsWith("/resultado")) {
    return "results";
  }
  if (pathname.startsWith("/escalacao")) {
    return "setup";
  }
  return "home";
};
