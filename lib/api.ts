// ============================================
// API CONFIGURATION - TEMPAT UNTUK ENDPOINT ANDA
// ============================================

import { getToken } from "@/app/actions/action";
import { get } from "http";

// Base URL untuk API backend Anda
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // Ganti dengan URL backend Anda

// Helper function untuk handle fetch requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();

  console.log("Using token:", token);
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth header if token exists
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // Merge headers, allowing options to override defaults
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);

    // Handle l-JSON responses (like for delete operations)
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data: data,
        },
        message:
          data?.error ||
          data?.message ||
          `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    // Re-throw with consistent error format
    if (error.response) {
      throw error;
    } else {
      throw {
        message: error.message || "Network error occurred",
        response: null,
      };
    }
  }
};

// API Functions - Tempat untuk memanggil endpoint backend Anda
export const authAPI = {
  // Login endpoint - Ganti dengan endpoint login Anda
  login: async (email: string, password: string) => {
    try {
      const data = await fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Verify token endpoint (opsional)
  verifyToken: async () => {
    try {
      const data = await fetchWithAuth("/auth/verify", {
        method: "GET",
      });
      return data;
    } catch (error) {
      throw error;
    }
  },
};

// Products API Functions
export const productsAPI = {
  // Get all products with pagination
  getAll: async (page = 1, limit = 10) => {
    try {
      const data = await fetch(
        `${API_BASE_URL}/products/?page=${page}&limit=${limit}`,
        {
          method: "GET",
        }
      );

      return await data.json();
    } catch (error) {
      throw error;
    }
  },

  // Get product by ID
  getById: async (id: string) => {
    try {
      const data = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "GET",
      });
      return await data.json();
    } catch (error) {
      throw error;
    }
  },

  // Create new product
  create: async (productData: {
    name: string;
    description: string;
    stock: number;
    price: number;
    image: File;
  }) => {
    try {
      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("description", productData.description);
      formData.append("stock", productData.stock.toString());
      formData.append("price", productData.price.toString());
      formData.append("image", productData.image);

      // For FormData, we need to remove Content-Type header to let browser set it
      const token = await getToken();
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: "POST",
        headers,
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: data,
          },
          message:
            data?.error ||
            data?.message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Update product
  update: async (
    id: string,
    productData: {
      name: string;
      description: string;
      stock: number;
      price: number;
      image?: File;
    }
  ) => {
    try {
      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("description", productData.description);
      formData.append("stock", productData.stock.toString());
      formData.append("price", productData.price.toString());

      if (productData.image) {
        formData.append("image", productData.image);
      }

      // For FormData, we need to remove Content-Type header to let browser set it
      const token = await getToken();
      const headers: HeadersInit = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers,
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: data,
          },
          message:
            data?.error ||
            data?.message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Delete product
  delete: async (id: string) => {
    try {
      const data = await fetchWithAuth(`/products/${id}`, {
        method: "DELETE",
      });
      return data;
    } catch (error) {
      throw error;
    }
  },
};

// Orders API Functions
export const ordersAPI = {
  // Get all orders
  getAll: async (access_token?: string, page = 1) => {
    try {
      // Use provided token or get from localStorage
      const token = access_token || (await getToken());

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add page parameter to the URL
      const response = await fetch(`${API_BASE_URL}/orders/?page=${page}`, {
        method: "GET",
        headers,
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw {
          response: {
            status: response.status,
            data: data,
          },
          message:
            data?.error ||
            data?.message ||
            `HTTP error! status: ${response.status}`,
        };
      }

      // Parse cart_items if orders exist
      if (Array.isArray(data.orders) && data.orders.length > 0) {
        data.orders.forEach((order: any, index: number) => {
          try {
            // Only parse if cart_items is a string
            if (typeof order.cart_items === "string") {
              order.cart_items = JSON.parse(order.cart_items);
            }
          } catch (error) {
            console.error(
              `Failed to parse cart_items for order[${index}]:`,
              error
            );
            // Set to empty array if parsing fails
            order.cart_items = [];
          }
        });
      } else {
        console.warn("No orders data found.");
      }

      // Return data as usual
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get order by ID
  getById: async (id: string) => {
    try {
      const data = await fetchWithAuth(`/orders/${id}`, {
        method: "GET",
      });
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Create new order
  create: async (orderData: {
    cart_items: Array<{
      product_id: number;
      quantity: number;
    }>;
    customer_name: string;
    phone: string;
    address: string;
    payment_status: string;
  }) => {
    try {
      const data = await fetch(`${API_BASE_URL}/orders/`, {
        method: "POST",
        body: JSON.stringify(orderData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return data.json();
    } catch (error) {
      throw error;
    }
  },
};
