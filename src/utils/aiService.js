// AI Summarization Service using OpenRouter API
// Note: You'll need to add your API key in the .env file

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Format summary text for better readability
const formatSummary = (text) => {
  if (!text) return text;
  
  // Split by common separators and format
  let formatted = text;
  
  // Convert numbered lists (1. 2. 3.) to formatted lines
  formatted = formatted.replace(/(\d+)\.\s+/g, '\n$1. ');
  
  // Convert dash/bullet points to formatted lines
  formatted = formatted.replace(/(?:^|\n)([-•▪▫])\s+/gm, '\n• ');
  
  // Convert paragraphs (double newlines) to proper spacing
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Clean up leading/trailing whitespace
  formatted = formatted.trim();
  
  // Ensure proper spacing between sentences
  formatted = formatted.replace(/\.([A-Z])/g, '. $1');
  
  // Add spacing after colons
  formatted = formatted.replace(/:([A-Za-z])/g, ': $1');
  
  return formatted;
};

export const summarizeNote = async (content) => {
  if (!OPENAI_API_KEY) {
    throw new Error('API key is not configured. Please add REACT_APP_OPENAI_API_KEY to your .env file');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('Note content is empty');
  }

  const wordCount = content.trim().split(/\s+/).length;
  
  // Adjust max_tokens based on content length (aim for 20-50% of original for 50-80% reduction)
  const maxTokens = Math.min(Math.max(100, Math.floor(wordCount * 0.35)), 400);

  // Model fallback list (best to least preferred)
  const models = [
    'openai/gpt-4o-mini',  // Best quality, cost-effective
    'openai/gpt-3.5-turbo', // Fallback option
    'google/gemini-flash-1.5', // Alternative
  ];

  const systemPrompt = `
  You are a precise summarization system. Your job is to reduce text while keeping meaning.
  Never invent facts, and never add details not present in the source.
  
  STRUCTURE RULE:
  - If the input text is primarily bullets, numbered lists, or clearly itemized points → summarize using bullets.
  - If the input text is written in normal sentences/paragraphs → summarize in paragraph form (no bullet list).
  - Only use separators when truly needed (e.g., separating two distinct thematic sections). Do not add separators for single-section summaries.
  
  Core Summarization Rules:
  1) Identify the main theme and key ideas.
  2) Remove examples, anecdotes, and redundant details.
  3) Rewrite the core ideas in short, simple sentences.
  4) Do not copy long sentences verbatim.
  5) Aim to reduce text by 50–80%.
  6) Maintain a neutral, factual tone.
  
  Formatting Policy:
  - If there is a clear title, place it as a single line (≤ 10 words) at the top.
  - If the summary is bullet-based → use "- " for bullets and minimal sub-bullets.
  - Use **bold** sparingly for important entities or concepts.
  - Use a horizontal separator line "---" ONLY when summarizing multiple sections. Never add it for single-section text.
  - If the input is already a list, compress and de-duplicate it rather than repeating verbatim.
  `;
  
  

  const userPrompt = `
Summarize the text below. Reduce by 50–80% while keeping the core meaning.
Identify the main theme, remove side details, avoid long sentence copying.

Formatting Instructions:
- If the original text is a list (bullets/numbers), output the summary as a bullet list.
- If the original text is in paragraph form, output the summary in paragraph form (no bullets).
- Optional short title (≤ 10 words) if appropriate.
- Use **bold** sparingly.
- Only use a separator line "---" if summarizing more than one distinct section.
- Do not include meta commentary or labels like "Summary:".

Original Text (${wordCount} words):
---
${content}
---
`;


  // Try each model in sequence until one works
  for (let i = 0; i < models.length; i++) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Notes App',
        },
        body: JSON.stringify({
          model: models[i],
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        max_tokens: maxTokens,
        temperature: 0.2, // Lower temperature for more factual, consistent summaries
        top_p: 0.8,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If it's the last model, throw the error
        if (i === models.length - 1) {
          throw new Error(errorData.error?.message || `Failed to get AI summary: ${response.statusText}`);
        }
        // Otherwise, try next model
        continue;
      }

      const data = await response.json();
      let summary = data.choices[0]?.message?.content?.trim();
      
      if (!summary) {
        throw new Error('Empty response from AI model');
      }
      
      // Clean up the summary - remove any meta-commentary
      summary = summary.replace(/^(Summary:|Here's a summary:|Here is a summary:|Here's the summary:)\s*/i, '');
      summary = summary.trim();
      
      // Additional cleanup - remove common prefixes
      summary = summary.replace(/^(The following|This|The) (is a|note|summary) (of|about|regarding):\s*/i, '');
      summary = summary.trim();
      
      // Format the summary for better display
      summary = formatSummary(summary);
      
      return summary;
    } catch (error) {
      // If it's the last model or a non-API error, throw it
      if (i === models.length - 1 || !error.message.includes('Failed to get')) {
        console.error(`Error with model ${models[i]}:`, error);
        if (i === models.length - 1) {
          throw new Error(error.message || 'Failed to generate summary. Please try again.');
        }
      }
      // Continue to next model
      continue;
    }
  }

  // Should not reach here, but just in case
  throw new Error('All models failed. Please check your API key and try again.');
};

