/**
 * ECSL legacy ward source register.
 * Source identifiers and descriptions are immutable. No constituency assignment
 * or new sequential ward number is issued until a complete crosswalk is verified.
 */
import wardExtract from './ecsl-wards-page-extract.json';
import reconciliationAudit from './ecsl-ward-reconciliation-audit.json';

export type WardAssignmentMethod =
  | 'official_crosswalk'
  | 'area_majority'
  | 'largest_overlap_review'
  | 'manual_review';

export type WardReviewStatus = 'verified' | 'review_required' | 'pending';

export interface WardSourceRecord {
  legacyWardNumber: string;
  district: string;
  description: string;
  population: number | null;
  constituencyId: string | null;
  assignmentMethod: WardAssignmentMethod | null;
  reviewStatus: WardReviewStatus;
  overlapDetected: boolean;
  sourceReference: string;
  sourceContext: string;
  assignmentStatus: string;
}

export interface WardIntersection {
  constituencyId: string;
  wardAreaShare: number;
}

export interface NumberedWard extends WardSourceRecord {
  newWardNumber: string | null;
}

export const EXPECTED_NATIONAL_WARD_COUNT = 446;
export const wardAudit = reconciliationAudit;

export const wardSourceRecords: WardSourceRecord[] = wardExtract.wards.map(record => ({
  legacyWardNumber: String(record.legacyWardNumber).padStart(3, '0'),
  district: record.district,
  description: record.description,
  population: record.population,
  constituencyId: null,
  assignmentMethod: null,
  reviewStatus: 'pending',
  overlapDetected: false,
  sourceReference: record.sourceUrl,
  sourceContext: record.sourceContext,
  assignmentStatus: record.assignmentStatus,
}));

export function resolveWardConstituency(
  intersections: WardIntersection[],
): Pick<WardSourceRecord, 'constituencyId' | 'assignmentMethod' | 'reviewStatus' | 'overlapDetected'> {
  const ranked = [...intersections]
    .filter(item => Number.isFinite(item.wardAreaShare) && item.wardAreaShare > 0)
    .sort((a, b) => b.wardAreaShare - a.wardAreaShare);

  if (ranked.length === 0) {
    return {
      constituencyId: null,
      assignmentMethod: null,
      reviewStatus: 'pending',
      overlapDetected: false,
    };
  }

  const winner = ranked[0];
  const runnerUp = ranked[1];
  const clearMajority =
    winner.wardAreaShare > 50 &&
    (!runnerUp || winner.wardAreaShare - runnerUp.wardAreaShare > 5);

  return {
    constituencyId: winner.constituencyId,
    assignmentMethod: clearMajority ? 'area_majority' : 'largest_overlap_review',
    reviewStatus: 'review_required',
    overlapDetected: ranked.length > 1,
  };
}

export function buildConstituencyOrderedWardRegister(
  sourceRecords: WardSourceRecord[],
): {
  complete: boolean;
  numberedWards: NumberedWard[];
  unresolvedCount: number;
  duplicateSourceIds: string[];
} {
  const seen = new Set<string>();
  const duplicateSourceIds: string[] = [];

  for (const record of sourceRecords) {
    if (seen.has(record.legacyWardNumber)) duplicateSourceIds.push(record.legacyWardNumber);
    seen.add(record.legacyWardNumber);
  }

  const unresolvedCount = sourceRecords.filter(
    record => !record.constituencyId || record.reviewStatus !== 'verified',
  ).length;

  const complete =
    sourceRecords.length === EXPECTED_NATIONAL_WARD_COUNT &&
    unresolvedCount === 0 &&
    duplicateSourceIds.length === 0;

  if (!complete) {
    return {
      complete: false,
      numberedWards: sourceRecords.map(record => ({ ...record, newWardNumber: null })),
      unresolvedCount,
      duplicateSourceIds,
    };
  }

  const ordered = [...sourceRecords].sort((a, b) => {
    const constituencyOrder = a.constituencyId!.localeCompare(b.constituencyId!);
    return constituencyOrder || Number(a.legacyWardNumber) - Number(b.legacyWardNumber);
  });

  return {
    complete: true,
    numberedWards: ordered.map((record, index) => ({
      ...record,
      newWardNumber: String(index + 1).padStart(3, '0'),
    })),
    unresolvedCount: 0,
    duplicateSourceIds: [],
  };
}

export const wardRegister = buildConstituencyOrderedWardRegister(wardSourceRecords);
