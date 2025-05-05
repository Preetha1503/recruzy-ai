import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Users Card Skeleton */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>

          {/* Active Users Card Skeleton */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>

          {/* Average Score Card Skeleton */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
