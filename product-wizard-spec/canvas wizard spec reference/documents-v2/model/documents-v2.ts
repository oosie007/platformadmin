export interface DocumentsV2Labels {
  title: string;
  cancelBtn: string;
  uploadBtn: string;
  successMsg: string;
  errorMsg: string;
  addDocsBtnlabel: string;
  backBtnLabel: string;
  saveAndExitBtnLabel: string;
  searchPlaceholder: string;
  getDocsListError: string;
  fileUploadSuccess:string;
  fileUploadFailed: string;
  EditDocHeaderLabel: string;
}

export interface Documents {
  documentId: string;
  name: string;
  description: string;
  url: string;
  fileName: string;
}
