import httpx
import json

def test_lookup():
    url = "http://127.0.0.1:8000/api/v1/profile/analyze"
    payload = {"username": "dilrajsingh6856-bit"}
    print(f"Sending request to {url} with payload {payload}...")
    try:
        response = httpx.post(url, json=payload, timeout=45.0)
        print(f"Response Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("API SUCCESS! Here is a summary of the returned evaluation:")
            print(f"Username: {data.get('github_username')}")
            print(f"Portfolio Score: {data.get('portfolio_quality_score')}")
            print(f"Internship Readiness Score: {data.get('internship_readiness_score')}")
            print(f"Strengths: {data.get('strengths')}")
            print(f"Weaknesses: {data.get('weaknesses')}")
            print(f"Repos Extracted Count: {len(data.get('repositories') or [])}")
        else:
            print(f"API Error Response: {response.text}")
    except Exception as e:
        print(f"Connection Exception: {e}")

if __name__ == "__main__":
    test_lookup()
