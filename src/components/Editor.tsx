import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Note, Block, BlockType } from '../types';

interface EditorProps {
  note: Note;
  onSave: (note: Note) => void;
}

export const Editor: React.FC<EditorProps> = ({ note, onSave }) => {
  const [title, setTitle] = useState(note.title);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [lastNoteId, setLastNoteId] = useState(note.id);
  const [hasUserModifiedContent, setHasUserModifiedContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Press "/" for commands',
      }),
    ],
    content: blocksToHTML(note.blocks),
    onUpdate: ({ editor }) => {
      console.log('Editor content updated');
      setIsUserTyping(true);
      setHasUserModifiedContent(true);
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Save immediately since we fixed the reload issue
      saveTimeoutRef.current = setTimeout(() => {
        console.log('Starting save process...');
        setIsSaving(true);
        const blocks = htmlToBlocks(editor.getHTML());
        const updatedNote = {
          ...note,
          blocks,
          title,
          updatedAt: new Date().toISOString(),
        };
        console.log('Saving note:', updatedNote);
        onSave(updatedNote);
        console.log('Save completed, resetting states');
        setIsUserTyping(false);
        setIsSaving(false);
        setHasUserModifiedContent(false); // Reset after successful save
      }, 50); // Save after 50ms - very fast but prevents excessive saves while typing
    },
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 1.5em; padding: 0; font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"; font-size: 16px; line-height: 1.5; color: #37352f;',
      },
    },
    autofocus: true,
  });

  // Only update editor content when switching to a different note
  useEffect(() => {
    if (note.id !== lastNoteId) {
      setTitle(note.title);
      setLastNoteId(note.id);
      setHasUserModifiedContent(false); // Reset modification flag for new note
      setIsSaving(false); // Reset saving state for new note
      if (editor && !editor.isDestroyed) {
        const content = blocksToHTML(note.blocks);
        editor.commands.setContent(content);
      }
    }
  }, [note.id, lastNoteId, editor]);

  // Prevent content updates when user has modified content
  useEffect(() => {
    if (note.id === lastNoteId && hasUserModifiedContent) {
      console.log('Preventing content update - user has modified content');
      // Don't override user's changes - they take precedence
      return;
    }
  }, [note.blocks, note.id, lastNoteId, hasUserModifiedContent]);

  // Update title when note changes
  useEffect(() => {
    if (note.title !== title) {
      setTitle(note.title);
    }
  }, [note.title]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);


  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleTitleBlur = () => {
    if (title !== note.title) {
      const updatedNote = {
        ...note,
        title,
        updatedAt: new Date().toISOString(),
      };
      onSave(updatedNote);
    }
  }


  if (!editor) {
    return null;
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#ffffff'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '96px 96px 0 96px',
          minHeight: '100%'
        }}>
          {/* Notion-style title */}
          <div style={{
            marginBottom: '8px',
            position: 'relative'
          }}>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              style={{
                width: '100%',
                fontSize: '40px',
                fontWeight: '700',
                lineHeight: '1.2',
                color: '#37352f',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '3px 0',
                fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
                resize: 'none',
                minHeight: '1.2em'
              }}
              placeholder="Untitled"
            />
          </div>
          
          {/* Notion-style editor */}
          <div 
            style={{
              minHeight: 'calc(100vh - 200px)',
              cursor: 'text',
              position: 'relative'
            }}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent 
              editor={editor} 
              style={{
                outline: 'none',
                fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#37352f'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for content conversion
function blocksToHTML(blocks: Block[]): string {
  if (!blocks || blocks.length === 0) {
    return '<p></p>'; // Empty paragraph for clean start
  }
  return blocks.map(block => `<p>${block.content || ''}</p>`).join('');
}

function htmlToBlocks(html: string): Block[] {
  if (!html || html.trim() === '') {
    return [{
      id: crypto.randomUUID(),
      type: 'text' as BlockType,
      content: '',
      order: 0,
    }];
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: Block[] = [];
  
  // Handle empty content
  const paragraphs = doc.body.querySelectorAll('p');
  if (paragraphs.length === 0) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'text' as BlockType,
      content: '',
      order: 0,
    });
  } else {
    paragraphs.forEach((p, index) => {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'text' as BlockType,
        content: p.textContent || '',
        order: index,
      });
    });
  }
  
  return blocks;
}

