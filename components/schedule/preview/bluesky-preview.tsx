import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Repeat2, Heart, Bookmark, Share, MoreHorizontal, MessageSquare } from "lucide-react"

interface BlueSkyPreviewProps {
  text: string
  images?: string[]
  profileImage?:string;
  handle?:string;
}

export function BlueSkyPreview({ text, images, profileImage, handle }: BlueSkyPreviewProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarImage src={profileImage || "./images/avatar.webp"} />
            <AvatarFallback>LM</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[15px] font-bold">{handle || "Lemon"}</span>
              <span className="text-[14px] text-muted-foreground truncate">@{handle || "lemon.bsky.social"}</span>
              <span className="text-[14px] text-muted-foreground">· 21h</span>
            </div>
            
            <p className="mt-1 text-[15px] leading-normal whitespace-pre-wrap wrap-break-word">
              {text || <span className="text-muted-foreground italic">Nothing yet…</span>}
            </p>

            {/* Images display */}
            {images && images.length > 0 && (
              <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl border border-border/50 ${
                images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`BlueSky image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xl font-semibold">+{images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-muted-foreground max-w-[320px]">
              <MessageSquare className="size-4" />
              <Repeat2 className="size-4.5" />
              <Heart className="size-4" />
              <Bookmark className="size-4" />
              <Share className="size-4" />
              <MoreHorizontal className="size-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
