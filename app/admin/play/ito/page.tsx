import Link from 'next/link';
import type { CSSProperties } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ConfirmSubmitButton from './ConfirmSubmitButton';
import CopyButton from './CopyButton';

type ItoTopic = {
  id: number;
  title: string;
  description: string | null;
  label_low: string | null;
  label_high: string | null;
  is_active: boolean;
  created_at: string;
};

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
};

function buildRedirectUrl(message: string) {
  return `/admin/play/ito?status=success&message=${encodeURIComponent(message)}`;
}

async function createTopic(formData: FormData) {
  'use server';

  const supabase = createSupabaseServerClient();

  const title = String(formData.get('title') ?? '').trim();
  const labelLow = String(formData.get('label_low') ?? '').trim();
  const labelHigh = String(formData.get('label_high') ?? '').trim();
  const isActive = formData.get('is_active') === 'on';

  if (!title) {
    redirect('/admin/play/ito?status=error&message=お題は必須です。');
  }

  const { error } = await supabase.from('ito_topics').insert({
    title,
    description: null,
    label_low: labelLow || null,
    label_high: labelHigh || null,
    is_active: isActive,
  });

  if (error) {
    redirect(
      `/admin/play/ito?status=error&message=${encodeURIComponent(
        `お題の追加に失敗しました: ${error.message}`
      )}`
    );
  }

  revalidatePath('/admin/play/ito');
  revalidatePath('/play/ito/topic');
  redirect(buildRedirectUrl('お題を追加しました。'));
}

async function updateTopic(formData: FormData) {
  'use server';

  const supabase = createSupabaseServerClient();

  const id = Number(formData.get('id'));
  const title = String(formData.get('title') ?? '').trim();
  const labelLow = String(formData.get('label_low') ?? '').trim();
  const labelHigh = String(formData.get('label_high') ?? '').trim();
  const isActive = formData.get('is_active') === 'on';

  if (!id) {
    redirect('/admin/play/ito?status=error&message=IDが取得できませんでした。');
  }

  if (!title) {
    redirect('/admin/play/ito?status=error&message=お題は必須です。');
  }

  const { error } = await supabase
    .from('ito_topics')
    .update({
      title,
      description: null,
      label_low: labelLow || null,
      label_high: labelHigh || null,
      is_active: isActive,
    })
    .eq('id', id);

  if (error) {
    redirect(
      `/admin/play/ito?status=error&message=${encodeURIComponent(
        `お題の更新に失敗しました: ${error.message}`
      )}`
    );
  }

  revalidatePath('/admin/play/ito');
  revalidatePath('/play/ito/topic');
  redirect(buildRedirectUrl(`ID ${id} を更新しました。`));
}

async function toggleTopicActive(formData: FormData) {
  'use server';

  const supabase = createSupabaseServerClient();

  const id = Number(formData.get('id'));
  const nextIsActive = String(formData.get('next_is_active')) === 'true';

  if (!id) {
    redirect('/admin/play/ito?status=error&message=IDが取得できませんでした。');
  }

  const { error } = await supabase
    .from('ito_topics')
    .update({
      is_active: nextIsActive,
    })
    .eq('id', id);

  if (error) {
    redirect(
      `/admin/play/ito?status=error&message=${encodeURIComponent(
        `有効状態の更新に失敗しました: ${error.message}`
      )}`
    );
  }

  revalidatePath('/admin/play/ito');
  revalidatePath('/play/ito/topic');
  redirect(
    buildRedirectUrl(
      nextIsActive
        ? `ID ${id} を有効化しました。`
        : `ID ${id} を無効化しました。`
    )
  );
}

async function deleteTopic(formData: FormData) {
  'use server';

  const supabase = createSupabaseServerClient();

  const id = Number(formData.get('id'));

  if (!id) {
    redirect('/admin/play/ito?status=error&message=IDが取得できませんでした。');
  }

  const { error } = await supabase.from('ito_topics').delete().eq('id', id);

  if (error) {
    redirect(
      `/admin/play/ito?status=error&message=${encodeURIComponent(
        `お題の削除に失敗しました: ${error.message}`
      )}`
    );
  }

  revalidatePath('/admin/play/ito');
  revalidatePath('/play/ito/topic');
  redirect(buildRedirectUrl(`ID ${id} を削除しました。`));
}

