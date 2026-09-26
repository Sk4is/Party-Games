import { generateProceduralCase } from '../src/data/coartada/caseEngine';
import { validateGeneratedCase } from '../src/data/coartada/caseValidator';

console.log('Running 1000 procedural case stress & distribution test...');

const TOTAL_CASES = 1000;
const archetypesCount: Record<string, number> = {};
const hoursCount: Record<number, number> = {};
const guiltCount: { guilty: number; innocent: number } = { guilty: 0, innocent: 0 };
let crossMidnightCount = 0;
let errorsCount = 0;
let startsAt2315Count = 0;
const evidenceTypesCount: Record<string, number> = {};

for (let i = 0; i < TOTAL_CASES; i++) {
  const generated = generateProceduralCase(10, undefined, i * 1993 + 47);
  const validation = validateGeneratedCase(generated);
  if (!validation.valid) {
    console.error(`Case ${i} validation failed:`, validation.errors);
    errorsCount++;
  }

  const arch = generated.caseDossier.archetype;
  archetypesCount[arch] = (archetypesCount[arch] || 0) + 1;

  if (generated.suspectIsGuilty) {
    guiltCount.guilty++;
  } else {
    guiltCount.innocent++;
  }

  const tStart = generated.caseDossier.incidentEstimatedWindow;
  const match = tStart.match(/(\d{2}):(\d{2})/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    hoursCount[hour] = (hoursCount[hour] || 0) + 1;
    if (hour === 23 && Math.abs(minute - 15) <= 5) {
      startsAt2315Count++;
    }
  }

  if (generated.caseDossier.dateStr.includes('–')) {
    crossMidnightCount++;
  }

  for (const ev of generated.allEvidence) {
    evidenceTypesCount[ev.type] = (evidenceTypesCount[ev.type] || 0) + 1;
  }
}

console.log(`Validation errors: ${errorsCount} / ${TOTAL_CASES}`);
console.log('Archetypes distribution:', archetypesCount);
console.log('Guilt distribution:', guiltCount);
console.log('Hours distribution:', hoursCount);
console.log('Cross-midnight cases count:', crossMidnightCount);
console.log('Evidence types distribution:', evidenceTypesCount);
console.log(`Cases starting around 23:15: ${startsAt2315Count} (${((startsAt2315Count / TOTAL_CASES) * 100).toFixed(1)}%)`);

// Variety Assertions (Requirement 69)
if (errorsCount > 0) {
  console.error('FAIL: Validation errors encountered');
  process.exit(1);
}

if (startsAt2315Count / TOTAL_CASES > 0.15) {
  console.error(`FAIL: Too many cases starting around 23:15 (${startsAt2315Count} / ${TOTAL_CASES})`);
  process.exit(1);
}

const archetypeValues = Object.values(archetypesCount);
for (const count of archetypeValues) {
  if (count / TOTAL_CASES > 0.35 || count / TOTAL_CASES < 0.05) {
    console.error(`FAIL: Imbalanced archetype distribution: ${count} / ${TOTAL_CASES}`);
    process.exit(1);
  }
}

console.log('ALL 1000 CASES PASSED VARIETY & INTEGRITY ASSERTIONS!');
