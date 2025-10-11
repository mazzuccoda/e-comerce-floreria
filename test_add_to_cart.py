#!/usr/bin/env python
import requests
import json

# Test agregar producto al carrito
url = "http://localhost:8000/api/carrito/simple/add/"
data = {
    "product_id": 1,
    "quantity": 1
}

headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

try:
    print("Testing add to cart API...")
    print(f"URL: {url}")
    print(f"Data: {data}")
    
    response = requests.post(url, json=data, headers=headers, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Add to cart successful!")
    else:
        print("FAILED: Add to cart failed!")
        
except Exception as e:
    print(f"ERROR: {e}")
