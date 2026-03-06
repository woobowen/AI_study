export interface ApiEnvelope<T> {
  code: number;
  data: T;
}

export interface CreateBookmarkReq {
  targetType: 'K2V' | 'C2V' | '3D_MODEL' | 'NODE';
  targetId: string;
  title: string;
}

export interface CreateErrorReq {
  questionId: string;
  questionTitle: string;
  codeSnippet: string;
}
