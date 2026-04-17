// ========== KAMAONOW ULTIMATE ADMIN PANEL - FULLY FUNCTIONAL ==========
console.log("🚀 Ultimate Admin Panel Loading...");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc, onSnapshot, addDoc, query, where, orderBy, limit, increment, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ========== FIREBASE CONFIG ==========
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

// ========== GLOBAL STATE ==========
let allUsers = [];
let allTasks = [];
let allTaskRequests = [];
let allWithdrawals = [];
let allOffers = [];
let allAdNetworks = [];
let currentFilter = 'all';
let activityLogs = [];

// ========== UTILITY FUNCTIONS ==========
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
    toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function addToLog(action, type = 'info') {
    const logEntry = { time: new Date().toLocaleString(), action, type };
    activityLogs.unshift(logEntry);
    if (activityLogs.length > 100) activityLogs.pop();
    renderLogs();
}

function renderLogs() {
    const container = document.getElementById('activityLogs');
    if (!container) return;
    if (activityLogs.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">No activity logs yet</div>';
        return;
    }
    container.innerHTML = activityLogs.map(log => `
        <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; background: ${log.type === 'error' ? '#fee2e2' : log.type === 'success' ? '#d1fae5' : '#fef3c7'}; margin-bottom: 5px; border-radius: 8px;">
            <small style="color:#666;">${log.time}</small>
            <div style="font-size: 13px;">${log.action}</div>
        </div>
    `).join('');
}

// ========== DATA LOADING ==========
async function loadAllData() {
    try {
        await Promise.all([
            loadUsers(), 
            loadTasks(), 
            loadTaskRequests(), 
            loadWithdrawals(), 
            loadOffers(), 
            loadAdNetworks(),
            loadAdSettings(),
            loadReferralSettings(),
            loadAppSettings()
        ]);
        updateStats();
        updateAnalytics();
        renderRecentActivities();
        addToLog('All data loaded successfully', 'success');
    } catch (error) { 
        console.error(error); 
        showToast("Error loading data", "error"); 
        addToLog('Error loading data: ' + error.message, 'error');
    }
}

async function loadUsers() {
    const snapshot = await getDocs(collection(db, 'users'));
    allUsers = []; 
    snapshot.forEach(doc => allUsers.push({ id: doc.id, ...doc.data() }));
    renderUsers();
}

async function loadTasks() {
    const snapshot = await getDocs(collection(db, 'tasks'));
    allTasks = []; 
    snapshot.forEach(doc => allTasks.push({ id: parseInt(doc.id), ...doc.data() }));
    renderTasks();
}

async function loadTaskRequests() {
    const snapshot = await getDocs(collection(db, 'task_requests'));
    allTaskRequests = []; 
    snapshot.forEach(doc => allTaskRequests.push({ id: doc.id, ...doc.data() }));
    renderTaskRequests();
}

async function loadWithdrawals() {
    const snapshot = await getDocs(collection(db, 'withdrawal_requests'));
    allWithdrawals = []; 
    snapshot.forEach(doc => allWithdrawals.push({ id: doc.id, ...doc.data() }));
    renderWithdrawals();
}

async function loadOffers() {
    const snapshot = await getDocs(collection(db, 'offers'));
    allOffers = []; 
    snapshot.forEach(doc => allOffers.push({ id: doc.id, ...doc.data() }));
    renderOffers();
}

async function loadAdNetworks() {
    const snapshot = await getDocs(collection(db, 'ad_networks'));
    allAdNetworks = [];
    snapshot.forEach(doc => allAdNetworks.push({ id: doc.id, ...doc.data() }));
    renderAdNetworks();
}

// ========== STATISTICS UPDATE ==========
function updateStats() {
    const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
    const totalReferrals = allUsers.reduce((sum, u) => sum + (u.referrals || 0), 0);
    const approvedWithdrawals = allWithdrawals.filter(w => w.status === 'approved');
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    document.getElementById('statUsers') && (document.getElementById('statUsers').innerText = allUsers.length);
    document.getElementById('statTasks') && (document.getElementById('statTasks').innerText = allTasks.length);
    document.getElementById('statPendingTasks') && (document.getElementById('statPendingTasks').innerText = allTaskRequests.filter(r => r.status === 'pending').length);
    document.getElementById('statPendingWithdrawals') && (document.getElementById('statPendingWithdrawals').innerText = allWithdrawals.filter(w => w.status === 'pending').length);
    document.getElementById('statTotalBalance') && (document.getElementById('statTotalBalance').innerText = `₨ ${totalBalance.toLocaleString()}`);
    document.getElementById('statReferrals') && (document.getElementById('statReferrals').innerText = totalReferrals);
}

