import { createClerkClient } from "@clerk/remix/api.server";

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
