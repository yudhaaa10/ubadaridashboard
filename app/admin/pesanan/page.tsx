"use client";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Search, Filter, Loader2 } from "lucide-react";
import { ordersAPI, productsAPI } from "@/lib/api";
import { transformOrderForDisplay } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  cart_items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total_price: number;
  customer_name: string;
  phone: string;
  address: string;
  payment_status: string;
  midtrans_order_id: string;
}

interface OrderDisplay {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  totalPrice: number;
  paymentStatus: string;
  orderDate: string;
  cartItems: Array<{
    product_id: number;
    quantity: number;
  }>;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Load orders and products from API
  useEffect(() => {
    loadData(currentPage);
  }, [currentPage]);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const [ordersResponse, productsResponse] = await Promise.all([
        ordersAPI.getAll(localStorage.getItem("authToken") || "", page),
        productsAPI.getAll(),
      ]);

      console.log("Orders Response:", ordersResponse);
      console.log("Products Response:", productsResponse);

      const transformedOrders = ordersResponse.orders.map(
        transformOrderForDisplay
      );

      // Always replace orders for the current page (don't append)
      setOrders(transformedOrders);

      setProducts(productsResponse.data || productsResponse);
      setCurrentPage(ordersResponse.currentPage);
      setTotalPages(ordersResponse.totalPages);
      setTotalOrders(ordersResponse.totalOrders);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Load all orders at once
  const loadAllOrders = async () => {
    try {
      setLoading(true);
      const allOrders = [];
      let currentPage = 1;
      let totalPages = 1;

      // Load all pages
      do {
        const [ordersResponse, productsResponse] = await Promise.all([
          ordersAPI.getAll(
            localStorage.getItem("authToken") || "",
            currentPage
          ),
          currentPage === 1
            ? productsAPI.getAll()
            : Promise.resolve(
                products.length > 0 ? { data: products } : productsAPI.getAll()
              ),
        ]);

        const transformedOrders = ordersResponse.orders.map(
          transformOrderForDisplay
        );
        allOrders.push(...transformedOrders);

        if (currentPage === 1) {
          setProducts(productsResponse.data);
          totalPages = ordersResponse.totalPages;
          setTotalPages(totalPages);
          setTotalOrders(ordersResponse.totalOrders);
        }

        currentPage++;
      } while (currentPage <= totalPages);

      // Remove any potential duplicates based on ID
      const uniqueOrders = allOrders.filter(
        (order, index, self) =>
          index === self.findIndex((o) => o.id === order.id)
      );

      setOrders(uniqueOrders);
      setCurrentPage(totalPages); // Set to last page since we loaded everything
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOrders = async () => {
    if (currentPage < totalPages) {
      await loadData(currentPage + 1);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phoneNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      order.paymentStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Get product details for cart items
  const getProductDetails = (productId: number) => {
    return products.find((p) => p.id === productId);
  };

  // Calculate order details with product information
  const getOrderDetails = (order: OrderDisplay) => {
    const items = order.cartItems.map((item) => {
      const product = getProductDetails(item.product_id);
      return {
        ...item,
        product: product,
        subtotal: product ? product.price * item.quantity : 0,
      };
    });

    return {
      ...order,
      items,
      calculatedTotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <Badge variant="outline" className="text-sm">
          {filteredOrders.length} orders
        </Badge>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by customer, ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Manage and track all customer orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Phone Number
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Address
                  </TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const orderDetails = getOrderDetails(order);
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {order.phoneNumber}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                        {order.address}
                      </TableCell>
                      <TableCell>{order.cartItems.length} items</TableCell>
                      <TableCell>
                        Rp {order.totalPrice.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.paymentStatus === "Completed"
                              ? "default"
                              : order.paymentStatus === "Pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            order.paymentStatus === "Completed"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : order.paymentStatus === "Pending"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order Details</DialogTitle>
                              <DialogDescription>
                                Complete information for order {order.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">
                                  Order ID:
                                </Label>
                                <div className="col-span-3">{order.id}</div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">
                                  Customer:
                                </Label>
                                <div className="col-span-3">
                                  {order.customerName}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">
                                  Phone:
                                </Label>
                                <div className="col-span-3">
                                  {order.phoneNumber}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right font-medium mt-1">
                                  Address:
                                </Label>
                                <div className="col-span-3">
                                  {order.address}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right font-medium mt-1">
                                  Items:
                                </Label>
                                <div className="col-span-3 space-y-2">
                                  {orderDetails.items.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {item.product?.name ||
                                            `Product ID: ${item.product_id}`}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity: {item.quantity}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">
                                          Rp{" "}
                                          {item.subtotal.toLocaleString(
                                            "id-ID"
                                          )}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          @Rp{" "}
                                          {item.product?.price.toLocaleString(
                                            "id-ID"
                                          ) || 0}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">
                                  Total:
                                </Label>
                                <div className="col-span-3 font-semibold text-lg">
                                  Rp {order.totalPrice.toLocaleString("id-ID")}
                                </div>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-medium">
                                  Status:
                                </Label>
                                <div className="col-span-3">
                                  <Badge
                                    variant={
                                      order.paymentStatus === "Completed"
                                        ? "default"
                                        : order.paymentStatus === "Pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className={
                                      order.paymentStatus === "Completed"
                                        ? "bg-green-100 text-green-800"
                                        : order.paymentStatus === "Pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {order.paymentStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, totalOrders)} of {totalOrders}{" "}
                orders
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
    </div>
  );
}
