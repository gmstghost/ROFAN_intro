(function(){
  "use strict";

  // ---- 사이트 설정: 실제 배포 시 이 두 값을 바꿔주세요 ----
  var SITE_NAME = "잉크로즈";
  var SITE_URL  = "https://gmstghost.github.io/ROFAN_intro/";
  var WATERMARK = "이 트친소표는 " + SITE_NAME + "로 제작되었습니다. " + SITE_URL;

  // ---- 임시저장(자동저장) 설정 ----
  var STORAGE_KEY = "inkrose_trichinso_draft_v1";
  var SAVE_DEBOUNCE_MS = 500;
  var saveTimer = null;
  var suppressAutosave = false;

  var state = {
    nickname: "", handle: "", avatarDataUrl: null,
    age: "", ageOther: "",
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

  // ---- 임시저장(자동저장) ----
  function formatTime(ts){
    var d = new Date(ts);
    var h = d.getHours();
    var m = d.getMinutes();
    var period = h < 12 ? "오전" : "오후";
    var h12 = h % 12; if(h12 === 0) h12 = 12;
    var mm = (m < 10 ? "0" : "") + m;
    return period + " " + h12 + ":" + mm;
  }

  function showDraftStatus(text){
    var el = document.getElementById("draftStatus");
    if(el) el.textContent = text || "";
  }

  function isDraftEmpty(data){
    return !data.nickname && !data.handle && !data.avatarDataUrl && !data.age && !data.ageOther &&
      data.platforms.length === 0 && !data.platformOther &&
      data.times.length === 0 && !data.ending &&
      data.tendencies.length === 0 && !data.tendencyOther &&
      !data.favorites && !data.mines && !data.free && !data.otherGenres;
  }

  function serializeState(){
    return {
      nickname: state.nickname,
      handle: state.handle,
      avatarDataUrl: state.avatarDataUrl,
      age: state.age,
      ageOther: state.ageOther,
      platforms: Array.from(state.platforms),
      platformOther: state.platformOther,
      times: Array.from(state.times),
      ending: state.ending,
      tendencies: Array.from(state.tendencies),
      tendencyOther: state.tendencyOther,
      favorites: state.favorites,
      mines: state.mines,
      free: state.free,
      otherGenres: state.otherGenres,
      savedAt: Date.now()
    };
  }

  function saveDraftNow(){
    var data = serializeState();

    // 완전히 빈 상태라면 임시저장 자체를 남기지 않음
    if(isDraftEmpty(data)){
      try { localStorage.removeItem(STORAGE_KEY); } catch(err){}
      showDraftStatus("");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showDraftStatus("임시저장됨 · " + formatTime(data.savedAt));
    } catch(err){
      // 용량 초과 등으로 저장 실패 시, 프로필 사진을 뺀 상태로 재시도
      try {
        var withoutPhoto = Object.assign({}, data, { avatarDataUrl: null });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhoto));
        showDraftStatus("임시저장됨(용량 초과로 사진 제외) · " + formatTime(data.savedAt));
      } catch(err2){
        showDraftStatus("임시저장 실패 (브라우저 저장공간 부족)");
        console.error(err2);
      }
    }
  }

  function scheduleSave(){
    if(suppressAutosave) return;
    if(saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraftNow, SAVE_DEBOUNCE_MS);
  }

  function loadDraft(){
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch(err){ return; }
    if(!raw) return;

    var data;
    try { data = JSON.parse(raw); } catch(err){ return; }
    if(!data) return;

    state.nickname = data.nickname || "";
    state.handle = data.handle || "";
    state.avatarDataUrl = data.avatarDataUrl || null;
    state.age = data.age || "";
    state.ageOther = data.ageOther || "";
    state.platforms = new Set(data.platforms || []);
    state.platformOther = data.platformOther || "";
    state.times = new Set(data.times || []);
    state.ending = data.ending || null;
    state.tendencies = new Set(data.tendencies || []);
    state.tendencyOther = data.tendencyOther || "";
    state.favorites = data.favorites || "";
    state.mines = data.mines || "";
    state.free = data.free || "";
    state.otherGenres = data.otherGenres || "";

    document.getElementById("nickname").value = state.nickname;
    document.getElementById("handle").value = state.handle;
    document.getElementById("ageOther").value = state.ageOther;
    document.getElementById("favorites").value = state.favorites;
    document.getElementById("mines").value = state.mines;
    document.getElementById("free").value = state.free;
    document.getElementById("otherGenres").value = state.otherGenres;
    document.getElementById("platformOther").value = state.platformOther;
    document.getElementById("tendencyOther").value = state.tendencyOther;

    document.querySelectorAll('.chip-group[data-group="age"] .chip').forEach(function(chip){
      if(state.age === chip.getAttribute("data-value")) chip.classList.add("active");
    });
    if(state.age === "직접 입력") document.getElementById("ageOther").classList.remove("hidden");

    document.querySelectorAll('.chip-group[data-group="platform"] .chip').forEach(function(chip){
      if(state.platforms.has(chip.getAttribute("data-value"))) chip.classList.add("active");
    });
    document.querySelectorAll('.chip-group[data-group="time"] .chip').forEach(function(chip){
      if(state.times.has(chip.getAttribute("data-value"))) chip.classList.add("active");
    });
    document.querySelectorAll('.chip-group[data-group="tendency"] .chip').forEach(function(chip){
      if(state.tendencies.has(chip.getAttribute("data-value"))) chip.classList.add("active");
    });
    if(state.platforms.has("기타")) document.getElementById("platformOther").classList.remove("hidden");
    if(state.tendencies.has("기타")) document.getElementById("tendencyOther").classList.remove("hidden");

    if(state.ending){
      document.querySelectorAll('.pill-group[data-group="ending"] .pill').forEach(function(p){
        if(p.getAttribute("data-value") === state.ending) p.classList.add("active");
      });
    }

    if(state.avatarDataUrl){
      document.getElementById("photoPreview").innerHTML =
        '<img src="' + state.avatarDataUrl + '" alt="프로필 사진 미리보기" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    }

    if(data.savedAt){
      showDraftStatus("이전에 작성하던 내용을 불러왔어요 · " + formatTime(data.savedAt) + " 저장분");
    }
  }

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
    var ageText = state.age === "직접 입력" ? state.ageOther.trim() : state.age;
    if(ageText){
      ageEl.textContent = ageText;
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
      avatarInner.innerHTML = '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="12" cy="8" r="3.4" stroke-width="1.3"/>' +
        '<path d="M4 20c1.6-4 4.8-6 8-6s6.4 2 8 6" stroke-width="1.3"/></svg>';
    }

    scheduleSave();
  }

  // ---- text inputs ----
  document.getElementById("nickname").addEventListener("input", function(e){ state.nickname = e.target.value; render(); });
  document.getElementById("handle").addEventListener("input", function(e){ state.handle = e.target.value; render(); });
  document.getElementById("ageOther").addEventListener("input", function(e){ state.ageOther = e.target.value; render(); });
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

  // ---- age chip group (single select) ----
  document.querySelectorAll('.chip-group[data-group="age"] .chip').forEach(function(chip){
    chip.addEventListener("click", function(){
      var value = chip.getAttribute("data-value");
      var ageOtherInput = document.getElementById("ageOther");
      var isSame = state.age === value;

      document.querySelectorAll('.chip-group[data-group="age"] .chip').forEach(function(c){ c.classList.remove("active"); });

      if(isSame){
        state.age = "";
      } else {
        state.age = value;
        chip.classList.add("active");
      }

      if(state.age === "직접 입력"){
        ageOtherInput.classList.remove("hidden");
        ageOtherInput.focus();
      } else {
        ageOtherInput.classList.add("hidden");
        ageOtherInput.value = "";
        state.ageOther = "";
      }
      render();
    });
  });

  // ---- chip groups (multi select) ----
  document.querySelectorAll(".chip-group").forEach(function(group){
    var groupName = group.getAttribute("data-group");
    if(groupName === "age") return; // 나이는 위에서 단일 선택으로 별도 처리
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
    if(!confirm("입력한 모든 내용을 초기화할까요? 임시저장된 내용도 함께 삭제돼요.")) return;
    suppressAutosave = true;
    if(saveTimer) clearTimeout(saveTimer);
    try { localStorage.removeItem(STORAGE_KEY); } catch(err){}
    document.querySelectorAll('.form-panel input[type="text"], .form-panel textarea').forEach(function(el){ el.value = ""; });
    document.querySelectorAll(".chip.active, .pill.active").forEach(function(el){ el.classList.remove("active"); });
    document.querySelectorAll(".other-input").forEach(function(el){ el.classList.add("hidden"); });
    document.getElementById("uploadFilename").textContent = "";
    document.getElementById("photoPreview").innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="12" cy="8" r="3.4" stroke="currentColor" stroke-width="1.3"/>' +
      '<path d="M4 20c1.6-4 4.8-6 8-6s6.4 2 8 6" stroke="currentColor" stroke-width="1.3"/></svg>';
    state = {
      nickname: "", handle: "", avatarDataUrl: null,
      age: "", ageOther: "",
      platforms: new Set(), platformOther: "",
      times: new Set(),
      ending: null,
      tendencies: new Set(), tendencyOther: "",
      favorites: "", mines: "", free: "", otherGenres: ""
    };
    render();
    suppressAutosave = false;
    showDraftStatus("임시저장된 내용을 삭제했어요");
  });

  // ---- download as image ----
  function safeFilename(str){
    var base = (str || "카드").trim().replace(/[\\/:*?"<>|]/g, "");
    return "트친소_" + (base || "카드") + ".png";
  }

  // 폰트 로딩/레이아웃이 완전히 안정된 뒤에 캡처하도록 한 프레임 대기
  // (그렇지 않으면 캡처 순간에 일부 요소 크기가 일시적으로 0이 되어
  //  html2canvas가 그라디언트를 그리다 오류를 낼 수 있음)
  function waitForStableLayout(){
    return new Promise(function(resolve){
      var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready.catch(function(){}) : Promise.resolve();
      fontsReady.then(function(){
        requestAnimationFrame(function(){
          requestAnimationFrame(resolve);
        });
      });
    });
  }

  // html2canvas 1.4.1의 알려진 버그 우회:
  // 그라디언트 배경을 그릴 때 배경 영역이 반올림되어 폭/높이가 0인 캔버스가
  // 만들어지는 경우가 있는데, 이때 createPattern이 바로 예외를 던져 캡처 전체가
  // 실패함. (최신 html2canvas 소스에는 이 값을 최소 1px로 보정하는 수정이 있지만
  // cdnjs의 1.4.1 배포판에는 아직 반영되어 있지 않음)
  // -> 캡처하는 동안만 createPattern을 감싸서, 0px 캔버스가 들어오면 1x1로
  //    보정한 뒤 원래 함수를 호출하도록 함. 캡처가 끝나면 원래 함수로 복구.
  function captureWithZeroSizePatternFix(captureFn){
    var proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
    var original = proto && proto.createPattern;
    if(!proto || !original){
      return Promise.resolve().then(captureFn);
    }
    proto.createPattern = function(image, repetition){
      try{
        if(image && typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement){
          if(image.width === 0) image.width = 1;
          if(image.height === 0) image.height = 1;
        }
      } catch(patchErr){ /* 보정 실패 시에도 원래 함수는 그대로 시도 */ }
      return original.call(this, image, repetition);
    };
    return Promise.resolve()
      .then(captureFn)
      .finally(function(){ proto.createPattern = original; });
  }

  document.getElementById("downloadBtn").addEventListener("click", function(){
    var btn = this;
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "저장 중...";
    var cardEl = document.getElementById("card");
    waitForStableLayout().then(function(){
      return captureWithZeroSizePatternFix(function(){
        return html2canvas(cardEl, { backgroundColor: null, scale: 3, useCORS: true });
      });
    }).then(function(canvas){
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

  suppressAutosave = true;
  loadDraft();
  render();
  suppressAutosave = false;
})();