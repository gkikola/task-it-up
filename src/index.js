import App from './modules/app.js';

const fragment = document.createDocumentFragment();
const app = new App(fragment);
document.body.appendChild(fragment);
app.run();
