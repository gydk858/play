import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log(
      '[ito topic fixed png] request',
      new Date().toISOString(),
      request.url
    );

    const imagePath = path.join(
      process.cwd(),
      'public',
      'play',
      'ito',
      'templates',
      'topic-base.png'
    );

    const imageBuffer = await fs.readFile(imagePath);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(imageBuffer.byteLength),
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown fixed png route error';

    console.error('[ito topic fixed png] error', message);

    return new Response(`Fixed PNG route error: ${message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}