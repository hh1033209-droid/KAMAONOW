// ========== KAMAONOW ADMIN PANEL ==========
console.log("🚀 Admin Panel Loading...");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsny5xLAKyeFWBf1De4WKTfuNuzy5UIoA",
    authDomain: "kamaonow-bf070.firebaseapp.com",
    projectId: "kamaonow-bf070",
    storageBucket: "kamaonow-bf070.firebasestorage.app",
    messagingSenderId: "107731628902",
    appId: "1:107731628902:web:b9d36a0698995385124ea7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allUsers = [], allTasks = [], allTaskRequests = [], allWithdrawals = [], currentFilter = 'all';

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function loadAllData() {
    try {
        await Promise.all([loadUsers(), loadTasks(), loadTaskRequests(), loadWithdrawals()]);
        updateStats();
    } catch (error) { console.error(error); showToast("Error loading data", "error"); }
}

async function loadUsers() {
    const snapshot = await getDocs(collection(db, 'users'));
    allUsers = []; snapshot.forEach(doc => allUsers.push({ id: doc.id, ...doc.data() }));
    renderUsers();
}

async function loadTasks() {
    const snapshot = await getDocs(collection(db, 'tasks'));
    allTasks = []; snapshot.forEach(doc => allTasks.push({ id: parseInt(doc.id), ...doc.data() }));
    renderTasks();
}

async function loadTaskRequests() {
    const snapshot = await getDocs(collection(db, 'task_requests'));
    allTaskRequests = []; snapshot.forEach(doc => allTaskRequests.push({ id: doc.id, ...doc.data() }));
    renderTaskRequests();
}

async function loadWithdrawals() {
    const snapshot = await getDocs(collection(db, 'withdrawal_requests'));
    allWithdrawals = []; snapshot.forEach(doc => allWithdrawals.push({ id: doc.id, ...doc.data() }));
    renderWithdrawals();
}

function updateStats() {
    document.getElementById('statUsers').innerText = allUsers.length;
    document.getElementById('statTasks').innerText = allTasks.length;
    document.getElementById('statPendingTasks').innerText = allTaskRequests.filter(r => r.status === 'pending').length;
    document.getElementById('statPendingWithdrawals').innerText = allWithdrawals.filter(w => w.status === 'pending').length;
}

function renderTasks() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    if (allTasks.length === 0) { container.innerHTML = '<div style="text-align:center;padding:40px;">No tasks yet</div>'; return; }
    container.innerHTML = allTasks.map(task => `
        <div class="task-card">
            <h3><i class="fas ${task.icon || 'fa-tasks'}"></i> ${task.name}</h3>
            <div class="task-reward">+₨ ${task.reward}</div>
            <div class="task-description">${task.description || ''}</div>
            ${task.link ? `<div class="task-link"><i class="fas fa-external-link-alt"></i> ${task.link}</div>` : ''}
            <div class="task-actions">
                <button class="btn-primary btn-small" onclick="editTask(${task.id})">Edit</button>
                <button class="btn-secondary btn-small" onclick="deleteTask(${task.id})">Delete</button>
                <button class="btn-secondary btn-small" onclick="toggleTaskStatus(${task.id})">${task.active !== false ? 'Disable' : 'Enable'}</button>
            </div>
        </div>
    `).join('');
}

