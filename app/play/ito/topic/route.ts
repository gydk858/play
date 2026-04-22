import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

type ItoTopic = {
  id: number;
  title: string;
  description: string | null;
  label_low: string | null;
  label_high: string | null;
  is_active: boolean;
  created_at: string;
};

function buildLines(text: string, maxCharsPerLine: number) {
  const sanitized = text.replace(/\r\n/g, '\n').trim();
  if (!sanitized) return [];

  const paragraphs = sanitized.split('\n');
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

function createScaleNote(topic: ItoTopic) {
  const low = (topic.label_low ?? '').trim();
  const high = (topic.label_high ?? '').trim();

  if (low && high) {
    return `${low}  1 - 100  ${high}`;
  }

  return '1 - 100';
}

function getTitleLayout(lineCount: number) {
  if (lineCount <= 1) {
    return {
      width: 860,
      left: 100,
      top: 290,
      dpi: 430,
      gap: 22,
    };
  }

  if (lineCount === 2) {
    return {
      width: 860,
      left: 100,
      top: 280,
      dpi: 390,
      gap: 20,
    };
  }

  if (lineCount === 3) {
    return {
      width: 860,
      left: 100,
      top: 255,
      dpi: 345,
      gap: 18,
    };
  }

  return {
    width: 860,
    left: 100,
    top: 235,
    dpi: 310,
    gap: 16,
  };
}

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

async function mergeLineImagesCentered(
  lines: string[],
  options: {
    font: string;
    fontfile: string;
    width: number;
    dpi: number;
    color: string;
    gap: number;
  }
) {
  if (lines.length === 0) {
    return null;
  }

  const lineBuffers = await Promise.all(
    lines.map((line) =>
      makeColoredTextImage({
        text: line || ' ',
        font: options.font,
        fontfile: options.fontfile,
        width: options.width,
        dpi: options.dpi,
        align: 'center',
        color: options.color,
      })
    )
  );

  const metas = await Promise.all(
    lineBuffers.map((buffer) => sharp(buffer).metadata())
  );

  const totalHeight =
    metas.reduce((sum, meta) => sum + (meta.height ?? 0), 0) +
    options.gap * Math.max(0, lineBuffers.length - 1);

  const canvas = sharp({
    create: {
      width: options.width,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  let currentTop = 0;
  const composites = lineBuffers.map((buffer, index) => {
    const meta = metas[index];
    const w = meta.width ?? options.width;
    const h = meta.height ?? 0;
    const left = Math.max(0, Math.round((options.width - w) / 2));
    const top = currentTop;
    currentTop += h + options.gap;

    return {
      input: buffer,
      left,
      top,
    };
  });

  return await canvas.composite(composites).png().toBuffer();
}

async function getTopicById(topicId: number) {
  const { data, error } = await supabase
    .from('ito_topics')
    .select(
      'id, title, description, label_low, label_high, is_active, created_at'
    )
    .eq('id', topicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ItoTopic | null;
}

async function getRandomActiveTopic() {
  const { data, error } = await supabase
    .from('ito_topics')
    .select(
      'id, title, description, label_low, label_high, is_active, created_at'
    )
    .eq('is_active', true);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const topics = data as ItoTopic[];
  return topics[Math.floor(Math.random() * topics.length)];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
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

    await readFile(fontPath);

    const baseImageBuffer = await readFile(baseImagePath);
    const baseImage = sharp(baseImageBuffer);

    const titleLines = buildLines(topic.title, 9);
    const noteLines = buildLines(createScaleNote(topic), 22);

    const titleLayout = getTitleLayout(titleLines.length);

    const titleTextImage = await mergeLineImagesCentered(titleLines, {
      font: 'Noto Sans JP',
      fontfile: fontPath,
      width: titleLayout.width,
      dpi: titleLayout.dpi,
      color: '#ffffff',
      gap: titleLayout.gap,
    });

    const titleShadowImage = await mergeLineImagesCentered(titleLines, {
      font: 'Noto Sans JP',
      fontfile: fontPath,
      width: titleLayout.width,
      dpi: titleLayout.dpi,
      color: 'rgba(0, 0, 0, 0.18)',
      gap: titleLayout.gap,
    });

    const noteTextImage = await mergeLineImagesCentered(noteLines, {
      font: 'Noto Sans JP',
      fontfile: fontPath,
      width: 820,
      dpi: 190,
      color: '#f4d35e',
      gap: 8,
    });

    const noteShadowImage = await mergeLineImagesCentered(noteLines, {
      font: 'Noto Sans JP',
      fontfile: fontPath,
      width: 820,
      dpi: 190,
      color: 'rgba(0, 0, 0, 0.18)',
      gap: 8,
    });

    const resultBuffer = await baseImage
      .composite([
        ...(titleShadowImage
          ? [
              {
                input: titleShadowImage,
                left: titleLayout.left + 2,
                top: titleLayout.top + 2,
              },
            ]
          : []),
        ...(titleTextImage
          ? [
              {
                input: titleTextImage,
                left: titleLayout.left,
                top: titleLayout.top,
              },
            ]
          : []),

        ...(noteShadowImage
          ? [{ input: noteShadowImage, left: 122, top: 1178 }]
          : []),
        ...(noteTextImage ? [{ input: noteTextImage, left: 120, top: 1176 }] : []),
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
      `Topic route error: ${
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