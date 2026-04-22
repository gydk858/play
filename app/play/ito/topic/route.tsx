import fs from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
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

function createScaleNote(topic: ItoTopic) {
  const low = (topic.label_low ?? '').trim();
  const high = (topic.label_high ?? '').trim();

  if (low && high) {
    return `${low}  1 - 100  ${high}`;
  }

  return '1 - 100';
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
    const noteText = createScaleNote(topic);

    return new ImageResponse(
      (
        <div
          style={{
            width: '1060px',
            height: '1484px',
            display: 'flex',
            position: 'relative',
            backgroundImage: `url(data:image/png;base64,${backgroundBase64})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '330px',
              paddingBottom: '180px',
              paddingLeft: '110px',
              paddingRight: '110px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#ffffff',
                fontSize: 74,
                fontFamily: 'NotoSansJP',
                fontWeight: 700,
                lineHeight: 1.3,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxWidth: '100%',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              {topic.title}
            </div>

            <div
              style={{
                display: 'flex',
                color: '#f4d35e',
                fontSize: 28,
                fontFamily: 'NotoSansJP',
                fontWeight: 700,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxWidth: '100%',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              {noteText}
            </div>
          </div>
        </div>
      ),
      {
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
      }
    );
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