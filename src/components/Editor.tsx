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
        placeholder: 'Start writing...',
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
        class: 'prose max-w-none focus:outline-none min-h-[400px] p-0',
        style: 'min-height: 400px; padding: 0;',
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
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-16 px-20">
          {/* Notion-style title */}
          <div className="mb-12">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              className="w-full text-5xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-500 leading-tight"
              placeholder="Untitled"
            />
          </div>
          
          {/* Notion-style editor */}
          <div 
            className="editor-container min-h-[600px] cursor-text"
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent 
              editor={editor} 
              className="prose prose-xl max-w-none focus:outline-none"
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
    return '<p>Start typing here...</p>'; // Empty paragraph with placeholder text
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

