import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function makeColoredTextImage({
  text,
  font,
  fontfile,
  width,
  dpi,
  align = 'left',
  color = '#000000',
}: {
  text: string;
  font: string;
  fontfile: string;
  width: number;
  dpi: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
}) {
  const textMask = await sharp({
    text: {
      text,
      font,
      fontfile,
      width,
      rgba: true,
      dpi,
      align,
    },
  })
    .png()
    .ensureAlpha()
    .toBuffer();

  const meta = await sharp(textMask).metadata();
  const w = meta.width ?? width;
  const h = meta.height ?? 60;

  const colorImage = await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toBuffer();

  return await sharp(colorImage)
    .composite([
      {
        input: textMask,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
}

export async function GET() {
  try {
    const number = Math.floor(Math.random() * 13) + 1;

    const baseImagePath = path.join(
      process.cwd(),
      'public',
      'play',
      'ito',
      'templates',
      'number-base.png'
    );

    const fontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'NotoSansJP-Bold.ttf'
    );

    await readFile(fontPath);

    const baseImageBuffer = await readFile(baseImagePath);
    const baseImage = sharp(baseImageBuffer);

    const numberTextImage = await makeColoredTextImage({
      text: String(number),
      font: 'Noto Sans JP',
      fontfile: fontPath,
      width: 700,
      dpi: 320,
      align: 'center',
      color: '#1f2937',
    });

    const numberShadowImage = await makeColoredTextImage({
      text: String(number),
      font: 'Noto Sans JP',
      fontfile: fontPath,
      width: 700,
      dpi: 320,
      align: 'center',
      color: 'rgba(0, 0, 0, 0.12)',
    });

    const resultBuffer = await baseImage
      .composite([
        { input: numberShadowImage, left: 182, top: 470 },
        { input: numberTextImage, left: 180, top: 468 },
      ])
      .png()
      .toBuffer();

    return new Response(new Uint8Array(resultBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return new Response(
      `Number route error: ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}