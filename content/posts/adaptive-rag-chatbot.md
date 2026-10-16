---
title: "I Built an Adaptive RAG Chatbot and It Works on My Machine"
date: 2026-01-04
tag: "Engineering"
description: "A journey through retrieval-augmented generation, multilingual AI, and the art of context engineering. Learn how I built an adaptive RAG system that bridges Shona and English using 130K+ Wikipedia passages, FAISS vector search, and modern LLMs."
---

You know that feeling when your code works perfectly in development, and then you deploy it and everything burns to the ground? This is that story.

What started as "let me build a simple chatbot using the Gemini API" turned into a months-long journey through embeddings, vector databases, adaptive retrieval strategies, and the unique pain of debugging why DuckDuckGo decided my chatbot was a spam bot.

This is the story of building an adaptive RAG (Retrieval-Augmented Generation) chatbot that can answer questions about 130,000+ Wikipedia passages, handle queries in Shona and respond back in Shona, and—most importantly—fall back gracefully when things inevitably break.

**Spoiler:** It works on my machine. Production was... a different story.

### The Problem: LLMs Don't Know Everything

I started with a simple terminal chat app using Gemini's API. Here's the entire "architecture":

```python
# app.py - The whole thing
history = []

while True:
    user_input = input("You: ")
    history.append({"role": "user", "content": user_input})
    response = client.chat.completions.create(
        model="gemini-2.5-flash-lite",
        messages=history
    )
    print(f"AI: {response.choices[0].message.content}")
```

It worked! But then I asked it about South African visa requirements for specific countries, and it confidently told me things that were... creative. Not wrong in an obvious way, just subtly incorrect. The kind of incorrect that would get someone denied at the border.

The problem: **LLMs hallucinate**. They're trained on data, but they don't have access to specific, up-to-date information. They'll give you an answer even when they shouldn't.

I needed a way to give the model *actual* information to work with, not just its training data. That's where RAG comes in.

### Discovery: Embeddings Are Just Numbers

I'll be honest—when I first heard about "embeddings," I thought it was some ML black magic. Turns out, it's just a fancy way of saying "convert text into a bunch of numbers that capture meaning."

I used the `all-MiniLM-L6-v2` model from sentence-transformers. Why? Because:

- It's small (80MB vs multi-GB monsters)
- It's fast (runs on CPU, no GPU needed)
- It generates 384-dimensional vectors (good balance of detail vs size)
- It just... works

Here's the actual code that powers the embedding service:

```python
# From src/core/embeddings.py
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"
        self.model = SentenceTransformer(self.model_name)

    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query."""
        embedding = self.model.encode([query])[0]
        return np.array(embedding)
```

That's it. Three lines (okay, more with the class structure). Feed it a sentence, get back 384 numbers that somehow capture what the sentence means.

The magic happens because similar sentences get similar numbers. "How do I bake a cake?" and "What's the recipe for making cake?" will have vectors that are close together in 384-dimensional space. Wild, right?

### Enter FAISS: Finding Needles in 130K Haystacks

So now I had embeddings. Great. But I had 130,000+ Wikipedia passages. How do I find which ones are relevant to a user's question?

That's where FAISS (Facebook AI Similarity Search) comes in. It's a library that does exactly one thing: find similar vectors really, really fast.

```python
# From src/core/vector_store.py
import faiss

class VectorStore:
    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)  # L2 distance
        self.metadata = []

    def search(self, query_embedding: np.ndarray, top_k: int = 3):
        """Search for similar examples."""
        query_embedding = query_embedding.astype('float32').reshape(1, -1)
        distances, indices = self.index.search(query_embedding, top_k)

        results = []
        for idx, dist in zip(indices[0], distances[0]):
            if idx < len(self.metadata):
                results.append((self.metadata[idx], float(dist)))

        return results
```

I'm using `IndexFlatL2` which uses L2 (Euclidean) distance. There are fancier indexes (IVF, HNSW), but for 130K vectors? Flat search is fast enough and guarantees exact results.

The user asks a question → I convert it to a 384-dim vector → FAISS finds the 3-5 most similar document vectors → I grab those documents and feed them to the LLM.

**This is RAG**. Retrieve relevant information, then let the LLM generate an answer based on that information.

### When It All Broke: The DuckDuckGo Incident

Everything worked beautifully in development. The chatbot would fall back to web search when it couldn't find answers in the Wikipedia corpus. I was using DuckDuckGo's API because it's free and doesn't require authentication. What could go wrong?

In production: **everything**.

