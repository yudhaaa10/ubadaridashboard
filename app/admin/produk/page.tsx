"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { productsAPI } from "@/lib/api";
import { transformProductForDisplay } from "@/lib/data";
import { ImageUpload } from "@/components/admin/image-upload";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

interface ProductDisplay {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  image: string;
}

// Helper functions for numeric input validation
const handleNumericInput = (value: string, allowDecimals = false) => {
  // Remove any non-numeric characters except decimal point if allowed
  let cleanValue = value.replace(/[^\d.]/g, "");

  if (!allowDecimals) {
    cleanValue = cleanValue.replace(/\./g, "");
  } else {
    // Allow only one decimal point
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }
  }

  return cleanValue;
};

export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDisplay | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<File | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsPerPage] = useState(10); // Display 10 products per page

  // Add this after the state declarations
  let allProductsCache: Product[] | null = null;

  // Load products from API
  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll(page, productsPerPage);

      const transformedProducts = response.data.map(transformProductForDisplay);
      setProducts(transformedProducts);

      // Set pagination info from API response
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      setTotalProducts(response.totalProducts);
    } catch (error: any) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    // For now, we'll use a simple category filter based on product name
    // You might want to add a category field to your API
    const matchesCategory =
      categoryFilter === "all" ||
      product.name.toLowerCase().includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const addProduct = async () => {
    console.log("Adding product:", newProduct);

    // Validate required fields
    if (
      !newProduct.name ||
      !newProduct.description ||
      !newProduct.price ||
      !newProduct.stock ||
      !selectedImage
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select an image.",
        variant: "destructive",
      });
      return;
    }

    // Validate numeric fields
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);

    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(stock) || stock < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid stock quantity (0 or greater).",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: price,
        stock: stock,
        image: selectedImage,
      };

      const response = await productsAPI.create(productData);

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      // In addProduct function, after successful creation:
      allProductsCache = null; // Clear cache to force reload
      await loadProducts(1);
      setCurrentPage(1);

      // Reset form
      setNewProduct({ name: "", description: "", price: "", stock: "" });
      setSelectedImage(null);
      setIsAddingProduct(false);
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    // Validate numeric fields
    if (isNaN(editingProduct.price) || editingProduct.price <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(editingProduct.stock) || editingProduct.stock < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid stock quantity (0 or greater).",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const productId = editingProduct.id.replace("PRD-", "");

      const productData = {
        name: editingProduct.name.trim(),
        description: editingProduct.description.trim(),
        price: editingProduct.price,
        stock: editingProduct.stock,
        ...(editingImage && { image: editingImage }),
      };

      await productsAPI.update(productId, productData);

      toast({
        title: "Success",
        description: "Product updated successfully!",
      });

      // In updateProduct function, after successful update:
      allProductsCache = null; // Clear cache to force reload
      await loadProducts(currentPage);

      setEditingProduct(null);
      setEditingImage(null);
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const id = productId.replace("PRD-", "");
      await productsAPI.delete(id);

      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });

      // In deleteProduct function, after successful deletion:
      allProductsCache = null; // Clear cache to force reload
      await loadProducts(1);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = handleNumericInput(e.target.value, true); // Allow decimals for price
    setNewProduct({ ...newProduct, price: value });
  };

  const handleStockInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = handleNumericInput(e.target.value, false); // No decimals for stock
    setNewProduct({ ...newProduct, stock: value });
  };

  const handleEditPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const value = handleNumericInput(e.target.value, true);
    setEditingProduct({ ...editingProduct, price: Number(value) || 0 });
  };

  const handleEditStockInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const value = handleNumericInput(e.target.value, false);
    setEditingProduct({ ...editingProduct, stock: Number(value) || 0 });
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products Management</h1>
        <Button
          onClick={() => setIsAddingProduct(true)}
          className="hover:shadow-md transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, ID, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="notebook">Notebooks</SelectItem>
                <SelectItem value="pen">Pens</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
                <SelectItem value="planner">Planners</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>All Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Manage your product inventory and pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {product.image ? (
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {product.description}
                    </TableCell>
                    <TableCell>
                      Rp {product.price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          product.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * productsPerPage + 1} to{" "}
                {Math.min(currentPage * productsPerPage, totalProducts)} of{" "}
                {totalProducts} products
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        disabled={loading}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the details for the new product including an image.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Product Image *</Label>
              <div className="col-span-3">
                <ImageUpload onImageSelect={setSelectedImage} currentImage="" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter product name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                Description *
              </Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price *
              </Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                value={newProduct.price}
                onChange={handlePriceInput}
                onKeyPress={(e) => {
                  // Allow only numbers, decimal point, and control keys
                  if (
                    !/[\d.]/.test(e.key) &&
                    !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                className="col-span-3"
                placeholder="Enter price (e.g., 25000)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock *
              </Label>
              <Input
                id="stock"
                type="text"
                inputMode="numeric"
                value={newProduct.stock}
                onChange={handleStockInput}
                onKeyPress={(e) => {
                  // Allow only numbers and control keys
                  if (
                    !/\d/.test(e.key) &&
                    !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                className="col-span-3"
                placeholder="Enter stock quantity (e.g., 50)"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingProduct(false);
                setSelectedImage(null);
                setNewProduct({
                  name: "",
                  description: "",
                  price: "",
                  stock: "",
                });
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={addProduct} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={() => {
          setEditingProduct(null);
          setEditingImage(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details and image.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">Product Image</Label>
                <div className="col-span-3">
                  <ImageUpload
                    onImageSelect={setEditingImage}
                    currentImage={editingProduct.image}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right mt-2">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price
                </Label>
                <Input
                  id="edit-price"
                  type="text"
                  inputMode="decimal"
                  value={editingProduct.price}
                  onChange={handleEditPriceInput}
                  onKeyPress={(e) => {
                    if (
                      !/[\d.]/.test(e.key) &&
                      !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="edit-stock"
                  type="text"
                  inputMode="numeric"
                  value={editingProduct.stock}
                  onChange={handleEditStockInput}
                  onKeyPress={(e) => {
                    if (
                      !/\d/.test(e.key) &&
                      !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingProduct(null);
                setEditingImage(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={updateProduct} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  