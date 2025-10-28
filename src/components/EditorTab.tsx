import React from 'react';
import type { TextEntry } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface EditorTabProps {
  textEntries: TextEntry[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  entriesPerPage: number;
  setEntriesPerPage: (count: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  filteredEntries: TextEntry[];
  totalPages: number;
  paginatedEntries: TextEntry[];
  onCellEdit: (index: number, newText: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export const EditorTab: React.FC<EditorTabProps> = ({
  textEntries,
  searchQuery,
  setSearchQuery,
  entriesPerPage,
  setEntriesPerPage,
  currentPage,
  setCurrentPage,
  filteredEntries,
  totalPages,
  paginatedEntries,
  onCellEdit,
  onSave,
  onBack
}) => {
  return (
    <div className="editor-container">
      <div className="editor-controls">
        <input
          type="text"
          placeholder="Search by ID or text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: '1 1 300px', minWidth: '200px' }}
        />
        <select
          value={entriesPerPage}
          onChange={(e) => setEntriesPerPage(Number(e.target.value))}
        >
          <option value={10}>Show: 10</option>
          <option value={25}>Show: 25</option>
          <option value={50}>Show: 50</option>
          <option value={100}>Show: 100</option>
        </select>
        <button onClick={onSave}>
          <FontAwesomeIcon icon={faSave} /> Save Changes
        </button>
        <button onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Converter
        </button>
      </div>

      <table className="editor-table">
        <thead>
          <tr>
            <th style={{ width: '80px' }}>ID</th>
            <th style={{ width: '100px' }}>Section</th>
            <th>Text (Editable)</th>
          </tr>
        </thead>
        <tbody>
          {paginatedEntries.map((entry, displayIdx) => {
            const actualIndex = textEntries.findIndex(e => e.id === entry.id);
            return (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.sectionIndex}</td>
                <td>
                  <input
                    type="text"
                    value={String(entry.text || '')}
                    onChange={(e) => onCellEdit(actualIndex, e.target.value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pagination">
        <div className="pagination-info">
          Showing {paginatedEntries.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * entriesPerPage, filteredEntries.length)} of {filteredEntries.length} entries
          {searchQuery && ` (filtered from ${textEntries.length} total)`}
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            « First
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹ Prev
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number = i + 1;
            if (totalPages > 5) {
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
            }
            return (
              <button
                key={pageNum}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last »
          </button>
        </div>
      </div>
    </div>
  );
};

