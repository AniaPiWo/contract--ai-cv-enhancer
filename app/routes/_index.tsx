import { MetaFunction, LoaderFunction } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { Link } from "@remix-run/react";
import { createUserFromClerk } from "actions/user";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/remix";

export const meta: MetaFunction = () => {
  return [
    { title: "AI CV Enhancer" },
    {
      name: "description",
      content:
        "AI CV Enhancer is a tool that improves and optimizes your CV using artificial intelligence.",
    },
    {
      name: "keywords",
      content:
        "AI CV Enhancer, CV optimization, resume improvement, artificial intelligence, job application, CV builder",
    },
    { name: "author", content: "PA DreamTeam" },
  ];
};

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  if (userId) {
    await createUserFromClerk(userId);
  }

  return { data: { userId } };
};

export default function Index() {
  return (
    <main className="flex flex-col h-screen items-center justify-start gap-16 p-4">
      <div>
        <div className="flex gap-4">
          {" "}
          <SignedIn>
            <p>You are signed in!</p>
            <div>
              <UserButton />
            </div>
            <div>
              <SignOutButton />
            </div>
          </SignedIn>
          <SignedOut>
            <p>You are signed out</p>
            <div>
              <SignInButton />
            </div>
            <div>
              <SignUpButton />
            </div>
          </SignedOut>
          <Link to="/upload">
            <button
              type="submit"
              className="mt-4 p-2 bg-blue-500 text-white rounded"
            >
              Upload CV
            </button>
          </Link>
        </div>
      </div>
      LANDING
    </main>
  );
}

//const resources = [];
