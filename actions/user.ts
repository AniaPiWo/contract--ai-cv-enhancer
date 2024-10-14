import { clerk } from "lib/clerk";
import { prisma } from "lib/prisma";

export async function createUserFromClerk(clerkUserId: string) {
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
  const name =
    clerkUser.firstName && clerkUser.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : clerkUser.firstName || clerkUser.lastName || "No name provided";

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUserId },
    update: {
      name,
    },
    create: {
      email,
      clerkId: clerkUserId,
      name,
    },
  });

  //console.log("User created or updated from Clerk:", user);
  return user;
}

export async function getUserByClerkId(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    console.log(`User with Clerk ID: ${clerkUserId} not found.`);
    return null;
  }

  //console.log("User found:", user);
  return user;
}
