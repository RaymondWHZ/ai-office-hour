export interface FontOption {
  label: string;
  value: string;
  stylesheet?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { label: "Space Grotesk", value: "" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  {
    label: "Inter",
    value: "'Inter', sans-serif",
    stylesheet: "https://fonts.googleapis.com/css2?family=Inter&display=swap",
  },
];

export const getFontStyle = (value: string) => (value ? `font-family: ${value}` : "");
