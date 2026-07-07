import { FileText, File, ExternalLink, Music } from 'lucide-react';
import type { LessonMaterialDto } from '@/hooks/useContent';

interface Props {
  material: LessonMaterialDto;
}

// Extrage domeniul dintr-un URL pentru preview link
const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Extrage favicon Google pentru un URL extern
const getFaviconUrl = (url: string): string => {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return '';
  }
};

// Preview per tip
const ImagePreview = ({ url, title }: { url: string; title: string }) => (
  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
    <img
      src={url}
      alt={title}
      className="h-full w-full object-cover"
      onError={(e) => {
        // Fallback la icona daca imaginea nu se incarca
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  </div>
);

const AudioPreview = ({ url }: { url: string }) => (
  <div className="w-full space-y-1">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100">
      <Music className="h-4 w-4 text-purple-600" />
    </div>
    <audio
      controls
      src={url}
      className="h-8 w-full"
      style={{ accentColor: 'hsl(var(--primary))' }}
    />
  </div>
);

const VideoPreview = ({ url, title }: { url: string; title: string }) => (
  <div className="w-full overflow-hidden rounded-lg border border-border bg-muted">
    <video
      src={url}
      controls
      preload="metadata"
      className="max-h-48 w-full object-contain bg-black"
      aria-label={title}
    />
  </div>
);

const PdfPreview = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-50 border border-red-100">
    <div className="text-center">
      <FileText className="h-6 w-6 text-red-500 mx-auto" />
      <span className="text-[9px] font-bold text-red-500 leading-none">
        PDF
      </span>
    </div>
  </div>
);

const WordPreview = () => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
    <div className="text-center">
      <File className="h-6 w-6 text-blue-600 mx-auto" />
      <span className="text-[9px] font-bold text-blue-600 leading-none">
        DOCX
      </span>
    </div>
  </div>
);

const LinkPreview = ({ url }: { url: string }) => {
  const domain = extractDomain(url);
  const favicon = getFaviconUrl(url);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
      {favicon ? (
        <div className="flex flex-col items-center gap-0.5">
          <img
            src={favicon}
            alt={domain}
            className="h-6 w-6 rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).replaceWith(
                Object.assign(document.createElement('div'), {
                  innerHTML: '<svg>...</svg>',
                })
              );
            }}
          />
          <span className="text-[9px] text-muted-foreground truncate max-w-[52px] text-center leading-none">
            {domain}
          </span>
        </div>
      ) : (
        <ExternalLink className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
};



// MaterialPreview — entry point
export const MaterialPreview = ({ material }: Props) => {
  const type = material.type.toLowerCase();

  if (type === 'image') {
    return <ImagePreview url={material.url} title={material.title} />;
  }

  if (type === 'audio') {
    return <AudioPreview url={material.url} />;
  }

  if (type === 'video') {
    return <VideoPreview url={material.url} title={material.title} />;
  }

  if (type === 'pdf') {
    return <PdfPreview />;
  }

  if (type === 'word') {
    return <WordPreview />;
  }

  if (type === 'link') {
    return <LinkPreview url={material.url} />;
  }

  // Fallback generic
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
      <File className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};