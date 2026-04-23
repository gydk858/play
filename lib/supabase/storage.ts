import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function uploadPngToStorage(
  path: string,
  buffer: Buffer | Uint8Array
) {
  const supabase = createSupabaseServerClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET!;

  const body = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

export function getPublicStorageUrl(path: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET!;

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}