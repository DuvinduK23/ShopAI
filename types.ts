export enum Sender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  isError?: boolean;
}

// 1. Data Structure for FakeStoreAPI Products
export interface StoreProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

// 2. Data Structure for Synthetic Orders
export interface OrderData {
  orderId: string;
  customerEmail: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Delayed';
  items: string[];
  total: number;
  deliveryDate: string;
  carrier: string;
  trackingURL?: string;
  notes?: string;
}

// 3. Registered Tool Names
export enum ToolNames {
  SEARCH_PRODUCTS = 'search_products',
  GET_PRODUCT_DETAILS = 'get_product_details',
  GET_STORE_POLICY = 'get_store_policy',
  GET_CATEGORIES = 'get_categories',
  GET_ORDER_STATUS = 'get_order_status',
  // --- AGENTIC TOOLS ---
  GET_SUPPORT_INFO = 'get_support_info',
  SCHEDULE_CALLBACK = 'schedule_callback'
}