declare module "pdfjs-dist/build/pdf" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(params: { data: ArrayBuffer }): {
    promise: Promise<any>;
  };
}
