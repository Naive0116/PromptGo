"""
RAG 服务 - 轻量级向量检索系统
使用 ChromaDB 作为向量数据库，支持文档入库和语义检索
"""
import os
import hashlib
import json
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


class RAGService:
    """RAG 检索服务"""
    
    def __init__(
        self,
        persist_directory: str = "./data/chroma_db",
        collection_name: str = "prompt_knowledge",
        embedding_api_key: Optional[str] = None,
        embedding_base_url: Optional[str] = None,
        embedding_model: str = "text-embedding-v3"
    ):
        """
        初始化 RAG 服务
        
        Args:
            persist_directory: ChromaDB 持久化目录
            collection_name: 集合名称
            embedding_api_key: Embedding API Key（通义千问）
            embedding_base_url: Embedding API Base URL
            embedding_model: Embedding 模型名称
        """
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.embedding_api_key = embedding_api_key or os.getenv("DASHSCOPE_API_KEY", "")
        self.embedding_base_url = embedding_base_url or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        self.embedding_model = embedding_model
        
        self._client = None
        self._collection = None
        
    def _ensure_initialized(self):
        """确保 ChromaDB 已初始化"""
        if not CHROMADB_AVAILABLE:
            raise RuntimeError("ChromaDB 未安装，请运行: pip install chromadb")
        
        if self._client is None:
            # 确保目录存在
            Path(self.persist_directory).mkdir(parents=True, exist_ok=True)
            
            # 初始化 ChromaDB 客户端（持久化模式）
            self._client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # 获取或创建集合
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Prompt engineering knowledge base"}
            )
    
    async def _get_embedding(self, text: str) -> List[float]:
        """
        获取文本的 Embedding 向量
        使用通义千问的 text-embedding-v3 模型
        """
        if not self.embedding_api_key:
            raise ValueError("未配置 Embedding API Key")
        
        if not HTTPX_AVAILABLE:
            raise RuntimeError("httpx 未安装")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.embedding_base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {self.embedding_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.embedding_model,
                    "input": text,
                    "encoding_format": "float"
                }
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"Embedding API 错误: {response.text}")
            
            data = response.json()
            return data["data"][0]["embedding"]
    
    async def _get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """批量获取 Embedding"""
        if not self.embedding_api_key:
            raise ValueError("未配置 Embedding API Key")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.embedding_base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {self.embedding_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.embedding_model,
                    "input": texts,
                    "encoding_format": "float"
                }
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"Embedding API 错误: {response.text}")
            
            data = response.json()
            return [item["embedding"] for item in data["data"]]
    
    def _generate_doc_id(self, content: str, source: str) -> str:
        """生成文档唯一 ID"""
        hash_input = f"{source}:{content[:200]}"
        return hashlib.md5(hash_input.encode()).hexdigest()
    
    async def add_document(
        self,
        content: str,
        metadata: Dict[str, Any],
        doc_id: Optional[str] = None
    ) -> str:
        """
        添加单个文档到向量库
        
        Args:
            content: 文档内容
            metadata: 元数据（source_url, type, tags 等）
            doc_id: 可选的文档 ID
        
        Returns:
            文档 ID
        """
        self._ensure_initialized()
        
        if not doc_id:
            doc_id = self._generate_doc_id(content, metadata.get("source_url", "unknown"))
        
        # 获取 Embedding
        embedding = await self._get_embedding(content)
        
        # 确保 metadata 中的值都是字符串（ChromaDB 要求）
        clean_metadata = {}
        for k, v in metadata.items():
            if isinstance(v, list):
                clean_metadata[k] = json.dumps(v, ensure_ascii=False)
            elif isinstance(v, (str, int, float, bool)):
                clean_metadata[k] = str(v) if not isinstance(v, str) else v
            else:
                clean_metadata[k] = str(v)
        
        # 添加到集合
        self._collection.upsert(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[clean_metadata]
        )
        
        return doc_id
    
    async def add_documents_batch(
        self,
        documents: List[Dict[str, Any]]
    ) -> List[str]:
        """
        批量添加文档
        
        Args:
            documents: 文档列表，每个包含 content, metadata, doc_id(可选)
        
        Returns:
            文档 ID 列表
        """
        self._ensure_initialized()
        
        if not documents:
            return []
        
        # 准备数据
        contents = [doc["content"] for doc in documents]
        doc_ids = []
        metadatas = []
        
        for doc in documents:
            doc_id = doc.get("doc_id") or self._generate_doc_id(
                doc["content"], 
                doc.get("metadata", {}).get("source_url", "unknown")
            )
            doc_ids.append(doc_id)
            
            # 清理 metadata
            clean_metadata = {}
            for k, v in doc.get("metadata", {}).items():
                if isinstance(v, list):
                    clean_metadata[k] = json.dumps(v, ensure_ascii=False)
                elif isinstance(v, (str, int, float, bool)):
                    clean_metadata[k] = str(v) if not isinstance(v, str) else v
                else:
                    clean_metadata[k] = str(v)
            metadatas.append(clean_metadata)
        
        # 批量获取 Embedding
        embeddings = await self._get_embeddings_batch(contents)
        
        # 批量添加
        self._collection.upsert(
            ids=doc_ids,
            embeddings=embeddings,
            documents=contents,
            metadatas=metadatas
        )
        
        return doc_ids
    
    async def search(
        self,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        语义检索
        
        Args:
            query: 查询文本
            n_results: 返回结果数量
            filter_metadata: 元数据过滤条件
        
        Returns:
            检索结果列表
        """
        self._ensure_initialized()
        
        # 获取查询的 Embedding
        query_embedding = await self._get_embedding(query)
        
        # 构建查询参数
        query_params = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"]
        }
        
        if filter_metadata:
            query_params["where"] = filter_metadata
        
        # 执行查询
        results = self._collection.query(**query_params)
        
        # 格式化结果
        formatted_results = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                result = {
                    "id": doc_id,
                    "content": results["documents"][0][i] if results["documents"] else "",
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                    "relevance_score": 1 - (results["distances"][0][i] if results["distances"] else 0)
                }
                formatted_results.append(result)
        
        return formatted_results
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """获取集合统计信息"""
        self._ensure_initialized()
        
        return {
            "name": self.collection_name,
            "count": self._collection.count(),
            "persist_directory": self.persist_directory
        }
    
    def clear_collection(self):
        """清空集合"""
        self._ensure_initialized()
        
        # 删除并重建集合
        self._client.delete_collection(self.collection_name)
        self._collection = self._client.create_collection(
            name=self.collection_name,
            metadata={"description": "Prompt engineering knowledge base"}
        )


# 全局 RAG 服务实例
_rag_service: Optional[RAGService] = None


def get_rag_service(
    embedding_api_key: Optional[str] = None,
    embedding_base_url: Optional[str] = None
) -> RAGService:
    """获取 RAG 服务实例"""
    global _rag_service
    
    if _rag_service is None:
        _rag_service = RAGService(
            embedding_api_key=embedding_api_key,
            embedding_base_url=embedding_base_url
        )
    
    return _rag_service
