#!/usr/bin/env python3
"""
将爬取的语料库内容索引到 ChromaDB 向量库
"""
import asyncio
import json
import os
import sys
from pathlib import Path

# 添加项目根目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.rag_service import RAGService


async def index_corpus(api_key: str):
    """将语料库索引到向量库"""
    corpus_dir = Path(__file__).parent.parent / "data" / "corpus_cache"
    all_docs_file = corpus_dir / "_all_documents.json"
    
    if not all_docs_file.exists():
        print("❌ 未找到语料库文件，请先运行 crawl_corpus.py")
        return
    
    with open(all_docs_file, "r", encoding="utf-8") as f:
        documents = json.load(f)
    
    print(f"📚 加载了 {len(documents)} 个文档块")
    
    # 创建 RAG 服务（使用专门的语料库集合）
    rag_service = RAGService(
        collection_name="prompt_corpus",
        embedding_api_key=api_key,
        embedding_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
    
    # 分批索引（每批 50 个）
    batch_size = 50
    total_indexed = 0
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        print(f"📤 正在索引批次 {i // batch_size + 1}/{(len(documents) + batch_size - 1) // batch_size}...")
        
        try:
            await rag_service.add_documents_batch(batch)
            total_indexed += len(batch)
            print(f"   ✅ 已索引 {total_indexed}/{len(documents)}")
        except Exception as e:
            print(f"   ❌ 索引失败: {e}")
            # 继续下一批
            continue
        
        # 避免 API 限流
        await asyncio.sleep(1)
    
    # 获取统计
    stats = rag_service.get_collection_stats()
    print(f"\n📊 索引完成！")
    print(f"   集合名称: {stats.get('name')}")
    print(f"   文档总数: {stats.get('count')}")


if __name__ == "__main__":
    # 从环境变量或命令行获取 API Key
    api_key = os.environ.get("DASHSCOPE_API_KEY") or (sys.argv[1] if len(sys.argv) > 1 else None)
    
    if not api_key:
        print("❌ 请提供 API Key:")
        print("   方式1: export DASHSCOPE_API_KEY=your_key && python scripts/index_corpus.py")
        print("   方式2: python scripts/index_corpus.py your_api_key")
        sys.exit(1)
    
    asyncio.run(index_corpus(api_key))
