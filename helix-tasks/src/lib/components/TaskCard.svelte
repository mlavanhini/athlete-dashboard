<script lang="ts">
  import type { Task } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  export let task: Task;
  export let compact = false;

  const dispatch = createEventDispatcher<{ edit: Task; cycleStatus: Task }>();

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };

  const statusIcons: Record<string, string> = {
    todo: '○',
    'in-progress': '◑',
    done: '●',
    cancelled: '⊘'
  };

  function isOverdue(due?: string): boolean {
    if (!due) return false;
    return due < today();
  }

  function today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(d?: string): string {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m) - 1]} ${parseInt(day)}`;
  }

  function cycleStatus(e: MouseEvent) {
    e.stopPropagation();
    dispatch('cycleStatus', task);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="task-card {compact ? 'compact' : ''} status-{task.status}"
  class:overdue={isOverdue(task.due) && task.status !== 'done' && task.status !== 'cancelled'}
  on:click={() => dispatch('edit', task)}
>
  <div class="card-top">
    <button class="status-btn" on:click={cycleStatus} title="Cycle status">
      {statusIcons[task.status] || '○'}
    </button>
    <span class="title">{task.title}</span>
    {#if task.priority}
      <span class="priority-dot" style="background:{priorityColors[task.priority]}" title={task.priority}></span>
    {/if}
  </div>

  {#if !compact}
    <div class="card-meta">
      {#if task.due}
        <span class="meta-badge {isOverdue(task.due) && task.status !== 'done' ? 'overdue' : ''}">
          📅 {formatDate(task.due)}
        </span>
      {/if}
      {#if task.project}
        <span class="meta-badge project">◈ {task.project}</span>
      {/if}
      {#if task.category}
        <span class="meta-badge cat">{task.category}</span>
      {/if}
      {#each task.contexts as ctx}
        <span class="meta-badge ctx">@{ctx}</span>
      {/each}
    </div>
    {#if task.body}
      <p class="body-preview">{task.body.split('\n')[0].slice(0, 80)}{task.body.length > 80 ? '…' : ''}</p>
    {/if}
  {/if}
</div>

<style>
  .task-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    border-left: 3px solid var(--border);
  }
  .task-card:hover { border-color: var(--accent); }
  .task-card.status-done { opacity: 0.6; }
  .task-card.status-done .title { text-decoration: line-through; }
  .task-card.status-cancelled { opacity: 0.45; }
  .task-card.overdue { border-left-color: var(--red); }
  .task-card.status-in-progress { border-left-color: var(--blue); }

  .card-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-btn {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  .status-btn:hover { color: var(--text); }
  .status-done .status-btn { color: var(--green); }
  .status-in-progress .status-btn { color: var(--blue); }
  .status-cancelled .status-btn { color: var(--muted); }

  .title {
    flex: 1;
    font-size: 14px;
    color: var(--text);
    line-height: 1.4;
  }

  .priority-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
  }

  .meta-badge {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 10px;
    background: rgba(255,255,255,0.06);
    color: var(--muted);
    white-space: nowrap;
  }
  .meta-badge.overdue { color: var(--red); background: rgba(239,68,68,0.12); }
  .meta-badge.project { color: var(--purple); }
  .meta-badge.ctx { color: var(--teal); }

  .body-preview {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
  }

  .compact { padding: 7px 10px; }
  .compact .title { font-size: 13px; }
</style>
