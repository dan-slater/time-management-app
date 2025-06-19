# Historical Data API Tests
# Tests historical data, analytics, and export endpoints

# Setup: Create some test data first
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "History test task"
}
HTTP 201
[Captures]
history_task_id: jsonpath "$.id"

POST {{base_url}}/api/shopping
Content-Type: application/json
{
  "name": "History test item",
  "quantity": 1
}
HTTP 201
[Captures]
history_item_id: jsonpath "$.id"

# Test 1: Get all historical events
GET {{base_url}}/api/history/events
HTTP 200
[Asserts]
jsonpath "$.events" isCollection
jsonpath "$.total" isInteger
jsonpath "$.limit" == 100

# Test 2: Get events with limit
GET {{base_url}}/api/history/events?limit=5
HTTP 200
[Asserts]
jsonpath "$.events" count <= 5
jsonpath "$.limit" == 5

# Test 3: Get events by type (task_created)
GET {{base_url}}/api/history/events?type=task_created
HTTP 200
[Asserts]
jsonpath "$.events" isCollection
# All events should be task_created type
jsonpath "$.events[*].type" includes "task_created"

# Test 4: Get events by type (shopping_item_created)
GET {{base_url}}/api/history/events?type=shopping_item_created
HTTP 200
[Asserts]
jsonpath "$.events" isCollection

# Test 5: Get events by date range (today)
GET {{base_url}}/api/history/events?startDate={{today}}&endDate={{tomorrow}}
HTTP 200
[Asserts]
jsonpath "$.events" isCollection

# Test 6: Get analytics data
GET {{base_url}}/api/history/analytics
HTTP 200
[Asserts]
jsonpath "$.summary" exists
jsonpath "$.events" isCollection
jsonpath "$.metadata" exists

# Test 7: Get analytics with event type filter
GET {{base_url}}/api/history/analytics?eventTypes=task_created,task_completed
HTTP 200
[Asserts]
jsonpath "$.events" isCollection

# Test 8: Get snapshots list
GET {{base_url}}/api/history/snapshots
HTTP 200
[Asserts]
jsonpath "$" isCollection

# Test 9: Create manual snapshot
POST {{base_url}}/api/history/snapshots
Content-Type: application/json
{
  "reason": "API test snapshot"
}
HTTP 201
[Asserts]
jsonpath "$.id" isString
jsonpath "$.reason" == "API test snapshot"
jsonpath "$.timestamp" isString
[Captures]
snapshot_id: jsonpath "$.id"

# Test 10: Get specific snapshot
GET {{base_url}}/api/history/snapshots/{{snapshot_id}}
HTTP 200
[Asserts]
jsonpath "$.id" == "{{snapshot_id}}"
jsonpath "$.data" exists
jsonpath "$.metadata" exists

# Test 11: Try to get non-existent snapshot
GET {{base_url}}/api/history/snapshots/nonexistent
HTTP 404
[Asserts]
jsonpath "$.error" == "Snapshot not found"

# Test 12: Export data as JSON
GET {{base_url}}/api/history/export?format=json
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
header "Content-Disposition" contains "task_history.json"
jsonpath "$.events" isCollection
jsonpath "$.summary" exists

# Test 13: Export data as CSV
GET {{base_url}}/api/history/export?format=csv
HTTP 200
[Asserts]
header "Content-Type" == "text/csv"
header "Content-Disposition" contains "task_history.csv"
# Check that CSV has proper headers
body contains "id,type,timestamp"

# Test 14: Export with event type filter
GET {{base_url}}/api/history/export?eventTypes=task_created&format=json
HTTP 200
[Asserts]
jsonpath "$.events" isCollection

# Test 15: Verify events were logged during our test
# Complete the task we created to generate more events
PUT {{base_url}}/api/tasks/{{history_task_id}}
Content-Type: application/json
{
  "completed": true
}
HTTP 200

# Check that task_completed event was logged
GET {{base_url}}/api/history/events?type=task_completed&limit=1
HTTP 200
[Asserts]
jsonpath "$.events" count >= 1
jsonpath "$.events[0].type" == "task_completed"

# Test 16: Update shopping item to generate shopping events
PUT {{base_url}}/api/shopping/{{history_item_id}}
Content-Type: application/json
{
  "purchased": true
}
HTTP 200

# Check that shopping_item_purchased event was logged
GET {{base_url}}/api/history/events?type=shopping_item_purchased&limit=1
HTTP 200
[Asserts]
jsonpath "$.events" count >= 1

# Cleanup: Delete test data
DELETE {{base_url}}/api/tasks/{{history_task_id}}
HTTP 200

DELETE {{base_url}}/api/shopping/{{history_item_id}}
HTTP 200