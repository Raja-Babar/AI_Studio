
export enum BookStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected'
}

export interface Book {
  id: string;
  fileName: string;
  titleEnglish: string;
  titleSindhi: string;
  authorEnglish: string;
  authorSindhi: string;
  year: string;
  publisher: string;
  category: string;
  language: string;
  link: string;
  thumbnail: string;
  status: BookStatus;
  stage: string;
  currentHolderId: string;
  scannedBy: string;
  assignedTo: string;
  source: string;
  createdTime: string;
  createdBy: string;
  lastEditedTime: string;
  lastEditedBy: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AppState {
  currentUser: User | null;
  books: Book[];
}
