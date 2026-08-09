"use client"
import * as React from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addHours, isBefore, startOfDay } from "date-fns"
import { enUS } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, } from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"

import "react-big-calendar/lib/css/react-big-calendar.css"
import "./post-calendar.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getChannelIcon } from "@/constants/channels"
import { PostType } from "@/types/post.type"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})


interface PostCalendarProps {
  posts: PostType[]
  isPending: boolean
  currentDate: Date
  view: "month" | "week"
  onViewChange: (view: string) => void
  onDateChange: (date: Date) => void
  onPostClick: (post: PostType) => void
  onCreatePost: (date: Date) => void
  rightActions?: React.ReactNode
}

export function PostCalendar({
  posts,
  isPending,
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onPostClick,
  onCreatePost,
  rightActions,
}: PostCalendarProps) {

  const events = React.useMemo(() =>
    isPending ? [] : posts.map(p => ({
      ...p,
      title: p.content,
      start: new Date(p.scheduled_at),
      end: addHours(new Date(p.scheduled_at), 1),
    })), [posts, isPending]
  )

  const formats = React.useMemo(() => ({
    weekdayFormat: (date: Date, culture?: string, localizer?: any) =>
      localizer.format(date, 'EEEE', culture),

    dayFormat: (date: Date, culture?: string, localizer?: any) =>
      localizer.format(date, 'EEEE d', culture),
  }), []);

  const isWeekView = view === "week"

  const CustomToolbar = (toolbar: any) => {
    return (
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={() => toolbar.onNavigate('PREV')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => toolbar.onNavigate('NEXT')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <span className="text-base font-semibold">
              {format(toolbar.date, "MMMM yyyy")}
            </span>

            <Button variant="outline" size="sm" className="font-medium" onClick={() => toolbar.onNavigate('TODAY')}>
              Today
            </Button>

            <select
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
              value={view}
              onChange={(e) => onViewChange(e.target.value)}
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full relative flex flex-col min-h-[600px] bg-background")}>
      <Calendar
        localizer={localizer}
        events={events}
        date={currentDate}
        formats={formats}
        step={isWeekView ? 15 : 60}
        timeslots={10}
        min={new Date(2026, 0, 1, 0, 0)}
        max={new Date(2026, 0, 1, 22, 0)}
        onNavigate={onDateChange}
        view={view === "month" ? Views.MONTH : Views.WEEK}
        onView={(v) => onViewChange(v === Views.MONTH ? "month" : "week")}
        onSelectEvent={(event: any) => onPostClick(event)}
        //onSelectSlot={({ start }) => onCreatePost(start)}
      
        // In week view, disable past time slots 
        // and style them differently
        slotPropGetter={(date) => {
          const isPastSlot = isBefore(date, new Date())
          return isPastSlot
            ? {
              className: "rbc-time-slot-disabled",
              style: {
                backgroundColor: "hsl(var(--muted) / 0.35)",
                pointerEvents: "none",
              },
            }
            : {}
        }}
        // In month view, disable past dates and style them differently
        dayPropGetter={(date: Date) => {
          const isPastDate = isBefore(date, new Date())
          return {
            className: isPastDate ? "bg-[#331f000f]! pointer-events-none" : "",
            style: isPastDate ? { backgroundColor: "hsl(var(--muted) / 0.5)" } : {}
          }
        }}
        components={{
          toolbar: CustomToolbar,
          // Customize event rendering to show channel icons and better styling
          event: ({ event }) => {
            const channel = event.user_channels?.channel_types
            const Icon = getChannelIcon(channel?.type || undefined)
            const color = channel?.color || "#000000"
            return (
              <>
                <div
                  className="flex items-center gap-2 px-2 py-1 h-full"
                  style={{ backgroundColor: color + "20", borderLeft: `3px solid ${color}` }}
                  onClick={() => onPostClick(event)}
                >
                  {Icon && <HugeiconsIcon
                    icon={Icon}
                    className="shrink-0 text-white! size-4! p-0.5 rounded-sm"
                    style={{
                      background: color
                    }} />}
                  <span className="text-xs truncate max-w-[100px]">{event?.title}</span>
                  <span className="font-semibold">{format(event.scheduled_at, "h:mm a")}</span>
                </div>
              </>
            )
          },

          month: {
            dateHeader: ({ label, date: cellDate }: any) => {
              const isCellToday = format(cellDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              const isPastDate = isBefore(cellDate, startOfDay(new Date()))
              return (
                <>
                  <div className="group flex items-center justify-between w-full">
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                      isCellToday ? "bg-green-500 text-white" : isPastDate ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {label}
                    </span>
                    {!isPastDate && !isPending && (
                      <Button
                        size="icon-sm"
                        variant="default"
                        className="p-px! size-6! mt-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreatePost(cellDate)
                        }}
                      >
                        <Plus className="size-3" />
                      </Button>
                    )}

                  </div>
                  {isPending && <Skeleton className="h-8 w-11/12 m-2 my-5" />}
                </>
              )
            }
          },
        }}
      />
    </div>
  )
}
