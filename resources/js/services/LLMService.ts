import axios from 'axios';

export const generateId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const generateVariantId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `VAR-${timestamp}-${randomStr}`.toUpperCase();
};

export class LLMService {
    private static instance: LLMService;
    private static baseUrl = 'https://api.livepolls.app/api';

    private constructor() {}

    public static getInstance(): LLMService {
        if (!LLMService.instance) {
            LLMService.instance = new LLMService();
        }
        return LLMService.instance;
    }

    private standardizeVariants(productName: string, variants: any[]): any[] {
        const defaultVariants = [
            {
                id: generateVariantId(),
                name: "Basic",
                price: 99,
                original_price: 129,
                available: true
            },
            {
                id: generateVariantId(),
                name: "Pro",
                price: 199,
                original_price: 249,
                available: true
            },
            {
                id: generateVariantId(),
                name: "Enterprise",
                price: 399,
                original_price: 499,
                available: true
            }
        ];

        if (!Array.isArray(variants) || variants.length !== 3) {
            return defaultVariants;
        }

        return variants.map((variant, index) => ({
            id: generateVariantId(),
            name: variant.name || defaultVariants[index].name,
            price: Number(variant.price) || defaultVariants[index].price,
            original_price: Number(variant.original_price) || defaultVariants[index].original_price,
            available: true
        }));
    }

    private standardizeMetadata(metadata: any): any {
        const defaultMetadata = {
            sales_pitch: "Transform your workflow with our powerful solution. Boost productivity and streamline operations.",
            bullet_points: [
                "Easy to use and intuitive interface",
                "Seamless integration with existing tools",
                "24/7 customer support and updates"
            ]
        };

        if (!metadata || typeof metadata !== 'object') {
            return defaultMetadata;
        }

        return {
            sales_pitch: metadata.sales_pitch || defaultMetadata.sales_pitch,
            bullet_points: Array.isArray(metadata.bullet_points) && metadata.bullet_points.length > 0
                ? metadata.bullet_points.map((point: string) => 
                    point.startsWith('') ? point : ` ${point}`
                ).slice(0, 3)
                : defaultMetadata.bullet_points
        };
    }

    private extractJsonFromMarkdown(content: string): any {
        try {
            // First trim the overall content
            const trimmedContent = content.trim();
            
            // Remove markdown code block markers
            const withoutCodeBlocks = trimmedContent
                .replace(/^```json\s*/, '')  // Start of JSON block
                .replace(/\s*```$/, '')      // End of JSON block
                .trim();
            
            // Remove any control characters
            const cleanContent = withoutCodeBlocks
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                .trim();
            
            // Find the JSON object
            const jsonMatch = cleanContent.match(/^\{[\s\S]*\}$/);
            if (!jsonMatch) {
                console.error('Content after cleaning:', cleanContent);
                throw new Error('No valid JSON object found in response');
            }
            
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Failed to extract JSON from markdown:', error);
            throw error;
        }
    }

