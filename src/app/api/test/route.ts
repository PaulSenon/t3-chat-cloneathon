import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    // Get the auth token from Clerk for Convex
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Pass the token to Convex using the options parameter
    const result = await fetchQuery(
      api.users.getCurrentUser,
      {}, // Empty args object
      { token } // Pass the token in options
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in test API route:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
