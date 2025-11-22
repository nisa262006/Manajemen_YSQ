/* pengajar.js --- behavior untuk dashboard pengajar */
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM references ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const mainTitle = document.getElementById('main-title');
    const userNameEl = document.querySelector('.user-name');
  
    // modals & elements
    const catatanModal = document.getElementById('catatanModal');
    const saveNoteButton = document.getElementById('saveNoteButton');
    const classNoteInput = document.getElementById('classNoteInput');
    const btnTambahCatatan = document.querySelector('.btn-tambah-catatan');
  
    const fileInputModal = document.getElementById('fileInputModal');
    const linkTextInput = document.getElementById('linkTextInput');
    const fileUploadInput = document.getElementById('fileUploadInput');
    const customFileUploadButton = document.getElementById('customFileUploadButton');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const simpanFileInputButton = document.getElementById('simpanFileInputButton');
    const closeFileInputModal = document.getElementById('closeFileInputModal');
  
    const konfirmasiModal = document.getElementById('konfirmasiModal');
    const simpanAbsenBtn = document.getElementById('btnSimpanAbsensi');
    const lanjutkanSimpanButton = document.getElementById('lanjutkanSimpanButton');
    const batalSimpanButton = document.getElementById('batalSimpanButton');
    const closeKonfirmasiButton = document.getElementById('closeKonfirmasi');
  
    const btnViewRiwayat = document.getElementById('btnViewRiwayat');
    const riwayatBody = document.getElementById('riwayatBody');
  
    const absenPengajarSelect = document.getElementById('absenPengajarSelect');
    const simpanAbsenPengajarBtn = document.getElementById('simpanAbsenPengajar');
    const absenPengajarInfo = document.getElementById('absenPengajarInfo');
  
    const toast = document.getElementById('toastNotification');
  
    // helper: toast
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(()=> toast.classList.remove('show'), 2500);
    }
  
    // helper: sanitize URL
    function sanitizeURL(url){
      if(!url) return '#';
      if(url.startsWith('http') || url.startsWith('/')) return url;
      return 'http://' + url;
    }
  
    // load name from localStorage if set
    const namaUser = localStorage.getItem('namaUser');
    if(namaUser){
      userNameEl.textContent = namaUser;
    }
  
    // --- NAVIGATION ---
    navItems.forEach(item=>{
      item.addEventListener('click', e=>{
        e.preventDefault();
        const id = item.getAttribute('data-content-id');
        navItems.forEach(n=> n.classList.remove('active'));
        item.classList.add('active');
        sections.forEach(s=> s.classList.remove('active'));
        const target = document.getElementById(id);
        if(target){
          target.classList.add('active');
          mainTitle.textContent = item.querySelector('span').textContent;
        }
      });
    });
  
    // --- Toggle detail rows (ONLY for jadwal pages where Detail buttons exist) ---
    const detailToggles = document.querySelectorAll('.btn-toggle');
    detailToggles.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const targetClass = btn.getAttribute('data-target');
        const targetRow = document.querySelector(`.${targetClass}`);
        if(!targetRow) return;
        targetRow.classList.toggle('active');
        btn.textContent = targetRow.classList.contains('active') ? 'Tutup' : 'Detail';
      });
    });
  
    // --- file input modal logic (used for materi/absensi/tugas) ---
    let currentDetailCell = null;
    let currentSaveButton = null;
  
    // open custom file dialog
    if(customFileUploadButton){
      customFileUploadButton.addEventListener('click', ()=> {
        fileUploadInput.click();
      });
    }
  
    if(fileUploadInput){
      fileUploadInput.addEventListener('change', ()=>{
        if(fileUploadInput.files.length > 0){
          fileNameDisplay.textContent = fileUploadInput.files[0].name;
          fileNameDisplay.style.color = 'var(--dark-green)';
        } else {
          fileNameDisplay.textContent = 'Belum ada file dipilih.';
          fileNameDisplay.style.color = '#777';
        }
      });
    }
  
    // delegate clicks to link-text-trigger (open modal to edit)
    document.addEventListener('click', e=>{
      const el = e.target;
      // open file modal when clicking .link-text-trigger
      const trigger = el.closest('.link-text-trigger');
      if(trigger){
        e.preventDefault();
        currentDetailCell = trigger.closest('.detail-item');
        currentSaveButton = currentDetailCell.querySelector('.btn-materi, .btn-absensi, .btn-tugas');
  
        // load existing content
        const link = trigger.querySelector('a');
        if(link){
          linkTextInput.value = link.getAttribute('href') || link.textContent || '';
        } else {
          const txt = trigger.textContent.trim();
          linkTextInput.value = (txt.includes('Masukkan Link') ? '' : txt);
        }
        // reset file input UI
        fileUploadInput.value = '';
        fileNameDisplay.textContent = 'Belum ada file dipilih.';
        fileNameDisplay.style.color = '#777';
        // show modal
        fileInputModal.style.display = 'block';
      }
  
      // handle delete buttons in detail (status-hapus)
      if(el.matches('.btn-materi.status-hapus, .btn-absensi.status-hapus, .btn-tugas.status-hapus')){
        e.preventDefault();
        const detailItem = el.closest('.detail-item');
        const linkTrigger = detailItem.querySelector('.link-text-trigger');
        // reset
        linkTrigger.innerHTML = 'Masukkan Link/File Materi';
        el.textContent = 'kosong';
        el.classList.remove('status-hapus');
        el.classList.add('status-kosong');
        showToast('File berhasil dihapus.');
      }
    });
  
    // save file/link from modal
    if(simpanFileInputButton){
      simpanFileInputButton.addEventListener('click', ()=>{
        const textValue = linkTextInput.value.trim();
        const file = fileUploadInput.files.length ? fileUploadInput.files[0] : null;
  
        if(!currentDetailCell){
          showToast('Tidak ada target.');
          return;
        }
  
        let newContentHtml = '';
        if(file){
          const fname = file.name;
          // in real app you'd upload; here we simulate with a link to /materi/
          newContentHtml = `<a href="/materi/${fname}" download="${fname}" target="_blank">${fname}</a>`;
        } else if(textValue){
          const url = sanitizeURL(textValue);
          newContentHtml = `<a href="${url}" target="_blank">${textValue}</a>`;
        } else {
          showToast('Belum ada file atau link yang diisi.');
          return;
        }
  
        const linkTrigger = currentDetailCell.querySelector('.link-text-trigger');
        linkTrigger.innerHTML = newContentHtml;
  
        // change save button to Hapus
        if(currentSaveButton){
          currentSaveButton.textContent = 'Hapus';
          currentSaveButton.classList.remove('status-kosong');
          currentSaveButton.classList.add('status-hapus');
        }
  
        // close modal & reset
        fileInputModal.style.display = 'none';
        linkTextInput.value = '';
        if(fileUploadInput) fileUploadInput.value = '';
  
        showToast('Tersimpan');
      });
    }
  
    if(closeFileInputModal){
      closeFileInputModal.addEventListener('click', ()=> fileInputModal.style.display = 'none');
    }
  
    // close modals on click outside
    window.onclick = function(ev){
      if(ev.target === fileInputModal) fileInputModal.style.display = 'none';
      if(ev.target === catatanModal) {
        if(classNoteInput && classNoteInput.value.trim() !== ''){
          if(!confirm('Anda memiliki catatan yang belum disimpan. Tetap tutup?')) return;
        }
        catatanModal.style.display = 'none';
      }
      if(ev.target === konfirmasiModal) konfirmasiModal.style.display = 'none';
    };
  
    // --- Tambah catatan modal ---
    if(btnTambahCatatan){
      btnTambahCatatan.addEventListener('click', ()=> catatanModal.style.display = 'block');
    }
    if(saveNoteButton){
      saveNoteButton.addEventListener('click', ()=> {
        const note = classNoteInput.value.trim();
        if(!note){
          showToast('Isi catatan terlebih dahulu.');
          return;
        }
        // Simulasi simpan: gunakan localStorage 'catatanKelas'
        const today = new Date().toLocaleDateString('id-ID');
        const all = JSON.parse(localStorage.getItem('catatanKelas')||'[]');
        all.push({ tanggal: today, note });
        localStorage.setItem('catatanKelas', JSON.stringify(all));
        classNoteInput.value = '';
        catatanModal.style.display = 'none';
        showToast('Catatan tersimpan.');
      });
    }
  
    // --- Absensi Pengajar Hari Ini (panel) ---
    if(simpanAbsenPengajarBtn){
      simpanAbsenPengajarBtn.addEventListener('click', ()=>{
        const status = absenPengajarSelect.value;
        if(!status){
          showToast('Pilih status kehadiran pengajar.');
          return;
        }
        const today = new Date().toLocaleDateString('id-ID');
        const timeNow = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
        const record = { tanggal: today, jam: timeNow, status };
  
        // store single latest
        localStorage.setItem('kehadiranPengajar', JSON.stringify(record));
  
        // also store in per-jadwal history with key kehadiranPengajarPerJadwal when appropriate
        let per = JSON.parse(localStorage.getItem('kehadiranPengajarPerJadwal')||'[]');
        per.push(Object.assign({ jenis:'manual-panel' }, record));
        localStorage.setItem('kehadiranPengajarPerJadwal', JSON.stringify(per));
  
        absenPengajarInfo.textContent = `${status} (${today})`;
        showToast('Absensi pengajar tersimpan.');
      });
    }
  
    // show stored pengajar absen on load if any
    (function showStoredPengajar(){
      const d = JSON.parse(localStorage.getItem('kehadiranPengajar')||'null');
      if(d){
        absenPengajarInfo.textContent = `${d.status} (${d.tanggal})`;
      }
    })();
  
    // --- When teacher clicks "Simpan (Absen Pengajar)" inside a jadwal detail ---
    const btnAbsenPengajarList = document.querySelectorAll('.btn-absen-pengajar');
    btnAbsenPengajarList.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const jadwalID = btn.dataset.jadwal || 'unknown';
        const row = btn.closest('tr').previousElementSibling; // main row typically
        // jam: read from the main-row (if exists)
        let jam = '';
        const mainRow = btn.closest('tr').previousElementSibling;
        if(mainRow && mainRow.children.length>1){
          jam = mainRow.children[1].textContent || '';
        } else {
          jam = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
        }
        const today = new Date().toLocaleDateString('id-ID');
        const rec = { jadwalID, tanggal: today, jam, status: 'Hadir', by: 'pengajar' };
  
        // append to kehadiranPengajarPerJadwal
        let arr = JSON.parse(localStorage.getItem('kehadiranPengajarPerJadwal')||'[]');
        arr.push(rec);
        localStorage.setItem('kehadiranPengajarPerJadwal', JSON.stringify(arr));
  
        showToast('Kehadiran pengajar tersimpan untuk jadwal ini.');
      });
    });
  
    // --- Simpan Absensi Santri (global) ---
    if(simpanAbsenBtn){
      simpanAbsenBtn.addEventListener('click', ()=>{
        // open konfirmasi modal
        konfirmasiModal.style.display = 'block';
      });
    }
    if(lanjutkanSimpanButton){
      lanjutkanSimpanButton.addEventListener('click', ()=>{
        // gather absensi table data - basic simulation
        const rows = document.querySelectorAll('.absensi-harian-table tbody tr');
        const saved = [];
        rows.forEach((r,i)=>{
          const nama = r.children[1].textContent;
          const status = r.querySelector('.status-select').value;
          const catatan = r.querySelector('.input-catatan').value;
          saved.push({ no: i+1, nama, status, catatan, tanggal: new Date().toLocaleDateString('id-ID') });
        });
        // save to localStorage
        let all = JSON.parse(localStorage.getItem('absensiSantri')||'[]');
        all = all.concat(saved);
        localStorage.setItem('absensiSantri', JSON.stringify(all));
        konfirmasiModal.style.display = 'none';
        showToast('Absensi santri berhasil disimpan.');
      });
    }
    if(batalSimpanButton){
      batalSimpanButton.addEventListener('click', ()=>{
        konfirmasiModal.style.display = 'none';
        showToast('Penyimpanan dibatalkan.');
      });
    }
    if(closeKonfirmasiButton){
      closeKonfirmasiButton.addEventListener('click', ()=> konfirmasiModal.style.display = 'none');
    }
  
    // --- Lihat riwayat (button) ---
    if(btnViewRiwayat){
      btnViewRiwayat.addEventListener('click', ()=>{
        // switch to riwayat section
        document.querySelectorAll('.content-section').forEach(s=> s.classList.remove('active'));
        const rsec = document.getElementById('riwayat-kehadiran-content');
        if(rsec) rsec.classList.add('active');
        // update side nav active
        document.querySelectorAll('.nav-item').forEach(n=> n.classList.remove('active'));
        // highlight Absensi item (so the nav shows that riwayat comes from Absensi)
        const absNav = document.querySelector('[data-content-id="absensi-content"]');
        if(absNav) absNav.classList.add('active');
        // load riwayat
        loadRiwayat();
        mainTitle.textContent = 'Riwayat Kehadiran';
      });
    }
  
    // --- load riwayat to table ---
    function loadRiwayat(){
      const per = JSON.parse(localStorage.getItem('kehadiranPengajarPerJadwal')||'[]');
      const absensiSantri = JSON.parse(localStorage.getItem('absensiSantri')||'[]');
      riwayatBody.innerHTML = '';
  
      // show pengajar records first
      per.forEach((r, idx)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx+1}</td><td>${r.tanggal}</td><td>${r.jam||'-'}</td><td>${r.status||'-'}</td><td>${r.keterangan||'-'}</td>`;
        riwayatBody.appendChild(tr);
      });
  
      // then show a few santri absensi if any (optional)
      const startIdx = per.length;
      absensiSantri.forEach((r,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${startIdx + i +1}</td><td>${r.tanggal}</td><td>-</td><td>${r.status}</td><td>${r.nama}</td>`;
        riwayatBody.appendChild(tr);
      });
  
      if(per.length===0 && absensiSantri.length===0){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" style="text-align:center;color:#666">Belum ada riwayat.</td>`;
        riwayatBody.appendChild(tr);
      }
    }
  
    // auto-load riwayat when opening riwayat section through nav (if clicked)
    document.querySelectorAll('[data-content-id="riwayat-kehadiran-content"]').forEach(n=>{
      n.addEventListener('click', ()=> loadRiwayat());
    });
  
    // --- ADDED: Kembali button handler (Riwayat -> Absensi) ---
    // ADDED
    const btnKembali = document.getElementById('btnKembali');
    if (btnKembali) {
      btnKembali.addEventListener('click', () => {
        // hide all sections
        sections.forEach(s => s.classList.remove('active'));
        // show absensi section
        const absensi = document.getElementById('absensi-content');
        if (absensi) absensi.classList.add('active');
        // update header/title
        mainTitle.textContent = 'Absensi';
        // update nav active to Absensi
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const absNav = document.querySelector('[data-content-id="absensi-content"]');
        if (absNav) absNav.classList.add('active');
      });
    }
  
    // done
  }); // DOMContentLoaded end
  