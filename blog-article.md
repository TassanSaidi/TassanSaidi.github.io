# I Built an Adaptive RAG Chatbot and It Works on My Machine

*A journey through retrieval-augmented generation, multilingual AI, and the art of context engineering*

---

## Introduction

What started as a simple terminal chat application talking to the Gemini API evolved into something far more interesting: an adaptive RAG (Retrieval-Augmented Generation) system that can understand questions in Shona, retrieve relevant information from an English knowledge base of 130,000+ Wikipedia passages, and respond back in the user's language.

Along the way, I learned that building AI applications is less about the AI itself and more about **context engineering**—the art of getting the right information to the model at the right time, in the right format.

This is the story of that evolution, the concepts I learned, and why "it works on my machine" is actually a feature, not a bug.

---

## The Starting Point: A 50-Line Chat Script

The project began with `app.py`—a humble 50-line Python script that did exactly one thing: chat in Shona using Google's Gemini API.

```python
# The entire "architecture" was this:
history = [
    {"role": "system", "content": "Iwe uri nyanzvi yechiShona..."}
]

while True:
    user_input = input("Iwe: ")
    history.append({"role": "user", "content": user_input})
    response = client.chat.completions.create(model="gemini-2.5-flash-lite", messages=history)
    print(f"Agent: {response.choices[0].message.content}")
```

It worked. But it had a problem: **the model only knew what it was trained on**. Ask it about specific topics, and you'd get generic responses—or worse, confident hallucinations.

This is where RAG enters the picture.

---

## Key Concept #1: What is RAG?

RAG stands for **Retrieval-Augmented Generation**. Instead of relying solely on what the LLM "knows," you give it relevant information at query time.

Think of it like this:

| Without RAG | With RAG |
|-------------|----------|
| "Hey LLM, answer this question from your training data" | "Hey LLM, here's some relevant context I found. Now answer the question using this." |
| Model guesses or hallucinates | Model synthesizes from provided facts |
| Generic responses | Grounded, specific responses |

The key insight: **LLMs are excellent at synthesis and reasoning, but terrible at recall**. RAG plays to their strengths.

---

## The RAG Pipeline: How It Actually Works

Here's the pipeline I built, broken down into digestible pieces:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │   User      │     │  Embedding  │     │   Vector    │           │
│  │   Query     │────▶│   Model     │────▶│   Search    │           │
│  │             │     │             │     │   (FAISS)   │           │
│  └─────────────┘     └─────────────┘     └──────┬──────┘           │
│                                                  │                  │
│                                                  ▼                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │  Response   │◀────│     LLM     │◀────│  Retrieved  │           │
│  │   (Final)   │     │  Generation │     │  Contexts   │           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 1: Ingestion (One-Time Setup)

Before you can retrieve anything, you need to build your knowledge base:

1. **Load documents** — I used SQuAD 2.0, which has 130K+ Wikipedia Q&A pairs
2. **Generate embeddings** — Convert each text chunk into a 384-dimensional vector
3. **Build an index** — Store vectors in FAISS for fast similarity search

```python
# The ingestion pipeline
examples = loader.load_squad_examples()  # 130K examples
embeddings = embedding_service.embed_texts([ex['context'] for ex in examples])
vector_store.add_embeddings(embeddings, examples)
vector_store.save('faiss_index.index', 'faiss_metadata.json')
```

### Step 2: Retrieval (Per Query)

When a user asks a question:

1. **Embed the query** — Same model, same vector space
2. **Search for similar vectors** — FAISS finds the top-k nearest neighbors
3. **Return the associated metadata** — The actual text chunks

```python
query_embedding = embedding_service.embed_query("What is photosynthesis?")
results = vector_store.search(query_embedding, top_k=3)
# Returns: [(metadata_dict, distance), ...]
```

### Step 3: Generation (The Magic)

Now comes the **context engineering** part. We augment the user's query with retrieved context:

```python
prompt = f"""
Here are relevant context passages:

Context 1: {context_1}
Context 2: {context_2}
Context 3: {context_3}

Use this information to answer: {user_query}
"""
```

The LLM now has specific, relevant information to work with—not just its training data.

---

## Key Concept #2: Embeddings and Vector Search

