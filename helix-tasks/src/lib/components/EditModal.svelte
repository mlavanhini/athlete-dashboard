<script lang="ts">
  import type { Task } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  export let task: Task;

  const dispatch = createEventDispatcher<{
    save: Task;
    delete: Task;
    close: void;
  }>();

  // Local copy for editing
  let form = { ...task, contexts: [...task.contexts] };
  let contextsStr = task.contexts.join(', ');

  function onSave() {
    const t: Task = {
      ...form,
      contexts: contextsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    };
    dispatch('save', t);
  }

  function onDelete() {
    if (confirm(`Delete "${task.title}"? This will remove the file from disk.`)) {
      dispatch('delete', task);
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') dispatch('close');
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSave();
  }
</script>

<svelte:window on:keydown={onKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" on:click|self={() => dispatch('close')}>
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Edit Task</h2>
      <div class="modal-actions">
        <button class="del-btn" on:click={onDelete} title="Delete task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
        <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
      </div>
    </div>

    <div class="modal-body">
      <div class="field">
        <label for="title">Title</label>
        <input id="title" type="text" bind:value={form.title} placeholder="Task title" />
      </div>

      <div class="row">
        <div class="field">
          <label for="status">Status</label>
          <select id="status" bind:value={form.status}>
            <option value="todo">○ Todo</option>
            <option value="in-progress">◑ In Progress</option>
            <option value="done">● Done</option>
            <option value="cancelled">⊘ Cancelled</option>
          </select>
        </div>

        <div class="field">
          <label for="priority">Priority</label>
          <select id="priority" bind:value={form.priority}>
            <option value="">— None —</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>

        <div class="field">
          <label for="due">Due Date</label>
          <input id="due" type="date" bind:value={form.due} />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label for="project">Project</label>
          <input id="project" type="text" bind:value={form.project} placeholder="Project name" />
        </div>

        <div class="field">
          <label for="category">Category</label>
          <input id="category" type="text" bind:value={form.category} placeholder="Category" />
        </div>
      </div>

      <div class="field">
        <label for="contexts">Contexts <span class="hint">(comma-separated)</span></label>
        <input id="contexts" type="text" bind:value={contextsStr} placeholder="@home, @work…" />
      </div>

      <div class="field body-field">
        <label for="body">Notes</label>
        <textarea id="body" bind:value={form.body} rows="8" placeholder="Markdown notes…"></textarea>
      </div>

      {#if task.fileName}
        <p class="file-hint">📄 {task.fileName}</p>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn-secondary" on:click={() => dispatch('close')}>Cancel</button>
      <button class="btn-primary" on:click={onSave}>Save  <kbd>⌘↵</kbd></button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    width: 680px;
    max-width: 95vw;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }

  .modal-header {
    display: flex;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
  }

  .modal-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
    flex: 1;
  }

  .modal-actions { display: flex; gap: 8px; }

  .del-btn {
    background: none;
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 6px;
    color: var(--red);
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .del-btn:hover { background: rgba(239,68,68,0.12); }

  .close-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--muted);
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s;
  }
  .close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }

  .modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .hint { text-transform: none; font-weight: 400; letter-spacing: 0; }

  input[type="text"],
  input[type="date"],
  select,
  textarea {
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 14px;
    padding: 8px 10px;
    outline: none;
    transition: border-color 0.15s;
    font-family: inherit;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  select option { background: #1a1d26; }
  textarea { resize: vertical; line-height: 1.6; }

  .body-field textarea { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 13px; }

  .file-hint {
    font-size: 11px;
    color: var(--muted);
    margin: 0;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
  }

  .btn-primary {
    background: var(--accent);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    padding: 9px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.15s;
  }
  .btn-primary:hover { opacity: 0.85; }

  .btn-secondary {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--muted);
    font-size: 14px;
    padding: 9px 20px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.1); color: var(--text); }

  kbd {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    font-size: 11px;
    padding: 1px 5px;
    font-family: inherit;
  }
</style>
