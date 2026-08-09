import { getInsforgeAdminClient } from "@/lib/insforge-server";
import { inngest } from "../client";
import { ImageObject, PostType } from "@/types/post.type";
import { decrypt, encrypt } from "@/lib/encryption";
import { refreshOauthToken } from "@/lib/social-oauth";
import { ChannelTypeEnum } from "@/constants/channels";


type DuePost = {
    id:string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export const publishScheduledPostsCron = inngest.createFunction(
    {
        id:"publish-scheduled-posts-cron",
        name:"Publish Scheduled Posts",
        triggers:[
            {
                cron:"*/10 * * * *"
            }
        ]
    },
    async ({step,logger}) => {

        const duePosts = await step.run("load-due-scheduled-posts", async () => {
            const insforge = getInsforgeAdminClient()
            const now = new Date().toISOString()
            const { data, error } = await insforge.database
                .from("scheduled_posts")
                .select("id, status, scheduled_at")
                .eq("status", "queue")
                .lte("scheduled_at", now)
                .order("scheduled_at", { ascending: true })

            logger.info("Load due scheduled posts", { count: data?.length })

            if(error){
                logger.error(error)
                throw error
            }
            return (data ?? []) as DuePost[]
        })

        if(duePosts.length === 0){
            return { queued: 0}
        }
        logger.info("Send out the post for publish", { count: duePosts.length })

        await step.sendEvent(
            "send-out-post-for-publish",
            duePosts.map(post => ({
                name:"post/publish.requested",
                data: {
                    postId: post.id
                }
            }))
        )

        return { message:"sent out posts for publishing", queued: duePosts.length}
    }
)

export const publishScheduledPost = inngest.createFunction(
    {
        id:"publish-scheduled-post",
        name:"Publish Scheduled Post",
        triggers:{
            event:"post/publish.requested"
        }
    },
    async ({event, step,logger}) => {
       const post = await step.run("load-post", async () => {
        const insforge = getInsforgeAdminClient()
        const { data, error } = await insforge.database
            .from("scheduled_posts")
            .select("*, user_channels(*, channel_types(id, type, name))")
            .eq("id", event.data.postId)
            .eq("status", "queue")
            .single()

        logger.info("Load post", { data })
        if(error){
            logger.error(error)
            throw error
        }
        
        return data as PostType;
       })

       if(!post){
        logger.error("Post not found", { postId: event.data.postId })
        return { skipped: true, reason: "post_not_found" }
       }

       const userChannel = post.user_channels
       if(!userChannel) return {skipped: true, reason: "user_channel_not_found"}

       const channelType = userChannel.channel_types
       if(!channelType) return {skipped: true, reason: "channel_type_not_found"}
       

       const providerType = post.user_channels?.channel_types?.type;
       const accessToken = decrypt(post.user_channels?.access_token)
       const refreshToken = decrypt(post.user_channels?.refresh_token);
       const tokenExpiresAt = post.user_channels?.token_expires_at ? 
            new Date(post.user_channels.token_expires_at).getTime() : null;
        const callbackUrl = `${APP_URL}/api/channel/callback`;
        const shouldRefreshBeforePublish = Boolean(refreshToken) &&
            tokenExpiresAt !== null &&
            tokenExpiresAt <= Date.now()

        if(!providerType || !accessToken){
            logger.error("Missing provider type or access token", { providerType, accessToken })
            return { skipped: true, reason: "missing_provider_or_token" }
        }

        let currentAccessToken = accessToken;

        if(shouldRefreshBeforePublish && refreshToken){
            const result = await step.run("refresh-token", async () => {
                const data = await refreshOauthToken(
                    providerType as ChannelTypeEnum,
                    refreshToken,
                    callbackUrl
                )
                await saveRefreshedToken(post.user_channels?.id, 
                    data.accessToken,
                    data.refreshToken ?? refreshToken,
                    data.expiresAt
                )
                return data;
            })
            currentAccessToken = result.accessToken;
        }
    

         let publishedUrl: string | null = null

         try {
            publishedUrl = await step.run("publish-to-ptrovider", async () => {
                if(providerType === ChannelTypeEnum.TWITTER){
                    return publishToTwitter({
                        accessToken:currentAccessToken,
                        content:post.content,
                        handle: post.user_channels?.handle,
                        images: post.images,
                        logger
                    });
                }
                  if(providerType === ChannelTypeEnum.LINKEDIN){
                    return publishToLinkedIn({
                        accessToken: currentAccessToken,
                        text:post.content,
                        authorId: post.user_channels?.provider_account_id,
                        images: post.images,
                        logger
                    });
                }  
                
                throw new Error(`Unsupported provider type: ${providerType}`)
            })

            await step.run("mark-post-published", async () => {
                await markPostPublished(post.id, publishedUrl);
            })

             return { published: true, provider: providerType }
         } catch (error) {
            logger.error("Failed to publish post", { error })
            const message = error instanceof Error ? error.message : "Unknown error"
            await markPostFailed(post.id, message)
            throw error
         }
    }
)



async function publishToTwitter({
    accessToken,
    content,
    handle,
    images,
    logger
}: {
    accessToken: string;
    content: string;
    handle?: string | null;
    images?: ImageObject[]
    logger: any;
}){
    const mediaIds = images?.length ? 
    await uploadImagesToTwitter({
        accessToken,
        images,
        logger
    }) : [];

    const response = await fetch("https://api.x.com/2/tweets",{
        method:"POST",
        headers:{
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            text: content,
             ...(mediaIds.length > 0 ? { 
                media: { 
                    media_ids: mediaIds 
                } 
            } : {})
        })
    })

    if(!response.ok) throw new Error("Failed to publish to Twitter")

    const responseText = await response.text()
    let data:any = null;
    try {
        data = JSON.parse(responseText)
    } catch (error) {
        logger.error("Failed to parse Twitter response", { error, responseText })
        data = null
    }

    const postId = data?.data?.id;

    if(!postId) throw new Error("Failed to get post ID from Twitter response")
    
    return handle ? `https://x.com/${handle}/status/${postId}` : null;   
}


