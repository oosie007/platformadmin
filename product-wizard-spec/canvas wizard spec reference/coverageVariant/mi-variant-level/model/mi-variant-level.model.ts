import { TemplateRef } from '@angular/core';
import { CbButtonVariant } from '@chubb/ui-components';

export interface MiVariantLevelLabels {
  createSucessMessage: string;
  createErrorMessage: string;
  updateSucessMessage: string;
  updateErrorMessage: string;
  errorMessage: string;
  addInfoModalTitle: string;
  secondaryBtnLabelOfAddInfoModal: string;
  primaryBtnLabelOfAddInfoModal: string;
  tertiaryBtnLabelOfAddInfoModal: string;
  offText: string;
  headerText: string;
  insuredText: string;
  copyFrom: string;
  insuredConfiguration: string;
  defineLimits: string;
  additionalConfiguration: string;
  back: string;
  saveAndExit: string;
  next: string;
  saveAndNext: string;
  dpchildHeaderText: string;
  dpadultHeaderText: string;
  spHeaderText: string;
}

export interface PopUpModalConfig {
  title: string;
  description: string;
  secondaryBtnLabel: string;
  primaryBtnLabel: string;
  tertiaryBtnLabel: string;
  primaryAction: ButtonAction;
  secondaryAction: ButtonAction;
  tertiaryAction: ButtonAction;
  primaryBtnIconKey?: string;
  primaryBtnVariant?: CbButtonVariant;
  contentPlaceholder: TemplateRef<unknown> | null;
  primaryButtonDisableFn?: () => boolean;
}

enum ButtonAction {
  DISCARD_AND_EXIT = 'discardAndExit',
  OPEN_CREATE_MODAL = 'openCreateModal',
  OPEN_EDIT_MODAL = 'openEditModal',
  DISCARD_EDIT_CHANGES = 'discardEditChanges',
  CLEAR_All = 'clearAll',
  CLOSE_MODAL = 'closeModal',
  CANCEL_MODAL = 'cancel',
  SAVE_CHANGES = 'saveChanges',
}
