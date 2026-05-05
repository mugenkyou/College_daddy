import os
import PyPDF2
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class PDFChatbot:
    _instances = {}

    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.vector_store = None
        self.chain = None
        
        # Check if API key is available
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Chatbot won't work.")

    @classmethod
    def get_instance(cls, pdf_path):
        """Get or create a chatbot instance for a specific PDF."""
        if pdf_path not in cls._instances:
            cls._instances[pdf_path] = cls(pdf_path)
        return cls._instances[pdf_path]

    def _extract_text(self):
        """Extract text from the PDF file."""
        text = ""
        try:
            # pdf_path is expected to be a local path relative to the app root, e.g. "data/notes/..."
            with open(self.pdf_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF {self.pdf_path}: {e}")
            raise Exception(f"Could not read PDF file: {e}")
            
        return text

    def initialize(self):
        """Initialize the vector store and QA chain for this PDF."""
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")

        if self.vector_store and self.chain:
            return True # Already initialized

        # 1. Extract text
        raw_text = self._extract_text()
        if not raw_text.strip():
            raise ValueError("No text could be extracted from this PDF.")

        # 2. Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(raw_text)

        # 3. Create Vector Store
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=self.api_key)
        self.vector_store = FAISS.from_texts(chunks, embedding=embeddings)

        # 4. Create QA Chain
        model = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.3, google_api_key=self.api_key)
        
        prompt_template = """
        You are a helpful academic assistant answering questions based on the provided document context.
        Answer the question in a detailed and clear manner using ONLY the provided context.
        If the answer is not contained in the context, say "I could not find the answer to this question in the document."
        Do not make up information.
        
        Context:
        {context}
        
        Question: 
        {question}

        Answer:
        """
        
        prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
        self.chain = prompt | model
        
        return True

    def ask(self, question):
        """Ask a question about the PDF content."""
        if not self.vector_store or not self.chain:
            raise ValueError("Chatbot is not initialized. Please initialize first.")
            
        # Retrieve relevant chunks
        docs = self.vector_store.similarity_search(question, k=4)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Get answer from chain
        response = self.chain.invoke({"context": context, "question": question})
        
        return getattr(response, "content", "I'm sorry, I couldn't generate a response.")
