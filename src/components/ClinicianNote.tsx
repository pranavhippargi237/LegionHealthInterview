import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useOnboarding } from "../state";
import { appendToNote, earlierPrompts, organizeVisitNote, SENTENCE_STARTERS, VISIT_TOPICS, type VisitTopicId } from "../visitNote";

type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; length: number; [index: number]: SpeechAlternative };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionCtor() {
  const browser = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null;
}

export function ClinicianNote() {
  const { data, patch } = useOnboarding();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speechMessage, setSpeechMessage] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [shareChoice, setShareChoice] = useState<"words" | "draft">("words");
  const [shareMessage, setShareMessage] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const committedRef = useRef("");
  const interimRef = useRef("");
  const noteRef = useRef(data.visitNote);
  noteRef.current = data.visitNote;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const prompts = earlierPrompts(data);
  const selectedTopics = data.visitTopics.filter((id): id is VisitTopicId => VISIT_TOPICS.some((topic) => topic.id === id));
  const shared = data.visitSharedNote.length > 0;
  const shareText = shareChoice === "draft" ? data.visitDraft : data.visitNote;
  const sharedIsCurrent = shared && data.visitSharedNote === shareText;

  function setNote(visitNote: string) {
    noteRef.current = visitNote;
    patch({ visitNote, banner: "" });
  }

  function toggleTopic(id: VisitTopicId) {
    const visitTopics = data.visitTopics.includes(id)
      ? data.visitTopics.filter((topic) => topic !== id)
      : [...data.visitTopics, id];
    patch({ visitTopics, banner: "" });
  }

  function addStarter(starter: string) {
    setNote(appendToNote(data.visitNote, starter, "line"));
  }

  function addEarlierWords() {
    const earlier = data.otherCondition.trim();
    if (!earlier || data.visitNote.includes(earlier)) return;
    const visitNote = appendToNote(data.visitNote, earlier, "line");
    noteRef.current = visitNote;
    patch({
      visitNote,
      visitTopics: data.visitTopics.includes("else") ? data.visitTopics : [...data.visitTopics, "else"],
      banner: "",
    });
  }

  function stopListening() {
    const tail = interimRef.current.trim();
    if (tail) setNote(appendToNote(noteRef.current, tail, "space"));
    interimRef.current = "";
    setInterim("");
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }

  function talk() {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setSpeechMessage("This browser can't turn speech into text. Your words are still in the box, and you can keep typing.");
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    committedRef.current = "";
    interimRef.current = "";
    recognition.onresult = (event) => {
      let finals = "";
      let heard = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finals += transcript;
        else heard += transcript;
      }
      const addition = finals.slice(committedRef.current.length);
      committedRef.current = finals;
      if (addition.trim()) setNote(appendToNote(noteRef.current, addition, "space"));
      interimRef.current = heard;
      setInterim(heard);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    let failed = false;
    recognition.onerror = (event) => {
      failed = true;
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      setSpeechMessage(
        denied
          ? "Microphone access is off. Your words are still in the box, and you can keep typing."
          : "Speech couldn't be turned into text. Your words are still in the box, and you can keep typing.",
      );
      interimRef.current = "";
      setInterim("");
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      if (failed) return;
      setListening(true);
      setSpeechMessage("");
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setSpeechMessage("The microphone didn't start. Your words are still in the box, and you can keep typing.");
    }
  }

  function organize() {
    try {
      const draft = organizeVisitNote(data.visitNote, data.visitTopics);
      if (!draft.trim()) {
        setDraftMessage("Add a few words or pick a topic first. What you wrote stays in the box.");
        return;
      }
      patch({ visitDraft: draft, visitWordsSnapshot: data.visitNote, banner: "" });
      setDraftMessage("");
    } catch {
      setDraftMessage("Those words couldn't be organized just now. What you wrote stays in the box.");
    }
  }

  function share() {
    const text = shareChoice === "draft" ? data.visitDraft : data.visitNote;
    if (!text.trim()) {
      setShareMessage(
        shareChoice === "draft"
          ? "The draft is empty, so nothing was saved. Your words are still in the box above."
          : "There's nothing to share yet. You can leave this blank.",
      );
      return;
    }
    patch({ visitSharedNote: text, banner: "" });
    setShareMessage("Saved on this device. It was not sent to your clinician.");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Anything you'd like your clinician to know?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Only you can see this until you share it with your clinician, and in this preview that stays on this device.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        You can pick a topic, write, or talk. One sentence is enough, and you can come back later or leave this alone.
        This is optional.
      </p>

      {prompts.length > 0 ? (
        <div className="mt-4 rounded-xl bg-[#F3F7FD] px-4 py-3 text-sm leading-relaxed text-slate-700">
          <p className="font-semibold text-slate-900">From what you already shared</p>
          <ul className="mt-2 space-y-1">
            {prompts.map((prompt) => (
              <li key={prompt.line}>{prompt.line}</li>
            ))}
          </ul>
          {data.otherCondition.trim() ? (
            <button
              type="button"
              onClick={addEarlierWords}
              className="mt-3 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              Add what I wrote earlier
            </button>
          ) : null}
        </div>
      ) : null}

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-slate-900">A place to start, if you want one</legend>
        <p className="mt-1 text-sm text-slate-600">These are things you may want to talk about. They are not diagnoses.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VISIT_TOPICS.map((topic) => {
            const checked = selectedTopics.includes(topic.id);
            const suggested = prompts.some((prompt) => prompt.topicId === topic.id);
            return (
              <label
                key={topic.id}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-[#8EBBFF] px-3 py-2 text-sm font-medium text-slate-900 ${
                  checked ? "bg-[#E8F7EE]" : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTopic(topic.id)}
                  className="h-4 w-4 accent-[#0B6B3A]"
                />
                {topic.label}
                {suggested ? <span className="text-xs font-normal text-slate-500">From earlier</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {selectedTopics.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">A few ways to begin a sentence</p>
          <div className="mt-2 flex flex-col items-start gap-2">
            {SENTENCE_STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => addStarter(starter)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 hover:border-slate-300"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 sm:flex sm:items-start sm:gap-3">
        <label className="block min-w-0 flex-1">
          <span className="text-sm font-semibold text-slate-900">Your words</span>
          <textarea
            value={data.visitNote}
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            aria-label="Anything you'd like your clinician to know"
            placeholder="Write as much or as little as you want."
            className="mt-2 w-full resize-y rounded-xl border-2 border-[#8EBBFF] px-3 py-3 text-sm leading-relaxed text-slate-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
        </label>
        <div className="mt-3 sm:mt-7 sm:shrink-0">
          {listening ? (
            <button
              type="button"
              onClick={stopListening}
              aria-label="Stop"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#C53030] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Square size={14} fill="currentColor" aria-hidden="true" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={talk}
              aria-label="Talk instead"
              className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Mic size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {listening ? (
        <div className="mt-3 rounded-xl border-2 border-brand bg-[#E8F0FE] px-4 py-3" role="status">
          <p className="text-sm font-semibold text-slate-900">Microphone is on</p>
          <p className="mt-1 text-sm text-slate-700">
            {interim.trim() ? `Hearing: ${interim.trim()}` : "Listening. Speak whenever you're ready."}
          </p>
        </div>
      ) : null}
      {speechMessage ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-700" role="status">
          {speechMessage}
        </p>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          onClick={organize}
          className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900"
        >
          Help me organize this
        </button>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This writes a draft from the topics and words already on this page. You can read it and change it. Your
          original words stay in the box above. Recording and this button do not share anything.
        </p>
        {draftMessage ? (
          <p className="mt-2 text-sm text-slate-700" role="status">
            {draftMessage}
          </p>
        ) : null}
      </div>

      {data.visitDraft ? (
        <div className="mt-4 rounded-xl bg-[#F7F8FB] px-4 py-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-900">A draft you can change</span>
            <textarea
              value={data.visitDraft}
              onChange={(event) => patch({ visitDraft: event.target.value, banner: "" })}
              rows={5}
              aria-label="Draft you can change"
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed text-slate-900 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            />
          </label>
          <p className="mt-2 text-sm text-slate-600">Your original words are still in the box above.</p>
        </div>
      ) : null}

      <div className="mt-5">
        {data.visitDraft ? (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">Choose what to share</legend>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="share-choice"
                  checked={shareChoice === "words"}
                  onChange={() => setShareChoice("words")}
                />
                My words
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="share-choice"
                  checked={shareChoice === "draft"}
                  onChange={() => setShareChoice("draft")}
                />
                The draft
              </label>
            </div>
          </fieldset>
        ) : null}
        <button
          type="button"
          onClick={share}
          className="mt-3 h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900"
        >
          Share with your clinician
        </button>
        {shareMessage && !sharedIsCurrent ? (
          <p className="mt-2 text-sm text-slate-800" role="status">
            {shareMessage}
          </p>
        ) : null}
        {shared ? (
          <p className="mt-2 text-sm text-slate-800" role="status">
            {sharedIsCurrent
              ? "Saved on this device. It was not sent to your clinician."
              : "You changed this after saving. The earlier version is still the one on this device. Share again if you want the newer words kept here."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
