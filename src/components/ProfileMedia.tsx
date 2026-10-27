import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Provider } from "../types";

const INTRO_SECONDS = 30;

type Cue = { start: number; end: number; text: string };

function introCues(provider: Provider): Cue[] {
  return [
    { start: 0, end: 8, text: `${provider.name}, ${provider.credentials}. ${provider.title}.` },
    { start: 8, end: 22, text: provider.about },
    {
      start: 22,
      end: INTRO_SECONDS,
      text: `Areas of care: ${provider.expertise.slice(0, 4).join(", ")}.`,
    },
  ];
}

function clock(seconds: number) {
  const whole = Math.min(INTRO_SECONDS, Math.max(0, Math.floor(seconds)));
  return `0:${String(whole).padStart(2, "0")}`;
}

export function ProfileMedia({ provider }: { provider: Provider }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cues = introCues(provider);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [caption, setCaption] = useState(cues[0].text);

  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    setCaption(introCues(provider)[0].text);
  }, [provider]);

  function showCaption(time: number) {
    const cue = cues.find((item) => time >= item.start && time < item.end) ?? cues[cues.length - 1];
    setCaption(cue.text);
  }

  async function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      if (video.currentTime >= INTRO_SECONDS - 0.2) video.currentTime = 0;
      await video.play();
      setPlaying(true);
      return;
    }
    video.pause();
    setPlaying(false);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <img
          src={provider.photo}
          alt={`Portrait of ${provider.name}`}
          className="aspect-[3/4] w-full rounded-lg object-cover"
        />
        <div className="relative">
          <video
            key={provider.video}
            ref={videoRef}
            className="aspect-[3/4] w-full rounded-lg object-cover"
            poster={provider.photo}
            playsInline
            preload="metadata"
            aria-label={`30 second introduction of ${provider.name}`}
            onTimeUpdate={(event) => {
              const time = event.currentTarget.currentTime;
              setElapsed(time);
              showCaption(time);
            }}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          >
            <source src={provider.video} type="video/mp4" />
          </video>
          <span className="absolute bottom-2 right-2 rounded bg-slate-900/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {clock(elapsed)} / 0:30
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void toggle()}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800"
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        {playing ? "Pause intro" : "Play 30-second intro"}
      </button>
      <p className="mt-2 text-sm leading-relaxed text-slate-700" aria-live="polite">
        {playing || elapsed > 0 ? caption : "A 30-second intro: who they are, how they practice, and what they can help with."}
      </p>
    </div>
  );
}
