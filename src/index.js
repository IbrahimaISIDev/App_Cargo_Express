document.addEventListener('DOMContentLoaded', function () {
    const modalButtons = document.querySelectorAll('[data-modal-toggle]');
    const closeButtons = document.querySelectorAll('[data-modal-hide]');
    const overlay = document.querySelector('.overlay');

    modalButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetModal = button.getAttribute('data-modal-target');
            const modal = document.getElementById(targetModal);
            modal.classList.add('show');
            overlay.classList.add('show');
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetModal = button.getAttribute('data-modal-hide');
            const modal = document.getElementById(targetModal);
            modal.classList.remove('show');
            overlay.classList.remove('show');
        });
    });

    overlay.addEventListener('click', function () {
        modalButtons.forEach(button => {
            const targetModal = button.getAttribute('data-modal-target');
            const modal = document.getElementById(targetModal);
            modal.classList.remove('show');
        });
        overlay.classList.remove('show');
    });
});
