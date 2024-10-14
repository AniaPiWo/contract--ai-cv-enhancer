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

  if (!extractedCV) {
    return json({ message: "No CV data received" });
  }

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

  const renderCV = (cv: {
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
  }) => (
    <div className="mt-4 text-left">
      <p>
        <strong>Name: </strong>
        {cv.name}
      </p>
      <h3 className="text-lg font-semibold">Contact Information</h3>
      <p>
        <strong>Email:</strong> {cv.contact.email}
      </p>
      <p>
        <strong>LinkedIn:</strong>{" "}
        <a href={cv.contact.linkedin} target="_blank" rel="noopener noreferrer">
          {cv.contact.linkedin}
        </a>
      </p>
      <p>
        <strong>Phone:</strong> {cv.contact.phone}
      </p>

      <h3 className="text-lg font-semibold">Skills</h3>
      <ul className="flex flex-wrap gap-2">
        {cv.skills.map((skill, index) => (
          <li key={index}>{skill}, </li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold">Technologies</h3>
      <ul className="flex flex-wrap gap-2">
        {cv.technologies.map((tech, index) => (
          <li key={index}>{tech}, </li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold">Experience</h3>
      <ul className="flex flex-wrap gap-2">
        {cv.experience.map((exp, index) => (
          <li key={index}>
            <p>
              <strong>Title:</strong> {exp.title}
            </p>
            <p>
              <strong>Company:</strong> {exp.company}
            </p>
            <p>
              <strong>Years:</strong> {exp.years}
            </p>
          </li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold">Education</h3>
      <ul className="flex flex-wrap gap-2">
        {cv.education.map((edu, index) => (
          <li key={index}>
            <p>
              <strong>Degree:</strong> {edu.degree}
            </p>
            <p>
              <strong>School:</strong> {edu.school}
            </p>
            <p>
              <strong>Year:</strong> {edu.year}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <main className="flex flex-col h-screen items-center justify-start gap-16 p-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Render extracted CV */}
      {extractedCV && !actionData?.enhancedCV && (
        <form method="post" className="mt-4 text-left" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold">Extracted CV</h2>
          {renderCV(extractedCV)}

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
          {renderCV(actionData.enhancedCV)}
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