Embeddings are the secret sauce of RAG. They convert text into numerical vectors where **semantically similar texts are close together** in vector space.

```
┌────────────────────────────────────────────────────────────────────┐
│                    EMBEDDING SPACE (Simplified)                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│     "What is the capital of France?"                               │
│                    ●                                               │
│                     \                                              │
│                      \  (close in vector space)                    │
│                       \                                            │
│                        ●  "Paris is the capital of France"         │
│                                                                    │
│                                                                    │
│                                                                    │
│     "How do plants make food?"                                     │
│                    ●                                               │
│                     \                                              │
│                      ●  "Photosynthesis converts sunlight..."      │
│                                                                    │
│                                        (far away)                  │
│                                              ●  "The stock market" │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

I used `all-MiniLM-L6-v2`—a lightweight model that produces 384-dimensional vectors. It's fast (~15ms per embedding) and good enough for English text.

**Key Learning**: The embedding model doesn't need to understand the task. It just needs to put similar things close together. The LLM does the understanding.

---

## The Adaptive Part: Multilingual Query Processing

Here's where it gets interesting. My target users speak Shona, but my knowledge base (SQuAD 2.0) is in English. 

The solution? **A translation pipeline that adapts to the user's language.**

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ADAPTIVE MULTILINGUAL PIPELINE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Input (Shona)                                                 │
│  "Guta guru reFrance nderipi?"                                      │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────┐                                            │
│  │ Language Detection  │  ◀── Detect: "sn" (Shona)                  │
│  └──────────┬──────────┘                                            │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐                                            │
│  │ Translate to English│  ◀── LLM Translation                       │
│  │ "What is the capital│                                            │
│  │  of France?"        │                                            │
│  └──────────┬──────────┘                                            │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐                                            │
│  │ Embed English Query │  ◀── Same embedding model                  │
│  └──────────┬──────────┘                                            │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐                                            │
│  │ FAISS Vector Search │  ◀── Search English knowledge base         │
│  └──────────┬──────────┘                                            │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐                                            │
│  │ Generate Answer     │  ◀── "Answer in Shona using this context"  │
│  │ (in Shona)          │                                            │
│  └──────────┬──────────┘                                            │
│             │                                                       │
│             ▼                                                       │
│  Response (Shona)                                                   │
│  "Guta guru reFrance ndiParis..."                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

The key insight: **Use English as the "lingua franca" internally**, then translate in/out. This lets you leverage the massive English knowledge bases available (SQuAD, Wikipedia, etc.) while serving users in their native language.

---

## Key Concept #3: Context Engineering

Context engineering is the practice of **carefully crafting what information you give to an LLM**. It's arguably more important than prompt engineering.

### The System Prompt

```python
SYSTEM_PROMPT = """You are a knowledgeable assistant with access to information from Wikipedia.

You have deep knowledge and can think critically.
When answering questions, use the provided context examples to inform your response.
Provide accurate, helpful answers based on the given information.
"""
```

### The Augmented User Message

```python
def build_user_message(query: str, retrieved_examples: List[Dict]) -> str:
    context = format_rag_context(retrieved_examples)
    
    if context:
        return f"{context}\n\nQuestion: {query}"
    else:
        return query
```

### The Formatted Context

```python
def format_rag_context(retrieved_examples: List[Dict]) -> str:
    context_parts = ["Here are relevant context passages:"]
    
    for i, example in enumerate(retrieved_examples, 1):
        context_parts.append(f"\nContext {i}:")
        context_parts.append(f"Topic: {example['title']}")
        context_parts.append(f"Information: {example['context']}")
        if 'question' in example and 'answer' in example:
            context_parts.append(f"Example Q: {example['question']}")
            context_parts.append(f"Example A: {example['answer']}")
    
    context_parts.append("\nUse this information to answer the question.")
    
    return "\n".join(context_parts)