function updateAnalytics() {
    const container = document.getElementById('analyticsData');
    if (!container) return;
    
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const bannedUsers = allUsers.filter(u => u.status === 'banned').length;
    const totalTasksCompleted = allTaskRequests.filter(r => r.status === 'approved').length;
    const totalWithdrawals = allWithdrawals.filter(w => w.status === 'approved').length;
    const totalWithdrawnAmount = allWithdrawals.filter(w => w.status === 'approved').reduce((s, w) => s + (w.amount || 0), 0);
    const pendingWithdrawalsAmount = allWithdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0);
    
    container.innerHTML = `
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card"><i class="fas fa-users" style="color:#667eea;"></i><h3>${totalUsers}</h3><p>Total Users</p></div>
            <div class="stat-card"><i class="fas fa-user-check" style="color:#10b981;"></i><h3>${activeUsers}</h3><p>Active Users</p></div>
            <div class="stat-card"><i class="fas fa-user-slash" style="color:#ef4444;"></i><h3>${bannedUsers}</h3><p>Banned Users</p></div>
            <div class="stat-card"><i class="fas fa-check-circle" style="color:#8b5cf6;"></i><h3>${totalTasksCompleted}</h3><p>Tasks Completed</p></div>
            <div class="stat-card"><i class="fas fa-money-bill-wave" style="color:#f59e0b;"></i><h3>₨ ${totalWithdrawnAmount.toLocaleString()}</h3><p>Total Withdrawn</p></div>
            <div class="stat-card"><i class="fas fa-clock" style="color:#ef4444;"></i><h3>₨ ${pendingWithdrawalsAmount.toLocaleString()}</h3><p>Pending Withdrawals</p></div>
        </div>
        <div class="card">
            <h4>Platform Summary</h4>
            <p>Total Referrals: ${allUsers.reduce((s, u) => s + (u.referrals || 0), 0)}</p>
            <p>Total Withdrawal Requests: ${totalWithdrawals}</p>
            <p>Total Task Requests: ${allTaskRequests.length}</p>
        </div>
    `;
}

function renderRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    const recentRequests = [...allTaskRequests].sort((a, b) => new Date(b.submittedAt?.toDate()) - new Date(a.submittedAt?.toDate())).slice(0, 5);
    const recentWithdrawals = [...allWithdrawals].sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate())).slice(0, 5);
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4>Recent Task Submissions</h4>
                ${recentRequests.length === 0 ? '<p>No recent submissions</p>' : recentRequests.map(req => `
                    <div style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                        <strong>${req.userName || req.userId?.slice(-8)}</strong> - ${req.taskName}
                        <span class="badge badge-${req.status}" style="float:right;">${req.status}</span>
                    </div>
                `).join('')}
            </div>
            <div>
                <h4>Recent Withdrawals</h4>
                ${recentWithdrawals.length === 0 ? '<p>No recent withdrawals</p>' : recentWithdrawals.map(wd => `
                    <div style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                        <strong>${wd.userName || wd.userId?.slice(-8)}</strong> - ₨ ${wd.amount}
                        <span class="badge badge-${wd.status}" style="float:right;">${wd.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ========== USERS MANAGEMENT ==========
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filtered = allUsers.filter(u => 
        u.name?.toLowerCase().includes(searchTerm) || 
        u.email?.toLowerCase().includes(searchTerm) ||
        (u.userId || u.id)?.toLowerCase().includes(searchTerm)
    );
    
    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.name || 'N/A'}</strong><br><small style="color:#666;">${(user.userId || user.id).slice(-8)}</small></td>
            <td>${user.email || 'N/A'}</td>
            <td style="color:#10b981; font-weight:bold;">₨ ${(user.balance || 0).toLocaleString()}</td>
            <td>${(user.completedTasks || []).length}</td>
            <td>${user.referrals || 0}</td>
            <td><span class="badge ${user.status === 'active' ? 'badge-active' : 'badge-banned'}">${user.status || 'active'}</span></td>
            <td>
                <button class="btn-primary btn-small" onclick="editUser('${user.userId || user.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-success btn-small" onclick="addBalance('${user.userId || user.id}')" title="Add Balance"><i class="fas fa-plus"></i></button>
                <button class="btn-warning btn-small" onclick="deductBalance('${user.userId || user.id}')" title="Deduct Balance"><i class="fas fa-minus"></i></button>
                <button class="btn-danger btn-small" onclick="toggleUserStatus('${user.userId || user.id}')" title="${user.status === 'active' ? 'Ban' : 'Unban'}"><i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i></button>
            </td>
        </tr>
    `).join('');
}

