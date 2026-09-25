export type CoartadaRole = 'DETECTIVE' | 'SOSPECHOSO';

export type CoartadaPhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'INTERROGATION'
  | 'VERDICT'
  | 'CASE_REVEAL'
  | 'MATCH_ABORTED';

export type CoartadaDurationMinutes = 5 | 7 | 10 | 12 | 15;

export interface CoartadaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: CoartadaRole;
  isConnected: boolean;
  isHost: boolean;
}

export interface CoartadaConfig {
  durationMinutes: CoartadaDurationMinutes;
}

export type EvidenceType =
  | 'CAMERA'
  | 'STATEMENT'
  | 'RECEIPT'
  | 'ACCESS_LOG'
  | 'FINGERPRINT'
  | 'PHONE'
  | 'TICKET'
  | 'MAP'
  | 'NOTE';

export interface EvidenceCard {
  id: string;
  title: string;
  type: EvidenceType;
  timestamp: string;
  location: string;
  source: string;
  summary: string;
  details: string;
  revealedAtSeconds: number; // Offset from match start
  isRevealed?: boolean;
}

export interface SuspectDossier {
  publicAlibi: string;
  actualTimeline: {
    time: string;
    location: string;
    action: string;
  }[];
  venueFacts: string[];
  secret: {
    title: string;
    detail: string;
    whyHidden: string;
  };
  undeniableFacts: string[];
}

export interface CaseDossier {
  caseId: string;
  title: string;
  locationCategory: string;
  locationName: string;
  dateStr: string;
  incidentEstimatedWindow: string;
  incidentSummary: string;
  targetObjectOrNature: string;
  complainantName: string;
  complainantRole: string;
  suspectPublicName: string;
  suspectPublicRole: string;
  personsOfInterest: {
    name: string;
    role: string;
    description: string;
  }[];
  initialBriefingNotes: string[];
}

export interface ReconstructionQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface FinalTruthReveal {
  suspectIsGuilty: boolean;
  perpetratorName: string;
  perpetratorMotive: string;
  actualIncidentSummary: string;
  fullMasterTimeline: {
    time: string;
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
  accusedGuilty: boolean;
  reconstructionAnswers: number[]; // indices of selected options
}

export interface CoartadaVerdictResult {
  guiltMatched: boolean;
  reconstructionCorrectCount: number;
  totalReconstructionQuestions: number;
  caseSolved: boolean;
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
  reconstructionQuestions?: ReconstructionQuestion[];

  abortReason?: string;
}

// Client -> Server
export type CoartadaClientMessage =
  | {
      type: 'JOIN_ROOM';
      code: string;
      player: { id: string; name: string; avatar: string; color: string };
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
