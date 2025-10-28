export interface TextEntry {
  id: number;
  sectionIndex: number;
  text: string;
}

export type FileType = 'quest' | 'text';
export type TabType = 'converter' | 'editor';
export type OutputFormat = 'rdf' | 'xml';

export interface ParsedData {
  sections: any[][];
}


