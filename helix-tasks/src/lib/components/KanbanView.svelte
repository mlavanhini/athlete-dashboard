<script lang="ts">
  import type { Task } from '$lib/types';
  import TaskCard from './TaskCard.svelte';
  import { createEventDispatcher } from 'svelte';

  export let tasks: Task[];

  const dispatch = createEventDispatcher<{
    edit: Task;
    cycleStatus: Task;
    statusChange: { task: Task; status: string };
  }>();

  interface Column {
    id: string;
    label: string;
    color: string;
    icon: string;
  }

  const columns: Column[] = [
    { id: 'todo', label: 'Todo', color: 'var(--muted)', icon: '○' },
    { id: 'in-progress', label: 'In Progress', color: 'var(--blue)', icon: '◑' },
    { id: 'done', label: 'Done', color: 'var(--green)', icon: '●' },
    { id: 'cancelled', label: 'Cancelled', color: 'var(--red)', icon: '⊘' }
  ];

  $: colTasks = (colId: string) => tasks.filter((t) => t.status === colId);

  let draggedTask: Task | null = null;
  let dragOverCol: string | null = null;

  function onDragStart(task: Task) {
    draggedTask = task;
  }

  function onDragOver(e: DragEvent, colId: string) {
    e.preventDefault();
    dragOverCol = colId;
  }

  function onDrop(colId: string) {
    if (draggedTask && draggedTask.status !== colId) {
      dispatch('statusChange', { task: draggedTask, status: colId });
    }
    draggedTask = null;
    dragOverCol = null;
  }

  function onDragLeave() {
    dragOverCol = null;
  }
</script>

<div class="kanban">
  {#each columns as col}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="col {dragOverCol === col.id ? 'drag-over' : ''}"
      on:dragover={(e) => onDragOver(e, col.id)}
      on:drop={() => onDrop(col.id)}
      on:dragleave={onDragLeave}
    >
      <div class="col-header">
        <span class="col-icon" style="color:{col.color}">{col.icon}</span>
        <span class="col-label">{col.label}</span>
        <span class="col-count">{colTasks(col.id).length}</span>
      </div>

      <div class="col-cards">
        {#each colTasks(col.id) as task (task.id)}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="draggable"
            draggable="true"
            on:dragstart={() => onDragStart(task)}
          >
            <TaskCard
              {task}
              on:edit={(e) => dispatch('edit', e.detail)}
              on:cycleStatus={(e) => dispatch('cycleStatus', e.detail)}
            />
          </div>
        {/each}

        {#if colTasks(col.id).length === 0}
          <div class="col-empty">Drop tasks here</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .kanban {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 24px;
    overflow-x: auto;
    height: 100%;
    align-content: start;
  }

  .col {
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 200px;
    transition: border-color 0.15s, background 0.15s;
  }
  .col.drag-over {
    border-color: var(--accent);
    background: rgba(99,102,241,0.07);
  }

  .col-header {
    display: flex;
    align-items: center;
    gap: 7px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }

  .col-icon { font-size: 16px; }

  .col-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    flex: 1;
  }

  .col-count {
    font-size: 11px;
    color: var(--muted);
    background: rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 1px 7px;
  }

  .col-cards { display: flex; flex-direction: column; gap: 7px; }

  .draggable { cursor: grab; }
  .draggable:active { cursor: grabbing; opacity: 0.7; }

  .col-empty {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--muted);
    border: 1px dashed var(--border);
    border-radius: 6px;
  }

  @media (max-width: 900px) {
    .kanban { grid-template-columns: repeat(2, 1fr); }
  }
</style>
