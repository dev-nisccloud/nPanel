import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';

// Input validation schema
const generateDomainsSchema = z.object({
  businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
  count: z.number().min(1).max(10).default(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessDescription, count } = generateDomainsSchema.parse(body);

    // Generate domain suggestions using OpenAI
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `You are a domain name expert. Generate ${count} creative, brandable, and memorable domain name suggestions for a business with this description:

"${businessDescription}"

Requirements:
- Domain names should be 2-3 words maximum
- Should be brandable and memorable
- Should relate to the business description
- Should be easy to spell and pronounce
- Avoid hyphens and numbers
- Make them unique and creative
- Consider modern naming trends

Return ONLY a JSON array of domain names (without extensions), like this:
["domainname1", "domainname2", "domainname3"]

Do not include any other text or explanation.`,
      temperature: 0.8,
    });

    // Parse the AI response
    let domainSuggestions: string[] = [];
    try {
      const parsed = JSON.parse(result.text);
      if (Array.isArray(parsed)) {
        domainSuggestions = parsed.slice(0, count);
      }
    } catch (parseError) {
      // Fallback: extract domain names from text if JSON parsing fails
      const lines = result.text.split('\n').filter(line => line.trim());
      domainSuggestions = lines
        .map(line => line.replace(/[^\w\s]/g, '').trim())
        .filter(name => name.length > 0 && name.length < 20)
        .slice(0, count);
    }

    // Ensure we have at least some suggestions
    if (domainSuggestions.length === 0) {
      domainSuggestions = [
        'innovate',
        'creativestudio',
        'digitalhub',
        'nexus',
        'pinnacle',
        'vertex'
      ].slice(0, count);
    }

    return Response.json({
      success: true,
      suggestions: domainSuggestions,
      usage: result.usage,
    });

  } catch (error) {
    console.error('AI domain generation error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid input', 
          details: error.issues 
        },
        { status: 400 }
      );
    }

    return Response.json(
      { 
        success: false, 
        error: 'Failed to generate domain suggestions' 
      },
      { status: 500 }
    );
  }
}

