// POST /api/save  — write scores to KV. Protected by a shared password.
// Send the password in the `x-admin-password` header; it is checked against the
// ADMIN_PASSWORD secret (set in the Pages project, never shipped to the browser).
// Body must be JSON: { [tournamentId]: { [gameNumber]: [score1, score2] } }
export async function onRequestPost({ request, env }) {
  const pw = request.headers.get('x-admin-password') || '';
  if (!env.ADMIN_PASSWORD || pw !== env.ADMIN_PASSWORD) {
    return new Response('unauthorized', { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('bad json', { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new Response('expected an object', { status: 400 });
  }
  if (!env.RESULTS) {
    // KV namespace isn't bound to this deployment — without this guard the
    // .put() below throws an opaque 500. See README-hosting.md (bind RESULTS,
    // then redeploy so Functions pick it up).
    return new Response('results store not configured', { status: 503 });
  }
  await env.RESULTS.put('results', JSON.stringify(body));
  return new Response('ok', { headers: { 'content-type': 'text/plain' } });
}
