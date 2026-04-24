import { renderNumberCardPng } from '@/lib/ito/renderNumberCard';
import { uploadPngToStorage, getPublicStorageUrl } from '@/lib/supabase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createVersion() {
  return Date.now();
}

function createSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function createNumberImagePath(version: number) {
  const suffix = createSuffix();
  return `ito/number/redirect_test_${version}_${suffix}.png`;
}

function getRandomNumber() {
  return Math.floor(Math.random() * 99) + 1;
}

export async function GET(request: Request) {
  try {
    const number = getRandomNumber();
    const pngBody = await renderNumberCardPng(number);

    const version = createVersion();
    const imagePath = createNumberImagePath(version);

    await uploadPngToStorage(imagePath, pngBody);

    const imageUrl = getPublicStorageUrl(imagePath);

    console.log(
      `[ito number redirect] number=${number} imageUrl=${imageUrl} request=${request.url}`
    );

    return new Response(null, {
      status: 302,
      headers: {
        Location: imageUrl,
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown number redirect error';

    console.error('[ito number redirect] error', message);

    return new Response(`Number redirect error: ${message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}