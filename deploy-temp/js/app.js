class TaskManager {
    constructor() {
        this.tasks = [];
        this.shoppingItems = [];
        this.currentFilter = 'all';
        this.currentShoppingFilter = 'all';
        this.currentTab = 'tasks';
        this.baseURL = window.location.origin;
        this.init();
    }

    async init() {
        this.initTheme();
        await this.loadTasks();
        await this.loadShoppingItems();
        this.bindEvents();
        this.render();
    }

    initTheme() {
        // Check for saved theme preference or default to light mode
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    bindEvents() {
        // Task events
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const themeToggle = document.getElementById('themeToggle');

        // Shopping events
        const addShoppingBtn = document.getElementById('addShoppingBtn');
        const shoppingInput = document.getElementById('shoppingInput');
        const quantityInput = document.getElementById('quantityInput');
        const shoppingFilterBtns = document.querySelectorAll('.shopping-filter-btn');

        // Tab events
        const tabBtns = document.querySelectorAll('.tab-btn');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        addShoppingBtn.addEventListener('click', () => this.addShoppingItem());
        shoppingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addShoppingItem();
        });
        quantityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addShoppingItem();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        shoppingFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setShoppingFilter(e.target.dataset.filter);
            });
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });

        this.render();
    }

    async addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (!text) return;

        try {
            const response = await fetch(`${this.baseURL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            if (response.ok) {
                const newTask = await response.json();
                this.tasks.push(newTask);
                input.value = '';
                this.render();
            } else {
                console.error('Failed to add task');
                alert('Failed to add task. Please try again.');
            }
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Error adding task. Please check your connection.');
        }
    }

    async toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        try {
            const response = await fetch(`${this.baseURL}/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !task.completed })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                const taskIndex = this.tasks.findIndex(t => t.id === id);
                this.tasks[taskIndex] = updatedTask;
                this.render();
            } else {
                console.error('Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    async deleteTask(id) {
        try {
            const response = await fetch(`${this.baseURL}/api/tasks/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.render();
            } else {
                console.error('Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    editTask(id) {
        const taskText = document.getElementById(`task-text-${id}`);
        const taskEdit = document.getElementById(`task-edit-${id}`);
        const editBtn = document.getElementById(`edit-btn-${id}`);
        const saveBtn = document.getElementById(`save-btn-${id}`);
        const cancelBtn = document.getElementById(`cancel-btn-${id}`);

        taskText.style.display = 'none';
        taskEdit.style.display = 'inline-block';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';

        taskEdit.focus();
        taskEdit.select();
    }

    async saveTask(id) {
        const taskEdit = document.getElementById(`task-edit-${id}`);
        const newText = taskEdit.value.trim();

        if (!newText) {
            alert('Task text cannot be empty');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/api/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: newText })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                const taskIndex = this.tasks.findIndex(t => t.id === id);
                this.tasks[taskIndex] = updatedTask;
                this.render();
            } else {
                console.error('Failed to update task');
                alert('Failed to update task. Please try again.');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error updating task. Please check your connection.');
        }
    }

    cancelEdit(id) {
        const task = this.tasks.find(t => t.id === id);
        const taskText = document.getElementById(`task-text-${id}`);
        const taskEdit = document.getElementById(`task-edit-${id}`);
        const editBtn = document.getElementById(`edit-btn-${id}`);
        const saveBtn = document.getElementById(`save-btn-${id}`);
        const cancelBtn = document.getElementById(`cancel-btn-${id}`);

        taskEdit.value = task.text; // Reset to original value
        taskText.style.display = 'inline';
        taskEdit.style.display = 'none';
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }

    async addShoppingItem() {
        const nameInput = document.getElementById('shoppingInput');
        const quantityInput = document.getElementById('quantityInput');
        const name = nameInput.value.trim();
        const quantity = parseInt(quantityInput.value) || 1;

        if (!name) return;

        try {
            const response = await fetch(`${this.baseURL}/api/shopping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name, quantity: quantity })
            });

            if (response.ok) {
                const newItem = await response.json();
                this.shoppingItems.push(newItem);
                nameInput.value = '';
                quantityInput.value = '1';
                this.render();
            } else {
                console.error('Failed to add shopping item');
                alert('Failed to add shopping item. Please try again.');
            }
        } catch (error) {
            console.error('Error adding shopping item:', error);
            alert('Error adding shopping item. Please check your connection.');
        }
    }

    async toggleShoppingItem(id) {
        const item = this.shoppingItems.find(i => i.id === id);
        if (!item) return;

        try {
            const response = await fetch(`${this.baseURL}/api/shopping/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ purchased: !item.purchased })
            });

            if (response.ok) {
                const updatedItem = await response.json();
                const itemIndex = this.shoppingItems.findIndex(i => i.id === id);
                this.shoppingItems[itemIndex] = updatedItem;
                this.render();
            } else {
                console.error('Failed to update shopping item');
            }
        } catch (error) {
            console.error('Error updating shopping item:', error);
        }
    }

    async deleteShoppingItem(id) {
        try {
            const response = await fetch(`${this.baseURL}/api/shopping/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.shoppingItems = this.shoppingItems.filter(i => i.id !== id);
                this.render();
            } else {
                console.error('Failed to delete shopping item');
            }
        } catch (error) {
            console.error('Error deleting shopping item:', error);
        }
    }

    editShoppingItem(id) {
        const itemText = document.getElementById(`shopping-text-${id}`);
        const itemEdit = document.getElementById(`shopping-edit-${id}`);
        const quantityText = document.getElementById(`shopping-quantity-${id}`);
        const quantityEdit = document.getElementById(`shopping-quantity-edit-${id}`);
        const editBtn = document.getElementById(`shopping-edit-btn-${id}`);
        const saveBtn = document.getElementById(`shopping-save-btn-${id}`);
        const cancelBtn = document.getElementById(`shopping-cancel-btn-${id}`);

        itemText.style.display = 'none';
        quantityText.style.display = 'none';
        itemEdit.style.display = 'inline-block';
        quantityEdit.style.display = 'inline-block';
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';

        itemEdit.focus();
        itemEdit.select();
    }

    async saveShoppingItem(id) {
        const itemEdit = document.getElementById(`shopping-edit-${id}`);
        const quantityEdit = document.getElementById(`shopping-quantity-edit-${id}`);
        const newName = itemEdit.value.trim();
        const newQuantity = parseInt(quantityEdit.value) || 1;

        if (!newName) {
            alert('Item name cannot be empty');
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/api/shopping/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName, quantity: newQuantity })
            });

            if (response.ok) {
                const updatedItem = await response.json();
                const itemIndex = this.shoppingItems.findIndex(i => i.id === id);
                this.shoppingItems[itemIndex] = updatedItem;
                this.render();
            } else {
                console.error('Failed to update shopping item');
                alert('Failed to update shopping item. Please try again.');
            }
        } catch (error) {
            console.error('Error updating shopping item:', error);
            alert('Error updating shopping item. Please check your connection.');
        }
    }

    cancelShoppingEdit(id) {
        const item = this.shoppingItems.find(i => i.id === id);
        const itemText = document.getElementById(`shopping-text-${id}`);
        const itemEdit = document.getElementById(`shopping-edit-${id}`);
        const quantityText = document.getElementById(`shopping-quantity-${id}`);
        const quantityEdit = document.getElementById(`shopping-quantity-edit-${id}`);
        const editBtn = document.getElementById(`shopping-edit-btn-${id}`);
        const saveBtn = document.getElementById(`shopping-save-btn-${id}`);
        const cancelBtn = document.getElementById(`shopping-cancel-btn-${id}`);

        itemEdit.value = item.name;
        quantityEdit.value = item.quantity;
        itemText.style.display = 'inline';
        quantityText.style.display = 'inline';
        itemEdit.style.display = 'none';
        quantityEdit.style.display = 'none';
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }

    setShoppingFilter(filter) {
        this.currentShoppingFilter = filter;
        document.querySelectorAll('.shopping-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
        case 'pending':
            return this.tasks.filter(t => !t.completed);
        case 'completed':
            return this.tasks.filter(t => t.completed);
        default:
            return this.tasks;
        }
    }

    getFilteredShoppingItems() {
        switch (this.currentShoppingFilter) {
        case 'pending':
            return this.shoppingItems.filter(i => !i.purchased);
        case 'purchased':
            return this.shoppingItems.filter(i => i.purchased);
        default:
            return this.shoppingItems;
        }
    }

    render() {
        if (this.currentTab === 'tasks') {
            this.renderTasks();
        } else if (this.currentTab === 'shopping') {
            this.renderShoppingItems();
        }
        this.updateStats();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li class="no-tasks">No tasks to display</li>';
        } else {
            filteredTasks.forEach(task => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`;
                li.innerHTML = `
                    <div class="task-content">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="taskManager.toggleTask(${task.id})">
                        <span class="task-text" id="task-text-${task.id}">${task.text}</span>
                        <input type="text" class="task-edit-input" id="task-edit-${task.id}" 
                               value="${task.text}" style="display: none;">
                        <small class="task-date">${new Date(task.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" id="edit-btn-${task.id}" onclick="taskManager.editTask(${task.id})">✏️</button>
                        <button class="save-btn" id="save-btn-${task.id}" onclick="taskManager.saveTask(${task.id})" style="display: none;">✓</button>
                        <button class="cancel-btn" id="cancel-btn-${task.id}" onclick="taskManager.cancelEdit(${task.id})" style="display: none;">✕</button>
                        <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">×</button>
                    </div>
                `;
                taskList.appendChild(li);
            });
        }
    }

    renderShoppingItems() {
        const shoppingList = document.getElementById('shoppingList');
        const filteredItems = this.getFilteredShoppingItems();

        shoppingList.innerHTML = '';

        if (filteredItems.length === 0) {
            shoppingList.innerHTML = '<li class="no-items">No items to display</li>';
        } else {
            filteredItems.forEach(item => {
                const li = document.createElement('li');
                li.className = `shopping-item ${item.purchased ? 'purchased' : ''}`;
                li.innerHTML = `
                    <div class="shopping-content">
                        <input type="checkbox" ${item.purchased ? 'checked' : ''} 
                               onchange="taskManager.toggleShoppingItem(${item.id})">
                        <span class="shopping-text" id="shopping-text-${item.id}">${item.name}</span>
                        <input type="text" class="shopping-edit-input" id="shopping-edit-${item.id}" 
                               value="${item.name}" style="display: none;">
                        <span class="shopping-quantity" id="shopping-quantity-${item.id}">Qty: ${item.quantity}</span>
                        <input type="number" class="shopping-quantity-edit" id="shopping-quantity-edit-${item.id}" 
                               value="${item.quantity}" min="1" style="display: none;">
                        <small class="shopping-date">${new Date(item.createdAt).toLocaleDateString()}</small>
                    </div>
                    <div class="shopping-actions">
                        <button class="edit-btn" id="shopping-edit-btn-${item.id}" onclick="taskManager.editShoppingItem(${item.id})">✏️</button>
                        <button class="save-btn" id="shopping-save-btn-${item.id}" onclick="taskManager.saveShoppingItem(${item.id})" style="display: none;">✓</button>
                        <button class="cancel-btn" id="shopping-cancel-btn-${item.id}" onclick="taskManager.cancelShoppingEdit(${item.id})" style="display: none;">✕</button>
                        <button class="delete-btn" onclick="taskManager.deleteShoppingItem(${item.id})">×</button>
                    </div>
                `;
                shoppingList.appendChild(li);
            });
        }
    }

    updateStats() {
        if (this.currentTab === 'tasks') {
            const total = this.tasks.length;
            const completed = this.tasks.filter(t => t.completed).length;
            const pending = total - completed;

            document.getElementById('totalTasks').textContent = total;
            document.getElementById('pendingTasks').textContent = pending;
            document.getElementById('completedTasks').textContent = completed;
        } else if (this.currentTab === 'shopping') {
            const total = this.shoppingItems.length;
            const purchased = this.shoppingItems.filter(i => i.purchased).length;
            const pending = total - purchased;

            document.getElementById('totalItems').textContent = total;
            document.getElementById('pendingItems').textContent = pending;
            document.getElementById('purchasedItems').textContent = purchased;
        }
    }

    async loadTasks() {
        try {
            const response = await fetch(`${this.baseURL}/api/tasks`);
            if (response.ok) {
                this.tasks = await response.json();
            } else {
                console.error('Failed to load tasks from server');
                // Fallback to localStorage for offline mode
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            // Fallback to localStorage for offline mode
            this.loadFromLocalStorage();
        }
    }

    async loadShoppingItems() {
        try {
            const response = await fetch(`${this.baseURL}/api/shopping`);
            if (response.ok) {
                this.shoppingItems = await response.json();
            } else {
                console.error('Failed to load shopping items from server');
                this.loadShoppingFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading shopping items:', error);
            this.loadShoppingFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }

    loadShoppingFromLocalStorage() {
        const saved = localStorage.getItem('shoppingItems');
        if (saved) {
            this.shoppingItems = JSON.parse(saved);
        }
    }

    async clearCompleted() {
        const completedTasks = this.tasks.filter(t => t.completed);

        try {
            // Delete all completed tasks
            const deletePromises = completedTasks.map(task =>
                fetch(`${this.baseURL}/api/tasks/${task.id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);
            this.tasks = this.tasks.filter(t => !t.completed);
            this.render();
        } catch (error) {
            console.error('Error clearing completed tasks:', error);
        }
    }
}

// Initialize the app
const taskManager = new TaskManager();
