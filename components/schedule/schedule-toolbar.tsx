"use client";

import { ChevronDown, Copy, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChannelType } from "@/types/channel.type";
import ChannelAvatar from "../channel-avatar";

interface ScheduleToolbarProps {
  viewType?: "calendar" | "list";
  channelIds: string[];
  toggleChannel: (id: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string | any) => void;
}

const statusOptions = [
  { id: "all", label: "All Posts" },
  { id: "draft", label: "Drafts" },
  { id: "queue", label: "Queue" },
  { id: "published", label: "Published" },
  { id: "failed", label: "Failed" },
];

const ScheduleToolbar = ({
  viewType = "calendar",
  channelIds,
  toggleChannel,
  selectedStatus,
  setSelectedStatus,
}: ScheduleToolbarProps) =>{
  const { data: channelsData } = useQuery({
    queryKey: ["channels-connected"],
    queryFn: async () => {
      const res = await fetch("/api/channel?filter=connected");
      if (!res.ok) throw new Error("Failed to fetch channels");
      return res.json();
    },
  });
  const connectedChannels = channelsData?.channels || [];

  return (
    <div className="flex items-center gap-2">
      {/* Status Filter */}
      {viewType === "calendar" && (

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="lg" className="h-8 gap-1">
              <Copy className="h-3.5 w-3.5" />
              <span className="font-medium text-sm text-muted-foreground!">
                {statusOptions.find((s) => s.id === selectedStatus)?.label || "All Posts"}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-1">
              {statusOptions.map((option) => (
                <button
                  key={option.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors",
                    selectedStatus === option.id && "bg-muted font-medium"
                  )}
                  onClick={() => setSelectedStatus(option.id)}
                >
                  <Checkbox
                    checked={selectedStatus === option.id}
                    className="pointer-events-none"
                  />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Channels Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="lg" className="h-8 gap-1">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="font-medium text-sm text-muted-foreground!">
              Channels
            </span>
            {channelIds && channelIds?.length > 0 && (
              <Badge variant="default" className="size-4!">
                {channelIds.length}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-86 p-0" align="end">
          <Command>
            <CommandList>
              <CommandGroup heading="Connected Channels">
                {connectedChannels?.length === 0 ? (
                  <div className="py-4 px-2 text-center">
                    <p className="text-xs text-muted-foreground mb-3">No channels connected</p>
                    <Button size="sm" className="w-fit px-5" asChild>
                      <Link href="/settings">Connect Channel</Link>
                    </Button>
                  </div>
                ) : (
                  connectedChannels?.map((channel: ChannelType) => (
                    <CommandItem
                      key={channel.id}
                      onSelect={() => toggleChannel(channel.user_channel_id!)}
                      className="flex items-center justify-between gap-2 px-2 py-1.5"
                    >
                      <ChannelAvatar
                        size="sm"
                        className="flex-1 flex items-center justify-start gap-2"
                        type={channel.type}
                        color={channel.color}
                        profileImage={channel.profile_image}
                        name={channel.handle || channel.name}
                      />

                      <Checkbox
                        checked={channelIds.includes(channel.user_channel_id!)}
                        className="border-black!"
                      />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

    </div>
  );
}

export default ScheduleToolbar;