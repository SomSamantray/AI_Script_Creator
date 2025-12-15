import { SectionType } from '../db/chunks';

// Section detection keywords
const SECTION_KEYWORDS = {
  planned_releases: ['planned release', 'upcoming release', 'planned feature', 'roadmap'],
  tech_releases: ['tech release', 'new feature', 'technical release', 'released'],
  bugs_fixes: ['bug fix', 'bugfix', 'fixed', 'resolved', 'patch'],
};

// Interface for a parsed chunk
export interface ParsedChunk {
  section_type: SectionType;
  heading: string;
  content: string;
  chunk_order: number;
}

// Detect section type based on heading and content keywords
function detectSectionType(heading: string, content: string): SectionType {
  const combinedText = `${heading} ${content}`.toLowerCase();

  for (const [sectionType, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some((keyword) => combinedText.includes(keyword))) {
      return sectionType as SectionType;
    }
  }

  return 'other';
}

// Split text by headings (lines starting with #, or all caps lines)
function splitByHeadings(text: string): Array<{ heading: string; content: string }> {
  const lines = text.split('\n');
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = 'Introduction';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if line is a heading (starts with # or is all uppercase with > 5 chars)
    const isMarkdownHeading = trimmedLine.startsWith('#');
    const isAllCapsHeading =
      trimmedLine.length > 5 &&
      trimmedLine === trimmedLine.toUpperCase() &&
      /^[A-Z0-9\s:]+$/.test(trimmedLine);

    if (isMarkdownHeading || isAllCapsHeading) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim(),
        });
        currentContent = [];
      }

      // Start new section
      currentHeading = trimmedLine.replace(/^#+\s*/, ''); // Remove markdown # symbols
    } else if (trimmedLine.length > 0) {
      currentContent.push(line);
    }
  }

  // Add final section
  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim(),
    });
  }

  return sections;
}

// Main chunking function
export function chunkText(text: string): ParsedChunk[] {
  // Split by headings
  const sections = splitByHeadings(text);

  // Convert to chunks with section type detection
  const chunks: ParsedChunk[] = sections.map((section, index) => ({
    section_type: detectSectionType(section.heading, section.content),
    heading: section.heading,
    content: section.content,
    chunk_order: index,
  }));

  return chunks;
}

// Alternative: Chunk by paragraph if no clear headings
export function chunkByParagraphs(
  text: string,
  maxChunkSize: number = 2000
): ParsedChunk[] {
  const paragraphs = text
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: ParsedChunk[] = [];
  let currentChunk = '';
  let chunkOrder = 0;

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        section_type: detectSectionType('', currentChunk),
        heading: `Section ${chunkOrder + 1}`,
        content: currentChunk.trim(),
        chunk_order: chunkOrder,
      });
      currentChunk = paragraph;
      chunkOrder++;
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      section_type: detectSectionType('', currentChunk),
      heading: `Section ${chunkOrder + 1}`,
      content: currentChunk.trim(),
      chunk_order: chunkOrder,
    });
  }

  return chunks;
}
