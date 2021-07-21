import 'bootstrap/dist/js/bootstrap.bundle';
import {Fancybox} from "@fancyapps/ui";
import './vendor/gridfy.vendor';

window.addEventListener('DOMContentLoaded', () => {

    Fancybox.bind("[data-fancybox]", {});

    const container = document.querySelector('#gallery');
    const path = './img/';
    let images = [];


    const imagesFn = () => {
        for (let i = 1; i < 180; i++) {
            images.push(`${path}${i}.jpg`);
        }
    };

    imagesFn();

    images.forEach(image => {
        container.innerHTML += `
        <article class="col-lg-3 col-md-4 col-12 thumb">
                <a data-fancybox="gallery" href=${image}>
                    <img class="img-fluid" src=${image}>
                </a>
            </article>
        `
    });

    const getBigPhotos = () => {
        if (window.matchMedia('(min-width: 768px)').matches) {
            container.gridify({
                srcNode: 'img',             // grid items (class, node)
                margin: '20px',             // margin in pixel, default: 0px
                width: '320px',             // grid item width in pixel, default: 220px
                max_width: '',              // dynamic gird item width if specified, (pixel)
                resizable: true,            // re-layout if window resize
                transition: 'all 0.5s ease' // support transition for CSS3, default: all 0.5s ease
            })
        }
    }

    getBigPhotos();

    window.addEventListener('resize', getBigPhotos)
});
