import { getAllTests } from "@/lib/db/tests"

export async function TestList() {
  const tests = await getAllTests()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">All Tests</h2>
      {tests.length === 0 ? (
        <p>No tests found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tests.map((test) => (
            <li key={test.id} className="py-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">{test.title}</h3>
                  <p className="text-gray-500">{test.description}</p>
                  <p className="text-sm text-gray-400">Topic: {test.topic}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {test.status}
                  </span>
                  <p className="text-sm text-gray-400">Duration: {test.duration} min</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
