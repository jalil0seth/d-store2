<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class LLMService
{
    private static $instance = null;
    private string $baseUrl = 'https://api.livepolls.app/api';

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function generateId(): string
    {
        return (string) mt_rand(100000, 999999);
    }

    public function generateVariantId(): string
    {
        $timestamp = strtoupper(base_convert(time(), 10, 36));
        $random = strtoupper(Str::random(6));
        return "VAR-{$timestamp}-{$random}";
    }

    private function standardizeVariants(string $productName, ?array $variants = null): array
    {
        $defaultVariants = [
            [
                'id' => $this->generateVariantId(),
                'name' => 'Basic',
                'price' => 99,
                'original_price' => 129,
                'available' => true
            ],
            [
                'id' => $this->generateVariantId(),
                'name' => 'Pro',
                'price' => 199,
                'original_price' => 249,
                'available' => true
            ],
            [
                'id' => $this->generateVariantId(),
                'name' => 'Enterprise',
                'price' => 399,
                'original_price' => 499,
                'available' => true
            ]
        ];

        if (!is_array($variants) || count($variants) !== 3) {
            return $defaultVariants;
        }

        return array_map(function($variant, $index) use ($defaultVariants) {
            return [
                'id' => $this->generateVariantId(),
                'name' => $variant['name'] ?? $defaultVariants[$index]['name'],
                'price' => floatval($variant['price'] ?? $defaultVariants[$index]['price']),
                'original_price' => floatval($variant['original_price'] ?? $defaultVariants[$index]['original_price']),
                'available' => true
            ];
        }, $variants, array_keys($variants));
    }

    private function standardizeMetadata($metadata): array
    {
        $defaultMetadata = [
            'sales_pitch' => 'Transform your workflow with our powerful solution. Boost productivity and streamline operations.',
            'bullet_points' => [
                'Easy to use and intuitive interface',
                'Seamless integration with existing tools',
                '24/7 customer support and updates'
            ]
        ];

        if (!is_array($metadata)) {
            return $defaultMetadata;
        }

        return [
            'sales_pitch' => $metadata['sales_pitch'] ?? $defaultMetadata['sales_pitch'],
            'bullet_points' => is_array($metadata['bullet_points'] ?? null) && count($metadata['bullet_points']) > 0
                ? array_slice($metadata['bullet_points'], 0, 3)
                : $defaultMetadata['bullet_points']
        ];
    }

    private function makeRequest(string $systemPrompt, string $userContent): array
    {
        try {
            $response = Http::post("{$this->baseUrl}/write-with-role", [
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userContent]
                ]
            ]);

            $initialData = $response->json();
            $taskId = $initialData['task_id'];

            // Poll for results
            while (true) {
                $statusResponse = Http::get("{$this->baseUrl}/async-task-result/{$taskId}");
                $statusData = $statusResponse->json();

                if (!($statusData['running'] ?? false)) {
                    $result = json_decode($statusData['result'] ?? '{}', true);
                    return json_decode($this->extractJsonFromMarkdown($result['content']), true);
                }

                sleep(1); // Wait 1 second before next poll
            }
        } catch (\Exception $error) {
            throw $error;
        }
    }

    private function extractJsonFromMarkdown(string $content): string
    {
        // Remove markdown code block markers and trim content
        $content = trim(preg_replace('/^```json\s*|\s*```$/', '', trim($content)));
        
        // Remove any control characters
        $content = preg_replace('/[\x00-\x1F\x7F-\x9F]/u', '', $content);

        // Find the JSON object
        if (!preg_match('/^\{[\s\S]*\}$/', $content)) {
            throw new \Exception('No valid JSON object found in response');
        }

        return $content;
    }

    public function generateProductContent(string $productName): array
    {
        $systemPrompt = 'You are a helpful AI that generates product content. Please generate realistic product content based on the product name. The response should be in JSON format and match this schema:
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
}';

        $userContent = "Generate product content for: {$productName}

Please ensure:
1. The content is realistic and detailed
2. The description highlights key features and benefits
3. The prices make sense for the product category
4. The variants follow a good/better/best pricing strategy
5. The metadata includes compelling sales pitch and bullet points";

        try {
            $response = $this->makeRequest($systemPrompt, $userContent);
            
            return [
                'name' => $response['name'] ?? $productName,
                'brand' => $response['brand'] ?? '',
                'description' => $response['description'] ?? '',
                'type' => $response['type'] ?? '',
                'category' => $response['category'] ?? '',
                'featured' => 0,
                'metadata' => json_encode($this->standardizeMetadata($response['metadata'] ?? [])),
                'variants' => json_encode($this->standardizeVariants($response['name'] ?? $productName, $response['variants'] ?? [])),
                'isAvailable' => 0,
                'slug' => Str::slug($response['name'] ?? $productName)
            ];
        } catch (\Exception $error) {
            // Return default values if generation fails
            return [
                'name' => $productName,
                'brand' => '',
                'description' => '',
                'type' => '',
                'category' => '',
                'featured' => 0,
                'metadata' => json_encode([
                    'sales_pitch' => "Discover the potential of {$productName}",
                    'bullet_points' => ['Powerful', 'Intuitive', 'Reliable']
                ]),
                'variants' => json_encode([
                    [
                        'id' => $this->generateVariantId(),
                        'name' => 'Standard',
                        'price' => 49.99,
                        'original_price' => 69.99,
                        'available' => true
                    ]
                ]),
                'isAvailable' => 0,
                'slug' => Str::slug($productName)
            ];
        }
    }

    public function generatePageContent(string $pageName, string $storeName): array
    {
        $systemPrompt = 'You are an expert e-commerce content writer and SEO specialist who creates comprehensive, engaging content for online stores. 
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
   - Focus on benefits while explaining features';

        $userContent = "Generate comprehensive content for a \"{$pageName}\" page for \"{$storeName}\".

The response should be in this JSON format:
{
    \"title\": \"engaging, SEO-friendly title\",
    \"slug\": \"url-friendly-slug\",
    \"content\": \"detailed HTML content with proper semantic structure\",
    \"meta_title\": \"compelling title under 60 chars\",
    \"meta_description\": \"engaging description 150-160 chars\"
}";

        try {
            $response = $this->makeRequest($systemPrompt, $userContent);
            
            return [
                'title' => $response['title'] ?? $pageName,
                'slug' => Str::slug($response['title'] ?? $pageName),
                'content' => $response['content'] ?? "<h1>{$pageName}</h1>\n<p>Welcome to our {$pageName} page.</p>",
                'meta_title' => $response['meta_title'] ?? "{$pageName} - {$storeName}",
                'meta_description' => $response['meta_description'] ?? "Learn more about {$pageName} at {$storeName}. Find detailed information and resources."
            ];
        } catch (\Exception $error) {
            throw $error;
        }
    }
}
