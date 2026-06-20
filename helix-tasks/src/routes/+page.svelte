<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { open } from '@tauri-apps/plugin-dialog';

  import type { Task } from '$lib/types';
  import {
    tasks,
    folderPath,
    currentView,
    filteredTasks,
    editingTask,
    showModal
  } from '$lib/store';

  import Sidebar from '$lib/components/Sidebar.svelte';
  import QuickAdd from '$lib/components/QuickAdd.svelte';
  import ListView from '$lib/components/ListView.svelte';
  import KanbanView from '$lib/components/KanbanView.svelte';
  import CalendarView from '$lib/components/CalendarView.svelte';
  import EditModal from '$lib/components/EditModal.svelte';

  let loading = false;
  let error = '';

  $: folderName = $folderPath ? $folderPath.split('/').pop() || $folderPath : '';

  onMount(async () => {
    const saved = localStorage.getItem('helix_tasks_folder');
    if (saved) {
      $folderPath = saved;
      await loadTasks();
    }
  });

  async function openFolder() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        $folderPath = selected;
        localStorage.setItem('helix_tasks_folder', selected);
        await loadTasks();
      }
    } catch (e) {
      error = String(e);
    }
  }

  async function loadTasks() {
    if (!$folderPath) return;
    loading = true;
    error = '';
    try {
      const result = await invoke<Task[]>('list_tasks', { folderPath: $folderPath });
      $tasks = result;
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function handleQuickAdd(e: CustomEvent<Partial<Task>>) {
    if (!$folderPath) {
      error = 'Open a folder first to save tasks.';
      return;
    }
    const partial = e.detail;
    const newTask: Task = {
      id: '',
      fileName: '',
      filePath: '',
      title: partial.title || 'Untitled',
      status: 'todo',
      due: partial.due,
      priority: partial.priority,
      category: undefined,
      project: undefined,
      contexts: [],
      body: ''
    };
    try {
      const created = await invoke<Task>('create_task', { folderPath: $folderPath, task: newTask });
      $tasks = [...$tasks, created];
    } catch (e) {
      error = String(e);
    }
  }

  function openEdit(task: Task) {
    $editingTask = task;
    $showModal = true;
  }

  async function handleCycleStatus(e: CustomEvent<Task>) {
    const task = e.detail;
    const cycle: Record<string, Task['status']> = {
      todo: 'in-progress',
      'in-progress': 'done',
      done: 'todo',
      cancelled: 'todo'
    };
    const updated: Task = {
      ...task,
      status: cycle[task.status] || 'todo',
      completedAt: cycle[task.status] === 'done' ? new Date().toISOString().slice(0, 10) : undefined
    };
    await persistUpdate(updated);
  }

  async function handleStatusChange(e: CustomEvent<{ task: Task; status: string }>) {
    const { task, status } = e.detail;
    const updated: Task = {
      ...task,
      status: status as Task['status'],
      completedAt: status === 'done' ? new Date().toISOString().slice(0, 10) : task.completedAt
    };
    await persistUpdate(updated);
  }

  async function persistUpdate(updated: Task) {
    try {
      const saved = await invoke<Task>('update_task', { task: updated });
      $tasks = $tasks.map((t) => (t.id === saved.id ? saved : t));
    } catch (e) {
      error = String(e);
    }
  }

  async function handleSave(e: CustomEvent<Task>) {
    const task = e.detail;
    try {
      if (!task.filePath) {
        // New task created from edit modal
        const created = await invoke<Task>('create_task', { folderPath: $folderPath, task });
        $tasks = [...$tasks, created];
      } else {
        const saved = await invoke<Task>('update_task', { task });
        $tasks = $tasks.map((t) => (t.id === saved.id ? saved : t));
      }
      $showModal = false;
      $editingTask = null;
    } catch (e) {
      error = String(e);
    }
  }

  async function handleDelete(e: CustomEvent<Task>) {
    const task = e.detail;
    try {
      await invoke('delete_task', { filePath: task.filePath });
      $tasks = $tasks.filter((t) => t.id !== task.id);
      $showModal = false;
      $editingTask = null;
    } catch (e) {
      error = String(e);
    }
  }

  function closeModal() {
    $showModal = false;
    $editingTask = null;
  }

  function newTask() {
    $editingTask = {
      id: '',
      fileName: '',
      filePath: '',
      title: '',
      status: 'todo',
      due: undefined,
      priority: undefined,
      category: undefined,
      project: undefined,
      contexts: [],
      body: ''
    };
    $showModal = true;
  }
</script>

<div class="app">
  <Sidebar {folderName} on:openFolder={openFolder} />

  <div class="main">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        {#if $folderPath}
          <span class="folder-path">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            {folderName}
          </span>
          <span class="task-count">{$filteredTasks.length} tasks</span>
        {:else}
          <span class="no-folder">No folder open</span>
        {/if}
      </div>
      <div class="toolbar-right">
        {#if $folderPath}
          <button class="toolbar-btn" on:click={loadTasks} title="Refresh" class:spin={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
          </button>
        {/if}
        <button class="new-task-btn" on:click={newTask}>
          + New Task
        </button>
      </div>
    </div>

    {#if error}
      <div class="error-bar">
        ⚠ {error}
        <button on:click={() => (error = '')} class="dismiss">✕</button>
      </div>
    {/if}

    {#if !$folderPath}
      <!-- Welcome / empty state -->
      <div class="welcome">
        <div class="welcome-card">
          <div class="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <h1>Helix Tasks</h1>
          <p>Markdown-native task manager. Each task is a <code>.md</code> file with YAML frontmatter.</p>
          <button class="open-folder-btn" on:click={openFolder}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            Open Tasks Folder
          </button>
          <p class="welcome-hint">
            Compatible with <strong>TaskNotes</strong> (Obsidian) format:
          </p>
          <pre class="code-example">---
title: My Task
status: todo
due: 2026-06-25
priority: high
project: Training
---

Notes go here.</pre>
        </div>
      </div>
    {:else if loading}
      <div class="loading">
        <div class="spinner"></div>
        Loading tasks…
      </div>
    {:else}
      <QuickAdd on:add={handleQuickAdd} />

      <div class="view-container">
        {#if $currentView === 'list'}
          <ListView
            tasks={$filteredTasks}
            on:edit={(e) => openEdit(e.detail)}
            on:cycleStatus={handleCycleStatus}
          />
        {:else if $currentView === 'kanban'}
          <KanbanView
            tasks={$filteredTasks}
            on:edit={(e) => openEdit(e.detail)}
            on:cycleStatus={handleCycleStatus}
            on:statusChange={handleStatusChange}
          />
        {:else if $currentView === 'calendar'}
          <CalendarView
            tasks={$filteredTasks}
            on:edit={(e) => openEdit(e.detail)}
          />
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if $showModal && $editingTask}
  <EditModal
    task={$editingTask}
    on:save={handleSave}
    on:delete={handleDelete}
    on:close={closeModal}
  />
{/if}

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(:root) {
    --bg: #0d0f14;
    --card: #161a23;
    --border: #252b38;
    --text: #e2e8f0;
    --muted: #64748b;
    --green: #22c55e;
    --yellow: #eab308;
    --red: #ef4444;
    --blue: #3b82f6;
    --purple: #a855f7;
    --orange: #f97316;
    --teal: #14b8a6;
    --accent: #6366f1;
  }
  :global(body) {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    height: 100vh;
    overflow: hidden;
  }

  .app {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .toolbar {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    gap: 12px;
    min-height: 52px;
  }

  .toolbar-left { display: flex; align-items: center; gap: 10px; flex: 1; }
  .toolbar-right { display: flex; align-items: center; gap: 8px; }

  .folder-path {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    font-size: 13px;
  }
  .folder-path svg { color: var(--muted); }

  .task-count {
    font-size: 12px;
    color: var(--muted);
    background: rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 2px 9px;
  }

  .no-folder { font-size: 13px; color: var(--muted); }

  .toolbar-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--muted);
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .toolbar-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }
  .toolbar-btn.spin svg { animation: spin 0.8s linear infinite; }

  @keyframes spin { to { transform: rotate(360deg); } }

  .new-task-btn {
    background: var(--accent);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 16px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .new-task-btn:hover { opacity: 0.85; }

  .error-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(239,68,68,0.12);
    border-bottom: 1px solid rgba(239,68,68,0.25);
    color: var(--red);
    font-size: 13px;
    padding: 8px 24px;
  }
  .dismiss {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--red);
    cursor: pointer;
    font-size: 14px;
  }

  .view-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Welcome screen */
  .welcome {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    overflow-y: auto;
  }

  .welcome-card {
    text-align: center;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .welcome-icon { color: var(--accent); opacity: 0.7; }

  .welcome-card h1 {
    font-size: 28px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--text), var(--muted));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .welcome-card p { color: var(--muted); font-size: 15px; line-height: 1.6; }

  .open-folder-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--accent);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    padding: 12px 28px;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity 0.15s, transform 0.15s;
  }
  .open-folder-btn:hover { opacity: 0.85; transform: translateY(-1px); }

  .welcome-hint { font-size: 13px !important; color: var(--muted); }

  .code-example {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 12px;
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    color: var(--muted);
    text-align: left;
    line-height: 1.7;
  }

  .loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--muted);
    font-size: 14px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
</style>
