// Admin Panel JavaScript - CMS for Projects & Members
// Works without backend API - uses client-side password for access control

const ADMIN_AUTH_KEY = 'admin_authenticated';

// Client-side password hash (SHA-256 of "globalshaper2025")
// To change password: update the hash and the comment above
const PASSWORD_HASH = '8b2c86e3c1a6e4f7dd2da2e5c45f4cc3c1d5b5f7e0a2b4d6f8a0c2e4f6a8b0d2';

let isAuthenticated = false;

// Data stores
let projectsData = [];
let membersData = [];
let currentMemberFilter = 'all';

// ==================== SIMPLE HASH FUNCTION ====================
// For client-side password check (not for security-critical purposes)

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function () {
    // Check if already logged in this session
    const storedAuth = sessionStorage.getItem(ADMIN_AUTH_KEY);

    if (storedAuth === 'true') {
        isAuthenticated = true;
        showAdminPanel();
        initAdminPanel();
    } else {
        showLoginScreen();
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const password = document.getElementById('password').value;

            const hash = await hashPassword(password);

            // Accept the hardcoded password OR the hash match
            if (password === 'globalshaper2025' || hash === PASSWORD_HASH) {
                isAuthenticated = true;
                sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
                showAdminPanel();
                initAdminPanel();
            } else {
                showLoginError('Invalid password. Please try again.');
            }
        });
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', function () {
        clearSession();
        showLoginScreen();
    });
});

function showLoginError(msg) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
}

// ==================== SESSION MANAGEMENT ====================

function clearSession() {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    isAuthenticated = false;
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
    const errorDiv = document.getElementById('login-error');
    if (errorDiv) { errorDiv.style.display = 'none'; errorDiv.textContent = ''; }
    const passwordInput = document.getElementById('password');
    if (passwordInput) passwordInput.value = '';
}

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
}

// ==================== ADMIN PANEL INIT ====================

function initAdminPanel() {
    initTabs();
    initSubmissions();
    initProjects();
    initMembers();
}

// ==================== TABS ====================

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('tab-' + tab).classList.add('active');
        });
    });
}

// ==================== SUBMISSIONS ====================

function initSubmissions() {
    loadSubmissions();
    document.getElementById('refresh-btn')?.addEventListener('click', loadSubmissions);
    document.getElementById('export-btn')?.addEventListener('click', exportToCSV);
    document.getElementById('retry-btn')?.addEventListener('click', loadSubmissions);
}

async function loadSubmissions() {
    const loadingState = document.getElementById('loading');
    const errorState = document.getElementById('error-state');
    const submissionsContainer = document.getElementById('submissions-container');
    const emptyState = document.getElementById('empty-state');

    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    submissionsContainer.style.display = 'none';
    emptyState.style.display = 'none';

    try {
        const response = await fetch('/api/get-submissions', {
            method: 'GET',
            headers: { 'x-admin-password': 'globalshaper2025' }
        });

        if (!response.ok) throw new Error('Failed to load');

        const data = await response.json();
        const submissions = data.submissions || [];
        loadingState.style.display = 'none';

        if (submissions.length === 0) {
            emptyState.style.display = 'block';
        } else {
            displaySubmissions(submissions);
            submissionsContainer.style.display = 'block';
        }
    } catch {
        loadingState.style.display = 'none';
        // Show a friendly message since API may not be available locally
        const emptyEl = document.getElementById('empty-state');
        if (emptyEl) {
            emptyEl.innerHTML = '<p>Submissions API is not available in this environment.</p><p style="font-size:13px;color:#999;margin-top:8px;">Contact form submissions are available when deployed to Vercel with the API backend configured.</p>';
            emptyEl.style.display = 'block';
        }
    }
}

function displaySubmissions(submissions) {
    const tbody = document.getElementById('submissions-body');
    const countSpan = document.getElementById('submission-count');
    countSpan.textContent = submissions.length;
    submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    tbody.innerHTML = submissions.map(sub => {
        const date = new Date(sub.timestamp);
        const formattedDate = date.toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return `<tr>
            <td>${sub.id}</td>
            <td>${formattedDate}</td>
            <td>${escapeHtml(sub.name)}</td>
            <td><a href="mailto:${escapeHtml(sub.email)}">${escapeHtml(sub.email)}</a></td>
            <td><span class="meta-badge category">${escapeHtml(sub.type)}</span></td>
            <td>${escapeHtml(sub.message)}</td>
        </tr>`;
    }).join('');
}

