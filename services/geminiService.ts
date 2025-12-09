import { GoogleGenAI, Type, FunctionDeclaration, Tool, Chat } from "@google/genai";
import { searchProducts, getProductDetails, getStorePolicy, getCategories, getSupportInfo, scheduleCallback, getOrderStatus } from './platziService';
import { ToolNames } from '../types';

// --- Tool Definitions ---

const searchProductsTool: FunctionDeclaration = {
  name: ToolNames.SEARCH_PRODUCTS,
  description: "Searches the catalog. Can search for specific items ('jacket') or categories ('electronics').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      keyword: { type: Type.STRING, description: "Product name or category" },
    },
    required: ["keyword"],
  },
};

const getProductDetailsTool: FunctionDeclaration = {
  name: ToolNames.GET_PRODUCT_DETAILS,
  description: "Get full details, rating, and description for a specific product ID.",
  parameters: {
    type: Type.OBJECT,
    properties: { product_id: { type: Type.INTEGER, description: "Product ID" } },
    required: ["product_id"],
  },
};

const getStorePolicyTool: FunctionDeclaration = {
  name: ToolNames.GET_STORE_POLICY,
  description: "Get return, shipping, or support policies.",
  parameters: {
    type: Type.OBJECT,
    properties: { topic: { type: Type.STRING, description: "Policy topic" } },
    required: ["topic"],
  },
};

const getCategoriesTool: FunctionDeclaration = {
  name: ToolNames.GET_CATEGORIES,
  description: "List the 4 main product categories available.",
  parameters: { type: Type.OBJECT, properties: {} }
};

// --- AGENTIC TOOL DEFINITIONS ---

const getSupportInfoTool: FunctionDeclaration = {
  name: ToolNames.GET_SUPPORT_INFO,
  description: "Get contact details for a specific department (sales, technical, returns, or general).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: { type: Type.STRING, description: "Department needed (e.g. 'sales' for buying, 'technical' for broken items)" }
    },
    required: ["department"]
  }
};

const scheduleCallbackTool: FunctionDeclaration = {
  name: ToolNames.SCHEDULE_CALLBACK,
  description: "Schedule a phone call for the customer. Use this when a user asks for a callback or wants someone to call them.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: "Customer's name" },
      phoneNumber: { type: Type.STRING, description: "Phone number provided by user" },
      reason: { type: Type.STRING, description: "Reason for the call" }
    },
    required: ["customerName", "phoneNumber", "reason"]
  }
};

// 🆕 ORDER STATUS TOOL
const getOrderStatusTool: FunctionDeclaration = {
  name: ToolNames.GET_ORDER_STATUS,
  description: "Check order status. Requires Order ID and customer email for verification.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: { type: Type.STRING, description: "Order ID (e.g. ORD-123)" },
      email: { type: Type.STRING, description: "Customer email for verification" }
    },
    required: ["orderId", "email"]
  }
};

const tools: Tool[] = [{
  functionDeclarations: [
    searchProductsTool, getProductDetailsTool, getStorePolicyTool, getCategoriesTool,
    getSupportInfoTool, scheduleCallbackTool, getOrderStatusTool
  ]
}];

const SYSTEM_INSTRUCTION = `
### 🧠 IDENTITY & PERSONA
You are **'ShopAI'**, a premium boutique assistant for an exclusive electronics and fashion store. 
Your tone is **professional, warm, and solution-oriented**.
- **When Selling:** Be enthusiastic, visual, and persuasive. Use emojis sparingly but effectively (🛍️, 💻, ✨).
- **When Supporting:** Be empathetic, efficient, and reassuring. Never sound robotic if the user is frustrated.

---

### 🛠️ TOOL UTILIZATION STRATEGY

#### 1. PRODUCT DISCOVERY (Sales Mode)
- **Trigger:** User asks about buying, browsing, or finding items.
- **Action:** Use \`search_products\`.
- **Constraint:** If the result is \`[]\`, **do not** say "No results". Instead, Pivot: "I couldn't find 'red gaming laptops', but I have some excellent 'high-performance laptops' in our Pro series. Shall I show you those?"
- **Visuals:** ALWAYS render images for every product found using Markdown: \`![Title](image_url)\`.

#### 2. ORDER TRACKING (Support Mode)
- **Trigger:** "Where is my order?" or "Track ORD-123".
- **Verification Rule:** You MUST have both **Order ID** AND **Email** before calling \`get_order_status\`.
- **Slot Filling:**
  - If user only gives ID -> Ask: "For security, what is the email linked to this order?"
  - If user gives nothing -> Ask for both.
- **Handling Status:**
  - **Delayed:** Be empathetic and apologize.
  - **Access Denied:** Politely inform them the email didn't match.

#### 3. SMART SUPPORT ROUTING (Triage Mode)
- **Trigger:** User asks for contact info, help lines, or has a specific post-purchase issue.
- **Logic:** Analyze the specific nature of the request to route correctly:
  - *Buying / Pre-sales questions?* -> call \`get_support_info(department="sales")\`
  - *Broken item / Glitch / Setup?* -> call \`get_support_info(department="technical")\`
  - *Refund / Exchange / Shipping?* -> call \`get_support_info(department="returns")\`
  - *General / Unknown?* -> call \`get_support_info(department="general")\`

#### 4. ESCALATION & ACTION TAKING (Agentic Mode)
- **Trigger:** User expresses anger ("this sucks"), demands a human ("I want a person"), or explicitly asks for a call ("call me").
- **Protocol (Slot Filling):**
  1. **Acknowledge & De-escalate:** "I completely understand your frustration, and I want to get this resolved for you immediately."
  2. **Check Context:** Do you already know their **Name** and **Phone Number** from previous messages?
  3. **Gather Missing Info:** If missing, ask politely: "To have a senior agent call you back, could you please provide your Name and Phone Number?"
  4. **Execute:** Once you have the info, call \`schedule_callback(customerName, phoneNumber, reason)\`.
  5. **Confirm:** "Done! I've scheduled a callback for [Name] at [Number]. A specialist will contact you shortly."

---

### 🛡️ OPERATIONAL GUARDRAILS
1. **Honesty:** You have a live inventory of ~20 items. Do not hallucinate products that don't exist in the tool output.
2. **Safety:** If a user asks non-shopping questions (politics, medical), politely pivot back to the store: "I'm best at helping you find great gear. Let's get back to your shopping list!"
3. **Images:** If an image URL in the tool response looks broken or empty, do not render the broken image tag.

### 📝 FORMATTING RULES
- Use **Bold** for prices and key specs.
- Use > Blockquotes for support contact details to make them stand out.
- Keep responses concise (max 3-4 sentences unless listing products).
`;

