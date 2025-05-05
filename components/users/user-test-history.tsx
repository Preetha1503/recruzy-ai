import { getTestResultsByUserId } from "@/lib/db/test-results"
import { getTestById } from "@/lib/db/tests"

export async function UserTestHistory({ userId }: { userId: string }) {
  const testResults = await getTestResultsByUserId(userId)

  // Fetch test details for each result
  const resultsWithTestDetails = await Promise.all(
    testResults.map(async (result) => {
      const test = await getTestById(result.test_id)
      return {
        ...result,
        test,
      }
    }),
  )

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Test History</h2>
      {resultsWithTestDetails.length === 0 ? (
        <p>No test history found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resultsWithTestDetails.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{result.test?.title || "Unknown Test"}</div>
                    <div className="text-sm text-gray-500">{result.test?.topic || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.score}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Math.floor(result.time_taken / 60)} min {result.time_taken % 60} sec
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(result.completed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
