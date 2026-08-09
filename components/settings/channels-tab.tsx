
"use client"
import { Suspense,useState, useEffect } from 'react'
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation'
import { ChannelType } from '@/types/channel.type';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { getChannelIcon } from '@/constants/channels';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

function ChannelTabContent() {
    const searchParams = useSearchParams()
    const queryClient = useQueryClient()

    const { data: channelsData, isPending } = useQuery({
        queryKey: ["channels"],
        queryFn: async () => {
            const res = await fetch("/api/channel");
            const data = await res.json();
            return data
        }
    })
    const channels = (channelsData?.channels || []) as ChannelType[]

    useEffect(() => {
        const connected = searchParams.get("connected")
        const error = searchParams.get("error")
        const channelType = searchParams.get("channelType")

        if (!connected && !error) return
        queryClient.invalidateQueries({ queryKey: ["channels"] })
        if (connected) {
            toast.success(`Successfully connected to ${channelType}`)
        }
        if (error) {
            toast.error(`Failed to connect to ${channelType}`)
        }
    }, [queryClient, searchParams])

    const connectMutation = useMutation({
        mutationFn: async (channelTypeId: string) => {
            const res = await fetch("/api/channel/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelTypeId }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to start connection")
            return data
        },
        onSuccess: ({ url }) => {
            window.location.href = url
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to start connection")
        },
    })

    const disconnectMutation = useMutation({
        mutationFn: async (userChannelId: string) => {
            const res = await fetch("/api/channel/disconnect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userChannelId }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to start connection")
            return data
        },
        onSuccess: () => {
            toast.success("Channel disconnected successfully")
            queryClient.invalidateQueries({ queryKey: ["channels"] })
        },
        onError: (error: Error) => {
            console.error("Disconnect error:", error)
            toast.error("Failed to disconnect channel")
        },
    })

    const handleConnect = (channelTypeId: string) => {
        if (!channelTypeId) return
        if (connectMutation.isPending) return
        connectMutation.mutate(channelTypeId)
    }
    const handleDisconnect = (userChannelId: string) => {
        if (!userChannelId) return
        if (disconnectMutation.isPending) return
        disconnectMutation.mutate(userChannelId)
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Channels</CardTitle>
                <CardDescription>
                    Connect your social media accounts to start scheduling
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className='space-y-3'>
                    {isPending ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className='flex items-center justify-between rounded-xl border p-4'>
                                <div className='flex items-center gap-3'>
                                    <Skeleton className='size-6 rounded-sm bg-secondary' />
                                    <Skeleton className='h-5 w-24 bg-secondary' />
                                </div>
                                <Skeleton className='h-8 w-20 bg-secondary' />
                            </div>
                        ))
                    ) : (
                        channels?.map((channel) => {
                            const icon = getChannelIcon(channel.type)
                            return (
                                <div key={channel.id}
                                    className='flex items-center justify-between rounded-xl border p-4'
                                >
                                    <div className='flex items-center gap-3'>
                                        <span className='relative'>
                                            {icon ? (
                                                <HugeiconsIcon icon={icon}
                                                    color='currentColor'
                                                    className=" text-white! size-6! p-1 rounded-sm"
                                                    style={{ background: channel.color }}
                                                />
                                            ) : null}

                                            <div className={cn(`absolute -right-1 bottom-0 p-0.5 bg-white dark:bg-background rounded-xs
                                           `,
                                                {
                                                    "bg-transparent p-0 rounded-full -bottom-1 -right-0.5": channel.connected
                                                }
                                            )}>
                                                {channel.connected ? (
                                                    <div className='size-2.5 bg-primary rounded-full' />
                                                ) : (
                                                    <HugeiconsIcon icon={PlusSignIcon} className="size-2!" />
                                                )}
                                            </div>
                                        </span>

                                        <span className='font-medium'>{channel.name}</span>
                                    </div>

                                    <Button variant={channel.connected ? "destructive" : "default"} size="sm"
                                        disabled={connectMutation.isPending || disconnectMutation.isPending}
                                        onClick={() => channel.connected ? handleDisconnect(channel.user_channel_id!) : handleConnect(channel.id!)}
                                    >
                                        {(connectMutation.isPending && connectMutation.variables === channel.id ||
                                          disconnectMutation.isPending && disconnectMutation.variables === channel.user_channel_id) && (
                                            <Spinner className='size-4' />
                                        )}
                                        {channel.connected ? "Disconnect" : "Connect"}
                                    </Button>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}






const ChannelsTab = () => {
    return (
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading channels...</div>}>
            <ChannelTabContent />
        </Suspense>
    )
}

export default ChannelsTab;
