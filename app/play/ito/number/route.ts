import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createEmbeddedFontCss(fontBase64: string) {
  return `
    @font-face {
      font-family: 'NotoSansJPEmbedded';
      src: url("data:font/ttf;base64,${fontBase64}") format('truetype');
      font-weight: 700;
      font-style: normal;
    }
  `;
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

    const [baseImageBuffer, fontBuffer] = await Promise.all([
      fs.readFile(baseImagePath),
      fs.readFile(fontPath),
    ]);

    const fontBase64 = fontBuffer.toString('base64');

    const metadata = await sharp(baseImageBuffer).metadata();

    const width = metadata.width ?? 1060;
    const height = metadata.height ?? 1484;

    const fontSize = Math.round(width * 0.34);

    const svgText = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          ${createEmbeddedFontCss(fontBase64)}

          .number {
            font-size: ${fontSize}px;
            font-weight: 700;
            fill: #1f2937;
            font-family: 'NotoSansJPEmbedded', sans-serif;
          }
        </style>

        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          dominant-baseline="middle"
          class="number"
        >${escapeXml(String(number))}</text>
      </svg>
    `;

    const outputBuffer = await sharp(baseImageBuffer)
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    const body = new Uint8Array(outputBuffer);

    return new Response(body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown number route error';

    return new Response(`Number route error: ${message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}