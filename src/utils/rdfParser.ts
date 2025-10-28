// RDF Parser for Dragon Ball Online Translation
// Supports Quest and Text table types

export type FileType = 'quest' | 'text';

export interface TextEntry {
  id: number;
  text: string;
}

export interface ParsedData {
  sections: TextEntry[][];
}

// Load XOR key from config file if available
function loadXORKey(): Uint8Array {
  try {
    // Try to load config.xml from the correct location (next to executable in production)
    const { loadConfig } = require('./configLoader');
    const config = loadConfig();
    
    if (config && config.xorKey && Array.isArray(config.xorKey)) {
      if (config.xorKey.length < 256) {
        console.error('Invalid XOR key length in config.xml. Expected at least 256 bytes, got', config.xorKey.length);
        // Show toast error if available
        if (typeof window !== 'undefined') {
          import('../utils/toast').then(({ toast }) => {
            toast.error('Invalid XOR key length in config.xml. Expected at least 256 bytes.');
          });
        }
        throw new Error('Invalid XOR key length');
      }
      console.log('Using XOR key from config.xml with length:', config.xorKey.length);
      // Show success toast if available
      if (typeof window !== 'undefined') {
        import('../utils/toast').then(({ toast }) => {
          toast.success('Config.xml loaded successfully. Using custom XOR key.');
        });
      }
      return new Uint8Array(config.xorKey);
    } else {
      // Config exists but xorKey is missing or invalid
      if (typeof window !== 'undefined') {
        import('../utils/toast').then(({ toast }) => {
          toast.error('config.xml is missing xorKey field or it is not an array.');
        });
      }
      throw new Error('Missing xorKey in config.xml');
    }
  } catch (error) {
    // config.xml is required but not found or invalid
    console.error('config.xml is required but could not be loaded');
    if (typeof window !== 'undefined') {
      import('../utils/toast').then(({ toast }) => {
        toast.error('config.xml is required but could not be loaded. Please ensure config.xml exists next to the executable.');
      });
    }
    // Throw error
    throw new Error('config.xml is required but could not be loaded');
  }
}

// XOR key getter - lazy load to ensure config is available
let xorKeyCache: Uint8Array | null = null;
function getXORKey(): Uint8Array {
  if (xorKeyCache === null) {
    xorKeyCache = loadXORKey();
  }
  return xorKeyCache;
}

/**
 * Auto-detect file type (Quest or Text) based on binary structure
 */
export function detectFileType(buffer: Buffer): FileType {
  if (buffer.length < 10) {
    return 'quest'; // Default to quest for small files
  }
  
  // Quest files start with a padding byte (usually 0x01), then entries directly
  // Text files start with section index (4 bytes), section size (4 bytes), padding (1 byte)
  
  // Check if it starts with section header pattern (4 bytes index, 4 bytes size)
  const firstByte = buffer[0];
  const secondByte = buffer[1];
  
  // Quest files usually start with padding byte (0x01) and then entry data
  // Text files start with section index (0x00000000 is common for first section)
  // and section size (usually a reasonable value)
  
  // If first 4 bytes are 0x00000000 (or small value < 100), it's likely a section index (text)
  const potentialSectionIdx = buffer.readUInt32LE(0);
  const potentialSectionSize = buffer.readUInt32LE(4);
  
  // Text file characteristics:
  // - Section index starts at 0 or small numbers
  // - Section size is reasonable (not too large)
  if (potentialSectionIdx < 100 && potentialSectionSize < buffer.length && potentialSectionSize > 10) {
    // Likely text format
    return 'text';
  }
  
  // Default to quest format
  return 'quest';
}

/**
 * Auto-detect file type from XML content
 */
export function detectFileTypeFromXML(xmlString: string): FileType {
  // Count <table_data> tags - quest has one, text has multiple
  const tableDataMatches = xmlString.match(/<table_data>/gi);
  const count = tableDataMatches ? tableDataMatches.length : 0;
  
  // Quest files have exactly one <table_data> section
  // Text files have multiple sections
  return count === 1 ? 'quest' : 'text';
}

/**
 * Parse binary RDF file to readable data structure
 */
