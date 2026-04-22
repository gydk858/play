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

export async function GET() {
  const number = Math.floor(Math.random() * 13) + 1;

  const baseImagePath = path.join(
    process.cwd(),
    'public',
    'play',
    'ito',
    'templates',
    'number-base.png'
  );

  const baseImageBuffer = await fs.readFile(baseImagePath);
  const metadata = await sharp(baseImageBuffer).metadata();

  const width = metadata.width ?? 1060;
  const height = metadata.height ?? 1484;

  const fontSize = Math.round(width * 0.34);

  const svgText = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .number {
          font-size: ${fontSize}px;
          font-weight: 700;
          fill: #1f2937;
          font-family: "Arial", "Helvetica", sans-serif;
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

  return new Response(outputBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}