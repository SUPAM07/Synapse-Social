import { getInsforgeServerClient } from "@/lib/insforge-server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";




export async function POST(request: NextRequest) {
    try {
        const { has, userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const canUseAI = has({ plan: "pro" }) || has({ plan: "premium" })
        if (!canUseAI) {
            return NextResponse.json({ error: "AI Idea generation requires Pro or Premium plan" }, { status: 403 });
        }

        const { businessType, targetAudience } = await request.json()
        if (!businessType || !targetAudience) {
            return NextResponse.json({ error: "Missing businessType or targetAudience" }, { status: 400 });
        }

        const { insforge } = await getInsforgeServerClient()
        const result = await insforge.ai.chat.completions.create({
            model: "google/gemini-2.5-flash-lite",
            messages: [
                {
                    role: "system",
                    content: `You are a social media content ideation assistant. 
Return only valid JSON.
The response must be an object with an "ideas" array.
Each item must have: "title" and "description".
Generate 3 ideas.
Keep titles catchy.
Keep descriptions practical and specific.
Do not use markdown formatting like **, *, #, or backticks.
Return plain text only inside the JSON strings.`,
                },
                {
                    role: "user",
                    content: `Business type: ${businessType}. Target audience: ${targetAudience}.`
                }
            ]
        })

        const text = result.choices[0]?.message?.content ?? ""

        const parsed = JSON.parse(text) as { ideas?: { title: string, description: string }[] }
        const ideas = Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 3) : []

        return NextResponse.json({ ideas })

    } catch (error) {
        console.error("Error generating ideas:", error)
        return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 })
    }
}
