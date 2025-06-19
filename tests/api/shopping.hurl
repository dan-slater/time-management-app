# Shopping List API Tests
# Tests all shopping list endpoints

# Test 1: Get all shopping items (initially empty)
GET {{base_url}}/api/shopping
HTTP 200
[Asserts]
jsonpath "$" isCollection

# Test 2: Create a new shopping item
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "Test item from Hurl",
  "quantity": 2
}
HTTP 201
[Asserts]
jsonpath "$.id" isInteger
jsonpath "$.name" == "Test item from Hurl"
jsonpath "$.quantity" == 2
jsonpath "$.purchased" == false
jsonpath "$.createdAt" isString
[Captures]
item_id: jsonpath "$.id"

# Test 3: Create shopping item with default quantity
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "Item with default quantity"
}
HTTP 201
[Asserts]
jsonpath "$.quantity" == 1
[Captures]
second_item_id: jsonpath "$.id"

# Test 4: Get all shopping items (should have two now)
GET {{base_url}}/api/shopping
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$" count == 2

# Test 5: Update shopping item name and quantity
PUT {{base_url}}/api/shopping/{{item_id}}
Content-Type: application/json
{
  "name": "Updated item name",
  "quantity": 5
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{item_id}}
jsonpath "$.name" == "Updated item name"
jsonpath "$.quantity" == 5
jsonpath "$.purchased" == false

# Test 6: Mark item as purchased
PUT {{base_url}}/api/shopping/{{item_id}}
Content-Type: application/json
{
  "purchased": true
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{item_id}}
jsonpath "$.purchased" == true
jsonpath "$.purchasedAt" isString

# Test 7: Mark item as unpurchased
PUT {{base_url}}/api/shopping/{{item_id}}
Content-Type: application/json
{
  "purchased": false
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{item_id}}
jsonpath "$.purchased" == false
jsonpath "$.purchasedAt" == null

# Test 8: Update only name (quantity should remain)
PUT {{base_url}}/api/shopping/{{item_id}}
Content-Type: application/json
{
  "name": "Final item name"
}
HTTP 200
[Asserts]
jsonpath "$.name" == "Final item name"
jsonpath "$.quantity" == 5

# Test 9: Try to update non-existent item
PUT {{base_url}}/api/shopping/99999
Content-Type: application/json
{
  "name": "This should fail"
}
HTTP 404
[Asserts]
jsonpath "$.error" == "Shopping item not found"

# Test 10: Delete a shopping item
DELETE {{base_url}}/api/shopping/{{second_item_id}}
HTTP 200
[Asserts]
jsonpath "$.message" == "Shopping item deleted successfully"

# Test 11: Try to delete non-existent item
DELETE {{base_url}}/api/shopping/99999
HTTP 404
[Asserts]
jsonpath "$.error" == "Shopping item not found"

# Test 12: Verify item was deleted
GET {{base_url}}/api/shopping
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].id" == {{item_id}}

# Test 13: Create item with empty name (should fail)
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": ""
}
HTTP 500

# Test 14: Create item without name field
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "quantity": 3
}
HTTP 500

# Test 15: Create item with invalid quantity
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "Valid item",
  "quantity": -1
}
HTTP 201
[Asserts]
jsonpath "$.quantity" == 1
[Captures]
invalid_qty_item: jsonpath "$.id"

# Cleanup: Delete test shopping items
DELETE {{base_url}}/api/shopping/{{item_id}}
HTTP 200

DELETE {{base_url}}/api/shopping/{{invalid_qty_item}}
HTTP 200