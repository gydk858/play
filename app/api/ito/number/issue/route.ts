import { createClient } from '@supabase/supabase-js';
import { renderNumberCardPng } from '@/lib/ito/renderNumberCard';
import { uploadPngToStorage, getPublicStorageUrl } from '@/lib/supabase/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function createVersion() {
  return Date.now();
}

function createSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function createNumberImagePath(version: number) {
  const suffix = createSuffix();
  return `ito/number/number_${version}_${suffix}.png`;
}

function getRandomNumber() {
  return Math.floor(Math.random() * 99) + 1;
}

async function getCurrentNumberVersion() {
  const { data, error } = await supabase
    .from('ito_issue_state')
    .select('image_version')
    .eq('card_type', 'number')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.image_version ?? 0;
}

export async function POST() {
  try {
    const number = getRandomNumber();

    const pngBody = await renderNumberCardPng(number);

    const versionBase = createVersion();
    const nextVersion = (await getCurrentNumberVersion()) + 1;
    const imagePath = createNumberImagePath(versionBase);

    await uploadPngToStorage(imagePath, pngBody);

    const imageUrl = getPublicStorageUrl(imagePath);
    const issuedAt = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('ito_issue_state')
      .upsert(
        {
          card_type: 'number',
          current_image_path: imagePath,
          current_image_url: imageUrl,
          image_version: nextVersion,
          image_updated_at: issuedAt,
          current_topic_id: null,
          current_topic_text: null,
          current_number_value: number,
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
      card_type: 'number',
      number_value: number,
      image_path: imagePath,
      image_url: imageUrl,
      image_version: nextVersion,
      issued_at: issuedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown number issue error';

    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}