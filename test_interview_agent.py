import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("  TESTING LANGGRAPH MULTI-AGENT ADAPTIVE INTERVIEW FLOW")
print("=" * 60)

# Step 1: Start Interview
start_payload = {
    "candidate_id": 1,
    "job_title": "Senior Backend Engineer (Python / FastAPI)",
    "total_questions": 3
}

print("\n1. Starting Interview Session...")
res = requests.post(f"{BASE_URL}/api/interviews/start", json=start_payload)
print(f"Status: {res.status_code}")
data = res.json()
print(json.dumps(data, indent=2))

interview_id = data["interview_id"]

# Sample answers to simulate a candidate interview
sample_answers = [
    "To build a rate limiter for 50k req/min, I'd implement a sliding window counter algorithm using Redis. We can maintain timestamps in a Redis sorted set and expire keys automatically, ensuring thread-safe distributed rate limiting with low latency.",
    "For ChromaDB optimization, I chunk text using LangChain recursive splitters, generate embeddings asynchronously, and use HNSW index parameters (like M and efConstruction) tuned for memory and sub-20ms search throughput.",
    "In SQLAlchemy with FastAPI, I use async_sessionmaker with AsyncEngine, configure pool_size=20, max_overflow=10, and pool_pre_ping=True to discard dead connections and avoid connection starvation under load."
]

# Step 2: Answer loop
for i, answer_text in enumerate(sample_answers, 1):
    print(f"\n--- Submitting Answer for Question {i} ---")
    print(f"Candidate Answer: \"{answer_text[:60]}...\"")
    
    sub_payload = {
        "interview_id": interview_id,
        "question_index": i,
        "user_answer": answer_text
    }
    
    sub_res = requests.post(f"{BASE_URL}/api/interviews/submit-answer", json=sub_payload)
    print(f"Status: {sub_res.status_code}")
    sub_data = sub_res.json()
    print(json.dumps(sub_data, indent=2))
    
    if sub_data.get("is_completed"):
        print("\n*** Interview completed successfully! ***")
        break

# Step 3: Fetch Full Report
print("\n--- Fetching Final Interview Performance Report ---")
report_res = requests.get(f"{BASE_URL}/api/interviews/{interview_id}/report")
print(f"Status: {report_res.status_code}")
print(json.dumps(report_res.json(), indent=2))
