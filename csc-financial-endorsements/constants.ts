/**
 * Labels and summary strings for CSC Financial Endorsements (Summary page).
 * Export as JSON or use as TypeScript constants in the new project.
 */

export const CscEndorsementLabels = {
  /** Shown on successful endorsement submit */
  endorseMentSuccess: 'Policy Endorsement Success!',
  /** Shown when endorsement API fails */
  ednorseFailureMessage: 'Something went wrong while making endorsement',
  /** Shown when policy fetch fails */
  fetcPolicyErrorMessage: 'Something went wrong while trying to fetch the policy',
  /** Shown when reference data (e.g. ENDORSEREASON) fails to load */
  fetchRefDataFailureMessage: 'Unable to fetch reference data. please try again.',
  back: 'Back',
  saveChanges: 'Save changes',
} as const;

/** Strings used to build the “summary of changes” list on the Summary page */
export const CscSummaryStrings = {
  addInsObj: ['insured Object ID: ', ' Added.'],
  deleteInsObj: ['insured Object ID: ', ' Deleted. '],
  editInsObj: 'Changed for Insured Object',
  objectType: 'Object type: ',
  addInsIndv: ['insured individual Name: ', ' Added. '],
  deleteInsIndv: ['insured individual Name: ', ' Deleted. '],
  indvType: 'Individual type: ',
  coverageLevelChange1: 'coverage level change for the coverage : ',
  coverageLevelChangeinsObj: ', insuredObject : ',
  coverageLevelChangeinsIndv: ', insured : ',
  coverageLevelChange2: 'changed to ',
} as const;

/** Optional: full labels object if you need more CSC constants */
export const CscConstants = {
  labels: CscEndorsementLabels,
  summary: CscSummaryStrings,
} as const;
