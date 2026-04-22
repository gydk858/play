import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type ItoTopic = {
  id: number;
  title: string;
  description: string | null;
  label_low: string | null;
  label_high: string | null;
  is_active: boolean;
  created_at: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function createCenteredWrappedTspans(
  text: string,
  options: {
    startY: number;
    lineHeight: number;
    maxCharsPerLine: number;
  }
) {
  const sanitized = text.replace(/\r\n/g, '\n').trim();
  if (!sanitized) return '';

  const paragraphs = sanitized.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }

    let current = '';
    for (const char of paragraph) {
      if (current.length >= options.maxCharsPerLine) {
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

  return lines
    .map((line, index) => {
      const y = options.startY + options.lineHeight * index;
      return `<tspan x="50%" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('');
}

function createScaleNote(topic: ItoTopic) {
  const low = (topic.label_low ?? '').trim();
  const high = (topic.label_high ?? '').trim();

  if (low && high) {
    return `${low}  1 - 100  ${high}`;
  }

  return '1 - 100';
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

async function getTopicById(topicId: number) {
  const { data, error } = await supabase
    .from('ito_topics')
    .select(
      'id, title, description, label_low, label_high, is_active, created_at'
    )
    .eq('id', topicId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ItoTopic | null;
}

async function getRandomActiveTopic() {
  const { data, error } = await supabase
    .from('ito_topics')
    .select(
      'id, title, description, label_low, label_high, is_active, created_at'
    )
    .eq('is_active', true);

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return null;
  }

  const topics = data as ItoTopic[];
  return topics[Math.floor(Math.random() * topics.length)];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const topicIdParam = url.searchParams.get('topic_id');
    const topicId = topicIdParam ? Number(topicIdParam) : null;

    let topic: ItoTopic | null = null;

    if (topicId && Number.isFinite(topicId)) {
      topic = await getTopicById(topicId);
    } else {
      topic = await getRandomActiveTopic();
    }

    if (!topic) {
      return new Response('Topic not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    }

    const baseImagePath = path.join(
      process.cwd(),
      'public',
      'play',
      'ito',
      'templates',
      'topic-base.png'
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

    const titleFontSize = Math.round(width * 0.07);
    const noteFontSize = Math.round(width * 0.026);

    const titleStartY = Math.round(height * 0.30);
    const titleLineHeight = Math.round(titleFontSize * 1.3);

    const noteText = createScaleNote(topic);
    const noteStartY = Math.round(height * 0.84);
    const noteLineHeight = Math.round(noteFontSize * 1.4);

    const titleTspans = createCenteredWrappedTspans(topic.title, {
      startY: titleStartY,
      lineHeight: titleLineHeight,
      maxCharsPerLine: 9,
    });

    const noteTspans = createCenteredWrappedTspans(noteText, {
      startY: noteStartY,
      lineHeight: noteLineHeight,
      maxCharsPerLine: 22,
    });

    const svgText = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          ${createEmbeddedFontCss(fontBase64)}

          .title {
            font-size: ${titleFontSize}px;
            font-weight: 700;
            fill: #ffffff;
            font-family: 'NotoSansJPEmbedded', sans-serif;
          }

          .note {
            font-size: ${noteFontSize}px;
            font-weight: 700;
            fill: #f4d35e;
            font-family: 'NotoSansJPEmbedded', sans-serif;
          }
        </style>

        <text class="title" text-anchor="middle">
          ${titleTspans}
        </text>

        <text class="note" text-anchor="middle">
          ${noteTspans}
        </text>
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
      error instanceof Error ? error.message : 'Unknown topic route error';

    return new Response(`Topic route error: ${message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}