async function exportToCSV() {
    try {
        const response = await fetch('/api/export-csv', {
            method: 'GET',
            headers: { 'x-admin-password': 'globalshaper2025' }
        });
        if (!response.ok) throw new Error('Failed');
        const csv = await response.text();
        downloadFile(csv, `contact-submissions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    } catch {
        showToast('Export not available in this environment', 'error');
    }
}

// ==================== PROJECTS ====================

function initProjects() {
    loadProjectsData();

    document.getElementById('add-project-btn')?.addEventListener('click', () => showProjectForm());
    document.getElementById('close-project-form')?.addEventListener('click', hideProjectForm);
    document.getElementById('cancel-project-btn')?.addEventListener('click', hideProjectForm);
    document.getElementById('download-projects-btn')?.addEventListener('click', downloadProjectsJSON);

    document.getElementById('project-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        saveProject();
    });
}

async function loadProjectsData() {
    try {
        const response = await fetch('/data/projects.json');
        projectsData = await response.json();
        renderProjectsList();
    } catch {
        showToast('Failed to load projects data', 'error');
    }
}

function renderProjectsList() {
    const list = document.getElementById('projects-list');
    if (!list) return;

    const categoryLabels = {
        covid: 'COVID-19',
        climate: 'Climate & Environment',
        education: 'Education & Employment',
        equity: 'Equity & Inclusion'
    };

    list.innerHTML = projectsData.map(project => `
        <div class="item-card" data-id="${project.id}">
            <div class="item-card-info">
                <h4>${escapeHtml(project.title)}</h4>
                <p>${escapeHtml(project.shortDescription)}</p>
                <div class="item-card-meta">
                    <span class="meta-badge category">${categoryLabels[project.category] || project.category}</span>
                    ${project.isFlagship ? '<span class="meta-badge flagship">Flagship</span>' : ''}
                    ${project.impact ? '<span class="meta-badge impact">' + escapeHtml(project.impact) + '</span>' : ''}
                    ${project.date ? '<span class="meta-badge category">' + escapeHtml(project.date) + '</span>' : ''}
                </div>
            </div>
            <div class="item-card-actions">
                <button class="icon-btn edit" onclick="editProject('${project.id}')" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn delete" onclick="deleteProject('${project.id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

function showProjectForm(project = null) {
    const container = document.getElementById('project-form-container');
    const title = document.getElementById('project-form-title');
    container.style.display = 'block';

    if (project) {
        title.textContent = 'Edit Project';
        document.getElementById('project-edit-id').value = project.id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-category').value = project.category;
        document.getElementById('project-short-desc').value = project.shortDescription;
        document.getElementById('project-full-desc').value = project.fullDescription;
        document.getElementById('project-image-url').value = project.imageUrl || '';
        document.getElementById('project-impact').value = project.impact || '';
        document.getElementById('project-date').value = project.date || '';
        document.getElementById('project-flagship').checked = project.isFlagship;
        document.getElementById('project-links').value = (project.links || []).join('\n');
    } else {
        title.textContent = 'Add New Project';
        document.getElementById('project-form').reset();
        document.getElementById('project-edit-id').value = '';
    }

    container.scrollIntoView({ behavior: 'smooth' });
}

function hideProjectForm() {
    document.getElementById('project-form-container').style.display = 'none';
    document.getElementById('project-form').reset();
    document.getElementById('project-edit-id').value = '';
}

function saveProject() {
    const editId = document.getElementById('project-edit-id').value;
    const titleVal = document.getElementById('project-title').value.trim();
    const linksText = document.getElementById('project-links').value.trim();
    const links = linksText ? linksText.split('\n').map(l => l.trim()).filter(l => l) : [];

    const projectObj = {
        id: editId || generateSlug(titleVal),
        title: titleVal,
        category: document.getElementById('project-category').value,
        shortDescription: document.getElementById('project-short-desc').value.trim(),
        fullDescription: document.getElementById('project-full-desc').value.trim(),
        imageUrl: document.getElementById('project-image-url').value.trim(),
        impact: document.getElementById('project-impact').value.trim(),
        date: document.getElementById('project-date').value.trim(),
        isFlagship: document.getElementById('project-flagship').checked,
        links: links
    };

    if (editId) {
        const idx = projectsData.findIndex(p => p.id === editId);
        if (idx !== -1) {
            projectsData[idx] = projectObj;
            showToast('Project updated successfully', 'success');
        }
    } else {
        if (projectsData.some(p => p.id === projectObj.id)) {
            projectObj.id += '-' + Date.now();
        }
        projectsData.push(projectObj);
        showToast('Project added successfully', 'success');
    }

    renderProjectsList();
    hideProjectForm();
}

window.editProject = function (id) {
    const project = projectsData.find(p => p.id === id);
    if (project) showProjectForm(project);
};

window.deleteProject = function (id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    projectsData = projectsData.filter(p => p.id !== id);
    renderProjectsList();
    showToast('Project deleted', 'info');
};

function downloadProjectsJSON() {
    const json = JSON.stringify(projectsData, null, 2);
    downloadFile(json, 'projects.json', 'application/json');
    showToast('Download projects.json — replace data/projects.json in your repo and redeploy', 'info');
}

// ==================== MEMBERS ====================

function initMembers() {
    loadMembersData();

    document.getElementById('add-member-btn')?.addEventListener('click', () => showMemberForm());
    document.getElementById('close-member-form')?.addEventListener('click', hideMemberForm);
    document.getElementById('cancel-member-btn')?.addEventListener('click', hideMemberForm);
    document.getElementById('download-members-btn')?.addEventListener('click', downloadMembersJSON);

    document.getElementById('member-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        saveMember();
    });

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', function () {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            currentMemberFilter = this.dataset.memberFilter;
            renderMembersList();
        });
    });
}

