declare module "pdfjs-dist/build/pdf.mjs" {
  export const GlobalWorkerOptions:
    | {
        workerSrc?: string;
      }
    | undefined;

  export function getDocument(options: {
    data: Uint8Array;
    isEvalSupported: false;
    useWorkerFetch: false;
    stopAtErrors: false;
  }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
      }>;
      destroy?(): Promise<void> | void;
    }>;
    destroy?(): Promise<void> | void;
  };
}
