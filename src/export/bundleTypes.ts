export type ExportFile = {
  path: string;
  content: string;
};

export type ExportBundle = {
  /** Suggested zip file name, without extension. */
  name: string;
  /** Short human description shown in the export UI. */
  description: string;
  files: ExportFile[];
};
