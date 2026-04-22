'use client';

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  message: string;
  style?: React.CSSProperties;
};

export default function ConfirmSubmitButton({
  children,
  message,
  style,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      style={style}
      onClick={(event) => {
        const ok = window.confirm(message);
        if (!ok) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}