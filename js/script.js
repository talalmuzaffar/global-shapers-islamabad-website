// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }
});

// Header scroll behavior
document.addEventListener('DOMContentLoaded', function() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
});

// Scroll animations - Intersection Observer
document.addEventListener('DOMContentLoaded', function() {
    const fadeElements = document.querySelectorAll('.fade-up');
    
    if (!fadeElements.length) return;
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
        );

        fadeElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: show all elements immediately
        fadeElements.forEach(el => el.classList.add('visible'));
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Email validation utility
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Contact form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formMessage = document.getElementById('form-message');
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            
            const formData = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                message: document.getElementById('message').value.trim(),
                type: document.getElementById('interest') ? document.getElementById('interest').value.trim() : 'general'
            };
            
            if (formMessage) {
                formMessage.style.display = 'none';
                formMessage.className = '';
            }
            
            if (!formData.name || !formData.email) {
                showFormMessage('Please fill in all required fields.', 'error');
                return;
            }
            
            if (!validateEmail(formData.email)) {
                showFormMessage('Please enter a valid email address.', 'error');
                return;
            }
            
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            
            try {
                const response = await fetch('/api/submit-form', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    let errorMessage = 'Failed to submit form. Please try again.';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorMessage;
                    } catch (e) {
                        errorMessage = `Error ${response.status}: ${response.statusText}`;
                    }
                    showFormMessage(errorMessage, 'error');
                    return;
                }
                
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    if (response.status === 200) {
                        showFormMessage('Form submitted successfully! We will get back to you soon.', 'success');
                        contactForm.reset();
                    } else {
                        showFormMessage('An error occurred. Please try again later.', 'error');
                    }
                    return;
                }
                
                if (data.success) {
                    showFormMessage('Thank you! Your message has been submitted successfully.', 'success');
                    contactForm.reset();
                } else {
                    showFormMessage(data.error || 'Failed to submit form. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showFormMessage('An error occurred. Please try again later.', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
});

