import {
  CaseDossier,
  SuspectDossier,
  EvidenceCard,
  FinalTruthReveal,
} from '../../types/coartada';

export interface GeneratedCaseInternal {
  caseId: string;
  suspectIsGuilty: boolean;
  caseDossier: CaseDossier;
  suspectDossier: SuspectDossier;
  allEvidence: EvidenceCard[];
  finalTruthReveal: FinalTruthReveal;
}

export interface CaseValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGeneratedCase(data: GeneratedCaseInternal): CaseValidationResult {
  const errors: string[] = [];

  // 1. Basic checks
  if (!data.caseId) errors.push('Falta caseId');
  if (!data.caseDossier?.title) errors.push('Falta título del caso');
  if (!data.caseDossier?.incidentEstimatedWindow) errors.push('Falta ventana temporal estimada');
  if (!data.caseDossier?.dateStr) errors.push('Falta fecha del caso');
  if (!data.caseDossier?.incidentType) errors.push('Falta tipo de incidente');

  // 2. Identity validation
  if (!data.suspectDossier?.identity) {
    errors.push('Falta la identidad del sospechoso');
  } else {
    const id = data.suspectDossier.identity;
    if (!id.fullName || !id.dni || !id.birthDate || !id.profession) {
      errors.push('Identidad del sospechoso incompleta');
    }
    // If there is an intentional discrepancy, ensure explanation exists
    if (id.identityDiscrepancy) {
      if (!id.identityDiscrepancy.suspectExplanation || !id.identityDiscrepancy.fileRecordValue) {
        errors.push('La discrepancia de identidad carece de explicación coherente para el sospechoso');
      }
    }
  }

  // 3. Timeline validation
  if (!data.suspectDossier?.actualTimeline || data.suspectDossier.actualTimeline.length < 3) {
    errors.push('La cronología real del sospechoso debe tener al menos 3 hitos');
  }

  // 4. Secret & Explanations validation
  if (!data.suspectDossier?.secret?.detail || !data.suspectDossier.secret.whyHidden) {
    errors.push('El sospechoso debe tener un secreto coherente con motivo para ocultarlo');
  }
  if (!data.suspectDossier?.suspiciousFactsWithExplanations || data.suspectDossier.suspiciousFactsWithExplanations.length < 1) {
    errors.push('El sospechoso debe tener al menos un hecho sospechoso con su explicación correspondiente');
  }

  // 5. Evidence count & scheduling
  if (!data.allEvidence || data.allEvidence.length < 4) {
    errors.push('El caso debe contener al menos 4 pruebas');
  } else {
    for (let i = 0; i < data.allEvidence.length; i++) {
      const ev = data.allEvidence[i];
      if (!ev.title || !ev.summary || !ev.timestamp || !ev.dateStr) {
        errors.push(`Prueba index ${i} incompleta`);
      }
      if (ev.revealedAtSeconds < 0) {
        errors.push(`Prueba ${ev.id} tiene tiempo de revelación negativo`);
      }
    }
  }

  // 6. Guilt and Truth consistency
  if (data.finalTruthReveal.suspectIsGuilty !== data.suspectIsGuilty) {
    errors.push('La culpabilidad en finalTruthReveal no coincide con suspectIsGuilty');
  }

  if (data.suspectIsGuilty) {
    if (data.finalTruthReveal.perpetratorName !== data.caseDossier.suspectPublicName) {
      errors.push('En un caso de culpable, el perpetrador debe ser el sospechoso');
    }
  } else {
    if (data.finalTruthReveal.perpetratorName === data.caseDossier.suspectPublicName) {
      errors.push('En un caso de inocente, el perpetrador NO debe ser el sospechoso');
    }
  }

  // 7. Master timeline
  if (!data.finalTruthReveal.fullMasterTimeline || data.finalTruthReveal.fullMasterTimeline.length < 4) {
    errors.push('La cronología maestra final debe tener al menos 4 eventos explicados');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
