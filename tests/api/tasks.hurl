# Task Management API Tests
# Tests all task-related endpoints

# Test 1: Health Check
GET {{base_url}}/health
HTTP 200
[Asserts]
jsonpath "$.status" == "healthy"
jsonpath "$.tasksCount" isInteger
jsonpath "$.eventsCount" isInteger

# Test 2: Get all tasks (initially empty)
GET {{base_url}}/api/tasks
HTTP 200
[Asserts]
jsonpath "$" isCollection

# Test 3: Create a new task
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Test task from Hurl"
}
HTTP 201
[Asserts]
jsonpath "$.id" isInteger
jsonpath "$.text" == "Test task from Hurl"
jsonpath "$.completed" == false
jsonpath "$.createdAt" isString
[Captures]
task_id: jsonpath "$.id"

# Test 4: Get all tasks (should have one now)
GET {{base_url}}/api/tasks
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$" count == 1
jsonpath "$[0].text" == "Test task from Hurl"

# Test 5: Create another task
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": "Second test task"
}
HTTP 201
[Captures]
second_task_id: jsonpath "$.id"

# Test 6: Update task text (new editing feature)
PUT {{base_url}}/api/tasks/{{task_id}}
Content-Type: application/json
{
  "text": "Updated task text"
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{task_id}}
jsonpath "$.text" == "Updated task text"
jsonpath "$.completed" == false

# Test 7: Mark task as completed
PUT {{base_url}}/api/tasks/{{task_id}}
Content-Type: application/json
{
  "completed": true
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{task_id}}
jsonpath "$.completed" == true
jsonpath "$.completedAt" isString

# Test 8: Mark task as uncompleted
PUT {{base_url}}/api/tasks/{{task_id}}
Content-Type: application/json
{
  "completed": false
}
HTTP 200
[Asserts]
jsonpath "$.id" == {{task_id}}
jsonpath "$.completed" == false
jsonpath "$.completedAt" == null

# Test 9: Try to update non-existent task
PUT {{base_url}}/api/tasks/99999
Content-Type: application/json
{
  "text": "This should fail"
}
HTTP 404
[Asserts]
jsonpath "$.error" == "Task not found"

# Test 10: Delete a task
DELETE {{base_url}}/api/tasks/{{second_task_id}}
HTTP 200
[Asserts]
jsonpath "$.message" == "Task deleted successfully"

# Test 11: Try to delete non-existent task
DELETE {{base_url}}/api/tasks/99999
HTTP 404
[Asserts]
jsonpath "$.error" == "Task not found"

# Test 12: Verify task was deleted
GET {{base_url}}/api/tasks
HTTP 200
[Asserts]
jsonpath "$" count == 1
jsonpath "$[0].id" == {{task_id}}

# Test 13: Create task with empty text (should fail)
POST {{base_url}}/api/tasks
Content-Type: application/json
{
  "text": ""
}
HTTP 500

# Test 14: Create task without text field
POST {{base_url}}/api/tasks
Content-Type: application/json
{}
HTTP 500

# Cleanup: Delete the remaining test task
DELETE {{base_url}}/api/tasks/{{task_id}}
HTTP 200