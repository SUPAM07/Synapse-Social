export const POST_STATUS = {
  DRAFT: "draft",
  QUEUE: "queue",
  PUBLISHED: "published",
  FAILED: "failed"
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

export const POST_STATUSES = Object.values(POST_STATUS);
