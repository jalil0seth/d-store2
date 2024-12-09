<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\LLMService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private $llmService;

    public function __construct()
    {
        $this->llmService = LLMService::getInstance();
    }

    public function index(Request $request)
    {
        $query = Product::query();
        
        if ($request->has('featured')) {
            $query->where('featured', (bool)$request->featured);
        }
        
        $products = $query->paginate(10);
        
        
        return response()->json([
            'page' => $products->currentPage(),
            'items' => $products->items(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'brand' => 'nullable|string',
            'category' => 'nullable|string',
            'type' => 'nullable|string',
            'collectionId' => 'nullable|string',
            'collectionName' => 'nullable|string',
            'featured' => 'boolean',
            'image' => 'nullable|string',
            'images' => 'nullable|json',
            'isAvailable' => 'boolean',
            'metadata' => 'nullable|json',
            'variants' => 'nullable|json'
        ]);

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    public function show($slug)
    {
        $product = Product::where('slug', $slug)->firstOrFail();
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'brand' => 'nullable|string',
            'category' => 'nullable|string',
            'type' => 'nullable|string',
            'collectionId' => 'nullable|string',
            'collectionName' => 'nullable|string',
            'featured' => 'boolean',
            'image' => 'nullable|string',
            'images' => 'nullable|json',
            'isAvailable' => 'boolean',
            'metadata' => 'nullable|json',
            'variants' => 'nullable|json'
        ]);

        $product->update($validated);
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    public function generateProduct(Request $request)
    {
        $request->validate([
            'productName' => 'required|string|max:255'
        ]);

        try {
            $productData = $this->llmService->generateProductContent($request->productName);
            $standardizedResponse = [
                'name' => $productData['name'] ?? $request->productName,
                'brand' => $productData['brand'] ?? '',
                'description' => $productData['description'] ?? '',
                'type' => $productData['type'] ?? '',
                'category' => $productData['category'] ?? '',
                'featured' => 0,
                'metadata' => json_encode($this->standardizeMetadata($productData['metadata'] ?? [])),
                'variants' => json_encode($this->standardizeVariants($productData['name'] ?? $request->productName, $productData['variants'] ?? [])),
                'isAvailable' => 0,
                'slug' => Str::slug($productData['name'] ?? $request->productName)
            ];

            $product = Product::create($standardizedResponse);
            return response()->json($product, 201);
        } catch (\Exception $error) {
            // Return default values if generation fails
            $defaultName = $request->productName;
            $defaultData = [
                'name' => $defaultName,
                'brand' => '',
                'description' => '',
                'type' => '',
                'category' => '',
                'featured' => 0,
                'metadata' => json_encode([
                    'sales_pitch' => "Discover the potential of {$defaultName}",
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
                'slug' => Str::slug($defaultName)
            ];

            $product = Product::create($defaultData);
            return response()->json($product, 201);
        }
    }

    public function generatePage(Request $request)
    {
        $request->validate([
            'pageName' => 'required|string|max:255',
            'storeName' => 'required|string|max:255'
        ]);

        try {
            $pageContent = $this->llmService->generatePageContent($request->pageName, $request->storeName);
            return response()->json($pageContent);
        } catch (\Exception $error) {
            return response()->json([
                'error' => 'Failed to generate page content',
                'message' => $error->getMessage()
            ], 500);
        }
    }

    public function importFromApi()
    {
        try {
            $response = Http::get('https://api.npoint.io/a4dfc1a429f00362bafd/items');
            $products = $response->json();

            foreach ($products as $productData) {
                // Ensure metadata and variants are properly encoded JSON strings
                $productData['metadata'] = is_string($productData['metadata']) 
                    ? $productData['metadata'] 
                    : json_encode($productData['metadata']);
                
                $productData['variants'] = is_string($productData['variants']) 
                    ? $productData['variants'] 
                    : json_encode($productData['variants']);

                // Create the product with validated data
                Product::create([
                    'name' => $productData['name'],
                    'slug' => $productData['slug'],
                    'description' => $productData['description'],
                    'brand' => $productData['brand'],
                    'category' => $productData['category'],
                    'type' => $productData['type'],
                    'collectionId' => $productData['collectionId'],
                    'collectionName' => $productData['collectionName'],
                    'featured' => (bool) $productData['featured'],
                    'image' => $productData['image'],
                    'images' => $productData['images'],
                    'isAvailable' => (bool) $productData['isAvailable'],
                    'metadata' => $productData['metadata'],
                    'variants' => $productData['variants']
                ]);
            }

            return response()->json(['message' => 'Products imported successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to import products',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function standardizeVariants(string $productName, array $variants = null): array
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

    private function generateVariantId(): string
    {
        $timestamp = strtoupper(base_convert(time(), 10, 36));
        $random = strtoupper(Str::random(6));
        return "VAR-{$timestamp}-{$random}";
    }
}
