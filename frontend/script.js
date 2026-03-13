// =============================================
// STUDENT STUDY TRACKER — FRONTEND SCRIPT
// =============================================

const API = 'http://localhost:5000/api';

// =============================================
// HELPER FUNCTIONS
// =============================================
function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    return JSON.parse(localStorage.getItem('user'));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === 'password' ? 'text' : 'password';
}

// Redirect to login if not logged in
function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
    }
}

// =============================================
// 1. REGISTER PAGE
// =============================================
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const name     = document.getElementById('name').value.trim();
        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirm  = document.getElementById('confirmPassword').value.trim();
        const errorMsg = document.getElementById('errorMsg');

        if (!name || !email || !password || !confirm) {
            errorMsg.textContent = '⚠️ Please fill in all fields!';
            errorMsg.style.display = 'block';
            return;
        }

        if (password !== confirm) {
            errorMsg.textContent = '⚠️ Passwords do not match!';
            errorMsg.style.display = 'block';
            return;
        }

        if (password.length < 4) {
            errorMsg.textContent = '⚠️ Password must be at least 4 characters!';
            errorMsg.style.display = 'block';
            return;
        }

        errorMsg.style.display = 'none';

        try {
            const res  = await fetch(`${API}/register`, {
                method  : 'POST',
                headers : { 'Content-Type': 'application/json' },
                body    : JSON.stringify({ name, email, password })
            });
            const data = await res.json();

            if (res.ok) {
                alert('✅ Account created successfully! Please login.');
                window.location.href = 'login.html';
            } else {
                errorMsg.textContent = '⚠️ ' + data.message;
                errorMsg.style.display = 'block';
            }
        } catch (err) {
            errorMsg.textContent = '⚠️ Server error. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
}

// =============================================
// 2. LOGIN PAGE
// =============================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorMsg = document.getElementById('errorMsg');

        if (!email || !password) {
            errorMsg.textContent = '⚠️ Please fill in all fields!';
            errorMsg.style.display = 'block';
            return;
        }

        errorMsg.style.display = 'none';

        try {
            const res  = await fetch(`${API}/login`, {
                method  : 'POST',
                headers : { 'Content-Type': 'application/json' },
                body    : JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = '⚠️ ' + data.message;
                errorMsg.style.display = 'block';
            }
        } catch (err) {
            errorMsg.textContent = '⚠️ Server error. Please try again.';
            errorMsg.style.display = 'block';
        }
    });
}

