import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('ito_topics')
      .select('id, title')
      .eq('is_active', true);

    if (error) {
      throw new Error(error.message);
    }

    const topics = data ?? [];

    if (topics.length === 0) {
      const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>ito topic page</title>
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
</head>
<body style="margin:0; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; background:#000; color:#fff; font-family:sans-serif;">
  <div>有効なお題がありません。</div>
</body>
</html>
      `.trim();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    const picked = topics[Math.floor(Math.random() * topics.length)];
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const origin = new URL(request.url).origin;
    const imageUrl = `${origin}/play/ito/topic?topic_id=${picked.id}&page_preview=${token}`;

    console.log(
      `[ito topic page] picked topic_id=${picked.id} title=${picked.title} token=${token}`
    );

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>ito topic page</title>
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, proxy-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .frame {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    img {
      display: block;
      max-width: 92vw;
      max-height: 92vh;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="frame">
    <img
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(picked.title)}"
    />
  </div>
</body>
</html>
    `.trim();

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown topic-page error';

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>ito topic page error</title>
</head>
<body style="margin:0; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; background:#000; color:#fff; font-family:sans-serif;">
  <div>エラー: ${escapeHtml(message)}</div>
</body>
</html>
    `.trim();

    return new Response(html, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }
}