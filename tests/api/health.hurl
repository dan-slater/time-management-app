# Health Check and System Tests
# Tests system health, CORS, and edge cases

# Test 1: Basic health check
GET {{base_url}}/health
HTTP 200
[Asserts]
jsonpath "$.status" == "healthy"
jsonpath "$.timestamp" isString
jsonpath "$.version" == "1.0.0"
jsonpath "$.dataDir" isString
jsonpath "$.tasksCount" isInteger
jsonpath "$.shoppingItemsCount" isInteger
jsonpath "$.eventsCount" isInteger

# Test 2: Test CORS headers (if running locally)
OPTIONS {{base_url}}/api/tasks
HTTP 200
[Asserts]
header "Access-Control-Allow-Origin" exists

# Test 3: Test invalid endpoint
GET {{base_url}}/api/nonexistent
HTTP 404

# Test 4: Test malformed JSON
POST {{base_url}}/api/tasks
Content-Type: application/json
{ invalid json }
HTTP 400

# Test 5: Test wrong content type
POST {{base_url}}/api/tasks
Content-Type: text/plain
{
  "text": "Should fail"
}
HTTP 500

# Test 6: Test very long task text
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "This is a very long task text that might test the limits of what the API can handle. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium."
}
HTTP 201
[Captures]
long_task_id: jsonpath "$.id"

# Test 7: Test special characters in task text
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Task with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?`~åßč"
}
HTTP 201
[Captures]
special_task_id: jsonpath "$.id"

# Test 8: Test Unicode characters
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Unicode test: 🚀 📝 ✅ 🎯 日本語 العربية Ελληνικά"
}
HTTP 201
[Captures]
unicode_task_id: jsonpath "$.id"

# Test 9: Test very large quantity for shopping
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "Large quantity item",
  "quantity": 999999
}
HTTP 201
[Asserts]
jsonpath "$.quantity" == 999999
[Captures]
large_qty_item: jsonpath "$.id"

# Test 10: Test zero quantity (should default to 1)
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "Zero quantity item",
  "quantity": 0
}
HTTP 201
[Asserts]
jsonpath "$.quantity" == 1
[Captures]
zero_qty_item: jsonpath "$.id"

# Test 11: Test shopping item with special characters
POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "Special shopping: café, naïve, résumé, 中文",
  "quantity": 2
}
HTTP 201
[Captures]
special_shopping_id: jsonpath "$.id"

# Test 12: Test concurrent requests (create multiple items quickly)
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Concurrent test 1"
}
HTTP 201
[Captures]
concurrent1: jsonpath "$.id"

POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Concurrent test 2"
}
HTTP 201
[Captures]
concurrent2: jsonpath "$.id"

POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Concurrent test 3"
}
HTTP 201
[Captures]
concurrent3: jsonpath "$.id"

# Test 13: Verify all concurrent items were created
GET {{base_url}}/api/tasks
HTTP 200
[Asserts]
jsonpath "$" count >= 6

# Test 14: Test rapid updates
PUT {{base_url}}/api/tasks/{{concurrent1}}
Content-Type: application/json
{
  "completed": true
}
HTTP 200

PUT {{base_url}}/api/tasks/{{concurrent1}}
Content-Type: application/json
{
  "text": "Updated concurrent test 1"
}
HTTP 200

PUT {{base_url}}/api/tasks/{{concurrent1}}
Content-Type: application/json
{
  "completed": false
}
HTTP 200

# Test 15: Check that all events were properly logged
GET {{base_url}}/api/history/events?limit=50
HTTP 200
[Asserts]
jsonpath "$.events" count > 10

# Cleanup: Delete all test items
DELETE {{base_url}}/api/tasks/{{long_task_id}}
HTTP 200

DELETE {{base_url}}/api/tasks/{{special_task_id}}
HTTP 200

DELETE {{base_url}}/api/tasks/{{unicode_task_id}}
HTTP 200

DELETE {{base_url}}/api/tasks/{{concurrent1}}
HTTP 200

DELETE {{base_url}}/api/tasks/{{concurrent2}}
HTTP 200

DELETE {{base_url}}/api/tasks/{{concurrent3}}
HTTP 200

DELETE {{base_url}}/api/shopping/{{large_qty_item}}
HTTP 200

DELETE {{base_url}}/api/shopping/{{zero_qty_item}}
HTTP 200

DELETE {{base_url}}/api/shopping/{{special_shopping_id}}
HTTP 200