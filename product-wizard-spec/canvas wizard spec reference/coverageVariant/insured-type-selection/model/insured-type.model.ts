import { FormControl, FormGroup } from '@angular/forms';
import { messageKey } from '../../../../types/product';

export interface InsuredObjectForm {
  objectId: FormControl;
  isGroup: FormControl;
  minQuantity: FormControl;
  maxQuantity: FormControl;
  predefinedAttribute: FormControl;
  predefinedTypeChipControl: FormControl;
  requiredAttribute: FormControl;
  doNotAllowDuplicateAttribute: FormControl;
  allowedParties: FormGroup;
  customAttributesForm: FormGroup;
}

export interface Insured {
  minCount: FormControl;
  maxCount: FormControl;
  minAge: FormControl;
  maxAge: FormControl;
  renewalAge: FormControl;
}

export interface InsuredType extends Insured {
  insuredTypeId: string;
  insured: string;
  individual: messageKey;
}

export interface InsuredGroup {
  insuredGroupName: string;
  insuredGroupTypes: InsuredType[];
}

export interface InsuredResponse {
  insuredId: string;
  includeBeneficiaries: boolean;
  individual: Individual;
  entities?: string[];
  requestId: string;
}

export interface Individual {
  individualId: string;
  individuallyRated: string;
  ageRequired: boolean;
  insuredTypes: InsuredGroup[];
  customAttributes: CustomeAttributes[];
}

export interface CustomeAttributes {
  attrId: string;
  attrName: string;
  type: string;
  required: string;
  answers?: CustomAttributeAnswer[]
}

export interface CustomAttributeAnswer {
  answerValue: string;
  answerDescription: string;
}

export enum InsuredFormTypes {
  OBJECTTYPE = 'objectType',
  EVENTTYPE = 'eventType',
  PREDEFINEDATTRIBUTE = 'predefinedAttribute',
  ALLOWEDPARTYTYPE = 'allowedPartyType',
  INSUREDTYPE = 'insuredType',
  DEPENDENTTYPE = 'dependantType'
}