export default async function AdminPlayItoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const status = params.status ?? '';
  const message = params.message ?? '';

  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const proto =
    headerList.get('x-forwarded-proto') ??
    (host.includes('localhost') ? 'http' : 'https');

  const baseUrl = `${proto}://${host}`;
  const topicUrl = `${baseUrl}/play/ito/topic`;
  const numberUrl = `${baseUrl}/play/ito/number`;

  const previewToken = Date.now();

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('ito_topics')
    .select(
      'id, title, description, label_low, label_high, is_active, created_at'
    )
    .order('id', { ascending: true });

  const topics = (data ?? []) as ItoTopic[];

  return (
    <main style={pageStyle}>
      <div style={backgroundCircle1} />
      <div style={backgroundCircle2} />
      <div style={backgroundCircle3} />

      <section style={heroCardStyle}>
        <div style={heroTopRowStyle}>
          <div>
            <h1 style={heroTitleStyle}>ito 管理</h1>
            <p style={heroTextStyle}>
              ito で使うお題カードを、ここで追加・編集・整理できます。
            </p>
          </div>

          <div style={heroButtonWrapStyle}>
            <Link href="/admin/play" style={backLinkStyle}>
              プレイ管理へ戻る
            </Link>
          </div>
        </div>
      </section>

      {message ? (
        <section
          style={
            status === 'error' ? feedbackErrorCardStyle : feedbackCardStyle
          }
        >
          <strong>{status === 'error' ? 'エラー' : '更新完了'}</strong>
          <div style={{ marginTop: '6px' }}>{message}</div>
        </section>
      ) : null}

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>GTA5 印刷機に渡すURL</h2>
        <p style={sectionTextStyle}>
          下のURLをそのまま使うと、アクセス時にカード画像が返ります。
        </p>

        <div style={urlBlockWrapStyle}>
          <div style={urlCardStyle}>
            <div style={urlLabelStyle}>お題カードURL</div>
            <div style={urlRowStyle}>
              <div style={urlValueStyle}>{topicUrl}</div>
              <CopyButton text={topicUrl} />
            </div>
          </div>

          <div style={urlCardStyle}>
            <div style={urlLabelStyle}>数字カードURL</div>
            <div style={urlRowStyle}>
              <div style={urlValueStyle}>{numberUrl}</div>
              <CopyButton text={numberUrl} />
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>お題を追加</h2>

        <form action={createTopic} style={formGridStyle}>
          <div style={fieldBlockStyle}>
            <label htmlFor="new-title" style={labelStyle}>
              お題
            </label>
            <input
              id="new-title"
              name="title"
              type="text"
              required
              placeholder="例: 無人島に持っていきたいもの"
              style={inputStyle}
            />
          </div>

          <div style={twoColumnStyle}>
            <div style={fieldBlockStyle}>
              <label htmlFor="new-label-low" style={labelStyle}>
                1側の言葉
              </label>
              <input
                id="new-label-low"
                name="label_low"
                type="text"
                placeholder="例: いらない"
                style={inputStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label htmlFor="new-label-high" style={labelStyle}>
                100側の言葉
              </label>
              <input
                id="new-label-high"
                name="label_high"
                type="text"
                placeholder="例: 持っていきたい"
                style={inputStyle}
              />
            </div>
          </div>

          <label style={checkboxLabelStyle}>
            <input name="is_active" type="checkbox" defaultChecked />
            有効にする
          </label>

          <div>
            <button type="submit" style={primaryButtonStyle}>
              お題を追加
            </button>
          </div>
        </form>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderRowStyle}>
          <h2 style={sectionTitleStyle}>お題一覧</h2>
          <div style={countBadgeStyle}>{topics.length}件</div>
        </div>

        {error ? (
          <p style={errorTextStyle}>読み込みエラー: {error.message}</p>
        ) : topics.length === 0 ? (
          <div style={emptyCardStyle}>
            <div style={emptyIconStyle}>🫧</div>
            <p style={emptyTextStyle}>まだお題が登録されていません。</p>
          </div>
        ) : (
          <div style={accordionListStyle}>
            {topics.map((topic) => (
              <details key={topic.id} style={accordionCardStyle}>
                <summary style={accordionSummaryStyle}>
                  <div style={summaryMainStyle}>
                    <div style={summaryBadgeRowStyle}>
                      <span style={idBadgeStyle}>ID {topic.id}</span>
                      <span
                        style={
                          topic.is_active ? activeBadgeStyle : inactiveBadgeStyle
                        }
                      >
                        {topic.is_active ? '有効' : '無効'}
                      </span>
                    </div>

                    <div style={summaryTitleStyle}>{topic.title}</div>

                    <div style={summaryMetaRowStyle}>
                      <span style={summaryMetaItemStyle}>
                        1側: {topic.label_low?.trim() || '未設定'}
                      </span>
                      <span style={summaryMetaItemStyle}>
                        100側: {topic.label_high?.trim() || '未設定'}
                      </span>
                    </div>
                  </div>

                  <div style={summaryPreviewWrapStyle}>
                    <img
                      src={`/play/ito/topic?topic_id=${topic.id}&preview=${previewToken}-${topic.id}`}
                      alt={`${topic.title} のプレビュー`}
                      style={summaryPreviewImageStyle}
                    />
                    <div style={summaryHintStyle}>クリックで編集を開く</div>
                  </div>
                </summary>

                <div style={accordionBodyStyle}>
                  <div style={editPreviewGridStyle}>
                    <form action={updateTopic} style={compactFormStyle}>
                      <input type="hidden" name="id" value={topic.id} />

                      <div style={fieldBlockStyle}>
                        <label
                          htmlFor={`title-${topic.id}`}
                          style={labelStyle}
                        >
                          お題
                        </label>
                        <input
                          id={`title-${topic.id}`}
                          name="title"
                          type="text"
                          defaultValue={topic.title}
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={twoColumnStyle}>
                        <div style={fieldBlockStyle}>
                          <label
                            htmlFor={`label-low-${topic.id}`}
                            style={labelStyle}
                          >
                            1側の言葉
                          </label>
                          <input
                            id={`label-low-${topic.id}`}
                            name="label_low"
                            type="text"
                            defaultValue={topic.label_low ?? ''}
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldBlockStyle}>
                          <label
                            htmlFor={`label-high-${topic.id}`}
                            style={labelStyle}
                          >
                            100側の言葉
                          </label>
                          <input
                            id={`label-high-${topic.id}`}
                            name="label_high"
                            type="text"
                            defaultValue={topic.label_high ?? ''}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={compactBottomRowStyle}>
                        <label style={checkboxLabelStyle}>
                          <input
                            name="is_active"
                            type="checkbox"
                            defaultChecked={topic.is_active}
                          />
                          有効にする
                        </label>

                        <div style={topicMetaStyle}>
                          作成日時: {topic.created_at}
                        </div>
                      </div>

                      <div style={buttonRowStyle}>
                        <button type="submit" style={primaryButtonStyle}>
                          保存
                        </button>
                      </div>
                    </form>

                    <div style={compactPreviewAreaStyle}>
                      <div style={previewTitleStyle}>プレビュー</div>
                      <img
                        src={`/play/ito/topic?topic_id=${topic.id}&preview=${previewToken}-large-${topic.id}`}
                        alt={`${topic.title} のプレビュー`}
                        style={previewImageStyle}
                      />
                    </div>
                  </div>

                  <div style={actionRowStyle}>
                    <form action={toggleTopicActive}>
                      <input type="hidden" name="id" value={topic.id} />
                      <input
                        type="hidden"
                        name="next_is_active"
                        value={topic.is_active ? 'false' : 'true'}
                      />
                      <button
                        type="submit"
                        style={
                          topic.is_active
                            ? inactiveActionButtonStyle
                            : activeActionButtonStyle
                        }
                      >
                        {topic.is_active ? '無効化する' : '有効化する'}
                      </button>
                    </form>

                    <form action={deleteTopic}>
                      <input type="hidden" name="id" value={topic.id} />
                      <ConfirmSubmitButton
                        message={`ID ${topic.id}「${topic.title}」を削除します。よろしいですか？`}
                        style={dangerButtonStyle}
                      >
                        削除
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
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
  maxWidth: '1200px',
  margin: '0 auto 24px',
  background: 'linear-gradient(135deg, #55b7ff 0%, #5b8dff 100%)',
  borderRadius: '28px',
  padding: '32px',
  boxShadow: '0 18px 40px rgba(66, 124, 186, 0.25)',
  color: '#ffffff',
  position: 'relative',
  zIndex: 1,
};

const heroTopRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
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

const heroButtonWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const backLinkStyle: CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  background: '#ffffff',
  color: '#3173dd',
  padding: '12px 18px',
  borderRadius: '999px',
  fontWeight: 700,
  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.12)',
};

const feedbackCardStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto 24px',
  background: 'linear-gradient(180deg, #ecfbf4 0%, #dff7eb 100%)',
  border: '1px solid #b7ebcb',
  borderRadius: '18px',
  padding: '16px 18px',
  color: '#136c3d',
  position: 'relative',
  zIndex: 1,
  boxShadow: '0 10px 24px rgba(70, 160, 110, 0.12)',
};

const feedbackErrorCardStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto 24px',
  background: 'linear-gradient(180deg, #fff5f8 0%, #ffe8ef 100%)',
  border: '1px solid #ffc4d6',
  borderRadius: '18px',
  padding: '16px 18px',
  color: '#b42352',
  position: 'relative',
  zIndex: 1,
  boxShadow: '0 10px 24px rgba(220, 80, 120, 0.12)',
};

const sectionStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto 24px',
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(8px)',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 14px 30px rgba(100, 150, 200, 0.12)',
  position: 'relative',
  zIndex: 1,
};

const sectionHeaderRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
  marginBottom: '18px',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '24px',
  color: '#2563eb',
};

const sectionTextStyle: CSSProperties = {
  marginTop: '10px',
  marginBottom: '0',
  lineHeight: 1.8,
  color: '#44607f',
};

const urlBlockWrapStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
};

const urlCardStyle: CSSProperties = {
  border: '1px solid #d6eaff',
  borderRadius: '18px',
  padding: '16px',
  background: 'linear-gradient(180deg, #fafdff 0%, #f2f9ff 100%)',
};

const urlLabelStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#2f67c7',
  marginBottom: '8px',
};

const urlRowStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
};

const urlValueStyle: CSSProperties = {
  wordBreak: 'break-all',
  color: '#27476f',
  fontWeight: 600,
  lineHeight: 1.8,
};

const formGridStyle: CSSProperties = {
  display: 'grid',
  gap: '16px',
};

const fieldBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '6px',
};

const twoColumnStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '14px',
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
  color: '#2d4f82',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #cfe4ff',
  borderRadius: '14px',
  fontSize: '14px',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  color: '#27476f',
};

const checkboxLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: '#35537b',
  fontWeight: 600,
};

const primaryButtonStyle: CSSProperties = {
  padding: '11px 18px',
  border: 'none',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, #5ab8ff 0%, #4c78ff 100%)',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  boxShadow: '0 10px 20px rgba(92, 144, 255, 0.2)',
};

const dangerButtonStyle: CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #ff7ba5 0%, #ff5f8f 100%)',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  boxShadow: '0 10px 20px rgba(255, 95, 143, 0.18)',
};

const activeActionButtonStyle: CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #7ad7a6 0%, #34c759 100%)',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  boxShadow: '0 10px 20px rgba(52, 199, 89, 0.18)',
};

const inactiveActionButtonStyle: CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #ffb36b 0%, #ff8a4c 100%)',
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  boxShadow: '0 10px 20px rgba(255, 138, 76, 0.18)',
};

const countBadgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '8px 12px',
  borderRadius: '999px',
  background: '#dff1ff',
  color: '#2f67c7',
  fontSize: '13px',
  fontWeight: 700,
};

const errorTextStyle: CSSProperties = {
  color: '#d92560',
  fontWeight: 700,
};

const emptyCardStyle: CSSProperties = {
  border: '1px dashed #cfe4ff',
  borderRadius: '20px',
  padding: '28px',
  background: 'linear-gradient(180deg, #fafdff 0%, #f2f9ff 100%)',
  textAlign: 'center',
};