export function parseBinaryRDF(buffer: Buffer, fileType: FileType): ParsedData {
  let offset = 0;
  const sections: TextEntry[][] = [];

  if (fileType === 'quest') {
    // Quest files have 1 byte padding
    offset += 1; // Skip padding
    const section: TextEntry[] = [];

    while (offset < buffer.length - 4) {
      // Read table index (4 bytes, little endian)
      const tableIdx = buffer.readUInt32LE(offset);
      offset += 4;

      // Read text size (2 bytes, little endian)
      const textSize = buffer.readUInt16LE(offset);
      offset += 2;

      if (offset + textSize * 2 > buffer.length) {
        break;
      }

      // Read text (UTF-16LE) - handle empty text
      const text = textSize > 0 ? buffer.toString('utf16le', offset, offset + textSize * 2) : '';
      offset += textSize * 2;

      section.push({ id: tableIdx, text });
    }

    sections.push(section);
  } else {
    // Text files have sections with indices
    while (offset < buffer.length - 4) {
      // Read section index (4 bytes)
      const sectionIdx = buffer.readUInt32LE(offset);
      offset += 4;

      // Read section size (4 bytes)
      const sectionSize = buffer.readUInt32LE(offset);
      offset += 4;

      // Read padding (1 byte)
      offset += 1;

      // sectionSize includes padding (1 byte) + all entry data
      const sectionEnd = offset + sectionSize - 1; // -1 because padding is already read
      const section: TextEntry[] = [];

      while (offset < sectionEnd && offset < buffer.length - 4) {
        // Read table index (4 bytes)
        const tableIdx = buffer.readUInt32LE(offset);
        offset += 4;

        // Read text size (2 bytes)
        const textSize = buffer.readUInt16LE(offset);
        offset += 2;

        if (offset + textSize * 2 > buffer.length) {
          break;
        }

        // Read text (UTF-16LE) - handle empty text
        const text = textSize > 0 ? buffer.toString('utf16le', offset, offset + textSize * 2) : '';
        offset += textSize * 2;

        section.push({ id: tableIdx, text });
      }

      sections.push(section);
    }
  }

  return { sections };
}

/**
 * Convert parsed data to XML string
 */
export function toXML(data: ParsedData): string {
  // Build XML string directly to avoid array overhead with large datasets
  let xml = '<?xml version=\'1.0\' encoding=\'utf-16le\'?>\n<table>\n';

  for (const section of data.sections) {
    xml += '<table_data>\n';
    
    for (const entry of section) {
      // Handle empty text as self-closing tag
      if (!entry.text || entry.text.trim() === '') {
        xml += `    <text id="${entry.id}" />\n`;
      } else {
        const escapedText = entry.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        xml += `    <text id="${entry.id}">${escapedText}</text>\n`;
      }
    }
    
    xml += '</table_data>\n';
  }

  xml += '</table>';
  return xml;
}

/**
 * Parse XML string to data structure
 * Manual parsing to avoid encoding issues with DOMParser
 */
