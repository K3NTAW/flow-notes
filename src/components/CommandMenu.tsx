import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  CheckSquare, 
  Minus, 
  Code, 
  Image, 
  FileText 
} from 'lucide-react';

interface CommandMenuProps {
  position: { x: number; y: number };
  onSelect: (command: string) => void;
  onClose: () => void;
}

const commands = [
  {
    id: 'text',
    title: 'Text',
    description: 'Just start writing with plain text',
    icon: Type,
    command: 'text',
  },
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: 'heading1',
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: 'heading2',
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: 'heading3',
  },
  {
    id: 'bulletList',
    title: 'Bullet list',
    description: 'Create a simple bullet list',
    icon: List,
    command: 'bulletList',
  },
  {
    id: 'orderedList',
    title: 'Numbered list',
    description: 'Create a numbered list',
    icon: List,
    command: 'orderedList',
  },
  {
    id: 'taskList',
    title: 'Task list',
    description: 'Track tasks with checkboxes',
    icon: CheckSquare,
    command: 'taskList',
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'Add a horizontal line',
    icon: Minus,
    command: 'horizontalRule',
  },
  {
    id: 'codeBlock',
    title: 'Code block',
    description: 'Add a code block',
    icon: Code,
    command: 'codeBlock',
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Upload or embed an image',
    icon: Image,
    command: 'image',
  },
  {
    id: 'pdf',
    title: 'PDF',
    description: 'Embed a PDF document',
    icon: FileText,
    command: 'pdf',
  },
];

export const CommandMenu: React.FC<CommandMenuProps> = ({
  position,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].command);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onSelect, onClose]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg min-w-80 max-w-md"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          autoFocus
        />
      </div>

      {/* Commands List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredCommands.map((command, index) => {
          const Icon = command.icon;
          return (
            <button
              key={command.id}
              className={`w-full flex items-center p-3 text-left hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => onSelect(command.command)}
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {command.title}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {command.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Use ↑↓ to navigate, Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};

