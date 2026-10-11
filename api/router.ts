import { createRouter, publicQuery } from "./middleware";
import { detectorRouter } from "./detector/router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  detector: detectorRouter,
});

export type AppRouter = typeof appRouter;
