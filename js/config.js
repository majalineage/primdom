/**
 * Конфигурация сайта «Примдом.рф» / Посёлок «Оникс» (г. Находка)
 */

export const CONFIG = {
  contacts: {
    brandName: 'ПРИМДОМ',
    projectName: 'ОНИКС',
    city: 'г. Находка',
    address: 'Приморский край, г. Находка, ул. Гранатовая',
    directionsHint: 'Рекламный баннер «ПРИМДОМ.РФ» прямо на повороте к посёлку',
    phone: '+7 914 331 33 25',
    phoneExtra: '+7 994 016 20 50',
    whatsapp: 'https://wa.me/79143313325?text=Здравствуйте!%20Хочу%20узнать%20подробнее%20о%20посёлке%20Оникс%20в%20Находке',
    telegramChat: 'https://t.me/KosVlasov',
    telegramChannel: 'https://t.me/primdomnhk'
  },

  hero: {
    dayImage: './assets/images/hero/day.jpg',
    nightImage: './assets/images/hero/night.jpg',
    fluidRadius: 0.28,
    fluidDecay: 0.958,
    autoSweepOnStart: true
  },

  plan: {
    image: './assets/images/plan_visual.jpg',
    title: 'Схема посёлка «Оникс»',
    address: 'г. Находка, ул. Гранатовая',
    totalPlots: 36
  },

  // 3 вида домов (как на действующем сайте)
  // При клике открывается галерея с фотографиями этого дома БЕЗ описаний
  houses: [
    {
      id: 'barn-67',
      name: 'Барн – 67',
      subtitle: 'с двумя спальнями',
      area: '67 м²',
      details: '2 спальни · санузел · постирочная · кухня-гостиная со вторым светом',
      price: 'от 11 800 000 ₽',
      cover: './assets/images/gallery/img_8706.jpg',
      photos: [
        './assets/images/gallery/img_8706.jpg',
        './assets/images/gallery/img_7688.jpg',
        './assets/images/gallery/img_7667.jpg',
        './assets/images/gallery/img_8704.jpg',
        './assets/images/gallery/img_8705.jpg',
        './assets/images/gallery/img_7680.jpg',
        './assets/images/gallery/img_7689.jpg'
      ]
    },
    {
      id: 'barn-86',
      name: 'Барн – 86',
      subtitle: 'с тремя спальнями',
      area: '86 м²',
      details: '3 спальни · 2 санузла · постирочная · потолки до 5 м со вторым светом',
      price: 'от 13 500 000 ₽',
      cover: './assets/images/gallery/img_8702.jpg',
      photos: [
        './assets/images/gallery/img_8702.jpg',
        './assets/images/gallery/img_7681.jpg',
        './assets/images/gallery/img_8721.jpg',
        './assets/images/gallery/img_7678.jpg',
        './assets/images/gallery/img_8708.jpg',
        './assets/images/gallery/img_8718.jpg',
        './assets/images/gallery/img_8712.jpg'
      ]
    },
    {
      id: 'barn-140',
      name: 'Барн – 140',
      subtitle: 'с чистовой отделкой',
      area: '140 м²',
      details: '3–4 спальни · мастер-спальня · 2 санузла · большая терраса',
      price: 'от 15 000 000 ₽',
      cover: './assets/images/gallery/img_8714.jpg',
      photos: [
        './assets/images/gallery/img_8714.jpg',
        './assets/images/gallery/img_7681.jpg',
        './assets/images/gallery/img_8721.jpg',
        './assets/images/gallery/img_8702.jpg',
        './assets/images/gallery/img_8706.jpg',
        './assets/images/gallery/img_7667.jpg',
        './assets/images/gallery/img_8722.jpg',
        './assets/images/gallery/img_8707.jpg'
      ]
    }
  ]
};
