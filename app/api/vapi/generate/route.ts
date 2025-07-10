import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";

export async function POST(request: Request) {
  try {
    // ✅ Step 1: Check Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { success: false, error: "Missing auth token" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const expectedToken = process.env.VAPI_SECRET;

    if (token !== expectedToken) {
      return Response.json(
        { success: false, error: "Invalid token" },
        { status: 403 }
      );
    }

    // ✅ Step 2: Continue with request
    const body = await request.json();
    console.log("Incoming request body:", body);

    const { type, role, level, techstack, amount, userid } = body;

    if (!type || !role || !level || !techstack || !amount || !userid) {
      return Response.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ✅ Step 3: Generate questions using AI
    const { text: questionsRaw } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
The job role is ${role}.
The job experience level is ${level}.
The tech stack used in the job is: ${techstack}.
The focus between behavioural and technical questions should lean towards: ${type}.
The amount of questions required is: ${amount}.
Please return only the questions, without any additional text.
The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
Return the questions formatted like this:
["Question 1", "Question 2", "Question 3"]`,
    });

    // ✅ Step 4: Parse the AI's response
    let parsedQuestions: string[];
    try {
      parsedQuestions = JSON.parse(questionsRaw);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return Response.json(
        { success: false, error: "AI response not properly formatted." },
        { status: 500 }
      );
    }

    // ✅ Step 5: Save interview in Firestore
    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((t: string) => t.trim()),
      questions: parsedQuestions,
      userId: userid,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    // ✅ Step 6: Return questions in response so Vapi can use them
    return Response.json({ success: true, questions: parsedQuestions }, { status: 200 });

  } catch (error) {
    console.error("Unhandled error in /api/vapi/generate:", error);
    return Response.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
