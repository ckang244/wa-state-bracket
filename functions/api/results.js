// GET /api/results  — public read of the current scores from KV.
// Returns a JSON map: { [tournamentId]: { [gameNumber]: [score1, score2] } }
// Requires a KV namespace bound as RESULTS (see README-hosting.md).
export async function onRequestGet({ env }) {
  const data = (env.RESULTS && (await env.RESULTS.get('results'))) || '{}';
  return new Response(data, {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}
