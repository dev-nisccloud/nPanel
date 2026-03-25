const fs = require('fs');
const path = require('path');
const targets = [
  ['auth.register.tsx','auth/register/index'],
  ['auth.forgot-password.tsx','auth/forgot-password/index'],
  ['auth.verify-email.tsx','auth/verify-email/index'],
  ['auth.reset-password.tsx','auth/reset-password/index'],
];
for (const [file, rel] of targets) {
  const out = path.resolve('src/routes', file);
  if (!fs.existsSync(out)) {
    fs.writeFileSync(out, `export { default } from "./${rel}";\n`);
    console.log('created', out);
  } else {
    console.log('exists', out);
  }
}
