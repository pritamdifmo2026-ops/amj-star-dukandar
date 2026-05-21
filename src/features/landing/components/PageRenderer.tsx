import React from 'react';

export interface Section {
  id: string;
  type: 'hero' | 'heading' | 'paragraph' | 'image';
  heading?: string;
  subheading?: string;
  body?: string;
  text?: string;
  level?: 2 | 3;
  url?: string;
  alt?: string;
  caption?: string;
}

const PageRenderer: React.FC<{ sections: Section[] }> = ({ sections }) => {
  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-8 py-12 flex flex-col gap-8">
      {sections.map(s => {
        if (s.type === 'hero') return (
          <section key={s.id} className="bg-gradient-to-br from-white to-[oklch(0.97_0.02_75)] rounded-[16px] px-10 py-14 border border-border text-center">
            {s.subheading && (
              <span className="inline-block px-4 py-1.5 bg-primary-soft text-primary rounded-full text-sm font-bold mb-5">
                {s.subheading}
              </span>
            )}
            {s.heading && (
              <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold text-heading leading-tight mb-5">
                {s.heading}
              </h1>
            )}
            {s.body && (
              <p className="text-body text-base leading-relaxed max-w-2xl mx-auto">{s.body}</p>
            )}
          </section>
        );

        if (s.type === 'heading') {
          const Tag = (s.level === 3 ? 'h3' : 'h2') as 'h2' | 'h3';
          return (
            <Tag
              key={s.id}
              className={`font-extrabold text-heading ${s.level === 3 ? 'text-xl mt-2' : 'text-2xl mt-4 border-b border-border pb-3'}`}
            >
              {s.text}
            </Tag>
          );
        }

        if (s.type === 'paragraph') return (
          <p key={s.id} className="text-body text-[15px] leading-[1.85]">{s.text}</p>
        );

        if (s.type === 'image') return (
          <figure key={s.id} className="flex flex-col items-center gap-2 my-2">
            {s.url && (
              <img
                src={s.url}
                alt={s.alt || ''}
                className="w-full max-h-[420px] object-cover rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
              />
            )}
            {s.caption && (
              <figcaption className="text-xs text-muted text-center">{s.caption}</figcaption>
            )}
          </figure>
        );

        return null;
      })}
    </div>
  );
};

export default PageRenderer;