// =============================================
// 3. DASHBOARD PAGE
// =============================================
if (document.getElementById('logForm') || document.getElementById('activityBody')) {
    requireAuth();

    const user  = getUser();
    const token = getToken();

    // Show user name
    const userNameEl = document.getElementById('userName');
    if (userNameEl && user) userNameEl.textContent = user.name;

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // ---- SUBJECTS ----
    async function loadSubjects() {
        try {
            const res     = await fetch(`${API}/subjects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const subjects = await res.json();

            const subjectSelect = document.getElementById('subject');
            if (subjectSelect) {
                subjectSelect.innerHTML = '<option value="">Select subject</option>';
                subjects.forEach(s => {
                    subjectSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
                });
            }

            const subjectList = document.getElementById('subjectList');
            if (subjectList) {
                subjectList.innerHTML = '';
                subjects.forEach(s => {
                    subjectList.innerHTML += `
                        <div class="subject-item" style="border-left: 4px solid ${s.color}">
                            <span>${s.name}</span>
                            <button onclick="deleteSubject(${s.id})">🗑️</button>
                        </div>`;
                });
            }

            // Update Total Subjects Card
            const totalSubjectsEl = document.getElementById('totalSubjects');
            if (totalSubjectsEl) {
                totalSubjectsEl.textContent = `${subjects.length} subjects`;
            }

            // Update Weekly Goal (e.g. 5 hours per subject)
            const weeklyGoalEl = document.getElementById('weeklyGoal');
            if (weeklyGoalEl) {
                const calculatedGoal = subjects.length * 5;
                weeklyGoalEl.textContent = `${calculatedGoal} hrs`;
            }

        } catch (err) {
            console.error('Failed to load subjects:', err);
        }
    }

    // Add subject
    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
        subjectForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const name  = document.getElementById('subjectName').value.trim();
            const color = document.getElementById('subjectColor')?.value || '#4F46E5';

            if (!name) return;

            await fetch(`${API}/subjects`, {
                method  : 'POST',
                headers : {
                    'Content-Type'  : 'application/json',
                    'Authorization' : `Bearer ${token}`
                },
                body: JSON.stringify({ name, color })
            });

            subjectForm.reset();
            loadSubjects();
        });
    }

    // Delete subject
    window.deleteSubject = async function (id) {
        if (!confirm('Delete this subject?')) return;
        await fetch(`${API}/subjects/${id}`, {
            method  : 'DELETE',
            headers : { 'Authorization': `Bearer ${token}` }
        });
        loadSubjects();
        loadLogs();
    };

    // ---- STUDY LOGS & CHART ----
    let progressChartInstance = null;

    async function loadLogs() {
        try {
            const res  = await fetch(`${API}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const logs = await res.json();

            const tableBody = document.getElementById('activityBody');
            if (tableBody) {
                tableBody.innerHTML = '';
                let totalHours = 0;
                
                // For Chart Data
                const subjectHoursMap = {};

                logs.forEach(log => {
                    const hours = parseFloat(log.duration);
                    totalHours += hours;
                    const formattedDate = new Date(log.date).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short'
                    });
                    
                    // Aggregate hours per subject
                    if (subjectHoursMap[log.subject_name]) {
                        subjectHoursMap[log.subject_name].hours += hours;
                    } else {
                        subjectHoursMap[log.subject_name] = { 
                            hours: hours, 
                            color: log.color || '#3b5bdb' 
                        };
                    }

                    tableBody.innerHTML += `
                        <tr>
                            <td>${log.subject_name}</td>
                            <td>${log.duration} hrs</td>
                            <td>${formattedDate}</td>
                            <td><button onclick="deleteLog(${log.id})" style="border:none;background:none;cursor:pointer;color:red;">🗑️</button></td>
                        </tr>`;
                });

                const totalHoursEl = document.getElementById('totalHours');
                if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1) + ' hrs';
                
                updateChart(subjectHoursMap);
            }
        } catch (err) {
            console.error('Failed to load logs:', err);
        }
    }

    function updateChart(subjectData) {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;
        
        const labels = Object.keys(subjectData);
        const data = labels.map(label => subjectData[label].hours);
        const colors = labels.map(label => subjectData[label].color);

        if (progressChartInstance) {
            progressChartInstance.destroy();
        }

        progressChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Hours Studied',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 6,
                    maxBarThickness: 50,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                color: 'rgba(255,255,255,0.7)',
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'rgba(255,255,255,0.6)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.6)' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Add study log
    const logForm = document.getElementById('logForm');
    if (logForm) {
        logForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const subject_id = document.getElementById('subject').value;
            const duration   = document.getElementById('hours').value;
            const date       = document.getElementById('date').value;
            const notes      = document.getElementById('notes')?.value || '';
            const errorMsg   = document.getElementById('logError');

            if (!subject_id) {
                errorMsg.textContent = '⚠️ Please select a subject!';
                errorMsg.style.display = 'block';
                return;
            }
            if (!duration || duration <= 0) {
                errorMsg.textContent = '⚠️ Please enter valid hours!';
                errorMsg.style.display = 'block';
                return;
            }
            if (!date) {
                errorMsg.textContent = '⚠️ Please select a date!';
                errorMsg.style.display = 'block';
                return;
            }

            errorMsg.style.display = 'none';

            await fetch(`${API}/logs`, {
                method  : 'POST',
                headers : {
                    'Content-Type'  : 'application/json',
                    'Authorization' : `Bearer ${token}`
                },
                body: JSON.stringify({ subject_id, date, duration, notes })
            });

            logForm.reset();
            loadLogs();
        });
    }

    // Delete log
    window.deleteLog = async function (id) {
        if (!confirm('Delete this log?')) return;
        await fetch(`${API}/logs/${id}`, {
            method  : 'DELETE',
            headers : { 'Authorization': `Bearer ${token}` }
        });
        loadLogs();
    };

    // ---- TODOS ----
    async function loadTodos() {
        try {
            const res   = await fetch(`${API}/todos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const todos = await res.json();

            const todoList = document.getElementById('todoList');
            if (todoList) {
                todoList.innerHTML = '';
                todos.forEach(todo => {
                    todoList.innerHTML += `
                        <div class="todo-item ${todo.is_done ? 'done' : ''}">
                            <input type="checkbox" ${todo.is_done ? 'checked' : ''}
                                onchange="toggleTodo(${todo.id}, this.checked)">
                            <span>${todo.title}</span>
                            <button onclick="deleteTodo(${todo.id})">🗑️</button>
                        </div>`;
                });
            }
        } catch (err) {
            console.error('Failed to load todos:', err);
        }
    }

    // Add todo
    const todoForm = document.getElementById('todoForm');
    if (todoForm) {
        todoForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const title = document.getElementById('todoTitle').value.trim();
            if (!title) return;

            await fetch(`${API}/todos`, {
                method  : 'POST',
                headers : {
                    'Content-Type'  : 'application/json',
                    'Authorization' : `Bearer ${token}`
                },
                body: JSON.stringify({ title })
            });

            todoForm.reset();
            loadTodos();
        });
    }

    // Toggle todo
    window.toggleTodo = async function (id, is_done) {
        await fetch(`${API}/todos/${id}`, {
            method  : 'PATCH',
            headers : {
                'Content-Type'  : 'application/json',
                'Authorization' : `Bearer ${token}`
            },
            body: JSON.stringify({ is_done })
        });
        loadTodos();
    };

    // Delete todo
    window.deleteTodo = async function (id) {
        if (!confirm('Delete this todo?')) return;
        await fetch(`${API}/todos/${id}`, {
            method  : 'DELETE',
            headers : { 'Authorization': `Bearer ${token}` }
        });
        loadTodos();
    };

    // ---- INITIAL LOAD ----
    loadSubjects();
    loadLogs();
    loadTodos();
}