/**
 * ステップ型フォーム（複数フォーム対応）
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".js-form").forEach(function (form) {
      initStepForm(form);
    });
  });

  function initStepForm(form) {
    const prevBtn = form.querySelector(".p-front__form-btn--prev");
    const nextBtn = form.querySelector(".p-front__form-btn--next");
    const submitBtn = form.querySelector(".p-front__form-btn--submit");

    if (!prevBtn || !nextBtn || !submitBtn) return;

    const questions = form.querySelectorAll(".js-form-question");
    let currentStep = 1;
    const totalSteps = questions.length;

    // 初期表示
    updateView();

    // 入力・選択時にエラーをクリア
    setupErrorClearListeners();

    // Enterキーでフォーム送信を防止
    form.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });

    // 戻るボタン
    prevBtn.addEventListener("click", function () {
      if (currentStep > 1) {
        currentStep--;
        updateView();
      }
    });

    // 進むボタン
    nextBtn.addEventListener("click", function () {
      if (validateCurrentStep() && currentStep < totalSteps) {
        currentStep++;
        updateView();
      }
    });

    // 送信ボタン
    submitBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (validateCurrentStep()) {
        submitForm();
      }
    });

    function updateView() {
      // 質問の表示切り替え
      questions.forEach(function (question, index) {
        if (index + 1 === currentStep) {
          question.classList.add("is-active");
        } else {
          question.classList.remove("is-active");
        }
      });

      // ボタンの表示切り替え
      prevBtn.disabled = currentStep === 1;

      if (currentStep === totalSteps) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "flex";
      } else {
        nextBtn.style.display = "flex";
        submitBtn.style.display = "none";
      }
    }

    function validateCurrentStep() {
      const currentQuestion = form.querySelector(
        '.js-form-question[data-step="' + currentStep + '"]'
      );
      if (!currentQuestion) return true;

      let isValid = true;

      // 既存のエラーをクリア
      clearErrors(currentQuestion);

      // ラジオボタンのバリデーション
      const radios = currentQuestion.querySelectorAll(".js-form-radio");
      if (radios.length > 0) {
        const checked = currentQuestion.querySelector(
          ".js-form-radio:checked"
        );
        if (!checked) {
          const optionsContainer = currentQuestion.querySelector(
            ".js-form-option"
          );
          if (optionsContainer) {
            showError(optionsContainer, "選択してください");
          }
          isValid = false;
        }
      }

      // 入力フィールドのバリデーション
      const inputs = currentQuestion.querySelectorAll(
        ".js-form-input[required]"
      );
      inputs.forEach(function (input) {
        const value = input.value.trim();
        const name = input.name;

        // 空チェック
        if (!value) {
          showError(input, "入力してください");
          isValid = false;
          return;
        }

        // 電話番号の形式チェック
        if (name === "tel") {
          if (!/^[0-9]{10,11}$/.test(value)) {
            if (value.includes("-")) {
              showError(input, "ハイフンなしで入力してください");
            } else {
              showError(input, "正しい電話番号を入力してください");
            }
            isValid = false;
            return;
          }
        }

      });

      // メールアドレス（任意）の形式チェック
      const emailInput = currentQuestion.querySelector('.js-form-input[name="email"]');
      if (emailInput) {
        const emailValue = emailInput.value.trim();
        if (emailValue && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailValue)) {
          showError(emailInput, "正しいメールアドレスを入力してください");
          isValid = false;
        }
      }

      // 生年月日のバリデーション（年/月/日をグループとして扱う）
      const birthdayContainer = currentQuestion.querySelector(".js-form-birthday");
      if (birthdayContainer) {
        const birthdaySelects = birthdayContainer.querySelectorAll(".js-form-select[required]");
        const allFilled = Array.from(birthdaySelects).every(function (s) { return s.value; });
        if (!allFilled) {
          showError(birthdayContainer, "生年月日を選択してください");
          isValid = false;
        }
      }

      // その他のセレクトボックスのバリデーション
      const selects = currentQuestion.querySelectorAll(
        ".js-form-select[required]:not(.form-question__select--birthday)"
      );
      selects.forEach(function (select) {
        if (!select.value) {
          showError(select, "選択してください");
          isValid = false;
        }
      });

      // チェックボックスのバリデーション
      const checkboxes = currentQuestion.querySelectorAll(
        ".p-front__form-checkbox[required]"
      );
      checkboxes.forEach(function (checkbox) {
        if (!checkbox.checked) {
          const checkboxGroup = checkbox.closest(
            ".p-front__form-checkbox-group"
          );
          if (checkboxGroup) {
            showError(checkboxGroup, "同意が必要です");
          }
          isValid = false;
        }
      });

      // 最初のエラー要素にフォーカス
      if (!isValid) {
        const firstError = currentQuestion.querySelector(".is-error");
        if (firstError) {
          firstError.focus();
        }
      }

      return isValid;
    }

    function showError(element, message) {
      element.classList.add("is-error");

      // エラーメッセージ要素を作成
      const errorMsg = document.createElement("span");
      errorMsg.className = "js-form-error";
      errorMsg.textContent = message;

      // 要素の種類に応じて挿入位置を決定
      if (element.classList.contains("js-form-option")) {
        element.appendChild(errorMsg);
      } else if (element.classList.contains("p-front__form-checkbox-group")) {
        // チェックボックスグループの場合は親要素に追加
        element.parentNode.appendChild(errorMsg);
      } else if (element.classList.contains("js-form-birthday")) {
        // 生年月日グループの場合は親要素（input-group）に追加
        element.parentNode.appendChild(errorMsg);
      } else {
        // セレクトボックスの場合は p-front__form-select-wrap の後に追加
        const selectWrap = element.closest(".js-form-wrap");
        if (selectWrap) {
          selectWrap.parentNode.appendChild(errorMsg);
          return;
        }

        element.parentNode.appendChild(errorMsg);
      }
    }

    function clearErrors(container) {
      // エラークラスを削除
      const errorElements = container.querySelectorAll(".is-error");
      errorElements.forEach(function (el) {
        el.classList.remove("is-error");
      });

      // エラーメッセージを削除
      const errorMessages = container.querySelectorAll(".js-form-error");
      errorMessages.forEach(function (msg) {
        msg.parentNode.removeChild(msg);
      });
    }

    function clearElementError(element) {
      // 要素自身のエラーをクリア
      element.classList.remove("is-error");

      // 生年月日セレクトの場合は birthday グループのエラーを削除
      const birthdayField = element.closest(".js-form-birthday-field");
      if (birthdayField) {
        const birthdayContainer = element.closest(".js-form-birthday");
        if (birthdayContainer) {
          birthdayContainer.classList.remove("is-error");
          const inputGroup = birthdayContainer.closest(".js-form-wrap");
          if (inputGroup) {
            const errorMsg = inputGroup.querySelector(".js-form-error");
            if (errorMsg) {
              inputGroup.removeChild(errorMsg);
            }
          }
        }
        return;
      }

      // セレクトボックスの場合は js-form-wrap からエラーメッセージを削除
      const selectWrap = element.closest(".js-form-wrap");
      if (selectWrap) {
        const inputGroup = selectWrap.parentNode;
        const errorMsg = inputGroup.querySelector(".js-form-error");
        if (errorMsg) {
          inputGroup.removeChild(errorMsg);
        }
        return;
      }

      // 親要素内のエラーメッセージを削除
      const parent = element.parentNode;
      const errorMsg = parent.querySelector(".js-form-error");
      if (errorMsg) {
        parent.removeChild(errorMsg);
      }
    }

    function clearContainerError(container, isCheckbox) {
      container.classList.remove("is-error");

      // チェックボックスの場合は次の兄弟要素（エラーメッセージ）を削除
      if (isCheckbox) {
        const nextSibling = container.nextElementSibling;
        if (nextSibling && nextSibling.classList.contains("js-form-error")) {
          nextSibling.parentNode.removeChild(nextSibling);
        }
      } else {
        const errorMsg = container.querySelector(".js-form-error");
        if (errorMsg) {
          container.removeChild(errorMsg);
        }
      }
    }

    function setupErrorClearListeners() {
      // ラジオボタン選択時
      const radios = form.querySelectorAll(".js-form-radio");
      radios.forEach(function (radio) {
        radio.addEventListener("change", function () {
          const optionsContainer = radio.closest(".js-form-option");
          if (optionsContainer) {
            clearContainerError(optionsContainer);
          }
        });
      });

      // 入力フィールド入力時
      const inputs = form.querySelectorAll(".js-form-input");
      inputs.forEach(function (input) {
        input.addEventListener("input", function () {
          clearElementError(input);
        });
      });

      // セレクトボックス選択時
      const selects = form.querySelectorAll(".js-form-select");
      selects.forEach(function (select) {
        select.addEventListener("change", function () {
          clearElementError(select);
        });
      });

      // チェックボックス選択時
      const checkboxes = form.querySelectorAll(".p-front__form-checkbox");
      checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
          const checkboxGroup = checkbox.closest(
            ".p-front__form-checkbox-group"
          );
          if (checkboxGroup) {
            clearContainerError(checkboxGroup, true);
          }
        });
      });
    }

    function submitForm() {
      // 送信中の状態にする
      submitBtn.disabled = true;
      submitBtn.querySelector(".form-btn__text").textContent =
        "送信中...";

      // reCAPTCHA v3トークンを取得してフォームを送信
      var siteKey = form.getAttribute("data-recaptcha-site-key");
      if (siteKey && typeof grecaptcha !== "undefined") {
        grecaptcha.ready(function () {
          grecaptcha.execute(siteKey, { action: "submit" }).then(function (token) {
            var tokenInput = document.createElement("input");
            tokenInput.type = "hidden";
            tokenInput.name = "recaptcha_response";
            tokenInput.value = token;
            form.appendChild(tokenInput);
            form.submit();
          });
        });
      } else {
        form.submit();
      }
    }
  }
})();
