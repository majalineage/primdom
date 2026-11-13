/**
 * PrimDom Main Application Script
 */

import { HeroWebGL } from './heroWebGL.js';
import { HouseGallery } from './gallery.js';
import { CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize WebGL Hero
  const heroStage = document.getElementById('hero-stage');
  let heroWebGL = null;
  if (heroStage && window.THREE) {
    heroWebGL = new HeroWebGL('hero-stage');
    heroWebGL.init();
  }

  // 2. Mobile Day/Night toggle button inside hero
  const heroToggle = document.getElementById('hero-mobile-toggle');
  if (heroToggle && heroWebGL) {
    heroToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isNight = heroWebGL.toggleManualNight();
      heroToggle.classList.toggle('is-night', isNight);
      const icon = heroToggle.querySelector('.hero-toggle-icon');
      const text = heroToggle.querySelector('.hero-toggle-text');
      if (icon) icon.textContent = isNight ? '☀' : '🌙';
      if (text) text.textContent = isNight ? 'День' : 'Вечер';
    });
  }

  // 3. Initialize 3 Houses Gallery
  const houseGallery = new HouseGallery('houses-container');
  houseGallery.init();

  // 4. Plan Modal Zoom
  const planImg = document.getElementById('plan-img');
  const planModal = document.getElementById('plan-modal');
  const planModalClose = document.getElementById('plan-modal-close');
  const planModalBackdrop = document.getElementById('plan-modal-backdrop');

  if (planImg && planModal) {
    planImg.addEventListener('click', () => {
      planModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closePlanModal = () => {
      planModal.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (planModalClose) planModalClose.addEventListener('click', closePlanModal);
    if (planModalBackdrop) planModalBackdrop.addEventListener('click', closePlanModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && planModal.classList.contains('active')) {
        closePlanModal();
      }
    });
  }

  // 5. Fullscreen Mobile Drawer Navigation
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerBrandLink = document.querySelector('.drawer-brand-link');

  const openDrawer = () => {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('active');
    if (mobileMenuBtn) {
      mobileMenuBtn.classList.add('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('active');
    if (mobileMenuBtn) {
      mobileMenuBtn.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  };

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.contains('active');
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  if (drawerBrandLink) {
    drawerBrandLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Handle drawer links: close drawer and smoothly scroll to target section
  if (mobileDrawer) {
    const drawerLinks = mobileDrawer.querySelectorAll('.drawer-link');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        closeDrawer();
        if (href && href.startsWith('#') && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            setTimeout(() => {
              const headerOffset = 64;
              const targetPos = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
              window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
              });
            }, 80);
          }
        }
      });
    });
  }

  // Close drawer on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // Close drawer if viewport is resized past mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileDrawer && mobileDrawer.classList.contains('active')) {
      closeDrawer();
    }
  });

  // 6. Smooth Scroll Navigation (Desktop nav & in-page anchors)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    if (anchor.classList.contains('drawer-link') || anchor.classList.contains('drawer-brand-link')) {
      return; // Handled by drawer logic above
    }
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 76;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // 7. Viewing Form Submission (opens WhatsApp with message)
  const viewingForm = document.getElementById('viewing-form');
  if (viewingForm) {
    viewingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('v-name')?.value || '';
      const phone = document.getElementById('v-phone')?.value || '';
      const note = document.getElementById('v-note')?.value || '';

      const text = encodeURIComponent(
        `Здравствуйте! Меня зовут ${name}. Телефон: ${phone}. Хочу записаться на просмотр посёлка Оникс в Находке. ${note}`
      );
      const waUrl = `https://wa.me/79143313325?text=${text}`;
      window.open(waUrl, '_blank');
    });
  }
});