// --- Service Logic ---

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// LAYER: GUARDRAILS
const runGuardrails = (text: string): { passed: boolean; message?: string } => {
  const forbiddenTopics = ['politics', 'religion', 'medical advice'];
  const hasForbiddenTopic = forbiddenTopics.some(topic => text.toLowerCase().includes(topic));
  
  if (hasForbiddenTopic) {
    return { passed: false, message: "I can only assist with shopping-related queries." };
  }
  return { passed: true };
};

// LAYER: HOOKS
const logHook = (stage: 'INPUT' | 'TOOL_CALL' | 'OUTPUT', details: any) => {
  console.log(`[${new Date().toISOString()}] [${stage}]:`, details);
  // In a real app, this would send data to an observability platform
};

export const initializeChat = () => {
  const apiKey = process.env.API_KEY;
  console.log("Initializing chat with API key:", apiKey ? `${apiKey.substring(0, 10)}...` : "MISSING");
  
  if (!apiKey) {
    throw new Error("API Key is missing from environment variables.");
  }

  genAI = new GoogleGenAI({ apiKey });
  
  chatSession = genAI.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: tools,
    },
  });
};

export const sendMessageToGemini = async (userMessage: string): Promise<string> => {
  // 1. LAYER: HOOKS - Log Input
  logHook('INPUT', userMessage);

  // 2. LAYER: GUARDRAILS - Filter Input
  const guardrailCheck = runGuardrails(userMessage);
  if (!guardrailCheck.passed) {
    const blockMessage = guardrailCheck.message || "Request blocked by guardrails.";
    logHook('OUTPUT', blockMessage); 
    return blockMessage;
  }

  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session.");
  }

  try {
    console.log("Sending message to Gemini...", { 
      hasSession: !!chatSession, 
      messageLength: userMessage.length 
    });
    
    // 3. Send initial message
    let response = await chatSession.sendMessage({
      message: userMessage
    });
    
    console.log("Gemini response received:", response);

    // 4. Loop to handle potential function calls
    let functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);

    while (functionCalls && functionCalls.length > 0) {
      const functionResponses = [];

      for (const call of functionCalls) {
        if (!call || !call.name) continue;

        // LAYER: HOOKS - Log Tool Call
        logHook('TOOL_CALL', call.name);

        let result = "";
        
        // Execute the appropriate tool
        switch (call.name) {
          case ToolNames.SEARCH_PRODUCTS:
            result = await searchProducts(
              call.args?.keyword as string
            );
            break;
          case ToolNames.GET_PRODUCT_DETAILS:
            result = await getProductDetails(call.args?.product_id as number);
            break;
          case ToolNames.GET_STORE_POLICY:
            result = getStorePolicy(call.args?.topic as string);
            break;
          case ToolNames.GET_CATEGORIES:
            result = await getCategories();
            break;
          case ToolNames.GET_SUPPORT_INFO:
            result = getSupportInfo(call.args?.department as string);
            break;
          case ToolNames.SCHEDULE_CALLBACK:
            result = scheduleCallback(
              call.args?.customerName as string,
              call.args?.phoneNumber as string,
              call.args?.reason as string
            );
            break;
          case ToolNames.GET_ORDER_STATUS:
            result = await getOrderStatus(
              call.args?.orderId as string,
              call.args?.email as string
            );
            break;
          default:
            result = "Error: Unknown function called.";
        }

        // Prepare the response part
        functionResponses.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: { result: result }
            }
        });
      }

      // Send the tool outputs back to the model
      response = await chatSession.sendMessage({
        message: functionResponses
      });

      // Check if the model needs to call MORE tools (multi-step reasoning)
      functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);
    }

    // 5. Return final text
    const finalResponse = response.text || "I'm sorry, I couldn't generate a response.";
    
    // LAYER: HOOKS - Log Output
    logHook('OUTPUT', finalResponse);
    
    return finalResponse;

  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    throw new Error("I encountered an error while talking to the store database./ Gemini API quota exceeded.");
  }
};