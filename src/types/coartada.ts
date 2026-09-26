export type CoartadaRole = 'DETECTIVE' | 'SOSPECHOSO';
export type CoartadaRoleChoice = 'DETECTIVE' | 'SOSPECHOSO' | 'ALEATORIO';

export type CoartadaPhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'PREPARATION'
  | 'INTERROGATION'
  | 'VERDICT'
  | 'CASE_REVEAL'
  | 'MATCH_ABORTED';

export type CoartadaDurationMinutes = 5 | 7 | 10 | 12 | 15;
export type CoartadaPrepSeconds = 30 | 60 | 90 | 120 | 150 | 180;

export interface CoartadaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: CoartadaRole;
  selectedRolePreference?: CoartadaRoleChoice;
  isConnected: boolean;
  isHost: boolean;
}

export interface CoartadaConfig {
  durationMinutes: CoartadaDurationMinutes; // Interrogation duration
  prepSeconds: CoartadaPrepSeconds; // Preparation/reading duration (max 180s, default 90s)
}

export type EvidenceType =
  | 'PHOTO'
  | 'ID_CARD'
  | 'LETTER'
  | 'TICKET'
  | 'RECEIPT'
  | 'REPORT'
  | 'MAP'
  | 'LOG'
  | 'PHONE'
  | 'INVENTORY'
  | 'CAMERA';

export type EvidenceVisualCategory =
  | 'PHOTO'
  | 'ID_CARD'
  | 'HANDWRITTEN'
  | 'TICKET'
  | 'RECEIPT'
  | 'OFFICIAL_REPORT'
  | 'MAP'
  | 'LOG'
  | 'CAMERA';

export interface EvidenceCard {
  id: string;
  title: string;
  type: EvidenceType;
  visualCategory: EvidenceVisualCategory;
  timestamp: string; // e.g. "14:25"
  dateStr: string; // e.g. "14 de marzo de 1986"
  location: string;
  source: string;
  summary: string;
  details: string;
  revealedAtSeconds: number; // Offset from interrogation start in seconds
  isRevealed?: boolean;
}

export interface SuspectIdentity {
  fullName: string;
  claimedFullName: string;
  birthDate: string; // e.g. "14/08/1952"
  claimedBirthDate: string;
  age: number;
  dni: string; // Fictional DNI, e.g. "41.892.304-D"
  claimedDni: string;
  profession: string;
  addressOrCity: string;
  relationshipToCase: string;
  relationshipToVenue: string;
  identityDiscrepancy?: {
    field: string;
    fileRecordValue: string;
    realValue: string;
    suspectExplanation: string;
  };
}

export interface SuspectDossier {
  identity: SuspectIdentity;
  publicAlibi: string; // Public version known to the investigation
  narrativeTone: string; // Type of narrative (work shift, travel, visit, etc.)
  actualTimeline: {
    time: string;
    dateStr: string;
    location: string;
    action: string;
  }[];
  venueFacts: string[];
  secret: {
    title: string;
    detail: string;
    whyHidden: string;
  };
  suspiciousFactsWithExplanations: {
    fact: string;
    whySuspicious: string;
    explanation: string;
  }[];
  undeniableFacts: string[];
}

export interface CaseDossier {
  caseId: string;
  title: string;
  archetype: string;
  incidentType: string;
  locationCategory: string;
  locationName: string;
  locationPreposition: string;
  dateStr: string;
  incidentEstimatedWindow: string;
  incidentSummary: string;
  targetObjectOrNature: string;
  complainantName: string;
  complainantRole: string;
  suspectKnownIdentity: {
    name: string;
    profession: string;
    birthDate: string;
    dni: string;
    address: string;
    knownRelation: string;
  };
  suspectPublicName: string;
  suspectPublicRole: string;
  personsOfInterest: {
    name: string;
    role: string;
    description: string;
  }[];
  initialBriefingNotes: string[];
}

export interface FinalTruthReveal {
  suspectIsGuilty: boolean;
  incidentType: string;
  perpetratorName: string;
  perpetratorMotive: string;
  actualIncidentSummary: string;
  fullMasterTimeline: {
    time: string;
    dateStr: string;
    actor: string;
    action: string;
    significance: string;
  }[];
  clueExplanations: {
    clueTitle: string;
    explanation: string;
    indicatesGuilt: boolean;
  }[];
  suspectSecretReveal: string;
  conclusionMessage: string;
}

export interface DetectiveVerdictSubmission {
  accusedGuilty: boolean; // true = CULPABLE, false = INOCENTE
}

export interface CoartadaVerdictResult {
  guiltMatched: boolean;
  caseSolved: boolean; // guiltMatched === true
  detectiveSubmission: DetectiveVerdictSubmission;
}

export interface CoartadaRoomState {
  code: string;
  gameType: 'coartada';
  phase: CoartadaPhase;
  config: CoartadaConfig;
  players: CoartadaPlayer[];
  hostId: string;
  caseId?: string;
  prepEndsAt?: number;
  prepSecondsRemaining?: number;
  startedAt?: number;
  roundEndsAt?: number;
  timeRemainingSeconds?: number;

  // Public case dossier accessible to Detective
  caseDossier?: CaseDossier;

  // Authoritatively revealed evidence cards (visible to Detective)
  revealedEvidence?: EvidenceCard[];

  // Suspect private dossier (ONLY included in payload sent to Suspect!)
  suspectDossier?: SuspectDossier;

  // Final outcome (included only in CASE_REVEAL)
  finalTruthReveal?: FinalTruthReveal;
  verdictResult?: CoartadaVerdictResult;

  abortReason?: string;
  abortPlayerName?: string;
}

// Client -> Server
export type CoartadaClientMessage =
  | {
      type: 'JOIN_ROOM';
      code: string;
      player: { id: string; name: string; avatar: string; color: string };
    }
  | {
      type: 'CLAIM_ROLE';
      role: CoartadaRoleChoice;
    }
  | {
      type: 'UPDATE_CONFIG';
      config: Partial<CoartadaConfig>;
    }
  | {
      type: 'START_CASE';
    }
  | {
      type: 'SUBMIT_VERDICT';
      verdict: DetectiveVerdictSubmission;
    }
  | {
      type: 'REQUEST_VERDICT_PHASE';
    }
  | {
      type: 'NEW_CASE'; // Swaps roles & generates new case
    }
  | {
      type: 'SAVE_NOTEBOOK';
      notebookText: string;
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'PING';
    };

// Server -> Client
export type CoartadaServerMessage =
  | {
      type: 'ROOM_STATE';
      room: CoartadaRoomState;
      savedNotebookText?: string;
    }
  | {
      type: 'TICK';
      timeRemainingSeconds: number;
    }
  | {
      type: 'PREP_TICK';
      prepSecondsRemaining: number;
    }
  | {
      type: 'NEW_EVIDENCE';
      evidence: EvidenceCard;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };
