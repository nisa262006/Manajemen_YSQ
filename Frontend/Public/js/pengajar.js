document.addEventListener('DOMContentLoaded', () => {
    // === Variabel DOM Utama ===
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const mainTitle = document.getElementById('main-title');
    const detailToggles = document.querySelectorAll('.btn-toggle'); 

    // === Variabel Modal & Konteks ===
    const catatanModal = document.getElementById("catatanModal");
    const saveNoteButton = document.getElementById("saveNoteButton");
    const classNoteInput = document.getElementById("classNoteInput");
    const closeCatatanButton = document.querySelector("#catatanModal .close-button"); 
    const btnTambahCatatan = document.querySelector(".btn-tambah-catatan"); 

    const konfirmasiModal = document.getElementById("konfirmasiModal");
    const simpanAbsenButton = document.querySelector(".absensi-footer .btn-simpan"); 
    const lanjutkanSimpanButton = document.getElementById("lanjutkanSimpanButton");
    const batalSimpanButton = document.getElementById("batalSimpanButton");
    const closeKonfirmasiButton = document.getElementById("closeKonfirmasi");

    const detailSimpanModal = document.getElementById("detailSimpanModal");
    const lanjutkanDetailSimpanButton = document.getElementById("lanjutkanDetailSimpanButton");
    const batalDetailSimpanButton = document.getElementById("batalDetailSimpanButton");
    const closeDetailSimpan = document.getElementById("closeDetailSimpan");
    const detailSimpanKolom = document.getElementById("detailSimpanKolom");
    const detailSimpanButtons = document.querySelectorAll('.btn-materi, .btn-absensi, .btn-tugas');
    
    const fileInputModal = document.getElementById("fileInputModal");
    const linkTextInput = document.getElementById("linkTextInput");
    const fileUploadInput = document.getElementById("fileUploadInput");
    const customFileUploadButton = document.getElementById("customFileUploadButton");
    const btnSimpanFileInput = document.getElementById("simpanFileInputButton"); 
    const btnLihatRiwayat = document.querySelector('.btn-riwayat');
    const riwayatKehadiranSection = document.getElementById('riwayat-kehadiran-content');
    const closeFileInputModal = document.querySelector("#fileInputModal .close-button");

    let currentDetailType = ''; 
    let currentDetailCell = null; 
    let currentSimpanButton = null; 


    // ========================================================
    // === FUNGSI BANTUAN ===
    // ========================================================

    function sanitizeURL(url) {
        if (url && !url.startsWith('http')) {
            return `http://${url}`;
        }
        return url;
    }
    
    function showToast(message) {
        const toast = document.getElementById("toastNotification");
        
        if (toast) {
            toast.textContent = message;
            toast.classList.add("show");
            
            setTimeout(function(){ 
                toast.classList.remove("show"); 
            }, 3000);
        }
    }
    
    // === FUNGSI HAPUS KONTEN ===
    function handleDelete(button) {
        const detailItem = button.closest('.detail-item');
        const linkTrigger = detailItem.querySelector('.link-text-trigger');
        
        // 1. Reset Konten
        linkTrigger.innerHTML = 'Masukkan link/file materi';
        
        // 2. Reset Status Tombol: Hapus -> kosong
        button.textContent = 'kosong';
        button.classList.add('status-kosong');
        button.classList.remove('status-hapus');
        
        showToast("File Berhasil Dihapus.");
    }


    // ========================================================
    // === LOGIKA NAVIGASI SIDEBAR & TOGGLE DETAIL KELAS ===
    // ========================================================
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = item.getAttribute('data-content-id');
            const targetContent = document.getElementById(targetId);
            
            if (!targetContent) {
                const newTitle = item.querySelector('span').textContent;
                mainTitle.textContent = newTitle.toLowerCase();
                return; 
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(content => content.classList.remove('active'));

            item.classList.add('active');
            targetContent.classList.add('active');

            const newTitle = item.querySelector('span').textContent;
            mainTitle.textContent = newTitle.toLowerCase();
        });
    });

    // Toggle Detail Baris Tabel
    detailToggles.forEach(button => {
        button.addEventListener('click', () => {
            const targetClass = button.getAttribute('data-target');
            const targetRow = document.querySelector(`.${targetClass}`);
            
            if (targetRow) {
                targetRow.classList.toggle('active');
                
                if (targetRow.classList.contains('active')) {
                    button.textContent = 'Tutup';
                } else {
                    button.textContent = 'Detail';
                }
            }
        });
    });

