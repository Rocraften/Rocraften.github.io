// --- Configuration ---
const CONFIG = {
    MODEL_LOAD_TIMEOUT: 30000, // Max time to wait for model load (ms)
    FETCH_TIMEOUT: 5000,       // Max time for fetch requests (ms)
    SIMILARITY_THRESHOLD: 0.65, // Confidence threshold for intent matching (0-1)
    MAX_HISTORY: 10,           // Max conversation turns (user + bot) to keep
    BOT_TYPING_DELAY_MIN: 300, // Min simulated typing delay (ms)
    BOT_TYPING_DELAY_MAX: 900, // Max simulated typing delay (ms)
    VOCAB_FILE: 'words.json'   // Vocabulary file name
};

// --- DOM Elements ---
const chatContainer = document.querySelector('.chat-container');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');
const loadingElement = document.getElementById('loading');

// --- State Variables ---
let model = null; // Holds the loaded USE model
let vocabulary = []; // Holds words from words.json
let isProcessing = false; // Prevents concurrent message processing
let conversationHistory = []; // Stores recent messages { role: 'user'|'assistant', content: string }

// --- Intents & Responses Definition ---
const intents = {
    greeting: {
        examples: ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "what's up"],
        response: "Hello there! 👋 Ready to chat about something interesting?"
    },
    wellBeing: {
        examples: ["how are you", "how's it going", "are you okay", "how do you feel", "status"],
        response: "As an AI, I don't have feelings, but I'm running smoothly and ready to assist! How about you?"
    },
    gratitude: {
        examples: ["thanks", "thank you", "appreciate it", "that was helpful", "great", "awesome"],
        response: "You're very welcome! 😊 Glad I could help. Anything else I can do?"
    },
    farewell: {
        examples: ["bye", "goodbye", "see you later", "talk later", "signing off", "quit", "exit"],
        response: "Goodbye for now! 👋 Feel free to return anytime."
    },
    identity: {
        examples: ["who are you", "what are you", "tell me about yourself", "your purpose", "what is your name"],
        response: "I'm a browser-based AI assistant using TensorFlow.js and the Universal Sentence Encoder to understand and respond to your messages. My goal is to be helpful!"
    },
    capabilities: {
        examples: ["what can you do", "what are your features", "how can you help", "are you smart", "are you intelligent", "abilities"],
        response: "I can understand language semantically, answer questions, provide basic code examples, and chat on various topics. Try asking me something specific!"
    },
    codeRequest: {
        examples: ["show me code", "coding example", "javascript snippet", "python function", "write a program", "how to code", "need code for"],
        response: "I can provide simple code snippets! What kind of code are you looking for? (e.g., 'JavaScript hello world', 'Python loop')"
    },
    apology: {
        examples: ["sorry", "my mistake", "my bad", "apologies"],
        response: "No problem at all!"
    },
    confirmation: {
        examples: ["yes", "yeah", "ok", "sure", "sounds good", "affirmative"],
        response: "Okay, great!"
    },
    negation: {
        examples: ["no", "nope", "not really", "negative"],
        response: "Alright."
    }
    // Add more intents (e.g., asking for time, weather - though these need external APIs)
};

// --- Predefined Code Examples ---
const codeExamples = {
    helloWorldJS: "JavaScript 'Hello World':\n\n```javascript\nconsole.log('Hello, World!');\n```",
    helloWorldPy: "Python 'Hello World':\n\n```python\nprint('Hello, World!')\n```",
    functionJS: "Basic JavaScript Function:\n\n```javascript\nfunction add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(5, 3)); // Output: 8\n```",
    loopPy: "Basic Python For Loop:\n\n```python\nitems = ['apple', 'banana', 'cherry']\nfor item in items:\n  print(item)\n```",
    classJS: "Simple JavaScript Class:\n\n```javascript\nclass Greeter {\n  constructor(name) {\n    this.name = name;\n  }\n\n  greet() {\n    console.log(`Hello, ${this.name}!`);\n  }\n}\n\nconst greeter = new Greeter('User');\ngreeter.greet();\n```"
};

// --- Utility Functions ---

/**
 * Fetches a resource with a timeout.
 * @param {string} resource URL to fetch
 * @param {object} options Fetch options
 * @param {number} timeout Timeout duration in ms
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(resource, options = {}, timeout = CONFIG.FETCH_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`Workspace timed out after ${timeout}ms`);
        }
        throw error;
    }
}

/** Formats the current time as HH:MM AM/PM */
function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Simulates a delay */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- UI Update Functions ---

/**
 * Adds a message bubble to the chat interface.
 * @param {string} text The message content.
 * @param {'user'|'assistant'} role The role of the sender.
 */
