import { writable, derived } from 'svelte/store';
import type { Task, View, Filters } from './types';

export const folderPath = writable<string>('');
export const tasks = writable<Task[]>([]);
export const currentView = writable<View>('list');
export const editingTask = writable<Task | null>(null);
export const showModal = writable(false);

export const filters = writable<Filters>({
  search: '',
  status: 'all',
  priority: 'all',
  project: 'all',
  category: 'all'
});

export const filteredTasks = derived([tasks, filters], ([$tasks, $filters]) => {
  return $tasks.filter((t) => {
    if ($filters.search) {
      const q = $filters.search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q)) return false;
    }
    if ($filters.status !== 'all' && t.status !== $filters.status) return false;
    if ($filters.priority !== 'all' && t.priority !== $filters.priority) return false;
    if ($filters.project !== 'all' && t.project !== $filters.project) return false;
    if ($filters.category !== 'all' && t.category !== $filters.category) return false;
    return true;
  });
});

export const projects = derived(tasks, ($tasks) => {
  const s = new Set<string>();
  $tasks.forEach((t) => { if (t.project) s.add(t.project); });
  return Array.from(s).sort();
});

export const categories = derived(tasks, ($tasks) => {
  const s = new Set<string>();
  $tasks.forEach((t) => { if (t.category) s.add(t.category); });
  return Array.from(s).sort();
});