export function parseXML(xmlString: string): ParsedData {
  const sections: TextEntry[][] = [];
  
  // Remove XML declaration and encoding if present
  let xml = xmlString.replace(/<\?xml[^>]*\?>/g, '').trim();
  
  console.log('XML content preview (first 500 chars):', xml.substring(0, 500));
  console.log('Looking for table_data elements...');
  
  // Find all table_data sections - handle both <table_data> and <TABLE_DATA>
  const tableDataRegex = /<table_data>([\s\S]*?)<\/table_data>/gi;
  let match;
  let matchCount = 0;
  
  while ((match = tableDataRegex.exec(xml)) !== null) {
    matchCount++;
    const sectionContent = match[1];
    const section: TextEntry[] = [];
    
    console.log(`Found table_data section ${matchCount} with ${sectionContent.length} chars`);
    
    // Find all text elements in this section - handle both " and ' quotes, and empty elements
    // Match both <text id="123">content</text> and <text id="123" /> and <text id='123'>
    const textRegex = /<text\s+id\s*=\s*["']?(\d+)["']?\s*(?:\/>|>([\s\S]*?)<\/text>)/gi;
    let textMatch;
    let entryCount = 0;
    
    while ((textMatch = textRegex.exec(sectionContent)) !== null) {
      entryCount++;
      const id = parseInt(textMatch[1]);
      // textMatch[2] will be undefined for self-closing tags
      let text = textMatch[2] || '';
      
      // Unescape XML entities
      text = text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
      
      // Debug: log first few entries
      if (entryCount <= 3) {
        console.log(`Entry ${entryCount}: id=${id}, text="${text.substring(0, 50)}"`);
      }
      
      section.push({ id, text });
    }
    
    console.log(`  Found ${entryCount} text entries`);
    sections.push(section);
  }
  
  console.log(`Total sections found: ${sections.length}`);
  
  if (sections.length === 0) {
    console.warn('No table_data elements found in XML');
    // Try to find any XML structure at all
    const hasTableData = xml.includes('table_data') || xml.includes('TABLE_DATA');
    console.warn('XML contains "table_data":', hasTableData);
    console.warn('XML contains "table":', xml.includes('table'));
  }
  
  return { sections };
}

/**
 * Convert parsed data back to binary RDF
 */
export function toBinaryRDF(data: ParsedData, fileType: FileType): Buffer {
  const buffers: Buffer[] = [];

  if (fileType === 'quest') {
    // Write padding byte
    buffers.push(Buffer.from([0x01]));

    // Quest has one section
    if (data.sections.length > 0) {
      data.sections[0].forEach(entry => {
        const idBuf = Buffer.allocUnsafe(4);
        idBuf.writeUInt32LE(entry.id, 0);
        buffers.push(idBuf);

        const text = entry.text || '';
        const textSize = text.length;
        const sizeBuf = Buffer.allocUnsafe(2);
        sizeBuf.writeUInt16LE(textSize, 0);
        buffers.push(sizeBuf);

        if (textSize > 0) {
          const textBuf = Buffer.from(text, 'utf16le');
          buffers.push(textBuf);
        }
      });
    }
  } else {
    // Text files have multiple sections
    data.sections.forEach((section, sectionIdx) => {
      // First, collect all entry buffers
      const entryBuffers: Buffer[] = [];
      
      section.forEach(entry => {
        const idBuf = Buffer.allocUnsafe(4);
        idBuf.writeUInt32LE(entry.id, 0);
        entryBuffers.push(idBuf);

        const text = entry.text || '';
        const textSize = text.length;
        const sizeBuf = Buffer.allocUnsafe(2);
        sizeBuf.writeUInt16LE(textSize, 0);
        entryBuffers.push(sizeBuf);

        if (textSize > 0) {
          const textBuf = Buffer.from(text, 'utf16le');
          entryBuffers.push(textBuf);
        }
      });

      // Calculate section size: padding (1) + all entries
      let sectionSize = 1; // padding
      entryBuffers.forEach(buf => sectionSize += buf.length);

      // Write section index (4 bytes)
      const sectionIdxBuf = Buffer.allocUnsafe(4);
      sectionIdxBuf.writeUInt32LE(sectionIdx, 0);
      buffers.push(sectionIdxBuf);

      // Write section size (4 bytes)
      const sectionSizeBuf = Buffer.allocUnsafe(4);
      sectionSizeBuf.writeUInt32LE(sectionSize, 0);
      buffers.push(sectionSizeBuf);

      // Write padding
      buffers.push(Buffer.from([0x01]));

      // Concatenate all entry buffers for this section to reduce buffer count
      if (entryBuffers.length > 0) {
        const combinedEntries = Buffer.concat(entryBuffers);
        buffers.push(combinedEntries);
      }
    });
  }

  // Concatenate buffers - with per-section concatenation, we should have reasonable buffer count
  if (buffers.length === 0) {
    return Buffer.alloc(0);
  }
  
  // Direct concatenation should work fine now since we concatenated within sections
  return Buffer.concat(buffers);
}

/**
 * Convert RDF to EDF (encrypt) using XOR cipher
 */
export function rdfToEdf(buffer: Buffer): Buffer {
  const XOR_KEY = getXORKey();
  const encrypted = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    encrypted[i] = buffer[i] ^ XOR_KEY[i % XOR_KEY.length];
  }
  return encrypted;
}

/**
 * Convert EDF to RDF (decrypt) using XOR cipher
 */
export function edfToRdf(buffer: Buffer): Buffer {
  // XOR is symmetric, same operation for encryption and decryption
  return rdfToEdf(buffer);
}
