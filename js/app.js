class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.baseURL = window.location.origin; // Automatically detect server URL
        this.init();
    }

    async init() {
        this.initTheme();
        await this.loadTasks();
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
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const themeToggle = document.getElementById('themeToggle');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
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

    render() {
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
                        <span class="task-text">${task.text}</span>
                        <small class="task-date">${new Date(task.createdAt).toLocaleDateString()}</small>
                    </div>
                    <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">×</button>
                `;
                taskList.appendChild(li);
            });
        }

        this.updateStats();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completedTasks').textContent = completed;
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

    loadFromLocalStorage() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
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
