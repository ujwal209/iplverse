const fs = require('fs');
const path = require('path');

const loginSrc = path.join(__dirname, '../app/login/page.tsx');
const loginDestDir = path.join(__dirname, '../app/login/[[...login]]');
const loginDest = path.join(loginDestDir, 'page.tsx');

const registerSrc = path.join(__dirname, '../app/register/page.tsx');
const registerDestDir = path.join(__dirname, '../app/register/[[...register]]');
const registerDest = path.join(registerDestDir, 'page.tsx');

console.log('Reorganizing Clerk custom routes...');

try {
  // 1. Reorganize Login
  if (fs.existsSync(loginSrc)) {
    if (!fs.existsSync(loginDestDir)) {
      fs.mkdirSync(loginDestDir, { recursive: true });
    }
    fs.renameSync(loginSrc, loginDest);
    console.log('Moved login/page.tsx -> login/[[...login]]/page.tsx');
  } else if (fs.existsSync(loginDest)) {
    console.log('Login catch-all route already set up.');
  } else {
    console.warn('Login source page not found!');
  }

  // 2. Reorganize Register
  if (fs.existsSync(registerSrc)) {
    if (!fs.existsSync(registerDestDir)) {
      fs.mkdirSync(registerDestDir, { recursive: true });
    }
    fs.renameSync(registerSrc, registerDest);
    console.log('Moved register/page.tsx -> register/[[...register]]/page.tsx');
  } else if (fs.existsSync(registerDest)) {
    console.log('Register catch-all route already set up.');
  } else {
    console.warn('Register source page not found!');
  }

  console.log('Successfully completed route reorganization!');
} catch (err) {
  console.error('Error reorganizing routes:', err.message);
}
