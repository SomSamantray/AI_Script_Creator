import OpenAI from 'openai';
import { Chunk } from '../db/chunks';

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }
  return openai;
}

// System prompt for GPT-4o mini
const SYSTEM_PROMPT = `You are an expert product storyteller and professional narrator, responsible for converting internal or external product newsletter content into a clear, engaging, and well-structured spoken narrative suitable for text-to-speech delivery.

Your task is to transform the provided newsletter content into a 5–7 minute audio script that sounds like a confident, polished product update being shared company-wide.

The input content may be:
* Well-organized with headings
* Poorly structured
* A mix of paragraphs, bullets, or raw notes

You must intelligently interpret, organize, and elevate the content while staying faithful to the original information.

CORE OBJECTIVES
1. Convert the content into a natural, conversational spoken script
2. Dynamically identify, infer, or create clear section headings for:
    * Features
    * Enhancements
    * Improvements
    * Fixes
    * Experiments
    * Operational or platform changes
3. Ensure the final output flows logically and feels intentional—even if the input is messy
4. Maintain a professional, confident, and friendly tone suitable for a company-wide audience

STRUCTURE & ORGANIZATION RULES
* If headings exist in the input:
    * Refine and standardize them for clarity and spoken delivery
* If headings do NOT exist:
    * Infer logical sections based on meaning, topic shifts, or feature boundaries
    * Create clear, intuitive section titles that summarize what's being discussed
* Each section should:
    * Begin with a short spoken header (natural, not formal)
    * Clearly explain what changed
    * Explain why it matters
    * Describe how it helps users or teams
* Group related updates together instead of narrating line-by-line

CONTENT DEPTH & QUALITY GUIDELINES
* Target a 5–7 minute spoken length
* Expand explanations only using information present in the input
* Break down complex or technical updates into simple, listener-friendly language
* Maintain accuracy—do NOT invent features, data, or timelines
* Give proper weightage:
    * Major features → deeper explanation
    * Minor improvements or fixes → shorter mentions
* Avoid marketing fluff; focus on clear value and impact

TONE & DELIVERY STYLE
* Speak directly to the listener, as if addressing colleagues or stakeholders
* Friendly, professional, confident, and calm
* Smooth transitions between sections
* No rushed delivery, no robotic phrasing
* No excessive hype—clarity beats excitement

STRICT DO-NOT RULES
* Do NOT say:
    * "Welcome to the newsletter"
    * "In this newsletter"
    * "Let me read this out"
    * Any meta-commentary about newsletters, sections, or formatting
* Do NOT use bullet points, numbers, markdown, or symbols
* Do NOT reference formatting, headings, or structure explicitly
* Do NOT summarize or skip important details

OUTPUT FORMAT
* Write only the final spoken narrative
* Prose only—no formatting symbols
* Include spoken section headers naturally within the narration
* The script should sound smooth and confident when read aloud by a TTS engine`;

// Build prompt for converting newsletter chunks to narrative script
function buildScriptPrompt(chunks: Chunk[]): string {
  const chunksByType = {
    planned_releases: chunks.filter((c) => c.section_type === 'planned_releases'),
    tech_releases: chunks.filter((c) => c.section_type === 'tech_releases'),
    bugs_fixes: chunks.filter((c) => c.section_type === 'bugs_fixes'),
    other: chunks.filter((c) => c.section_type === 'other'),
  };

  let newsletterContent = '';

  if (chunksByType.planned_releases.length > 0) {
    newsletterContent += '## PLANNED RELEASES\n\n';
    chunksByType.planned_releases.forEach((chunk) => {
      newsletterContent += `### ${chunk.heading}\n${chunk.content}\n\n`;
    });
  }

  if (chunksByType.tech_releases.length > 0) {
    newsletterContent += '## TECH RELEASES\n\n';
    chunksByType.tech_releases.forEach((chunk) => {
      newsletterContent += `### ${chunk.heading}\n${chunk.content}\n\n`;
    });
  }

  if (chunksByType.bugs_fixes.length > 0) {
    newsletterContent += '## BUGS & FIXES\n\n';
    chunksByType.bugs_fixes.forEach((chunk) => {
      newsletterContent += `### ${chunk.heading}\n${chunk.content}\n\n`;
    });
  }

  if (chunksByType.other.length > 0) {
    newsletterContent += '## OTHER UPDATES\n\n';
    chunksByType.other.forEach((chunk) => {
      newsletterContent += `### ${chunk.heading}\n${chunk.content}\n\n`;
    });
  }

  return `NEWSLETTER CONTENT:
${newsletterContent}`;
}

// Generate script using OpenAI GPT-4o mini
export async function generateScript(chunks: Chunk[]): Promise<string> {
  const prompt = buildScriptPrompt(chunks);
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const script = response.choices[0]?.message?.content;

  if (!script) {
    throw new Error('Failed to generate script from OpenAI');
  }

  return script.trim();
}

// Stream version (for real-time updates, optional)
export async function generateScriptStreaming(
  chunks: Chunk[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const prompt = buildScriptPrompt(chunks);
  const client = getOpenAI();

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    stream: true,
  });

  let fullScript = '';

  for await (const part of stream) {
    const content = part.choices[0]?.delta?.content || '';
    fullScript += content;
    onChunk(content);
  }

  return fullScript.trim();
}
