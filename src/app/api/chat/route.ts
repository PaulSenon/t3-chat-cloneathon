import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log("=== API Route Called ===");

    // Authenticate the user
    const { userId, getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (!token || !userId) {
      console.log("❌ Not authenticated");
      return new Response("Not authenticated", { status: 401 });
    }
    console.log("✅ User authenticated:", userId);

    // Allow streaming responses up to 30 seconds

    const { messages } = await req.json();

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("❌ API route error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return a more specific error message
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return new Response("Invalid API key", { status: 401 });
      }
      if (
        error.message.includes("quota") ||
        error.message.includes("billing")
      ) {
        return new Response("API quota exceeded", { status: 429 });
      }
      if (error.message.includes("model")) {
        return new Response("Model configuration error", { status: 400 });
      }
    }

    return new Response("Internal server error", { status: 500 });
  }
}
