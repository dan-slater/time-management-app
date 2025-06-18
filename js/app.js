class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadTasks();
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const filterBtns = document.querySelectorAll('.filter-btn');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) return;

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        input.value = '';
        this.saveTasks();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
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

    saveTasks() {
        // For now, save to localStorage (later can be enhanced to save to file)
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        
        // Also prepare data for potential file export
        this.exportToFile();
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }

    exportToFile() {
        // Create a downloadable JSON file with tasks
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        // This creates a virtual download for the file
        // In a real GitHub workflow, you'd commit this to the repo
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
        
        // For development, we'll just log it
        console.log('Tasks data ready for export:', dataStr);
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
    }
}

// Initialize the app
const taskManager = new TaskManager();