async function uploadImagesToTwitter({
    accessToken,
    images,
    logger
}: {
    accessToken: string;
    images: ImageObject[];
    logger: any;
}){
   const mediaIds:string[] = [];

   for(const image of images){
    const fileResponse = await fetch(image.url);
    if(!fileResponse.ok) throw new Error("Failed to fetch image");

    const bytes = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get("content-type")?.split(";")[0].trim();

    const pathname = new URL(image.url).pathname.toLowerCase();

    const mediaType = 
        contentType && 
        contentType != "binary/octet-stream" && 
        contentType != "application/octet-stream" ? contentType :
        pathname.endsWith(".png") ? "image/png" :
        pathname.endsWith(".webp") ? "image/webp" :
        "image/jpeg"

        const formData = new FormData();
        const blob = new Blob([bytes], {type: mediaType});
        formData.append("media", blob);
        formData.append("media_category", "tweet_image");
        formData.append("media_type", mediaType);

        const uploadRes = await fetch("https://api.x.com/2/media/upload", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            },
            body: formData
        })

        
        const response = await uploadRes.text();
        logger.info("Twitter media upload response", { response });
        let data:any = null;
        try {
            data = JSON.parse(response);
        } catch (e) {
            logger.error("Failed to parse Twitter media upload response", { response });
            data = null
        }
        
        if(!uploadRes.ok) {
            throw new Error(`Failed to upload media to Twitter: ${response}`)
        }
       
        const mediaId = data?.data?.id || data?.data?.media_key
       if(!mediaId) throw new Error("Failed to get media ID from Twitter response")
       mediaIds.push(mediaId)
   }
   return mediaIds
}



async function publishToLinkedIn({
  accessToken,
  text,
  authorId,
  images,
  logger,

}: {
  accessToken: string
  text: string
  authorId?: string | null
  images?: { url: string; key: string }[]
  logger: any
}) {
  if (!authorId) throw new Error("Missing LinkedIn provider account id.")
  const imageUrn = images?.[0]?.url
    ? await uploadLinkedInImage({
      accessToken,
      authorId,
      imageUrl: images[0].url,
    })
    : null
  const body: Record<string, unknown> = {
    author: `urn:li:person:${authorId}`,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }

  if (imageUrn) {
    body.content = {
      media: {
        id: imageUrn,
      },
    }
  }
  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": "202604",
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  let data: any = null
  try {
    data = responseText ? JSON.parse(responseText) : null
  } catch {
    logger.error("Failed to parse LinkedIn response", { responseText })
  }

  if (!response.ok) {
    throw new Error(data?.message|| "Failed to publish to LinkedIn.")
  }
  const restliId = response.headers.get("x-restli-id") || data?.id || null
  return restliId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(restliId)}` : null
}

async function uploadLinkedInImage({
  accessToken,
  authorId,
  imageUrl,
}: {
  accessToken: string
  authorId: string
  imageUrl: string
}) {
  const initResponse = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": "202604",
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:person:${authorId}`,
      },
    }),
  })
  const initResponseText = await initResponse.text()
  let initData: { message?: string; value?: { uploadUrl?: string; image?: string } } | null = null
  try {
    initData = initResponseText ? JSON.parse(initResponseText) : null
  } catch {
    throw new Error("Failed to parse LinkedIn image initialization response.")
  }

  if (!initResponse.ok) {
    throw new Error(initData?.message || "Failed to initialize LinkedIn image upload.")
  }
  const uploadUrl = initData?.value?.uploadUrl
  const imageUrn = initData?.value?.image
  if (!uploadUrl || !imageUrn) {
    throw new Error("LinkedIn image upload initialization did not return an upload URL.")
  }
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch image for LinkedIn upload.")
  }
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
  const imageBuffer = await imageResponse.arrayBuffer()
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: imageBuffer,
  })
  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image to LinkedIn.")
  }

  return imageUrn as string
}


async function saveRefreshedToken(
    userChannelId: string | undefined,
    accessToken: string,
    refreshToken: string,
    expiresAt: number
) {
    if(!userChannelId) {
        throw new Error("User channel ID is missing")
    };
    const insforge = getInsforgeAdminClient();
    const {error} = await insforge.database
        .from("user_channels")
        .update({
            access_token: encrypt(accessToken),
            refresh_token: encrypt(refreshToken),
            token_expires_at: expiresAt ?? null
        })
        .eq("id", userChannelId);
    
    if(error) throw error
}

async function markPostPublished(postId:string, published_url:string | null){
    const insforge = getInsforgeAdminClient();
    const {error} = await insforge.database
        .from("scheduled_posts")
        .update({
            status: "published",
            published_at: new Date().toISOString(),
            published_url: published_url
        })
        .eq("id", postId);
    if(error) throw error
}

async function markPostFailed(postId:string, errorMessage:string){
    const insforge = getInsforgeAdminClient();
    const {error} = await insforge.database
        .from("scheduled_posts")
        .update({
            status: "failed",
            error_message: errorMessage
        })
        .eq("id", postId);
    
    if(error) throw error
}

function formatLinkedInText(text: string): string {
  return text
    // normalize smart quotes to straight quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/(\d+\.)\s{2}/g, '\n\n$1 ')
    // trim
    .trim()
    .slice(0, 3000)
}