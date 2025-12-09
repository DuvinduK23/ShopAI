import { StoreProduct, OrderData } from '../types';
import ORDERS_DB from '../data/orders.json';
import LOCAL_PRODUCTS from '../data/products.json';

const BASE_URL = 'https://fakestoreapi.com';

// Helper: Search local products (kids, young adults, fallback)
const searchLocalProducts = (keyword: string): StoreProduct[] => {
  if (!keyword) return LOCAL_PRODUCTS.slice(0, 5) as StoreProduct[];
  
  return (LOCAL_PRODUCTS as StoreProduct[]).filter((p) =>
    p.title.toLowerCase().includes(keyword.toLowerCase()) ||
    p.category.toLowerCase().includes(keyword.toLowerCase()) ||
    p.description.toLowerCase().includes(keyword.toLowerCase())
  ).slice(0, 5);
};

export const searchProducts = async (keyword: string): Promise<string> => {
  try {
    // 1. Check if searching for local-priority products (kids, jewelry, etc.)
    const localPriorityKeywords = [
      // Kids
      'kid', 'kids', 'child', 'children', 'youth', 'teen', 'teenager', 'young', 'boy', 'girl',
      // Jewelry
      'gold', 'silver', 'jewelry', 'jewellery', 'ring', 'necklace', 'bracelet', 'earring', 
      'pendant', 'chain', 'diamond', 'wedding band', 'engagement', 'hoop', 'stud', 'anklet',
      'brooch', 'charm'
    ];
    const isLocalPrioritySearch = localPriorityKeywords.some(k => keyword?.toLowerCase().includes(k));
    
    if (isLocalPrioritySearch) {
      const localMatches = searchLocalProducts(keyword);
      if (localMatches.length > 0) {
        return JSON.stringify(localMatches.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          description: p.description.substring(0, 100) + "...",
          image: p.image
        })));
      }
    }

    // 2. Fetch from FakeStoreAPI
    const response = await fetch(`${BASE_URL}/products`);
    if (!response.ok) throw new Error("API unavailable");

    const allProducts: StoreProduct[] = await response.json();

    if (!keyword) return JSON.stringify(allProducts.slice(0, 5));

    // 3. Client-side Search (Title or Category)
    const matches = allProducts
      .filter((p) => 
        p.title.toLowerCase().includes(keyword.toLowerCase()) || 
        p.category.toLowerCase().includes(keyword.toLowerCase())
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        description: p.description.substring(0, 100) + "...",
        image: p.image
      }));

    // 4. If no API matches, try local products as fallback
    if (matches.length === 0) {
      const localMatches = searchLocalProducts(keyword);
      if (localMatches.length > 0) {
        return JSON.stringify(localMatches.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          description: p.description.substring(0, 100) + "...",
          image: p.image
        })));
      }
    }

    return matches.length > 0 ? JSON.stringify(matches) : "[]";

  } catch (error) {
    console.error("API Error, using local fallback:", error);
    
    // Fallback to local products
    const localMatches = searchLocalProducts(keyword);
    if (localMatches.length > 0) {
      return JSON.stringify(localMatches.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        description: p.description.substring(0, 100) + "...",
        image: p.image
      })));
    }
    return "[]"; 
  }
};

export const getProductDetails = async (productId: number): Promise<string> => {
  try {
    // Check local products first (for IDs 101+)
    if (productId >= 101) {
      const localProduct = (LOCAL_PRODUCTS as StoreProduct[]).find(p => p.id === productId);
      if (localProduct) {
        return JSON.stringify({
          id: localProduct.id,
          title: localProduct.title,
          price: localProduct.price,
          description: localProduct.description,
          category: localProduct.category,
          image: localProduct.image,
          rating: `${localProduct.rating.rate}/5 (${localProduct.rating.count} reviews)`
        });
      }
    }

    // Fetch from API for standard products
    const response = await fetch(`${BASE_URL}/products/${productId}`);
    if (!response.ok) return JSON.stringify({ error: "Product not found" });
    
    const p: StoreProduct = await response.json();
    
    return JSON.stringify({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      image: p.image,
      rating: `${p.rating.rate}/5 (${p.rating.count} reviews)`
    });
  } catch (error) {
    // Fallback to local products
    const localProduct = (LOCAL_PRODUCTS as StoreProduct[]).find(p => p.id === productId);
    if (localProduct) {
      return JSON.stringify({
        id: localProduct.id,
        title: localProduct.title,
        price: localProduct.price,
        description: localProduct.description,
        category: localProduct.category,
        image: localProduct.image,
        rating: `${localProduct.rating.rate}/5 (${localProduct.rating.count} reviews)`
      });
    }
    return JSON.stringify({ error: "Failed to fetch details" });
  }
};

export const getCategories = async (): Promise<string> => {
  try {
    const response = await fetch(`${BASE_URL}/products/categories`);
    if (!response.ok) return "[]";
    const categories = await response.json();
    return JSON.stringify(categories);
  } catch (error) {
    return "[]";
  }
};

export const getStorePolicy = (topic: string): string => {
  const policies: Record<string, string> = {
    "return": "Returns accepted within 30 days. Items must be in original condition.",
    "shipping": "Standard shipping (3-5 days). Express available.",
    "support": "Email support@shopai.com"
  };
  const key = Object.keys(policies).find(k => topic.toLowerCase().includes(k));
  return key ? policies[key] : "I can help with return, shipping, or support policies.";
};

// --- AGENTIC TOOLS ---

// 1. SMART ROUTING TOOL
// The Agent decides WHICH department is needed based on the user's complaint.
export const getSupportInfo = (department: string): string => {
  const contacts: Record<string, string> = {
    "sales": "📞 Sales Team: 1-800-BUY-NOW (Mon-Fri 9am-5pm)",
    "technical": "🛠️ Tech Support: 1-800-FIX-IT (24/7 Hotline)",
    "returns": "📦 Returns Dept: returns@shopai.com",
    "general": "ℹ️ General Inquiries: 1-800-SHOP-AI"
  };
  
  return contacts[department.toLowerCase()] || contacts["general"];
};

// 2. ACTION TOOL (Agentic Behavior)
// The Agent "does" something with the user's phone number.
export const scheduleCallback = (customerName: string, phoneNumber: string, reason: string): string => {
  // In a real app, this would save to a database or CRM (Salesforce/HubSpot)
  console.log(`[CRM LOG] Callback Request: ${customerName} (${phoneNumber}) - Reason: ${reason}`);
  
  return `SUCCESS: Callback scheduled for ${customerName} at ${phoneNumber}. Ticket created for: "${reason}".`;
};

// --- 🚚 ORDER TOOL (Synthetic Data) ---

export const getOrderStatus = async (orderId: string, email: string): Promise<string> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // 1. Find Order
  const order = ORDERS_DB.find(o => o.orderId.toLowerCase() === orderId.toLowerCase());

  // 2. Handle Not Found
  if (!order) {
    return JSON.stringify({ 
      error: "Order ID not found.", 
      hint: "Valid IDs look like 'ORD-123'." 
    });
  }

  // 3. Security Check
  if (order.customerEmail.toLowerCase() !== email.toLowerCase()) {
    return JSON.stringify({ 
      error: "ACCESS DENIED: Email does not match order records." 
    });
  }

  return JSON.stringify(order);
};