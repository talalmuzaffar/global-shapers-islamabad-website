// GET /img/<key> -> streams the object from R2 (public, cached).
export async function onRequest(context) {
  const { params, env } = context;
  const segs = Array.isArray(params.path) ? params.path : [params.path];
  const key = segs.join('/');

  const object = await env.MEDIA.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
