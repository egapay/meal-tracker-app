/**
 * Retries a failed read a few times before giving up.
 *
 * A Home Screen PWA often issues its first request before iOS has the network
 * fully up, or while supabase-js is still refreshing an expired access token in
 * the background. Both fail instantly rather than timing out, and both succeed
 * a few hundred milliseconds later -- which is why switching tabs and back
 * "fixed" it: that remount was a manual retry.
 *
 * Reads only. Never wrap a mutation in this: an insert that succeeded but whose
 * response was lost would be retried into a duplicate row.
 */
export async function withRetry<T>(read: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await read()
    } catch (error) {
      lastError = error
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
      }
    }
  }

  throw lastError
}