// ========================================================
// === LOGIKA MODAL CATATAN ABSENSI (PENAMBAHAN) ===
// ========================================================

// 1. Logika untuk menampilkan modal catatan saat tombol 'Tambah Catatan' diklik
if (btnTambahCatatan && catatanModal) {
    btnTambahCatatan.addEventListener('click', () => {
        catatanModal.style.display = 'block';
    });
}

// 2. Logika Simpan di dalam Modal Catatan
if (saveNoteButton && catatanModal) {
    saveNoteButton.addEventListener('click', () => {
        // Asumsi: Di sini Anda akan menjalankan AJAX/Fetch untuk mengirim data catatan ke backend
        
        // Setelah proses penyimpanan (simulasi sukses):
        
        // 1. Tutup Modal
        catatanModal.style.display = 'none';
        
        // 2. Reset Input (Opsional: Bersihkan textarea setelah menyimpan)
        if (classNoteInput) {
             classNoteInput.value = '';
        }
        
        // 3. Tampilkan Notifikasi Sukses
        showToast("Catatan Telah Tersimpan");
    });
}

// 3. Logika Tutup Modal Catatan dengan ikon X
if (closeCatatanButton && catatanModal) {
    closeCatatanButton.onclick = function() {
        if (classNoteInput && classNoteInput.value.trim() !== '') {
                const confirmDiscard = confirm("Anda memiliki catatan yang belum disimpan. Apakah Anda yakin ingin membatalkan dan menutup?");
                
                if (confirmDiscard) {
                    catatanModal.style.display = 'none';
                    classNoteInput.value = ''; // Reset input setelah batal
                }
            } else {
                catatanModal.style.display = 'none'; }
    }
}

// ========================================================
    // === LOGIKA TOMBOL LIHAT RIWAYAT ABSENSI (BARU) ===
    // ========================================================
    // <<< BLOK TAMBAHAN START >>>
    if (btnLihatRiwayat && riwayatKehadiranSection) {
        btnLihatRiwayat.addEventListener('click', () => {
            
            // 1. NONAKTIFKAN SEMUA CONTENT SECTION
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // 2. TAMPILKAN SECTION RIWAYAT KEHADIRAN
            riwayatKehadiranSection.classList.add('active');
            
            // 3. Perbarui Judul Utama Dashboard
            const mainTitle = document.getElementById('main-title');
            if (mainTitle) {
                mainTitle.textContent = 'riwayat kehadiran'; 
            }

            // 4. Perbarui status aktif di sidebar (Pastikan Absensi tetap aktif)
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-content-id') === 'absensi-content') {
                    item.classList.add('active');
                }
            });
        });
    }

// ========================================================
// === LOGIKA SIMPAN ABSENSI UTAMA ===
// ========================================================

// 1. Tampilkan modal konfirmasi ketika tombol 'Simpan Absensi' diklik
if (simpanAbsenButton && konfirmasiModal) {
    simpanAbsenButton.addEventListener('click', () => {
        konfirmasiModal.style.display = 'block';
    });
}

