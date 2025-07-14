// Types pour les animations
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  threshold?: number;
  rootMargin?: string;
}

export interface ScrollAnimationConfig extends AnimationConfig {
  animation: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'rotateIn' | 'flipIn';
  stagger?: number;
}

export interface ParallaxConfig {
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  scale?: boolean;
  rotate?: boolean;
}

// Configurations par défaut
export const defaultAnimationConfig: AnimationConfig = {
  duration: 800,
  delay: 0,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

// Animations CSS prédéfinies
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  },
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  },
  slideRight: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  rotateIn: {
    initial: { opacity: 0, rotate: -180 },
    animate: { opacity: 1, rotate: 0 },
    exit: { opacity: 0, rotate: 180 }
  },
  flipIn: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 }
  }
};

// Utilitaires pour les animations
export const createStaggeredAnimation = (
  baseDelay: number = 0,
  staggerDelay: number = 100,
  index: number
) => ({
  delay: baseDelay + (index * staggerDelay)
});

export const createParallaxTransform = (
  scrollY: number,
  speed: number = 0.5,
  direction: 'up' | 'down' | 'left' | 'right' = 'up'
) => {
  const offset = scrollY * speed;
  
  switch (direction) {
    case 'up':
      return `translateY(-${offset}px)`;
    case 'down':
      return `translateY(${offset}px)`;
    case 'left':
      return `translateX(-${offset}px)`;
    case 'right':
      return `translateX(${offset}px)`;
    default:
      return `translateY(-${offset}px)`;
  }
};

// Easing functions personnalisées
export const easingFunctions = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
};