```

**Why this matters**: The structure, ordering, and phrasing of context directly impacts response quality. I experimented with:

- Including example Q&A pairs (improved answer format)
- Adding topic labels (helped with disambiguation)
- Limiting context length (prevented confusion)

---

## How the Project Evolved

The project went through several distinct phases:

```
┌────────────────────────────────────────────────────────────────────┐
│                     PROJECT EVOLUTION TIMELINE                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  PHASE 1: Simple Chat (December 2024)                              │
│  ─────────────────────────────────────                             │
│  • 50-line terminal app                                            │
│  • Direct Gemini API calls                                         │
│  • Shona system prompt                                             │
│  • No retrieval, no persistence                                    │
│                                                                    │
│           │                                                        │
│           ▼                                                        │
│                                                                    │
│  PHASE 2: RAG with Fikira Dataset                                  │
│  ────────────────────────────────                                  │
│  • Added FAISS vector store                                        │
│  • Used vamboai/fikira (5K Shona examples)                         │
│  • Multilingual embeddings                                         │
│  • Streamlit UI                                                    │
│                                                                    │
│           │                                                        │
│           ▼                                                        │
│                                                                    │
│  PHASE 3: SQuAD + Translation Pipeline                             │
│  ─────────────────────────────────────                             │
│  • Switched to SQuAD 2.0 (130K English examples)                   │
│  • Added translation layer (Shona ↔ English)                       │
│  • Lightweight embeddings (all-MiniLM-L6-v2)                       │
│  • Multi-provider support (LM Studio, OpenAI, Gemini)              │
│                                                                    │
│           │                                                        │
│           ▼                                                        │
│                                                                    │
│  PHASE 4: Project Reorganization                                   │
│  ───────────────────────────────                                   │
│  • Proper src/ structure                                           │
│  • Separated concerns (core, ui, data)                             │
│  • CLI flags for configuration                                     │
│  • Terminal + Web interfaces                                       │
│                                                                    │
│           │                                                        │
│           ▼                                                        │
│                                                                    │
│  FUTURE: South African Languages Expansion                         │
│  ─────────────────────────────────────────                         │
│  • Zulu, Xhosa, Afrikaans, Sesotho...                              │
│  • Automatic language detection                                    │
│  • Per-language response generation                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Key Pivot: Fikira → SQuAD

The original plan was to use a Shona reasoning dataset (Fikira) directly. But I realized:

1. **Fikira had only 5K examples** — Limited knowledge coverage
2. **SQuAD has 130K examples** — Massive Wikipedia coverage
3. **Translation is a solved problem** — Modern LLMs handle Shona reasonably well

So instead of embedding Shona text and searching in Shona, I:
- Translate user query to English
- Search English knowledge base
- Generate answer using English context
- Respond in user's original language

This gave me 26x more knowledge to work with.

---

## Using Agents for Development

A significant part of this project was built using AI agents (specifically Claude) for:

### 1. Research and Planning

Before writing code, agents analyzed:
- The existing codebase structure
- Available datasets and their schemas
- Embedding model options
- LLM capabilities for African languages

This produced detailed implementation plans with specific file changes, code snippets, and success criteria.

### 2. Implementation

Agents wrote the actual code following the plans:
- Created new modules (`vector_store.py`, `embeddings.py`, `pipeline.py`)
- Updated existing files with new imports and logic
- Generated comprehensive docstrings and type hints

### 3. Documentation

All the handoff documents, research notes, and ticket descriptions were agent-generated, keeping track of:
- What was implemented
- What decisions were made and why
- What remains to be done

**Key Learning**: Agents are most effective when you give them:
1. Clear context (codebase structure, existing code)
2. Specific goals (not "make it better" but "add language detection using lingua-py")
3. Success criteria (tests to pass, behaviors to verify)

---

## The "Works on My Machine" Philosophy

The title references the infamous developer excuse, but there's a real philosophy here:

### Local-First Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LOCAL-FIRST RAG ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │  YOUR MACHINE   │                                                │
│  │                 │                                                │
│  │  ┌───────────┐  │     ┌──────────────────┐                       │
│  │  │  Python   │  │     │    LM Studio     │                       │
│  │  │  Script   │──┼────▶│  (localhost:1234)│                       │
│  │  │           │  │     │                  │                       │
│  │  │  • FAISS  │  │     │  Qwen 2.5 7B     │                       │
│  │  │  • Embed  │  │     │  or other model  │                       │
│  │  └───────────┘  │     └──────────────────┘                       │
│  │                 │                                                │
│  └─────────────────┘                                                │
│                                                                     │
│  No cloud dependency for core RAG functionality                     │
│  Optional: OpenAI/Gemini for higher quality                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Benefits**:
- **Privacy**: Your queries never leave your machine
- **Cost**: No per-token API charges
- **Speed**: Local inference can be faster than API calls
- **Reliability**: No dependency on external services

