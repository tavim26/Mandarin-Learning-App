import useTTS from '@/hooks/useTTS';

interface SpeakButtonProps {
  text: string;
  size?: 'sm' | 'md';
}

const SpeakButton = ({ text, size = 'md' }: SpeakButtonProps) => {
  const { speak, stop, isSpeaking, isSupported } = useTTS();

  if (!isSupported) return null;

  const dimension = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 14 : 17;

  return (
    <button
      onClick={() => isSpeaking ? stop() : speak(text)}
      title={isSpeaking ? 'Stop' : 'Play audio'}
      className={`${dimension} rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80`}
      style={{
        background: isSpeaking ? '#fff7f0' : '#f9fafb',
        border: `1.5px solid ${isSpeaking ? '#e85d04' : '#e5e7eb'}`,
        color: isSpeaking ? '#e85d04' : '#6b7280',
      }}
    >
      {isSpeaking ? (
        // Icona stop
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Icona speaker
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
};

export default SpeakButton;