Turns out, when your chatbot gets popular (or just when you're testing it aggressively), DuckDuckGo starts rate limiting you. Hard. I'd get maybe 3-4 queries through, then:

```
RateLimitError: Ratelimit
```

My first instinct: "Just add exponential backoff!" Spoiler: That doesn't work when the rate limit window is measured in hours, not seconds.

The fix? Add Tavily as a fallback to the fallback. Now the search flow is:

1. Try DuckDuckGo (free, fast, but rate limited)
2. If rate limited, try Tavily (paid, but has generous free tier)
3. If both fail, fall back to just using the vector store context

```python
# From src/core/web_search.py
def search(self, query: str, vectorstore_context: str = None):
    # Try DuckDuckGo first
    if time.time() > self._rate_limit_until:
        documents = self._try_duckduckgo(query, max_results, timelimit)

    # Fallback to Tavily
    if not documents and self.tavily:
        logger.info("DuckDuckGo failed/rate-limited, trying Tavily")
        documents = self._try_tavily(query, max_results)

    # Final fallback: use vectorstore context
    if not documents and vectorstore_context:
        logger.info("All web searches failed, using vectorstore context")
        documents = [Document(
            page_content=f"Based on local knowledge base:\n\n{vectorstore_context}",
            metadata={'source': 'vectorstore_fallback'}
        )]

    return documents
```

Three-tier fallback architecture, born from production pain. It works on my machine, and now it (mostly) works in production too.

### The Context Loss Bug: A Debugging Nightmare

Here's a fun one. I implemented query transformation—when the retrieved documents aren't relevant, the system rewrites the query and tries again. Sounds smart, right?

Except I kept losing context. The transformed query would come back, search would happen, but then the generation step wouldn't have access to the retrieved documents. The error logs made no sense:

```
DEBUG: Retrieved 3 documents
DEBUG: Grading documents... 0/3 relevant
DEBUG: Transforming query...
DEBUG: Retrieved 5 documents
ERROR: No documents in context during generation
```

How are there documents retrieved but none in context?!

Turns out, LangGraph (the state management library I'm using) doesn't automatically preserve state between node transitions the way I expected. When the query transformation node updated the query, it *didn't* preserve the retrieved documents in state for the next retrieval cycle.

The fix was adding a `save_context` node that explicitly preserves document context:

```python
# From src/core/adaptive_rag/graph.py
workflow.add_node("retrieve", self.nodes.retrieve)
workflow.add_node("save_context", self.nodes.save_context)  # <-- This!
workflow.add_node("grade_documents", self.nodes.grade_documents)

workflow.add_edge("retrieve", "save_context")
workflow.add_edge("save_context", "grade_documents")
```

Now the documents are explicitly saved to state before grading. Problem solved. Only took me 6 hours of debugging and reading LangGraph source code to figure out.

### The LangGraph Pipeline: Adaptive RAG in Action

After all those failures, here's what the final adaptive RAG pipeline looks like:

```
┌─────────────────────────────────────────────────────┐
│                  User Question                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Route Question     │
         │  (vectorstore,      │
         │   web_search, or    │
         │   direct_response)  │
         └──────┬───────┬──────┘
                │       │
       ┌────────┘       └────────┐
       │                         │
       ▼                         ▼
┌──────────────┐        ┌───────────────┐
│  Retrieve    │        │  Web Search   │
│  (FAISS)     │        │  (DDG/Tavily) │
└──────┬───────┘        └───────┬───────┘
       │                        │
       ▼                        │
┌──────────────┐                │
│ Save Context │                │
└──────┬───────┘                │
       │                        │
       ▼                        │
┌──────────────┐                │
│Grade Documents│               │
└──────┬───────┘                │
       │                        │
  ┌────┴────┐                   │
  │ Relevant?│                  │
  └─┬─────┬─┘                   │
    │ No  │ Yes                 │
    ▼     │                     │
┌────────┐│                     │
│Transform││                     │
│ Query  ││                     │
└───┬────┘│                     │
    │     │                     │
    │   (loop back)             │
    │     │                     │
    │     └─────────────────────┘
    │                           │
    └───────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │     Generate        │
         │     Response        │
         └─────────────────────┘
```

This is implemented using LangGraph's StateGraph:

```python
# From src/core/adaptive_rag/graph.py
workflow = StateGraph(AdaptiveRAGState)

# Add nodes
workflow.add_node("retrieve", self.nodes.retrieve)
workflow.add_node("save_context", self.nodes.save_context)
workflow.add_node("web_search", self.nodes.web_search)
workflow.add_node("grade_documents", self.nodes.grade_documents)
workflow.add_node("generate", self.nodes.generate)
workflow.add_node("transform_query", self.nodes.transform_query)
workflow.add_node("direct_response", self.nodes.direct_response)

# Route question at entry
route_question = create_route_question(self.llm_with_structure)
workflow.set_conditional_entry_point(
    route_question,
    {
        "web_search": "web_search",
        "vectorstore": "retrieve",
        "direct_response": "direct_response"
    }
)

# Build the flow
workflow.add_edge("web_search", "generate")
workflow.add_edge("retrieve", "save_context")
workflow.add_edge("save_context", "grade_documents")

# After grading, decide: transform or generate
workflow.add_conditional_edges(
    "grade_documents",
    decide_to_generate,
    {
        "transform_query": "transform_query",
        "generate": "generate"
    }
)

# After transform, retrieve again
workflow.add_edge("transform_query", "retrieve")
workflow.add_edge("generate", END)
workflow.add_edge("direct_response", END)
```

The system makes intelligent decisions at every step:

- **Should I use the vector store or web search?** → Router decides based on query type
- **Are these retrieved documents actually relevant?** → Grader checks each one
- **None of them are good, what now?** → Transform the query and try again
- **Still nothing after retrying?** → Fall back to web search

This is what "adaptive" means in adaptive RAG. The system adapts its strategy based on what it finds.

### Lessons Learned: Why "It Works on My Machine" Matters

After 67+ commits, countless debugging sessions, and more rate limit errors than I care to remember, here's what I learned:

#### 1. Production is a Different Beast

Things that work perfectly in development will absolutely find new and creative ways to fail in production. Plan for it. Build fallbacks. Log everything.

#### 2. Embeddings Are Surprisingly Powerful

I was skeptical at first. "Just turn text into numbers?" But the ability to find semantically similar content across 130K+ documents in milliseconds is genuinely impressive.

#### 3. State Management is Hard

LangGraph is great, but understanding how state flows through your graph takes time. Draw diagrams. Add debug logging at every node. Save context explicitly when you need it.

#### 4. Always Have a Fallback

My three-tier web search fallback (DuckDuckGo → Tavily → Vectorstore) saved me countless times. If you depend on an external service, assume it will fail.

#### 5. "It Works on My Machine" is Actually Valid

Seriously. Having a local development environment where you can test the full pipeline without rate limits or API costs is invaluable. Production taught me what to fix. Development gave me the space to fix it.

### Technical Deep Dive: How the Pieces Fit Together

#### The Embedding Layer

When a query comes in: "What are the visa requirements for Brazil?"

1. Sentence-transformers encodes it: `[0.23, -0.45, 0.12, ..., 0.67]` (384 numbers)
2. FAISS searches the index for the 5 closest document vectors
3. Returns metadata + distance scores: `[(doc1, 0.34), (doc2, 0.45), ...]`

Lower distance = more similar. I typically use `top_k=5` to give the LLM enough context without overwhelming it.

#### The Grading System

Not all retrieved documents are actually useful. That's where grading comes in:

```python
# Simplified version of the grader
class RetrievalGrader:
    def grade_document(self, question: str, document: str) -> bool:
        """Returns True if document is relevant to question."""
        prompt = f"""
        Question: {question}
        Document: {document}

        Is this document relevant to answering the question?
        Respond with 'yes' or 'no'.
        """
        response = llm.generate(prompt)
        return "yes" in response.lower()
```

Each document gets graded individually. If less than half are relevant, the query gets transformed and we try again.

#### Query Transformation

When retrieval fails, don't just give up—rewrite the query:

```
Original: "What do I need for Brazil?"
Transformed: "What are the visa and entry requirements for traveling to Brazil from South Africa?"
```

The transformed query is usually more specific and searches better. This is one retry loop that actually makes things better instead of worse.

### What I'd Do Differently Next Time

If I were starting this project from scratch today:

- **Start with monitoring**: I added logging way too late. Should've had observability from day one.
- **Test the failure modes**: Write tests that simulate rate limits, network failures, empty results. You'll encounter all of them eventually.
- **Document the state transitions**: Draw the LangGraph flow before writing code, not after debugging it for 6 hours.
- **Use structured outputs from the start**: I retrofitted Pydantic models for grader outputs. Should've started with them.
- **Profile early**: FAISS search is fast, but I didn't realize the embedding step was the bottleneck until way later.

### The Final Product

So what did I end up with? A chatbot that:

- Answers questions about 130K+ Wikipedia passages using FAISS vector search
- Falls back to web search (DuckDuckGo/Tavily) when the knowledge base doesn't have the answer
- Handles queries in 10+ languages (using FastText detection + LLM translation)
- Gracefully degrades when things fail (and they will fail)
- Actually works, both on my machine and in production (most of the time)

It's not perfect. The rate limiting still catches me sometimes. The grading can be slow. The transformed queries occasionally go off the rails.

But it works. And more importantly, I learned a ton building it.

### Wrapping Up

Building an adaptive RAG system taught me that:

- Embeddings are just numbers, but smart numbers
- FAISS makes searching 130K documents feel instant
- Production will find every edge case you didn't think of
- Fallbacks are not optional
- State management is harder than it looks
- "It works on my machine" is a valid starting point

If you're building something similar, expect to debug rate limits, context loss, and hallucinations. Build monitoring from day one. Test your failure modes. And always have a fallback.

The code is messy in places, the error handling is overly defensive, and there are probably better ways to do some of this. But it works, it handles failures gracefully, and I learned more from the bugs than I did from the parts that worked the first time.

And honestly? That's the best part of building software.
