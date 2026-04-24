import fs from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';
import { createElement } from 'react';

export type ItoTopicCardInput = {
  title: string;
  label_low?: string | null;
  label_high?: string | null;
};

function createScaleNote(input: ItoTopicCardInput) {
  const low = (input.label_low ?? '').trim();
  const high = (input.label_high ?? '').trim();

  if (low && high) {
    return `${low}  1 - 100  ${high}`;
  }

  return '1 - 100';
}

function splitTextByLength(text: string, maxCharsPerLine: number) {
  const normalized = text.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }

    let current = '';

    for (const char of paragraph) {
      if (current.length >= maxCharsPerLine) {
        lines.push(current);
        current = char;
      } else {
        current += char;
      }
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

function getTitleLayout(title: string) {
  const length = title.replace(/\s+/g, '').length;

  if (length <= 8) {
    return {
      fontSize: 108,
      lineHeight: 1.16,
      maxCharsPerLine: 8,
    };
  }

  if (length <= 14) {
    return {
      fontSize: 94,
      lineHeight: 1.18,
      maxCharsPerLine: 7,
    };
  }

  if (length <= 20) {
    return {
      fontSize: 78,
      lineHeight: 1.2,
      maxCharsPerLine: 6,
    };
  }

  return {
    fontSize: 66,
    lineHeight: 1.22,
    maxCharsPerLine: 6,
  };
}

export async function renderTopicCardPng(input: ItoTopicCardInput) {
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
        'topic-base.png'
      )
    ),
  ]);

  const backgroundBase64 = backgroundBuffer.toString('base64');
  const noteText = createScaleNote(input);

  const titleLayout = getTitleLayout(input.title);
  const titleLines = splitTextByLength(input.title, titleLayout.maxCharsPerLine);

  const titleLineNodes = titleLines.map((line, index) =>
    createElement(
      'div',
      {
        key: `title-${index}`,
        style: {
          display: 'block',
          color: '#ffffff',
          fontSize: `${titleLayout.fontSize}px`,
          fontFamily: 'NotoSansJP',
          fontWeight: 700,
          lineHeight: titleLayout.lineHeight,
          textAlign: 'center',
          maxWidth: '100%',
        },
      },
      line
    )
  );

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
          left: '110px',
          right: '110px',
          top: '220px',
          height: '470px',
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '100%',
          },
        },
        ...titleLineNodes
      )
    ),
    createElement(
      'div',
      {
        style: {
          position: 'absolute',
          left: '140px',
          right: '140px',
          bottom: '115px',
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
            display: 'block',
            color: '#f4d35e',
            fontSize: '28px',
            fontFamily: 'NotoSansJP',
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: 'center',
            maxWidth: '100%',
          },
        },
        noteText
      )
    )
  );

  const imageResponse = new ImageResponse(tree, {
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
  });

  const arrayBuffer = await imageResponse.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}