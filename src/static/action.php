<?php
// ===================================================
// 設定項目（案件ごとにここを変更する）
// ===================================================
// 【.env に記載が必要なキー】
//   SENDGRID_KEY=SendGridのAPIキー
//   RECAPTCHA_SECRET_KEY=reCAPTCHA v3のシークレットキー
// ===================================================
$site_url       = "https://example.com";           // サイトURL
$site_name      = "株式会社〇〇";                   // 会社名
$from_email     = "noreply@example.com";           // 送信元メールアドレス
$from_name      = "株式会社〇〇";                   // 送信元名
$admin_recipients = [                              // 管理者（通知先）複数設定可
  ["email" => "admin@example.com", "name" => "管理者"],
  // ["email" => "admin2@example.com", "name" => "管理者2"],
];
$mail_subject_admin = "【〇〇】お問い合わせがありました";  // 管理者宛件名
$mail_subject_user  = "【〇〇】お問い合わせを受け付けました";  // 応募者宛件名
$thanks_page    = "thanks.html";                   // 送信成功後のリダイレクト先
// ===================================================

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// reCAPTCHA v3 の検証
$recaptcha_response = $_POST['recaptcha_response'] ?? '';
if (empty($recaptcha_response)) {
  echo "reCAPTCHAレスポンスが送信されていません。";
  exit;
}

$recaptcha_secret = $_SERVER['RECAPTCHA_SECRET_KEY'];
$recaptch_url = 'https://www.google.com/recaptcha/api/siteverify';
$recaptcha_params = [
  'secret' => $recaptcha_secret,
  'response' => $recaptcha_response,
];
$recaptcha = json_decode(file_get_contents($recaptch_url . '?' . http_build_query($recaptcha_params)));

if (!$recaptcha->success || $recaptcha->score < 0.3) {
  echo "認証エラー";
  exit;
}

// ===================================================
// 【要修正】バリデーション
// フォームの入力項目に合わせて追加・削除・変更すること。
//
// ■ 必須チェックの追加例：
//   if (empty($_POST['項目名'])) {
//     $errors['項目名'] = '〇〇は必須です。';
//   }
//
// ■ 形式チェックの追加例（正規表現）：
//   } elseif (!preg_match('/正規表現/', $_POST['項目名'])) {
//     $errors['項目名'] = '形式が正しくありません。';
//   }
//
// ■ 不要な項目のバリデーションは削除すること。
// ===================================================

// バリデーションエラーを格納する配列
$errors = [];

// 氏名のバリデーション
// ※ 日本語（ひらがな・カタカナ・漢字）のみ許可。英字も許可する場合は正規表現を修正すること。
if (empty($_POST['name'])) {
  $errors['name'] = '氏名は必須です。';
} elseif (!preg_match('/^[\x{3040}-\x{309F}\x{30A0}-\x{30FF}\x{4E00}-\x{9FFF}\x{3400}-\x{4DBF}\s　]+$/u', $_POST['name'])) {
  $errors['name'] = '氏名はひらがな・カタカナ・漢字で入力してください。';
}

// 生年月日のバリデーション
// ※ フォームに生年月日がない場合はこのブロックごと削除すること。
$birth_year  = $_POST['birth_year']  ?? '';
$birth_month = $_POST['birth_month'] ?? '';
$birth_day   = $_POST['birth_day']   ?? '';
if (empty($birth_year) || empty($birth_month) || empty($birth_day)) {
  $errors['birthday'] = '生年月日は必須です。';
} elseif (!checkdate((int)$birth_month, (int)$birth_day, (int)$birth_year)) {
  $errors['birthday'] = '生年月日が正しくありません。';
}

// 電話番号のバリデーション
$tel = $_POST['tel'] ?? '';
if (empty($tel)) {
  $errors['tel'] = '電話番号は必須です。';
} elseif (!preg_match('/^\d{10,11}$/', $tel)) {
  $errors['tel'] = '電話番号は10〜11桁の数字のみで入力してください。';
}

// メールアドレスのバリデーション
$email = $_POST['email'] ?? '';
if (empty($email)) {
  $errors['email'] = 'メールアドレスは必須です。';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  $errors['email'] = 'メールアドレスの形式が不正です。';
}

