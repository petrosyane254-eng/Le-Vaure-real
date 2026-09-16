(() => {
  const $ = (id) => document.getElementById(id);
  const val = (id, fallback="") => $(id)?.value ?? fallback;
  const num = (id, fallback=0) => Number(val(id, fallback)) || fallback;

  function mount() {
    const imageInput = $("id_image");
    if (!imageInput || document.getElementById("levaure-visual-editor")) return;

    const host = document.createElement("div");
    host.id = "levaure-visual-editor";
    host.innerHTML = `
      <div class="lv-editor-head">
        <div><b>LE VAURÉ LIVE PREVIEW</b><span>Փոխիր դաշտերը՝ արդյունքը անմիջապես տեսնելու համար</span></div>
        <div class="lv-device"><button type="button" data-device="desktop" class="active">DESKTOP</button><button type="button" data-device="mobile">MOBILE</button></div>
      </div>
      <div class="lv-stage">
        <div class="lv-bg"></div><div class="lv-overlay"></div>
        <div class="lv-copy"><small></small><h2></h2><p></p><a></a></div>
        <div class="lv-empty">Ընտրիր banner-ի նկարը</div>
      </div>
      <div class="lv-tip">Preview-ի վրա click արա՝ նկարի focal point-ը փոխելու համար։ Text block-ը քաշիր mouse-ով։</div>`;
    const firstFieldset = document.querySelector("fieldset");
    firstFieldset?.parentNode?.insertBefore(host, firstFieldset);

    let device = "desktop";
    let objectUrl = "";
    const stage = host.querySelector(".lv-stage");
    const bg = host.querySelector(".lv-bg");
    const overlay = host.querySelector(".lv-overlay");
    const copy = host.querySelector(".lv-copy");
    const empty = host.querySelector(".lv-empty");

    function currentImage() {
      if (objectUrl) return objectUrl;
      const existing = imageInput.closest(".form-row")?.querySelector('a[href*="/media/"]');
      return existing?.href || "";
    }

    function render() {
      const img = currentImage();
      const h = device === "mobile" ? num("id_mobile_height",420) : num("id_desktop_height",620);
      stage.style.height = `${Math.max(220,h)}px`;
      stage.classList.toggle("mobile", device === "mobile");
      bg.style.backgroundImage = img ? `url("${img}")` : "none";
      bg.style.backgroundPosition = `${num("id_image_x",50)}% ${num("id_image_y",50)}%`;
      bg.style.transform = `scale(${Math.max(.5,num("id_image_zoom",1))})`;
      overlay.style.background = `rgba(0,0,0,${Math.min(100,num("id_overlay_opacity",35))/100})`;
      copy.style.left = `${Math.min(100,num("id_content_x",8))}%`;
      copy.style.top = `${Math.min(100,num("id_content_y",72))}%`;
      copy.style.width = `${Math.min(100,num("id_content_width",45))}%`;
      copy.style.textAlign = val("id_text_align","left");
      copy.style.color = val("id_text_color","#111111");
      copy.querySelector("small").textContent = val("id_eyebrow","");
      copy.querySelector("h2").textContent = val("id_title","Your title");
      copy.querySelector("h2").style.fontSize = `${device==="mobile"?num("id_mobile_title_size",34):num("id_title_size",48)}px`;
      copy.querySelector("p").textContent = val("id_body","");
      copy.querySelector("p").style.fontSize = `${num("id_body_size",13)}px`;
      const a = copy.querySelector("a");
      a.textContent = val("id_button_label","");
      a.style.display = a.textContent ? "inline-block" : "none";
      a.style.background = val("id_button_background_color","#111111");
      a.style.color = val("id_button_text_color","#ffffff");
      empty.style.display = img ? "none" : "grid";
    }

    imageInput.addEventListener("change", () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = imageInput.files?.[0] ? URL.createObjectURL(imageInput.files[0]) : "";
      render();
    });

    document.querySelectorAll("input,textarea,select").forEach(el => {
      if (el.id) { el.addEventListener("input", render); el.addEventListener("change", render); }
    });

    host.querySelectorAll("[data-device]").forEach(btn => btn.addEventListener("click", () => {
      device = btn.dataset.device;
      host.querySelectorAll("[data-device]").forEach(x=>x.classList.toggle("active",x===btn));
      render();
    }));

    stage.addEventListener("click", e => {
      if (e.target.closest(".lv-copy")) return;
      const r=stage.getBoundingClientRect();
      if ($("id_image_x")) $("id_image_x").value=Math.round((e.clientX-r.left)/r.width*100);
      if ($("id_image_y")) $("id_image_y").value=Math.round((e.clientY-r.top)/r.height*100);
      render();
    });

    let drag=null;
    copy.addEventListener("pointerdown", e => {
      drag={x:e.clientX,y:e.clientY,cx:num("id_content_x",8),cy:num("id_content_y",72)};
      copy.setPointerCapture(e.pointerId); e.preventDefault();
    });
    copy.addEventListener("pointermove", e => {
      if(!drag) return;
      const r=stage.getBoundingClientRect();
      $("id_content_x").value=Math.max(0,Math.min(100,drag.cx+(e.clientX-drag.x)/r.width*100)).toFixed(0);
      $("id_content_y").value=Math.max(0,Math.min(100,drag.cy+(e.clientY-drag.y)/r.height*100)).toFixed(0);
      render();
    });
    copy.addEventListener("pointerup",()=>drag=null);
    render();
  }
  document.readyState==="loading" ? document.addEventListener("DOMContentLoaded",mount) : mount();
})();