window.searchUsers = function() { renderUsers(); }

window.editUser = async function(userId) {
    const user = allUsers.find(u => (u.userId || u.id) === userId);
    if (!user) return;
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserBalance').value = user.balance || 0;
    document.getElementById('editUserStatus').value = user.status || 'active';
    document.getElementById('userEditModal').classList.add('show');
}

window.closeUserEditModal = function() { 
    document.getElementById('userEditModal').classList.remove('show'); 
}

window.saveUserEdit = async function() {
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const balance = parseInt(document.getElementById('editUserBalance').value);
    const status = document.getElementById('editUserStatus').value;
    
    await updateDoc(doc(db, 'users', userId), { name, email, balance, status });
    showToast('User updated successfully!');
    addToLog(`User ${userId} updated`, 'success');
    closeUserEditModal();
    await loadUsers();
}

window.deleteUser = async function(userId) {
    if (confirm('⚠️ WARNING: This will permanently delete the user. Are you sure?')) {
        await deleteDoc(doc(db, 'users', userId));
        showToast('User deleted permanently');
        addToLog(`User ${userId} deleted`, 'error');
        await loadUsers();
        updateStats();
    }
}

window.addBalance = async function(userId) {
    const amount = prompt('Enter amount to add (in rupees):');
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const userRef = doc(db, 'users', userId);
        const user = await getDoc(userRef);
        const newBalance = (user.data()?.balance || 0) + parseInt(amount);
        await updateDoc(userRef, { balance: newBalance });
        await addDoc(collection(db, 'transactions'), {
            userId, amount: parseInt(amount), type: 'admin_add', 
            timestamp: new Date(), oldBalance: user.data()?.balance || 0, newBalance
        });
        showToast(`Added ₨${amount} to user balance`);
        addToLog(`Added ₨${amount} to user ${userId}`, 'success');
        await loadUsers();
        updateStats();
    }
}

window.deductBalance = async function(userId) {
    const amount = prompt('Enter amount to deduct (in rupees):');
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        const userRef = doc(db, 'users', userId);
        const user = await getDoc(userRef);
        const newBalance = Math.max(0, (user.data()?.balance || 0) - parseInt(amount));
        await updateDoc(userRef, { balance: newBalance });
        await addDoc(collection(db, 'transactions'), {
            userId, amount: -parseInt(amount), type: 'admin_deduct', 
            timestamp: new Date(), oldBalance: user.data()?.balance || 0, newBalance
        });
        showToast(`Deducted ₨${amount} from user balance`);
        addToLog(`Deducted ₨${amount} from user ${userId}`, 'warning');
        await loadUsers();
        updateStats();
    }
}

