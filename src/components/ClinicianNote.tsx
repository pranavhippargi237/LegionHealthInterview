import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { useOnboarding } from "../state";
import { appendToNote, earlierPrompts, SENTENCE_STARTERS, VISIT_TOPICS, type VisitTopicId } from "../visitNote";

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
  const sharedIsCurrent = shared && data.visitSharedNote === data.visitNote;

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

  function share() {
    if (!data.visitNote.trim()) {
      setShareMessage("There's nothing to share yet. You can leave this blank.");
      return;
    }
    patch({ visitSharedNote: data.visitNote, banner: "" });
    setShareMessage("");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 sm:px-8">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Anything you'd like your clinician to know?</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        You don't need to have everything figured out. You can add a few thoughts here, or talk about them at your
        visit. This is optional.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        You can pick a topic, write, or talk. One sentence is enough, and you can come back later or leave this alone.
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
              className="h-12 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white"
            >
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
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        The microphone button asks for the microphone only after you press it. Your browser turns speech into text. In Chrome
        and some other browsers, that audio goes to the browser's speech service to make the transcript. Legion does
        not keep the recording. The words are added to this box, where you can change them or keep typing. Stopping
        the microphone leaves the note here with you.
      </p>

      <div className="mt-5 rounded-xl border border-[#B9D4F5] bg-[#E8F0FE] px-4 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Who can see this</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#1E3A5F]">
          Before anything is shared, only you can see this. It stays on this device with your visit. Your clinician
          sees it after you press Share with your clinician. Leaving this page and stopping the microphone leave the
          note with you.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#1E3A5F]">
          In this preview, sharing saves the note on this device. It is not sent to a clinic.
        </p>
        <button
          type="button"
          onClick={share}
          className="mt-3 h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900"
        >
          Share with your clinician
        </button>
        {shareMessage ? (
          <p className="mt-2 text-sm text-slate-800" role="status">
            {shareMessage}
          </p>
        ) : null}
        {shared ? (
          <p className="mt-2 text-sm text-slate-800" role="status">
            {sharedIsCurrent
              ? "You shared this note with your visit on this device."
              : "You changed the note after sharing. Share again if you want the newer words saved with this visit."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
