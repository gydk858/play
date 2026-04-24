import { createClient } from '@supabase/supabase-js';
import { renderTopicCardPng } from '@/lib/ito/renderTopicCard';
import { uploadPngToStorage, getPublicStorageUrl } from '@/lib/supabase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type ItoTopic = {
  id: number;
  title: string;
  label_low: string | null;
  label_high: string | null;
};

function createVersion() {
  return Date.now();
}

function createSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function createTopicImagePath(version: number) {
  const suffix = createSuffix();
  return `ito/topic/topic_${version}_${suffix}.png`;
}

async function getRandomActiveTopic() {
  const { data, error } = await supabase
    .from('ito_topics')
    .select('id, title, label_low, label_high')
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

async function getCurrentTopicVersion() {
  const { data, error } = await supabase
    .from('ito_issue_state')
    .select('image_version')
    .eq('card_type', 'topic')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.image_version ?? 0;
}

export async function POST() {
  try {
    const topic = await getRandomActiveTopic();

    if (!topic) {
      return Response.json(
        { ok: false, error: 'No active topics found' },
        { status: 404 }
      );
    }

    const pngBody = await renderTopicCardPng({
      title: topic.title,
      label_low: topic.label_low,
      label_high: topic.label_high,
    });

    const versionBase = createVersion();
    const nextVersion = (await getCurrentTopicVersion()) + 1;
    const imagePath = createTopicImagePath(versionBase);

    await uploadPngToStorage(imagePath, pngBody);

    const imageUrl = getPublicStorageUrl(imagePath);
    const issuedAt = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('ito_issue_state')
      .upsert(
        {
          card_type: 'topic',
          current_image_path: imagePath,
          current_image_url: imageUrl,
          image_version: nextVersion,
          image_updated_at: issuedAt,
          current_topic_id: topic.id,
          current_topic_text: topic.title,
          current_number_value: null,
          issued_at: issuedAt,
          updated_at: issuedAt,
        },
        {
          onConflict: 'card_type',
        }
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return Response.json({
      ok: true,
      card_type: 'topic',
      topic_id: topic.id,
      topic_text: topic.title,
      image_path: imagePath,
      image_url: imageUrl,
      image_version: nextVersion,
      issued_at: issuedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown topic issue error';

    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}