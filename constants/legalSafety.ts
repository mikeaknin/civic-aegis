/**
 * Civic Aegis - Legal Safety & Policy Directives
 * Strict alignment with the Absolute Non-Resistance Policy and Constitutional Law.
 */

export const LEGAL_DISCLAIMER =
  "LEGAL DISCLAIMER: Civic Aegis provides automated informational support and real-time situational guidance based on constitutional rights. It does NOT constitute formal legal advice and does not establish an attorney-client relationship. Laws and police procedures vary by state and local jurisdiction.";

export const ABSOLUTE_NON_RESISTANCE_POLICY =
  "SAFETY POLICY: NEVER physically resist, argue aggressively, or disobey a direct physical order from a law enforcement officer, even if you believe the stop or order is unlawful. Assert your rights verbally, clearly, and calmly. Record the interaction for later legal defense in court.";

export interface ConstitutionalRightItem {
  id: string;
  amendment: string;
  title: string;
  shortRule: string;
  practicalScript: string;
  detailedExplanation: string;
  dosAndDonts: {
    dos: string[];
    donts: string[];
  };
}

export const CONSTITUTIONAL_RIGHTS: ConstitutionalRightItem[] = [
  {
    id: "fourth-amendment",
    amendment: "Fourth Amendment",
    title: "Protection Against Unreasonable Searches & Seizures",
    shortRule: "Police cannot search your vehicle or belongings without a warrant, probable cause, or your voluntary consent.",
    practicalScript: "Officer, I do not consent to any searches of my vehicle, my belongings, or my person.",
    detailedExplanation: "Under the Fourth Amendment, you have a reasonable expectation of privacy in your vehicle. Police may look through windows in plain view, but opening closed compartments, trunks, or containers generally requires probable cause or your explicit consent. State clearly and calmly that you do not consent. Do not physically obstruct an officer if they search anyway.",
    dosAndDonts: {
      dos: [
        "Clearly state: 'Officer, I do not consent to any search.'",
        "Keep your hands visible on the steering wheel at 10 and 2.",
        "Remain calm and observe what the officer searches."
      ],
      donts: [
        "Never say 'Go ahead' or 'I have nothing to hide.'",
        "Never physically touch or block the officer.",
        "Do not reach into bags or compartments without stating your intent."
      ]
    }
  },
  {
    id: "fifth-amendment",
    amendment: "Fifth Amendment",
    title: "Right to Remain Silent & Protection Against Self-Incrimination",
    shortRule: "You are not required to answer questions about where you are coming from, where you are going, or what you have been doing.",
    practicalScript: "Officer, with all respect, I am exercising my Fifth Amendment right to remain silent.",
    detailedExplanation: "While you must generally provide mandatory driving documents (license, registration, insurance), you are under no obligation to answer exploratory or incriminating questions. Answering casual questions can inadvertently create reasonable suspicion or probable cause against you.",
    dosAndDonts: {
      dos: [
        "Provide your driver's license, registration, and insurance calmly.",
        "Explicitly invoke your right to remain silent out loud.",
        "Maintain a respectful, neutral tone of voice."
      ],
      donts: [
        "Do not guess or estimate your speed ('I thought I was going 45').",
        "Do not answer questions regarding alcohol consumption or travel history.",
        "Do not lie to an officer; silence is legally protected, lying is not."
      ]
    }
  },
  {
    id: "first-amendment",
    amendment: "First Amendment",
    title: "Right to Record Law Enforcement in Public",
    shortRule: "You have a clearly established constitutional right to openly record police officers performing duties in public spaces.",
    practicalScript: "Officer, for my personal safety and mutual accountability, I am recording this interaction.",
    detailedExplanation: "Federal appellate courts nationwide have recognized the First Amendment right of citizens to openly record police officers performing official duties in public spaces, provided you do not physically interfere with their duties.",
    dosAndDonts: {
      dos: [
        "Keep your recording device stationary on your dashboard or mount.",
        "Inform the officer calmly that you are recording.",
        "Ensure the camera does not obstruct your or the officer's movements."
      ],
      donts: [
        "Do not reach suddenly for your phone or device.",
        "Do not physically position yourself between officers and their duties.",
        "Do not argue if the officer orders you to move back for scene safety."
      ]
    }
  }
];

export interface StateJurisdictionData {
  stateName: string;
  stopAndIdentify: boolean;
  recordingConsent: string;
  vehicleCodeSummary: string;
}

export const JURISDICTION_STATE_DATABASE: Record<string, StateJurisdictionData> = {
  CA: {
    stateName: "California",
    stopAndIdentify: false,
    recordingConsent: "Two-party consent for confidential communications; open roadside recording of on-duty officers is constitutionally protected.",
    vehicleCodeSummary: "Cal. Veh. Code § 12951 requires operating drivers to present license upon lawful demand."
  },
  TX: {
    stateName: "Texas",
    stopAndIdentify: true,
    recordingConsent: "One-party consent state.",
    vehicleCodeSummary: "Tex. Penal Code § 38.02 requires lawfully arrested persons to identify; operating drivers must present driver's license upon request."
  },
  FL: {
    stateName: "Florida",
    stopAndIdentify: true,
    recordingConsent: "Two-party consent for private communications; public roadside police recording is protected.",
    vehicleCodeSummary: "Fla. Stat. § 322.15 mandates displaying license upon demand of law enforcement."
  },
  NY: {
    stateName: "New York",
    stopAndIdentify: true,
    recordingConsent: "One-party consent state; Right to Monitor Act explicitly protects recording police officers.",
    vehicleCodeSummary: "N.Y. Veh. & Traf. Law § 507 mandates operating drivers present license and registration upon request."
  },
  GA: {
    stateName: "Georgia",
    stopAndIdentify: true,
    recordingConsent: "One-party consent state.",
    vehicleCodeSummary: "O.C.G.A. § 40-5-29 requires drivers to display license on demand of police."
  },
  IL: {
    stateName: "Illinois",
    stopAndIdentify: true,
    recordingConsent: "Two-party consent; recording public police duties without interfering is explicitly legal under 720 ILCS 5/14-2.",
    vehicleCodeSummary: "625 ILCS 5/6-112 mandates drivers display license upon demand."
  },
  WA: {
    stateName: "Washington",
    stopAndIdentify: false,
    recordingConsent: "Two-party consent; open recording of public police stops is protected under 9th Circuit precedent.",
    vehicleCodeSummary: "RCW 46.20.015 requires drivers to provide license, registration, and insurance upon demand."
  }
};
