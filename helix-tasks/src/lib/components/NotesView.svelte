<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { marked } from 'marked';
  import { onMount, onDestroy } from 'svelte';
  import type { NoteInfo } from '$lib/types';
  import { notes, selectedNote, folderPath } from '$lib/store';

  let content = '';
  let search = '';
  let viewMode: 'edit' | 'preview' | 'split' = 'split';
  let dirty = false;
  let saving = false;
  let newNoteName = '';
  let showNewNote = false;
  let error = '';
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  $: filtered = search
    ? $notes.filter((n) => n.relativePath.toLowerCase().includes(search.toLowerCase()))
    : $notes;

  $: previewHtml = content ? marked.parseSync(content) : '<p class="empty-preview">Nothing to preview yet.</p>';

  onMount(async () => {
    await loadNotes();
  });

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    if (dirty && $selectedNote) saveNow();
  });

  async function loadNotes() {
    if (!$folderPath) return;
    try {
      const result = await invoke<NoteInfo[]>('list_notes', { folderPath: $folderPath });
      $notes = result;
    } catch (e) {
      error = String(e);
    }
  }

  async function openNote(note: NoteInfo) {
    if (dirty && $selectedNote) await saveNow();
    $selectedNote = note;
    try {
      content = await invoke<string>('read_note', { filePath: note.path });
      dirty = false;
    } catch (e) {
      error = String(e);
    }
  }

  function onEdit() {
    dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 1500);
  }

  async function saveNow() {
    if (!$selectedNote || !dirty) return;
    saving = true;
    try {
      await invoke('write_note', { filePath: $selectedNote.path, content });
      dirty = false;
    } catch (e) {
      error = String(e);
    } finally {
      saving = false;
    }
  }

  async function createNote() {
    if (!newNoteName.trim()) return;
    try {
      const note = await invoke<NoteInfo>('create_note', {
        folderPath: $folderPath,
        name: newNoteName.trim()
      });
      $notes = [...$notes, note].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      showNewNote = false;
      newNoteName = '';
      await openNote(note);
    } catch (e) {
      error = String(e);
    }
  }

  async function deleteNote() {
    if (!$selectedNote) return;
    if (!confirm(`Delete "${$selectedNote.name}"?`)) return;
    try {
      await invoke('delete_note', { filePath: $selectedNote.path });
      $notes = $notes.filter((n) => n.path !== $selectedNote!.path);
      $selectedNote = null;
      content = '';
    } catch (e) {
      error = String(e);
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveNow();
    }
  }

  function noteIcon(name: string) {
    if (name.includes('/')) return '📁';
    return '📄';
  }

  function formatPath(rel: string) {
    const parts = rel.split('/');
    if (parts.length === 1) return rel.replace('.md', '');
    return parts.slice(0, -1).join(' / ') + ' / ' + parts[parts.length - 1].replace('.md', '');
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="notes-layout">
  <!-- File Browser -->
  <aside class="notes-sidebar">
    <div class="ns-header">
      <span class="ns-title">Notes</span>
      <button class="icon-btn" on:click={() => (showNewNote = !showNewNote)} title="New note">+</button>
      <button class="icon-btn" on:click={loadNotes} title="Refresh">↻</button>
    </div>

    {#if showNewNote}
      <div class="new-note-row">
        <input
          type="text"
          placeholder="note-name.md"
          bind:value={newNoteName}
          on:keydown={(e) => e.key === 'Enter' && createNote()}
          autofocus
          class="new-note-input"
        />
        <button class="create-btn" on:click={createNote} disabled={!newNoteName.trim()}>Create</button>
      </div>
    {/if}

    <div class="ns-search">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="text" placeholder="Filter notes…" bind:value={search} class="search-input" />
    </div>

    <div class="file-list">
      {#each filtered as note (note.path)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="file-item {$selectedNote?.path === note.path ? 'active' : ''}"
          on:click={() => openNote(note)}
          title={note.relativePath}
        >
          <span class="file-icon">📄</span>
          <span class="file-name">{formatPath(note.relativePath)}</span>
        </div>
      {/each}
      {#if filtered.length === 0}
        <div class="empty-list">
          {search ? 'No matches' : 'No notes yet'}
        </div>
      {/if}
    </div>
  </aside>

  <!-- Editor Area -->
  <div class="editor-area">
    {#if error}
      <div class="error-bar">
        ⚠ {error}
        <button on:click={() => (error = '')} class="dismiss">✕</button>
      </div>
    {/if}

    {#if $selectedNote}
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <span class="note-title">
          {formatPath($selectedNote.relativePath)}
          {#if dirty}<span class="unsaved">●</span>{/if}
          {#if saving}<span class="saving">saving…</span>{/if}
        </span>
        <div class="toolbar-actions">
          <div class="view-toggle">
            <button class={viewMode === 'edit' ? 'active' : ''} on:click={() => (viewMode = 'edit')}>Edit</button>
            <button class={viewMode === 'split' ? 'active' : ''} on:click={() => (viewMode = 'split')}>Split</button>
            <button class={viewMode === 'preview' ? 'active' : ''} on:click={() => (viewMode = 'preview')}>Preview</button>
          </div>
          <button class="save-btn" on:click={saveNow} title="Save (⌘S)">Save</button>
          <button class="del-btn" on:click={deleteNote} title="Delete note">🗑</button>
        </div>
      </div>

      <!-- Editor / Preview -->
      <div class="editor-body {viewMode}">
        {#if viewMode !== 'preview'}
          <textarea
            class="md-editor"
            bind:value={content}
            on:input={onEdit}
            placeholder="Start writing in Markdown…"
            spellcheck="true"
          ></textarea>
        {/if}
        {#if viewMode !== 'edit'}
          <div class="md-preview" tabindex="-1">
            {@html previewHtml}
          </div>
        {/if}
      </div>
    {:else}
      <div class="no-note">
        <div class="no-note-inner">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <p>Select a note or create a new one</p>
          <button class="new-note-btn" on:click={() => (showNewNote = true)}>+ New Note</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .notes-layout {
    display: flex;
    height: 100%;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .notes-sidebar {
    width: 240px;
    min-width: 240px;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: rgba(255,255,255,0.01);
  }

  .ns-header {
    display: flex;
    align-items: center;
    padding: 14px 14px 10px;
    gap: 4px;
  }

  .ns-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    flex: 1;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .icon-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 5px;
    color: var(--muted);
    width: 26px;
    height: 26px;
    cursor: pointer;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s, color 0.12s;
  }
  .icon-btn:hover { background: rgba(255,255,255,0.07); color: var(--text); }

  .new-note-row {
    display: flex;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
  }

  .new-note-input {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--accent);
    border-radius: 5px;
    color: var(--text);
    font-size: 12px;
    padding: 5px 8px;
    outline: none;
    min-width: 0;
  }

  .create-btn {
    background: var(--accent);
    border: none;
    border-radius: 5px;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 10px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .create-btn:disabled { opacity: 0.4; cursor: default; }

  .ns-search {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
  }
  .ns-search svg { color: var(--muted); flex-shrink: 0; }

  .search-input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 12px;
    width: 100%;
  }
  .search-input::placeholder { color: var(--muted); }

  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 12px;
    cursor: pointer;
    transition: background 0.1s;
    border-radius: 0;
  }
  .file-item:hover { background: rgba(255,255,255,0.04); }
  .file-item.active { background: rgba(99,102,241,0.15); }

  .file-icon { font-size: 13px; flex-shrink: 0; }

  .file-name {
    font-size: 12.5px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }
  .file-item.active .file-name { color: var(--text); }

  .empty-list {
    padding: 20px 14px;
    font-size: 12px;
    color: var(--muted);
    text-align: center;
  }

  /* ── Editor ── */
  .editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .error-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(239,68,68,0.12);
    border-bottom: 1px solid rgba(239,68,68,0.25);
    color: var(--red);
    font-size: 13px;
    padding: 7px 20px;
  }
  .dismiss { background: none; border: none; color: var(--red); cursor: pointer; margin-left: auto; }

  .editor-toolbar {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    gap: 12px;
    background: rgba(255,255,255,0.01);
    min-height: 48px;
  }

  .note-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .unsaved { color: var(--accent); font-size: 16px; line-height: 1; }
  .saving { font-size: 11px; color: var(--muted); font-weight: 400; }

  .toolbar-actions { display: flex; align-items: center; gap: 8px; }

  .view-toggle {
    display: flex;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .view-toggle button {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 12px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
  }
  .view-toggle button.active { background: rgba(99,102,241,0.2); color: var(--text); }
  .view-toggle button:hover:not(.active) { color: var(--text); }

  .save-btn {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--muted);
    font-size: 12px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.12s;
  }
  .save-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }

  .del-btn {
    background: none;
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 6px;
    color: var(--red);
    font-size: 14px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s;
  }
  .del-btn:hover { background: rgba(239,68,68,0.1); }

  .editor-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .editor-body.edit .md-editor { width: 100%; }
  .editor-body.preview .md-preview { width: 100%; }
  .editor-body.split .md-editor { width: 50%; border-right: 1px solid var(--border); }
  .editor-body.split .md-preview { width: 50%; }

  .md-editor {
    background: var(--bg);
    border: none;
    outline: none;
    color: var(--text);
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
    font-size: 14px;
    line-height: 1.7;
    padding: 24px 28px;
    resize: none;
    overflow-y: auto;
    height: 100%;
  }
  .md-editor::placeholder { color: var(--muted); }

  .md-preview {
    background: var(--bg);
    overflow-y: auto;
    padding: 24px 36px;
    height: 100%;
  }

  /* Markdown preview styles */
  :global(.md-preview h1) { font-size: 26px; font-weight: 800; color: var(--text); margin: 0 0 20px; line-height: 1.3; }
  :global(.md-preview h2) { font-size: 20px; font-weight: 700; color: var(--text); margin: 28px 0 14px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  :global(.md-preview h3) { font-size: 16px; font-weight: 700; color: var(--text); margin: 20px 0 10px; }
  :global(.md-preview h4, .md-preview h5, .md-preview h6) { font-size: 14px; font-weight: 700; color: var(--text); margin: 16px 0 8px; }
  :global(.md-preview p) { color: var(--text); margin: 0 0 16px; line-height: 1.75; font-size: 15px; }
  :global(.md-preview ul, .md-preview ol) { color: var(--text); margin: 0 0 16px 20px; line-height: 1.75; font-size: 15px; }
  :global(.md-preview li) { margin-bottom: 5px; }
  :global(.md-preview a) { color: var(--accent); text-decoration: none; }
  :global(.md-preview a:hover) { text-decoration: underline; }
  :global(.md-preview code) { background: rgba(255,255,255,0.08); border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; font-family: 'SF Mono', monospace; font-size: 13px; color: var(--teal); }
  :global(.md-preview pre) { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; overflow-x: auto; margin: 0 0 16px; }
  :global(.md-preview pre code) { background: none; border: none; padding: 0; font-size: 13px; color: var(--text); }
  :global(.md-preview blockquote) { border-left: 3px solid var(--accent); margin: 0 0 16px; padding: 4px 16px; color: var(--muted); font-style: italic; }
  :global(.md-preview hr) { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  :global(.md-preview table) { width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14px; }
  :global(.md-preview th) { background: rgba(255,255,255,0.05); padding: 8px 12px; text-align: left; font-weight: 600; color: var(--text); border: 1px solid var(--border); }
  :global(.md-preview td) { padding: 8px 12px; color: var(--text); border: 1px solid var(--border); }
  :global(.md-preview tr:nth-child(even) td) { background: rgba(255,255,255,0.02); }
  :global(.md-preview input[type="checkbox"]) { margin-right: 6px; accent-color: var(--accent); }
  :global(.md-preview .empty-preview) { color: var(--muted); font-style: italic; font-size: 14px; }

  /* No note selected */
  .no-note {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .no-note-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    color: var(--muted);
  }

  .no-note-inner p { font-size: 14px; margin: 0; }

  .new-note-btn {
    background: var(--accent);
    border: none;
    border-radius: 7px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 18px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .new-note-btn:hover { opacity: 0.85; }
</style>
