/**
 * PrimDom Houses & Clean Lightbox Gallery Component
 * Renders 3 house cards and manages a pure photo lightbox without cluttered descriptions.
 */

import { CONFIG } from './config.js';

export class HouseGallery {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.houses = CONFIG.houses || [];
    this.currentPhotos = [];
    this.currentIndex = 0;
    this.currentHouseName = '';

    this._createLightbox();
  }

  init() {
    if (!this.container) return;
    this._renderHouses();
  }

  _renderHouses() {
    this.container.innerHTML = this.houses
      .map(
        (house, idx) => `
        <article class="house-card" data-house-index="${idx}">
          <div class="house-card-visual">
            <img src="${house.cover}" alt="${house.name}" loading="lazy" class="house-card-img" />
            <div class="house-card-badge">${house.area}</div>
            <div class="house-card-hover-overlay">
              <span class="house-view-pill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Смотреть фотографии (${house.photos.length})</span>
              </span>
            </div>
          </div>
          <div class="house-card-content">
            <div class="house-card-header">
              <h3 class="house-card-title">${house.name}</h3>
              <span class="house-card-price">${house.price}</span>
            </div>
            <p class="house-card-subtitle">${house.subtitle}</p>
            <p class="house-card-details">${house.details}</p>
            <div class="house-card-action">
              <span class="house-action-link">
                Открыть галерею
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </article>
      `
      )
      .join('');

    // Click handler for cards
    this.container.querySelectorAll('.house-card').forEach((card) => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.houseIndex, 10);
        const house = this.houses[idx];
        if (house) {
          this._openGallery(house);
        }
      });
    });
  }

  _createLightbox() {
    let lb = document.getElementById('pure-photo-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'pure-photo-lightbox';
      lb.className = 'pure-lightbox';
      lb.innerHTML = `
        <div class="pure-lightbox-backdrop"></div>
        <div class="pure-lightbox-dialog">
          
          <div class="pure-lightbox-topbar">
            <span class="pure-lightbox-housename" id="plb-housename"></span>
            <span class="pure-lightbox-counter" id="plb-counter"></span>
            <button type="button" class="pure-lightbox-close" aria-label="Закрыть">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <button type="button" class="pure-lightbox-nav pure-lightbox-prev" aria-label="Предыдущее фото">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <button type="button" class="pure-lightbox-nav pure-lightbox-next" aria-label="Следующее фото">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div class="pure-lightbox-stage">
            <img src="" alt="" class="pure-lightbox-img" id="plb-img" />
          </div>
        </div>
      `;
      document.body.appendChild(lb);

      lb.querySelector('.pure-lightbox-backdrop').addEventListener('click', () => this._closeLightbox());
      lb.querySelector('.pure-lightbox-close').addEventListener('click', () => this._closeLightbox());
      lb.querySelector('.pure-lightbox-prev').addEventListener('click', () => this._prevPhoto());
      lb.querySelector('.pure-lightbox-next').addEventListener('click', () => this._nextPhoto());

      window.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') this._closeLightbox();
        if (e.key === 'ArrowLeft') this._prevPhoto();
        if (e.key === 'ArrowRight') this._nextPhoto();
      });

      // Touch swipe
      let touchStartX = 0;
      lb.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      lb.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) this._prevPhoto();
          else this._nextPhoto();
        }
      }, { passive: true });
    }

    this.lightbox = lb;
    this.lbImg = lb.querySelector('#plb-img');
    this.lbCounter = lb.querySelector('#plb-counter');
    this.lbHouseName = lb.querySelector('#plb-housename');
  }

  _openGallery(house) {
    this.currentPhotos = house.photos || [];
    this.currentHouseName = house.name;
    this.currentIndex = 0;
    this._updateContent();
    this.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  _closeLightbox() {
    this.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  _prevPhoto() {
    if (this.currentPhotos.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
    this._updateContent();
  }

  _nextPhoto() {
    if (this.currentPhotos.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.currentPhotos.length;
    this._updateContent();
  }

  _updateContent() {
    const src = this.currentPhotos[this.currentIndex];
    if (!src) return;
    this.lbImg.src = src;
    this.lbHouseName.textContent = this.currentHouseName;
    this.lbCounter.textContent = `${this.currentIndex + 1} / ${this.currentPhotos.length}`;
  }
}
