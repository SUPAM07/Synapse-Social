"use client"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ImageObject } from "@/types/post.type"

interface Idea {
  id: string
  title: string
  description?: string
  images?: ImageObject[]
  groupId?: string
  groupTitle?: string
}

interface IdeasListProps {
  onSelect?: (idea: Idea) => void
}

interface IdeaGroup {
  id: string
  title: string
  ideas: Idea[]
}

const IdeasList = ({ onSelect }: IdeasListProps) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")

  const { data, isLoading } = useQuery({
    queryKey: ["ideas"],
    queryFn: async () => {
      const res = await fetch("/api/idea")
      if (!res.ok) throw new Error("Failed to fetch ideas")
      return res.json()
    }
  })

  const groups: IdeaGroup[] = data?.groups ?? []

  const ideas = useMemo(() => {
    return groups.flatMap((group) =>
      group.ideas.map((idea) => ({
        ...idea,
        groupId: group.id,
        groupTitle: group.title,
      }))
    )
  }, [groups])

  const filteredIdeas = useMemo(() => {
    if (selectedGroupId === "all") return ideas
    return ideas.filter((idea) => idea.groupId === selectedGroupId)
  }, [ideas, selectedGroupId])

  const handleSelect = (idea: Idea) => {
    onSelect?.(idea)
  }

  return (
    <div className="space-y-3 flex flex-col">
      <div className="px-6 flex itms-center justify-between gap-3">
        <h5 className="font-medium text-base">Ideas</h5>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3 px-6 py-1 overflow-y-auto h-[550px]">
        {isLoading && Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-3 space-y-3">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}

        {!isLoading && filteredIdeas.map((idea) => (
          <Card key={idea.id} className="cursor-pointer!"
            onClick={() => handleSelect(idea)}>

            <CardContent className="p-3 pt-0">
              {idea.images && idea.images.length > 0 && (
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {idea.images.slice(0, 4).map((image, index) => (
                    <img
                      key={image.key || index}
                      src={image.url}
                      alt={`Idea image ${index + 1}`}
                      className="w-full h-12 rounded object-cover border"
                    />
                  ))}
                </div>
              )}
              <CardHeader className="mb-1 p-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-5">
                      {idea.title}
                    </h4>
                  </div>
                  {idea.groupTitle && (
                    <Badge variant="secondary" className="font-normal">
                      {idea.groupTitle}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {idea.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {idea.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {!isLoading && filteredIdeas.length === 0 && (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No ideas yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default IdeasList