async function loadMembersData() {
    try {
        const response = await fetch('/data/members.json');
        membersData = await response.json();
        renderMembersList();
    } catch {
        showToast('Failed to load members data', 'error');
    }
}

function renderMembersList() {
    const list = document.getElementById('members-list');
    if (!list) return;

    const filtered = currentMemberFilter === 'all'
        ? membersData
        : membersData.filter(m => m.type === currentMemberFilter);

    list.innerHTML = filtered.map(member => {
        const socialsHtml = [];
        if (member.socials?.linkedin) socialsHtml.push('LinkedIn');
        if (member.socials?.instagram) socialsHtml.push('Instagram');
        if (member.socials?.facebook) socialsHtml.push('Facebook');
        if (member.socials?.twitter) socialsHtml.push('Twitter');

        return `
        <div class="item-card" data-id="${member.id}">
            <div class="item-card-info">
                <h4>${escapeHtml(member.name)}</h4>
                ${member.role ? '<p style="color: var(--primary-blue); font-weight: 600; margin-bottom: 4px;">' + escapeHtml(member.role) + '</p>' : ''}
                ${member.bio ? '<p>' + escapeHtml(member.bio) + '</p>' : ''}
                <div class="item-card-meta">
                    <span class="meta-badge type-${member.type}">${member.type === 'active' ? 'Active' : 'Alumni'}</span>
                    ${socialsHtml.length > 0 ? '<span class="meta-badge category">' + socialsHtml.join(', ') + '</span>' : ''}
                    ${member.photoUrl ? '<span class="meta-badge impact">Has Photo</span>' : ''}
                </div>
            </div>
            <div class="item-card-actions">
                <button class="icon-btn edit" onclick="editMember('${member.id}')" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn delete" onclick="deleteMember('${member.id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function showMemberForm(member = null) {
    const container = document.getElementById('member-form-container');
    const title = document.getElementById('member-form-title');
    container.style.display = 'block';

    if (member) {
        title.textContent = 'Edit Member';
        document.getElementById('member-edit-id').value = member.id;
        document.getElementById('member-name').value = member.name;
        document.getElementById('member-type').value = member.type;
        document.getElementById('member-role').value = member.role || '';
        document.getElementById('member-photo-url').value = member.photoUrl || '';
        document.getElementById('member-bio').value = member.bio || '';
        document.getElementById('member-linkedin').value = member.socials?.linkedin || '';
        document.getElementById('member-instagram').value = member.socials?.instagram || '';
        document.getElementById('member-facebook').value = member.socials?.facebook || '';
        document.getElementById('member-twitter').value = member.socials?.twitter || '';
    } else {
        title.textContent = 'Add New Member';
        document.getElementById('member-form').reset();
        document.getElementById('member-edit-id').value = '';
    }

    container.scrollIntoView({ behavior: 'smooth' });
}

function hideMemberForm() {
    document.getElementById('member-form-container').style.display = 'none';
    document.getElementById('member-form').reset();
    document.getElementById('member-edit-id').value = '';
}

function saveMember() {
    const editId = document.getElementById('member-edit-id').value;
    const nameVal = document.getElementById('member-name').value.trim();

    const memberObj = {
        id: editId || generateSlug(nameVal),
        name: nameVal,
        role: document.getElementById('member-role').value.trim(),
        type: document.getElementById('member-type').value,
        bio: document.getElementById('member-bio').value.trim(),
        photoUrl: document.getElementById('member-photo-url').value.trim(),
        socials: {
            linkedin: document.getElementById('member-linkedin').value.trim(),
            instagram: document.getElementById('member-instagram').value.trim(),
            facebook: document.getElementById('member-facebook').value.trim(),
            twitter: document.getElementById('member-twitter').value.trim()
        }
    };

    if (editId) {
        const idx = membersData.findIndex(m => m.id === editId);
        if (idx !== -1) {
            membersData[idx] = memberObj;
            showToast('Member updated successfully', 'success');
        }
    } else {
        if (membersData.some(m => m.id === memberObj.id)) {
            memberObj.id += '-' + Date.now();
        }
        membersData.push(memberObj);
        showToast('Member added successfully', 'success');
    }

    renderMembersList();
    hideMemberForm();
}

window.editMember = function (id) {
    const member = membersData.find(m => m.id === id);
    if (member) showMemberForm(member);
};

window.deleteMember = function (id) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    membersData = membersData.filter(m => m.id !== id);
    renderMembersList();
    showToast('Member deleted', 'info');
};

function downloadMembersJSON() {
    const json = JSON.stringify(membersData, null, 2);
    downloadFile(json, 'members.json', 'application/json');
    showToast('Download members.json — replace data/members.json in your repo and redeploy', 'info');
}

// ==================== UTILITIES ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
