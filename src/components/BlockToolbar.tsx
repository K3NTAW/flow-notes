import React from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';

interface BlockToolbarProps {
  editor: Editor;
}

export const BlockToolbar: React.FC<BlockToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const isActive = (name: string, attributes?: Record<string, any>) => {
    return editor.isActive(name, attributes);
  };

  const toggleMark = (name: string, attributes?: Record<string, any>) => {
    editor.chain().focus().toggleMark(name, attributes).run();
  };

  // const toggleNode = (name: string, attributes?: Record<string, any>) => {
  //   editor.chain().focus().toggleNode(name, 'paragraph', attributes).run();
  // };

  // Note: setTextAlign is not available in the current TipTap version
  // const setTextAlign = (align: 'left' | 'center' | 'right') => {
  //   editor.chain().focus().setTextAlign(align).run();
  // };

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    isActive: boolean; 
    icon: any; 
    title: string; 
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-accent text-muted-foreground hover:text-foreground'
      }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <ToolbarButton
          onClick={() => toggleMark('bold')}
          isActive={isActive('bold')}
          icon={Bold}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => toggleMark('italic')}
          isActive={isActive('italic')}
          icon={Italic}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => toggleMark('strike')}
          isActive={isActive('strike')}
          icon={Strikethrough}
          title="Strikethrough"
        />
        <ToolbarButton
          onClick={() => toggleMark('code')}
          isActive={isActive('code')}
          icon={Code}
          title="Inline code"
        />
      </div>

      {/* Text Alignment - Disabled until setTextAlign is available */}
      {/* <div className="flex items-center gap-1 border-r border-border pr-2">
        <ToolbarButton
          onClick={() => setTextAlign('left')}
          isActive={isActive('paragraph', { textAlign: 'left' })}
          icon={AlignLeft}
          title="Align left"
        />
        <ToolbarButton
          onClick={() => setTextAlign('center')}
          isActive={isActive('paragraph', { textAlign: 'center' })}
          icon={AlignCenter}
          title="Align center"
        />
        <ToolbarButton
          onClick={() => setTextAlign('right')}
          isActive={isActive('paragraph', { textAlign: 'right' })}
          icon={AlignRight}
          title="Align right"
        />
      </div> */}

      {/* History */}
      <div className="flex items-center gap-1 border-r border-border pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          isActive={false}
          icon={Undo}
          title="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          isActive={false}
          icon={Redo}
          title="Redo"
        />
      </div>

      {/* Block Type Indicator */}
      <div className="ml-auto text-xs text-muted-foreground px-2">
        {isActive('heading', { level: 1 }) && 'Heading 1'}
        {isActive('heading', { level: 2 }) && 'Heading 2'}
        {isActive('heading', { level: 3 }) && 'Heading 3'}
        {isActive('bulletList') && 'Bullet List'}
        {isActive('orderedList') && 'Numbered List'}
        {isActive('taskList') && 'Task List'}
        {isActive('codeBlock') && 'Code Block'}
        {isActive('paragraph') && 'Paragraph'}
      </div>
    </div>
  );
};

