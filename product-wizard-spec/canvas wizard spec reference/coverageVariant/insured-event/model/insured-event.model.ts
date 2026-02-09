import { FormArray, FormControl, FormGroup } from "@angular/forms";

export interface InsuredEventLabels {
  duplicateCustAttrErrorMessage: string;
}

export interface InsuredEventForm {
  insuredEventId: FormControl;
  minQuantity: FormControl;
  maxQuantity: FormControl;
  eventForm: FormArray;
  customAttributesForm: FormGroup;
}

export interface InsuredEventsData {
  insuredEventId: string;
  minQuantity: number;
  maxQuantity: number;
  eventForm: FormArray;
  customAttributesForm: FormGroup;
  isCurrentVersion: boolean;
  customAttributes: CustomAttribute[];
}

interface CustomAttribute {
  attrName: string;
  description: string;
  section: string;
  type: string;
  required: boolean;
  validationExpression: string;
  maxOccurence: number;
  options: Option[];
  insuredTypes: string[];
  doNotAllowDuplicate: boolean;
  answers?: CustomAttributeAnswer[];
  isCurrentVersion: boolean;
  defaultValue?: string;
}

interface Option {
  key: string;
  value: string;
  isDefault: string;
  description: string;
  operator: string;
}

export interface CustomAttributeAnswer {
  answerValue: string;
  answerDescription: string;
}

export interface InsuredEventLabelsList {
  insuredSuccessMessage: string;
  insuredErrorMessage: string;
  insuredUpdateSuccess: string;
  minCountErrMessage: string;
  maxQuantityMinError: string;
  nameCharLimitErrorMsg: string;
  nameCharLimitError: string;
  requiredField: string;
  requiredMaxField: string;
  coverageErrorMessage: string;
  clearButtonLabel: string;
  confirmButtonLabel: string;
  nextButtonLabel: string;
  saveButtonLabel: string;
  saveExitButtonLabel: string;
  backButtonLabel: string;
  addAttributeButtonLabel: string;
}