function renderUsers() {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filtered = allUsers.filter(u => u.name?.toLowerCase().includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm));
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.name || 'N/A'}</strong><br><small>${(user.userId || user.id).slice(-8)}</small></td>
            <td>${user.email || 'N/A'}</td>
            <td style="color:#10b981;">₨ ${user.balance || 0}</td>
            <td>${(user.completedTasks || []).length}</td>
            <td><span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-banned'}">${user.status || 'active'}</span></td>
            <td><button class="btn-primary btn-small" onclick="addBalance('${user.userId || user.id}')" style="margin-right:5px;">+</button><button class="btn-secondary btn-small" onclick="toggleUserStatus('${user.userId || user.id}')">${user.status === 'active' ? 'Ban' : 'Unban'}</button></td>
        </tr>
    `).join('');
}

function filterUsers() { renderUsers(); }

function renderTaskRequests() {
    const container = document.getElementById('taskRequestsList');
    if (!container) return;
    let filtered = currentFilter !== 'all' ? allTaskRequests.filter(r => r.status === currentFilter) : allTaskRequests;
    if (filtered.length === 0) { container.innerHTML = '<div style="text-align:center;padding:40px;">No requests</div>'; return; }
    container.innerHTML = filtered.map(req => `
        <div class="request-card">
            <div class="request-header"><span class="request-user">${req.userName || req.userId}</span><span class="request-amount">+₨ ${req.reward}</span></div>
            <div><strong>Task:</strong> ${req.taskName}</div>
            <div class="request-proof"><i class="fas fa-link"></i> Proof: <a href="${req.proof}" target="_blank">View</a></div>
            <div class="request-actions">
                ${req.status === 'pending' ? `<button class="btn-approve" onclick="approveTask('${req.id}', ${req.reward}, ${req.taskId}, '${req.userId}')">Approve</button><button class="btn-reject" onclick="rejectTask('${req.id}')">Reject</button>` : `<span class="status-badge status-${req.status}">${req.status.toUpperCase()}</span>`}
            </div>
        </div>
    `).join('');
}

function renderWithdrawals() {
    const container = document.getElementById('withdrawalsList');
    if (!container) return;
    let filtered = currentFilter !== 'all' ? allWithdrawals.filter(w => w.status === currentFilter) : allWithdrawals;
    if (filtered.length === 0) { container.innerHTML = '<div style="text-align:center;padding:40px;">No withdrawals</div>'; return; }
    container.innerHTML = filtered.map(wd => `
        <div class="request-card">
            <div class="request-header"><span class="request-user">${wd.userName || wd.userId}</span><span class="request-amount">₨ ${wd.amount}</span></div>
            <div>Method: ${wd.methodDisplay || wd.method}</div>
            <div>Account: ${wd.accountNumber}</div>
            <div class="request-actions">
                ${wd.status === 'pending' ? `<button class="btn-approve" onclick="approveWithdrawal('${wd.id}', ${wd.amount}, '${wd.userId}')">Approve</button><button class="btn-reject" onclick="rejectWithdrawal('${wd.id}', ${wd.amount}, '${wd.userId}')">Reject</button>` : `<span class="status-badge status-${wd.status}">${wd.status.toUpperCase()}</span>`}
            </div>
        </div>
    `).join('');
}

window.openTaskModal = function() {
    document.getElementById('taskModal').classList.add('show');
    document.getElementById('modalTitle').innerText = 'Add New Task';
    document.getElementById('taskEditId').value = '';
    document.getElementById('taskName').value = '';
    document.getElementById('taskReward').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskLink').value = '';
    document.getElementById('taskIcon').value = 'fa-tasks';
}
window.closeTaskModal = function() { document.getElementById('taskModal').classList.remove('show'); }

window.saveTask = async function() {
    const name = document.getElementById('taskName').value.trim();
    const reward = parseInt(document.getElementById('taskReward').value);
    const desc = document.getElementById('taskDescription').value;
    const link = document.getElementById('taskLink').value.trim();
    const icon = document.getElementById('taskIcon').value;
    if (!name || !reward) { showToast("Enter name and reward", "error"); return; }
    const taskId = Date.now();
    await setDoc(doc(db, 'tasks', taskId.toString()), { id: taskId, name, reward, description: desc, link, icon, active: true });
    showToast("Task added!");
    closeTaskModal();
    await loadTasks(); updateStats();
}

window.editTask = async function(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('taskModal').classList.add('show');
    document.getElementById('modalTitle').innerText = 'Edit Task';
    document.getElementById('taskEditId').value = task.id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskReward').value = task.reward;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskLink').value = task.link || '';
    document.getElementById('taskIcon').value = task.icon || 'fa-tasks';
}

window.deleteTask = async function(taskId) {
    if (confirm("Delete?")) { await deleteDoc(doc(db, 'tasks', taskId.toString())); showToast("Deleted"); await loadTasks(); updateStats(); }
}

window.toggleTaskStatus = async function(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (task) { await updateDoc(doc(db, 'tasks', taskId.toString()), { active: task.active === false }); showToast(`Task ${task.active === false ? 'enabled' : 'disabled'}`); await loadTasks(); }
}

window.addBalance = async function(userId) {
    const amount = prompt("Enter amount:");
    if (amount && !isNaN(amount)) {
        const userRef = doc(db, 'users', userId);
        const user = await getDoc(userRef);
        await updateDoc(userRef, { balance: (user.data()?.balance || 0) + parseInt(amount) });
        showToast(`Added ₨${amount}`); await loadUsers(); updateStats();
    }
}

window.toggleUserStatus = async function(userId) {
    const userRef = doc(db, 'users', userId);
    const user = await getDoc(userRef);
    const newStatus = user.data()?.status === 'active' ? 'banned' : 'active';
    await updateDoc(userRef, { status: newStatus });
    showToast(`User ${newStatus === 'active' ? 'activated' : 'banned'}`);
    await loadUsers();
}

window.approveTask = async function(reqId, reward, taskId, userId) {
    await updateDoc(doc(db, 'task_requests', reqId), { status: 'approved' });
    const userRef = doc(db, 'users', userId);
    const user = await getDoc(userRef);
    await updateDoc(userRef, { balance: (user.data()?.balance || 0) + reward, completedTasks: [...(user.data()?.completedTasks || []), taskId] });
    showToast("Task approved!"); await loadAllData();
}

window.rejectTask = async function(reqId) { await updateDoc(doc(db, 'task_requests', reqId), { status: 'rejected' }); showToast("Rejected"); await loadAllData(); }
window.approveWithdrawal = async function(reqId) { await updateDoc(doc(db, 'withdrawal_requests', reqId), { status: 'approved' }); showToast("Approved"); await loadAllData(); }
window.rejectWithdrawal = async function(reqId, amount, userId) {
    await updateDoc(doc(db, 'withdrawal_requests', reqId), { status: 'rejected' });
    const userRef = doc(db, 'users', userId);
    const user = await getDoc(userRef);
    await updateDoc(userRef, { balance: (user.data()?.balance || 0) + amount });
    showToast("Rejected, amount returned"); await loadAllData();
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => { currentFilter = btn.getAttribute('data-filter'); document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderTaskRequests(); renderWithdrawals(); });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(`${tab}Tab`).classList.add('active');
    });
});

window.verifyAdminLogin = function() {
    const pwd = document.getElementById('adminPassword').value;
    if (pwd === 'admin123') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminApp').style.display = 'block';
        loadAllData();
        onSnapshot(collection(db, 'users'), () => loadAllData());
        onSnapshot(collection(db, 'tasks'), () => loadAllData());
        onSnapshot(collection(db, 'task_requests'), () => loadAllData());
        onSnapshot(collection(db, 'withdrawal_requests'), () => loadAllData());
    } else { showToast("Wrong password!", "error"); }
}
window.logoutAdmin = function() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('adminApp').style.display = 'none'; document.getElementById('adminPassword').value = ''; }

console.log("✅ Admin Panel Ready!");