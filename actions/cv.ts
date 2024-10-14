import { z } from "zod";
import { prisma } from "lib/prisma";
import { openai } from "lib/openai";
import { generateObject } from "ai";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export const CVSchema = z.object({
  name: z.string(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    portfolio: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  languages: z.array(z.string()),
  bio: z.string().optional(),
  skills: z.array(z.string()),
  technologies: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      position: z.string(),
      duration: z.string(),
      description: z.string(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      duration: z.string(),
    })
  ),
});

//poprawic prompta
export const cvToJSON = async (buffer: Buffer) => {
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: CVSchema,
      prompt: "Extract the text from the attached CV." + buffer.toString(),
    });
    return result.object;
  } catch (error) {
    console.error("Błąd podczas ekstrakcji tekstu z CV:", error);
    throw new Error("Nie udało się wyekstrahować tekstu z dostarczonego CV.");
  }
};

const computeFileHash = (buffer: Buffer): string => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

type SaveCVParams = {
  fileBuffer: Buffer;
  name: string;
  fileName: string;
  mimeType: string;
  userId: string;
  extractedCV: object;
};

export async function saveCV({
  fileBuffer,
  name,
  fileName,
  mimeType,
  userId,
  extractedCV,
}: SaveCVParams) {
  try {
    const cvHash = computeFileHash(fileBuffer);

    const savedCV = await prisma.cV.create({
      data: {
        cv: fileBuffer,
        name,
        fileName,
        mimeType,
        userId,
        cvHash,
        extractedCV: extractedCV as Prisma.JsonObject,
      },
    });

    console.log("successfully saved CV");
    return savedCV;
  } catch (error) {
    console.error("Error saving CV:", error);
    throw new Error(`Failed to save CV - ${error}`);
  }
}

export async function getUserCV(userId: string) {
  try {
    const userCV = await prisma.cV.findFirst({
      where: {
        userId,
      },
    });

    if (!userCV) {
      throw new Error("CV not found for the provided user ID.");
    }

    //console.log("Successfully retrieved CV", userCV);
    return userCV;
  } catch (error) {
    return;
  }
}

export async function enhanceCV(extractedCV: object) {
  try {
    // Konwersja extractedCV do czytelnego formatu (np. JSON -> tekst)
    const extractedText = JSON.stringify(extractedCV, null, 2);

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: CVSchema,
      prompt: `
        You are an outstanding recruitment specialist and on a daily basis you help people looking for jobs.
        Your task is to reconstruct the data from the following CV and create an attractive new version for potential employers:
        ${extractedText}
        
        - Improve the structure, but do not add any fictional information.
        - Add a professional bio if missing.
        - Ensure that the CV is ATS-friendly.
        - Organize sections (professional summary, skills, work experience, education, and CV clause).
        - Ensure each section has an appropriate heading and check for spelling errors.
        - add interesting bio if missing 
      `,
    });

    console.log(result.object);
    return result.object;
  } catch (error) {
    console.error("Error during enhancement of CV:", error);
    throw new Error("Failed to enhance CV.");
  }
}
