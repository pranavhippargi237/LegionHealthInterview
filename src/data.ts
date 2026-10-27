import type { Provider, ProviderGender, Slot } from "./types";
import { addDays } from "./format";

export const STEPS = [
  { label: "Right fit", percent: 17 },
  { label: "Insurance", percent: 33 },
  { label: "Your care", percent: 50 },
  { label: "Schedule", percent: 67 },
  { label: "Basic Info", percent: 83 },
  { label: "Payment Method", percent: 100 },
] as const;

export const CONDITIONS = [
  { id: "adhd", label: "ADHD" },
  { id: "depression", label: "Depression" },
  { id: "anxiety", label: "Anxiety" },
  { id: "bipolar", label: "Bipolar Disorder" },
  { id: "ptsd", label: "PTSD" },
  { id: "unsure", label: "I'm not sure" },
  { id: "other", label: "Other" },
] as const;

export const HELP_OPTIONS = [
  {
    id: "existing",
    title: "I already have a diagnosis and need medication support",
    detail: "We'll connect you with a provider for ongoing management",
    more: "Our providers specialize in managing existing conditions and ensuring your treatment continues smoothly",
  },
  {
    id: "new",
    title: "I'm looking for a new diagnosis or medication",
    detail: "Our providers will evaluate and create a treatment plan",
    more: "Your first visit is an evaluation. You and your provider decide together what should happen next.",
  },
  {
    id: "unsure",
    title: "I'm not sure, but I need help",
    detail: "We'll guide you through the process step by step",
    more: "You do not need the perfect words today. A provider will help you sort out what kind of care fits.",
  },
] as const;

export const INSURERS = [
  { id: "aetna", name: "Aetna", short: "Aetna" },
  { id: "bcbs", name: "Blue Cross Blue Shield", short: "Blue Cross Blue Shield" },
  { id: "cigna", name: "Cigna", short: "Cigna" },
  { id: "uhc", name: "United Healthcare", short: "United Healthcare" },
  { id: "oscar", name: "Oscar Health", short: "Oscar Health" },
  { id: "other", name: "Other", short: "Other Insurance" },
  { id: "none", name: "None", short: "No Insurance" },
] as const;

export const BCBS_STATES = [
  "Texas",
  "California",
  "New York",
  "Florida",
  "Illinois",
  "Georgia",
  "North Carolina",
  "Ohio",
  "Pennsylvania",
  "Washington",
  "Arizona",
  "Colorado",
  "Massachusetts",
  "Michigan",
  "New Jersey",
  "Virginia",
];

export const REFERRALS = [
  "AI chatbot (e.g., ChatGPT, Gemini, Grok)",
  "Google or another search",
  "Friend or family",
  "My doctor",
  "Social media",
  "My insurance directory",
  "Another provider",
  "Other",
];

export const TESTIMONIALS = [
  {
    quote:
      "This has been the easiest healthcare I've ever had and I've had therapists for 20+ years.",
  },
  {
    quote:
      "My provider has been a godsend and changed my life for the better. She really listened to me and is consistently trying to understand more what's going on and tries to help me through it.",
  },
  {
    quote:
      "I love my provider! She is great to work with, very informative about treatments and medications. She leaves no questions unanswered. Everyone I've interacted with at Legion has gone above and beyond to help with anything I need. Friendly staff, very helpful!",
  },
  {
    quote:
      "This has been the easiest healthcare I've ever had and I've had therapists for 20+ years.",
  },
  {
    quote:
      "My provider has been a godsend and changed my life for the better. She really listened to me and is consistently trying to understand more what's going on and tries to help me through it.",
  },
  {
    quote:
      "This is the first time where I feel like I was taken seriously by my provider and listened to. I was offered alternatives based on what can be done in my price range and cash pay services. I feel at ease here and I'm truly grateful.",
  },
];

export const POLICIES: Record<string, { title: string; paragraphs: string[] }> = {
  tos: {
    title: "Terms, privacy, and HIPAA",
    paragraphs: [
      "We use what you share to create your account, match you with a provider, and run your visit.",
      "Health information is protected under HIPAA. We do not sell it.",
      "You can ask for a copy of the full notice before you agree. Checking the box means you have had a chance to read it.",
    ],
  },
  treatment: {
    title: "Treatment consent and controlled substances",
    paragraphs: [
      "Your first visit is an evaluation. It is not a promise of a diagnosis or a prescription.",
      "Some medications are controlled. Prescribing them follows state and federal rules, and your provider may ask for records, a drug test, or a follow-up visit.",
      "You can ask questions and you can decline a treatment.",
    ],
  },
  recording: {
    title: "Recording and AI transcription",
    paragraphs: [
      "Visits may be transcribed so your provider has an accurate note.",
      "The transcript supports your care. It is part of the clinical record.",
      "You can ask your provider how this works before the visit starts.",
    ],
  },
  financial: {
    title: "Financial policy",
    paragraphs: [
      "Claims are submitted to insurance about 5 days after your visit. After insurance processes the claim, any remaining balance is charged to the card on file. You also receive an itemized invoice.",
      "With insurance, most patients pay $0–$40 per session. You can ask for an exact estimate.",
      "You can cancel or reschedule online at no charge up to 48 hours before the visit. A late cancel (inside 48 hours) or a no-show (not arriving within 10 minutes) is $250 for an intake and $100 for a follow-up.",
      "If insurance does not cover the visit, self-pay is $250 for intakes and $150 for follow-ups.",
      "You are responsible for any amount insurance does not cover.",
    ],
  },
};

