(function(){
  "use strict";

  // ---- 사이트 설정: 실제 배포 시 이 두 값을 바꿔주세요 ----
  var SITE_NAME = "잉크로즈";
  var SITE_URL  = "https://inkrose.example.com";
  var WATERMARK = "이 트친소표는 " + SITE_NAME + " 사이트로 제작되었습니다. " + SITE_URL;

  var state = {
    nickname: "", handle: "", avatarDataUrl: null,
    age: "",
    platforms: new Set(), platformOther: "",
    times: new Set(),
    ending: null,
    tendencies: new Set(), tendencyOther: "",
    favorites: "", mines: "", free: "", otherGenres: ""
  };

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(ch){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch];
    });
  }
  function nl2br(str){ return escapeHtml(str).replace(/\n/g, "<br>"); }

  function combinedList(setObj, otherKeyword, otherText){
    var out = [];
    setObj.forEach(function(v){ if(v !== otherKeyword) out.push(v); });
    var trimmed = (otherText || "").trim();
    if(setObj.has(otherKeyword) && trimmed) out.push(trimmed);
    return out;
  }

  function setRow(rowId, valueId, text){
    var row = document.getElementById(rowId);
    var val = document.getElementById(valueId);
    if(text && text.length){
      row.classList.remove("hidden");
      val.textContent = text;
    } else {
      row.classList.add("hidden");
    }
  }

  function setNote(secId, valId, text){
    var sec = document.getElementById(secId);
    var val = document.getElementById(valId);
    var trimmed = (text || "").trim();
    if(trimmed){
      sec.classList.remove("hidden");
      val.innerHTML = nl2br(trimmed);
    } else {
      sec.classList.add("hidden");
    }
  }

  function render(){
    var nameEl = document.getElementById("cardName");
    var idEl = document.getElementById("cardId");

    if(state.nickname.trim()){
      nameEl.textContent = state.nickname.trim();
      nameEl.classList.remove("is-placeholder");
    } else {
      nameEl.textContent = "닉네임";
      nameEl.classList.add("is-placeholder");
    }

    if(state.handle.trim()){
      idEl.textContent = "@" + state.handle.trim().replace(/^@/, "");
      idEl.classList.remove("is-placeholder");
    } else {
      idEl.textContent = "@아이디";
      idEl.classList.add("is-placeholder");
    }

    var ageEl = document.getElementById("cardAge");
    if(state.age.trim()){
      ageEl.textContent = state.age.trim() + "세";
      ageEl.classList.remove("hidden");
    } else {
      ageEl.classList.add("hidden");
    }

    setRow("row-platform", "val-platform", combinedList(state.platforms, "기타", state.platformOther).join(", "));
    setRow("row-time", "val-time", Array.from(state.times).join(", "));
    setRow("row-ending", "val-ending", state.ending || "");
    setRow("row-tendency", "val-tendency", combinedList(state.tendencies, "기타", state.tendencyOther).join(", "));

    setNote("sec-favorites", "val-favorites", state.favorites);
    setNote("sec-mines", "val-mines", state.mines);
    setNote("sec-free", "val-free", state.free);
    setNote("sec-otherGenres", "val-otherGenres", state.otherGenres);

    document.getElementById("cardFooter").textContent = WATERMARK;

    var avatarInner = document.getElementById("avatarInner");
    if(state.avatarDataUrl){
      avatarInner.innerHTML = '<img src="' + state.avatarDataUrl + '" alt="프로필 사진">';
    } else {
      avatarInner.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="12" cy="8" r="3.4" stroke-width="1.3"/>' +
        '<path d="M4 20c1.6-4 4.8-6 8-6s6.4 2 8 6" stroke-width="1.3"/></svg>';
    }
  }

  // ---- text inputs ----
  document.getElementById("nickname").addEventListener("input", function(e){ state.nickname = e.target.value; render(); });
  document.getElementById("handle").addEventListener("input", function(e){ state.handle = e.target.value; render(); });
  document.getElementById("age").addEventListener("input", function(e){ state.age = e.target.value; render(); });
  document.getElementById("favorites").addEventListener("input", function(e){ state.favorites = e.target.value; render(); });
  document.getElementById("mines").addEventListener("input", function(e){ state.mines = e.target.value; render(); });
  document.getElementById("free").addEventListener("input", function(e){ state.free = e.target.value; render(); });
  document.getElementById("otherGenres").addEventListener("input", function(e){ state.otherGenres = e.target.value; render(); });

  document.getElementById("platformOther").addEventListener("input", function(e){ state.platformOther = e.target.value; render(); });
  document.getElementById("tendencyOther").addEventListener("input", function(e){ state.tendencyOther = e.target.value; render(); });

  // ---- photo upload ----
  document.getElementById("photoInput").addEventListener("change", function(e){
    var file = e.target.files && e.target.files[0];
    if(!file) return;
    document.getElementById("uploadFilename").textContent = file.name;
    var reader = new FileReader();
    reader.onload = function(ev){
      state.avatarDataUrl = ev.target.result;
      var pv = document.getElementById("photoPreview");
      pv.innerHTML = '<img src="' + ev.target.result + '" alt="프로필 사진 미리보기" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      render();
    };
    reader.readAsDataURL(file);
  });

  // ---- chip groups (multi select) ----
  document.querySelectorAll(".chip-group").forEach(function(group){
    var groupName = group.getAttribute("data-group");
    var stateKey = groupName === "platform" ? "platforms" : groupName === "time" ? "times" : "tendencies";
    group.querySelectorAll(".chip").forEach(function(chip){
      chip.addEventListener("click", function(){
        var value = chip.getAttribute("data-value");
        var set = state[stateKey];
        if(set.has(value)){
          set.delete(value);
          chip.classList.remove("active");
        } else {
          set.add(value);
          chip.classList.add("active");
        }
        if(value === "기타"){
          var otherInput = document.querySelector('.other-input[data-other-for="' + groupName + '"]');
          if(set.has("기타")){
            otherInput.classList.remove("hidden");
            otherInput.focus();
          } else {
            otherInput.classList.add("hidden");
            otherInput.value = "";
            if(groupName === "platform") state.platformOther = "";
            if(groupName === "tendency") state.tendencyOther = "";
          }
        }
        render();
      });
    });
  });

  // ---- pill group (single select: 이별은) ----
  document.querySelectorAll('.pill-group[data-group="ending"] .pill').forEach(function(pill){
    pill.addEventListener("click", function(){
      var value = pill.getAttribute("data-value");
      if(state.ending === value){
        state.ending = null;
        pill.classList.remove("active");
      } else {
        state.ending = value;
        document.querySelectorAll('.pill-group[data-group="ending"] .pill').forEach(function(p){ p.classList.remove("active"); });
        pill.classList.add("active");
      }
      render();
    });
  });

  // ---- reset ----
  document.getElementById("resetBtn").addEventListener("click", function(){
    if(!confirm("입력한 모든 내용을 초기화할까요?")) return;
    document.querySelectorAll('.form-panel input[type="text"], .form-panel textarea').forEach(function(el){ el.value = ""; });
    document.querySelectorAll(".chip.active, .pill.active").forEach(function(el){ el.classList.remove("active"); });
    document.querySelectorAll(".other-input").forEach(function(el){ el.classList.add("hidden"); });
    document.getElementById("uploadFilename").textContent = "";
    document.getElementById("photoPreview").innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.3"/>' +
      '<path d="M4 20c1.6-4 4.8-6 8-6s6.4 2 8 6" stroke="currentColor" stroke-width="1.3"/></svg>';
    state = {
      nickname: "", handle: "", avatarDataUrl: null,
      age: "",
      platforms: new Set(), platformOther: "",
      times: new Set(),
      ending: null,
      tendencies: new Set(), tendencyOther: "",
      favorites: "", mines: "", free: "", otherGenres: ""
    };
    render();
  });

  // ---- download as image ----
  function safeFilename(str){
    var base = (str || "카드").trim().replace(/[\\/:*?"<>|]/g, "");
    return "트친소_" + (base || "카드") + ".png";
  }

  document.getElementById("downloadBtn").addEventListener("click", function(){
    var btn = this;
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "저장 중...";
    var cardEl = document.getElementById("card");
    html2canvas(cardEl, { backgroundColor: null, scale: 3, useCORS: true }).then(function(canvas){
      var link = document.createElement("a");
      link.download = safeFilename(state.nickname);
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(function(err){
      alert("이미지 저장 중 문제가 발생했어요. 다시 시도해주세요.");
      console.error(err);
    }).finally(function(){
      btn.disabled = false;
      btn.textContent = originalText;
    });
  });

  // ---- twitter share ----
  document.getElementById("tweetBtn").addEventListener("click", function(){
    var text = "#트친소 #로판트친소 로판 트친소표 올려요!\n\n" + WATERMARK;
    var url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener");
  });

  render();
})();
