// POST /api/verify — checks the admin password without changing anything.
// (Used by the app to gate entering Admin mode. Real enforcement is still in
// save.js, which password-checks every write.)
export async function onRequestPost({ request, env }) {
  const pw = request.headers.get('x-admin-password') || '';
  const ok = !!env.ADMIN_PASSWORD && pw === env.ADMIN_PASSWORD;
  return new Response(ok ? 'ok' : 'no', { status: ok ? 200 : 401 });
}
