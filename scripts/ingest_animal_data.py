import os
import psycopg2
import ollama
import uuid

# Database connection details from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "wolves_pet_store")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")

# Ollama model for embeddings
EMBEDDING_MODEL = "nomic-embed-text"

def get_db_connection():
    """Establishes and returns a PostgreSQL database connection."""
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    return conn

def generate_embedding(text: str) -> list[float]:
    """Generates an embedding for the given text using Ollama."""
    response = ollama.embeddings(model=EMBEDDING_MODEL, prompt=text)
    return response['embedding']

def ingest_data_chunk(content: str, animal_type: str, source_url: str = None):
    """Ingests a single data chunk into the animal_knowledge_base table."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        embedding = generate_embedding(content)

        insert_query = """
        INSERT INTO animal_knowledge_base (id, content, embedding, animal_type, source_url)
        VALUES (%s, %s, %s, %s, %s);
        """
        cur.execute(insert_query, (str(uuid.uuid4()), content, embedding, animal_type, source_url))
        conn.commit()
        print(f"Successfully ingested data for animal type: {animal_type}")

    except Exception as e:
        print(f"Error ingesting data: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    # Example usage:
    # In a real scenario, you would replace this with your web scraping and chunking logic.
    # For demonstration, we'll use a hardcoded sample.

    sample_dog_content = """
    Golden Retrievers are a popular breed of dog, known for their friendly and tolerant attitude.
    They are intelligent, eager to please, and relatively easy to train. Golden Retrievers
    are active dogs that require a good amount of exercise, including daily walks or runs.
    They are also excellent swimmers and enjoy retrieving games. Their diet should be
    high-quality dog food appropriate for their age and activity level.
    """
    ingest_data_chunk(sample_dog_content, "dog", "https://example.com/golden-retriever-info")

    sample_cat_content = """
    Siamese cats are known for their striking blue almond-shaped eyes and distinctive
    point coloration. They are highly vocal and communicative, often engaging in
    "conversations" with their owners. Siamese cats are intelligent, playful, and
    require a lot of attention and interaction. They thrive on companionship and
    can become lonely if left alone for long periods. Their short coat requires
    minimal grooming.
    """
    ingest_data_chunk(sample_cat_content, "cat", "https://example.com/siamese-cat-facts")

    print("\nTo run this script, ensure your PostgreSQL database is running and accessible,")
    print("and that you have the 'vector' extension enabled and the 'animal_knowledge_base' table created.")
    print("Also, ensure Ollama is running and 'nomic-embed-text' model is pulled.")
    print("You might need to set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT environment variables.")
