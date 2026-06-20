<script lang="ts">
  import type { Task } from '$lib/types';
  import TaskCard from './TaskCard.svelte';
  import { createEventDispatcher } from 'svelte';

  export let tasks: Task[];

  const dispatch = createEventDispatcher<{ edit: Task; cycleStatus: Task }>();

  function today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function weekEnd(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }

  interface Group {
    label: string;
    color: string;
    tasks: Task[];
  }

  $: groups = buildGroups(tasks);

  function buildGroups(all: Task[]): Group[] {
    const td = today();
    const tm = tomorrow();
    const we = weekEnd();

    const active = all.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
    const done = all.filter((t) => t.status === 'done');
    const cancelled = all.filter((t) => t.status === 'cancelled');

    const overdue = active.filter((t) => t.due && t.due < td);
    const todayT = active.filter((t) => t.due === td);
    const tomorrowT = active.filter((t) => t.due === tm);
    const week = active.filter((t) => t.due && t.due > tm && t.due <= we);
    const later = active.filter((t) => t.due && t.due > we);
    const noDue = active.filter((t) => !t.due);

    const g: Group[] = [];
    if (overdue.length) g.push({ label: 'Overdue', color: 'var(--red)', tasks: overdue });
    if (todayT.length) g.push({ label: 'Today', color: 'var(--orange)', tasks: todayT });
    if (tomorrowT.length) g.push({ label: 'Tomorrow', color: 'var(--yellow)', tasks: tomorrowT });
    if (week.length) g.push({ label: 'This Week', color: 'var(--blue)', tasks: week });
    if (later.length) g.push({ label: 'Later', color: 'var(--muted)', tasks: later });
    if (noDue.length) g.push({ label: 'No Due Date', color: 'var(--muted)', tasks: noDue });
    if (done.length) g.push({ label: 'Completed', color: 'var(--green)', tasks: done });
    if (cancelled.length) g.push({ label: 'Cancelled', color: 'var(--muted)', tasks: cancelled });
    return g;
  }
</script>

<div class="list-view">
  {#if tasks.length === 0}
    <div class="empty">
      <p>No tasks match your filters.</p>
    </div>
  {:else}
    {#each groups as group}
      <div class="group">
        <div class="group-header">
          <span class="group-dot" style="background:{group.color}"></span>
          <span class="group-label">{group.label}</span>
          <span class="group-count">{group.tasks.length}</span>
        </div>
        <div class="group-tasks">
          {#each group.tasks as task (task.id)}
            <TaskCard
              {task}
              on:edit={(e) => dispatch('edit', e.detail)}
              on:cycleStatus={(e) => dispatch('cycleStatus', e.detail)}
            />
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .list-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    overflow-y: auto;
    height: 100%;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--muted);
    font-size: 14px;
  }

  .group { display: flex; flex-direction: column; gap: 8px; }

  .group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }

  .group-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .group-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--muted);
  }

  .group-count {
    font-size: 11px;
    color: var(--muted);
    background: rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 1px 8px;
    margin-left: 2px;
  }

  .group-tasks { display: flex; flex-direction: column; gap: 6px; }
</style>
