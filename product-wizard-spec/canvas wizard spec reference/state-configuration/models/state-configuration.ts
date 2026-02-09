export interface StateConfigurationLabels {
  back: string;
  next: string;
  saveToDraft: string;
  fetchError: string;
  title: string;
  sucessMessage: string;
  errorMessage: string;
  errorTermVal: string;
  validationErrorMessage: string;
}

export interface StateConfiguration {
  state: string;
  issuingCompany: string;
  preRenewalPeriodDays: number | null;
  renewalNoticePeriodDays: number | null;
  minEarnedPremium: string | null;
  isRefundable: boolean;
}
