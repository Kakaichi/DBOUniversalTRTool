import { useState } from 'react';
import {
  parseBinaryRDF,
  toXML,
  parseXML,
  toBinaryRDF,
  rdfToEdf,
  edfToRdf,
  type FileType
} from '../utils/rdfParser';
import { toast } from '../utils/toast';

export const useFileConversion = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

  const convertRDFToXML = async (
    buffer: Buffer,
    fileType: FileType,
    fileName: string,
    addLog: (message: string) => void
  ) => {
    const data = parseBinaryRDF(buffer, fileType);
    addLog(`Parsed ${data.sections.length} section(s)`);
    
    if (data.sections.length > 0) {
      const totalEntries = data.sections.reduce((sum, section) => sum + section.length, 0);
      addLog(`Found ${totalEntries} text entries`);
    }
    
    const xmlContent = toXML(data);
    addLog(`Generated XML content: ${xmlContent.length} characters`);
    
    const outputFileName = downloadFile(
      xmlContent,
      fileName.replace(/\.rdf$/i, '.xml'),
      'text/xml;charset=utf-16'
    );
    
    addLog(`✓ XML file saved: ${outputFileName}`);
    toast.success(`File converted: ${outputFileName}`);
  };

  const convertRDFToEDF = async (
    buffer: Buffer,
    fileName: string,
    addLog: (message: string) => void
  ) => {
    addLog(`Converting to EDF...`);
    const encrypted = rdfToEdf(buffer);
    addLog(`Encrypted to EDF: ${encrypted.length} bytes`);
    
    const outputFileName = downloadFile(
      encrypted,
      fileName.replace(/\.rdf$/i, '.edf'),
      'application/octet-stream'
    );
    
    addLog(`✓ EDF file saved: ${outputFileName}`);
    toast.success(`File converted: ${outputFileName}`);
  };

  const convertEDFToRDF = async (
    buffer: Buffer,
    fileName: string,
    addLog: (message: string) => void
  ) => {
    const decrypted = edfToRdf(buffer);
    addLog(`Decrypted to RDF: ${decrypted.length} bytes`);
    
    const outputFileName = downloadFile(
      decrypted,
      fileName.replace(/\.edf$/i, '.rdf'),
      'application/octet-stream'
    );
    
    addLog(`✓ RDF file saved: ${outputFileName}`);
    toast.success(`File converted: ${outputFileName}`);
  };

  const convertEDFToXML = async (
    buffer: Buffer,
    fileType: FileType,
    fileName: string,
    addLog: (message: string) => void
  ) => {
    const decrypted = edfToRdf(buffer);
    addLog(`Decrypted to RDF: ${decrypted.length} bytes`);
    
    const data = parseBinaryRDF(decrypted, fileType);
    addLog(`Parsed ${data.sections.length} section(s)`);
    
    if (data.sections.length > 0) {
      const totalEntries = data.sections.reduce((sum, section) => sum + section.length, 0);
      addLog(`Found ${totalEntries} text entries`);
      
      const xmlContent = toXML(data);
      addLog(`Generated XML content: ${xmlContent.length} characters`);
      
      const outputFileName = downloadFile(
        xmlContent,
        fileName.replace(/\.edf$/i, '.xml'),
        'text/xml;charset=utf-16'
      );
      
      addLog(`✓ XML file saved: ${outputFileName}`);
      toast.success(`File converted: ${outputFileName}`);
    } else {
      addLog(`✗ No sections found in the decrypted file`);
    }
  };

  const convertXMLToRDF = async (
    text: string,
    fileType: FileType,
    fileName: string,
    outputFormat: 'rdf' | 'xml',
    addLog: (message: string) => void
  ) => {
    addLog(`XML content size: ${text.length} characters`);
    addLog(`First 200 chars: ${text.substring(0, 200)}`);
    
    const data = parseXML(text);
    addLog(`Parsed ${data.sections.length} section(s)`);
    
    if (data.sections.length > 0) {
      const totalEntries = data.sections.reduce((sum, section) => sum + section.length, 0);
      addLog(`Found ${totalEntries} text entries`);
    }
    
    const binaryBuffer = toBinaryRDF(data, fileType);
    addLog(`Generated RDF binary data: ${binaryBuffer.length} bytes`);
    
    let finalBuffer: Buffer;
    let fileExtension: string;
    
    if (outputFormat === 'xml') {
      // For XML input, 'xml' outputFormat means EDF (encrypted)
      finalBuffer = rdfToEdf(binaryBuffer);
      fileExtension = '.edf';
      addLog(`Encrypted to EDF: ${finalBuffer.length} bytes`);
    } else {
      finalBuffer = binaryBuffer;
      fileExtension = '.rdf';
    }
    
    const outputFileName = downloadFile(
      finalBuffer,
      fileName.replace(/\.xml$/i, fileExtension),
      'application/octet-stream'
    );
    
    addLog(`✓ ${fileExtension.toUpperCase()} file saved: ${outputFileName}`);
    toast.success(`File converted: ${outputFileName}`);
  };

  const handleConvert = async (
    selectedFile: File | null,
    fileType: FileType,
    outputFormat: 'rdf' | 'xml',
    addLog: (message: string) => void
  ) => {
    if (!selectedFile) return;

    setIsProcessing(true);
    addLog(`🔄 Converting: ${selectedFile.name}`);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      if (selectedFile.name.endsWith('.rdf')) {
        addLog(`Reading RDF file: ${selectedFile.name}`);
        addLog(`File size: ${buffer.length} bytes`);
        
        if (outputFormat === 'xml') {
          await convertRDFToXML(buffer, fileType, selectedFile.name, addLog);
        } else {
          await convertRDFToEDF(buffer, selectedFile.name, addLog);
        }
      } else if (selectedFile.name.endsWith('.edf')) {
        addLog(`Reading EDF file: ${selectedFile.name}`);
        addLog(`File size: ${buffer.length} bytes`);
        
        if (outputFormat === 'rdf') {
          await convertEDFToRDF(buffer, selectedFile.name, addLog);
        } else if (outputFormat === 'xml') {
          await convertEDFToXML(buffer, fileType, selectedFile.name, addLog);
        }
      } else if (selectedFile.name.endsWith('.xml')) {
        addLog(`Reading XML file: ${selectedFile.name}`);
        
        const text = await readXMLFile(selectedFile);
        
        // Detect encoding
        const uint8Array = new Uint8Array(arrayBuffer);
        const hasBOM = uint8Array[0] === 0xFF && uint8Array[1] === 0xFE;
        const looksLikeUTF16LE = uint8Array[0] === 0x3C && uint8Array[1] === 0x00 && uint8Array[2] === 0x3F && uint8Array[3] === 0x00;
        
        if (hasBOM || looksLikeUTF16LE) {
          addLog(`Detected UTF-16LE encoding`);
        } else {
          addLog(`Reading as UTF-8`);
        }
        
        await convertXMLToRDF(text, fileType, selectedFile.name, outputFormat, addLog);
      } else {
        addLog(`✗ Unsupported file type. Please use .rdf, .edf, or .xml files`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`✗ Error: ${errorMessage}`);
      console.error('Conversion error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    handleConvert,
    readXMLFile
  };
};

