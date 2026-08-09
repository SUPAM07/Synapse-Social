import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Repeat2, Heart, BarChart2, Bookmark, Share } from "lucide-react"

interface TwitterPreviewProps {
  text: string
  images?: string[]
  profileImage?:string;
  handle?:string;
}

export function TwitterPreview({ text, images,profileImage,handle }: TwitterPreviewProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-3">
          <Avatar className="size-9">
            <AvatarImage src={profileImage || "./images/avatar.webp"} />
            <AvatarFallback>LM</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold">{handle || "Lemon"}</span>
              <span className="text-xs text-muted-foreground">@{handle || "lemon"}</span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {text || <span className="text-muted-foreground italic">Nothing yet…</span>}
            </p>
            {/* Images display */}
            {images && images.length > 0 && (
              <div className={`mt-3 grid gap-1 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Tweet image ${index + 1}`}
                      className="rounded-lg w-full h-[100px] object-cover"
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 
                      rounded-lg flex items-center justify-center">
                        <span className="text-white text-2xl font-semibold">+{images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-5 text-muted-foreground">
              <MessageCircle className="size-4" />
              <Repeat2 className="size-4.5 " />
              <Heart className="size-4 " />
              <BarChart2 className="size-4 " />
              <Bookmark className="size-4 " />
              <Share className="size-4 " />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
