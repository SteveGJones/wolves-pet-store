# Chatbot Feature Design Proposal

## 1. Objective
To integrate a chatbot into the Wolves Pet Store application, enabling users to research animals suitable for pets. The chatbot will leverage a large corpus of animal information, allowing users to ask questions and receive accurate, context-aware responses.

## 2. Core Architectural Decision: RAG (Retrieval Augmented Generation)

The primary architectural choice for this chatbot is **Retrieval Augmented Generation (RAG)**. This approach is preferred for its ability to provide factual, grounded responses from a specific knowledge base, minimizing hallucination and allowing for independent knowledge base updates.

While the term "MCP" was introduced, RAG is the established and superior method for this use case, especially given the need for filtering and leveraging a large corpus. Advanced reasoning (which "MCP" might imply) can be built *on top* of a RAG system.

## 3. Refined RAG-based Chatbot Architecture

### 3.1. Data Ingestion Pipeline

*   **Corpus Acquisition:** Initial focus will be on curating articles from reputable online sources (e.g., Wikipedia, PetMD, ASPCA, AKC, CFA) for specific animal types (e.g., dogs, cats, birds, reptiles). A Python script will be developed for web scraping and initial data preparation. Considerations for web scraping include respecting `robots.txt`, implementing polite scraping practices (e.g., rate limiting), and handling various HTML structures for content extraction. For initial development, a smaller, manually curated dataset can serve as a proof-of-concept.
*   **Preprocessing & Chunking:** Acquired data will be cleaned (e.g., removing boilerplate, ads), normalized (e.g., consistent formatting), and broken into semantically coherent chunks. Chunking strategies will be explored, including fixed-size chunks (e.g., 200-500 tokens) with a defined overlap (e.g., 10-20%) to preserve context across chunk boundaries. Semantic chunking, which aims to keep related sentences together, may be considered for future refinement.
*   **Metadata Extraction (`animal_type`):** Each chunk will be tagged with one or more `animal_type` categories (e.g., "dog", "cat", "bird", "reptile"). This is critical for filtering. Methods for extraction include:
    *   **Source-based Tagging:** If content is scraped from a dedicated "dog breeds" section, all chunks from that source are tagged "dog."
    *   **Keyword Matching:** Simple rule-based systems can identify animal types based on the presence of specific keywords (e.g., "golden retriever," "feline," "canine").
    *   **Small LLM/Classifier:** A smaller, fine-tuned language model or a traditional text classifier could be used to predict the `animal_type` based on the chunk content.
    *   **Manual Curation:** For initial datasets or high-priority content, manual review and tagging will ensure accuracy.
*   **Embedding Generation:** Text chunks will be converted into numerical vector embeddings using a local Ollama model, specifically `nomic-embed-text` (dimension: 768). The same embedding model must be used consistently for both ingestion and user query processing.

### 3.2. Vector Database: `pgvector`

