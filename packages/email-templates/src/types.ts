export type Language = "en" | "es";

export type DefaultEmailSettings = {
  primaryColor: string;
  language: Language;
};

export type EmailContent = {
  heading: string;
  paragraphs: string[];
  buttonText: string;
};

export type BaseEmailSettings = Pick<DefaultEmailSettings, "primaryColor">;
