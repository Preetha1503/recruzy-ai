import { getUserById } from "@/lib/db/users"
import { UserTestHistory } from "@/components/users/user-test-history"
import { notFound } from "next/navigation"

interface UserHistoryPageProps {
  params: {
    id: string
  }
}

export default async function UserHistoryPage({ params }: UserHistoryPageProps) {
  const user = await getUserById(params.id)

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Test History for {user.name || user.email}</h1>

      <UserTestHistory userId={user.id} />
    </div>
  )
}
