import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Heart, MessageCircle, Repeat2, Send, Plus } from "lucide-react"

interface ThreadPreviewProps {
  text: string
  images?: string[]
    profileImage?:string;
  handle?:string;
}

export function ThreadPreview({ text, images, profileImage, handle }: ThreadPreviewProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="size-8">
              <AvatarImage src={profileImage || "./images/avatar.webp"} />
              <AvatarFallback>LM</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 size-4 bg-black rounded-full flex items-center justify-center border-2 border-white">
              <Plus className="size-2.5 text-white stroke-[3px]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{handle || "Lemon"}</span>
              <span className="text-xs text-muted-foreground">21h</span>
            </div>
            <p className="mt-1 text-sm leading-normal whitespace-pre-wrap break-words">
              {text || <span className="text-muted-foreground italic">Nothing yet…</span>}
            </p>
            
            {/* Images display - Horizontal Scroll based on screenshot */}
            {images && images.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((image, index) => (
                  <div key={index} className="relative shrink-0 w-[85%] 
                  aspect-3/3 max-w-[300px]">
                    <img
                      src={image}
                      alt={`Thread image ${index + 1}`}
                      className="rounded-xl w-full h-full object-cover border border-border/50"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="relative mt-3 flex items-center gap-4 text-muted-foreground">
              <Heart className="size-4" />
              <MessageCircle className="size-4 transform -rotate-90" />
              <Repeat2 className="size-5"/>
              <Send className="size-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
