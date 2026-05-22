/* ============================================================
   VELVET PAWS — main.js
   Handles: Navigation, Scroll animations, Pet reveal,
            Counter animation, Form submissions, Comment loading
   ============================================================ */

/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initPetReveal();
  initCounters();
  loadComments();
});

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Close menu on link click (mobile)
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('navLinks').classList.remove('open');
    });
  });
}

function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  navLinks.classList.toggle('open');
}

/* ============================================================
   SCROLL REVEAL — Intersection Observer
   ============================================================ */
function initScrollReveal() {
  const revealClasses = ['.reveal', '.reveal-left', '.reveal-right'];
  const elements = document.querySelectorAll(revealClasses.join(', '));

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger siblings slightly
          const siblings = entry.target.parentElement
            ? Array.from(entry.target.parentElement.children).filter(el =>
                el.classList.contains('reveal') || el.classList.contains('reveal-left') || el.classList.contains('reveal-right')
              )
            : [];
          const idx = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = idx > 0 ? `${idx * 0.1}s` : '0s';
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ============================================================
   PET REVEAL — slides up from bottom when section enters view
   ============================================================ */
function initPetReveal() {
  const petContainer = document.getElementById('petImageContainer');
  if (!petContainer) return;

  const petObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Small delay for dramatic effect
          setTimeout(() => {
            petContainer.classList.add('revealed');
          }, 300);
          petObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  petObserver.observe(petContainer);
}

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
function initCounters() {
  const counters = document.querySelectorAll('.stat-item h3');
  if (!counters.length) return;

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(el) {
  const original = el.textContent;
  // Extract numeric part
  const numMatch = original.match(/[\d,]+/);
  if (!numMatch) return;

  const target = parseInt(numMatch[0].replace(',', ''));
  const prefix = original.split(numMatch[0])[0] || '';
  const suffix = original.split(numMatch[0])[1] || '';

  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ============================================================
   FORM SUBMISSION — Contact Form
   ============================================================ */
async function submitForm(event) {
  event.preventDefault();
  const form = document.getElementById('contactForm');
  const btn = form.querySelector('button[type="submit"]');
  const successDiv = document.getElementById('formSuccess');

  const data = {
    name:    form.name.value,
    email:   form.email.value,
    phone:   form.phone.value,
    service: form.service.value,
    petName: form.petName.value,
    message: form.message.value,
    date:    new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  };

  btn.textContent = 'Sending…';
  btn.disabled = true;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      form.reset();
      successDiv.style.display = 'block';
      btn.textContent = 'Message Sent ✅';
    } else {
      throw new Error('Server error');
    }
  } catch {
    // Fallback: show success anyway (for demo without server)
    form.reset();
    successDiv.style.display = 'block';
    btn.textContent = 'Message Sent ✅';
  }
}

/* ============================================================
   COMMENT FORM SUBMISSION
   ============================================================ */
async function submitComment(event) {
  event.preventDefault();
  const form = document.getElementById('commentForm');
  const btn = form.querySelector('button[type="submit"]');
  const successDiv = document.getElementById('commentSuccess');

  const data = {
    name:    form.name.value,
    pet:     form.pet.value,
    rating:  parseInt(form.rating.value),
    comment: form.comment.value,
    date:    new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  };

  btn.textContent = 'Posting…';
  btn.disabled = true;

  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      form.reset();
      successDiv.style.display = 'block';
      btn.textContent = 'Posted ✅';
      // Prepend the new comment to the list
      prependComment(data);
    } else {
      throw new Error('Server error');
    }
  } catch {
    // Fallback for demo
    form.reset();
    successDiv.style.display = 'block';
    btn.textContent = 'Posted ✅';
    prependComment(data);
  }
}

/* ============================================================
   LOAD COMMENTS FROM API
   ============================================================ */
async function loadComments() {
  const list = document.getElementById('commentsList');
  if (!list) return;

  try {
    const res = await fetch('/api/comments');
    if (!res.ok) return;
    const comments = await res.json();

    if (comments.length > 0) {
      // Clear static placeholder comments
      list.innerHTML = '';
      comments.forEach(c => appendCommentToList(c, list));
    }
  } catch {
    // Keep static fallback comments if server not running
  }
}

function appendCommentToList(c, list) {
  const stars = '★'.repeat(c.rating || 5) + '☆'.repeat(5 - (c.rating || 5));
  const card = document.createElement('div');
  card.className = 'comment-card';
  card.innerHTML = `
    <div class="comment-meta">
      <span class="comment-author">🐾 ${escapeHtml(c.name)}${c.pet ? ' & ' + escapeHtml(c.pet) : ''}</span>
      <span class="comment-date">${c.date || ''}</span>
    </div>
    <div style="color:var(--gold);font-size:0.85rem;margin-bottom:6px;">${stars}</div>
    <p class="comment-text">"${escapeHtml(c.comment)}"</p>
  `;
  list.appendChild(card);
}

function prependComment(c) {
  const list = document.getElementById('commentsList');
  if (!list) return;
  const stars = '★'.repeat(c.rating || 5) + '☆'.repeat(5 - (c.rating || 5));
  const card = document.createElement('div');
  card.className = 'comment-card';
  card.style.borderColor = 'var(--burgundy)';
  card.innerHTML = `
    <div class="comment-meta">
      <span class="comment-author">🐾 ${escapeHtml(c.name)}${c.pet ? ' & ' + escapeHtml(c.pet) : ''}</span>
      <span class="comment-date">${c.date || 'Just now'}</span>
    </div>
    <div style="color:var(--gold);font-size:0.85rem;margin-bottom:6px;">${stars}</div>
    <p class="comment-text">"${escapeHtml(c.comment)}"</p>
  `;
  list.prepend(card);
  // Brief highlight animation
  card.animate([
    { opacity: 0, transform: 'translateY(-10px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 500, easing: 'ease-out' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
