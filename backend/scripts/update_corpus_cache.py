#!/usr/bin/env python3
"""
更新 _all_documents.json，添加新爬取的语料库文档
"""
import json
from pathlib import Path


def load_corpus_file(filepath: Path) -> list:
    """从单个语料库文件加载文档块"""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    documents = []
    chunks = data.get("chunks", [])
    
    for i, chunk in enumerate(chunks):
        doc = {
            "doc_id": f"{data['id']}_chunk_{i}",
            "content": chunk,
            "metadata": {
                "source_id": data["id"],
                "source_type": data.get("type", "guide"),
                "source_url": data.get("url", ""),
                "priority": data.get("priority", "P1"),
                "topic": data.get("topic", "prompting"),
                "tags": ",".join(data.get("tags", [])),
                "notes": data.get("notes", ""),
                "chunk_index": i,
                "total_chunks": len(chunks),
                "type": "corpus_knowledge"
            }
        }
        documents.append(doc)
    
    return documents


def update_all_documents():
    """更新 _all_documents.json"""
    cache_dir = Path(__file__).parent.parent / "data" / "corpus_cache"
    all_docs_file = cache_dir / "_all_documents.json"
    
    # 加载现有文档
    if all_docs_file.exists():
        with open(all_docs_file, "r", encoding="utf-8") as f:
            existing_docs = json.load(f)
        print(f"已加载 {len(existing_docs)} 个现有文档")
    else:
        existing_docs = []
        print("未找到现有文档，将创建新文件")
    
    # 获取现有文档的 source_id 集合
    existing_source_ids = set()
    for doc in existing_docs:
        source_id = doc.get("metadata", {}).get("source_id", "")
        existing_source_ids.add(source_id)
    
    # 新增的语料库文件
    new_corpus_files = [
        "OPENAI_GPT5_PROMPTING_GUIDE.json",
        "OPENAI_GPT41_PROMPTING_GUIDE.json",
        "OPENAI_PROMPT_PERSONALITIES.json",
        "OPENAI_CUSTOMER_SERVICE_EXAMPLE.json",
        "OPENAI_REALTIME_PROMPTING_GUIDE.json",
    ]
    
    new_docs = []
    for filename in new_corpus_files:
        filepath = cache_dir / filename
        if filepath.exists():
            source_id = filename.replace(".json", "")
            if source_id not in existing_source_ids:
                docs = load_corpus_file(filepath)
                new_docs.extend(docs)
                print(f"✅ 添加 {filename}: {len(docs)} 个文档块")
            else:
                print(f"⏭️ 跳过 {filename}: 已存在")
        else:
            print(f"❌ 未找到 {filename}")
    
    # 合并文档
    all_docs = existing_docs + new_docs
    
    # 保存
    with open(all_docs_file, "w", encoding="utf-8") as f:
        json.dump(all_docs, f, ensure_ascii=False, indent=2)
    
    print(f"\n📊 更新完成！")
    print(f"   原有文档: {len(existing_docs)}")
    print(f"   新增文档: {len(new_docs)}")
    print(f"   总计文档: {len(all_docs)}")


if __name__ == "__main__":
    update_all_documents()
