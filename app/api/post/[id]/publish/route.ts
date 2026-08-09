import { inngest } from "@/inngest/client";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextResponse } from "next/server";


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;
        const {insforge, userId} = await getInsforgeServerClient();
        if(!userId) {
            return NextResponse.json({error:"Unauthorized"}, {status:401});
        }

        const {data: post, error: postError} = await insforge.database
            .from("scheduled_posts")
            .select("id, status")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
        
        if(postError || !post) {
            return NextResponse.json({error:"Post not found"}, {status:404});
        }
        if(post.status === "published") {
            return NextResponse.json({error:"Post already published"}, {status:400});
        }

        const {error:updateError} = await insforge.database
            .from("scheduled_posts")
            .update({
                status: "queue",
                scheduled_at: new Date().toISOString()
            })
            .eq("id", id)
            .eq("user_id", userId)
            .single();

            if(updateError){
                return NextResponse.json({error:"Failed to update post"}, {status:500});
            }
            
            await inngest.send({
                name: "post/publish.requested",
                data: {
                    postId: id
                }
            });
            return NextResponse.json({success:true});
        
    } catch (error) {
        return NextResponse.json({error:"Internal server error"}, {status:500});
    }
}
