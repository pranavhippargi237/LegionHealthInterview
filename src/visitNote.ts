export const VISIT_TOPICS = [
  { id: "mood", label: "My mood", spoken: "my mood" },
  { id: "worry", label: "Worry or stress", spoken: "worry or stress" },
  { id: "sleep", label: "Sleep", spoken: "sleep" },
  { id: "focus", label: "Focus or attention", spoken: "focus or attention" },
  { id: "recent", label: "Something that's happened recently", spoken: "something that's happened recently" },
  { id: "else", label: "Something else", spoken: "something else" },
  { id: "unsure", label: "I'm not sure where to start", spoken: "" },
] as const;

export type VisitTopicId = (typeof VISIT_TOPICS)[number]["id"];

export const VISIT_TOPIC_IDS: readonly string[] = VISIT_TOPICS.map((topic) => topic.id);

export const SENTENCE_STARTERS = [
  "Lately, I've been finding it hard to…",
  "This has been affecting my…",
  "Something I'd like help with is…",
  "One thing I'd like to ask is…",
];

export function appendToNote(current: string, addition: string, gap: "line" | "space") {
  const extra = addition.trim();
  if (!extra) return current;
  if (!current.trim()) return extra;
  const base = current.replace(/\s+$/, "");
  return gap === "line" ? `${base}\n${extra}` : `${base} ${extra}`;
}

export function earlierPrompts(input: { conditions: string[]; otherCondition: string; help: string | null }) {
  const prompts: { topicId: VisitTopicId | ""; line: string }[] = [];
  if (input.conditions.includes("depression")) {
    prompts.push({
      topicId: "mood",
      line: "You mentioned depression earlier. My mood is here if you want to start there.",
    });
  } else if (input.conditions.includes("bipolar")) {
    prompts.push({
      topicId: "mood",
      line: "You mentioned bipolar disorder earlier. My mood is here if you want to start there.",
    });
  }
  if (input.conditions.includes("anxiety")) {
    prompts.push({
      topicId: "worry",
      line: "You mentioned anxiety earlier. Worry or stress is here if you want to start there.",
    });
  }
  if (input.conditions.includes("adhd")) {
    prompts.push({
      topicId: "focus",
      line: "You mentioned ADHD earlier. Focus or attention is here if you want to start there.",
    });
  }
  if (input.conditions.includes("ptsd")) {
    prompts.push({
      topicId: "",
      line: "You mentioned PTSD earlier. You can write about it here if you want, or leave it for the visit.",
    });
  }
  if (input.conditions.includes("unsure") || input.help === "unsure") {
    prompts.push({
      topicId: "unsure",
      line: "You said you were not sure earlier. You can start there, or leave this blank.",
    });
  }
  if (input.conditions.includes("other") && input.otherCondition.trim()) {
    prompts.push({
      topicId: "else",
      line: "You wrote something earlier. You can add those words here.",
    });
  }
  return prompts;
}
