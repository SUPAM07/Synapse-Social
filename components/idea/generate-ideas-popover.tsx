"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Sparkles, Check, X } from "lucide-react"
import { useSubscription } from "@clerk/nextjs/experimental"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Spinner } from "../ui/spinner"
import { Textarea } from "../ui/textarea"
import { toast } from "sonner"
import Link from "next/link"

interface GenerateIdeasPopoverProps {
  onGenerated: (title: string, description: string) => void
}

export function GenerateIdeasPopover({ onGenerated }: GenerateIdeasPopoverProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  const [businessType, setBusinessType] = useState("")
  const [targetAudience, setTargetAudience] = useState("")

  const [generatedIdeas, setGeneratedIdeas] = useState<{
    title: string; description: string
  }[]>([])
  
  const [selectedIdea, setSelectedIdea] = useState(0)
   const { data: subscription, isLoading } = useSubscription()

   const canUseAI = !!subscription?.subscriptionItems?.some(item => {
    const planSlug = item.plan.slug
    return planSlug === "pro" || planSlug === "business"
   })
  

  const generateMutation = useMutation({
    mutationFn: async ({ businessType, targetAudience }: {
      businessType: string; targetAudience: string
    }) => {
      const res = await fetch("/api/idea/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType, targetAudience }),
      })
      if (!res.ok) {
        throw new Error("Failed to generate ideas")
      }
      return res.json()
    },
    onSuccess: (data) => {
      setGeneratedIdeas(data.ideas || [])
      setStep(2)
    },
    onError: (error) => {
      console.error("Generation error:", error)
      toast.error("Failed to generate ideas. Please try again.")
    }
  })

  const handleGenerate = () => {
    if (!businessType || !targetAudience) {
      toast.error("Please provide both business type and target audience")
      return
    }
    generateMutation.mutate({
      businessType,
      targetAudience
    })
  }

  const handleUseIdea = () => {
    const idea = generatedIdeas[selectedIdea]
    if (!idea) return
    onGenerated(idea.title, idea.description)
    // Reset state
    setOpen(false)
    setStep(1)
    setGeneratedIdeas([])
    setBusinessType("")
    setTargetAudience("")
    setSelectedIdea(0)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 
        bg-linear-to-r from-[#b0ec9c33] to-[#d1bdff33]">
          <Sparkles className="h-4 w-4" />
          Generate Ideas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4 shadow-lg" align="end">
      {!canUseAI && !isLoading && (
         <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3
           text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="text-sm font-medium">AI idea generation requires an upgrade</p>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
              <Link href="/billing" className="underline underline-offset-4">
                Upgrade
              </Link>{" "}
              to Pro or Premium to generate ideas with AI.
            </p>
          </div>
      )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Generate Content Ideas</h3>
              <p className="text-sm text-muted-foreground">
                Tell us about your business to get personalized content ideas.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Business Type</label>
                <Textarea
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="e.g., fitness brand"
                  disabled={!canUseAI}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Target Audience</label>
                <Textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., busy professionals"
                  disabled={!canUseAI}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !canUseAI}
              size="lg"
              className="w-full gap-2"
            >
              {generateMutation.isPending ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Ideas
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Generated Ideas</h3>
              <p className="text-sm text-muted-foreground">
                Select an idea to add to your board.
              </p>
            </div>

            <div className="space-y-2">
              {generatedIdeas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIdea(index)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedIdea === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                        selectedIdea === index
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      )}
                    >
                      {selectedIdea === index && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-sm font-medium">{idea.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {idea.description}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleUseIdea}
                className="flex-1"
                size="lg"

              >
                Use Idea
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
