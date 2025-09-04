import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Home, FileText } from "lucide-react";
import { Note, NoteMetadata } from '../types';

interface NoteBreadcrumbProps {
  currentNote: Note | null;
  notes: NoteMetadata[];
  onNavigate: (noteId: string) => void;
  onNavigateToAllNotes: () => void;
}

export const NoteBreadcrumb: React.FC<NoteBreadcrumbProps> = ({
  currentNote,
  notes,
  onNavigate,
  onNavigateToAllNotes,
}) => {
  // Get the folder/tag information for the current note
  const getNotePath = (note: Note) => {
    const path = [];
    
    // Add "All Notes" as the root
    path.push({
      id: 'all-notes',
      name: 'All Notes',
      type: 'folder' as const,
      icon: Home,
    });

    // If note has tags, add the first tag as a folder
    if (note.tags && note.tags.length > 0) {
      path.push({
        id: `folder-${note.tags[0]}`,
        name: note.tags[0],
        type: 'folder' as const,
        icon: FileText,
      });
    }

    // Add the current note as the final item
    path.push({
      id: note.id,
      name: note.title,
      type: 'note' as const,
      icon: FileText,
    });

    return path;
  };

  if (!currentNote) {
    return (
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
        <Breadcrumb>
          <BreadcrumbList style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={onNavigateToAllNotes}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Home size={16} strokeWidth={2} aria-hidden="true" />
                <span style={{ display: 'none' }}>Home</span>
                <span>All Notes</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }

  const path = getNotePath(currentNote);

  return (
    <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
      <Breadcrumb>
        <BreadcrumbList style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          {path.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === path.length - 1;
            
            return (
              <React.Fragment key={item.id}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} strokeWidth={2} aria-hidden="true" />
                      <span>{item.name}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      onClick={() => {
                        if (item.type === 'folder') {
                          if (item.id === 'all-notes') {
                            onNavigateToAllNotes();
                          } else {
                            // Navigate to the folder view (could be implemented later)
                            console.log(`Navigate to folder: ${item.name}`);
                          }
                        } else {
                          onNavigate(item.id);
                        }
                      }}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Icon size={16} strokeWidth={2} aria-hidden="true" />
                      <span>{item.name}</span>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
