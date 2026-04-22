'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';

type CopyButtonProps = {
  text: string;
};

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert('コピーに失敗しました。');
    }
  }

  return (
    <button type="button" onClick={handleClick} style={buttonStyle}>
      {copied ? 'コピーしました' : 'コピー'}
    </button>
  );
}

const buttonStyle: CSSProperties = {
  padding: '10px 14px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #5ab8ff 0%, #4c78ff 100%)',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  boxShadow: '0 10px 20px rgba(92, 144, 255, 0.2)',
};