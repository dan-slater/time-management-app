#!/usr/bin/env python3
"""
Test script to verify task persistence in the time management app
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class TaskPersistenceTest:
    def __init__(self, app_url="http://143.198.130.100"):
        self.app_url = app_url
        self.driver = None
        self.test_task = "Test task for persistence - " + str(int(time.time()))
        
    def setup_driver(self):
        """Setup Chrome driver with appropriate options"""
        options = webdriver.ChromeOptions()
        # Add options for headless mode if needed
        # options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        
    def teardown_driver(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()
            
    def wait_for_element(self, by, value, timeout=10):
        """Wait for element to be present"""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
        
    def add_task(self, task_text):
        """Add a task to the app"""
        print(f"📝 Adding task: '{task_text}'")
        
        # Find and fill the input field
        task_input = self.wait_for_element(By.ID, "taskInput")
        task_input.clear()
        task_input.send_keys(task_text)
        
        # Click the add button
        add_button = self.driver.find_element(By.ID, "addTaskBtn")
        add_button.click()
        
        # Wait a bit for the task to be added
        time.sleep(1)
        
    def get_task_count(self):
        """Get the number of tasks displayed"""
        try:
            task_list = self.driver.find_element(By.ID, "taskList")
            tasks = task_list.find_elements(By.CLASS_NAME, "task-item")
            return len(tasks)
        except:
            return 0
            
    def get_task_texts(self):
        """Get all task texts currently displayed"""
        try:
            task_list = self.driver.find_element(By.ID, "taskList")
            tasks = task_list.find_elements(By.CLASS_NAME, "task-text")
            return [task.text for task in tasks]
        except:
            return []
            
    def check_api_response(self):
        """Check the API response by navigating to /api/tasks"""
        print("🔍 Checking API response...")
        self.driver.get(f"{self.app_url}/api/tasks")
        time.sleep(2)
        
        page_source = self.driver.page_source
        print(f"API Response: {page_source}")
        return page_source
        
    def run_persistence_test(self):
        """Run the full persistence test"""
        print(f"🚀 Starting persistence test for {self.app_url}")
        
        try:
            self.setup_driver()
            
            # Step 1: Load the app
            print("📱 Loading the app...")
            self.driver.get(self.app_url)
            time.sleep(3)
            
            # Check initial state
            initial_count = self.get_task_count()
            print(f"📊 Initial task count: {initial_count}")
            
            # Step 2: Add a task
            self.add_task(self.test_task)
            
            # Step 3: Verify task was added
            after_add_count = self.get_task_count()
            task_texts = self.get_task_texts()
            print(f"📊 After adding task count: {after_add_count}")
            print(f"📋 Current tasks: {task_texts}")
            
            if self.test_task in task_texts:
                print("✅ Task successfully added to UI")
            else:
                print("❌ Task NOT found in UI after adding")
                
            # Step 4: Check API directly
            api_response = self.check_api_response()
            
            # Go back to main app
            self.driver.get(self.app_url)
            time.sleep(2)
            
            # Step 5: Refresh the page
            print("🔄 Refreshing the page...")
            self.driver.refresh()
            time.sleep(3)
            
            # Step 6: Check if task persisted after refresh
            after_refresh_count = self.get_task_count()
            after_refresh_tasks = self.get_task_texts()
            print(f"📊 After refresh task count: {after_refresh_count}")
            print(f"📋 Tasks after refresh: {after_refresh_tasks}")
            
            if self.test_task in after_refresh_tasks:
                print("✅ Task PERSISTED after refresh!")
            else:
                print("❌ Task DID NOT persist after refresh")
                
            # Step 7: Open new browser window
            print("🆕 Opening new browser window...")
            self.driver.execute_script("window.open('');")
            self.driver.switch_to.window(self.driver.window_handles[1])
            self.driver.get(self.app_url)
            time.sleep(3)
            
            # Step 8: Check if task exists in new window
            new_window_count = self.get_task_count()
            new_window_tasks = self.get_task_texts()
            print(f"📊 New window task count: {new_window_count}")
            print(f"📋 Tasks in new window: {new_window_tasks}")
            
            if self.test_task in new_window_tasks:
                print("✅ Task PERSISTED in new browser window!")
                return True
            else:
                print("❌ Task DID NOT persist in new browser window")
                return False
                
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            return False
        finally:
            self.teardown_driver()

def main():
    """Run the test"""
    tester = TaskPersistenceTest()
    success = tester.run_persistence_test()
    
    if success:
        print("\n🎉 PERSISTENCE TEST PASSED")
    else:
        print("\n💥 PERSISTENCE TEST FAILED")
        
    return success

if __name__ == "__main__":
    main()