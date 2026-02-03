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
        route("courses", "modules/Landing/pages/Courses.page.tsx", { id: "landing-courses" });
        route("courses/:slug", "modules/Landing/pages/CourseDetail.page.tsx", {
          id: "landing-course-detail",
        });
        route("news", "modules/Landing/pages/News.page.tsx", { id: "landing-news" });
        route("news/:newsId", "modules/Landing/pages/NewsDetail.page.tsx", {
          id: "landing-news-detail",
        });
        route("resources", "modules/Landing/pages/Resources.page.tsx", { id: "landing-resources" });
        route("resources/:articleId", "modules/Landing/pages/ResourceDetail.page.tsx", {
          id: "landing-resource-detail",
        });
        route("faq", "modules/Landing/pages/FAQ.page.tsx", { id: "landing-faq" });
        route("about", "modules/Landing/pages/About.page.tsx", { id: "landing-about" });
        route("contact", "modules/Landing/pages/Contact.page.tsx", { id: "landing-contact" });
        route("cart", "modules/Cart/Cart.page.tsx", { id: "cart" });
        route("checkout", "modules/Cart/Checkout.page.tsx", { id: "checkout" });
        route("orders/:orderId", "modules/Cart/OrderConfirmation.page.tsx", {
          id: "order-confirmation",
        });
      });
      // Auth routes
      route("auth", "modules/Auth/Auth.layout.tsx", () => {
        route("login", "modules/Auth/Login.page.tsx", { index: true });
        route("register", "modules/Auth/Register.page.tsx");
      });
      // App routes (with navigation) - these routes stay at root level
      route(
        "library",
        "modules/Navigation/NavigationWrapper.tsx",
        { id: "library-wrapper" },
        () => {
          route(
            "",
            "modules/Dashboard/PublicDashboard.layout.tsx",
            { id: "library-public" },
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
          route("news", "modules/News/News.page.tsx", { id: "admin-news" });
          route("news/add", "modules/News/NewsForm.page.tsx", { id: "admin-add-news" });
          route("news/:newsId", "modules/News/NewsDetails.page.tsx", { id: "admin-news-details" });
          route("news/:newsId/edit", "modules/News/NewsForm.page.tsx", { id: "admin-edit-news" });
        });
      });

      // Catch-all 404 - MUST BE LAST
      route("*", "modules/Error/NotFound.page.tsx");
    });
  });
};