window.toggleUserStatus = async function(userId) {
    const user = allUsers.find(u => (u.userId || u.id) === userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    await updateDoc(doc(db, 'users', userId), { status: newStatus });
    showToast(`User ${newStatus === 'active' ? 'activated' : 'banned'}`);
    addToLog(`User ${userId} status changed to ${newStatus}`, 'info');
    await loadUsers();
}

// ========== TASKS MANAGEMENT ==========
function renderTasks() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    if (allTasks.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:40px;">No tasks yet. Click "Add New Task" to create one.</div>'; 
        return; 
    }
    container.innerHTML = allTasks.map(task => `
        <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div><i class="fas ${task.icon || 'fa-tasks'}"></i> <strong>${task.name}</strong> - <span style="color:#10b981;">+₨ ${task.reward}</span></div>
                <div><span class="badge ${task.active !== false ? 'badge-active' : 'badge-banned'}">${task.active !== false ? 'Active' : 'Disabled'}</span></div>
            </div>
            <div style="font-size: 13px; color:#666; margin-top: 8px;">${task.description || 'No description'}</div>
            ${task.link ? `<div style="font-size: 11px; color:#667eea; margin-top: 5px;"><i class="fas fa-link"></i> <a href="${task.link}" target="_blank">${task.link.substring(0, 50)}...</a></div>` : ''}
            <div style="margin-top: 10px; display: flex; gap: 8px;">
                <button class="btn-primary btn-small" onclick="editTask(${task.id})"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-warning btn-small" onclick="toggleTaskStatus(${task.id})"><i class="fas ${task.active !== false ? 'fa-pause' : 'fa-play'}"></i> ${task.active !== false ? 'Disable' : 'Enable'}</button>
                <button class="btn-danger btn-small" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i> Delete</button>
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

window.closeTaskModal = function() { 
    document.getElementById('taskModal').classList.remove('show'); 
}

window.saveTask = async function() {
    const name = document.getElementById('taskName').value.trim();
    const reward = parseInt(document.getElementById('taskReward').value);
    const desc = document.getElementById('taskDescription').value;
    let link = document.getElementById('taskLink').value.trim();
    const icon = document.getElementById('taskIcon').value;
    const editId = document.getElementById('taskEditId').value;
    
    if (link && link.startsWith('http://')) link = link.replace('http://', 'https://');
    if (!name || !reward) { showToast("Enter task name and reward", "error"); return; }
    
    const taskData = { name, reward, description: desc, link, icon, active: true, updatedAt: new Date().toISOString() };
    
    if (editId) {
        await updateDoc(doc(db, 'tasks', editId.toString()), taskData);
        showToast("Task updated successfully!");
        addToLog(`Task ${name} updated`, 'info');
    } else {
        const taskId = Date.now();
        await setDoc(doc(db, 'tasks', taskId.toString()), { id: taskId, ...taskData, createdAt: new Date().toISOString() });
        showToast("Task added successfully!");
        addToLog(`Task ${name} added`, 'success');
    }
    closeTaskModal();
    await loadTasks();
    updateStats();
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
    if (confirm("Delete this task permanently?")) { 
        await deleteDoc(doc(db, 'tasks', taskId.toString())); 
        showToast("Task deleted"); 
        addToLog(`Task ${taskId} deleted`, 'error');
        await loadTasks(); 
        updateStats(); 
    }
}

window.toggleTaskStatus = async function(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (task) { 
        const newStatus = task.active === false;
        await updateDoc(doc(db, 'tasks', taskId.toString()), { active: newStatus }); 
        showToast(`Task ${newStatus ? 'enabled' : 'disabled'}`); 
        addToLog(`Task ${task.name} ${newStatus ? 'enabled' : 'disabled'}`, 'info');
        await loadTasks(); 
    }
}

// ========== TASK REQUESTS ==========
function renderTaskRequests() {
    const container = document.getElementById('taskRequestsList');
    if (!container) return;
    let filtered = currentFilter !== 'all' ? allTaskRequests.filter(r => r.status === currentFilter) : allTaskRequests;
    if (filtered.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:40px;">No task requests found</div>'; 
        return; 
    }
    container.innerHTML = filtered.map(req => `
        <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                <div><strong><i class="fas fa-user"></i> ${req.userName || req.userId?.slice(-8)}</strong> - ${req.taskName}</div>
                <div><span class="badge badge-${req.status}">${req.status}</span></div>
            </div>
            <div style="margin-top: 8px;">Reward: <strong style="color:#10b981;">₨ ${req.reward}</strong></div>
            ${req.proof ? `<div style="margin-top: 5px;"><i class="fas fa-link"></i> <a href="${req.proof}" target="_blank" style="color:#667eea;">View Proof</a></div>` : ''}
            <div style="margin-top: 5px; font-size: 11px; color:#666;"><i class="far fa-clock"></i> ${req.submittedAt?.toDate ? new Date(req.submittedAt.toDate()).toLocaleString() : 'Unknown date'}</div>
            ${req.status === 'pending' ? `
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button class="btn-success btn-small" onclick="approveTask('${req.id}', ${req.reward}, ${req.taskId}, '${req.userId}')"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn-danger btn-small" onclick="rejectTask('${req.id}')"><i class="fas fa-times"></i> Reject</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.approveTask = async function(reqId, reward, taskId, userId) {
    await updateDoc(doc(db, 'task_requests', reqId), { status: 'approved', reviewedAt: new Date() });
    const userRef = doc(db, 'users', userId);
    const user = await getDoc(userRef);
    const newBalance = (user.data()?.balance || 0) + reward;
    const completedTasks = [...(user.data()?.completedTasks || []), taskId];
    await updateDoc(userRef, { balance: newBalance, completedTasks });
    await addDoc(collection(db, 'transactions'), { 
        userId, amount: reward, type: 'task_completed', taskId, 
        timestamp: new Date(), oldBalance: user.data()?.balance || 0, newBalance 
    });
    showToast("Task approved! Balance updated.");
    addToLog(`Task request ${reqId} approved for user ${userId}`, 'success');
    await loadAllData();
}

window.rejectTask = async function(reqId) { 
    await updateDoc(doc(db, 'task_requests', reqId), { status: 'rejected', reviewedAt: new Date() }); 
    showToast("Task request rejected"); 
    addToLog(`Task request ${reqId} rejected`, 'warning');
    await loadAllData(); 
}

// ========== WITHDRAWALS ==========
function renderWithdrawals() {
    const container = document.getElementById('withdrawalsList');
    if (!container) return;
    let filtered = currentFilter !== 'all' ? allWithdrawals.filter(w => w.status === currentFilter) : allWithdrawals;
    if (filtered.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:40px;">No withdrawal requests found</div>'; 
        return; 
    }
    container.innerHTML = filtered.map(wd => `
        <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                <div><strong><i class="fas fa-user"></i> ${wd.userName || wd.userId?.slice(-8)}</strong> - <span style="color:#f59e0b; font-weight:bold;">₨ ${wd.amount}</span></div>
                <div><span class="badge badge-${wd.status}">${wd.status}</span></div>
            </div>
            <div style="margin-top: 5px;"><i class="fas fa-university"></i> Method: ${wd.methodDisplay || wd.method}</div>
            <div><i class="fas fa-id-card"></i> Account: ${wd.accountNumber}</div>
            ${wd.accountHolder ? `<div><i class="fas fa-user-circle"></i> Holder: ${wd.accountHolder}</div>` : ''}
            <div style="margin-top: 5px; font-size: 11px; color:#666;"><i class="far fa-clock"></i> ${wd.createdAt?.toDate ? new Date(wd.createdAt.toDate()).toLocaleString() : 'Unknown date'}</div>
            ${wd.status === 'pending' ? `
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button class="btn-success btn-small" onclick="approveWithdrawal('${wd.id}', ${wd.amount}, '${wd.userId}')"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn-danger btn-small" onclick="rejectWithdrawal('${wd.id}', ${wd.amount}, '${wd.userId}')"><i class="fas fa-times"></i> Reject</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.approveWithdrawal = async function(reqId, amount, userId) {
    await updateDoc(doc(db, 'withdrawal_requests', reqId), { status: 'approved', processedAt: new Date() });
    await addDoc(collection(db, 'transactions'), { 
        userId, amount: -amount, type: 'withdrawal', withdrawalId: reqId, timestamp: new Date() 
    });
    showToast("Withdrawal approved");
    addToLog(`Withdrawal ${reqId} approved for user ${userId}`, 'success');
    await loadAllData();
}

window.rejectWithdrawal = async function(reqId, amount, userId) {
    await updateDoc(doc(db, 'withdrawal_requests', reqId), { status: 'rejected', processedAt: new Date() });
    const userRef = doc(db, 'users', userId);
    const user = await getDoc(userRef);
    const newBalance = (user.data()?.balance || 0) + amount;
    await updateDoc(userRef, { balance: newBalance });
    await addDoc(collection(db, 'transactions'), { 
        userId, amount: amount, type: 'withdrawal_rejected', withdrawalId: reqId, 
        timestamp: new Date(), oldBalance: user.data()?.balance || 0, newBalance 
    });
    showToast("Withdrawal rejected, amount refunded");
    addToLog(`Withdrawal ${reqId} rejected for user ${userId}`, 'warning');
    await loadAllData();
}

// ========== OFFERS MANAGEMENT ==========
function renderOffers() {
    const container = document.getElementById('offersList');
    if (!container) return;
    if (allOffers.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:40px;">No offers added yet. Use the form above to add SmartLink offers.</div>'; 
        return; 
    }
    container.innerHTML = allOffers.map(offer => `
        <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 10px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div>
                <strong><i class="fas fa-gift"></i> ${offer.name}</strong><br>
                <small>Reward: <span style="color:#10b981; font-weight:bold;">₨ ${offer.reward}</span></small><br>
                <small><i class="fas fa-link"></i> <a href="${offer.link}" target="_blank">${offer.link?.substring(0, 50)}...</a></small>
            </div>
            <button class="btn-danger btn-small" onclick="deleteOffer('${offer.id}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
    `).join('');
}

window.addOffer = async function() {
    const name = document.getElementById('offerName')?.value.trim();
    const link = document.getElementById('offerLink')?.value.trim();
    const reward = parseInt(document.getElementById('offerReward')?.value);
    
    if (!name || !link || !reward) { 
        showToast('Please fill all offer fields', 'error'); 
        return; 
    }
    
    await addDoc(collection(db, 'offers'), { 
        name, link, reward, active: true, 
        createdAt: new Date().toISOString() 
    });
    showToast('Offer added successfully!');
    addToLog(`Offer ${name} added`, 'success');
    
    if (document.getElementById('offerName')) document.getElementById('offerName').value = '';
    if (document.getElementById('offerLink')) document.getElementById('offerLink').value = '';
    if (document.getElementById('offerReward')) document.getElementById('offerReward').value = '';
    
    await loadOffers();
}

window.deleteOffer = async function(offerId) {
    if (confirm('Delete this offer?')) { 
        await deleteDoc(doc(db, 'offers', offerId)); 
        showToast('Offer deleted'); 
        addToLog(`Offer ${offerId} deleted`, 'error');
        await loadOffers(); 
    }
}

// ========== AD NETWORKS MANAGEMENT ==========
function renderAdNetworks() {
    const container = document.getElementById('adNetworksList');
    if (!container) return;
    if (allAdNetworks.length === 0) { 
        container.innerHTML = '<div style="text-align:center;padding:20px;">No ad networks configured</div>'; 
        return; 
    }
    container.innerHTML = allAdNetworks.sort((a, b) => (a.priority || 999) - (b.priority || 999)).map(ad => `
        <div style="background: #f8fafc; border-radius: 8px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${ad.name}</strong><br>
                <small>Priority: ${ad.priority || 1}</small>
            </div>
            <div>
                <button class="btn-warning btn-small" onclick="editAdNetwork('${ad.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-danger btn-small" onclick="deleteAdNetwork('${ad.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.addAdNetwork = async function() {
    const name = document.getElementById('adNetworkName')?.value.trim();
    const script = document.getElementById('adNetworkScript')?.value.trim();
    const priority = parseInt(document.getElementById('adPriority')?.value || 1);
    
    if (!name || !script) { 
        showToast('Please fill all ad network fields', 'error'); 
        return; 
    }
    
    await addDoc(collection(db, 'ad_networks'), { 
        name, script, priority, active: true, 
        createdAt: new Date().toISOString() 
    });
    showToast('Ad network added successfully!');
    addToLog(`Ad network ${name} added`, 'success');
    
    if (document.getElementById('adNetworkName')) document.getElementById('adNetworkName').value = '';
    if (document.getElementById('adNetworkScript')) document.getElementById('adNetworkScript').value = '';
    if (document.getElementById('adPriority')) document.getElementById('adPriority').value = '1';
    
    await loadAdNetworks();
}

window.editAdNetwork = async function(adId) {
    const ad = allAdNetworks.find(a => a.id === adId);
    if (!ad) return;
    const newScript = prompt('Edit ad script/URL:', ad.script);
    const newPriority = prompt('Edit priority (1=highest):', ad.priority);
    if (newScript) {
        await updateDoc(doc(db, 'ad_networks', adId), { 
            script: newScript, 
            priority: parseInt(newPriority) || ad.priority 
        });
        showToast('Ad network updated');
        await loadAdNetworks();
    }
}

window.deleteAdNetwork = async function(adId) {
    if (confirm('Delete this ad network?')) {
        await deleteDoc(doc(db, 'ad_networks', adId));
        showToast('Ad network deleted');
        await loadAdNetworks();
    }
}

// ========== AD SETTINGS ==========
async function loadAdSettings() {
    try {
        const adSettingsSnap = await getDoc(doc(db, 'settings', 'ad'));
        if (adSettingsSnap.exists()) {
            const data = adSettingsSnap.data();
            if (document.getElementById('adReward')) document.getElementById('adReward').value = data.adReward || 0.60;
            if (document.getElementById('adDailyLimit')) document.getElementById('adDailyLimit').value = data.adDailyLimit || 20;
            if (document.getElementById('adCooldown')) document.getElementById('adCooldown').value = data.adCooldown || 30;
            if (document.getElementById('adTimerDuration')) document.getElementById('adTimerDuration').value = data.adTimerDuration || 30;
        }
    } catch (error) {
        console.error("Error loading ad settings:", error);
    }
}

window.saveAdSettings = async function() {
    const adSettings = {
        adReward: parseFloat(document.getElementById('adReward')?.value || 0.60),
        adDailyLimit: parseInt(document.getElementById('adDailyLimit')?.value || 20),
        adCooldown: parseInt(document.getElementById('adCooldown')?.value || 30),
        adTimerDuration: parseInt(document.getElementById('adTimerDuration')?.value || 30),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await setDoc(doc(db, 'settings', 'ad'), adSettings);
        showToast('✅ Ad settings saved successfully!', 'success');
        addToLog('Ad settings updated', 'info');
    } catch (error) {
        console.error("Error saving ad settings:", error);
        showToast('Error saving ad settings', 'error');
    }
};

// ========== REFERRAL SETTINGS ==========
async function loadReferralSettings() {
    try {
        const refSnap = await getDoc(doc(db, 'settings', 'referral'));
        if (refSnap.exists()) {
            const data = refSnap.data();
            if (document.getElementById('refCommission')) document.getElementById('refCommission').value = data.commission || 15;
            if (document.getElementById('refBonus')) document.getElementById('refBonus').value = data.bonus || 25;
        }
    } catch (error) {
        console.error("Error loading referral settings:", error);
    }
}

window.updateReferralSettings = async function() {
    const commission = parseInt(document.getElementById('refCommission')?.value || 15);
    const bonus = parseInt(document.getElementById('refBonus')?.value || 25);
    await setDoc(doc(db, 'settings', 'referral'), { commission, bonus, updatedAt: new Date().toISOString() });
    showToast('Referral settings updated!');
    addToLog(`Referral settings updated: ${commission}% commission, ₨${bonus} bonus`, 'info');
}

// ========== APP SETTINGS ==========
async function loadAppSettings() {
    try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'app'));
        if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            if (document.getElementById('minWithdrawal')) document.getElementById('minWithdrawal').value = data.minWithdrawal || 200;
            if (document.getElementById('dailyTaskLimit')) document.getElementById('dailyTaskLimit').value = data.dailyTaskLimit || 20;
            if (document.getElementById('referralCommission')) document.getElementById('referralCommission').value = data.referralCommission || 15;
            if (document.getElementById('welcomeBonus')) document.getElementById('welcomeBonus').value = data.welcomeBonus || 100;
        }
    } catch (error) {
        console.error("Error loading app settings:", error);
    }
}

