
export interface StructuredPrompt {
  subject: string;
  background: string;
  imageType: string;
  style: string;
  texture: string;
  colorPalette: string;
  lighting: string;
  additionalDetails: string;
}

// This defines the canonical order and keys for prompt parts.
// It's used for both parsing and stringifying to maintain consistency.
export const PROMPT_FIELD_KEYS: (keyof StructuredPrompt)[] = [
  'subject',
  'background',
  'imageType',
  'style',
  'texture',
  'colorPalette',
  'lighting',
  'additionalDetails',
];

export const createDefaultStructuredPrompt = (): StructuredPrompt => ({
  subject: '',
  background: '',
  imageType: '',
  style: '',
  texture: '',
  colorPalette: '',
  lighting: '',
  additionalDetails: '',
});

export const parsePromptToStructured = (prompt: string): StructuredPrompt => {
  // This regex correctly splits by comma, but respects commas inside double quotes.
  const parts = prompt.split(/,\s*(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  const structured = createDefaultStructuredPrompt();

  // Distribute parts to fields in order. This provides graceful degradation for unparseable prompts.
  parts.forEach((part, index) => {
    const key = PROMPT_FIELD_KEYS[index];
    if (key) {
      let value = part.trim();
      // Unquote if necessary
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      structured[key] = value;
    }
  });

  return structured;
};


export const structuredPromptToString = (structured: StructuredPrompt | null): string => {
  if (!structured) return '';
  
  // Join the values of the structured prompt in the canonical order.
  // Filters out empty/nullish values to create a cleaner prompt string.
  return PROMPT_FIELD_KEYS
    .map(key => {
        const value = (structured[key] || '').trim();
        // If the value contains a comma, it must be quoted to be treated as a single element by the parser.
        if (value.includes(',')) {
            return `"${value}"`;
        }
        return value;
    })
    .filter(value => value.trim() !== '' && value !== '""') // Remove empty parts
    .join(', ');
};