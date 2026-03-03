/* ========================================================= */
/* BLOCK 1: INISIALISASI ELEMEN MENU                         */
/* ========================================================= */
const reportToggle = document.getElementById('laporan-btn');
const reportSubmenu = document.getElementById('laporan-submenu');

/* ========================================================= */
/* BLOCK 2: LOGIKA BUKA/TUTUP (TOGGLE) SUB-MENU              */
/* ========================================================= */
if (reportToggle && reportSubmenu) {
    reportToggle.onclick = function(e) {
        // Mencegah navigasi default jika elemen adalah link
        e.preventDefault(); 
        // Menghentikan penyebaran klik agar tidak memicu auto-close secara tidak sengaja
        e.stopPropagation(); 

        const chevron = this.querySelector('.ysq-report-chevron');

        // Menggunakan pengecekan classList.contains agar lebih akurat daripada toggle()
        if (reportSubmenu.classList.contains('ysq-active')) {
            // JIKA SUDAH TERBUKA -> TUTUP
            reportSubmenu.classList.remove('ysq-active');
            if (chevron) chevron.classList.remove('ysq-rotate');
        } else {
            // JIKA MASIH TERTUTUP -> BUKA
            reportSubmenu.classList.add('ysq-active');
            if (chevron) chevron.classList.add('ysq-rotate');
        }
    };
}

/* ========================================================= */
/* BLOCK 3: AUTO-CLOSE SAAT MENU LAIN DIKLIK                 */
/* ========================================================= */
const otherMenus = document.querySelectorAll('.menu-item:not(#laporan-btn)');
otherMenus.forEach(menu => {
    menu.onclick = function() {
        // Tutup submenu laporan jika Admin mengklik menu sidebar lainnya
        if (reportSubmenu && reportSubmenu.classList.contains('ysq-active')) {
            reportSubmenu.classList.remove('ysq-active');
            
            const chevron = reportToggle.querySelector('.ysq-report-chevron');
            if (chevron) {
                chevron.classList.remove('ysq-rotate');
            }
        }
    };
});

document.addEventListener("DOMContentLoaded", function() {
    const currentUrl = window.location.href; // Mengambil URL lengkap
    const menuItems = document.querySelectorAll('.menu-item, #laporan-submenu a');
    const laporanBtn = document.getElementById('laporan-btn');
    const laporanSubmenu = document.getElementById('laporan-submenu');
    const chevron = document.querySelector('.ysq-report-chevron');

    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        
        // Cek apakah URL saat ini mengandung href dari menu
        if (href && currentUrl.includes(href)) {
            // Hapus class active dari semua menu dulu (opsional)
            document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            
            // Tambahkan class active ke menu yang diklik
            item.classList.add('active');

            // Jika yang aktif adalah bagian dari submenu Laporan
            if (item.closest('#laporan-submenu')) {
                // Aktifkan tombol induknya (Laporan)
                if (laporanBtn) laporanBtn.classList.add('active');
                
                // Pastikan submenu tetap terbuka
                if (laporanSubmenu) {
                    laporanSubmenu.style.display = 'flex'; // Paksa muncul
                    laporanSubmenu.classList.add('ysq-active');
                }
                
                // Putar panah
                if (chevron) chevron.classList.add('ysq-rotate');
            }
        }
    });
});