window.saveSettings = async function() {
    const settings = {
        minWithdrawal: parseInt(document.getElementById('minWithdrawal')?.value || 200),
        dailyTaskLimit: parseInt(document.getElementById('dailyTaskLimit')?.value || 20),
        referralCommission: parseInt(document.getElementById('referralCommission')?.value || 15),
        welcomeBonus: parseInt(document.getElementById('welcomeBonus')?.value || 100),
        updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'settings', 'app'), settings);
    showToast('App settings saved!');
    addToLog('App settings updated', 'info');
}

// ========== BULK ACTIONS ==========
window.giveBonusToAll = async function() {
    const amount = prompt('Enter bonus amount for ALL users (in rupees):');
    if (amount && !isNaN(amount) && parseInt(amount) > 0) {
        let count = 0;
        for (const user of allUsers) {
            const userId = user.userId || user.id;
            await updateDoc(doc(db, 'users', userId), { balance: increment(parseInt(amount)) });
            count++;
        }
        showToast(`Gave ₨${amount} bonus to ${count} users!`);
        addToLog(`Gave ₨${amount} bonus to all ${count} users`, 'success');
        await loadUsers();
        updateStats();
    }
}

window.sendNotificationToAll = function() {
    const msg = prompt('Enter notification message to send to all users:');
    if (msg) {
        // Store notification in Firestore for app to read
        addDoc(collection(db, 'notifications'), {
            message: msg,
            type: 'broadcast',
            createdAt: new Date(),
            readBy: []
        });
        showToast(`Notification sent to all users: ${msg}`, 'info');
        addToLog(`Broadcast notification sent: ${msg}`, 'info');
    }
}

