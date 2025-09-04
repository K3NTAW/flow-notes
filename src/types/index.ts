export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  filePath?: string;
  children?: Block[];
  order: number;
}

export type BlockType = 
  | 'text'
  | 'heading'
  | 'todo'
  | 'list'
  | 'divider'
  | 'image'
  | 'pdf'
  | 'code';

export interface Note {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  folderId?: string;
}

export interface NoteMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  children?: (Folder | NoteMetadata)[];
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'note';
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  children?: FileSystemItem[];
  // Note-specific properties
  blocks?: Block[];
  tags?: string[];
}

export interface CommandMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

export interface PDFDocument {
  id: string;
  name: string;
  path: string;
  pages: number;
  createdAt: string;
  updatedAt: string;
  annotations?: PDFAnnotation[];
}

export interface PDFAnnotation {
  id: string;
  annotation_type: 'highlight' | 'comment' | 'drawing';
  content?: string;
  page: number;
  rect: [number, number, number, number];
  color?: string;
}

