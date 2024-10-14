import { createOpenAI } from "@ai-sdk/openai";

//custom Nerdbord OpenAI client
export const openai = createOpenAI({
  fetch: async (url, options) => {
    const fullUrl =
      "https://training.nerdbord.io/api/v1/openai/chat/completions";
    console.log(`Fetching ${fullUrl}`);
    const result = await fetch(fullUrl, options);
    console.log(`Fetched ${fullUrl}`);
    console.log();
    return result;
  },
});
