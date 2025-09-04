// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Block {
    pub id: String,
    pub r#type: String,
    pub content: String,
    pub checked: Option<bool>,
    pub file_path: Option<String>,
    pub children: Option<Vec<Block>>,
    pub order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub blocks: Vec<Block>,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteMetadata {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PDFDocument {
    pub id: String,
    pub name: String,
    pub path: String,
    pub pages: i32,
    pub created_at: String,
    pub updated_at: String,
    pub annotations: Option<Vec<PDFAnnotation>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PDFAnnotation {
    pub id: String,
    pub annotation_type: String, // 'highlight', 'comment', 'drawing'
    pub content: Option<String>,
    pub page: i32,
    pub rect: [f64; 4], // [x, y, width, height]
    pub color: Option<String>,
}

fn get_notes_dir() -> Result<PathBuf, String> {
    let app_dir = dirs::data_dir()
        .ok_or("Failed to get app data directory")?
        .join("flow-notes");
    let notes_dir = app_dir.join("notes");
    
    if !notes_dir.exists() {
        fs::create_dir_all(&notes_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(notes_dir)
}

fn get_pdfs_dir() -> Result<PathBuf, String> {
    let app_dir = dirs::data_dir()
        .ok_or("Failed to get app data directory")?
        .join("flow-notes");
    let pdfs_dir = app_dir.join("pdfs");
    
    if !pdfs_dir.exists() {
        fs::create_dir_all(&pdfs_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(pdfs_dir)
}

#[tauri::command]
fn save_note(note: Note) -> Result<(), String> {
    let notes_dir = get_notes_dir()?;
    let note_file = notes_dir.join(format!("{}.json", note.id));
    
    let json = serde_json::to_string_pretty(&note)
        .map_err(|e| e.to_string())?;
    
    fs::write(note_file, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_note(note_id: String) -> Result<Note, String> {
    let notes_dir = get_notes_dir()?;
    let note_file = notes_dir.join(format!("{}.json", note_id));
    
    if !note_file.exists() {
        return Err("Note not found".to_string());
    }
    
    let content = fs::read_to_string(note_file).map_err(|e| e.to_string())?;
    let note: Note = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(note)
}

#[tauri::command]
fn list_notes() -> Result<Vec<NoteMetadata>, String> {
    let notes_dir = get_notes_dir()?;
    let mut notes = Vec::new();
    
    for entry in fs::read_dir(notes_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(note) = serde_json::from_str::<Note>(&content) {
                let metadata = NoteMetadata {
                    id: note.id,
                    title: note.title,
                    created_at: note.created_at,
                    updated_at: note.updated_at,
                    tags: note.tags,
                };
                notes.push(metadata);
            }
        }
    }
    
    // Sort by updated_at descending
    notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(notes)
}

#[tauri::command]
fn delete_note(note_id: String) -> Result<(), String> {
    let notes_dir = get_notes_dir()?;
    let note_file = notes_dir.join(format!("{}.json", note_id));
    
    if note_file.exists() {
        fs::remove_file(note_file).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
fn create_note(title: String) -> Result<Note, String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    // Check for duplicate titles and add a number if needed
    let existing_notes = list_notes()?;
    let mut final_title = title.clone();
    let mut counter = 1;
    
    while existing_notes.iter().any(|note| note.title == final_title) {
        final_title = format!("{} {}", title, counter);
        counter += 1;
    }
    
    let note = Note {
        id: format!("note_{}", now),
        title: final_title,
        blocks: vec![
            Block {
                id: format!("block_{}", now + 1),
                r#type: "heading".to_string(),
                content: "Untitled".to_string(),
                checked: None,
                file_path: None,
                children: None,
                order: 0,
            }
        ],
        created_at: format!("{}", now),
        updated_at: format!("{}", now),
        tags: None,
    };
    
    save_note(note.clone())?;
    Ok(note)
}

#[tauri::command]
fn import_pdf() -> Result<PDFDocument, String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    // This would normally open a file dialog, but for now we'll create a placeholder
    let pdf = PDFDocument {
        id: format!("pdf_{}", now),
        name: "Sample PDF".to_string(),
        path: "/path/to/sample.pdf".to_string(),
        pages: 1,
        created_at: format!("{}", now),
        updated_at: format!("{}", now),
        annotations: Some(vec![]),
    };
    
    save_pdf(pdf.clone())?;
    Ok(pdf)
}

#[tauri::command]
fn save_pdf(pdf: PDFDocument) -> Result<(), String> {
    let pdfs_dir = get_pdfs_dir()?;
    let pdf_file = pdfs_dir.join(format!("{}.json", pdf.id));
    
    let json = serde_json::to_string_pretty(&pdf)
        .map_err(|e| e.to_string())?;
    
    fs::write(pdf_file, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_pdf(pdf_id: String) -> Result<PDFDocument, String> {
    let pdfs_dir = get_pdfs_dir()?;
    let pdf_file = pdfs_dir.join(format!("{}.json", pdf_id));
    
    if !pdf_file.exists() {
        return Err("PDF not found".to_string());
    }
    
    let content = fs::read_to_string(pdf_file).map_err(|e| e.to_string())?;
    let pdf: PDFDocument = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(pdf)
}

#[tauri::command]
fn list_pdfs() -> Result<Vec<PDFDocument>, String> {
    let pdfs_dir = get_pdfs_dir()?;
    let mut pdfs = Vec::new();
    
    for entry in fs::read_dir(pdfs_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(pdf) = serde_json::from_str::<PDFDocument>(&content) {
                pdfs.push(pdf);
            }
        }
    }
    
    // Sort by updated_at descending
    pdfs.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(pdfs)
}

#[tauri::command]
fn delete_pdf(pdf_id: String) -> Result<(), String> {
    let pdfs_dir = get_pdfs_dir()?;
    let pdf_file = pdfs_dir.join(format!("{}.json", pdf_id));
    
    if pdf_file.exists() {
        fs::remove_file(pdf_file).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
fn save_pdf_annotation(pdf_id: String, annotation: PDFAnnotation) -> Result<(), String> {
    let mut pdf = load_pdf(pdf_id)?;
    
    if pdf.annotations.is_none() {
        pdf.annotations = Some(vec![]);
    }
    
    if let Some(ref mut annotations) = pdf.annotations {
        // Update existing annotation or add new one
        if let Some(existing_index) = annotations.iter().position(|a| a.id == annotation.id) {
            annotations[existing_index] = annotation;
        } else {
            annotations.push(annotation);
        }
    }
    
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    pdf.updated_at = format!("{}", now);
    save_pdf(pdf)?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_note,
            load_note,
            list_notes,
            delete_note,
            create_note,
            import_pdf,
            save_pdf,
            load_pdf,
            list_pdfs,
            delete_pdf,
            save_pdf_annotation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

