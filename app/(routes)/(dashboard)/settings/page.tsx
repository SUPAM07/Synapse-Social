"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfile, useUser } from "@clerk/nextjs"
import { Layers, Palette, User } from "lucide-react"
import ChannelsTab from "@/components/settings/channels-tab"
import { useTheme } from "next-themes"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const SettingsPage = () => {
  const { user } = useUser()
  const { theme, setTheme } = useTheme()
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto w-full h-full">
        <div className="py-4">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        <div>
          <Tabs defaultValue="channels">
            <div className="mb-6 w-full border-b">
              <TabsList variant="line" className="w-fit space-x-4
              group-data-horizontal/tabs:h-12
              ">
                <TabsTrigger value="profile">
                  <User className="size-4" />
                  Profile</TabsTrigger>
                <TabsTrigger value="channels">
                  <Layers className="size-4" />
                  Channels</TabsTrigger>
                <TabsTrigger value="appearance">
                  <Palette className="size-4" />
                  Appearance</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Your Profile
                  </CardTitle>
                  <CardDescription>Managr youe account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        className="h-16 w-16 rounded-full"
                        width={64}
                        height={64}
                      />
                    ):(
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <User className="size-8 text-muted-foreground" />
                      </div>
                    )}

                    <div>
                      <p className="font-medium">{user?.fullName || "No name set"}</p>
                      <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>
                   <div className="mt-6">
                    <UserProfile
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                          card: "border-0 shadow-none",
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="channels">
              <ChannelsTab  />
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how Lemon AI looks for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="theme">Dark mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark theme
                      </p>
                    </div>
                    <Switch
                      id="theme"
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage