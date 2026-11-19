import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";

const lessonRoot = new URL(self.registration.scope);
const entry = new URL("index.html", lessonRoot);

// Register first so Workbox's precache route only handles the remaining assets.
registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" &&
    url.origin === lessonRoot.origin &&
    (url.pathname === lessonRoot.pathname || url.pathname === entry.pathname),
  async ({ request }) => {
    try {
      const response = await fetch(request, { cache: "no-cache" });
      if (response.status < 500) return response;
      return (await matchPrecache(entry.href)) ?? response;
    } catch (error) {
      const cached = await matchPrecache(entry.href);
      if (cached) return cached;
      throw error;
    }
  },
);

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();
