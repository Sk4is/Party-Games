import {
  CaseDossier,
  SuspectDossier,
  EvidenceCard,
  ReconstructionQuestion,
  FinalTruthReveal,
} from '../../types/coartada';

export interface GeneratedCaseInternal {
  caseId: string;
  suspectIsGuilty: boolean;
  caseDossier: CaseDossier;
  suspectDossier: SuspectDossier;
  allEvidence: EvidenceCard[];
  reconstructionQuestions: ReconstructionQuestion[];
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

  // 2. Timeline validation
  if (!data.suspectDossier?.actualTimeline || data.suspectDossier.actualTimeline.length < 3) {
    errors.push('La cronología real del sospechoso debe tener al menos 3 hitos');
  }

  // 3. Secret validation
  if (!data.suspectDossier?.secret?.detail || !data.suspectDossier.secret.whyHidden) {
    errors.push('El sospechoso debe tener un secreto coherente con motivo para ocultarlo');
  }

  // 4. Evidence count & scheduling
  if (!data.allEvidence || data.allEvidence.length < 4) {
    errors.push('El caso debe contener al menos 4 pruebas');
  } else {
    for (let i = 0; i < data.allEvidence.length; i++) {
      const ev = data.allEvidence[i];
      if (!ev.title || !ev.summary || !ev.timestamp) {
        errors.push(`Prueba index ${i} incompleta`);
      }
      if (ev.revealedAtSeconds < 0) {
        errors.push(`Prueba ${ev.id} tiene tiempo de revelación negativo`);
      }
    }
  }

  // 5. Guilt and Truth consistency
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

  // 6. Reconstruction questions
  if (!data.reconstructionQuestions || data.reconstructionQuestions.length < 2) {
    errors.push('Debe haber al menos 2 preguntas de reconstrucción');
  } else {
    for (const q of data.reconstructionQuestions) {
      if (!q.options || q.options.length < 3) {
        errors.push(`La pregunta ${q.id} debe tener al menos 3 opciones`);
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        errors.push(`Índice de respuesta correcta inválido en pregunta ${q.id}`);
      }
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
