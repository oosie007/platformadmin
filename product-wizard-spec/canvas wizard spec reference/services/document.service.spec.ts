import { DocumentService } from './document.service';
import { of, throwError } from 'rxjs';
import { DocumentPostData } from '../types/documents';
import { productContextResponse } from '../types/mockResponses';

jest.useFakeTimers();

describe('DocumentService', () => {
  let service: DocumentService;
  let productContext!: any;
  let httpClientSpy: any;

  beforeEach(() => {
    httpClientSpy = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };
    productContext = { _getProductContext: jest.fn(() => productContextResponse) };
    service = new DocumentService(httpClientSpy, productContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should test getDocumentList', () => {
    const res = {
      data: [
        { id: '1', name: 'Document 1' },
        { id: '2', name: 'Document 2' }
      ],
    };
    const url = '/canvas/api/catalyst/products/1/documents?versionId=1&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(of(res));
    service.getDocumentList('1', '1').subscribe((data) => {
      expect(data).toEqual(res.data);
    });
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });

  it('should create document', () => {
    const res = { success: true };
    const data: DocumentPostData = {
      fileName: 'Test Document',
      file: 'test.txt',
      overwriteExisting: true,
      description: 'This is a test document',
    };
    const url = '/canvas/api/catalyst/products/1/documents/upload?versionId=1&requestId=1';
    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
    service.createDocument(data, '1', '1').subscribe((response) => {
      expect(response).toEqual(res);
    });
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(url, data);
  });

  it('should upload document', () => {
    const res = { success: true };
    const formData = new FormData();
    formData.append('file', new Blob(), 'test.txt');
    const url = '/canvas/api/catalyst/products/1/documents/upload?versionId=1&requestId=1';
    jest.spyOn(httpClientSpy, 'post').mockReturnValue(of(res));
    service.uploadDocument('1', '1', formData).subscribe((response) => {
      expect(response).toEqual(res);
    });
    expect(httpClientSpy.post).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.post).toHaveBeenCalledWith(url, formData);
  });

  it('should remove document', () => {
    const res = { success: true };
    const url = '/canvas/api/catalyst/products/1/documents/1?versionId=1&requestId=1';
    jest.spyOn(httpClientSpy, 'delete').mockReturnValue(of(res));
    service.removeDocument('1', '1', '1').subscribe((response) => {
      expect(response).toEqual(res);
    });
    expect(httpClientSpy.delete).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.delete).toHaveBeenCalledWith(url);
  });

  // Test error scenario for getDocumentList
  it('should handle error for getDocumentList', () => {
    const errorResponse = new Error('Network error');
    const url = '/canvas/api/catalyst/products/1/documents?versionId=1&requestId=1';
    jest.spyOn(httpClientSpy, 'get').mockReturnValue(throwError(errorResponse));
    service.getDocumentList('1', '1').subscribe({
      next: () => fail('expected an error, not documents'),
      error: (error) => expect(error).toBe(errorResponse),
    });
    expect(httpClientSpy.get).toHaveBeenCalledTimes(1);
    expect(httpClientSpy.get).toHaveBeenCalledWith(url);
  });
});
