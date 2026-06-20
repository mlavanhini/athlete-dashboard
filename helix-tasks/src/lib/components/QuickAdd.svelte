<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task } from '$lib/types';

  const dispatch = createEventDispatcher<{ add: Partial<Task> }>();

  let title = '';
  let due = '';
  let priority = '';

  function submit() {
    const t = title.trim();
    if (!t) return;
    dispatch('add', {
      title: t,
      due: due || undefined,
      priority: (priority as Task['priority']) || undefined,
      status: 'todo',
      contexts: [],
      body: ''
    });
    title = '';
    due = '';
    priority = '';
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }
</script>

<div class="quick-add">
  <div class="qa-inner">
    <span class="plus">+</span>
    <input
      type="text"
      placeholder="Add task… (press Enter)"
      bind:value={title}
      on:keydown={onKeydown}
      class="qa-input"
    />
    <input type="date" bind:value={due} class="qa-date" title="Due date" />
    <select bind:value={priority} class="qa-priority" title="Priority">
      <option value="">Priority</option>
      <option value="urgent">🔴 Urgent</option>
      <option value="high">🟠 High</option>
      <option value="medium">🟡 Medium</option>
      <option value="low">🟢 Low</option>
    </select>
    <button class="qa-btn" on:click={submit} disabled={!title.trim()}>Add</button>
  </div>
</div>

<style>
  .quick-add {
    padding: 12px 24px;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.01);
  }

  .qa-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    transition: border-color 0.15s;
  }
  .qa-inner:focus-within { border-color: var(--accent); }

  .plus {
    color: var(--muted);
    font-size: 18px;
    line-height: 1;
    flex-shrink: 0;
  }

  .qa-input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 14px;
    flex: 1;
    min-width: 0;
  }
  .qa-input::placeholder { color: var(--muted); }

  .qa-date {
    background: none;
    border: none;
    border-left: 1px solid var(--border);
    outline: none;
    color: var(--muted);
    font-size: 13px;
    padding: 0 8px;
    cursor: pointer;
  }
  .qa-date:focus { color: var(--text); }

  .qa-priority {
    background: none;
    border: none;
    border-left: 1px solid var(--border);
    outline: none;
    color: var(--muted);
    font-size: 13px;
    padding: 0 8px;
    cursor: pointer;
  }
  .qa-priority option { background: #1a1d26; }

  .qa-btn {
    background: var(--accent);
    border: none;
    border-radius: 5px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 5px 14px;
    cursor: pointer;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .qa-btn:hover { opacity: 0.85; }
  .qa-btn:disabled { opacity: 0.35; cursor: default; }
</style>
