import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { publishScheduledPost, publishScheduledPostsCron } from "@/inngest/functions/publish-scheduled-posts";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    publishScheduledPostsCron,
    publishScheduledPost
  ],
});