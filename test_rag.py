import requests

print("Uploading dummy resume to chunk and store in Chroma...")
url_upload = 'http://127.0.0.1:8000/api/resumes/upload'
with open('dummy_resume.pdf', 'rb') as f:
    files = {'file': f}
    res_up = requests.post(url_upload, files=files)
print(f"Upload Status: {res_up.status_code}")

print("Searching ChromaDB for 'Python'...")
url_search = 'http://127.0.0.1:8000/api/rag/search'
payload = {'query': 'Python and React', 'top_k': 2}
res_search = requests.post(url_search, json=payload)
print(f"Search Status: {res_search.status_code}")
print("Results:")
import json
print(json.dumps(res_search.json(), indent=2))
