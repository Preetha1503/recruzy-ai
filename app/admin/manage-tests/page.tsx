import { getAllTests } from "@/lib/db/tests"
import { getAllUsers } from "@/lib/db/users"
import { TestList } from "@/components/tests/test-list"
import { AssignTestForm } from "@/components/admin/assign-test-form"

export default async function ManageTestsPage() {
  const tests = await getAllTests()
  const users = await getAllUsers()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Tests</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <TestList />
        </div>
        <div>
          <AssignTestForm tests={tests} users={users} />
        </div>
      </div>
    </div>
  )
}
