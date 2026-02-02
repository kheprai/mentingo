import type { DefineRouteFunction, RouteManifest } from "@remix-run/dev/dist/config/routes";

export const routes: (
  defineRoutes: (callback: (defineRoute: DefineRouteFunction) => void) => RouteManifest,
) => RouteManifest | Promise<RouteManifest> = (defineRoutes) => {
  return defineRoutes((route) => {
    route("", "modules/layout.tsx", () => {
      // Landing pages (public) - with explicit paths
      route("", "modules/Landing/Landing.layout.tsx", { id: "landing-layout" }, () => {
        route("", "modules/Landing/pages/Home.page.tsx", { index: true, id: "landing-home" });
        route("workshops", "modules/Landing/pages/Workshops.page.tsx", { id: "landing-workshops" });
        route("consulting", "modules/Landing/pages/Consulting.page.tsx", {
          id: "landing-consulting",
        });
        route("tools", "modules/Landing/pages/Tools.page.tsx", { id: "landing-tools" });
        route("about", "modules/Landing/pages/About.page.tsx", { id: "landing-about" });
        route("contact", "modules/Landing/pages/Contact.page.tsx", { id: "landing-contact" });
      });
      // Auth routes
      route("auth", "modules/Auth/Auth.layout.tsx", () => {
        route("login", "modules/Auth/Login.page.tsx", { index: true });
        route("register", "modules/Auth/Register.page.tsx");
        route("create-new-password", "modules/Auth/CreateNewPassword.page.tsx");
        route("password-recovery", "modules/Auth/PasswordRecovery.page.tsx");
        route("mfa", "modules/Auth/MFA.page.tsx");
      });
      // App routes (with navigation) - these routes stay at root level
      route(
        "courses",
        "modules/Navigation/NavigationWrapper.tsx",
        { id: "courses-wrapper" },
        () => {
          route(
            "",
            "modules/Dashboard/PublicDashboard.layout.tsx",
            { id: "courses-public" },
            () => {
              route("", "modules/Courses/Courses.page.tsx", { index: true });
            },
          );
        },
      );
      route("course", "modules/Navigation/NavigationWrapper.tsx", { id: "course-wrapper" }, () => {
        route("", "modules/Dashboard/PublicDashboard.layout.tsx", { id: "course-public" }, () => {
          route(":id", "modules/Courses/CourseView/CourseView.page.tsx");
        });
        route(":courseId/lesson", "modules/Courses/Lesson/Lesson.layout.tsx", () => {
          route(":lessonId", "modules/Courses/Lesson/Lesson.page.tsx");
        });
      });
      route("qa", "modules/Navigation/NavigationWrapper.tsx", { id: "qa-wrapper" }, () => {
        route("", "modules/Dashboard/PublicDashboard.layout.tsx", { id: "qa-public" }, () => {
          route("", "modules/QA/QA.page.tsx", { index: true });
          route("new", "modules/QA/CreateQA.page.tsx");
          route(":id", "modules/QA/EditQA.page.tsx");
        });
      });
      route(
        "articles",
        "modules/Navigation/NavigationWrapper.tsx",
        { id: "articles-wrapper" },
        () => {
          route(
            "",
            "modules/Dashboard/PublicDashboard.layout.tsx",
            { id: "articles-public" },
            () => {
              route("", "modules/Articles/Articles.page.tsx", { index: true });
              route(":articleId", "modules/Articles/ArticleDetails.page.tsx", {
                id: "article-details",
              });
            },
          );
          route("", "modules/Dashboard/UserDashboard.layout.tsx", { id: "articles-user" }, () => {
            route(":articleId/edit", "modules/Articles/ArticleForm.page.tsx", {
              id: "edit-article",
            });
          });
        },
      );
      route("news", "modules/Navigation/NavigationWrapper.tsx", { id: "news-wrapper" }, () => {
        route("", "modules/Dashboard/PublicDashboard.layout.tsx", { id: "news-public" }, () => {
          route("", "modules/News/News.page.tsx", { index: true });
          route(":newsId", "modules/News/NewsDetails.page.tsx", {
            id: "news-details",
          });
          route(":newsId/edit", "modules/News/NewsForm.page.tsx", {
            id: "edit-news",
          });
          route("add", "modules/News/NewsForm.page.tsx", {
            id: "add-news",
          });
        });
      });
      // User dashboard routes
      route("", "modules/Navigation/NavigationWrapper.tsx", { id: "user-wrapper" }, () => {
        route("", "modules/Dashboard/UserDashboard.layout.tsx", { id: "user-dashboard" }, () => {
          route("progress", "modules/Statistics/Statistics.page.tsx");
          route("settings", "modules/Dashboard/Settings/Settings.page.tsx");
          route("provider-information", "modules/ProviderInformation/ProviderInformation.page.tsx");
          route("announcements", "modules/Announcements/Announcements.page.tsx");
          route("profile/:id", "modules/Profile/Profile.page.tsx");
        });
      });
      // Admin routes
      route("admin", "modules/Navigation/NavigationWrapper.tsx", { id: "admin-wrapper" }, () => {
        route("", "modules/Admin/Admin.layout.tsx", () => {
          route("courses", "modules/Admin/Courses/Courses.page.tsx", {
            index: true,
          });
          route("analytics", "modules/Statistics/Analytics.page.tsx");
          route("envs", "modules/Admin/Envs/Envs.page.tsx");
          route("beta-courses/new", "modules/Admin/AddCourse/AddCourse.tsx");
          route("courses/new-scorm", "modules/Admin/Scorm/CreateNewScormCourse.page.tsx");
          route("beta-courses/:id", "modules/Admin/EditCourse/EditCourse.tsx");
          route("users", "modules/Admin/Users/Users.page.tsx");
          route("users/:id", "modules/Admin/Users/User.page.tsx");
          route("users/new", "modules/Admin/Users/CreateNewUser.page.tsx");
          route("categories", "modules/Admin/Categories/Categories.page.tsx");
          route("categories/:id", "modules/Admin/Categories/Category.page.tsx");
          route("categories/new", "modules/Admin/Categories/CreateNewCategory.page.tsx");
          route("groups", "modules/Admin/Groups/Groups.page.tsx");
          route("groups/new", "modules/Admin/Groups/CreateGroup.page.tsx");
          route("groups/:id", "modules/Admin/Groups/EditGroup.page.tsx");
          route("announcements/new", "modules/Announcements/CreateAnnouncement.page.tsx");
          route("promotion-codes", "modules/Admin/PromotionCodes/PromotionCodes.page.tsx");
          route("promotion-codes/new", "modules/Admin/PromotionCodes/CreatePromotionCode.page.tsx");
          route(
            "promotion-codes/:id",
            "modules/Admin/PromotionCodes/PromotionCodeDetails.page.tsx",
          );
        });
      });

      // Catch-all 404 - MUST BE LAST
      route("*", "modules/Error/NotFound.page.tsx");
    });
  });
};
