<script lang="ts">
  import type { Task } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  export let tasks: Task[];

  const dispatch = createEventDispatcher<{ edit: Task }>();

  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth(); // 0-indexed

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  $: calDays = buildCalendar(viewYear, viewMonth);
  $: tasksByDate = groupByDate(tasks);

  function buildCalendar(year: number, month: number) {
    const first = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: string | null; day: number | null }[] = [];

    for (let i = 0; i < first; i++) {
      days.push({ date: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d });
    }
    // Pad to complete last row
    while (days.length % 7 !== 0) {
      days.push({ date: null, day: null });
    }
    return days;
  }

  function groupByDate(all: Task[]): Record<string, Task[]> {
    const map: Record<string, Task[]> = {};
    all.forEach((t) => {
      if (t.due) {
        if (!map[t.due]) map[t.due] = [];
        map[t.due].push(t);
      }
    });
    return map;
  }

  function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function prevMonth() {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; }
    else viewMonth--;
  }

  function nextMonth() {
    if (viewMonth === 11) { viewMonth = 0; viewYear++; }
    else viewMonth++;
  }

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e'
  };
</script>

<div class="calendar-view">
  <div class="cal-header">
    <button class="nav-btn" on:click={prevMonth}>‹</button>
    <h2 class="month-title">{monthNames[viewMonth]} {viewYear}</h2>
    <button class="nav-btn" on:click={nextMonth}>›</button>
    <button class="today-btn" on:click={() => { viewYear = new Date().getFullYear(); viewMonth = new Date().getMonth(); }}>
      Today
    </button>
  </div>

  <div class="day-names">
    {#each dayNames as dn}
      <div class="day-name">{dn}</div>
    {/each}
  </div>

  <div class="grid">
    {#each calDays as cell}
      <div
        class="cell {cell.date === todayStr() ? 'today' : ''} {cell.date ? 'has-date' : 'empty'}"
      >
        {#if cell.day !== null && cell.date !== null}
          <span class="day-num">{cell.day}</span>
          <div class="cell-tasks">
            {#each (tasksByDate[cell.date] || []).slice(0, 3) as task}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="task-pill status-{task.status}"
                style="border-left: 3px solid {priorityColors[task.priority || ''] || 'var(--accent)'}"
                on:click|stopPropagation={() => dispatch('edit', task)}
                title={task.title}
              >
                {task.title}
              </div>
            {/each}
            {#if (tasksByDate[cell.date] || []).length > 3}
              <div class="more-pill">+{(tasksByDate[cell.date] || []).length - 3} more</div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .calendar-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .cal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
  }

  .month-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
    flex: 1;
  }

  .nav-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    width: 32px;
    height: 32px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.1); }

  .today-btn {
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 6px;
    color: var(--accent);
    font-size: 12px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .today-btn:hover { background: rgba(99,102,241,0.25); }

  .day-names {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    padding: 0 24px;
    border-bottom: 1px solid var(--border);
  }

  .day-name {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    padding: 8px 6px;
    text-align: center;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 24px;
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    margin: 0 24px 24px;
    border-radius: 8px;
  }

  .cell {
    background: var(--bg);
    min-height: 100px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .cell.today .day-num {
    background: var(--accent);
    color: #fff;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell.empty { background: rgba(255,255,255,0.01); }

  .day-num {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
    align-self: flex-start;
    margin-bottom: 3px;
  }

  .cell-tasks { display: flex; flex-direction: column; gap: 2px; }

  .task-pill {
    font-size: 11px;
    padding: 2px 5px;
    border-radius: 3px;
    background: rgba(99,102,241,0.12);
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.12s;
  }
  .task-pill:hover { background: rgba(99,102,241,0.25); }
  .task-pill.status-done { opacity: 0.5; text-decoration: line-through; }
  .task-pill.status-cancelled { opacity: 0.35; }

  .more-pill {
    font-size: 10px;
    color: var(--muted);
    padding: 1px 5px;
    cursor: default;
  }
</style>