*   **Choice Rationale:** `pgvector` is chosen over dedicated vector databases like ChromaDB to consolidate data storage within the existing PostgreSQL instance, aligning with the project's goal of simplifying infrastructure and leveraging the planned Kubernetes `StatefulSet` for PostgreSQL. This reduces the number of services to manage, streamlines deployment and backup processes, and leverages existing operational expertise with PostgreSQL. It provides sufficient performance for the anticipated scale of this feature.
*   **Schema (SQL DDL):**

    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS animal_knowledge_base (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        embedding VECTOR(768) NOT NULL, -- Dimension for nomic-embed-text
        animal_type TEXT NOT NULL,
        source_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_animal_type ON animal_knowledge_base (animal_type); -- For efficient filtering by animal type
    CREATE INDEX IF NOT EXISTS idx_embedding ON animal_knowledge_base USING hnsw (embedding vector_cosine_ops); -- For fast similarity search
    ```

### 3.3. Chatbot Backend (API Layer)

*   **Technology:** Likely Python with FastAPI, providing a RESTful API for the frontend.
*   **Overall Flow:**
    1.  Receive user query.
    2.  Determine `animal_type` from query/conversation history.
    3.  Generate embedding for user query.
    4.  Retrieve relevant chunks from `pgvector` using `animal_type` filter.
    5.  Construct prompt for LLM with retrieved context.
    6.  Send prompt to local Ollama LLM.
    7.  Return LLM's generated response.
*   **User Query Processing:**
    *   Receive user questions via the API endpoint.
    *   **Animal Type Classification/Extraction:** This is a critical step for effective filtering. Approaches include:
        *   **Keyword Matching:** A simple, rule-based approach identifying keywords (e.g., "dog," "cat," "puppy," "kitten," "bird," "reptile," specific breed names). This is the initial proposed method.
        *   **Small LLM/Classifier:** A dedicated, smaller language model or a trained text classifier could be used to more robustly identify the animal type from the query.
        *   **Conversational Context:** The `animal_type` identified in previous turns of a conversation will be maintained and used for subsequent queries within the same session, unless explicitly overridden by the user.
        *   **Clarification:** If no clear `animal_type` is detected, the system may prompt the user for clarification (e.g., "Which type of animal are you interested in?") or default to a broader, less filtered search (though this is less desirable for initial iterations).
    *   **Query Embedding:** Convert the user's question into an embedding using the same local Ollama `nomic-embed-text` model used during data ingestion. This ensures vector space consistency.
*   **Retrieval Step:**
    *   Query the `animal_knowledge_base` table in PostgreSQL.
    *   Perform a similarity search (`<->` operator for cosine similarity) on the `embedding` column to find chunks semantically similar to the user's query.
    *   **Crucially, apply a `WHERE animal_type = 'detected_animal_type'` clause** to filter results, ensuring only relevant animal-specific information is retrieved. This significantly narrows the search space and improves relevance.
    *   Retrieve the top N (e.g., 3-5) most relevant chunks. The optimal value for N will be determined through testing and iteration.
    *   **Re-ranking (Future Consideration):** For more advanced scenarios, a re-ranking step could be introduced to further refine the retrieved chunks based on their relevance to the query.
*   **LLM Augmentation:**
    *   Construct a comprehensive prompt for the local Ollama `llama3.2:latest` model. The prompt will clearly instruct the LLM on its role and constraints.
    *   **Prompt Structure Example:**
        ```
        You are a helpful chatbot providing information about pets. Your goal is to assist users in researching animals for pets.
        Answer the following question based ONLY on the provided context. Do not use any outside knowledge.
        If the answer is not explicitly available in the context, state that you don't have enough information to answer the question.

        Question: [User's Question]

        Context:
        [Retrieved Chunk 1 Content]
        [Retrieved Chunk 2 Content]
        ...
        ```
    *   This explicit instruction helps to minimize hallucination and ensures responses are grounded in the provided knowledge base.
*   **Response Generation:** The Ollama model processes the augmented prompt and generates the final answer, which is then returned to the frontend.

### 3.4. Chatbot Frontend

*   **Integration:** A dedicated chat UI component will be integrated into the existing React/TypeScript client application. This component will provide an input field for user queries and a display area for chatbot responses.
*   **Interaction:** User messages will be sent to the new chatbot backend API via asynchronous requests. The chatbot's responses will be displayed dynamically in the chat interface, providing a seamless conversational experience.
*   **User Experience (UX) Considerations:** The UI should be intuitive, clearly indicate when the chatbot is typing, and potentially offer quick action buttons or suggestions based on common queries.

## 4. Ollama Setup

It is assumed that Ollama is already set up locally, with `llama3.2:latest` for the LLM and `nomic-embed-text` for embeddings. The `nomic-embed-text` model has an embedding dimension of 768.

## 5. Next Steps

1.  Ensure the `pgvector` extension is enabled and the `animal_knowledge_base` table is created in the PostgreSQL database using the provided DDL.
2.  Develop a Python script for initial corpus ingestion, demonstrating data scraping, chunking, metadata assignment, embedding generation, and insertion into the `pgvector` table.

## 6. Future Enhancements

*   **More Sophisticated Filtering:** Implement more granular filtering beyond just `animal_type`, such as `topic` (e.g., diet, health, behavior) or `breed`.
*   **Conversational Memory:** Implement a more robust conversational memory mechanism to allow the chatbot to maintain context over longer interactions and multi-turn conversations.
*   **Multi-hop Reasoning:** For complex questions requiring information from multiple disparate chunks, explore techniques for multi-hop retrieval and reasoning.
*   **Multi-modal Capabilities:** Integrate image recognition (e.g., for pet identification) or the ability to provide images/videos in responses.
*   **User Feedback Loop:** Implement a mechanism for users to provide feedback on chatbot responses (e.g., thumbs up/down) to help improve accuracy and relevance over time.
*   **Advanced Chunking Strategies:** Explore and implement more advanced chunking techniques (e.g., recursive character text splitter, semantic chunking) to optimize retrieval.
*   **Source Citation:** Display the source URL or document title alongside the chatbot's response to enhance trustworthiness and allow users to explore further.
