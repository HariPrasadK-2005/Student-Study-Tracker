// =============================================
// PASSWORD TOGGLE
// =============================================
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    if (field.type === 'password') {
        field.type = 'text';
    } else {
        field.type = 'password';
    }
}

// =============================================
// 1. LOGIN PAGE
// =============================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorMsg = document.getElementById('errorMsg');

        if (email === '' || password === '') {
            errorMsg.textContent = '⚠️ Please fill in all fields!';
            errorMsg.style.display = 'block';
            return;
        }

        if (password.length < 4) {
            errorMsg.textContent = '⚠️ Password must be at least 4 characters!';
            errorMsg.style.display = 'block';
            return;
        }

        errorMsg.style.display = 'none';
        alert('✅ Login successful! Welcome back!');
        window.location.href = 'dashboard.html';
    });
}

// =============================================
// 2. REGISTER PAGE
// =============================================
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name     = document.getElementById('name').value.trim();
        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirm  = document.getElementById('confirmPassword').value.trim();
        const errorMsg = document.getElementById('errorMsg');

        if (name === '' || email === '' || password === '' || confirm === '') {
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
        alert('✅ Account created successfully! Please login.');
        window.location.href = 'login.html';
    });
}

// =============================================
// 3. DASHBOARD — ADD STUDY LOG
// =============================================
const logForm = document.getElementById('logForm');

if (logForm) {
    logForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const subject  = document.getElementById('subject').value;
        const hours    = document.getElementById('hours').value;
        const date     = document.getElementById('date').value;
        const errorMsg = document.getElementById('logError');

        if (subject === '' || subject === 'Select subject') {
            errorMsg.textContent = '⚠️ Please select a subject!';
            errorMsg.style.display = 'block';
            return;
        }

        if (hours === '' || hours <= 0) {
            errorMsg.textContent = '⚠️ Please enter valid hours!';
            errorMsg.style.display = 'block';
            return;
        }

        if (date === '') {
            errorMsg.textContent = '⚠️ Please select a date!';
            errorMsg.style.display = 'block';
            return;
        }

        errorMsg.style.display = 'none';

        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short'
        });

        const tableBody = document.getElementById('activityBody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${subject}</td>
            <td>${hours} hrs</td>
            <td>${formattedDate}</td>
        `;
        tableBody.insertBefore(newRow, tableBody.firstChild);

        const totalHoursEl = document.getElementById('totalHours');
        if (totalHoursEl) {
            const current = parseFloat(totalHoursEl.textContent);
            totalHoursEl.textContent = (current + parseFloat(hours)).toFixed(1) + ' hrs';
        }

        logForm.reset();
        alert('✅ Study log added successfully!');
    });
}