// 希望選考のバリデーション
// ※ フォームに希望選考がない場合はこのブロックごと削除すること。
$selection = $_POST['selection'] ?? '';
if (empty($selection)) {
  $errors['selection'] = '希望の選考を選択してください。';
}

// 個人情報保護方針への同意のバリデーション
// ※ 同意チェックボックスの name 属性が "privacy" であることを確認すること。
if (empty($_POST['privacy'])) {
  $errors['privacy'] = '個人情報保護方針への同意は必須です。';
}

// バリデーションエラーが存在する場合は、エラーページへリダイレクト
if (!empty($errors)) {
  // エラーメッセージをセッションに保存してリダイレクトする方法もあり
  // ここでは簡易的にエラーを表示
  foreach ($errors as $error) {
    echo $error . "<br>";
  }
  exit;
}

// ===================================================
// 【要修正】フォームデータの取得
// バリデーションで追加・削除した項目に合わせて修正すること。
// ・任意項目は ?? '' でデフォルト値を設定する。
// ・必須項目は ?? '' 不要。
// ===================================================
$name       = $_POST['name'];
$birthday   = "{$birth_year}年{$birth_month}月{$birth_day}日";
$tel        = $_POST['tel'];
$email      = $_POST['email'];
$selection  = $_POST['selection'];
$university = $_POST['university'] ?? '';  // 任意項目
$faculty    = $_POST['faculty'] ?? '';     // 任意項目

// ===================================================
// 【要修正】管理者への通知メール本文
// フォームの入力項目に合わせて [ 項目名 ] の行を追加・削除・変更すること。
// ===================================================
$notificationEmail = new \SendGrid\Mail\Mail();
$notificationEmail->setFrom($from_email, $from_name);
$notificationEmail->setSubject($mail_subject_admin);
foreach ($admin_recipients as $recipient) {
  $notificationEmail->addTo($recipient['email'], $recipient['name']);
}
$notificationEmail->addContent("text/plain", "
お問い合わせがありました。
内容を確認し、折り返しご連絡をお願いします。

---------------------------------
[ 氏名 ]
{$name}

[ 生年月日 ]
{$birthday}

[ 電話番号 ]
{$tel}

[ メールアドレス ]
{$email}

[ 希望選考 ]
{$selection}

[ 出身大学 ]
{$university}

[ 学部 ]
{$faculty}

---------------------------------
{$site_name}
{$site_url}
");

// ===================================================
// 【要修正】応募者への自動返信メール本文
// ・冒頭の案内文（「担当者よりお電話いたします。」など）はフォームの目的に応じて変更すること。
// ・フォームの入力項目に合わせて [ 項目名 ] の行を追加・削除・変更すること。
// ===================================================
$autoReplyEmail = new \SendGrid\Mail\Mail();
$autoReplyEmail->setFrom($from_email, $from_name);
$autoReplyEmail->setSubject($mail_subject_user);
$autoReplyEmail->addTo($email, $name);
$autoReplyEmail->addContent("text/plain", "
この度は、{$site_name}よりお問い合わせいただき、
誠にありがとうございます。

下記の内容で受け付けましたので、ご確認ください。
担当者よりご連絡いたします。

---------------------------------

[ 氏名 ]
{$name}

[ 生年月日 ]
{$birthday}

[ 電話番号 ]
{$tel}

[ メールアドレス ]
{$email}

[ 希望選考 ]
{$selection}

[ 出身大学 ]
{$university}

[ 学部 ]
{$faculty}

---------------------------------

※このメールは自動送信されています。
ご返信いただいてもお答えできませんのでご了承ください。

---------------------------------
{$site_name}
{$site_url}
---------------------------------
");

$apiKey = $_SERVER['SENDGRID_KEY'];
$sendgrid = new \SendGrid($apiKey);

try {
  $response1 = $sendgrid->send($notificationEmail);
  $response2 = $sendgrid->send($autoReplyEmail);

  if ($response1->statusCode() == 202 && $response2->statusCode() == 202) {
    // 成功時はサンクスページへリダイレクト
    header("Location: {$thanks_page}");
    exit;
  } else {
    // メール送信失敗
    echo "メール送信に失敗しました。";
    exit;
  }
} catch (Exception $e) {
  echo "エラーが発生しました: " . $e->getMessage();
  exit;
}
