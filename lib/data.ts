// ============================================
// SAMPLE DATA (akan diganti dengan API calls)
// ============================================

export const initialOrders = [
  {
    id: 1,
    cart_items: [
      {
        product_id: 1,
        quantity: 2,
      },
    ],
    total_price: 250000,
    customer_name: "John Doe",
    phone: "+62 812-3456-7890",
    address: "Jl. Contoh No. 123, Jakarta",
    payment_status: "paid",
    midtrans_order_id: "ORDER-001",
  },
  {
    id: 2,
    cart_items: [
      {
        product_id: 2,
        quantity: 1,
      },
    ],
    total_price: 85000,
    customer_name: "Jane Smith",
    phone: "+62 813-9876-5432",
    address: "Jl. Sample No. 456, Bandung",
    payment_status: "pending",
    midtrans_order_id: "ORDER-002",
  },
];

export const initialProducts = [
  {
    id: 1,
    name: "Premium Leather Notebook A5",
    description: "High-quality leather notebook perfect for professional use",
    stock: 25,
    price: 125000,
    image_url: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    name: "Gel Pen Set Premium 12 Colors",
    description: "Professional gel pen set with vibrant colors",
    stock: 15,
    price: 85000,
    image_url: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    name: "Sticky Notes Rainbow Pack",
    description: "Colorful sticky notes for organization and reminders",
    stock: 50,
    price: 35000,
    image_url: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    name: "Executive Planner 2024",
    description: "Professional planner for executive scheduling",
    stock: 8,
    price: 175000,
    image_url: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 5,
    name: "Mechanical Pencil Set",
    description: "High-quality mechanical pencils for precise writing",
    stock: 30,
    price: 60000,
    image_url: "/placeholder.svg?height=100&width=100",
  },
];

// Helper function to transform API data for display
export const transformOrderForDisplay = (order: any) => {
  return {
    id: `ORD-${String(order.id).padStart(3, "0")}`,
    customerName: order.customer_name,
    phoneNumber: order.phone,
    address: order.address,
    totalPrice: order.total_price,
    paymentStatus:
      order.payment_status === "paid"
        ? "Completed"
        : order.payment_status === "pending"
        ? "Pending"
        : "Failed",
    orderDate: new Date().toISOString().split("T")[0], // You might want to add created_at to API
    cartItems: order.cart_items,
  };
};

export const transformProductForDisplay = (product: any) => {
  return {
    id: `PRD-${String(product.id).padStart(3, "0")}`,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    status: product.stock > 10 ? "Active" : "Low Stock",
    image: product.image_url,
  };
};