const emptyIconStyle: CSSProperties = {
  fontSize: '32px',
  marginBottom: '10px',
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: '#51739f',
  fontWeight: 600,
};

const accordionListStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
};

const accordionCardStyle: CSSProperties = {
  border: '1px solid #d6eaff',
  borderRadius: '22px',
  background: 'linear-gradient(180deg, #ffffff 0%, #f6fbff 100%)',
  boxShadow: '0 10px 22px rgba(120, 160, 210, 0.08)',
  overflow: 'hidden',
};

const accordionSummaryStyle: CSSProperties = {
  listStyle: 'none',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 170px',
  gap: '16px',
  padding: '18px',
  alignItems: 'center',
  cursor: 'pointer',
};

const summaryMainStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  minWidth: 0,
};

const summaryBadgeRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const summaryTitleStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#27476f',
  lineHeight: 1.4,
  wordBreak: 'break-word',
};

const summaryMetaRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};

const summaryMetaItemStyle: CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#edf7ff',
  color: '#4a678f',
  fontSize: '13px',
  fontWeight: 600,
};

const summaryPreviewWrapStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
  justifyItems: 'center',
};

const summaryPreviewImageStyle: CSSProperties = {
  width: '130px',
  height: 'auto',
  borderRadius: '12px',
  border: '1px solid #d6eaff',
  backgroundColor: '#ffffff',
  display: 'block',
};

const summaryHintStyle: CSSProperties = {
  fontSize: '12px',
  color: '#6a88ad',
  fontWeight: 600,
  textAlign: 'center',
};

const accordionBodyStyle: CSSProperties = {
  borderTop: '1px solid #e5f1ff',
  padding: '18px',
  display: 'grid',
  gap: '16px',
};

const editPreviewGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 220px',
  gap: '18px',
  alignItems: 'start',
};

const compactFormStyle: CSSProperties = {
  display: 'grid',
  gap: '14px',
};

const compactBottomRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const compactPreviewAreaStyle: CSSProperties = {
  border: '1px solid #dcecff',
  borderRadius: '18px',
  padding: '12px',
  background: 'linear-gradient(180deg, #fbfeff 0%, #f1f9ff 100%)',
  display: 'grid',
  gap: '10px',
  alignContent: 'start',
};

const actionRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const idBadgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#e8f4ff',
  color: '#2f67c7',
  fontSize: '12px',
  fontWeight: 700,
};

const activeBadgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#dff7eb',
  color: '#15803d',
  fontSize: '12px',
  fontWeight: 700,
};

const inactiveBadgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#ffe6ee',
  color: '#d92560',
  fontSize: '12px',
  fontWeight: 700,
};

const topicMetaStyle: CSSProperties = {
  fontSize: '12px',
  color: '#6a88ad',
};

const previewTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#2f67c7',
};

const previewImageStyle: CSSProperties = {
  width: '100%',
  height: 'auto',
  borderRadius: '14px',
  border: '1px solid #d6eaff',
  backgroundColor: '#ffffff',
  display: 'block',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
};