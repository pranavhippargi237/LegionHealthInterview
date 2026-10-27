import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

const JORDAN_SRC = "/clinicians/demo-jordan-hale.mp4";

const JORDAN_CUES = [
  { start: 0, end: 3.931, text: "Hello, I'm Jordan Hale, a fictional clinician in this prototype." },
  { start: 4.281, end: 8.715, text: "This recording is a sample, not an introduction from the clinician on your appointment." },
  {
    start: 9.065,
    end: 14.1,
    text: "In a real introduction, you would hear how that clinician likes to work and what a first visit is like.",
  },
  { start: 14.45, end: 19.412, text: "You can pause, change the volume, move through the video, or open it full screen." },
  { start: 19.762, end: 23.34, text: "Watching is optional, and it does not change the time you selected." },
];

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds)) return "";
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const remain = whole % 60;
  return `${minutes}:${String(remain).padStart(2, "0")}`;
}

function cueAt(seconds: number, cues: { start: number; end: number; text: string }[]) {
  return cues.find((cue) => seconds >= cue.start && seconds < cue.end)?.text ?? "";
}

export function IntroVideo({ name, src, poster }: { name: string; src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [broken, setBroken] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const jordan = src === JORDAN_SRC;
  const cues = jordan ? JORDAN_CUES : [];

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      video?.pause();
    };
  }, []);

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    setStarted(true);
    try {
      await video.play();
    } catch {
      if (video.error) setBroken(true);
    }
  }

  if (!src) {
    return (
      <div className="mt-4 lg:mt-0">
        <p className="text-sm font-semibold text-slate-900">Introduction video</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700" role="status">
          {name} does not have an introduction video URL.
        </p>
      </div>
    );
  }

  if (broken) {
    return (
      <div className="mt-4 lg:mt-0">
        <p className="text-sm font-semibold text-slate-900">Introduction video</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700" role="status">
          {name}&apos;s introduction video could not be loaded from {src}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 lg:mt-0">
      <p className="text-sm font-semibold text-slate-900">Introduction video</p>
      {jordan ? (
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Jordan Hale is a fictional clinician in this prototype.
        </p>
      ) : null}
      <div className="relative mt-3 overflow-hidden rounded-xl bg-[#16325C]">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          poster={poster}
          preload="metadata"
          playsInline
          controls={started}
          aria-label={`Introduction from ${name}`}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setCaption(cueAt(event.currentTarget.currentTime, cues))}
          onPlay={() => setStarted(true)}
          onError={() => setBroken(true)}
        >
          <source src={src} type="video/mp4" onError={() => setBroken(true)} />
          {jordan ? <track kind="captions" srcLang="en" label="English" src="/clinicians/demo-jordan-hale.vtt" default /> : null}
        </video>
        {started ? (
          <p className="pointer-events-none absolute left-3 top-3 rounded-md bg-slate-900/75 px-2 py-1 text-xs font-medium text-white">
            {name}
            {jordan ? " · fictional clinician" : ""}
          </p>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void play();
            }}
            aria-label={`Play introduction from ${name}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/20 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-slate-900 shadow-md">
              <Play size={28} className="ml-1" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold">Play</span>
            <span className="text-sm font-medium">{name}</span>
            {duration != null ? <span className="text-sm">{formatClock(duration)}</span> : null}
          </button>
        )}
      </div>
      {started && caption ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-800" aria-live="polite">
          {caption}
        </p>
      ) : null}
      {cues.length > 0 ? (
        <>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-expanded={transcriptOpen}
            onClick={(event) => {
              event.stopPropagation();
              setTranscriptOpen((open) => !open);
            }}
          >
            Transcript
          </button>
          {transcriptOpen ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{cues.map((cue) => cue.text).join(" ")}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
