import { ToastParameter } from '@canvas/components';

export interface ProductAttributeResponse {
  requestId: string;
  data: ProductAttribute[];
  succeeded: boolean;
  errors: unknown;
  errorList: unknown;
  warnings: unknown;
}

export interface ProductAttribute {
  attrId?: string;
  options?: unknown;
  attrName: string;
  description?: string;
  section?: string;
  type: string;
  required: boolean;
  validationExpression?: string;
  maxOccurence?: number;
  doNotAllowDuplicate: boolean;
  insuredTypes?: unknown;
  productStatus?: string;
  policyAssociation?: string;
  answers?: CustomAttributeAnswer[];
  isCurrentVersion: boolean;
  defaultValue?: string;
}

export interface CustomAttributeAnswer {
  answerValue: string;
  answerDescription: string;
}
export interface ProductAttributeRequest {
  requestId: string;
  customAttributes: ProductAttribute;
}

export interface PredefineAttributeRequest {
  requestId: string;
  customAttributes: ProductAttribute[];
}

export interface DeleteProductAttributeResponse {
  succeeded: string;
  errors: unknown;
  errorList: unknown;
  warnings: unknown;
}

export interface ProductAttributeLabels {
  title: string;
  searchPlaceholder: string;
  createAttributeBtnLabel: string;
  existingAttributeBtnLabel: string;
  createDrawerTitle: string;
  editDrawerTitle: string;
  submitBtnLabel: string;
  cancelBtnLabel: string;
  nextBtnLabel: string;
  backBtnLabel: string;
  predefineAttributeAddLabel: string;
  predefineAttributeDiscardLabel: string;
  searchPredefinePlaceholder: string;
}

interface Message {
  success: ToastParameter;
  error: ToastParameter;
}

export interface ProductAttributeMessages {
  save: Message;
  edit: Message;
  delete: Message;
  fetch: Message;
  attributeExistsError: string;
}

export interface PredefineAttributeResponse {
  productClass: string;
  predefinedAttrValues: AttributeValue[];
}

export interface AttributeValue {
  attributeId: string,
  attributeDescription: string,
  datatype: string,
  category: string
}