import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Product } from "@/types";
import { ImageIcon, X, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/Tabs"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { cn } from "@/lib/utils";
import { llmService } from "@/services/LLMService";
import { toast } from "sonner";
import { generateVariantId } from '@/services/LLMService';

interface AddEditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product>) => Promise<void>;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  original_price: number;
  available: boolean;
}

interface ProductFeatures {
  tax_included: boolean;
  requires_shipping: boolean;
  track_quantity: boolean;
  continue_selling: boolean;
  featured: number;
  sales_pitch: string;
  bullet_points: string[];
}

const defaultFeatures: ProductFeatures = {
  tax_included: false,
  requires_shipping: true,
  track_quantity: true,
  continue_selling: false,
  featured: 0,  // Always default to 0
  sales_pitch: '',
  bullet_points: []
};

const defaultProduct: Partial<Product> = {
  name: '',
  description: '',
  type: '',
  category: '',
  brand: '',
  featured: 0,  // Always default to 0
  image: '',
  images: '[]',
  metadata: '{}',
  variants: '[]',
  isAvailable: 0,  // Always default to 0
  features: JSON.stringify(defaultFeatures)
};

const parseVariants = (variantsStr: string): Variant[] => {
  try {
    const parsed = JSON.parse(variantsStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing variants:', error);
    return [];
  }
};

const parseImages = (imagesStr: string): string[] => {
  try {
    const parsed = JSON.parse(imagesStr || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing images:', error);
    return [];
  }
};

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  product,
  open,
  onOpenChange,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [isAvailable, setIsAvailable] = useState<number>(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [features, setFeatures] = useState<ProductFeatures>(defaultFeatures);
  const [jsonErrors, setJsonErrors] = useState<{
    images?: string;
    variants?: string;
    metadata?: string;
  }>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<string>('');
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Ensure Basic tab is always the default when modal opens
    if (open) {
      setActiveTab('basic');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (product) {
        try {
          const parsedVariants = parseVariants(product.variants || '[]').map((variant: Variant) => ({
            ...variant,
            id: variant.id || generateVariantId()
          }));
          const parsedImages = parseImages(product.images || '[]');
          setVariants(parsedVariants);
          setImages(parsedImages);
          setName(product.name || '');
          setDescription(product.description || '');
          setImage(product.image || '');
          setBrand(product.brand || '');
          setCategory(product.category || '');
          setType(product.type || '');
          setIsAvailable(product.isAvailable);
          
          // Parse features and set initial state
          let initialFeatures = defaultFeatures;
          try {
            if (product) {
              console.log('Product data for features:', product);
              const metadata = product.metadata ? JSON.parse(product.metadata) : {};
              console.log('Parsed metadata:', metadata);
              initialFeatures = {
                ...defaultFeatures,
                ...metadata,
                featured: product.featured // Use the product's featured value directly
              };
              console.log('Initial features:', initialFeatures);
            }
          } catch (error) {
            console.error('Error parsing metadata:', error);
          }
          setFeatures(initialFeatures);
        } catch (error) {
          console.error('Error initializing product data:', error);
          setVariants([]);
          setImages([]);
          setName('');
          setDescription('');
          setImage('');
          setBrand('');
          setCategory('');
          setType('');
          setIsAvailable(0);
          setFeatures(defaultFeatures);
        }
      } else {
        setVariants([]);
        setImages([]);
        setName('');
        setDescription('');
        setImage('');
        setBrand('');
        setCategory('');
        setType('');
        setIsAvailable(0);
        setFeatures(defaultFeatures);
      }
      setJsonErrors({});
      setEditingVariant(null);
      setEditingVariantIndex(null);
      setEditingImage('');
      setEditingImageIndex(null);
    }
  }, [open, product]);

  const handleVariantSubmit = () => {
    if (!editingVariant) return;

    const updatedVariants = [...variants];
    if (editingVariantIndex !== null) {
      updatedVariants[editingVariantIndex] = {
        ...editingVariant,
        price: Number(editingVariant.price),
        original_price: Number(editingVariant.original_price)
      };
    } else {
      updatedVariants.push({
        ...editingVariant,
        id: generateVariantId(),
        price: Number(editingVariant.price),
        original_price: Number(editingVariant.original_price),
        available: true
      });
    }

    setVariants(updatedVariants);
    setEditingVariant(null);
    setEditingVariantIndex(null);
  };

  const handleVariantChange = (field: keyof Variant, value: string | number | boolean) => {
    if (!editingVariant) return;
    setEditingVariant(prev => ({
      ...prev,
      [field]: field === 'price' || field === 'original_price' ? Number(value) : value
    }));
  };

  const handleAddVariant = () => {
    setEditingVariant({
      id: generateVariantId(),
      name: '',
      price: 0,
      original_price: 0,
      available: true
    });
    setEditingVariantIndex(null);
  };

  const handleEditVariant = (index: number) => {
    const variant = variants[index];
    if (variant) {
      setEditingVariant({ ...variant });
      setEditingVariantIndex(index);
    }
  };

  const handleVariantDelete = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants.splice(index, 1);
    setVariants(updatedVariants);
  };

  const handleImageSubmit = () => {
    if (!editingImage.trim()) return;

    const updatedImages = [...images];
    if (editingImageIndex !== null) {
      updatedImages[editingImageIndex] = editingImage;
    } else {
      updatedImages.push(editingImage);
    }

    setImages(updatedImages);
    setEditingImage('');
    setEditingImageIndex(null);
  };

  const handleImageDelete = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const handleEditImage = (index: number) => {
    const image = images[index];
    if (image) {
      setEditingImage(image);
      setEditingImageIndex(index);
    }
  };

  const handleGenerateContent = async () => {
    if (!name) {
      toast.error("Please enter a product name first");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await llmService.generateProductContent(name);
      
      // Update all the form fields with the generated content
      setName(result.name);
      setDescription(result.description);
      setBrand(result.brand);
      setCategory(result.category);
      setType(result.type);
      
      // Parse and set variants
      try {
        const parsedVariants = JSON.parse(result.variants);
        setVariants(parsedVariants);
      } catch (error) {
        console.error('Error parsing variants:', error);
        setVariants([]);
      }

      // Parse and set metadata
      try {
        const parsedMetadata = JSON.parse(result.metadata);
        // Ensure featured is set as a number
        setFeatures({
          ...parsedMetadata,
          featured: result.featured ? 1 : 0
        });
      } catch (error) {
        console.error('Error parsing metadata:', error);
        setFeatures(defaultFeatures);
      }

      toast.success("Product content generated successfully!");
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate product content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!name || !category || !type || !brand) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare metadata
      const metadata = {
        tax_included: features?.tax_included || false,
        requires_shipping: features?.requires_shipping || true,
        track_quantity: features?.track_quantity || true,
        continue_selling: features?.continue_selling || false,
        sales_pitch: features?.sales_pitch || '',
        bullet_points: features?.bullet_points || []
      };

      console.log('Features before preparing data:', features);
      const productData = {
        name,
        description,
        brand,
        category,
        type,
        isAvailable: Number(isAvailable || 0),
        featured: features?.featured === undefined ? 0 : Number(features.featured), // Ensure it's always a valid number
        image: image || '',
        images: JSON.stringify(images || []),
        metadata: JSON.stringify({
          ...metadata,
          featured: features?.featured === undefined ? 0 : Number(features.featured), // Also include in metadata
        }),
        variants: JSON.stringify(variants.map(variant => ({
          ...variant,
          id: variant.id || generateVariantId()
        })))
      };
      console.log('Product data being sent:', productData);
      console.log('Featured value in productData:', productData.featured, typeof productData.featured);

      await onSave(productData);
      toast.success(`Product ${product ? 'updated' : 'created'} successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product';
      toast.error(errorMessage);
    }
  };

  const imagesToText = (imagesStr: string): string => {
    const images = parseImages(imagesStr);
    return images.join('\n');
  };

  const textToImages = (text: string): string => {
    const images = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    return JSON.stringify(images);
  };

  const validateJson = (value: string, field: keyof typeof jsonErrors) => {
    try {
      const parsed = JSON.parse(value);
      if (field === 'images' || field === 'variants') {
        if (!Array.isArray(parsed)) {
          setJsonErrors(prev => ({ ...prev, [field]: `${field} must be an array` }));
          return false;
        }
      }
      setJsonErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      setJsonErrors(prev => ({ ...prev, [field]: `Invalid JSON: ${error.message}` }));
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">{product ? 'Edit' : 'Add'} Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="col-span-2 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="name" className="text-base font-semibold text-gray-900">
                          Product Name
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateContent}
                          disabled={isGenerating}
                          className="flex items-center gap-2"
                        >
                          <Wand2 className="w-4 h-4" />
                          {isGenerating ? "Generating..." : "Generate Content"}
                        </Button>
                      </div>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter product name"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="description" className="text-base font-semibold text-gray-900">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter product description"
                        className="h-[200px] resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="brand" className="text-base font-semibold text-gray-900">
                        Brand
                      </Label>
                      <Input
                        id="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Enter brand name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label htmlFor="category" className="text-base font-semibold text-gray-900">
                          Category
                        </Label>
                        <Input
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Enter category"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="type" className="text-base font-semibold text-gray-900">
                          Type
                        </Label>
                        <Input
                          id="type"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          placeholder="Enter type"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold text-gray-900">
                        Product Status
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="isAvailable">Availability</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isAvailable"
                              checked={isAvailable === 1}
                              onCheckedChange={(checked) => setIsAvailable(checked ? 1 : 0)}
                            />
                            <label
                              htmlFor="isAvailable"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              on
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="featured">Featured</Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="featured"
                              checked={features?.featured === 1}
                              onCheckedChange={(checked) => {
                                setFeatures(prev => ({
                                  ...prev,
                                  featured: checked ? 1 : 0
                                }));
                              }}
                            />
                            <label
                              htmlFor="featured"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              on
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Main Image</h3>
                    <div className="space-y-4">
                      <Input
                        id="image"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Enter main image URL"
                        className="w-full"
                      />
                      {image && (
                        <div className="relative aspect-square w-64 rounded-lg border-2 border-dashed border-gray-200 p-2">
                          <img
                            src={image}
                            alt="Product preview"
                            className="h-full w-full object-contain rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Additional Images</h3>
                      {!editingImage && editingImageIndex === null && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingImage('');
                            setEditingImageIndex(null);
                          }}
                          className="flex items-center gap-2"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Add Image
                        </Button>
                      )}
                    </div>

                    {(editingImage !== null || editingImageIndex !== null) && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input
                            value={editingImage}
                            onChange={(e) => setEditingImage(e.target.value)}
                            placeholder="Enter image URL"
                            className="w-full"
                            autoFocus
                          />
                          {editingImage && (
                            <div className="relative aspect-square w-48 rounded-lg border-2 border-dashed border-gray-200 p-2">
                              <img
                                src={editingImage}
                                alt="Image preview"
                                className="h-full w-full object-contain rounded-lg"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.src = 'https://placehold.co/400x400?text=Invalid+Image';
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingImage('');
                              setEditingImageIndex(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleImageSubmit}
                            disabled={!editingImage.trim()}
                          >
                            {editingImageIndex !== null ? 'Update' : 'Add'} Image
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-4">
                      {Array.isArray(images) && images.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg">
                            <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditImage(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleImageDelete(index)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Product Variants</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariant}
                      className="flex items-center gap-2"
                    >
                      Add Variant
                    </Button>
                  </div>

                  {editingVariant && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={editingVariant.name}
                            onChange={(e) => handleVariantChange('name', e.target.value)}
                            placeholder="Variant name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input
                            type="number"
                            value={editingVariant.price}
                            onChange={(e) => handleVariantChange('price', e.target.value)}
                            placeholder="Price"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Original Price</Label>
                          <Input
                            type="number"
                            value={editingVariant.original_price}
                            onChange={(e) => handleVariantChange('original_price', e.target.value)}
                            placeholder="Original price"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="available"
                            checked={editingVariant.available}
                            onCheckedChange={(checked) => handleVariantChange('available', checked)}
                          />
                          <Label htmlFor="available">Available</Label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingVariant(null);
                            setEditingVariantIndex(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleVariantSubmit}>
                          {editingVariantIndex !== null ? 'Update' : 'Add'} Variant
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">ID</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Price</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Original</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Available</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Array.isArray(variants) && variants.map((variant, index) => (
                          <tr key={variant.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-500 text-xs">{variant.id}</td>
                            <td className="px-4 py-2">{variant.name}</td>
                            <td className="px-4 py-2">${variant.price}</td>
                            <td className="px-4 py-2">${variant.original_price}</td>
                            <td className="px-4 py-2">{variant.available ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-2 text-right space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditVariant(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleVariantDelete(index)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Metadata</h3>
                    <div className="space-y-2">
                      <Label htmlFor="metadata">Custom Metadata (JSON)</Label>
                      <Textarea
                        id="metadata"
                        value={JSON.stringify(features, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFeatures(parsed);
                            setJsonErrors((prev) => ({ ...prev, metadata: null }));
                          } catch (error) {
                            console.error('Error parsing metadata:', error);
                            setJsonErrors((prev) => ({ ...prev, metadata: 'Invalid JSON format' }));
                          }
                        }}
                        placeholder="Enter metadata in JSON format"
                        className="h-[200px] font-mono"
                      />
                      {jsonErrors.metadata && (
                        <p className="text-sm text-red-500">{jsonErrors.metadata}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {product ? 'Update' : 'Create'} Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
