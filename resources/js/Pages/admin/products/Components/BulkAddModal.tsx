import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Product } from "@/types";

interface BulkAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (products: Partial<Product>[]) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  value: string;
  bulkAddProgress: {
    total: number;
    completed: number;
    status: 'idle' | 'generating' | 'creating' | 'completed' | 'error';
    products: Array<{
      name: string;
      status: 'pending' | 'generating' | 'generated' | 'creating' | 'created' | 'error';
      error?: string;
    }>;
  };
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({
  open,
  onOpenChange,
  onAdd,
  onChange,
  value,
  bulkAddProgress
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'generating':
      case 'creating':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productNames = value.trim().split('\n').filter(name => name.trim());
    if (productNames.length > 0) {
      const products = productNames.map(name => ({ name }));
      await onAdd(products);
    }
  };

  const progressPercentage = bulkAddProgress.total > 0 
    ? (bulkAddProgress.completed / bulkAddProgress.total) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-white shadow-lg rounded-lg">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800">Bulk Add Products</DialogTitle>
          <DialogDescription className="text-gray-600">
            Enter product names, one per line. We'll generate comprehensive details for each.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Enter product names (one per line)&#10;Example:&#10;Adobe Photoshop&#10;Microsoft Office&#10;Final Cut Pro"
            className="min-h-[200px] bg-gray-50 border-gray-200 focus:ring-blue-200 text-gray-800"
            value={value}
            onChange={onChange}
            disabled={bulkAddProgress.status !== 'idle'}
          />

          {bulkAddProgress.total > 0 && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {bulkAddProgress.completed} / {bulkAddProgress.total} products processed
              </div>

              {/* Product Status List */}
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 mt-2">
                {bulkAddProgress.products.map((product, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between py-1 border-b last:border-b-0"
                  >
                    <span className="text-sm">{product.name}</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(product.status)}
                      <span 
                        className={`text-xs ${
                          product.status === 'created' ? 'text-green-600' :
                          product.status === 'error' ? 'text-red-600' :
                          'text-gray-600'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="mr-2 text-gray-600 hover:bg-gray-100"
            disabled={bulkAddProgress.status !== 'idle' && bulkAddProgress.status !== 'completed'}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!value.trim() || bulkAddProgress.status !== 'idle'}
            className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
          >
            {bulkAddProgress.status === 'idle' ? 'Generate and Create Products' : 'Processing...'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
