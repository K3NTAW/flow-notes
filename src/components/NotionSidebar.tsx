"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Search,
  Home,
  Archive,
  Star,
  Clock,
  Hash,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";


// Types
interface FolderItem {
  id: string;
  name: string;
  type: 'folder' | 'note';
  children?: FolderItem[];
  isExpanded?: boolean;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDragging?: boolean;
  isDragOver?: boolean;
}

interface SidebarProps {
  className?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  notes: any[];
  currentNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onNoteCreate: () => void;
  onNoteDelete?: (noteId: string) => void;
  onNoteExport?: (noteId: string) => void;
  onNoteDuplicate?: (noteId: string) => void;
  onFolderCreate?: (name: string, parentId?: string) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
  onMoveItem?: (itemId: string, newParentId?: string) => void;
}


// Sidebar Item Component
interface SidebarItemProps {
  item: FolderItem;
  level: number;
  onToggle: (id: string) => void;
  onSelect: (item: FolderItem) => void;
  selectedId?: string;
  isCollapsed: boolean;
  onMoveItem?: (itemId: string, newParentId?: string) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folderId: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  level,
  onToggle,
  onSelect,
  selectedId,
  isCollapsed,
  onMoveItem,
  onFolderRename,
  onFolderDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isSelected = selectedId === item.id;
  const isExpanded = item.isExpanded;

  const handleClick = () => {
    if (hasChildren) {
      onToggle(item.id);
    }
    onSelect(item);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(item.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
  };

  const handleRename = () => {
    setIsEditing(true);
    setShowContextMenu(false);
  };

  const handleDelete = () => {
    if (item.type === 'folder' && onFolderDelete) {
      onFolderDelete(item.id);
    }
    setShowContextMenu(false);
  };

  const handleEditSubmit = () => {
    if (item.type === 'folder' && onFolderRename && editName.trim()) {
      onFolderRename(item.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditName(item.name);
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: item.id,
      type: item.type,
      name: item.name
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.id !== item.id && item.type === 'folder' && onMoveItem) {
      onMoveItem(data.id, item.id);
    }
  };

  const getIcon = () => {
    if (item.type === 'folder') {
      return isExpanded ? (
        <FolderOpen style={{ width: '14px', height: '14px', color: '#3b82f6', marginRight: '6px' }} />
      ) : (
        <Folder style={{ width: '14px', height: '14px', color: '#3b82f6', marginRight: '6px' }} />
      );
    }
    return <FileText style={{ width: '14px', height: '14px', color: '#6b7280', marginRight: '6px' }} />;
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '3px 6px',
          cursor: 'pointer',
          borderRadius: '4px',
          margin: '1px 0',
          backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
          paddingLeft: isCollapsed ? '6px' : `${6 + level * 14}px`,
          transition: 'background-color 0.2s'
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        draggable
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {hasChildren && !isCollapsed && (
          <motion.button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              marginRight: '3px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
            onClick={handleChevronClick}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight style={{ width: '10px', height: '10px' }} />
          </motion.button>
        )}
        
        {!hasChildren && !isCollapsed && <div style={{ width: '17px' }} />}
        
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          {getIcon()}
          {!isCollapsed && (
            <>
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleEditSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                  style={{
                    marginLeft: '6px',
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                  autoFocus
                />
              ) : (
                <span style={{ marginLeft: '6px', fontSize: '13px', color: '#374151', fontWeight: '500' }}>{item.name}</span>
              )}
            </>
          )}
        </div>

        {!isCollapsed && item.type === 'folder' && (
          <div style={{ opacity: 0, transition: 'opacity 0.2s' }}>
            <button 
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'background-color 0.2s'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setShowContextMenu(!showContextMenu);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <MoreHorizontal style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        )}

        {showContextMenu && (
          <div style={{
            position: 'absolute',
            right: '0',
            marginTop: '4px',
            width: '192px',
            backgroundColor: 'white',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 10,
            border: '1px solid #e5e7eb'
          }}>
            <button
              onClick={handleRename}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#374151',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Edit style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Rename
            </button>
            <button
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#dc2626',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Delete
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {item.children?.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                level={level + 1}
                onToggle={onToggle}
                onSelect={onSelect}
                selectedId={selectedId}
                isCollapsed={isCollapsed}
                onMoveItem={onMoveItem}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// Main Sidebar Component
export const NotionSidebar: React.FC<SidebarProps> = ({
  notes,
  currentNoteId,
  onNoteSelect,
  onNoteCreate,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onMoveItem,
}) => {
  // Create folder structure from actual notes and folders
  const createFolderStructure = (notes: any[]): FolderItem[] => {
    // For now, create a simple structure with default folders
    // In a real implementation, this would come from the backend
    const defaultFolders: FolderItem[] = [
      {
        id: 'all-notes',
        name: 'All Notes',
        type: 'folder',
        isExpanded: true,
        children: notes.map(note => ({
          id: note.id,
          name: note.title,
          type: 'note',
          parentId: 'all-notes',
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }))
      },
      {
        id: 'my-folders',
        name: 'My Folders',
        type: 'folder',
        isExpanded: true,
        children: []
      }
    ];

    return defaultFolders;
  };

  const [items, setItems] = useState<FolderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Update folder structure when notes change
  React.useEffect(() => {
    const folderStructure = createFolderStructure(notes);
    setItems(folderStructure);
  }, [notes]);

  // Toggle folder expansion
  const toggleFolder = (id: string) => {
    const updateItems = (items: FolderItem[]): FolderItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        if (item.children) {
          return { ...item, children: updateItems(item.children) };
        }
        return item;
      });
    };
    setItems(updateItems(items));
  };

  // Handle item selection
  const handleItemSelect = (item: FolderItem) => {
    if (item.type === 'note') {
      onNoteSelect(item.id);
    }
  };

  // Handle new note creation
  const handleNewNote = () => {
    onNoteCreate();
  };

  // Handle new folder creation
  const handleNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      // Create new folder locally
      const newFolder: FolderItem = {
        id: `folder-${Date.now()}`,
        name: folderName.trim(),
        type: 'folder',
        isExpanded: false,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to "My Folders" section
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === 'my-folders') {
            return {
              ...item,
              children: [...(item.children || []), newFolder]
            };
          }
          return item;
        });
      });

