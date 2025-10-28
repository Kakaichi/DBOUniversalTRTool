import React, { useState, useEffect } from 'react';
import '../App.css';
import { useLogging } from '../hooks/useLogging';
import { useFileHandling } from '../hooks/useFileHandling';
import { useFileConversion } from '../hooks/useFileConversion';
import { useTextEditor } from '../hooks/useTextEditor';
import { ConverterTab } from './ConverterTab';
import { EditorTab } from './EditorTab';
import { ToastContainer } from './ToastContainer';
import { toast } from '../utils/toast';
import type { TabType } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen, faSync, faEdit, faExclamationTriangle, faFileAlt, faTimes } from '@fortawesome/free-solid-svg-icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('converter');
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  
  // Check config status on mount
  useEffect(() => {
    setTimeout(() => {
      const config = (window as any).__config;
      if (config) {
        setConfigLoaded(true);
        toast.success('Config.xml loaded successfully, ensure that your xor key is compatible with the client if you use .edf files.');
      } else {
        setConfigLoaded(false);
        toast.error('config.xml is required but could not be loaded. Please ensure config.xml exists. edf formats wont be compatible with your DBO client.');
      }
    }, 500);
  }, []);

  // Custom hooks
  const { logMessages, logEndRef, addLog, clearLogs } = useLogging(activeTab);
  const {
    selectedFile,
    fileType,
    setFileType,
    outputFormat,
    setOutputFormat,
    fileInputRef,
    handleFileSelection,
    clearFile
  } = useFileHandling();
  const { isProcessing, handleConvert } = useFileConversion();
  const {
    textEntries,
    parsedData,
    setTextEntries,
    setParsedData,
    currentPage,
    setCurrentPage,
    entriesPerPage,
    setEntriesPerPage,
    searchQuery,
    setSearchQuery,
    loadFileToEditor,
    saveFromEditor,
    handleCellEdit,
    filteredEntries,
    totalPages,
    paginatedEntries
  } = useTextEditor();

  // Handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      // Clear editor state when selecting a new file
      setTextEntries([]);
      setParsedData(null);
      setCurrentPage(1);
      setSearchQuery('');
      setActiveTab('converter');
      
    await handleFileSelection(event, addLog);
  };

  const handleFileClear = () => {
    clearFile(addLog);
  };

  const handleConversion = async () => {
    await handleConvert(selectedFile, fileType, outputFormat, addLog);
  };

  const handleLoadToEditor = async () => {
    if (!selectedFile) {
      addLog('✗ No file selected');
      return;
    }

    try {
      await loadFileToEditor(selectedFile, fileType, addLog);
      setActiveTab('editor');
    } catch (err) {
      // Error already logged in hook
    }
  };

  const handleSaveFromEditor = () => {
    saveFromEditor(parsedData, textEntries, selectedFile?.name || null, addLog);
  };

  console.log('Rendering - activeTab:', activeTab, 'textEntries.length:', textEntries.length);
  
  return (
    <div className="App">
      <ToastContainer />
      <div className={activeTab === 'editor' ? 'container-wide' : 'container'}>
        <div className="header">
          <h1><FontAwesomeIcon icon={faFolderOpen} /> DBO Universal Translation Tool</h1>
          <p className="subtitle">
            Professional RDF ↔ XML Converter & Editor for <span className="app-name">Dragon Ball Online</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'converter' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('converter')}
          >
            <FontAwesomeIcon icon={faSync} /> Converter
          </button>
          <button 
            className={`tab ${activeTab === 'editor' ? 'tab-active' : ''}`}
            onClick={async () => {
              if (textEntries.length > 0) {
                setActiveTab('editor');
              } else if (selectedFile) {
                addLog('📝 Auto-loading file into editor...');
                await handleLoadToEditor();
              } else {
                toast.warning('Please select a file first');
              }
            }}
          >
            <FontAwesomeIcon icon={faEdit} /> Text Editor {textEntries.length > 0 && `(${textEntries.length})`}
          </button>
        </div>
        
        {/* Converter Tab */}
        {activeTab === 'converter' && (
          <ConverterTab
            selectedFile={selectedFile}
            fileType={fileType}
            setFileType={setFileType}
            outputFormat={outputFormat}
            setOutputFormat={setOutputFormat}
            isProcessing={isProcessing}
            logMessages={logMessages}
            logEndRef={logEndRef}
            fileInputRef={fileInputRef}
            onFileSelection={handleFileSelect}
            onClearFile={handleFileClear}
            onConvert={handleConversion}
            configLoaded={configLoaded}
          />
        )}

        {/* Editor Tab */}
        {activeTab === 'editor' && textEntries.length > 0 && (
          <EditorTab
            textEntries={textEntries}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            filteredEntries={filteredEntries}
            totalPages={totalPages}
            paginatedEntries={paginatedEntries}
            onCellEdit={handleCellEdit}
            onSave={handleSaveFromEditor}
            onBack={() => setActiveTab('converter')}
          />
        )}
      </div>
    </div>
  );
};

export default App;
