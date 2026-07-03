import urllib.request
import json
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing GET /api/health...")
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/health")
        data = json.loads(req.read().decode())
        assert data["status"] == "healthy"
        print("[PASS] Health check passed!")
    except Exception as e:
        print(f"[FAIL] Health check failed: {e}")
        sys.exit(1)

def test_boards():
    print("Testing GET /api/boards...")
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/boards")
        boards = json.loads(req.read().decode())
        assert len(boards) > 0
        assert "board_decor" in [b["id"] for b in boards]
        print(f"[PASS] Board retrieval passed! Loaded {len(boards)} boards.")
    except Exception as e:
        print(f"[FAIL] Board retrieval failed: {e}")
        sys.exit(1)

def test_products():
    print("Testing GET /api/products...")
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/products")
        products = json.loads(req.read().decode())
        assert len(products) == 47
        print(f"[PASS] Product catalog loaded successfully! Found {len(products)} products.")
    except Exception as e:
        print(f"[FAIL] Product catalog failed: {e}")
        sys.exit(1)

def test_search():
    print("Testing POST /api/search...")
    search_payload = {
        "category": "Sofa",
        "style": "Cozy Modern",
        "tags": ["sofa", "beige", "cozy"],
        "color": "#e6dfd3",
        "activeBoardId": "board_decor"
    }
    
    req_data = json.dumps(search_payload).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/api/search",
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            results = json.loads(response.read().decode())
            assert len(results) > 0
            
            # The top matched item should be the exact sofa since the query aligns perfectly with its attributes
            top_match = results[0]
            print(f"Top Recommendation: {top_match['product']['name']} by {top_match['product']['brand']}")
            print(f"Match Score: {top_match['score']}%")
            print(f"Explanation: {top_match['explanation']}")
            
            assert top_match['score'] > 80
            print("[PASS] Vector Search and Graph Personalization ranking passed!")
    except Exception as e:
        print(f"[FAIL] Search recommendation failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("Starting integration test suite...")
    test_health()
    test_boards()
    test_products()
    test_search()
    print("ALL backend integration tests completed successfully!")