    private async makeRequest(systemPrompt: string, userContent: string): Promise<any> {
        try {
            const response = await axios.post(`${LLMService.baseUrl}/write-with-role`, {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ]
            });

            const initialData = response.data;
            const taskId = initialData.task_id;

            // Poll for results
            while (true) {
                const statusResponse = await axios.get(`${LLMService.baseUrl}/async-task-result/${taskId}`);
                const statusData = statusResponse.data;

                if (!(statusData.running ?? false)) {
                    const result = JSON.parse(statusData.result ?? '{}');
                    return this.extractJsonFromMarkdown(result.content);
                }

                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next poll
            }
        } catch (error) {
            console.error('Error making request:', error);
            throw error;
        }
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async generateProductContent(productName: string): Promise<any> {
        const systemPrompt = `You are a helpful AI that generates product content. Please generate realistic product content based on the product name. The response should be in JSON format and match this schema:
{
    "brand": "string",
    "name": "string",
    "description": "string",
    "type": "string",
    "category": "string",
    "featured": 0,
    "metadata": {
        "sales_pitch": "string",
        "bullet_points": ["string", "string", "string"]
    },
    "variants": [
        {
            "name": "Basic",
            "price": 99,
            "original_price": 129,
            "available": true
        },
        {
            "name": "Pro",
            "price": 199,
            "original_price": 249,
            "available": true
        },
        {
            "name": "Enterprise",
            "price": 399,
            "original_price": 499,
            "available": true
        }
    ]
}`;

        const userContent = `Generate product content for: ${productName}

Please ensure:
1. The content is realistic and detailed
2. The description highlights key features and benefits
3. The prices make sense for the product category
4. The variants follow a good/better/best pricing strategy
5. The metadata includes compelling sales pitch and bullet points`;

        try {
            const response = await this.makeRequest(systemPrompt, userContent);
            
            // Standardize the response and ensure numeric fields
            const standardizedResponse = {
                name: response.name || productName,
                brand: response.brand || '',
                description: response.description || '',
                type: response.type || '',
                category: response.category || '',
                featured: 0, // Always set to 0 for new products
                metadata: JSON.stringify(this.standardizeMetadata(response.metadata)),
                variants: JSON.stringify(this.standardizeVariants(response.name, response.variants || [])),
                isAvailable: 0, // Always set to 0 for new products
                slug: this.generateSlug(response.name || productName)
            };

            return standardizedResponse;
        } catch (error) {
            console.error('Error generating product content:', error);
            // Return default values if generation fails
            const defaultName = productName;
            return {
                name: defaultName,
                brand: '',
                description: '',
                type: '',
                category: '',
                featured: 0,
                metadata: JSON.stringify({
                    sales_pitch: `Discover the potential of ${defaultName}`,
                    bullet_points: ['Powerful', 'Intuitive', 'Reliable']
                }),
                variants: JSON.stringify([{
                    name: 'Standard',
                    price: 49.99,
                    description: 'Standard version'
                }]),
                isAvailable: 0,
                slug: this.generateSlug(defaultName)
            };
        }
    }

    public async generatePageContent(pageName: string, storeName: string): Promise<{
        title: string;
        slug: string;
        content: string;
        meta_title: string;
        meta_description: string;
    }> {
        const systemPrompt = `You are an expert e-commerce content writer and SEO specialist who creates comprehensive, engaging content for online stores. 
Your task is to generate detailed, well-structured content that follows these guidelines:

1. Content Structure:
   - Use proper HTML semantic tags (h1, h2, h3, p, ul, etc.)
   - Create multiple sections with clear headings
   - Include at least 1000 words of content
   - Add relevant calls-to-action throughout the content

2. Content Elements to Include:
   - An engaging introduction that hooks the reader
   - Multiple detailed sections explaining different aspects
   - Benefits and features where relevant
   - FAQs section with at least 5 common questions
   - Customer-focused content that addresses pain points
   - Clear value propositions
   - Trust-building elements (guarantees, policies, etc.)

3. SEO Requirements:
   - Title should be clear, compelling, and SEO-optimized
   - Meta title should be max 60 characters and include main keyword
   - Meta description should be 150-160 characters, include call-to-action
   - Use semantic HTML structure for better SEO
   - Include relevant keywords naturally in the content

4. Writing Style:
   - Professional yet conversational tone
   - Short paragraphs for better readability
   - Use bullet points and lists where appropriate
   - Include engaging subheadings
   - Focus on benefits while explaining features`;

        const userContent = `Generate comprehensive content for a "${pageName}" page for "${storeName}".

The response should be in this JSON format:
{
    "title": "engaging, SEO-friendly title",
    "slug": "url-friendly-slug",
    "content": "detailed HTML content with proper semantic structure",
    "meta_title": "compelling title under 60 chars",
    "meta_description": "engaging description 150-160 chars"
}

Make sure to:
1. Write at least 1000 words of high-quality content
2. Include multiple sections with clear headings
3. Add a comprehensive FAQ section
4. Use proper HTML formatting with semantic tags
5. Make the content engaging and valuable for customers
6. Include trust-building elements and calls-to-action
7. Optimize all content for both users and search engines`;

        try {
            const response = await this.makeRequest(systemPrompt, userContent);
            
            return {
                title: response.title || pageName,
                slug: this.generateSlug(response.title || pageName),
                content: response.content || `<h1>${pageName}</h1>\n<p>Welcome to our ${pageName} page.</p>`,
                meta_title: response.meta_title || `${pageName} - ${storeName}`,
                meta_description: response.meta_description || `Learn more about ${pageName} at ${storeName}. Find detailed information and resources.`
            };
        } catch (error) {
            console.error('Error generating page content:', error);
            throw error;
        }
    }
}

export const llmService = LLMService.getInstance();