// 2. Logika Simpan Final ketika 'Ya, Simpan Data' diklik
if (lanjutkanSimpanButton && konfirmasiModal) {
    lanjutkanSimpanButton.addEventListener('click', () => {
        // Simulasi pengiriman data ke backend (di sini Anda akan kirim data absen)

        // Setelah sukses:
        
        // 1. Tutup modal konfirmasi
        konfirmasiModal.style.display = 'none';
        
        // 2. Tampilkan notifikasi sukses
        showToast("Absensi berhasil disimpan!"); 
    });
}

// 3. Logika untuk tombol Batal Simpan
if (batalSimpanButton && konfirmasiModal) {
    batalSimpanButton.addEventListener('click', () => {
        konfirmasiModal.style.display = 'none';
        showToast("Penyimpanan dibatalkan.");
    });
}

// 4. Logika untuk tombol X/Tutup Konfirmasi
if (closeKonfirmasiButton && konfirmasiModal) {
    closeKonfirmasiButton.onclick = function() {
        konfirmasiModal.style.display = 'none';
    }
}
       
    // ========================================================
    // === EVENT DELEGATION: MENANGANI KLIK (HAPUS & MODAL) ===
    // ========================================================
    document.addEventListener('click', function(e) {
        const target = e.target;

        // Aksi 1: Menangani tombol HAPUS di Detail Kelas
        if (target.matches('.btn-materi.status-hapus, .btn-absensi.status-hapus, .btn-tugas.status-hapus')) {
            const buttonText = target.textContent.trim().toLowerCase();
            
            if (buttonText === 'hapus') { 
                e.preventDefault(); 
                handleDelete(target);
                return;
            } 
        }

        // Aksi 2: Menangani klik pada teks pemicu modal (selain tag <a>)
        if (target.closest('.link-text-trigger') && target.tagName !== 'A') {
            
            const textElement = target.closest('.link-text-trigger');
            e.preventDefault(); 
            
            const detailItem = textElement.closest('.detail-item');
            
            // 1. Simpan referensi
            currentDetailCell = detailItem; 
            currentSimpanButton = detailItem.querySelector('.btn-materi, .btn-absensi, .btn-tugas');

            // 2. Logika Pengisian Textarea
            const linkElement = textElement.querySelector('a');
            let contentToEdit = '';
            const placeholderText = "Masukkan link/file materi";
            
            if (linkElement) {
                contentToEdit = linkElement.getAttribute('href');
                if (contentToEdit.startsWith('/materi/') || linkElement.hasAttribute('download')) {
                    contentToEdit = linkElement.textContent.trim(); 
                }
            } else {
                contentToEdit = textElement.textContent.trim();
            }
            
            if (contentToEdit.toLowerCase().includes(placeholderText.toLowerCase()) || contentToEdit === "kosong" || contentToEdit === "#") {
                 linkTextInput.value = ""; 
            } else {
                 linkTextInput.value = contentToEdit;
            }
            
            // 3. Reset tampilan file di modal
            fileUploadInput.value = '';
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            if (fileNameDisplay) {
                 fileNameDisplay.textContent = 'Belum ada file yang dipilih.';
                 fileNameDisplay.style.color = '#777';
            }

            // 4. Tampilkan Modal
            if (fileInputModal) {
                 fileInputModal.style.display = "block";
            }
        }
    });


    // ========================================================
    // === LOGIKA MODAL INPUT FILE/LINK (PENTING) ===
    // ========================================================
    // 1. Logika Custom File Input: Membuka File Explorer
    if (customFileUploadButton) {
        customFileUploadButton.addEventListener('click', () => {
            if (fileUploadInput) { 
                fileUploadInput.click(); 
            }
        });
    }

    // 2. Logika Menampilkan Nama File yang Dipilih
    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', () => {
            const fileNameDisplay = document.getElementById('fileNameDisplay');
            if (fileNameDisplay) {
                if (fileUploadInput.files.length > 0) {
                    fileNameDisplay.textContent = fileUploadInput.files[0].name;
                    fileNameDisplay.style.color = 'var(--color-dark-green)';
                } else {
                    fileNameDisplay.textContent = 'Belum ada file dipilih.';
                    fileNameDisplay.style.color = '#777';
                }
            }
        });
    }

    // 3. Logika Simpan (di dalam Modal Input File)
    if (btnSimpanFileInput) {
        btnSimpanFileInput.onclick = function() {
            const textValue = linkTextInput.value.trim();
            const fileName = fileUploadInput.files.length > 0 ? fileUploadInput.files[0].name : '';
            
            let newContent = '';
            let linkURL = '';
            let isDocument = false; 
            
            if (fileName) { 
                newContent = fileName; 
                isDocument = true;
                linkURL = `/materi/${fileName}`; 
            } else if (textValue) { 
                newContent = textValue;
                linkURL = sanitizeURL(textValue);
            } else { 
                newContent = 'Masukkan link/file materi'; 
                linkURL = '#';
            }
            
            // =======================================================
            // *** VALIDASI: Mencegah Simpan jika Kosong (NEW) ***
            // =======================================================
            if (newContent === 'Masukkan link/file materi') {
                showToast("Belum ada file dipilih."); 
                return; // Menghentikan proses dan tidak menutup modal
            }

            // Update tampilan di tabel
            if (currentDetailCell) {
                const linkTrigger = currentDetailCell.querySelector('.link-text-trigger');
                
                if (linkTrigger) {
                    if (newContent === 'Masukkan link/file materi') {
                        linkTrigger.innerHTML = newContent; 
                    } else {
                        let linkHtml;
                        if (isDocument) {
                            linkHtml = `<a href="${linkURL}" download="${fileName}" target="_blank">${fileName}</a>`;
                        } else {
                            linkHtml = `<a href="${linkURL}" target="_blank">${newContent}</a>`;
                        }
                        linkTrigger.innerHTML = linkHtml;
                    }
                }
                
                // LOGIKA PENGUBAHAN TOMBOL: Simpan -> Hapus
                if (currentSimpanButton) {
                    if (newContent === 'Masukkan link/file materi') {
                        currentSimpanButton.textContent = 'kosong';
                        currentSimpanButton.classList.add('status-kosong'); 
                        currentSimpanButton.classList.remove('status-hapus'); 
                        
                    } else {
                        currentSimpanButton.textContent = 'Hapus';
                        currentSimpanButton.classList.add('status-hapus'); 
                        currentSimpanButton.classList.remove('status-kosong');
                    }
                }
            }

            // =======================================================
            // *** NOTIFIKASI SUKSES: Mengubah toast menjadi "Tersimpan" (NEW) ***
            // =======================================================
            showToast("Tersimpan"); 
            
            // Reset dan Tutup Modal
            linkTextInput.value = '';
            fileUploadInput.value = ''; 
            if (fileInputModal) {
                fileInputModal.style.display = 'none';
            }
        };
    }

    // ========================================================
    // [PENAMBAHAN LOGIKA TUTUP MODAL X]
    // ========================================================
if (closeFileInputModal) {
    closeFileInputModal.onclick = function() {
        if (fileInputModal) {
            fileInputModal.style.display = 'none';
        }
    }
}

    // ========================================================
    // === LOGIKA PENUTUPAN MODAL DENGAN KLIK DI LUAR ===
    // ========================================================
    window.onclick = function(event) {
        if (event.target == catatanModal) {
            if (classNoteInput && classNoteInput.value.trim() !== '') {
                const confirmDiscard = confirm("Anda memiliki catatan yang belum disimpan. Apakah Anda yakin ingin membatalkan dan menutup?");
                
                if (confirmDiscard) {
                    catatanModal.style.display = "none";
                    classNoteInput.value = ''; // Reset input setelah batal
                }
            } else {
                catatanModal.style.display = "none"; }
        }
        if (event.target == konfirmasiModal) {
            konfirmasiModal.style.display = "none";
        }
        if (event.target == fileInputModal) {
            fileInputModal.style.display = "none";
        }
    }
});