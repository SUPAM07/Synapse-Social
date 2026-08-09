import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, MessageCircle, Repeat2, Send, Globe, MoreHorizontal } from "lucide-react"

interface LinkedinPreviewProps {
  text: string
  images?: string[]
    profileImage?:string;
  handle?:string;
}

export function LinkedinPreview({ text, images, profileImage, handle }: LinkedinPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const CHAR_LIMIT = 100

  return (
    <Card>
      <CardContent className="px-0">
        <div className="flex items-start justify-between mb-3 px-3">
          <div className="flex items-start gap-2">
            <Avatar className="size-9">
              <AvatarImage src={profileImage || "./images/avatar.webp"} />
              <AvatarFallback>LM</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h4 className="text-[14px] font-semibold leading-tight">{handle || "Lemon"}</h4>
             <span className="flex items-center gap-1 mt-1 
              text-muted-foreground text-xs">
                1h ·
                <svg viewBox="0 0 12 12" fill="none"
                  xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
                  width="11" height="11">
                  <g clipPath="url(#:r1g1:)">
                    <path fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.6211 6.0003C11.6211 8.4228 10.0911 10.4876 7.94384 11.2773L7.99634 11.2503C8.87159 10.5003 9.35684 9.02504 9.49634 8.37479C9.65684 7.62479 9.72359 7.39979 9.12134 6.90479C8.88884 6.71504 8.61359 6.75781 8.34134 6.54781C8.15684 6.40531 8.07435 6.1053 7.88685 6.0003C7.44135 5.74755 7.0566 6.08279 6.42135 6.16754C6.13056 6.20027 5.83613 6.16879 5.55885 6.0753C5.55359 6.0753 5.55359 6.0753 5.54909 6.0723L5.48684 6.0498C5.36384 5.9883 5.4291 5.89529 5.49135 5.77979H5.48684C5.55134 5.65229 5.55135 5.4978 5.44935 5.38305C5.30685 5.22255 5.04435 5.22255 4.84635 5.21505C4.76685 5.2128 4.68884 5.21505 4.61159 5.21805L4.60935 5.21505C4.57935 5.21505 4.54635 5.21805 4.51635 5.21805H4.48859C4.24634 5.2233 3.9891 5.19255 3.81885 4.98255C3.6216 4.7178 3.60135 4.4328 3.8916 4.16505C4.1016 3.97005 4.53884 3.56505 5.24684 4.00005C5.69909 4.27755 6.12135 4.5003 6.49635 4.37505C6.74384 4.29255 6.85635 4.14781 6.56685 3.72256C6.45157 3.56415 6.39483 3.37063 6.40634 3.17505C6.45659 2.59305 6.92159 2.54504 7.27934 2.27504C7.62884 2.00804 7.78935 1.56779 7.68885 1.18229C7.60935 0.872539 7.30634 0.527555 6.72884 0.424805C8.08266 0.600879 9.32602 1.26394 10.2265 2.29005C11.127 3.31617 11.6223 4.63508 11.6211 6.0003Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M7.58026 11.3969C6.74183 11.6426 5.85768 11.6896 4.99793 11.5341C4.13817 11.3787 3.32646 11.025 2.62718 10.5013C1.9279 9.97747 1.36028 9.29796 0.969347 8.5166C0.578415 7.73525 0.374921 6.87354 0.375004 5.99984C0.373858 5.06354 0.607075 4.14184 1.05339 3.31876C1.49971 2.49569 2.14493 1.79743 2.93025 1.2876C2.36918 1.75092 1.94132 2.35503 1.6905 3.03809C1.12575 4.70084 1.52775 6.09435 3.408 6.09435C4.03275 6.09435 4.458 6.5151 4.40775 7.8756C4.398 8.17785 4.79776 9.21058 6.24526 9.29308C6.77026 9.32308 7.13325 10.0828 7.24275 10.5981C7.28775 10.8156 7.33801 11.0856 7.43551 11.3256C7.44803 11.3521 7.46912 11.3736 7.49539 11.3867C7.52165 11.3998 7.55155 11.4029 7.58026 11.3969Z" fill="currentColor"></path><path d="M12 6C12 7.5913 11.3679 9.11743 10.2426 10.2426C9.11742 11.3679 7.5913 12 6 12C4.4087 12 2.88258 11.3679 1.75736 10.2426C0.632142 9.11743 0 7.5913 0 6C0 4.4087 0.632142 2.88257 1.75736 1.75735C2.88258 0.632136 4.4087 0 6 0C7.5913 0 9.11742 0.632136 10.2426 1.75735C11.3679 2.88257 12 4.4087 12 6ZM11.25 6C11.25 4.60761 10.6969 3.27226 9.71231 2.2877C8.72774 1.30313 7.39239 0.75 6 0.75C4.60761 0.75 3.27226 1.30313 2.28769 2.2877C1.30313 3.27226 0.75 4.60761 0.75 6C0.75 7.39239 1.30313 8.72774 2.28769 9.7123C3.27226 10.6969 4.60761 11.25 6 11.25C7.39239 11.25 8.72774 10.6969 9.71231 9.7123C10.6969 8.72774 11.25 7.39239 11.25 6Z" fill="currentColor">
                    </path></g><defs><clipPath id=":r1g1:">
                <rect width="12" height="12" fill="white"></rect></clipPath></defs></svg>
              </span>
            </div>
          </div>
          <MoreHorizontal className="size-5 text-muted-foreground" />
        </div>

        <div className="text-sm leading-normal whitespace-pre-wrap break-words px-3 mb-3">
          {!text ? (
            <span className="text-muted-foreground italic">Nothing yet…</span>
          ) : text.length > CHAR_LIMIT && !isExpanded ? (
            <div className="text-right">
              <span className="text-left block float-left w-full">
                {text.slice(0, CHAR_LIMIT)}...
              </span>
              <button 
                onClick={() => setIsExpanded(true)}
                className="text-muted-foreground hover:text-primary text-[14px] font-medium"
              >
                ...more
              </button>
            </div>
          ) : (
            text
          )}
        </div>

        {/* Image Display - Horizontal Scroll */}
        {images && images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {images.map((image, index) => (
              <div key={index} className="relative shrink-0 w-full aspect-video">
                <img
                  src={image}
                  alt={`LinkedIn post image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 
        border-t">
          <div className="flex flex-col items-center gap-1 flex-1 ">
            <ThumbsUp className="size-4 -scale-x-100" />
            <span className="text-xs font-semibold">Like</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 ">
            <MessageCircle className="size-4" />
            <span className="text-xs font-semibold">Comment</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <Repeat2 className="size-4" />
            <span className="text-xs font-semibold">Repost</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <Send className="size-4" />
            <span className="text-xs font-semibold">Send</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