export const rewriteNote = async (content, instruction) => {
  if (!OPENAI_API_KEY) {
    throw new Error('API key is not configured. Please add REACT_APP_OPENAI_API_KEY to your .env file');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('Note content is empty');
  }

  if (!instruction || instruction.trim().length === 0) {
    throw new Error('Rewrite instruction is required');
  }

  const wordCount = content.trim().split(/\s+/).length;
  
  // Adjust max_tokens based on content length (allow for expansion or reduction)
  const maxTokens = Math.min(Math.max(200, Math.floor(wordCount * 1.5)), 2000);

  // Model fallback list (best to least preferred)
  const models = [
    'openai/gpt-4o-mini',  // Best quality, cost-effective
    'openai/gpt-3.5-turbo', // Fallback option
    'google/gemini-flash-1.5', // Alternative
  ];

  const systemPrompt = `
  You are a professional text rewriting assistant. Your job is to rewrite text according to user instructions while preserving the core meaning and facts.
  
  Core Rules:
  1) Follow the user's instruction precisely.
  2) Maintain all factual information and key details.
  3) Do not add information that wasn't in the original text unless explicitly asked.
  4) Preserve the overall structure and organization when possible.
  5) Ensure the rewritten text is clear, coherent, and well-formatted.
  6) If the instruction asks for formatting changes (like bullet points), apply them appropriately.
  7) Maintain the same level of detail unless the instruction asks to expand or reduce it.
  8) Do not add separator lines, horizontal rules, or decorative elements like "---" to the output.
  9) Do NOT add any introductory phrases, conversational text, or meta-commentary like "Certainly!", "Here are...", "I'll help you...", etc.
  10) Do NOT add any labels, headers, or explanatory text before or after the rewritten content.
  11) Output ONLY the rewritten text directly - start with the actual content, not with phrases like "Here are some recommendations" or "Certainly!".
  12) The output should be the rewritten text itself, not a description or introduction to it.
  `;
  
  const userPrompt = `
Rewrite the following text according to this instruction: "${instruction}"

Preserve all factual information and key points. Only change what is necessary to fulfill the instruction.

CRITICAL: Output ONLY the rewritten text directly. Do NOT add:
- Introductory phrases (e.g., "Certainly!", "Here are...", "I'll help you...")
- Conversational text or meta-commentary
- Labels, headers, or explanatory text
- Separator lines or decorative elements

Start directly with the rewritten content. Do not introduce it or explain what you're doing.

Original Text:
${content}

Provide the rewritten text now (start directly with the content):`;

  // Try each model in sequence until one works
  for (let i = 0; i < models.length; i++) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Notes App',
        },
        body: JSON.stringify({
          model: models[i],
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.7, // Slightly higher for more creative rewriting
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If it's the last model, throw the error
        if (i === models.length - 1) {
          throw new Error(errorData.error?.message || `Failed to rewrite note: ${response.statusText}`);
        }
        // Otherwise, try next model
        continue;
      }

      const data = await response.json();
      let rewritten = data.choices[0]?.message?.content?.trim();
      
      if (!rewritten) {
        throw new Error('Empty response from AI model');
      }
      
      // Clean up - remove any meta-commentary or wrapper text
      rewritten = rewritten.replace(/^(Here's the rewritten text:|Here is the rewritten text:|Rewritten text:|Rewritten:)\s*/i, '');
      rewritten = rewritten.trim();
      
      // Remove common wrapper patterns
      rewritten = rewritten.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
      rewritten = rewritten.trim();
      
      // Remove introductory phrases and conversational text
      // Remove phrases like "Certainly!", "Sure!", etc. (including when followed by other text)
      rewritten = rewritten.replace(/^(Certainly!|Sure!|Of course!|Absolutely!|Great!|Perfect!)\s*/gi, '');
      
      // Remove complete patterns like "Certainly! Here are some recommendations for effective note-taking:"
      rewritten = rewritten.replace(/^(Certainly!|Sure!|Of course!|Absolutely!|Great!|Perfect!)\s+(Here are|Here is|Here's)\s+(some|a few|several|the)?\s*(recommendations|suggestions|tips|ideas|points|ways|things|guidelines|strategies|methods|approaches)\s+(for|to|on|about|regarding)\s+[^:]*:?\s*/gi, '');
      
      // Remove "Here are some recommendations for..." patterns (with or without preceding phrase)
      rewritten = rewritten.replace(/^(Here are|Here is|Here's)\s+(some|a few|several|the)?\s*(recommendations|suggestions|tips|ideas|points|ways|things|guidelines|strategies|methods|approaches)\s+(for|to|on|about|regarding)\s+[^:]*:?\s*/gi, '');
      
      // Remove "Here are..." at start of lines (simpler patterns)
      rewritten = rewritten.replace(/^(Here are|Here is|Here's)\s+(some|a few|several|the)?\s*(recommendations|suggestions|tips|ideas|points|ways|things|following|below)\s*(for|to|on|about|regarding)?:?\s*/gi, '');
      
      // Remove conversational phrases
      rewritten = rewritten.replace(/^(I'll help you|I can help|Let me help|I've rewritten|I have rewritten|I rewrote|I'll rewrite|I can rewrite)\s+/gi, '');
      
      // Remove "Following/Below are..." patterns
      rewritten = rewritten.replace(/^(Following|Below|Here)\s+(are|is)\s+(the|some|a few|several)\s+(rewritten|revised|updated|effective|useful|helpful)\s+(text|content|version|recommendations|suggestions|tips|ideas|points|ways|things|guidelines|strategies|methods|approaches|note-taking|note taking)\s*(for|to|on|about|regarding)?:?\s*/gi, '');
      
      // Remove standalone "Here are some recommendations:" or similar at start
      rewritten = rewritten.replace(/^(Here are|Here is|Here's)\s+(some|a few|several|the)?\s*(recommendations|suggestions|tips|ideas|points|ways|things|guidelines|strategies|methods|approaches)\s*(for|to|on|about|regarding)?\s*[^:]*:?\s*/gi, '');
      
      // Remove any remaining conversational starters
      rewritten = rewritten.replace(/^(I'll|I will|Let me|I can|I've|I have)\s+/gi, '');
      
      // Final pass: Remove any line that starts with common introductory patterns
      rewritten = rewritten.split('\n').map(line => {
        // Skip lines that are purely introductory
        if (/^(Certainly!|Sure!|Of course!|Absolutely!|Great!|Perfect!|Here are|Here is|Here's|I'll|I will|Let me|I can|I've|I have)\s+/i.test(line.trim())) {
          // Check if the line is just an introduction (ends with colon or is very short)
          if (line.trim().endsWith(':') || line.trim().split(/\s+/).length <= 8) {
            return ''; // Remove this line
          }
        }
        return line;
      }).filter(line => line.trim().length > 0).join('\n');
      
      rewritten = rewritten.trim();
      
      // Remove separator lines (---, ===, ___, etc.)
      rewritten = rewritten.replace(/^[-=_]{3,}\s*$/gm, ''); // Remove lines that are only separators
      rewritten = rewritten.replace(/^[-=_]{3,}\s*/gm, ''); // Remove separator lines at start
      rewritten = rewritten.replace(/\s*[-=_]{3,}$/gm, ''); // Remove separator lines at end
      rewritten = rewritten.replace(/\n{3,}/g, '\n\n'); // Remove excessive newlines
      rewritten = rewritten.trim();
      
      return rewritten;
    } catch (error) {
      // If it's the last model or a non-API error, throw it
      if (i === models.length - 1 || !error.message.includes('Failed to rewrite')) {
        console.error(`Error with model ${models[i]}:`, error);
        if (i === models.length - 1) {
          throw new Error(error.message || 'Failed to rewrite note. Please try again.');
        }
      }
      // Continue to next model
      continue;
    }
  }

  // Should not reach here, but just in case
  throw new Error('All models failed. Please check your API key and try again.');
};

