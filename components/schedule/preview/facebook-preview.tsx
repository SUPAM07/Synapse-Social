import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, MessageCircle, Share2, Globe, MoreHorizontal, Globe2, Share } from "lucide-react"

interface FacebookPreviewProps {
  text: string
  images?: string[]
    profileImage?:string;
  handle?:string;
}

export function FacebookPreview({ text, images, profileImage, handle }: FacebookPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const CHAR_LIMIT = 100

  return (
    <Card>
      <CardContent className="px-0">
        <div className="flex items-start justify-between mb-3 px-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-10">
              <AvatarImage src={profileImage || "./images/avatar.webp"} />
              <AvatarFallback>LM</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-[15px] font-semibold leading-none">{handle || "Lemon"}</h4>
              <span className="flex items-center gap-1 mt-1 
              text-muted-foreground text-xs">
                Just Now ·
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
          <MoreHorizontal className="size-5 text-muted-foreground cursor-pointer" />
        </div>

        <div className="px-4 text-[15px] leading-normal whitespace-pre-wrap break-words mb-3">
          {!text ? (
            <span className="text-muted-foreground italic">Nothing yet…</span>
          ) : text.length > CHAR_LIMIT && !isExpanded ? (
            <>
              {text.slice(0, CHAR_LIMIT)}... <span
                onClick={() => setIsExpanded(true)}
                className="text-muted-foreground font-medium cursor-pointer hover:underline"
              >
                See More
              </span>
            </>
          ) : (
            text
          )}
        </div>

        {/* Images display - Horizontal Scroll */}
        {images && images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative shrink-0 w-[90%] aspect-[4/4] max-w-[350px]">
                <img
                  src={image}
                  alt={`Facebook image ${index + 1}`}
                  className="rounded-lg w-full h-full object-cover border border-border/50"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 
        border-t text-muted-foreground">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <ThumbsUp className="size-4" />
            <span className="text-sm font-medium">Like</span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <MessageCircle className="size-4 transform -rotate-90" />
            <span className="text-sm font-medium">Comment</span>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
              width="16" height="16"><path d="M10.4572 4.73239C10.4575 3.17424 12.3318 2.3833 13.4483 3.47029L20.9241 10.7499C21.6255 11.4332 21.6352 12.5574 20.9455 13.2527L13.8017 20.4523C12.6938 21.5689 10.7892 20.7846 10.7892 19.2116V16.1005C10.7892 16.058 10.7723 16.0313 10.7613 16.0205C10.7566 16.0158 10.7558 16.0159 10.7558 16.0159C10.7586 16.0169 10.759 16.0162 10.753 16.0168C8.91424 16.1951 6.12671 17.0627 4.29371 19.2469C3.94336 19.6644 3.41256 19.7623 2.98791 19.6338C2.54782 19.5005 2.13109 19.0872 2.14899 18.4777L2.16388 18.1225C2.25931 16.3177 2.69764 14.0823 3.82403 12.1496C5.04429 10.056 7.0713 8.32992 10.247 7.929C10.3139 7.92055 10.3717 7.88837 10.4098 7.84808C10.4454 7.81023 10.4572 7.77326 10.4572 7.7402V4.73239ZM12.0764 7.7402C12.0764 8.70851 11.3132 9.42619 10.4498 9.53521C7.84063 9.86461 6.22509 11.2456 5.22284 12.9653C4.4245 14.3351 4.01611 15.9262 3.85193 17.3654C5.98644 15.3715 8.74684 14.5853 10.5967 14.4059C11.6488 14.304 12.4075 15.1729 12.4075 16.1005V19.2116C12.4075 19.2549 12.4194 19.2785 12.4299 19.2934C12.443 19.3118 12.4652 19.3309 12.4959 19.3436C12.527 19.3564 12.5572 19.3587 12.5796 19.3548C12.5975 19.3516 12.6218 19.3426 12.6522 19.312L19.7959 12.1124C19.8519 12.056 19.851 11.9651 19.7941 11.9097L12.3192 4.63008C12.2886 4.60032 12.2638 4.59211 12.2457 4.58916C12.2234 4.58554 12.1943 4.58843 12.1639 4.60125C12.1334 4.6141 12.1109 4.63293 12.0978 4.65147C12.0874 4.66647 12.0765 4.68994 12.0764 4.73239V7.7402Z" fill="currentColor"></path></svg>
            <span className="text-sm font-medium">Share</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
