import fs from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const number = Math.floor(Math.random() * 13) + 1;

    const fontPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'NotoSansJP-Bold.ttf'
    );
    const baseImagePath = path.join(
      process.cwd(),
      'public',
      'play',
      'ito',
      'templates',
      'number-base.png'
    );

    const [fontData, baseImageBuffer] = await Promise.all([
      fs.readFile(fontPath),
      fs.readFile(baseImagePath),
    ]);

    const baseImageBase64 = baseImageBuffer.toString('base64');
    const backgroundSrc = `data:image/png;base64,${baseImageBase64}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: 1060,
            height: 1484,
            position: 'relative',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'stretch',
            backgroundColor: '#ffffff',
          }}
        >
          <img
            src={backgroundSrc}
            alt=""
            width={1060}
            height={1484}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1f2937',
              fontSize: 360,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {String(number)}
          </div>
        </div>
      ),
      {
        width: 1060,
        height: 1484,
        fonts: [
          {
            name: 'Noto Sans JP',
            data: fontData,
            weight: 700,
            style: 'normal',
          },
        ],
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
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