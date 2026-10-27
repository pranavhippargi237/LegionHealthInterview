export type RescheduleWith = "current" | "any" | "specific";
export type YesNo = "yes" | "no" | null;
export type TimeOfDay = "any" | "morning" | "afternoon" | "evening";
export type ProviderGender = "woman" | "man" | "nonbinary";
export type GenderFilter = "any" | ProviderGender;

export type OnboardingData = {
  step: number;
  maxReached: number;
  texas: YesNo;
  medicare: YesNo;
  crisis: YesNo;
  hospitalized: YesNo;
  adult: YesNo;
  virtualOnly: YesNo;
  preferredDate: string | null;
  timeOfDay: TimeOfDay;
  genderFilter: GenderFilter;
  conditions: string[];
  otherCondition: string;
  insurance: string | null;
  bcbsState: string;
  otherInsurance: string;
  help: string | null;
  providerId: string | null;
  slotId: string | null;
  wantEarlier: boolean;
  rescheduleWith: RescheduleWith;
  specificProviderIds: string[];
  availabilityNote: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  referral: string;
  consentTos: boolean;
  consentTreatment: boolean;
  consentRecording: boolean;
  matchReady: boolean;
  extraShown: number;
  last4: string;
  booked: boolean;
  banner: string;
};

export type Slot = {
  id: string;
  date: string;
  time: string;
};

export type Provider = {
  id: string;
  name: string;
  title: string;
  gender: ProviderGender;
  rating: number;
  reviews: number;
  expertise: string[];
  about: string;
  badge?: "soonest" | "recommended";
  slots: Slot[];
};
