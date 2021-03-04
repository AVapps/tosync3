export const ResizeObserver = {
  name: 'resize',
  create: (swiper) => {
    Object.assign(swiper, {
      resizeObserver: null
    })
  },
  on: {
    init: (swiper) => {
      const container = swiper.$el[0]
      console.debug(`Swiper.resizeObserver.init container=`, container);

      if (!('ResizeObserver' in window)) return;

      const observer = new ResizeObserver((entries) => {
        console.debug(entries);
        swiper.emit('observerUpdate');
      });

      observer.observe(container, { box: 'border-box' });

      swiper.resizeObserver = observer;
    }
  },
  destroy: (swiper) => {
    console.debug(`Swiper.resizeObserver.destroy`);

    if (swiper.resizeObserver) {
      swiper.resizeObserver.disconnect();
    }
  }
}