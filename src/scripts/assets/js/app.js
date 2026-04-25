"use strict";

//*********************************
//*** common
//*********************************
document.addEventListener("DOMContentLoaded", function () {
  const firstText = document.querySelector(".text.first");
  const secondText = document.querySelector(".text.second");

  setTimeout(() => {
    firstText.classList.add("visible");
  }, 100);

  setTimeout(() => {
    secondText.classList.add("visible");
  }, 500);
});

document.addEventListener("DOMContentLoaded", () => {
  const floatBtns = document.querySelector(".float-btns");
  const footer = document.querySelector("footer");

  window.addEventListener("scroll", () => {
    if (!floatBtns || !footer) return;

    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (footerRect.top < windowHeight) {
      floatBtns.classList.add("hidden");
    } else {
      floatBtns.classList.remove("hidden");
    }
  });
});


const swiper = new Swiper(".swiper", {
  loop: true,
  spaceBetween: 20,
  slidesPerView: 1,
  autoHeight: true,
  navigation: {
    nextEl: '.p-interview .nav-next',
    prevEl: '.p-interview .nav-prev',
  },
  autoplay: {
    delay: 4000,
    disableOnInteraction: true,
  },
  breakpoints: {
    768: {
      slidesPerView: "auto",
    },
  },
});

$(function () {
  var smoothScroll = function () {
    var $header = $(".page-header");
    var headerHeight = $header.innerHeight();
    var speed = 500;
    var smoothScrollC = {
      init: function () {
        var me = this;
        $('a[href^="#"]').on("click", function (e) {
          e.preventDefault();
          me.targetScroll($(this));
        });
      },
      targetScroll: function ($target) {
        var $hash = $($target.attr("href"));
        if ($hash.length) {
          $("html, body").animate(
            {
              scrollTop: $hash.offset().top,
            },
            speed,
            "swing"
          );
        }
      },
    };
    var smoothScrollParam = {
      location: location.pathname,
      init: function () {
        var me = this;
        if (!this.location.match("/admin/")) {
          if (location.search.match("anc=")) {
            me.anchor = location.search.split("anc=")[1];
          } else {
            me.anchor = location.search.split(/\?/)[1];
          }
          var hashP = "#" + this.anchor;
          $("html, body").animate(
            {
              scrollTop: $(hashP).offset().top,
            },
            speed,
            "swing"
          );
        }
      },
    };
    $(function () {
      smoothScrollC.init();
      if (location.href.match(/\?/)) {
        setTimeout(function () {
          smoothScrollParam.init();
        }, 100);
      }
    });
  };
  smoothScroll();
});

document.querySelector('.l-footer__page-top').addEventListener('click', function (e) {
  e.preventDefault();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});


/* SET VW
********************************************** */
const setVWVH = () => {
  const setVW = () => document.documentElement.style.setProperty("--vw", `${document.body.clientWidth}px`);
  const setVH = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

  window.addEventListener('load', () => {
    setVW();
    setVH();
  });

  window.addEventListener('resize', () => {
    setVW();
    setVH();
  });
};

/* Mobile Detect
********************************************** */
const mobileDetect = () => {
  const userAgent = navigator.userAgent;
  const mobileKeywords = ["iPhone", "iPad", "Android", "Mobile"];
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
};

/* Update Mobile Class to HTML
********************************************** */
const updateMobileClass = () => {
  if (mobileDetect()) {
    document.documentElement.classList.add('is-mobile');
  } else {
    document.documentElement.classList.remove('is-mobile');
  }
};

/* Inline SVG
********************************************** */
const convertImgToSVG = (callback) => {
  document.querySelectorAll('img.js-svg').forEach(async image => {
    try {
      const res = await fetch(image.src);
      const data = await res.text();
      const svg = new DOMParser().parseFromString(data, 'image/svg+xml').querySelector('svg');

      if (image.id) svg.id = image.id;
      if (image.className) svg.classList = image.classList;

      svg.setAttribute('role', 'img');
      if (image.alt) {
        svg.setAttribute('aria-label', image.alt);
      }

      image.replaceWith(svg);
      if (callback) callback();
    } catch (error) {
      console.error(error);
    }
  });
};

/* Anchor Link
********************************************** */
const anchorLink = () => {
  // Get current header height (you can update this logic if header height is dynamic)
  let headerHeight = getHeaderHeight();

  // Function to get header height based on screen width
  function getHeaderHeight() {
    return window.innerWidth < 768 ? 54 : 62;
  }

  // Update header height on window resize
  window.addEventListener("resize", () => {
    headerHeight = getHeaderHeight();
  });

  // Utility function for smooth scrolling to a target element
  function scrollToTarget(target) {
    if (target) {
      const position = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({
        top: position,
        behavior: "smooth"
      });
    }
  }

  // Add click event for anchor links with class 'js-anchor'
  document.querySelectorAll('a.js-anchor[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      event.preventDefault();
      const href = anchor.getAttribute("href");
      const target = href === "#" || href === "" ? document.documentElement : document.querySelector(href);
      scrollToTarget(target);
    });
  });

  // Handle anchor scrolling based on URL query string (e.g., ?anc=section1)
  const smoothScrollFromQuery = {
    location: location.pathname,

    init: function () {
      // Skip if in admin panel
      if (this.location.includes("/admin/")) return;

      const params = new URLSearchParams(location.search);
      const anchor = params.get("anc") || params.keys().next().value;
      const selector = anchor ? `#${anchor}` : null;
      const target = selector ? document.querySelector(selector) : null;

      if (target) {
        // Delay to ensure DOM is fully ready
        setTimeout(() => {
          scrollToTarget(target);
        }, 700); // Matches jQuery animate delay
      }
    }
  };

  // Run query-based scroll on page load if URL has query string
  if (location.search) {
    setTimeout(() => {
      smoothScrollFromQuery.init();
    }, 100);
  }
};

/* Header Function
********************************************** */
const initHeader = () => {
  const header = document.querySelector('.l-header');
  const headerHamburger = document.querySelector('.js-hamburger');
  const navToggles = document.querySelectorAll('.js-toggle-nav');
  const headerNav = document.querySelector('.l-header__nav');


  // Toggle Navigation
  if (navToggles) {
    navToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const isExpanded = headerHamburger.getAttribute('aria-expanded') === 'true';
        headerHamburger.setAttribute('aria-expanded', !isExpanded);
        headerNav.classList.toggle('is-active');
        document.documentElement.classList.toggle('no-scroll');
      });
    });
  }
}


const smoothScrollFromQuery = {
  location: location.pathname,

  init: function () {
    // Skip if in admin panel
    if (this.location.includes("/admin/")) return;

    const params = new URLSearchParams(location.search);
    const anchor = params.get("anc") || params.keys().next().value;
    const selector = anchor ? `#${anchor}` : null;
    const target = selector ? document.querySelector(selector) : null;

    if (target) {
      setTimeout(() => {
        scrollToTarget(target);
      }, 700); // Matches jQuery animate delay
    }
  }
};

// Run query-based scroll on page load if URL has query string
if (location.search) {
  setTimeout(() => {
    smoothScrollFromQuery.init();
  }, 100);
}


// Call the functions
setVWVH();
updateMobileClass();
convertImgToSVG();
anchorLink();
initHeader();

