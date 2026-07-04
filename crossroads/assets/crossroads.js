/* ============================================================
   Crossroads — shared shell renderer
   One nav definition drives every page. Livery persistence,
   crossfade, mobile toggle, current-page marking.
   ============================================================ */
(function(){
  "use strict";

  // Single source of truth for navigation. [label, file, [children]]
  var NAV = [
    ["About","index.html",[
      ["About the College","index.html"],
      ["Our Beliefs","our-beliefs.html"],
      ["Contact Us","contact.html"],
      ["Terms & Copyright","terms-of-use.html"]
    ]],
    ["Courses","student-sign-up.html",[
      ["Student Sign-Up","student-sign-up.html"],
      ["Level 1 — Spiritual Growth","spiritual-growth-series.html"],
      ["Level 3 — Foundation Studies","foundation-studies.html"],
      ["Level 4 — Module Course","module-study-course.html"]
    ]],
    ["Booklets","teaching-booklets-75.html",[
      ["75+ Teaching Booklets","teaching-booklets-75.html"],
      ["All Booklets (Index)","links-booklets-by-category.html"],
      ["Expanded Descriptions","expanded-75-booklets.html"],
      ["Booklet Contents","contents-of-75-booklets.html"]
    ]],
    ["Curriculum","curriculum.html",[
      ["Full Curriculum","curriculum.html"],
      ["Series 1 Studies","series-1-studies.html"],
      ["Series 2 Studies","series-2-studies.html"],
      ["Series 3 Studies","series-3-studies.html"],
      ["Certificates & Awards","certificates.html"],
      ["Curriculum Benchmark","curriculum-benchmark-analysis.html"]
    ]],
    ["Resources","resources.html",[
      ["Resources & Media","resources.html"],
      ["Blog Entries","blog-entries.html"]
    ]],
    ["Contact","contact.html",[]]
  ];

  var THEMES = [
    ["oxford","#15181e","Oxford (dark)"],
    ["chapel","#191527","Chapel (dark)"],
    ["parchment","#ece4d3","Parchment (light)"]
  ];
  var STORE = "crossroads-theme";

  function current(){
    var p = location.pathname.split("/").pop();
    return p || "index.html";
  }

  function esc(s){return (s||"").replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}

  /* ---- build header ---- */
  function buildHeader(){
    var host = document.getElementById("site-header");
    if(!host) return;
    var cur = current();

    var liveries = THEMES.map(function(t){
      return '<button data-theme="'+t[0]+'" style="--sw:'+t[1]+'" title="'+t[2]+'" aria-label="'+t[2]+' theme" aria-pressed="false"></button>';
    }).join("");

    var items = NAV.map(function(it){
      var kids = it[2]||[];
      var isCur = it[1]===cur || kids.some(function(k){return k[1]===cur;});
      var sub = kids.length ? '<ul class="submenu">'+kids.map(function(k){
        return '<li><a href="'+k[1]+'"'+(k[1]===cur?' aria-current="page"':'')+'>'+esc(k[0])+'</a></li>';
      }).join("")+'</ul>' : '';
      return '<li'+(kids.length?' class="has-sub"':'')+'>'+
             '<a href="'+it[1]+'"'+(it[1]===cur?' aria-current="page"':(isCur?' aria-current="true"':''))+'>'+esc(it[0])+'</a>'+
             sub+'</li>';
    }).join("");

    host.innerHTML =
      '<div class="wrap brandbar">'+
        '<a class="brand" href="index.html" style="text-decoration:none">'+
          '<span class="crest"><span>C</span></span>'+
          '<span class="brand-txt">'+
            '<span class="kicker">Est. 1990 · Warrnambool</span>'+
            '<span class="h">Crossroads <em>International</em> Bible College</span>'+
          '</span>'+
        '</a>'+
        '<div class="header-tools">'+
          '<div class="liveries" role="group" aria-label="Colour theme">'+liveries+'</div>'+
          '<a class="signin" href="student-sign-up.html" aria-label="Sign Up or Log In"><span class="full">Sign Up / Log In</span></a>'+
        '</div>'+
      '</div>'+
      '<nav class="primary" aria-label="Primary">'+
        '<div class="wrap">'+
          '<div class="navbar" id="navbar">'+
            '<button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mainMenu">'+
              '<span>Menu</span><span class="bars"><span></span></span>'+
            '</button>'+
            '<ul class="menu" id="mainMenu">'+items+'</ul>'+
          '</div>'+
        '</div>'+
      '</nav>';

    // mobile toggle
    var tog = document.getElementById("navToggle");
    var bar = document.getElementById("navbar");
    if(tog){
      tog.addEventListener("click",function(){
        var open = bar.classList.toggle("open");
        tog.setAttribute("aria-expanded", open?"true":"false");
      });
    }
    wireLiveries();
  }

  /* ---- footer ---- */
  function buildFooter(){
    var host = document.getElementById("site-footer");
    if(!host) return;
    var quick = [
      ["Student Sign-Up","student-sign-up.html"],
      ["Spiritual Growth Series","spiritual-growth-series.html"],
      ["75+ Teaching Booklets","teaching-booklets-75.html"],
      ["Foundation Studies","foundation-studies.html"],
      ["Module Course","module-study-course.html"]
    ];
    var about = [
      ["Our Beliefs","our-beliefs.html"],
      ["Curriculum Benchmark","curriculum-benchmark-analysis.html"],
      ["Certificates","certificates.html"],
      ["Terms & Copyright","terms-of-use.html"],
      ["Contact Us","contact.html"]
    ];
    function ul(arr){return '<ul class="foot-links">'+arr.map(function(a){return '<li><a href="'+a[1]+'">'+esc(a[0])+'</a></li>';}).join("")+'</ul>';}
    host.innerHTML =
      '<div class="wrap">'+
        '<div class="foot-grid">'+
          '<div class="foot-brand">'+
            '<p class="fb-name">Crossroads International<br>Bible College</p>'+
            '<p>Equipping believers and nurturing ministers for Christian service since 1990.</p>'+
            '<p><a href="mailto:crossroadsministries.au@gmail.com">crossroadsministries.au@gmail.com</a></p>'+
            '<p>10681 Princes Hwy, Warrnambool VIC 3280, Australia</p>'+
          '</div>'+
          '<div><h4>Courses</h4>'+ul(quick)+'</div>'+
          '<div><h4>The College</h4>'+ul(about)+'</div>'+
        '</div>'+
        '<div class="foot-note">'+
          '<span class="est">Full Gospel International Church</span> · affiliated with the World Evangelism Fellowship. '+
          'An independent, non-accredited college. Qualifications are internal awards recognised by many churches and mission organisations for ministry purposes.<br>'+
          '© '+new Date().getFullYear()+' Crossroads International Bible College. All rights reserved.'+
        '</div>'+
      '</div>';
  }

  /* ---- livery switch with crossfade ---- */
  function applyTheme(t,animate){
    var xf = document.getElementById("xfade");
    function set(){
      document.documentElement.setAttribute("data-theme",t);
      try{localStorage.setItem(STORE,t);}catch(e){}
      document.querySelectorAll(".liveries button").forEach(function(b){
        b.setAttribute("aria-pressed", b.dataset.theme===t ? "true":"false");
      });
    }
    if(animate && xf){
      xf.classList.add("on");
      setTimeout(function(){ set(); setTimeout(function(){xf.classList.remove("on");},50); },220);
    } else set();
  }
  function wireLiveries(){
    var saved;
    try{saved = localStorage.getItem(STORE);}catch(e){}
    applyTheme(saved || document.documentElement.getAttribute("data-theme") || "oxford", false);
    document.querySelectorAll(".liveries button").forEach(function(b){
      b.addEventListener("click",function(){
        if(document.documentElement.getAttribute("data-theme")===b.dataset.theme) return;
        applyTheme(b.dataset.theme, true);
      });
    });
  }

  // pre-paint theme (avoid flash) — runs immediately
  (function(){
    try{var s=localStorage.getItem(STORE); if(s) document.documentElement.setAttribute("data-theme",s);}catch(e){}
  })();

  document.addEventListener("DOMContentLoaded",function(){
    if(!document.getElementById("xfade")){
      var d=document.createElement("div"); d.id="xfade"; document.body.insertBefore(d,document.body.firstChild);
    }
    buildHeader();
    buildFooter();
  });
})();
