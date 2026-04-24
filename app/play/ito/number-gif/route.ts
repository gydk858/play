import sharp from 'sharp';
import { renderNumberCardPng } from '@/lib/ito/renderNumberCard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getRandomNumber() {
  return Math.floor(Math.random() * 99) + 1;
}

export async function GET(request: Request) {
  try {
    const number = getRandomNumber();

    console.log(
      `[ito number gif] request=${new Date().toISOString()} number=${number} url=${request.url}`
    );

    // 既存の数字カードPNGを生成
    const pngResult = await renderNumberCardPng(number);
    const pngBuffer = Buffer.isBuffer(pngResult)
      ? pngResult
      : Buffer.from(pngResult);

    // PNG → GIF へ変換（1フレームGIF）
    const gifBuffer = await sharp(pngBuffer).gif().toBuffer();

    return new Response(new Uint8Array(gifBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown GIF generation error';

    console.error('[ito number gif] error', message);

    return new Response(`Number gif error: ${message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}