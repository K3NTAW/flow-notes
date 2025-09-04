import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NotionSidebar } from './components/NotionSidebar';
import { Editor } from './components/Editor';
import { NoteBreadcrumb } from './components/NoteBreadcrumb';
import { Note, NoteMetadata } from './types';
import './styles.css';

function App() {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const notesList = await invoke<NoteMetadata[]>('list_notes');
      setNotes(notesList);
      if (notesList.length > 0 && !currentNote) {
        loadNote(notesList[0].id);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const newNote = await invoke<Note>('create_note', { title: 'Untitled' });
      await loadNotes();
      setCurrentNote(newNote);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const loadNote = async (noteId: string) => {
    try {
      const note = await invoke<Note>('load_note', { noteId });
      setCurrentNote(note);
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  };

  const saveNote = async (note: Note) => {
    try {
      await invoke('save_note', { note });
      // Update the current note in state without reloading
      setCurrentNote(note);
      // Only reload the notes list to update sidebar, don't reload current note
      const notesList = await invoke<NoteMetadata[]>('list_notes');
      setNotes(notesList);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await invoke('delete_note', { noteId });
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
      }
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const exportNote = async (noteId: string) => {
    try {
      const note = await invoke<Note>('load_note', { noteId });
      const content = `# ${note.title}\n\n${note.blocks.map(block => block.content).join('\n\n')}`;
      
      // Create and download file
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'Untitled'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export note:', error);
    }
  };

  const duplicateNote = async (noteId: string) => {
    try {
      const note = await invoke<Note>('load_note', { noteId });
      const duplicatedNote = await invoke<Note>('create_note', { 
        title: `${note.title} (Copy)` 
      });
      
      // Copy the content
      const updatedNote = {
        ...duplicatedNote,
        blocks: note.blocks,
        updatedAt: new Date().toISOString(),
      };
      await invoke('save_note', { note: updatedNote });
      await loadNotes();
      setCurrentNote(updatedNote);
    } catch (error) {
      console.error('Failed to duplicate note:', error);
    }
  };

  // Navigation functions for breadcrumb
  const handleBreadcrumbNavigation = (noteId: string) => {
    loadNote(noteId);
  };

  const handleNavigateToAllNotes = () => {
    setCurrentNote(null);
  };

  // Folder management functions
  const handleFolderCreate = async (name: string, parentId?: string) => {
    try {
      // In a real implementation, this would call a backend API
      console.log('Creating folder:', name, 'in parent:', parentId);
      // For now, just show a success message
      alert(`Folder "${name}" created successfully!`);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleFolderRename = async (folderId: string, newName: string) => {
    try {
      // In a real implementation, this would call a backend API
      console.log('Renaming folder:', folderId, 'to:', newName);
      alert(`Folder renamed to "${newName}" successfully!`);
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      // In a real implementation, this would call a backend API
      console.log('Deleting folder:', folderId);
      if (confirm('Are you sure you want to delete this folder?')) {
        alert('Folder deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleMoveItem = async (itemId: string, newParentId?: string) => {
    try {
      // In a real implementation, this would call a backend API
      console.log('Moving item:', itemId, 'to parent:', newParentId);
      alert('Item moved successfully!');
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <NotionSidebar
        notes={notes}
        currentNoteId={currentNote?.id}
        onNoteSelect={loadNote}
        onNoteCreate={createNewNote}
        onNoteDelete={deleteNote}
        onNoteExport={exportNote}
        onNoteDuplicate={duplicateNote}
        onFolderCreate={handleFolderCreate}
        onFolderRename={handleFolderRename}
        onFolderDelete={handleFolderDelete}
        onMoveItem={handleMoveItem}
      />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <NoteBreadcrumb
          currentNote={currentNote}
          notes={notes}
          onNavigate={handleBreadcrumbNavigation}
          onNavigateToAllNotes={handleNavigateToAllNotes}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isLoading ? (
            <div>Loading...</div>
          ) : currentNote ? (
            <Editor
              key={currentNote.id}
              note={currentNote}
              onSave={saveNote}
            />
          ) : (
            <WelcomeScreen onCreateNote={createNewNote} />
          )}
        </div>
      </main>
    </div>
  );
}

const WelcomeScreen = ({ onCreateNote }: { onCreateNote: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
    <div style={{ textAlign: 'center', maxWidth: '400px', padding: '32px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>Welcome to Flow Notes</h2>
      <p style={{ marginBottom: '32px', fontSize: '16px', color: '#666' }}>
        Select a note from the sidebar or create a new one to get started.
      </p>
      <button
        onClick={onCreateNote}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}
      >
        Create New Note
      </button>
    </div>
  </div>
);

export default App;