window.backupData = function() {
    const data = { 
        users: allUsers, 
        tasks: allTasks, 
        requests: allTaskRequests, 
        withdrawals: allWithdrawals, 
        offers: allOffers,
        adNetworks: allAdNetworks,
        date: new Date().toISOString() 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kamaonow_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded successfully!');
    addToLog('Data backup exported', 'info');
}

window.resetAllData = async function() {
    const confirmText = prompt('⚠️ WARNING: This will delete ALL data! Type "RESET ALL" to confirm:');
    if (confirmText === 'RESET ALL') {
        const collections = ['users', 'tasks', 'task_requests', 'withdrawal_requests', 'offers', 'ad_networks', 'transactions', 'notifications'];
        for (const col of collections) {
            const snapshot = await getDocs(collection(db, col));
            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, col, docSnap.id));
            }
        }
        showToast('All data reset successfully!');
        addToLog('⚠️ ALL DATA WAS RESET!', 'error');
        setTimeout(() => location.reload(), 2000);
    }
}

window.exportUsersCSV = function() {
    let csv = 'Name,Email,Phone,Balance,Tasks Completed,Referrals,Status,Joined Date\n';
    allUsers.forEach(u => {
        csv += `"${u.name || ''}","${u.email || ''}","${u.phone || ''}",${u.balance || 0},${(u.completedTasks || []).length},${u.referrals || 0},${u.status || 'active'},"${u.createdAt || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Users exported to CSV!');
    addToLog('Users list exported to CSV', 'info');
}

// ========== UI NAVIGATION ==========
window.showPanel = function(panelName) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(`${panelName}Panel`);
    if (targetPanel) targetPanel.classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.querySelector(`.tab-btn[data-panel="${panelName}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // Refresh data when switching panels
    if (panelName === 'analytics') updateAnalytics();
    if (panelName === 'logs') renderLogs();
}

// ========== FILTER HANDLERS ==========
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.getAttribute('data-filter');
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
        renderTaskRequests();
        renderWithdrawals();
    });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.getAttribute('data-panel');
        if (panel) showPanel(panel);
    });
});

