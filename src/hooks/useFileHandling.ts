import { useState, useRef } from 'react';
import { detectFileType, detectFileTypeFromXML, edfToRdf } from '../utils/rdfParser';
import { toast } from '../utils/toast';
import type { FileType } from '../types';

export const useFileHandling = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('quest');
  const [outputFormat, setOutputFormat] = useState<'rdf' | 'xml'>('rdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
    addLog: (message: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Reset output format based on file type
      if (file.name.endsWith('.edf')) {
        setOutputFormat('xml'); // Default to XML for EDF (decrypt to readable)
      } else if (file.name.endsWith('.xml')) {
        setOutputFormat('rdf'); // Default to RDF for XML (binary output)
      } else if (file.name.endsWith('.rdf')) {
        setOutputFormat('xml'); // Default to XML for RDF (parse to readable)
      }
      
      addLog(`📁 Selected file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      toast.success(`File opened: ${file.name}`);
      
      // Auto-detect file type
      try {
        if (file.name.endsWith('.rdf') || file.name.endsWith('.edf')) {
          // Binary files
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // For EDF files, decrypt first to get RDF structure
          const bufferToAnalyze = file.name.endsWith('.edf') ? edfToRdf(buffer) : buffer;
          
          const detectedType = detectFileType(bufferToAnalyze);
          setFileType(detectedType);
          addLog(`🔍 Auto-detected file type: ${detectedType}`);
        } else if (file.name.endsWith('.xml')) {
          // XML files - read with proper encoding
          const arrayBuffer = await file.arrayBuffer();
          let text: string;
          
          const uint8Array = new Uint8Array(arrayBuffer);
          const hasBOM = uint8Array[0] === 0xFF && uint8Array[1] === 0xFE;
          const looksLikeUTF16LE = uint8Array[0] === 0x3C && uint8Array[1] === 0x00 && uint8Array[2] === 0x3F && uint8Array[3] === 0x00;
          
          if (hasBOM || looksLikeUTF16LE) {
            let bufferToDecode = arrayBuffer;
            if (hasBOM) {
              bufferToDecode = arrayBuffer.slice(2);
            }
            text = new TextDecoder('utf-16le').decode(bufferToDecode);
          } else {
            text = await file.text();
          }
          
          const detectedType = detectFileTypeFromXML(text);
          setFileType(detectedType);
          addLog(`🔍 Auto-detected file type: ${detectedType}`);
        } else {
          addLog(`📝 Select format (Quest/Text) and click Convert`);
        }
      } catch (err) {
        addLog(`⚠️ Could not auto-detect file type, defaulting to quest`);
      }
    }
  };

  const clearFile = (addLog: (message: string) => void) => {
    setSelectedFile(null);
    setOutputFormat('rdf'); // Reset to default
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addLog('📁 File selection cleared');
  };

  return {
    selectedFile,
    fileType,
    setFileType,
    outputFormat,
    setOutputFormat,
    fileInputRef,
    handleFileSelection,
    clearFile
  };
};

