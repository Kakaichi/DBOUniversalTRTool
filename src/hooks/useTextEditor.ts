import { useState } from 'react';
import { parseBinaryRDF, parseXML, toXML, edfToRdf, toBinaryRDF, rdfToEdf } from '../utils/rdfParser';
import { toast } from '../utils/toast';
import type { TextEntry, ParsedData, FileType } from '../types';

export const useTextEditor = () => {
  const [textEntries, setTextEntries] = useState<TextEntry[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const readXMLFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const hasBOM = uint8Array[0] === 0xFF && uint8Array[1] === 0xFE;
    const looksLikeUTF16LE = uint8Array[0] === 0x3C && uint8Array[1] === 0x00 && uint8Array[2] === 0x3F && uint8Array[3] === 0x00;
    
    if (hasBOM || looksLikeUTF16LE) {
      let bufferToDecode = arrayBuffer;
      if (hasBOM) {
        bufferToDecode = arrayBuffer.slice(2);
      }
      return new TextDecoder('utf-16le').decode(bufferToDecode);
    } else {
      return await file.text();
    }
  };

  const downloadFile = (content: string | Buffer, fileName: string, mimeType: string) => {
    const blobContent: BlobPart[] = typeof content === 'string' ? [content] : [new Uint8Array(content)];
    const blob = new Blob(blobContent, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return fileName;
  };

  const loadFileToEditor = async (
    selectedFile: File,
    fileType: FileType,
    addLog: (message: string) => void
  ) => {
    addLog('📝 Loading file into editor...');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      let data: ParsedData;
      
      console.log('Loading file:', selectedFile.name);
      
      if (selectedFile.name.endsWith('.rdf')) {
        addLog('📖 Parsing RDF file...');
        data = parseBinaryRDF(buffer, fileType);
      } else if (selectedFile.name.endsWith('.edf')) {
        addLog('🔓 Decrypting EDF file...');
        const decrypted = edfToRdf(buffer);
        data = parseBinaryRDF(decrypted, fileType);
      } else if (selectedFile.name.endsWith('.xml')) {
        addLog('📖 Reading XML file...');
        
        const text = await readXMLFile(selectedFile);
        
        console.log('XML content length:', text.length);
        data = parseXML(text);
      } else {
        throw new Error('Unsupported file type for editor');
      }
      
      console.log('Parsed data sections:', data.sections?.length);
      
      const entries: TextEntry[] = [];
      if (data.sections && data.sections.length > 0) {
        console.log('Processing sections, count:', data.sections.length);
        
        data.sections.forEach((section: any[], sectionIndex: number) => {
          section.forEach((entry: any) => {
            const text = typeof entry === 'string' ? entry : entry.text;
            const id = typeof entry === 'string' ? entries.length : entry.id;
            
            entries.push({
              id: id,
              sectionIndex,
              text: String(text || '')
            });
          });
        });
      } else {
        throw new Error('No sections found in file');
      }
      
      console.log('Total entries loaded:', entries.length);
      
      setParsedData(data);
      setTextEntries(entries);
      addLog(`✓ Loaded ${entries.length} text entries into editor`);
      toast.success(`File loaded into editor: ${entries.length} entries`);
    } catch (err) {
      addLog(`✗ Error loading into editor: ${err}`);
      console.error('Editor loading error:', err);
      throw err;
    }
  };

  const saveFromEditor = (
    parsedData: ParsedData | null,
    textEntries: TextEntry[],
    selectedFileName: string | null,
    addLog: (message: string) => void
  ) => {
    if (!parsedData || textEntries.length === 0) {
      toast.warning('No data to save');
      return;
    }

    try {
      addLog('💾 Saving edits...');
      
      // Find max section index
      let maxSectionIndex = 0;
      for (const entry of textEntries) {
        if (entry.sectionIndex > maxSectionIndex) {
          maxSectionIndex = entry.sectionIndex;
        }
      }
      
      const newSections: any[][] = [];
      
      for (let i = 0; i <= maxSectionIndex; i++) {
        newSections.push([]);
      }
      
      // Reconstruct sections
      for (const entry of textEntries) {
        newSections[entry.sectionIndex].push({
          id: entry.id,
          text: String(entry.text || '')
        });
      }
      
      parsedData.sections = newSections;
      
      addLog(`📊 Reconstructed ${newSections.length} section(s) with ${textEntries.length} total entries`);
      
      const xmlContent = toXML(parsedData);
      addLog(`📝 Generated XML: ${xmlContent.length} characters`);
      
      const fileName = selectedFileName?.replace(/\.(rdf|edf|xml)$/i, '') || 'edited_file';
      downloadFile(xmlContent, `${fileName}_edited.xml`, 'text/xml;charset=utf-16');
      
      addLog(`✅ Saved edited file: ${fileName}_edited.xml`);
      toast.success(`File saved: ${fileName}_edited.xml`);
    } catch (error) {
      addLog(`❌ Error saving file: ${error}`);
      console.error('Save error:', error);
    }
  };

  const handleCellEdit = (index: number, newText: string) => {
    setTextEntries(prev => {
      const updated = [...prev];
      updated[index].text = newText;
      return updated;
    });
  };

  const filteredEntries = textEntries.filter(entry => {
    if (!searchQuery) return true;
    
    if (entry.id.toString() === searchQuery) {
      return true;
    }
    
    if (entry.id.toString().startsWith(searchQuery)) {
      return true;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const textMatch = typeof entry.text === 'string' && entry.text.toLowerCase().includes(searchLower);
    
    return textMatch;
  });
  
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  return {
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
  };
};

