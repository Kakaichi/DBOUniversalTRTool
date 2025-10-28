import React from 'react';
import type { FileType, OutputFormat } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faRocket, faClipboardList, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface ConverterTabProps {
  selectedFile: File | null;
  fileType: FileType;
  setFileType: (type: FileType) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  isProcessing: boolean;
  logMessages: string[];
  logEndRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onConvert: () => void;
  configLoaded: boolean;
}

export const ConverterTab: React.FC<ConverterTabProps> = ({
  selectedFile,
  fileType,
  setFileType,
  outputFormat,
  setOutputFormat,
  isProcessing,
  logMessages,
  logEndRef,
  fileInputRef,
  onFileSelection,
  onClearFile,
  onConvert,
  configLoaded
}) => {
  return (
    <div className="converter-section">
      <div className="file-type-selector">
        <label>File Type (Auto-detected for .rdf/.edf):</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              value="quest"
              checked={fileType === 'quest'}
              onChange={(e) => setFileType(e.target.value as FileType)}
              disabled={isProcessing}
            />
            <span>Quest</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value="text"
              checked={fileType === 'text'}
              onChange={(e) => setFileType(e.target.value as FileType)}
              disabled={isProcessing}
            />
            <span>Text</span>
          </label>
        </div>
      </div>

      <div className="file-selector">
        <input
          ref={fileInputRef}
          type="file"
          id="fileInput"
          accept=".rdf,.edf,.xml"
          onChange={onFileSelection}
          disabled={isProcessing}
          style={{ display: 'none' }}
        />
        <label htmlFor="fileInput" className="btn-file-input">
          {selectedFile ? selectedFile.name : 'Select File (.rdf, .edf, or .xml)'}
        </label>
        
        {selectedFile && (
          <button
            className="btn-file-clear"
            onClick={onClearFile}
            disabled={isProcessing}
          >
            Clear
          </button>
        )}
      </div>

      {selectedFile && (selectedFile.name.endsWith('.xml') || selectedFile.name.endsWith('.edf') || selectedFile.name.endsWith('.rdf')) && (
        <div className="file-type-selector">
          <label>Output Format:</label>
          {!configLoaded && (selectedFile.name.endsWith('.xml') || selectedFile.name.endsWith('.rdf')) && (
            <div className="config-warning">
              <FontAwesomeIcon icon={faExclamationTriangle} /> EDF encryption requires config.xml
            </div>
          )}
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="rdf"
                checked={outputFormat === 'rdf'}
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                disabled={isProcessing}
              />
              <span>
                {selectedFile.name.endsWith('.xml') && 'RDF (Unencrypted)'}
                {selectedFile.name.endsWith('.edf') && 'RDF (Decrypted)'}
                {selectedFile.name.endsWith('.rdf') && 'EDF (Encrypted)'}
              </span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="xml"
                checked={outputFormat === 'xml'}
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                disabled={isProcessing || (!configLoaded && (selectedFile.name.endsWith('.xml') || selectedFile.name.endsWith('.rdf')))}
              />
              <span>
                {selectedFile.name.endsWith('.xml') && 'EDF (Encrypted)'}
                {selectedFile.name.endsWith('.edf') && 'XML (Editable)'}
                {selectedFile.name.endsWith('.rdf') && 'XML (Editable)'}
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="convert-button-section">
        <button
          className="btn-convert"
          onClick={onConvert}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? <><FontAwesomeIcon icon={faSync} /> Converting...</> : <><FontAwesomeIcon icon={faRocket} /> Convert</>}
        </button>
      </div>

      <div className="log-section">
        <div className="log-header">
          <h3><FontAwesomeIcon icon={faClipboardList} /> Log</h3>
        </div>
        <div className="log-content">
          {logMessages.length === 0 ? (
            <p className="log-placeholder">Waiting for file...</p>
          ) : (
            logMessages.map((msg, idx) => (
              <p key={idx} className="log-message">
                {msg}
              </p>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