function addMessageToUI(text, role) {
    const isUser = role === 'user';

    // Create main message container
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    // Create content bubble
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // Handle potential code blocks (only for assistant)
    if (!isUser && text.includes('```')) {
        const parts = text.split(/```(\w*)\n?/); // Split by ```lang\n or ```\n
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) { // Regular text part
                if (parts[i].trim()) {
                    messageContent.appendChild(document.createTextNode(parts[i]));
                }
            } else { // Code block part
                const language = parts[i].trim().toLowerCase() || 'plaintext';
                const codeContent = parts[i + 1]?.trim() || '';
                i++; // Skip the code content part

                if (codeContent) {
                    const pre = document.createElement('pre');
                    const code = document.createElement('code');
                    code.className = `language-${language}`; // For potential syntax highlighters
                    code.textContent = codeContent;
                    pre.appendChild(code);

                    const langLabel = document.createElement('div');
                    langLabel.className = 'code-language-label';
                    langLabel.textContent = language;
                    pre.insertBefore(langLabel, code); // Add label before code

                    messageContent.appendChild(pre);
                }
            }
        }
    } else { // Simple text message
        messageContent.textContent = text;
    }

    // Create timestamp
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = getCurrentTimestamp();

    // Append bubble and timestamp based on role
    if (isUser) {
        messageWrapper.appendChild(timestampSpan); // Timestamp first for user
        messageWrapper.appendChild(messageContent);
    } else {
        messageWrapper.appendChild(messageContent); // Bubble first for bot
        messageWrapper.appendChild(timestampSpan);
    }


    // Add to chat log (before typing indicator)
    chatMessages.insertBefore(messageWrapper, typingIndicator);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Update conversation history
    conversationHistory.push({ role, content: text });
    if (conversationHistory.length > CONFIG.MAX_HISTORY * 2) { // Trim history (keep slightly more than max turns)
        conversationHistory = conversationHistory.slice(-CONFIG.MAX_HISTORY * 2);
    }
}

function showTypingIndicatorUI() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicatorUI() {
    typingIndicator.style.display = 'none';
}

function setUIEnabled(enabled) {
    messageInput.disabled = !enabled;
    sendButton.disabled = !enabled;
    if (enabled) {
        messageInput.focus();
    }
}

function showFatalError(message) {
    loadingElement.textContent = `FATAL ERROR: ${message}. Please refresh.`;
    loadingElement.style.display = 'block';
    chatContainer.style.display = 'none';
     console.error("Fatal Error:", message);
}

// --- Core AI Logic (USE) ---

/**
 * Calculates cosine similarity between two USE embeddings.
 * @param {tf.Tensor} vecA Embedding vector A.
 * @param {tf.Tensor} vecB Embedding vector B.
 * @returns {number} Cosine similarity score (-1 to 1).
 */
function calculateCosineSimilarity(vecA, vecB) {
    try {
      // Ensure vecA and vecB are tensors with shape [512]
      vecA = tf.tensor1d(vecA);
      vecB = tf.tensor1d(vecB);
  
      const dotProduct = vecA.dot(vecB);
      const magnitudeA = vecA.norm();
      const magnitudeB = vecB.norm();
      const similarity = dotProduct.div(magnitudeA.mul(magnitudeB));
      return similarity.dataSync()[0];
    } catch (error) {
      console.error("Error calculating similarity:", error);
      return 0;
    }
 }

/**
 * Determines the most likely intent using USE embeddings.
 * @param {string} query User's input message.
 * @returns {Promise<string|null>} The name of the matched intent or null.
 */
async function getIntentWithUSE(query) {
    if (!model) {
      console.error("USE model not loaded!");
      return null;
    }
  
    let bestIntent = null;
    let highestSimilarity = -1;
  
    try {
      const queryEmbedding = await model.embed([query]);
      // Ensure queryEmbedding is a tensor with shape [1, 512]
      if (queryEmbedding.shape[1] !== 512) {
        console.error("queryEmbedding has incorrect shape.");
        return null;
      }
  
      // Process similarities
      for (const intentName in intents) {
        const examplesTensor = await model.embed(intents[intentName].examples);
        for (let i = 0; i < intents[intentName].examples.length; i++) {
          const similarity = tf.tidy(() => {
            const exampleVec = examplesTensor.slice([i, 0], [1]);
            return calculateCosineSimilarity(queryEmbedding.squeeze(), exampleVec.squeeze());
          });
  
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestIntent = intentName;
          }
        }
      }
  
      // Dispose queryEmbedding if it's a tensor
      if (queryEmbedding.dispose) {
        queryEmbedding.dispose();
      }
  
      console.log(`Intent Match: ${bestIntent} (Similarity: ${highestSimilarity.toFixed(3)})`);
  
      if (highestSimilarity >= CONFIG.SIMILARITY_THRESHOLD) {
        return bestIntent;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting intent:", error);
      return null;
    }
  }

/**
 * Generates an appropriate response based on the user query.
 * @param {string} query User's input message.
 * @returns {Promise<string>} The assistant's response message.
 */
async function generateAssistantResponse(query) {
    const queryLower = query.toLowerCase();

    // --- Priority 1: Specific Keyword Triggers (e.g., for code examples) ---
    if (queryLower.includes("hello world")) {
        if (queryLower.includes("javascript") || queryLower.includes("js")) return codeExamples.helloWorldJS;
        if (queryLower.includes("python") || queryLower.includes("py")) return codeExamples.helloWorldPy;
        return codeExamples.helloWorldJS; // Default JS
    }
    if (queryLower.includes("function") || queryLower.includes("method")) {
        if (queryLower.includes("javascript") || queryLower.includes("js")) return codeExamples.functionJS;
        return "Which language for the function example?"; // Ask for clarification
    }
    if (queryLower.includes("loop") || queryLower.includes("iteration")) {
        if (queryLower.includes("python") || queryLower.includes("py")) return codeExamples.loopPy;
        return "Which language for the loop example?";
    }
    if (queryLower.includes("class") || queryLower.includes("object")) {
        if (queryLower.includes("javascript") || queryLower.includes("js")) return codeExamples.classJS;
        return "Which language for the class example?";
    }

    // --- Priority 2: Semantic Intent Matching using USE ---
    const intent = await getIntentWithUSE(query);
    if (intent && intents[intent]) {
        // Handle codeRequest intent specifically if no keyword matched above
        if (intent === 'codeRequest') {
            return intents.codeRequest.response; // Use the general code request response
        }
        return intents[intent].response; // Return the standard response for the matched intent
    }

    // --- Priority 3: Fallback Responses ---
    console.log("No confident intent matched. Using fallback.");
    // Simple check if query resembles a question
    const isQuestion = query.includes("?") || /^(what|who|where|when|why|how)\b/i.test(queryLower);

    const fallbackResponses = isQuestion
        ? [
            "That's a good question! Unfortunately, I don't have the answer to that right now.",
            "Hmm, I'm not sure about that one. Could you try asking in a different way?",
            "I'm still learning and don't have information on that specific question.",
            "Interesting query! I can't answer that directly, but maybe we can talk about something else?"
          ]
        : [
            "Thanks for sharing. Could you elaborate a bit more?",
            "I understand. What else is on your mind?",
            "Okay, noted. Anything else I can help with?",
            "Interesting. Tell me more!",
            `I'm processing that. You can also ask me about topics like ${vocabulary.length > 3 ? vocabulary.slice(0,3).join(', ') : 'coding or technology'}.` // Use loaded vocab if available
          ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}


// --- Event Handlers ---

/** Handles sending a message from the user input */
async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (userMessage === '' || isProcessing || !model) {
        return; // Ignore empty messages, concurrent processing, or if model isn't ready
    }

    isProcessing = true;
    setUIEnabled(false); // Disable input during processing
    addMessageToUI(userMessage, 'user');
    messageInput.value = ''; // Clear input field
    showTypingIndicatorUI();

    try {
        // Simulate thinking time
        const thinkTime = CONFIG.BOT_TYPING_DELAY_MIN + Math.random() * (CONFIG.BOT_TYPING_DELAY_MAX - CONFIG.BOT_TYPING_DELAY_MIN);
        await sleep(thinkTime);

        // Generate the response
        const assistantResponse = await generateAssistantResponse(userMessage);

        // Add assistant response to UI
        addMessageToUI(assistantResponse, 'assistant');

    } catch (error) {
        console.error("Error processing message:", error);
        addMessageToUI("Sorry, I encountered an error trying to respond. Please try again.", 'assistant');
    } finally {
        hideTypingIndicatorUI();
        isProcessing = false;
        setUIEnabled(true); // Re-enable input
    }
}

// --- Initialization ---

/** Initializes the chatbot application */
async function initializeApp() {
    try {
        loadingElement.textContent = 'Loading AI Model... (may take a moment)';

        // Load USE model with timeout
        const modelPromise = use.load();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Model loading timed out')), CONFIG.MODEL_LOAD_TIMEOUT)
        );
        model = await Promise.race([modelPromise, timeoutPromise]);
        console.log('Universal Sentence Encoder Model Loaded.');
        loadingElement.textContent = 'Loading Vocabulary...';

        // Load Vocabulary from JSON with timeout
        try {
            const response = await fetchWithTimeout(CONFIG.VOCAB_FILE);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data && Array.isArray(data.vocabulary)) {
                vocabulary = data.vocabulary;
                console.log(`Loaded ${vocabulary.length} words from ${CONFIG.VOCAB_FILE}`);
            } else {
                console.warn(`${CONFIG.VOCAB_FILE} has incorrect format. Expected {"vocabulary": [...]}. Using empty vocab.`);
                vocabulary = [];
            }
        } catch (error) {
            console.warn(`Could not load or parse ${CONFIG.VOCAB_FILE}:`, error, "Proceeding without external vocabulary.");
            vocabulary = []; // Ensure vocab is empty array on failure
        }

        // Setup complete, show UI
        loadingElement.style.display = 'none';
        chatContainer.style.display = 'flex';
        setUIEnabled(true);

        // Send initial welcome message
        addMessageToUI("Hi! I'm ready. Ask me anything or just say hello.", 'assistant');

    } catch (error) {
        console.error("Initialization failed:", error);
        showFatalError(error.message || "Failed to initialize AI model or vocabulary");
    }
}

// --- Attach Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
        e.preventDefault(); // Prevent default newline behavior
        handleSendMessage();
    }
});

// --- Start Application ---
window.addEventListener('load', initializeApp);