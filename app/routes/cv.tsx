import { LoaderFunction, redirect, ActionFunction } from "@remix-run/node";
import { getAuth } from "@clerk/remix/ssr.server";
import { useActionData, useLoaderData } from "@remix-run/react";
import { getUserCV, enhanceCV } from "actions/cv";
import { getUserByClerkId } from "actions/user";
import { json } from "@remix-run/node";
import { useState } from "react";

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  if (!userId) return redirect("/sign-in");

  const user = await getUserByClerkId(userId);
  const userDBId = user?.id;
  if (!userDBId) return redirect("/sign-in");

  try {
    const userCV = await getUserCV(userDBId);

    return { userDBId, userCV };
  } catch (error) {
    return { userDBId, error: (error as Error).message };
  }
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const extractedCV = JSON.parse(formData.get("extractedCV") as string);

  try {
    const result = await enhanceCV(extractedCV);
    return json({ message: "Enhanced CV data received", enhancedCV: result });
  } catch (error) {
    console.error("Error during enhancement of CV:", error);
    throw new Error("Failed to enhance CV");
  }
};

export default function CVRoute() {
  const loaderData = useLoaderData<{
    userDBId: string;
    userCV?: {
      extractedCV: {
        contact: {
          email: string;
          linkedin: string;
          phone: string;
        };
        education: { degree: string; school: string; year: string }[];
        experience: { title: string; company: string; years: string }[];
        name: string;
        skills: string[];
        technologies: string[];
      };
    };
    error?: string;
  }>();

  const actionData = useActionData<{
    message?: string;
    enhancedCV?: {
      contact: {
        email: string;
        linkedin: string;
        phone: string;
      };
      education: { degree: string; school: string; year: string }[];
      experience: { title: string; company: string; years: string }[];
      name: string;
      skills: string[];
      technologies: string[];
    };
  }>();

  const { extractedCV } = loaderData.userCV || {};
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
  };

  return (
    <main className="flex flex-col h-screen items-center justify-start gap-16 p-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Render extracted CV */}
      {extractedCV && !actionData?.enhancedCV && (
        <form method="post" className="mt-4 text-left" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold">Extracted CV</h2>
          <p>
            <strong>Name: </strong>
            {extractedCV.name}
          </p>
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <p>
            <strong>Email:</strong> {extractedCV.contact.email}
          </p>
          <p>
            <strong>LinkedIn:</strong>{" "}
            <a
              href={extractedCV.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {extractedCV.contact.linkedin}
            </a>
          </p>
          <p>
            <strong>Phone:</strong> {extractedCV.contact.phone}
          </p>

          <h3 className="text-lg font-semibold">Skills</h3>
          <ul className="flex flex-wrap gap-2">
            {extractedCV.skills.map((skill, index) => (
              <li key={index}>{skill}, </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold">Technologies</h3>
          <ul className="flex flex-wrap gap-2">
            {extractedCV.technologies.map((tech, index) => (
              <li key={index}>{tech}, </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold">Experience</h3>
          <ul className="flex flex-wrap gap-2">
            {extractedCV.experience.map((exp, index) => (
              <li key={index}>
                <p>
                  <strong>Company:</strong> {exp.company}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold">Education</h3>
          <ul className="flex flex-wrap gap-2">
            {extractedCV.education.map((edu, index) => (
              <li key={index}>
                <p>
                  <strong>Degree:</strong> {edu.degree}
                </p>
              </li>
            ))}
          </ul>

          {/* Hidden input field to send extractedCV data */}
          <input
            type="hidden"
            name="extractedCV"
            value={JSON.stringify(extractedCV)}
          />

          <button
            type="submit"
            className={`mt-4 p-2 bg-blue-500 text-white rounded ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enhancing..." : "Enhance CV"}
          </button>

          {isSubmitting && (
            <div className="mt-4 text-blue-500">
              Enhancing your CV, please wait...
            </div>
          )}
        </form>
      )}

      {/* Display enhanced CV */}
      {actionData?.enhancedCV && (
        <div className="mt-4 text-left">
          <h2 className="text-xl font-bold">Enhanced CV</h2>
          <p>
            <strong>Name: </strong>
            {actionData.enhancedCV.name}
          </p>
          <h3 className="text-lg font-semibold">Contact Information</h3>
          <p>
            <strong>Email:</strong> {actionData.enhancedCV.contact.email}
          </p>
          <p>
            <strong>LinkedIn:</strong>{" "}
            <a
              href={actionData.enhancedCV.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {actionData.enhancedCV.contact.linkedin}
            </a>
          </p>
          <p>
            <strong>Phone:</strong> {actionData.enhancedCV.contact.phone}
          </p>

          <h3 className="text-lg font-semibold">Skills</h3>
          <ul className="flex flex-wrap gap-2">
            {actionData.enhancedCV.skills.map((skill, index) => (
              <li key={index}>{skill}, </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold">Technologies</h3>
          <ul className="flex flex-wrap gap-2">
            {actionData.enhancedCV.technologies.map((tech, index) => (
              <li key={index}>{tech}, </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold">Experience</h3>
          <ul className="flex flex-wrap gap-2">
            {actionData.enhancedCV.experience.map((exp, index) => (
              <li key={index}>
                <p>
                  <strong>Company:</strong> {exp.company}
                </p>
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-semibold">Education</h3>
          <ul className="flex flex-wrap gap-2">
            {actionData.enhancedCV.education.map((edu, index) => (
              <li key={index}>
                <p>
                  <strong>Degree:</strong> {edu.degree}
                </p>
              </li>
            ))}
          </ul>
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
