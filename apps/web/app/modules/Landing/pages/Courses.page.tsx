import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useReducer } from "react";
import { useTranslation } from "react-i18next";

import { useAvailableCourses } from "~/api/queries/useAvailableCourses";
import { useCategories } from "~/api/queries/useCategories";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { studentCoursesQueryOptions } from "~/api/queries/useStudentCourses";
import { Skeleton } from "~/components/ui/skeleton";
import { useLanguageStore } from "~/modules/Dashboard/Settings/Language/LanguageStore";

import { CoursesFilterBar, type FilterState } from "../components/CoursesFilterBar";
import { PublicCourseCard } from "../components/PublicCourseCard";

type FilterAction =
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "SET_PRICE_FILTER"; payload: FilterState["priceFilter"] }
  | { type: "SET_SORT"; payload: FilterState["sort"] }
  | { type: "CLEAR_FILTERS" };

const initialFilters: FilterState = {
  searchQuery: "",
  category: "",
  priceFilter: "all",
  sort: "relevance",
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_PRICE_FILTER":
      return { ...state, priceFilter: action.payload };
    case "SET_SORT":
      return { ...state, sort: action.payload };
    case "CLEAR_FILTERS":
      return initialFilters;
    default:
      return state;
  }
}

export default function CoursesPage() {
  const { t } = useTranslation();
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);
  const { language } = useLanguageStore();

  // Fetch current user (null if not logged in)
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  // Fetch categories for the filter dropdown
  const { data: categories } = useCategories({ archived: false });

  // Fetch available courses with server-side filtering
  const { data: availableCourses, isLoading: isLoadingCourses } = useAvailableCourses({
    language,
    ...(filters.searchQuery && { searchQuery: filters.searchQuery }),
    ...(filters.category && { category: filters.category }),
  });

  // Fetch student courses (only if logged in)
  const { data: studentCourses } = useQuery(
    studentCoursesQueryOptions({ language }, { enabled: isLoggedIn }),
  );

  // Create a set of enrolled course IDs for quick lookup
  const enrolledCourseIds = useMemo(() => {
    if (!studentCourses) return new Set<string>();
    return new Set(studentCourses.filter((c) => c.enrolled).map((c) => c.id));
  }, [studentCourses]);

  // Apply client-side filtering (price) and sorting
  const filteredCourses = useMemo(() => {
    if (!availableCourses) return [];

    let result = [...availableCourses];

    // Price filtering (client-side since API doesn't support it)
    if (filters.priceFilter === "free") {
      result = result.filter((c) => c.priceInCents === 0);
    } else if (filters.priceFilter === "paid") {
      result = result.filter((c) => c.priceInCents > 0);
    }

    // Client-side sorting
    if (filters.sort === "price-asc") {
      result.sort((a, b) => a.priceInCents - b.priceInCents);
    } else if (filters.sort === "price-desc") {
      result.sort((a, b) => b.priceInCents - a.priceInCents);
    } else if (filters.sort === "newest") {
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [availableCourses, filters.priceFilter, filters.sort]);

  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(name: K, value: FilterState[K]) => {
      switch (name) {
        case "searchQuery":
          dispatch({ type: "SET_SEARCH_QUERY", payload: value as string });
          break;
        case "category":
          dispatch({ type: "SET_CATEGORY", payload: value as string });
          break;
        case "priceFilter":
          dispatch({ type: "SET_PRICE_FILTER", payload: value as FilterState["priceFilter"] });
          break;
        case "sort":
          dispatch({ type: "SET_SORT", payload: value as FilterState["sort"] });
          break;
      }
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    dispatch({ type: "CLEAR_FILTERS" });
  }, []);

  const isLoading = isLoadingCourses || isLoadingUser;

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t("landing.courses.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            {t("landing.courses.description")}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          <CoursesFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            categories={categories}
            isLoading={isLoading}
            resultsCount={filteredCourses.length}
          />
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => (
              <PublicCourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledCourseIds.has(course.id)}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <Skeleton className="aspect-video w-full" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mt-4 h-10 w-full" />
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-neutral-100 p-4">
        <svg
          className="size-8 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-neutral-900">
        {t("landing.courses.results.noResults")}
      </h3>
      <p className="mt-1 text-sm text-neutral-500">
        {t("landing.courses.results.noResultsDescription")}
      </p>
    </div>
  );
}
