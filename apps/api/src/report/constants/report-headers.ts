import type { SupportedLanguages } from "@repo/shared";

export interface ReportHeaders {
  studentName: string;
  groupName: string;
  courseName: string;
  lessonCount: string;
  completedLessons: string;
  progressPercentage: string;
  quizResults: string;
}

export const REPORT_HEADERS: Record<SupportedLanguages, ReportHeaders> = {
  en: {
    studentName: "Name",
    groupName: "Groups",
    courseName: "Course Name",
    lessonCount: "Lesson Count",
    completedLessons: "Completed Lessons",
    progressPercentage: "Progress (%)",
    quizResults: "Latest Quiz Attempt Results (%)",
  },
  es: {
    studentName: "Nombre",
    groupName: "Grupos",
    courseName: "Nombre del curso",
    lessonCount: "Cantidad de lecciones",
    completedLessons: "Lecciones completadas",
    progressPercentage: "Progreso (%)",
    quizResults: "Resultados del último intento de quiz (%)",
  },
};
