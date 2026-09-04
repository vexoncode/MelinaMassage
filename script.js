/* =========================================================
   تنظیمات Supabase
========================================================= */

const SUPABASE_URL = "PUT_YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PUT_YOUR_SUPABASE_ANON_KEY_HERE";

let sb = null;

try {
  if (
    window.supabase &&
    SUPABASE_URL.startsWith("http")
  ) {
    sb = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }
} catch (e) {
  console.warn("Supabase init failed", e);
}


/* =========================================================
   Session ID
========================================================= */

function getSessionId() {

  let id = localStorage.getItem(
    "foryou_session_id"
  );

  if (!id) {

    id =
      "s_" +
      Math.random()
        .toString(36)
        .slice(2, 10) +
      Date.now()
        .toString(36);

    localStorage.setItem(
      "foryou_session_id",
      id
    );
  }

  return id;
}


const SESSION_ID = getSessionId();


/* =========================================================
   ثبت Event
========================================================= */

async function logEvent(
  step,
  label,
  value
) {

  console.log(
    "[event]",
    step,
    label,
    value ?? ""
  );

  if (!sb) return;

  try {

    await sb
      .from("events")
      .insert({
        session_id: SESSION_ID,
        step,
        label,
        value: value ?? null,
        user_agent: navigator.userAgent
      });

  } catch (e) {

    console.warn(
      "logEvent failed",
      e
    );

  }
}


/* =========================================================
   صدای کلیک
   بدون فایل صوتی
   بدون موزیک
========================================================= */

let audioContext = null;


function playClickSound() {

  try {

    if (!audioContext) {

      audioContext =
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

    }

    if (
      audioContext.state === "suspended"
    ) {
      audioContext.resume();
    }


    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();


    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      125,
      audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      55,
      audioContext.currentTime + 0.10
    );


    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.22,
      audioContext.currentTime + 0.008
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.12
    );


    oscillator.connect(gain);

    gain.connect(
      audioContext.destination
    );


    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + 0.13
    );

  } catch (e) {

    console.warn(
      "click sound failed",
      e
    );

  }
}


/* =========================================================
   صدای دکمه‌ها
========================================================= */

document.addEventListener(
  "click",
  (e) => {

    const button =
      e.target.closest(
        "button"
      );

    if (!button) return;

    playClickSound();

  }
);


/* =========================================================
   Progress
========================================================= */

const TOTAL_STEPS = 6;


document
  .querySelectorAll(".progress")
  .forEach(el => {

    const current =
      parseInt(
        el.dataset.progress,
        10
      );


    const dotsWrap =
      document.createElement(
        "div"
      );

    dotsWrap.className =
      "progress-dots";


    for (
      let i = 1;
      i <= TOTAL_STEPS;
      i++
    ) {

      const dot =
        document.createElement(
          "span"
        );


      if (i < current) {
        dot.classList.add(
          "done"
        );
      }


      if (i === current) {
        dot.classList.add(
          "now"
        );
      }


      dotsWrap.appendChild(
        dot
      );

    }


    el.appendChild(
      dotsWrap
    );

  });


/* =========================================================
   مدیریت صفحات
========================================================= */

const screens =
  Array.from(
    document.querySelectorAll(
      ".screen"
    )
  );


function showScreen(name) {

  screens.forEach(
    screen => {

      screen.classList.toggle(
        "active",
        screen.dataset.screen === name
      );

    }
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  logEvent(
    "view",
    "مشاهده صفحه: " + name
  );

}


/* صفحه اول */

showScreen(
  "landing"
);


/* =========================================================
   دلایل ستاره
   فقط 3 بار
========================================================= */

const REASONS = [

  "چون لبخندت برای من، از قشنگ‌ترین اتفاق‌های دنیاست. ♥",

  "چون بعضی آدم‌ها شبیه خانه‌اند... آدم هرچقدر هم دور شود، باز دلش می‌خواهد به سمتشان برگردد.",

  "چون تو، توی قلبمی و این برای من کافیه. ♥"

];


const starEl =
  document.getElementById(
    "neonStar"
  );


const cardWrap =
  document.getElementById(
    "reasonCardWrap"
  );


const cardEl =
  document.getElementById(
    "reasonCard"
  );


const counterEl =
  document.getElementById(
    "reasonCounter"
  );


const dotsEl =
  document.getElementById(
    "reasonDots"
  );


const continueBtn =
  document.getElementById(
    "starContinueBtn"
  );


/* ساخت سه نقطه */

REASONS.forEach(
  () => {

    const dot =
      document.createElement(
        "span"
      );

    dotsEl.appendChild(
      dot
    );

  }
);


let reasonIndex = 0;


/* لمس ستاره */

function touchStar() {

  if (
    reasonIndex >=
    REASONS.length
  ) {
    return;
  }


  cardWrap.hidden =
    false;


  cardEl.textContent =
    REASONS[
      reasonIndex
    ];


  counterEl.textContent =
    `${reasonIndex + 1}/${REASONS.length}`;


  const dotSpans =
    dotsEl.querySelectorAll(
      "span"
    );


  dotSpans.forEach(
    (dot, index) => {

      dot.classList.toggle(
        "done",
        index <= reasonIndex
      );

    }
  );


  logEvent(
    "star_touch",
    `دلیل ${reasonIndex + 1} نمایش داده شد`,
    REASONS[reasonIndex]
  );


  reasonIndex++;


  if (
    reasonIndex >=
    REASONS.length
  ) {

    continueBtn.hidden =
      false;

  }

}


/* کلیک ستاره */

starEl.addEventListener(
  "click",
  touchStar
);


/* کیبورد */

starEl.addEventListener(
  "keypress",
  e => {

    if (
      e.key === "Enter" ||
      e.key === " "
    ) {

      e.preventDefault();

      touchStar();

    }

  }
);


/* =========================================================
   دکمه‌ها
========================================================= */

document.addEventListener(
  "click",
  e => {

    const btn =
      e.target.closest(
        "[data-action]"
      );


    if (!btn) return;


    const action =
      btn.dataset.action;


    /* شروع */

    if (
      action === "start"
    ) {

      logEvent(
        "landing",
        "دکمه پیام برای ملینا زده شد"
      );


      showScreen(
        "step1"
      );

    }


    /* ادامه */

    if (
      action === "next"
    ) {

      const next =
        btn.dataset.next;


      const currentScreen =
        btn.closest(
          ".screen"
        );


      logEvent(
        currentScreen
          ? currentScreen.dataset.screen
          : "unknown",
        "دکمه ادامه زده شد"
      );


      showScreen(
        next
      );

    }


    /* انتخاب */

    if (
      action === "choice"
    ) {

      const choice =
        btn.dataset.choice;


      if (
        choice === "yes"
      ) {

        logEvent(
          "final_choice",
          "❤️ آره، دوباره امتحان کنیم انتخاب شد",
          choice
        );


        showScreen(
          "thanksYes"
        );

      }


      else if (
        choice === "no"
      ) {

        logEvent(
          "final_choice",
          "♡ هنوز آماده نیستم انتخاب شد",
          choice
        );


        showScreen(
          "thanksNo"
        );

      }

    }

  }
);


/* =========================================================
   شروع Session
========================================================= */

logEvent(
  "session_start",
  "کاربر جدید وارد پیام شد"
);