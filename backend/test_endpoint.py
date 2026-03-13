import requests

with open("test_receipt_valid.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post("http://localhost:8000/scan/payment", files=files)

print("Status:", response.status_code)
print("Response:", response.text)
