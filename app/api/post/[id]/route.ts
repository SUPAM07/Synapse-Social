import { POST_STATUS } from "@/constants/post";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";



export async function PATCH(request:NextRequest,
    {params}: {params:Promise<{id:string}>}
){
    try {
        const { id } = await params;
        const { insforge, userId } = await getInsforgeServerClient();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const {
            content,
            images,
            scheduledAt,
            status
        } = await request.json();

        const updateData:any = {};
        if (content) updateData.content = content;
        if (Array.isArray(images)) updateData.images = images;
        if (scheduledAt) updateData.scheduled_at = scheduledAt;
        const postStatus = status === POST_STATUS.DRAFT ? POST_STATUS.DRAFT : POST_STATUS.QUEUE;
        updateData.status = postStatus;

        const {data,error} = await insforge.database
        .from("scheduled_posts")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single()
        
        if (error) {
            console.error("Error updating post:", error);
            return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
        }
        
        return NextResponse.json({ post:data});
    } catch (error) {
        console.error("Error updating post:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
