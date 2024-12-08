import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Pencil, Trash2, Eye, ShoppingCart, Box } from 'lucide-react';
import { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onView: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onView,
}) => {
  const getVariantCount = (variants: string) => {
    try {
      const parsed = JSON.parse(variants || '[]');
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead className="min-w-[200px]">Product Info</TableHead>
            <TableHead className="w-[200px]">Category</TableHead>
            <TableHead className="w-[100px]">Brand</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="text-right w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50/50">
              <TableCell>
                <div className="relative h-16 w-16 rounded-md overflow-hidden border border-gray-200">
                  <img
                    src={product.image || 'https://placehold.co/100x100?text=No+Image'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://placehold.co/100x100?text=No+Image';
                    }}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      {getVariantCount(product.variants)} variants
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100">
                      <Box className="w-3 h-3 mr-1" />
                      {product.type || 'No type'}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {product.category || 'Uncategorized'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {product.brand || 'No brand'}
                </span>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={product.isAvailable ? "success" : "destructive"}
                  className="w-full justify-center bg-opacity-10"
                >
                  {product.isAvailable ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onView(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                No products found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
