import fs from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';
import { createElement } from 'react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getNumberFontSize(number: number) {
  if (number >= 10) {
    return 460;
  }

  return 540;
}

export async function GET() {
  try {
    const number = Math.floor(Math.random() * 99) + 1;

    const [fontData, backgroundBuffer] = await Promise.all([
      fs.readFile(
        path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Bold.ttf')
      ),
      fs.readFile(
        path.join(
          process.cwd(),
          'public',
          'play',
          'ito',
          'templates',
          'number-base.png'
        )
      ),
    ]);

    const backgroundBase64 = backgroundBuffer.toString('base64');
    const fontSize = getNumberFontSize(number);

    const tree = createElement(
      'div',
      {
        style: {
          width: '1060px',
          height: '1484px',
          display: 'flex',
          position: 'relative',
          backgroundImage: `url(data:image/png;base64,${backgroundBase64})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        },
      },
      createElement(
        'div',
        {
          style: {
            position: 'absolute',
            left: '0',
            right: '0',
            top: '260px',
            height: '520px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          },
        },
        createElement(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1f2937',
              fontSize: `${fontSize}px`,
              fontFamily: 'NotoSansJP',
              fontWeight: 700,
              lineHeight: 1,
              textAlign: 'center',
            },
          },
          String(number)
        )
      )
    );

    return new ImageResponse(tree, {
      width: 1060,
      height: 1484,
      fonts: [
        {
          name: 'NotoSansJP',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
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