      // Call the parent handler if provided
      if (onFolderCreate) {
        onFolderCreate(folderName.trim());
      }
    }
  };

  // Handle folder rename
  const handleFolderRename = (folderId: string, newName: string) => {
    // Update folder name locally
    setItems(prevItems => {
      const updateItems = (items: FolderItem[]): FolderItem[] => {
        return items.map(item => {
          if (item.id === folderId) {
            return { ...item, name: newName, updatedAt: new Date() };
          }
          if (item.children) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        });
      };
      return updateItems(prevItems);
    });

    // Call the parent handler if provided
    if (onFolderRename) {
      onFolderRename(folderId, newName);
    }
  };

  // Handle folder delete
  const handleFolderDelete = (folderId: string) => {
    // Remove folder locally
    setItems(prevItems => {
      const updateItems = (items: FolderItem[]): FolderItem[] => {
        return items.map(item => {
          if (item.children) {
            return { ...item, children: updateItems(item.children) };
          }
          return item;
        }).filter(item => item.id !== folderId);
      };
      return updateItems(prevItems);
    });

    // Call the parent handler if provided
    if (onFolderDelete) {
      onFolderDelete(folderId);
    }
  };

  // Handle move item
  const handleMoveItem = (itemId: string, newParentId?: string) => {
    // Move item locally
    setItems(prevItems => {
      let itemToMove: FolderItem | null = null;
      
      // Find and remove the item from its current location
      const removeItem = (items: FolderItem[]): FolderItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            itemToMove = { ...item, parentId: newParentId };
            return null; // Mark for removal
          }
          if (item.children) {
            return { ...item, children: removeItem(item.children) };
          }
          return item;
        }).filter(item => item !== null) as FolderItem[];
      };

      // Add the item to its new location
      const addItem = (items: FolderItem[]): FolderItem[] => {
        return items.map(item => {
          if (item.id === newParentId && itemToMove) {
            return { ...item, children: [...(item.children || []), itemToMove] };
          }
          if (item.children) {
            return { ...item, children: addItem(item.children) };
          }
          return item;
        });
      };

      const itemsWithoutItem = removeItem(prevItems);
      return addItem(itemsWithoutItem);
    });

    // Call the parent handler if provided
    if (onMoveItem) {
      onMoveItem(itemId, newParentId);
    }
  };

  return (
    <div
      style={{
        width: '280px',
        height: '100vh',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Notes</h1>
          <button style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <ChevronRight style={{ width: '16px', height: '16px', color: '#6b7280' }} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', padding: '0 8px' }}>
          <Search style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            width: '16px', 
            height: '16px', 
            color: '#9ca3af' 
          }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: 'calc(100% - 40px)',
              padding: '6px 6px 6px 32px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: '6px' }}>
        <button
          onClick={handleNewNote}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            backgroundColor: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            flex: 1
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} />
          New Note
        </button>
        <button
          onClick={handleNewFolder}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <Folder style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Navigation */}
      <div style={{ padding: '4px 0', borderBottom: '1px solid #e5e7eb', marginBottom: '4px' }}>
        {[
          { id: 'all', name: 'All Notes', icon: Home },
          { id: 'recent', name: 'Recent', icon: Clock },
          { id: 'favorites', name: 'Favorites', icon: Star },
          { id: 'tags', name: 'Tags', icon: Hash },
          { id: 'archive', name: 'Archive', icon: Archive },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = item.id === 'all'; // Default to 'All Notes' being active
          return (
            <button
              key={item.id}
              onClick={() => {
                // Handle navigation item click
                console.log(`Navigating to ${item.name}`);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                color: isActive ? '#111827' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left'
              }}
            >
              <Icon style={{ width: '14px', height: '14px' }} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Folders Section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <div style={{ padding: '0 12px' }}>
          <div style={{ 
            fontSize: '10px', 
            fontWeight: '600', 
            color: '#6b7280', 
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            FOLDERS
          </div>
          
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              level={0}
              onToggle={toggleFolder}
              onSelect={handleItemSelect}
              selectedId={currentNoteId}
              isCollapsed={false}
              onMoveItem={handleMoveItem}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
