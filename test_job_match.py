import requests
import json

url = "http://127.0.0.1:8000/api/jobs/match"

sample_job = """
Job Title: Senior Backend Engineer (Python / FastAPI)
Company: AI Tech Corp

Requirements:
- Strong experience with Python, FastAPI, and SQL database design.
- Hands-on experience with vector databases (ChromaDB / Pinecone) and LLM integrations (OpenAI, LangChain).
- Experience with Docker, Kubernetes, and AWS cloud deployment.
- Familiarity with Next.js or frontend frameworks is a plus.
- Excellent problem-solving and communication skills.
"""

payload = {
    "job_description": sample_job,
    "candidate_id": 1
}

print("Sending Job Description to AI Matcher endpoint...")
response = requests.post(url, json=payload)
print(f"Status Code: {response.status_code}")
try:
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Raw output:", response.text)