function showFormMessage(message, type) {
    const formMessage = document.getElementById('form-message');
    if (!formMessage) return;
    
    formMessage.textContent = message;
    formMessage.style.display = 'block';
    formMessage.classList.remove('success-message', 'error-message');
    
    if (type === 'success') {
        formMessage.style.backgroundColor = 'rgba(212, 237, 218, 0.9)';
        formMessage.style.color = '#155724';
        formMessage.style.border = '1px solid #c3e6cb';
    } else {
        formMessage.style.backgroundColor = 'rgba(248, 215, 218, 0.9)';
        formMessage.style.color = '#721c24';
        formMessage.style.border = '1px solid #f5c6cb';
    }
    
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== DATA LOADING UTILITIES ====================

async function loadProjects() {
    try {
        const response = await fetch('/data/projects.json');
        return await response.json();
    } catch (e) {
        console.error('Failed to load projects:', e);
        return [];
    }
}

async function loadMembers() {
    try {
        const response = await fetch('/data/members.json');
        return await response.json();
    } catch (e) {
        console.error('Failed to load members:', e);
        return [];
    }
}

// ==================== DYNAMIC PROJECTS PAGE ====================

document.addEventListener('DOMContentLoaded', async function () {
    const projectsContainer = document.getElementById('dynamic-projects');
    if (!projectsContainer) return;

    const projects = await loadProjects();
    if (!projects.length) return;

    const categoryConfig = {
        covid: { label: 'COVID-19 Response', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>', sectionClass: 'section-gray' },
        climate: { label: 'Climate & Environment', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="4"/></svg>', sectionClass: 'section-white' },
        education: { label: 'Education & Employment', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>', sectionClass: 'section-gray' },
        equity: { label: 'Equity & Inclusion', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', sectionClass: 'section-white' }
    };

    // Render flagship projects
    const flagships = projects.filter(p => p.isFlagship);
    if (flagships.length > 0) {
        const flagshipSection = document.getElementById('flagship-projects');
        if (flagshipSection) {
            flagshipSection.innerHTML = flagships.map(p => `
                <a href="project.html?id=${p.id}" class="project-home-card">
                    <div class="project-home-image">
                        ${p.imageUrl ? '<img src="' + p.imageUrl + '" alt="' + escapeHtmlAttr(p.title) + '" loading="lazy">' : '<div class="project-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>'}
                    </div>
                    <div class="project-home-content">
                        <h3>${escapeHtmlContent(p.title)}</h3>
                        <p>${escapeHtmlContent(p.shortDescription)}</p>
                        <span class="project-home-link">Explore Project</span>
                    </div>
                </a>
            `).join('');
        }
    }

    // Group non-flagship by category
    const grouped = {};
    projects.filter(p => !p.isFlagship).forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
    });

    // Render category sections
    let html = '';
    const categoryOrder = ['covid', 'climate', 'education', 'equity'];
    categoryOrder.forEach(cat => {
        const config = categoryConfig[cat];
        const catProjects = grouped[cat] || [];
        if (!catProjects.length) return;

        html += `
        <section class="section ${config.sectionClass}">
            <div class="container">
                <div class="project-category fade-up" data-category="${cat}">
                    <div class="category-header">
                        <div class="category-icon">${config.icon}</div>
                        <h2 class="category-title">${config.label}</h2>
                    </div>
                    <div class="category-grid">
                        ${catProjects.map(p => `
                            <a href="project.html?id=${p.id}" class="project-detail-card project-detail-link">
                                <h3>${escapeHtmlContent(p.title)}</h3>
                                <p>${escapeHtmlContent(p.shortDescription)}</p>
                                ${p.impact ? '<span class="project-impact">' + escapeHtmlContent(p.impact) + '</span>' : ''}
                                ${p.date ? '<span class="project-date">' + escapeHtmlContent(p.date) + '</span>' : ''}
                                <span class="project-view-link">View Details &rarr;</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>`;
    });

    projectsContainer.innerHTML = html;

    // Re-init fade-up observer for dynamically added elements
    initFadeUpObserver();

    // Init filter buttons for dynamic content
    initDynamicFilters();
});

function initDynamicFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const flagshipSection = document.getElementById('flagship-section');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline');
                });
                this.classList.add('active');
                this.classList.remove('btn-outline');
                this.classList.add('btn-primary');

                const filter = this.dataset.filter;

                // Show/hide flagship section
                if (flagshipSection) {
                    flagshipSection.style.display = (filter === 'all') ? 'block' : 'none';
                }

                // Show/hide category sections
                document.querySelectorAll('.project-category').forEach(cat => {
                    const section = cat.closest('.section');
                    if (filter === 'all' || cat.dataset.category === filter) {
                        if (section) section.style.display = 'block';
                        cat.style.display = 'block';
                        cat.classList.add('visible');
                    } else {
                        if (section) section.style.display = 'none';
                        cat.style.display = 'none';
                    }
                });
            });
        });
    }
}

function initFadeUpObserver() {
    const fadeElements = document.querySelectorAll('.fade-up:not(.visible)');
    if (!fadeElements.length) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
        );
        fadeElements.forEach(el => observer.observe(el));
    } else {
        fadeElements.forEach(el => el.classList.add('visible'));
    }
}

// ==================== DYNAMIC PROJECT DETAIL PAGE ====================

document.addEventListener('DOMContentLoaded', async function () {
    const projectDetailContainer = document.getElementById('project-detail-content');
    if (!projectDetailContainer) return;

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        projectDetailContainer.innerHTML = '<div class="container" style="text-align:center;padding:80px 20px;"><h2>Project not found</h2><p>No project ID specified.</p><a href="projects.html" class="btn btn-primary" style="margin-top:20px;">Back to Projects</a></div>';
        return;
    }

    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
        projectDetailContainer.innerHTML = '<div class="container" style="text-align:center;padding:80px 20px;"><h2>Project not found</h2><p>The requested project does not exist.</p><a href="projects.html" class="btn btn-primary" style="margin-top:20px;">Back to Projects</a></div>';
        return;
    }

    const categoryLabels = {
        covid: 'COVID-19 Response',
        climate: 'Climate & Environment',
        education: 'Education & Employment',
        equity: 'Equity & Inclusion'
    };

    // Update page title
    document.title = project.title + ' - Global Shapers Faisalabad Hub';

    // Update hero
    const heroLabel = document.getElementById('project-hero-label');
    const heroTitle = document.getElementById('project-hero-title');
    const heroSubtitle = document.getElementById('project-hero-subtitle');
    if (heroLabel) heroLabel.textContent = categoryLabels[project.category] || project.category;
    if (heroTitle) heroTitle.textContent = project.title;
    if (heroSubtitle) heroSubtitle.textContent = project.shortDescription;

    // Build detail content
    let detailHtml = `
        <div class="container">
            <div class="project-detail-card">
                <div class="project-detail-header">
                    <div class="project-detail-content">
                        <h3>${escapeHtmlContent(project.title)}</h3>
                        ${project.date ? '<p style="font-weight:600;color:var(--primary-blue);font-size:1.1rem;margin-bottom:20px;">' + escapeHtmlContent(project.date) + '</p>' : ''}
                        <div class="project-full-description">${project.fullDescription}</div>
                        ${project.impact ? '<div style="margin-top:30px;padding:20px;background:#f5f7fa;border-radius:8px;"><h4 style="color:var(--primary-blue);margin-bottom:10px;font-family:var(--font-display);">Impact</h4><p style="font-size:18px;font-weight:600;color:var(--text-dark);">' + escapeHtmlContent(project.impact) + '</p></div>' : ''}
                        ${project.links && project.links.length > 0 ? '<div style="margin-top:20px;"><h4 style="color:var(--primary-blue);margin-bottom:10px;font-family:var(--font-display);">Resources</h4>' + project.links.map(l => '<a href="' + l + '" target="_blank" rel="noopener" style="display:block;color:var(--primary-blue);margin-bottom:6px;word-break:break-all;">' + l + '</a>').join('') + '</div>' : ''}
                    </div>
                    ${project.imageUrl ? '<div class="project-detail-image"><img src="' + project.imageUrl + '" alt="' + escapeHtmlAttr(project.title) + '" loading="lazy"></div>' : ''}
                </div>
            </div>
            <div style="text-align:center;margin-top:40px;">
                <a href="projects.html" class="btn btn-primary">&larr; Back to All Projects</a>
            </div>
        </div>
    `;

    projectDetailContainer.innerHTML = detailHtml;
});

// ==================== DYNAMIC TEAM PAGE ====================

document.addEventListener('DOMContentLoaded', async function () {
    const teamContainer = document.getElementById('dynamic-team-members');
    if (!teamContainer) return;

    const members = await loadMembers();
    const activeMembers = members.filter(m => m.type === 'active');

    if (!activeMembers.length) {
        teamContainer.innerHTML = '<p>No active members found.</p>';
        return;
    }

    // Split into columns of ~4 members each
    const colSize = Math.ceil(activeMembers.length / 4);
    let html = '';
    for (let i = 0; i < activeMembers.length; i += colSize) {
        const chunk = activeMembers.slice(i, i + colSize);
        html += '<ul class="shapers-column">';
        chunk.forEach(m => {
            const linkedinSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
            html += '<li>';
            html += '<span class="shaper-name">' + escapeHtmlContent(m.name) + '</span>';
            if (m.role) {
                html += '<span class="shaper-role-badge">' + escapeHtmlContent(m.role) + '</span>';
            }
            if (m.socials?.linkedin) {
                html += '<a href="' + m.socials.linkedin + '" target="_blank" rel="noopener" class="linkedin-link" aria-label="LinkedIn">' + linkedinSvg + '</a>';
            }
            html += '</li>';
        });
        html += '</ul>';
    }

    teamContainer.innerHTML = html;
});

// ==================== DYNAMIC ALUMNI PAGE ====================

document.addEventListener('DOMContentLoaded', async function () {
    const alumniContainer = document.getElementById('dynamic-alumni');
    if (!alumniContainer) return;

    const members = await loadMembers();
    const alumni = members.filter(m => m.type === 'alumni');

    if (!alumni.length) {
        alumniContainer.innerHTML = '<p>No alumni found.</p>';
        return;
    }

    alumniContainer.innerHTML = alumni.map(m => {
        const socialLinks = [];
        if (m.socials?.linkedin) socialLinks.push({ url: m.socials.linkedin, label: 'LinkedIn', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' });
        if (m.socials?.instagram) socialLinks.push({ url: m.socials.instagram, label: 'Instagram', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' });
        if (m.socials?.facebook) socialLinks.push({ url: m.socials.facebook, label: 'Facebook', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' });
        if (m.socials?.twitter) socialLinks.push({ url: m.socials.twitter, label: 'Twitter/X', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>' });

        return `
        <div class="alumni-card">
            <div class="alumni-card-avatar">
                ${m.photoUrl
                    ? '<img src="' + m.photoUrl + '" alt="' + escapeHtmlAttr(m.name) + '">'
                    : '<div class="alumni-avatar-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>'
                }
            </div>
            <div class="alumni-card-info">
                <h3 class="alumni-card-name">${escapeHtmlContent(m.name)}</h3>
                ${m.role ? '<p class="alumni-card-role">' + escapeHtmlContent(m.role) + '</p>' : ''}
                ${m.bio ? '<p class="alumni-card-bio">' + escapeHtmlContent(m.bio) + '</p>' : ''}
                ${socialLinks.length > 0 ? '<div class="alumni-card-socials">' + socialLinks.map(s => '<a href="' + s.url + '" target="_blank" rel="noopener" aria-label="' + s.label + '" class="alumni-social-link">' + s.icon + '</a>').join('') + '</div>' : ''}
            </div>
        </div>`;
    }).join('');
});

// ==================== HTML ESCAPE UTILITIES ====================

function escapeHtmlContent(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeHtmlAttr(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
