'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

type SyncImageButtonProps = {
  endpoint: string;
  label: string;
  successLabel: string;
  style?: CSSProperties;
};

export default function SyncImageButton({
  endpoint,
  label,
  successLabel,
  style,
}: SyncImageButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    try {
      setLoading(true);

      const response = await fetch(endpoint, {
        method: 'POST',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error ?? '同期に失敗しました。');
      }

      window.alert(successLabel);
      window.location.reload();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '同期に失敗しました。';

      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} style={style} disabled={loading}>
      {loading ? '同期中...' : label}
    </button>
  );
}