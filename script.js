// script.js - Ludhiana Water Complaint Portal

document.addEventListener('DOMContentLoaded', function () {

  // ── DOM References ─────────────────────────────────────────
  const form = document.querySelector('form');
  const contactInput = document.getElementById('contact');
  const contactError = document.getElementById('contact-error');
  const photoInput = document.getElementById('photo');
  const photoNameEl = document.getElementById('photo-name');
  const submitBtn = document.querySelector('.btn-submit');
  const trackInput = document.getElementById('track-id');
  const trackBtn = document.getElementById('track-btn');
  const trackResult = document.getElementById('track-result');

  // ── Mobile Number: digits only + live validation ───────────
  contactInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    contactError.style.display = this.value.length !== 10 && this.value.length > 0 ? 'block' : 'none';
  });

  // ── Photo upload preview ───────────────────────────────────
  photoInput.addEventListener('change', function () {
    photoNameEl.textContent = this.files[0] ? `📎 ${this.files[0].name}` : '';
  });

  // ── Form Submission → POST /api/complaints ─────────────────
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const contact = contactInput.value.trim();
    const area = document.getElementById('area').value;
    const street = document.getElementById('street').value.trim();
    const issueType = document.getElementById('issue_type').value;
    const description = document.getElementById('description').value.trim();

    // Client-side validation
    if (!name || contact.length !== 10 || !area || !street || !issueType || !description) {
      showNotification('⚠️ Please fill in all required fields correctly.', 'error');
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, area, street, issueType, description })
      });

      const result = await response.json();

      if (result.success) {
        showSuccessModal(result.complaintId, result.estimatedResolution);
        form.reset();
        photoNameEl.textContent = '';
        contactError.style.display = 'none';
      } else {
        showNotification('❌ ' + (result.error || 'Submission failed. Please try again.'), 'error');
      }
    } catch (err) {
      showNotification('🔌 Network error. Please check your connection and try again.', 'error');
      console.error('Submission error:', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Submit Complaint';
    }
  });

  // ── Track Complaint → GET /api/complaints/:id ──────────────
  if (trackBtn) {
    trackBtn.addEventListener('click', async function () {
      const id = trackInput.value.trim().toUpperCase();
      if (!id) {
        showNotification('Please enter a complaint ID.', 'error');
        return;
      }

      trackBtn.disabled = true;
      trackBtn.textContent = '🔍 Searching...';
      trackResult.innerHTML = '';

      try {
        const response = await fetch(`/api/complaints/${id}`);
        const result = await response.json();

        if (result.success) {
          renderTrackResult(result.complaint);
        } else {
          trackResult.innerHTML = `<div class="track-error">❌ ${result.error}</div>`;
        }
      } catch (err) {
        trackResult.innerHTML = `<div class="track-error">🔌 Network error. Please try again.</div>`;
      } finally {
        trackBtn.disabled = false;
        trackBtn.textContent = '🔍 Track Complaint';
      }
    });
  }

  // ── Render tracking result card ────────────────────────────
  function renderTrackResult(c) {
    const statusColors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      resolved: '#10b981'
    };
    const statusLabels = {
      pending: '🕐 Pending',
      in_progress: '🔧 In Progress',
      resolved: '✅ Resolved'
    };
    const priorityLabels = {
      critical: '🔴 Critical',
      high: '🟠 High',
      medium: '🟡 Medium',
      low: '🟢 Low'
    };
    const issueLabels = {
      leak: 'Water Leak / Pipe Burst',
      contamination: 'Contaminated / Dirty Water',
      low_pressure: 'Low Water Pressure',
      no_supply: 'No Water Supply',
      meter: 'Meter Reading Issue'
    };

    const filed = c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN') : 'N/A';
    const updated = c.updatedAt ? new Date(c.updatedAt).toLocaleString('en-IN') : 'N/A';

    trackResult.innerHTML = `
      <div class="track-card">
        <div class="track-header">
          <span class="track-id-badge">🎫 ${c.complaintId}</span>
          <span class="track-status" style="background:${statusColors[c.status] || '#6b7280'}">
            ${statusLabels[c.status] || c.status}
          </span>
        </div>
        <div class="track-grid">
          <div class="track-item"><span class="track-label">👤 Name</span><span>${c.name}</span></div>
          <div class="track-item"><span class="track-label">🏠 Area</span><span>${c.area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></div>
          <div class="track-item"><span class="track-label">⚠️ Issue</span><span>${issueLabels[c.issueType] || c.issueType}</span></div>
          <div class="track-item"><span class="track-label">🚨 Priority</span><span>${priorityLabels[c.priority] || c.priority}</span></div>
          <div class="track-item"><span class="track-label">📅 Filed On</span><span>${filed}</span></div>
          <div class="track-item"><span class="track-label">🔄 Last Updated</span><span>${updated}</span></div>
        </div>
        <div class="track-desc"><strong>📝 Description:</strong> ${c.description}</div>
        ${c.resolvedAt ? `<div class="track-resolved">✅ Resolved on: ${new Date(c.resolvedAt).toLocaleString('en-IN')}</div>` : ''}
      </div>
    `;
  }

  // ── Success Modal ──────────────────────────────────────────
  function showSuccessModal(complaintId, eta) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-icon">✅</div>
        <h3>Complaint Submitted!</h3>
        <p>Your complaint has been registered successfully.</p>
        <div class="modal-id">
          <span>Complaint ID</span>
          <strong>${complaintId}</strong>
        </div>
        <p class="modal-eta">⏱️ Estimated resolution: <strong>${eta}</strong></p>
        <p class="modal-hint">Save this ID to track your complaint status.</p>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">Got it!</button>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('modal-visible'), 10);
  }

  // ── Toast Notification ─────────────────────────────────────
  function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // ── Smooth scrolling ───────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── Scroll animation ───────────────────────────────────────
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.side-photo, .info-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

});
