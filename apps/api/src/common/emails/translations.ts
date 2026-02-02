import { SUPPORTED_LANGUAGES, type SupportedLanguages } from "@repo/shared";

export const EMAIL_SUBJECTS_TRANSLATIONS = {
  welcomeEmail: {
    en: "Welcome to our platform!",
    es: "¡Bienvenido a nuestra plataforma!",
  },
  passwordRecoveryEmail: {
    en: "Password recovery",
    es: "Recuperación de contraseña",
  },
  passwordReminderEmail: {
    en: "Account creation reminder",
    es: "Recordatorio de creación de cuenta",
  },
  userInviteEmail: {
    en: "You're invited to the platform!",
    es: "¡Estás invitado a la plataforma!",
  },
  userFirstLoginEmail: {
    en: "First login!",
    es: "¡Primer inicio de sesión!",
  },
  userCourseAssignmentEmail: {
    en: "New course - {{courseName}}",
    es: "Nuevo curso - {{courseName}}",
  },
  userShortInactivityEmail: {
    en: "Continue your course - {{courseName}}",
    es: "Continúa tu curso - {{courseName}}",
  },
  userLongInactivityEmail: {
    en: "Come back to your courses",
    es: "Vuelve a tus cursos",
  },
  userChapterFinishedEmail: {
    en: "Module completed - {{chapterName}}",
    es: "Módulo completado - {{chapterName}}",
  },
  userCourseFinishedEmail: {
    en: "Course completed - {{courseName}}",
    es: "Curso completado - {{courseName}}",
  },
  adminNewUserEmail: {
    en: "A new user has registered on your platform",
    es: "Un nuevo usuario se registró en tu plataforma",
  },
  adminCourseFinishedEmail: {
    en: "A user has completed a course on your platform",
    es: "Un usuario completó un curso en tu plataforma",
  },
} as const;

export type EmailSubjectKey = keyof typeof EMAIL_SUBJECTS_TRANSLATIONS;

export const getEmailSubject = (
  key: EmailSubjectKey,
  language: SupportedLanguages,
  replacements: Record<string, string> = {},
) => {
  const translations = EMAIL_SUBJECTS_TRANSLATIONS[key];
  const template = translations[language] ?? translations[SUPPORTED_LANGUAGES.EN];

  return Object.entries(replacements).reduce((result, [token, value]) => {
    return result.replace(new RegExp(`{{${token}}}`, "g"), value);
  }, template);
};
