// =====================================================================
// TrustBoxx feedback form: validation and submit handling
// All settings you may want to change are in the CONFIG section below.
// =====================================================================

// ------------------------------ CONFIG -------------------------------

// true  -> a valid form is printed in the browser console (nothing is sent)
// false -> a valid form is POSTed to FEEDBACK_ENDPOINT, with reCAPTCHA
var LOG_TO_CONSOLE_ONLY = true;

// Where the form is sent when LOG_TO_CONSOLE_ONLY is false
var FEEDBACK_ENDPOINT = "website.php";

// HTML element IDs. If the website markup uses different IDs, change them here only.
var FORM_IDS = {
  form:          "feedback-form",
  submitButton:  "feedback-submit",
  loader:        "feedback-loader",

  name:          "feedback-name",
  nameError:     "feedback-name-error",
  email:         "feedback-email",
  emailError:    "feedback-email-error",
  phone:         "feedback-phone",
  phoneError:    "feedback-phone-error",
  role:          "feedback-role",
  roleError:     "feedback-role-error",
  organisation:  "feedback-organisation",
  message:       "feedback-message",
  messageError:  "feedback-message-error",
  messageCounter:"feedback-message-counter",

  category:         "feedback-category",          // hidden field filled by the category chips
  categoryOther:    "feedback-category-other",    // text box shown when "Other" is chosen
  categoryOtherError:"feedback-category-other-error"
};

// CSS class of the red error text under each field
var FIELD_ERROR_CLASS = "field-error";

// Validation rules
var NAME_PATTERN       = /^[A-Za-z.\s]{2,50}$/;   // letters, spaces, dots; 2 to 50 chars
var PHONE_PATTERN      = /^\d{10}$/;              // exactly 10 digits (optional field)
var ROLE_MAX_LENGTH    = 25;                      // optional field
var EMAIL_MAX_LENGTH   = 254;
var MESSAGE_MAX_WORDS  = 150;                     // feedback message limit (words)
var CATEGORY_OTHER_MAX_LENGTH = 50;               // "Other" category text limit (characters)
var CATEGORY_OTHER_VALUE = "Other";               // category value that shows the extra text box
var UNSAFE_CHARACTERS  = /[<>{}]/g;               // removed from the feedback message

// Email format: name@domain.tld (no spaces, no empty parts, no double dots)
var EMAIL_PATTERN = /^[A-Za-z0-9]+([._%+-][A-Za-z0-9]+)*@([A-Za-z0-9]+(-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,}$/;

// Email domain endings that are accepted. Anything else (e.g. "x@abc.sdsf") is rejected.
// Add a new ending here if a real customer uses a domain that is not listed.
var ALLOWED_EMAIL_TLDS = (
  // common generic endings
  "com org net edu gov mil int info biz name pro mobi asia tel travel jobs museum coop aero " +
  "io ai app dev tech online site xyz cloud store shop blog news email agency digital global " +
  "group company solutions services systems network software support team world live life " +
  "today space website page link studio design media works zone academy education institute " +
  "university research science health care clinic bio law legal finance bank money capital " +
  "ventures holdings consulting center ltd inc llc " +
  // country endings
  "ac ad ae af ag ai al am ao aq ar as at au aw ax az ba bb bd be bf bg bh bi bj bm bn bo br " +
  "bs bt bw by bz ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz de dj dk dm do dz " +
  "ec ee eg er es et eu fi fj fk fm fo fr ga gd ge gf gg gh gi gl gm gn gp gq gr gs gt gu gw " +
  "gy hk hm hn hr ht hu id ie il im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw " +
  "ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mo mp mq mr ms mt mu " +
  "mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn pr ps pt " +
  "pw py qa re ro rs ru rw sa sb sc sd se sg sh si sk sl sm sn so sr ss st su sv sx sy sz tc " +
  "td tg th tj tk tl tm tn to tr tt tv tw tz ua ug uk us uy uz va vc ve vg vi vn vu wf ws ye " +
  "yt za zm zw"
).split(" ");

// ------------------------------ HELPERS ------------------------------

function byId(key) {
  return document.getElementById(FORM_IDS[key]);
}

function isValidEmail(email) {
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return "Please enter a valid email";
  }
  var domainEnding = email.slice(email.lastIndexOf(".") + 1).toLowerCase();
  if (ALLOWED_EMAIL_TLDS.indexOf(domainEnding) === -1) {
    return "Please enter an email with a valid domain";
  }
  return ""; // no error
}

