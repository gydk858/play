import Link from 'next/link';
import type { CSSProperties } from 'react';

export default function AdminPlayPage() {
  return (
    <main style={pageStyle}>
      <div style={backgroundCircle1} />
      <div style={backgroundCircle2} />
      <div style={backgroundCircle3} />

      <section style={heroCardStyle}>
        <h1 style={heroTitleStyle}>プレイ管理</h1>

        <p style={heroTextStyle}>
          ゲーム機能の管理先を、ここから選べます。
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>ゲーム一覧</h2>

        <div style={gameGridStyle}>
          <article style={gameCardStyle}>
            <div style={iconWrapStyle}>🎴</div>

            <div style={{ flex: 1 }}>
              <h3 style={cardTitleStyle}>ito</h3>
              <p style={cardTextStyle}>
                お題カードと数字カードを使って遊ぶゲームです。
              </p>

              <div style={buttonRowStyle}>
                <Link href="/admin/play/ito" style={primarySmallButtonStyle}>
                  管理画面を開く
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  padding: '32px 20px 48px',
  background:
    'linear-gradient(180deg, #dff4ff 0%, #c7e8ff 35%, #eef8ff 100%)',
  position: 'relative',
  overflow: 'hidden',
};

const backgroundCircle1: CSSProperties = {
  position: 'absolute',
  top: '-80px',
  right: '-60px',
  width: '220px',
  height: '220px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.35)',
  pointerEvents: 'none',
};

const backgroundCircle2: CSSProperties = {
  position: 'absolute',
  top: '220px',
  left: '-70px',
  width: '180px',
  height: '180px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.25)',
  pointerEvents: 'none',
};

const backgroundCircle3: CSSProperties = {
  position: 'absolute',
  bottom: '-60px',
  right: '15%',
  width: '160px',
  height: '160px',
  borderRadius: '999px',
  background: 'rgba(255, 255, 255, 0.22)',
  pointerEvents: 'none',
};

const heroCardStyle: CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto 24px',
  background: 'linear-gradient(135deg, #55b7ff 0%, #5b8dff 100%)',
  borderRadius: '28px',
  padding: '32px',
  boxShadow: '0 18px 40px rgba(66, 124, 186, 0.25)',
  color: '#ffffff',
  position: 'relative',
  zIndex: 1,
};

const heroTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: '40px',
  lineHeight: 1.2,
};

const heroTextStyle: CSSProperties = {
  margin: '0',
  fontSize: '16px',
  lineHeight: 1.8,
  opacity: 0.98,
};

const sectionStyle: CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto 24px',
  background: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(8px)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 14px 30px rgba(100, 150, 200, 0.12)',
  position: 'relative',
  zIndex: 1,
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 18px',
  fontSize: '24px',
  color: '#2563eb',
};

const gameGridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
};

const gameCardStyle: CSSProperties = {
  display: 'flex',
  gap: '18px',
  alignItems: 'flex-start',
  background: 'linear-gradient(180deg, #f8fdff 0%, #eef7ff 100%)',
  border: '1px solid #d6eaff',
  borderRadius: '22px',
  padding: '20px',
};

const iconWrapStyle: CSSProperties = {
  width: '72px',
  height: '72px',
  minWidth: '72px',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '34px',
  background: 'linear-gradient(135deg, #7fd1ff 0%, #5c90ff 100%)',
  boxShadow: '0 10px 20px rgba(92, 144, 255, 0.25)',
};

const cardTitleStyle: CSSProperties = {
  margin: '4px 0 10px',
  fontSize: '24px',
  color: '#1f4bb8',
};

const cardTextStyle: CSSProperties = {
  margin: '0 0 14px',
  lineHeight: 1.8,
  color: '#35537b',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const primarySmallButtonStyle: CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #5ab8ff 0%, #4c78ff 100%)',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: '12px',
  fontWeight: 700,
};