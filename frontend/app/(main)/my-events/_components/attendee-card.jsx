import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { format } from "date-fns";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Attendee Card Component
export function AttendeeCard({ registration }) {
  const { mutate: checkInAttendeeMutate, isLoading } = useConvexMutation();

  const handleManualCheckIn = async () => {
    try {
      const result = await checkInAttendeeMutate(
        `/tickets/${registration.qrCode}/checkin`,
        { method: "PATCH" }
      );
      if (result) {
        toast.success("Attendee checked in successfully");
      }
    } catch (error) {
      toast.error(error.message || "Failed to check in attendee");
    }
  };

  return (
    <Card className="py-0">
      <CardContent className="p-4 flex items-start gap-4">
        <div
          className={`mt-1 p-2 rounded-full ${
            registration.checkedIn ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          {registration.checkedIn ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{registration.attendeeName}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {registration.attendeeEmail}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              {registration.checkedIn ? "⏰ Checked in" : "📅 Registered"}{" "}
              {registration.checkedIn && registration.checkedInAt
                ? format(new Date(registration.checkedInAt), "PPp")
                : format(new Date(registration.registeredAt), "PPp")}
            </span>
            <span className="font-mono">QR: {registration.qrCode}</span>
          </div>
        </div>

        {!registration.checkedIn && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualCheckIn}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Check In
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
