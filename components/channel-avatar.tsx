"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ChannelTypeEnum, getChannelIcon } from "@/constants/channels"

type ChannelAvatarProps = {
  type: ChannelTypeEnum
  color: string
  profileImage?: string | null
  name?: string | null
  size?: "sm" | "md"
  className?: string
}

const ChannelAvatar = ({
  type,
  color,
  profileImage,
  name,
  size = "md",
  className = "inline-flex items-center gap-2",
}: ChannelAvatarProps) => {
  const icon = getChannelIcon(type)

  return (
    <div className={cn(className)}>
      <Avatar
        className={cn(size === "sm" ? "size-8" : "size-10", "border")}
      >
        <AvatarFallback>LM</AvatarFallback>
        <AvatarImage src={profileImage || "./images/avatar.webp"} className="rounded-xl!" />
        {icon ? (
          <div
            className={cn(
              "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center",
              "right-[-3px] bottom-[-3px] rounded-sm bg-white p-[1px] ring-0",
              size === "sm" ? "size-[15px]" : "size-[20px]"
            )}
          >
            <span
              className="flex size-full items-center justify-center rounded-sm p-[4px]!"
              style={{ backgroundColor: color }}
            >
              <HugeiconsIcon
                icon={icon}
                className={cn(
                  "text-white! size-2.5!",
                )}
              />
            </span>
          </div>

        ) : null}
      </Avatar>

      {name ? (
        <span className="truncate font-medium text-[14.0px]">{name}</span>
      ) : null}
    </div>
  )
}

export default ChannelAvatar
