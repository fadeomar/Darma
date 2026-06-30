export type CoreMetadataValue = string | number | boolean | string[] | undefined;
export type CoreMetadata = Record<string, CoreMetadataValue>;

export const compactCoreMetadata = (metadata: CoreMetadata): CoreMetadata =>
  Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined && value !== ""));