// ========== AUTHENTICATION ==========
window.verifyAdminLogin = function() {
    const pwd = document.getElementById('adminPassword').value;
    if (pwd === 'admin123') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminApp').style.display = 'block';
        loadAllData();
        
        // Setup realtime listeners
        onSnapshot(collection(db, 'users'), () => { loadUsers(); updateStats(); });
        onSnapshot(collection(db, 'tasks'), () => loadTasks());
        onSnapshot(collection(db, 'task_requests'), () => { loadTaskRequests(); renderRecentActivities(); });
        onSnapshot(collection(db, 'withdrawal_requests'), () => { loadWithdrawals(); renderRecentActivities(); });
        onSnapshot(collection(db, 'offers'), () => loadOffers());
        
        addToLog('Admin logged in successfully', 'success');
    } else { 
        showToast('Wrong password! Use: admin123', 'error'); 
    }
}

window.logoutAdmin = function() { 
    document.getElementById('loginScreen').style.display = 'flex'; 
    document.getElementById('adminApp').style.display = 'none'; 
    document.getElementById('adminPassword').value = '';
    addToLog('Admin logged out', 'info');
}

// ========== FIX FOR MODAL CLOSE BUTTONS ==========
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal')?.classList.remove('show');
    });
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

console.log("✅ KamaoNow Ultimate Admin Panel - FULLY FUNCTIONAL!");
console.log("📊 10 Screens: Dashboard | Users | Tasks | Task Requests | Withdrawals | Offers | Referrals | Analytics | Settings | Logs");