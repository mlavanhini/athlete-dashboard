<script lang="ts">
  import { filters, projects, categories, tasks, currentView } from '$lib/store';
  import type { View } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ openFolder: void }>();

  export let folderName = '';

  const views: { id: View; label: string; icon: string }[] = [
    { id: 'list', label: 'List', icon: '≡' },
    { id: 'kanban', label: 'Board', icon: '⊞' },
    { id: 'calendar', label: 'Calendar', icon: '◻' }
  ];

  const statuses = [
    { value: 'all', label: 'All Tasks' },
    { value: 'todo', label: 'Todo' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorities = [
    { value: 'all', label: 'Any Priority' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  $: counts = {
    todo: $tasks.filter((t) => t.status === 'todo').length,
    'in-progress': $tasks.filter((t) => t.status === 'in-progress').length,
    done: $tasks.filter((t) => t.status === 'done').length
  };
</script>

<aside class="sidebar">
  <div class="sidebar-logo">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
    <span>Helix Tasks</span>
  </div>

  <!-- Folder selector -->
  <button class="folder-btn" on:click={() => dispatch('openFolder')}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
    {folderName || 'Open Folder…'}
  </button>

  <!-- Views -->
  <nav class="nav-section">
    <p class="section-label">Views</p>
    {#each views as v}
      <button
        class="nav-item {$currentView === v.id ? 'active' : ''}"
        on:click={() => ($currentView = v.id)}
      >
        <span class="nav-icon">{v.icon}</span>
        {v.label}
      </button>
    {/each}
  </nav>

  <!-- Search -->
  <div class="nav-section">
    <p class="section-label">Search</p>
    <div class="search-wrap">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        placeholder="Search tasks…"
        bind:value={$filters.search}
        class="search-input"
      />
    </div>
  </div>

  <!-- Status filter -->
  <div class="nav-section">
    <p class="section-label">Status</p>
    {#each statuses as s}
      <button
        class="nav-item {$filters.status === s.value ? 'active' : ''}"
        on:click={() => ($filters.status = s.value)}
      >
        <span class="nav-icon">
          {#if s.value === 'todo'}○{:else if s.value === 'in-progress'}◑{:else if s.value === 'done'}●{:else if s.value === 'cancelled'}⊘{:else}◈{/if}
        </span>
        {s.label}
        {#if s.value !== 'all' && counts[s.value as keyof typeof counts] !== undefined}
          <span class="count">{counts[s.value as keyof typeof counts]}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Priority filter -->
  <div class="nav-section">
    <p class="section-label">Priority</p>
    <select bind:value={$filters.priority} class="filter-select">
      {#each priorities as p}
        <option value={p.value}>{p.label}</option>
      {/each}
    </select>
  </div>

  <!-- Project filter -->
  {#if $projects.length > 0}
    <div class="nav-section">
      <p class="section-label">Project</p>
      <button
        class="nav-item {$filters.project === 'all' ? 'active' : ''}"
        on:click={() => ($filters.project = 'all')}
      >All</button>
      {#each $projects as proj}
        <button
          class="nav-item {$filters.project === proj ? 'active' : ''}"
          on:click={() => ($filters.project = proj)}
        >
          <span class="nav-icon" style="color:var(--purple)">◈</span>
          {proj}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Category filter -->
  {#if $categories.length > 0}
    <div class="nav-section">
      <p class="section-label">Category</p>
      <button
        class="nav-item {$filters.category === 'all' ? 'active' : ''}"
        on:click={() => ($filters.category = 'all')}
      >All</button>
      {#each $categories as cat}
        <button
          class="nav-item {$filters.category === cat ? 'active' : ''}"
          on:click={() => ($filters.category = cat)}
        >{cat}</button>
      {/each}
    </div>
  {/if}
</aside>

<style>
  .sidebar {
    width: 220px;
    min-width: 220px;
    background: #0a0c10;
    border-right: 1px solid var(--border);
    padding: 16px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 14px;
    color: var(--text);
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.3px;
  }
  .sidebar-logo svg { color: var(--accent); }

  .folder-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 6px;
    color: var(--accent);
    font-size: 12px;
    padding: 7px 10px;
    cursor: pointer;
    width: 100%;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.15s;
  }
  .folder-btn:hover { background: rgba(99,102,241,0.2); }

  .nav-section {
    margin-top: 6px;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    padding: 6px 8px 4px;
    margin: 0;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--muted);
    font-size: 13px;
    padding: 7px 8px;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text); }
  .nav-item.active { background: rgba(99,102,241,0.15); color: var(--text); }

  .nav-icon {
    font-size: 15px;
    line-height: 1;
    width: 16px;
    text-align: center;
  }

  .count {
    margin-left: auto;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 1px 7px;
    font-size: 11px;
    color: var(--muted);
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 10px;
  }
  .search-wrap svg { color: var(--muted); flex-shrink: 0; }

  .search-input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 13px;
    width: 100%;
  }
  .search-input::placeholder { color: var(--muted); }

  .filter-select {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 13px;
    padding: 6px 10px;
    outline: none;
    cursor: pointer;
  }
  .filter-select option { background: #1a1d26; }
</style>
