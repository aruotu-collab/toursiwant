import {
  getPlaceVideo,
  youtubeEmbedUrl,
  youtubeSearchUrl,
} from "@/lib/nyc-place-videos";

type Props = {
  placeName: string;
  slug: string;
};

export function PlaceVideoPanel({ placeName, slug }: Props) {
  const video = getPlaceVideo(slug);

  return (
    <aside className="border border-ink/10 bg-ink px-5 py-6 text-white sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
        See this place
      </p>

      {video ? (
        <>
          <div className="mt-4 aspect-video overflow-hidden bg-ink-soft/30">
            <iframe
              src={youtubeEmbedUrl(video.youtubeId)}
              title={`${placeName} walkthrough video`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            {video.caption ??
              `A quick look at ${placeName} before you decide to go.`}
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block border border-white/25 px-4 py-2 text-sm hover:border-amber hover:text-amber"
          >
            Watch on YouTube
          </a>
        </>
      ) : (
        <>
          <p className="mt-3 font-display text-2xl leading-tight tracking-tight">
            Walkthrough
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Open a YouTube walkthrough of {placeName} — same vibe as being
            there for a minute, without the metrocard.
          </p>
          <a
            href={youtubeSearchUrl(placeName)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block border border-white/25 px-4 py-2 text-sm hover:border-amber hover:text-amber"
          >
            Find a video
          </a>
        </>
      )}
    </aside>
  );
}
