document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileSidebars = document.getElementById('mobile-sidebars');

    if (mobileToggle && mobileSidebars) {
        mobileToggle.addEventListener('click', () => {
            const isActive = mobileToggle.classList.contains('active');

            if (isActive) {
                mobileToggle.classList.remove('active');
                mobileSidebars.classList.remove('show');
            } else {
                mobileToggle.classList.add('active');
                mobileSidebars.classList.add('show');
            }
        });
    }
});
