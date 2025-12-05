// تحميل CSS خارجي
const css = document.createElement("link");
css.rel = "stylesheet";
css.href = "https://novalink2020-hub.github.io/novabot-widget-test/ui.css";
document.head.appendChild(css);

// تحميل HTML خارجي وحقنه في الصفحة
fetch("https://novalink2020-hub.github.io/novabot-widget-test/ui.html")
  .then(r => r.text())
  .then(html => {
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
  });