const EXPERTISE_COLORS: Record<string, string> = {
  Depression: "#2F6BFF",
  Anxiety: "#0F766E",
  Trauma: "#4F46E5",
  "Mood Disorders": "#7C3AED",
  PTSD: "#0369A1",
  ADHD: "#0E7490",
  "Bipolar Disorder": "#6D28D9",
  "Medication Management": "#334155",
  "Women's Issues": "#0F766E",
  Bipolar: "#6D28D9",
};

export function expertiseColor(label: string) {
  return EXPERTISE_COLORS[label] ?? "#475569";
}

function slots(providerId: string, dates: string[], times: string[]): Slot[] {
  return dates.flatMap((date) =>
    times.map((time) => ({
      id: `${providerId}-${date}-${time}`,
      date,
      time,
    })),
  );
}

const featured: Provider[] = [
  {
    id: "chinwe-mbonu",
    name: "Chinwe Mbonu",
    title: "Psychiatric Mental Health Nurse Practitioner",
    gender: "woman",
    rating: 5,
    reviews: 24,
    expertise: ["Depression", "Anxiety", "Trauma", "Mood Disorders", "PTSD", "ADHD"],
    about:
      "Care that feels calm, personal, and effective. After ten years in psychiatry I bring a steady, nonjudgmental presence and a collaborative style that puts you at the center. We will look at the whole picture and use shared decisions so treatment fits your life.",
    badge: "soonest",
    slots: [
      ...slots("chinwe-mbonu", ["2026-10-28"], ["17:30", "18:00"]),
      ...slots("chinwe-mbonu", ["2026-10-29"], ["17:00"]),
      ...slots("chinwe-mbonu", ["2026-11-03"], ["18:00"]),
    ],
  },
  {
    id: "naomi-powell",
    name: "Naomi Powell",
    title: "Psychiatric Mental Health Nurse Practitioner",
    gender: "woman",
    rating: 4.9,
    reviews: 41,
    expertise: [
      "Anxiety",
      "Bipolar Disorder",
      "Depression",
      "Medication Management",
      "Mood Disorders",
      "PTSD",
      "ADHD",
    ],
    about:
      "Naomi Lue Powell is a board-certified psychiatric mental health nurse practitioner who provides compassionate, patient-centered care for young adults, adults, and seniors. She supports patients with anxiety, mood, and attention concerns, and explains options before any decision is made.",
    badge: "recommended",
    slots: [
      ...slots("naomi-powell", ["2026-11-02"], ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00"]),
      ...slots("naomi-powell", ["2026-11-04"], ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]),
      ...slots("naomi-powell", ["2026-11-09"], ["10:30", "11:00", "13:00", "13:30", "14:00", "14:30"]),
    ],
  },
  {
    id: "britanni-greene",
    name: "Britanni Greene",
    title: "Psychiatric Mental Health Nurse Practitioner",
    gender: "woman",
    rating: 4.9,
    reviews: 62,
    expertise: [
      "Anxiety",
      "Bipolar Disorder",
      "Depression",
      "Medication Management",
      "Mood Disorders",
      "PTSD",
      "Trauma",
      "Women's Issues",
      "ADHD",
    ],
    about:
      "I am a psychiatric mental health nurse practitioner with a diverse nursing background across long term care, psychiatry, neuro ICU, and labor and delivery. I help adults with anxiety, depression, ADHD, PTSD, and trauma, and we decide the pace together.",
    badge: "recommended",
    slots: [
      ...slots("britanni-greene", ["2026-10-30"], ["08:00", "08:30", "09:00", "09:30", "10:00"]),
      ...slots("britanni-greene", ["2026-11-02"], ["07:30", "08:00", "08:30", "09:00"]),
      ...slots("britanni-greene", ["2026-11-06"], ["08:00", "08:30", "09:00"]),
    ],
  },
  {
    id: "rodesia-howard",
    name: "Rodesia Howard",
    title: "Psychiatric Mental Health Nurse Practitioner",
    gender: "woman",
    rating: 4.8,
    reviews: 61,
    expertise: ["ADHD", "Depression", "Anxiety", "Trauma", "Mood Disorders", "PTSD"],
    about:
      "Care should feel like a conversation, not a checklist. With a calm, judgment free style shaped by years in healthcare from CNA to psychiatric nurse practitioner, I listen closely, explain your options, and tailor care that you can live with between visits.",
    slots: [
      ...slots("rodesia-howard", ["2026-10-29"], ["06:00", "06:30", "07:00", "07:30", "08:00"]),
      ...slots("rodesia-howard", ["2026-11-04"], ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30"]),
      ...slots("rodesia-howard", ["2026-11-05"], ["07:00", "08:30", "09:00", "09:30", "10:00", "10:30"]),
    ],
  },
];

const FIRST = [
  "Amira",
  "Jordan",
  "Luis",
  "Priya",
  "Elena",
  "Marcus",
  "Hana",
  "Owen",
  "Sofia",
  "Noah",
  "Leila",
  "Maya",
  "Jonah",
  "Rosa",
  "Chloe",
  "Andre",
  "Fatima",
  "Hugo",
  "Yara",
  "Felix",
  "Nora",
  "Samir",
  "Ines",
  "Alicia",
  "Kwame",
  "Ruth",
  "Omar",
  "Helen",
  "Idris",
  "Greta",
];

const GENDER_BY_FIRST: Record<string, ProviderGender> = {
  Amira: "woman",
  Jordan: "nonbinary",
  Luis: "man",
  Priya: "woman",
  Elena: "woman",
  Marcus: "man",
  Hana: "woman",
  Owen: "man",
  Sofia: "woman",
  Noah: "man",
  Leila: "woman",
  Maya: "woman",
  Jonah: "man",
  Rosa: "woman",
  Chloe: "woman",
  Andre: "man",
  Fatima: "woman",
  Hugo: "man",
  Yara: "woman",
  Felix: "man",
  Nora: "woman",
  Samir: "man",
  Ines: "woman",
  Alicia: "woman",
  Kwame: "man",
  Ruth: "woman",
  Omar: "man",
  Helen: "woman",
  Idris: "man",
  Greta: "woman",
};

const LAST = [
  "Bennett",
  "Okoye",
  "Shah",
  "Nguyen",
  "Carter",
  "Silva",
  "Park",
  "Diaz",
  "Brooks",
  "Cohen",
  "Almeida",
  "Wright",
  "Hassan",
  "Klein",
  "Morales",
  "Sato",
  "Berg",
  "Nwosu",
  "Duarte",
  "Keller",
  "Rahman",
  "Cho",
  "Olsen",
  "Mensah",
  "Ibarra",
  "Novak",
  "Adeyemi",
  "Moreau",
  "Quintero",
  "Dalton",
];

const FOCUS = [
  ["ADHD", "Anxiety", "Depression"],
  ["Depression", "Mood Disorders", "PTSD"],
  ["Anxiety", "Trauma", "ADHD"],
  ["Bipolar Disorder", "Mood Disorders", "Medication Management"],
  ["PTSD", "Trauma", "Depression"],
  ["Anxiety", "Depression", "Medication Management"],
];

function extraProviders(): Provider[] {
  return Array.from({ length: 41 }, (_, index) => {
    const first = FIRST[index % FIRST.length];
    const last = LAST[(index * 7) % LAST.length];
    const id = `sample-${index}-${first}-${last}`.toLowerCase();
    const start = addDays("2026-10-28", (index % 9) + 1);
    const dates = [start, addDays(start, 2), addDays(start, 5)];
    const timeSets = [
      ["09:00", "10:30", "15:00"],
      ["08:30", "12:00", "16:30"],
      ["11:00", "13:30", "17:00"],
    ];
    return {
      id,
      name: `${first} ${last}`,
      title: "Psychiatric Mental Health Nurse Practitioner",
      gender: GENDER_BY_FIRST[first],
      rating: Math.round((4.6 + (index % 5) * 0.1) * 10) / 10,
      reviews: 12 + ((index * 5) % 80),
      expertise: FOCUS[index % FOCUS.length],
      about: `${first} offers unhurried psychiatric visits for adults. Care starts with listening, then a plan you can follow between appointments.`,
      slots: dates.flatMap((date, dateIndex) =>
        slots(id, [date], timeSets[dateIndex % timeSets.length]),
      ),
    };
  });
}

export const FEATURED_PROVIDERS = featured;
export const EXTRA_PROVIDERS = extraProviders();
export const ALL_PROVIDERS = [...featured, ...EXTRA_PROVIDERS];

export function findProvider(id: string | null) {
  if (!id) return null;
  return ALL_PROVIDERS.find((provider) => provider.id === id) ?? null;
}

export function findSlot(provider: Provider | null, slotId: string | null) {
  if (!provider || !slotId) return null;
  return provider.slots.find((slot) => slot.id === slotId) ?? null;
}

export function timeBand(time: string): "morning" | "afternoon" | "evening" {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function insuranceMatchName(id: string | null, state: string, other: string) {
  if (id === "bcbs") return `${state.toUpperCase()} BLUE SHIELD`;
  if (id === "other") return other.trim() || "your plan";
  const insurer = INSURERS.find((item) => item.id === id);
  return insurer?.name ?? "your plan";
}

export const MATCH_CHECKS = [
  "Reviewing your insurance",
  "Checking Legion's 107+ providers",
  "Verifying providers who work with your insurance",
  "Analyzing your treatment needs",
  "Matching you with the right provider",
];
