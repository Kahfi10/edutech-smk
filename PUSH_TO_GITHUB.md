## Cara Push ke GitHub — EduTech SMK

Semua 8 commit sudah siap di local. Tinggal jalankan salah satu cara berikut.

---

### CARA 1 — GitHub CLI (Recommended, paling mudah)

Buka PowerShell atau CMD di folder `edutech-smk`, lalu jalankan:

```powershell
# 1. Login GitHub CLI
gh auth login

# Ikuti instruksi:
#  - GitHub.com
#  - HTTPS
#  - Login with a web browser
#  - Copy kode yang muncul → buka https://github.com/login/device → paste kode

# 2. Buat repo dan push sekaligus
gh repo create edutech-smk --public --source=. --remote=origin --push
```

Selesai! Repo akan tersedia di: https://github.com/Kahfi10/edutech-smk

---

### CARA 2 — Personal Access Token (jika CLI tidak bisa browser)

1. Buka: https://github.com/settings/tokens/new
2. Isi: Note = `edutech-smk`, Expiration = `90 days`, centang scope `repo`
3. Klik **Generate token** → copy token (format: `ghp_xxxx...`)

Kemudian jalankan di PowerShell (folder `edutech-smk`):

```powershell
# Ganti YOUR_TOKEN dengan token yang kamu copy
gh auth login --with-token <<< "YOUR_TOKEN"
gh repo create edutech-smk --public --source=. --remote=origin --push
```

---

### CARA 3 — Git manual (tanpa gh CLI)

1. Buat repo kosong di https://github.com/new
   - Name: `edutech-smk`
   - Visibility: Public
   - **JANGAN** centang Initialize README

2. Jalankan di PowerShell (folder `edutech-smk`):

```powershell
git remote add origin https://github.com/Kahfi10/edutech-smk.git
git branch -M main
git push -u origin main
# Akan minta username dan password
# Username: Kahfi10
# Password: gunakan Personal Access Token (bukan password GitHub biasa)
```

---

### Verifikasi setelah push

Buka: **https://github.com/Kahfi10/edutech-smk**

Harus terlihat 8 commit dengan nama:
- feat(fase-0): project foundation...
- feat(fase-1): Guru Mapel screens...
- feat(fase-2): Siswa screens...
- feat(fase-3): Wali Kelas screens...
- feat(fase-4): Guru BK screens...
- feat(fase-5): Guru Piket screens...
- feat(fase-6): Admin Web Portal...
- feat(fase-7): FCM push notifications...
