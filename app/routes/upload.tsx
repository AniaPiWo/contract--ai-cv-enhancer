/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoaderFunction, redirect, ActionFunction } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { useActionData, useLoaderData } from "@remix-run/react";
import { saveCV, cvToJSON, getUserCV } from "actions/cv";
import { getUserByClerkId } from "actions/user";
import { prisma } from "lib/prisma";
import crypto from "crypto";
import { useState } from "react";

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  if (!userId) return redirect("/sign-in");

  const user = await getUserByClerkId(userId);
  const userDBId = user?.id;
  if (!userDBId) return redirect("/sign-in");

  try {
    const userCV = await getUserCV(userDBId);
    if (!userCV) {
      return { userDBId, userCV: null };
    }
    return { userDBId, userCV };
  } catch (error) {
    return { userDBId, error: (error as Error).message };
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("textInput") as string;
  const userId = formData.get("userDBId") as string;

  function computeFileHash(buffer: Buffer): string {
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    return hash.digest("hex");
  }

  if (!file) {
    return { message: "No file uploaded" };
  }

  if (!userId) {
    return { message: "User ID is missing." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cvHash = computeFileHash(buffer);
    const existingCV = await prisma.cV.findUnique({
      where: {
        cvHash,
      },
    });

    if (existingCV) {
      return {
        message: `The file ${file.name} has already been uploaded.`,
        cvId: existingCV.id,
      };
    }

    const extractedCV = await cvToJSON(buffer);

    const savedCV = await saveCV({
      fileBuffer: buffer,
      userId,
      name,
      fileName: file.name,
      mimeType: file.type,
      extractedCV: extractedCV,
    });

    return redirect(`/cv`);
  } catch (error) {
    return { message: `Failed to upload file`, error };
  }
};

export default function DashboardRoute() {
  const actionData = useActionData<{
    message: string;
    structuredData?: Record<string, unknown>;
  }>();
  const loaderData = useLoaderData<{
    userDBId: string;
    userCV?: object | null;
    error?: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
  };

  return (
    <main className="flex flex-col h-screen items-center justify-start gap-16 p-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <form
        className="flex flex-col gap-4"
        method="post"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
      >
        {/* the hidden input field to pass the userDBId to the action */}
        <input type="hidden" name="userDBId" value={loaderData.userDBId} />
        <input type="file" name="file" required />

        <input
          type="hidden"
          id="textInput"
          name="textInput"
          placeholder="Give your CV a name, e.g., 'original CV'"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="mt-4 p-2 bg-blue-500 text-white rounded"
          disabled={isLoading}
        >
          {isLoading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      {actionData && (
        <div className="mt-4 text-green-500">
          <p>{actionData.message}</p>
        </div>
      )}

      {loaderData.error && (
        <div className="mt-4 text-red-500">
          <p>{loaderData.error}</p>
        </div>
      )}
    </main>
  );
}