**Trade-off**: You need a decent GPU and ~8GB VRAM for the 7B model.

### Multi-Provider Support

The system supports three LLM backends:

```python
class LLMProvider(Enum):
    LM_STUDIO = "lm_studio"   # Local, free
    OPENAI = "openai"         # Cloud, paid, highest quality
    GEMINI = "gemini"         # Cloud, free tier available
```

You can switch at runtime:
```bash
# Local (free)
python scripts/terminal_chat.py --llm-provider lm_studio

# Cloud (paid but better)
python scripts/terminal_chat.py --llm-provider openai
```

---

## What I Actually Accomplished

Let me be concrete about what works:

### ✅ Working Features

| Feature | Status | Notes |
|---------|--------|-------|
| SQuAD ingestion | ✅ | 130K examples indexed |
| FAISS search | ✅ | <10ms per query |
| Local embeddings | ✅ | all-MiniLM-L6-v2 |
| Shona translation | ✅ | Via LLM |
| Streamlit UI | ✅ | Chat interface + config |
| Terminal chat | ✅ | CLI with flags |
| Multi-provider | ✅ | LM Studio, OpenAI, Gemini |
| Context display | ✅ | Show retrieved examples |

### 📊 Performance Numbers

```
Initialization:
  - First run (downloads): ~3 minutes
  - Subsequent runs: ~30 seconds

Per Query:
  - Embedding generation: ~15ms
  - FAISS search: ~5ms
  - LLM generation: 1-5 seconds (depends on provider)
  - Total: 2-6 seconds

Resources:
  - FAISS index: ~100MB
  - Embedding model: ~90MB
  - LM Studio model: ~4GB (Q4 quantized)
```

### 🔮 Future Work

- Language detection for automatic routing
- South African language support (Zulu, Xhosa, etc.)
- Persistent conversation history
- Fine-tuned embedding model for African languages

---

## Lessons Learned

### 1. Context > Prompts

The quality of your RAG system depends more on **what context you provide** than how you phrase the prompt. Spend time on your retrieval pipeline.

### 2. Translation is Your Friend

Don't try to build separate knowledge bases for each language. Use English as your internal representation and translate at the edges.

### 3. Start Simple, Iterate

Phase 1 was 50 lines. Phase 4 is a proper project structure. Each phase built on the last. Don't over-engineer from the start.

### 4. Local LLMs Are Ready

LM Studio + a quantized 7B model gives you 80% of GPT-4 quality at 0% of the cost. For many use cases, that's enough.

### 5. Agents Accelerate Development

Using AI agents for planning, implementation, and documentation turned weeks of work into days. The key is giving them good context.

---

## Conclusion

Building this RAG system taught me that AI applications are really **data engineering problems** wrapped in ML. The hardest parts weren't the embeddings or the LLM calls—they were:

- Getting the data in the right format
- Building a reliable retrieval pipeline  
- Engineering context that helps the model succeed

The "adaptive" part—handling multiple languages, supporting multiple providers, working locally—emerged from treating the system as a pipeline rather than a black box.

And yes, it works on my machine. But more importantly, it works *because* it's on my machine—local, private, and under my control.

---

*The full code is available on GitHub. Feel free to fork it, break it, and make it work on your machine too.*

---

## Appendix: Project Structure

```
chatty/
├── src/
│   ├── config.py           # Provider enums, settings
│   ├── prompts.py          # Context formatting
│   ├── ui/
│   │   └── app.py          # Streamlit interface
│   ├── core/
│   │   ├── embeddings.py   # Sentence transformers
│   │   ├── vector_store.py # FAISS operations
│   │   ├── pipeline.py     # RAG orchestrator
│   │   └── chat.py         # Conversation service
│   └── data/
│       └── loader.py       # SQuAD dataset
├── scripts/
│   ├── initialize_rag.py   # Build FAISS index
│   └── terminal_chat.py    # CLI interface
├── data/
│   ├── faiss_index.index   # Vector index
│   └── faiss_metadata.json # Document metadata
└── tests/
    └── *.py                # Validation tests
```
