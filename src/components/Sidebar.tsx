import React, { useState, useEffect, useRef } from 'react';
import { NoteMetadata } from '../types';

interface SidebarProps {
  notes: NoteMetadata[];
  currentNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onNoteCreate: () => void;
  onNoteDelete?: (noteId: string) => void;
  onNoteExport?: (noteId: string) => void;
  onNoteDuplicate?: (noteId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  currentNoteId,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  onNoteExport,
  onNoteDuplicate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDropdownToggle = (noteId: string) => {
    setOpenDropdown(openDropdown === noteId ? null : noteId);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col" style={{ width: '320px', minWidth: '320px' }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-white">Flow Notes</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-700 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition-all duration-200 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Notes Section */}
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">No notes found</div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`flex items-center p-2 rounded-md cursor-pointer text-sm transition-all duration-200 group relative ${
                  currentNoteId === note.id
                    ? 'bg-gray-700 text-white rounded-lg'
                    : 'text-gray-300 hover:bg-gray-700 rounded-lg'
                }`}
                onClick={() => onNoteSelect(note.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Chevron */}
                <ChevronIcon className={`w-3 h-3 mr-2 ${
                  currentNoteId === note.id ? 'text-white' : 'text-gray-400'
                }`} />
                
                <span className="truncate flex-1 font-medium">{note.title || 'Untitled'}</span>
                
                {/* Three dots menu button */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDropdownToggle(note.id);
                    }}
                    className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200"
                    title="More options"
                  >
                    <MoreIcon className="w-3 h-3" />
                  </button>
                  
                  {/* Dropdown menu */}
                  {openDropdown === note.id && (
                    <div className="absolute left-full top-0 ml-2 w-32 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {onNoteExport && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(() => onNoteExport(note.id));
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center"
                          >
                            <ExportIcon className="w-3 h-3 mr-2" />
                            Export
                          </button>
                        )}
                        {onNoteDuplicate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(() => onNoteDuplicate(note.id));
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center"
                          >
                            <DuplicateIcon className="w-3 h-3 mr-2" />
                            Duplicate
                          </button>
                        )}
                        {onNoteDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(() => onNoteDelete(note.id));
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900 hover:text-red-200 flex items-center"
                          >
                            <DeleteIcon className="w-3 h-3 mr-2" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// SVG Icon Components
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const DuplicateIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const ChevronIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9,18 15,12 9,6"/>
  </svg>
);

const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);



