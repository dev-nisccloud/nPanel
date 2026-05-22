/**
 * Submits WordPress wp-login.php with admin credentials in a new tab.
 * Plesk WP Toolkit does not expose a separate SSO login endpoint; credentials + loginUrl are used instead.
 */
export function openWordPressAdminLogin(credentials: {
  loginUrl: string;
  login: string;
  password: string;
}) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = credentials.loginUrl;
  form.target = "_blank";
  form.rel = "noopener noreferrer";

  const redirectTo = credentials.loginUrl.replace(/wp-login\.php.*$/i, "wp-admin/");

  const fields: Record<string, string> = {
    log: credentials.login,
    pwd: credentials.password,
    "wp-submit": "Log In",
    redirect_to: redirectTo,
    testcookie: "1",
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
