var stockApp = new Vue({
    el: '#stockApp',
    data: {
        // Data references from shared app instance
        upbjjList: app.$data.upbjjList,
        kategoriList: app.$data.kategoriList,
        stok: app.$data.stok,
        
        // UI State
        filters: {
            upbjj: '',
            kategori: '',
            warningOnly: false
        },
        sortBy: 'judul_asc',
        showAddModal: false,
        showEditModal: false,
        formData: {
            kode: '',
            judul: '',
            kategori: '',
            upbjj: '',
            lokasiRak: '',
            qty: 0,
            safety: 0,
            harga: 0,
            catatanHTML: ''
        }
    },
    computed: {
        filteredStok: function() {
            var result = this.stok.filter(function(item) {
                var matchUpbjj = !this.filters.upbjj || item.upbjj === this.filters.upbjj;
                var matchKategori = !this.filters.kategori || item.kategori === this.filters.kategori;
                var matchWarning = !this.filters.warningOnly || item.qty < item.safety;
                
                return matchUpbjj && matchKategori && matchWarning;
            }.bind(this));

            // Sorting logic
            result.sort(function(a, b) {
                switch(this.sortBy) {
                    case 'judul_asc': return a.judul.localeCompare(b.judul);
                    case 'judul_desc': return b.judul.localeCompare(a.judul);
                    case 'qty_asc': return a.qty - b.qty;
                    case 'qty_desc': return b.qty - a.qty;
                    case 'harga_asc': return a.harga - b.harga;
                    case 'harga_desc': return b.harga - a.harga;
                    default: return 0;
                }
            }.bind(this));

            return result;
        }
    },
    watch: {
        'filters.upbjj': function(newVal) {
            if (!newVal) {
                this.filters.kategori = '';
            }
        },
        'stok': {
            handler: function(newVal) {
                console.log('Data stok berubah, total item: ' + newVal.length);
            },
            deep: true
        }
    },
    mounted: function() {
        // Initialize global UI components from script.js
        if (typeof initSidebar === 'function') initSidebar();
        if (typeof initDropdownNav === 'function') initDropdownNav();
        
        // Setup global auth/greeting from script.js
        if (typeof Auth !== 'undefined') {
            const user = Auth.requireAuth();
            if (user) {
                document.querySelectorAll('.js-user-name').forEach(e => e.textContent = user.nama);
                document.querySelectorAll('.js-user-role').forEach(e => e.textContent = user.role);
                document.querySelectorAll('.js-user-avatar').forEach(e => e.textContent = getInitials(user.nama));
                const g = getGreeting();
                document.querySelectorAll('.js-greeting').forEach(e => {
                    e.textContent = g.icon + ' ' + g.text + ', ' + user.nama.split(' ')[0] + '!';
                });
                document.querySelectorAll('.js-logout').forEach(btn => {
                    btn.addEventListener('click', Auth.logout.bind(Auth));
                });
            }
        }

        // Add Escape key listener
        document.addEventListener('keydown', this.handleKeydown);
    },
    beforeDestroy: function() {
        // Clean up listener to prevent duplicates
        document.removeEventListener('keydown', this.handleKeydown);
    },
    methods: {
        handleKeydown: function(e) {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        },
        getStatusText: function(item) {
            if (item.qty === 0) return 'Kosong';
            if (item.qty < item.safety) return 'Menipis';
            return 'Aman';
        },
        getStatusBadgeClass: function(item) {
            if (item.qty === 0) return 'badge badge-danger';
            if (item.qty < item.safety) return 'badge badge-orange';
            return 'badge badge-success';
        },
        resetFilters: function() {
            this.filters.upbjj = '';
            this.filters.kategori = '';
            this.filters.warningOnly = false;
            this.sortBy = 'judul_asc';
        },
        openAddModal: function() {
            this.resetFormData();
            this.showAddModal = true;
        },
        editItem: function(item) {
            this.formData = Object.assign({}, item);
            this.showEditModal = true;
        },
        closeModals: function() {
            this.showAddModal = false;
            this.showEditModal = false;
            this.resetFormData();
        },
        resetFormData: function() {
            this.formData = {
                kode: '',
                judul: '',
                kategori: '',
                upbjj: '',
                lokasiRak: '',
                qty: 0,
                safety: 0,
                harga: 0,
                catatanHTML: ''
            };
        },
        saveBahanAjar: function() {
            if (!this.formData.kode || !this.formData.judul || !this.formData.upbjj) {
                alert('Mohon lengkapi data yang wajib diisi.');
                return;
            }

            if (this.showEditModal) {
                var index = this.stok.findIndex(function(i) { return i.kode === this.formData.kode; }.bind(this));
                if (index !== -1) {
                    Vue.set(this.stok, index, Object.assign({}, this.formData));
                }
            } else {
                var exists = this.stok.some(function(i) { return i.kode === this.formData.kode; }.bind(this));
                if (exists) {
                    alert('Kode Mata Kuliah sudah ada!');
                    return;
                }
                this.stok.push(Object.assign({}, this.formData));
            }
            this.closeModals();
        }
    }
});
