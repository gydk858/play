'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

type IssueCardButtonProps = {
  endpoint: string;
  label: string;
  successMessage: string;
  style?: CSSProperties;
};

export default function IssueCardButton({
  endpoint,
  label,
  successMessage,
  style,
}: IssueCardButtonProps) {
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
        throw new Error(data?.error ?? '発行に失敗しました。');
      }

      window.alert(successMessage);
      window.location.reload();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '発行に失敗しました。';

      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} style={style} disabled={loading}>
      {loading ? '発行中...' : label}
    </button>
  );
}