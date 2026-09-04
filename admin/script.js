/* ====== تنظیمات Supabase ======
   دقیقاً همون مقادیری که توی فایل اصلی script.js گذاشتی، اینجا هم بذار.
*/
const SUPABASE_URL = "PUT_YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PUT_YOUR_SUPABASE_ANON_KEY_HERE";

/* ====== رمز عبور پنل ادمین ======
   به‌جای نوشتن رمز به‌صورت متن ساده، هش SHA-256 رمز رو اینجا می‌ذاریم.
   برای عوض کردن رمز: مقدار جدید رو توی کنسول مرورگر با این دستور بساز و اینجا جایگزین کن:
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("رمز-جدید")).then(b=>console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("")))
   رمز پیش‌فرض فعلی: "foryou1404"  (حتماً بعد از تست عوضش کن!)
*/
const PASSWORD_HASH = "c2367e9e65477152b30f66f4f68ed75c8dd120d744a12887f9494329888727fd";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, "0")).join("");
}

const loginWrap = document.getElementById("loginWrap");
const panel = document.getElementById("panel");
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("passwordInput");
const loginErr = document.getElementById("loginErr");

function enterPanel() {
  sessionStorage.setItem("foryou_admin_ok", "1");
  loginWrap.hidden = true;
  panel.hidden = false;
  initPanel();
}

if (sessionStorage.getItem("foryou_admin_ok") === "1") {
  enterPanel();
}

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const hash = await sha256(passwordInput.value.trim());
  if (hash === PASSWORD_HASH) {
    loginErr.hidden = true;
    enterPanel();
  } else {
    loginErr.hidden = false;
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  sessionStorage.removeItem("foryou_admin_ok");
  location.reload();
});

/* ====== پنل اصلی ====== */
let sb = null;
let panelInited = false;

function initPanel() {
  if (panelInited) return;
  panelInited = true;

  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const feed = document.getElementById("feed");
  const emptyMsg = document.getElementById("emptyMsg");
  const statTotalEvents = document.getElementById("statTotalEvents");
  const statTotalSessions = document.getElementById("statTotalSessions");
  const statYes = document.getElementById("statYes");
  const statNo = document.getElementById("statNo");

  const sessionsSeen = new Set();
  let totalEvents = 0, yesCount = 0, noCount = 0;

  function fmtTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function renderEvent(ev, prepend = true) {
    emptyMsg.remove?.();
    const item = document.createElement("div");
    item.className = "event-item";
    if (ev.step === "final_choice") {
      item.classList.add(ev.value === "yes" ? "choice-yes" : "choice-no");
    }
    item.innerHTML = `
      <div class="event-top">
        <span class="event-session">${ev.session_id?.slice(0, 10) || "—"}</span>
        <span>${fmtTime(ev.created_at)}</span>
      </div>
      <div class="event-label">${ev.label || ev.step}</div>
    `;
    if (prepend) feed.prepend(item); else feed.appendChild(item);
  }

  function bumpStats(ev) {
    totalEvents++;
    if (ev.session_id) sessionsSeen.add(ev.session_id);
    if (ev.step === "final_choice") {
      if (ev.value === "yes") yesCount++;
      if (ev.value === "no") noCount++;
    }
    statTotalEvents.textContent = totalEvents;
    statTotalSessions.textContent = sessionsSeen.size;
    statYes.textContent = yesCount;
    statNo.textContent = noCount;
  }

  if (!window.supabase || !SUPABASE_URL.startsWith("http")) {
    statusDot.className = "status-dot offline";
    statusText.textContent = "Supabase وصل نیست (تنظیمات رو کامل کن)";
    return;
  }

  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // بارگذاری اولیه ۵۰ رویداد آخر
  (async () => {
    const { data, error } = await sb
      .from("events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      statusText.textContent = "خطا در بارگذاری: " + error.message;
      return;
    }
    const rows = (data || []).slice().reverse();
    rows.forEach(ev => { renderEvent(ev, false); bumpStats(ev); });
    feed.scrollTop = feed.scrollHeight;
  })();

  // اتصال زنده (Realtime) برای هر رویداد جدید
  const channel = sb
    .channel("events-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "events" }, payload => {
      renderEvent(payload.new, true);
      bumpStats(payload.new);
    })
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        statusDot.className = "status-dot online";
        statusText.textContent = "آنلاین — منتظر رویدادهای زنده";
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        statusDot.className = "status-dot offline";
        statusText.textContent = "قطع شد، در حال تلاش مجدد...";
      }
    });

  document.getElementById("clearFeedBtn").addEventListener("click", () => {
    feed.innerHTML = "";
  });
}