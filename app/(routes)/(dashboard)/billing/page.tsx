import { ClerkLoaded, ClerkLoading, PricingTable } from "@clerk/nextjs"

const BillingPage = () => {
  return (
    <div className="w-full max-w-6xl px-6 py-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      <ClerkLoading>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ClerkLoading>

      <ClerkLoaded>
      <PricingTable
        for="user"
        newSubscriptionRedirectUrl="/billing"
      />
      </ClerkLoaded>
    </div>
  )
}

export default BillingPage