declare module "mammoth" {
  export interface ExtractResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
  const mammoth: {
    extractRawText: typeof extractRawText;
    convertToHtml: typeof convertToHtml;
  };
  export default mammoth;
}