function countWords(text) {
  var trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// Live "12 / 150 words" counter under the feedback box (turns red when over the limit)
function updateMessageCounter() {
  var counter = byId("messageCounter");
  var messageInput = byId("message");
  if (!counter || !messageInput) return;
  var words = countWords(messageInput.value);
  counter.textContent = words + " / " + MESSAGE_MAX_WORDS + " words";
  counter.style.color = words > MESSAGE_MAX_WORDS ? "#E05C5C" : "";
}

function removeUnsafeCharacters(text) {
  return text.replace(UNSAFE_CHARACTERS, "");
}

// ----------------------------- SUBMIT FLOW ---------------------------

document.addEventListener("DOMContentLoaded", function () {
  byId("loader").style.display = "none";

  byId("message").addEventListener("input", updateMessageCounter);
  byId("form").addEventListener("reset", function () {
    setTimeout(updateMessageCounter, 0);
  });
  updateMessageCounter();

  byId("form").addEventListener("submit", function (e) {
    e.preventDefault();

    var isFormValid = validateFeedbackForm();
    var submitButton = byId("submitButton");

    // reCAPTCHA is skipped in console-only mode (it will not load locally)
    if (!LOG_TO_CONSOLE_ONLY) {
      var recaptchaResponse = grecaptcha.getResponse();
      if (recaptchaResponse.length === 0) {
        alert("Please complete the reCAPTCHA");
        return; // STOP FORM SUBMISSION
      }
    }

    if (isFormValid) {
      if (submitButton.disabled) return;

      submitButton.disabled = true;
      byId("loader").style.display = "block";

      var formData = new FormData(this);
      // g-recaptcha-response and trustboxx_nonce are picked up automatically
      // as long as they exist as fields inside the <form> markup.

      // ---------------- Console-only mode ----------------
      if (LOG_TO_CONSOLE_ONLY) {
        var submittedValues = {};
        formData.forEach(function (value, key) {
          submittedValues[key] = value;
        });

        console.log("========== FEEDBACK (console only, not sent) ==========");
        console.log(submittedValues);
        console.table(submittedValues);
        console.log("=======================================================");

        byId("loader").style.display = "none";
        submitButton.disabled = false;
        byId("form").reset();
        toastalert("Feedback printed in the console (not sent).");
        return; // no reload, so the console output stays visible
      }

      // ---------------- Send to the server ----------------
      var request = new XMLHttpRequest();
      request.open("POST", FEEDBACK_ENDPOINT, true);

      request.onload = function () {
        byId("loader").style.display = "none";
        submitButton.disabled = false;

        var result = null;
        try {
          result = JSON.parse(request.responseText);
        } catch (err) {
          result = null;
        }

        if (request.status === 200 && result && result.success) {
          byId("form").reset();
          if (typeof grecaptcha !== "undefined") {
            grecaptcha.reset();
          }
          toastalert(result.message || "Thank you! We will be in touch shortly.");
          setTimeout(function () {
            location.reload();
          }, 2000);
        } else {
          var errorMessage =
            (result && result.message) || "Something went wrong. Please try again.";
          toastalert(errorMessage);
          console.log("Error in submission:", errorMessage);
        }
      };

      request.onerror = function () {
        byId("loader").style.display = "none";
        submitButton.disabled = false;
        toastalert("Network error. Please try again.");
        console.log("Error in submission");
      };

      request.send(formData);
    } else {
      // Scroll smoothly to the first error message (the first one with text)
      var firstError = Array.prototype.find.call(
        document.querySelectorAll("." + FIELD_ERROR_CLASS),
        function (el) { return el.innerHTML.trim() !== ""; }
      );
      if (firstError) {
        window.scrollTo({
          top: firstError.offsetTop - 100,
          behavior: "smooth",
        });
      }
    }
  });
});

// ------------------------------ VALIDATION ---------------------------

function validateFeedbackForm() {
  var isFormValid = true;

  document.querySelectorAll("." + FIELD_ERROR_CLASS).forEach(function (errorBox) {
    errorBox.innerHTML = "";
  });

  // NAME (required)
  var nameInput = byId("name");
  var nameError = byId("nameError");
  var nameValue = nameInput.value.trim();
  nameInput.value = nameValue;

  if (!nameValue) {
    nameError.innerHTML = "Please enter a name";
    nameInput.style.borderColor = "red";
    isFormValid = false;
  } else if (!NAME_PATTERN.test(nameValue)) {
    nameError.innerHTML = "Name must contain only alphabets, spaces, or dots (max 50 characters)";
    nameInput.style.borderColor = "red";
    isFormValid = false;
  } else {
    nameInput.style.borderColor = "";
  }

  // EMAIL (required)
  var emailInput = byId("email");
  var emailError = byId("emailError");
  var emailValue = emailInput.value.trim();
  emailInput.value = emailValue;

  if (!emailValue) {
    emailError.innerHTML = "Please enter an email address";
    emailInput.style.borderColor = "red";
    isFormValid = false;
  } else {
    var emailProblem = isValidEmail(emailValue);
    if (emailProblem) {
      emailError.innerHTML = emailProblem;
      emailInput.style.borderColor = "red";
      isFormValid = false;
    } else {
      emailInput.style.borderColor = "";
    }
  }

  // PHONE (optional)
  var phoneInput = byId("phone");
  var phoneError = byId("phoneError");
  var phoneValue = phoneInput.value.trim();
  phoneInput.value = phoneValue;

  if (phoneValue && !PHONE_PATTERN.test(phoneValue)) {
    phoneError.innerHTML = "Phone must be exactly 10 digits";
    phoneInput.style.borderColor = "red";
    isFormValid = false;
  } else {
    phoneInput.style.borderColor = "";
  }

  // ROLE (optional)
  var roleInput = byId("role");
  var roleError = byId("roleError");
  var roleValue = roleInput.value.trim();
  roleInput.value = roleValue;

  if (roleValue.length > ROLE_MAX_LENGTH) {
    roleError.innerHTML = "Role cannot exceed " + ROLE_MAX_LENGTH + " characters";
    roleInput.style.borderColor = "red";
    isFormValid = false;
  } else {
    roleInput.style.borderColor = "";
  }

  // ORGANISATION: only trimmed (no rule)
  var organisationInput = byId("organisation");
  organisationInput.value = organisationInput.value.trim();

  // CATEGORY "Other": when chosen, a short description is required
  var categoryOtherInput = byId("categoryOther");
  var categoryOtherError = byId("categoryOtherError");
  if (byId("category").value === CATEGORY_OTHER_VALUE) {
    var otherValue = removeUnsafeCharacters(categoryOtherInput.value).trim();
    categoryOtherInput.value = otherValue;

    if (!otherValue) {
      categoryOtherError.innerHTML = "Please tell us what the category is";
      categoryOtherInput.style.borderColor = "red";
      isFormValid = false;
    } else if (otherValue.length > CATEGORY_OTHER_MAX_LENGTH) {
      categoryOtherError.innerHTML = "Category cannot exceed " + CATEGORY_OTHER_MAX_LENGTH + " characters";
      categoryOtherInput.style.borderColor = "red";
      isFormValid = false;
    } else {
      categoryOtherInput.style.borderColor = "";
    }
  }

  // FEEDBACK MESSAGE: optional, unsafe characters removed, maximum MESSAGE_MAX_WORDS words
  var messageInput = byId("message");
  var messageError = byId("messageError");
  messageInput.value = removeUnsafeCharacters(messageInput.value);

  if (countWords(messageInput.value) > MESSAGE_MAX_WORDS) {
    messageError.innerHTML = "Feedback cannot exceed " + MESSAGE_MAX_WORDS + " words";
    messageInput.style.borderColor = "red";
    isFormValid = false;
  } else {
    messageInput.style.borderColor = "";
  }

  return isFormValid;
}
