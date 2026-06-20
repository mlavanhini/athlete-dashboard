export interface Task {
  id: string;
  fileName: string;
  filePath: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done' | 'cancelled';
  due?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  project?: string;
  contexts: string[];
  created?: string;
  completedAt?: string;
  body: string;
}

export type View = 'list' | 'kanban' | 'calendar';

export interface Filters {
  search: string;
  status: string;
  priority: string;
  project: string;
  category: string;
}
