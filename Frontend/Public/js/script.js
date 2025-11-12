const registerBtn = document.querySelectorAll('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const registerForm = document.querySelector('.form-box.register');
const loginForm = document.querySelector('.form-box.login');

registerBtn.forEach(btn => {
  btn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });
});

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });
}
