import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, PDFAnnotation } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Trash2,
  Highlighter,
  MessageSquare,
  Pen
} from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdf: PDFDocument;
  onSaveAnnotation: (annotation: PDFAnnotation) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdf,
  onSaveAnnotation,
  onDeleteAnnotation,
  onClose,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<'select' | 'highlight' | 'comment' | 'draw'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPath, setDrawingPath] = useState<{ x: number; y: number }[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<PDFAnnotation | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages, newPageNumber));
    });
  };

  const changeScale = (delta: number) => {
    setScale(prevScale => Math.max(0.5, Math.min(3.0, prevScale + delta)));
  };

  const rotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDrawingPath([{ x, y }]);
    } else if (selectedTool === 'highlight' || selectedTool === 'comment') {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setCommentPosition({ x, y });
      setShowCommentBox(true);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDrawing && selectedTool === 'draw') {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDrawingPath(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && selectedTool === 'draw') {
      setIsDrawing(false);
      // Save drawing as annotation
      if (drawingPath.length > 1) {
        const bounds = getDrawingBounds(drawingPath);
        const annotation: PDFAnnotation = {
          id: crypto.randomUUID(),
          annotation_type: 'drawing',
          content: '',
          page: pageNumber,
          rect: [bounds.x, bounds.y, bounds.width, bounds.height],
          color: '#ff0000',
        };
        onSaveAnnotation(annotation);
        setDrawingPath([]);
      }
    }
  };

  const getDrawingBounds = (path: { x: number; y: number }[]) => {
    const xs = path.map(p => p.x);
    const ys = path.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      const annotation: PDFAnnotation = {
        id: crypto.randomUUID(),
        annotation_type: selectedTool as 'highlight' | 'comment',
        content: commentText,
        page: pageNumber,
        rect: [commentPosition.x, commentPosition.y, 100, 20],
        color: selectedTool === 'highlight' ? '#ffff00' : '#ffffff',
      };
      onSaveAnnotation(annotation);
      setCommentText('');
      setShowCommentBox(false);
    }
  };

  const renderAnnotations = () => {
    if (!pdf.annotations) return null;

    const pageAnnotations = pdf.annotations.filter(ann => ann.page === pageNumber);
    
    return pageAnnotations.map(annotation => (
      <div
        key={annotation.id}
        className="absolute border-2 border-yellow-400 bg-yellow-200 bg-opacity-50 cursor-pointer"
        style={{
          left: annotation.rect[0],
          top: annotation.rect[1],
          width: annotation.rect[2],
          height: annotation.rect[3],
        }}
        onClick={() => setSelectedAnnotation(annotation)}
      >
        {annotation.content && (
          <div className="text-xs p-1 bg-white rounded shadow">
            {annotation.content}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="btn-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages}
          </span>
          
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="btn-secondary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeScale(-0.2)}
            className="btn-secondary"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={() => changeScale(0.2)}
            className="btn-secondary"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={rotate}
            className="btn-secondary"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTool('select')}
            className={`btn ${selectedTool === 'select' ? 'btn-primary' : 'btn-secondary'}`}
            title="Select Tool"
          >
            Select
          </button>
          
          <button
            onClick={() => setSelectedTool('highlight')}
            className={`btn ${selectedTool === 'highlight' ? 'btn-primary' : 'btn-secondary'}`}
            title="Highlight Tool"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setSelectedTool('comment')}
            className={`btn ${selectedTool === 'comment' ? 'btn-primary' : 'btn-secondary'}`}
            title="Comment Tool"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setSelectedTool('draw')}
            className={`btn ${selectedTool === 'draw' ? 'btn-primary' : 'btn-secondary'}`}
            title="Draw Tool"
          >
            <Pen className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="btn-secondary"
            title="Close PDF"
          >
            Close
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex justify-center">
          <Document
            file={pdf.path}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-center">Loading PDF...</div>}
            error={<div className="text-center text-red-500">Error loading PDF</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              className="shadow-lg"
            />
          </Document>
        </div>

        {/* Render annotations */}
        {renderAnnotations()}

        {/* Drawing canvas */}
        {isDrawing && selectedTool === 'draw' && (
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 10 }}
          />
        )}
      </div>

      {/* Comment Box */}
      {showCommentBox && (
        <div
          className="absolute bg-white border border-gray-300 rounded shadow-lg p-3 z-20"
          style={{
            left: commentPosition.x,
            top: commentPosition.y,
          }}
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-48 h-20 p-2 border border-gray-300 rounded resize-none"
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowCommentBox(false)}
              className="btn-secondary text-sm px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCommentSubmit}
              className="btn-primary text-sm px-2 py-1"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Annotation Details */}
      {selectedAnnotation && (
        <div className="absolute bottom-4 right-4 bg-white border border-gray-300 rounded shadow-lg p-4 max-w-sm">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Annotation Details</h4>
            <button
              onClick={() => setSelectedAnnotation(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Type: {selectedAnnotation.annotation_type}
          </p>
          {selectedAnnotation.content && (
            <p className="text-sm mb-2">{selectedAnnotation.content}</p>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                onDeleteAnnotation(selectedAnnotation.id);
                setSelectedAnnotation(null);
              }}
              className="btn bg-red-500 text-white hover:bg-red-600 text-sm px-2 py-1"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
