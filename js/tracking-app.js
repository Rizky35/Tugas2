var trackingApp = new Vue({
    el: '#trackingApp',
    data: {
        // Data references from shared app instance
        pengirimanList: app.$data.pengirimanList,
        paket: app.$data.paket,
        tracking: app.$data.tracking,
        
        // UI State
        successMessage: '',
        showValidationModal: false,
        validationMessage: '',

        // Form state
        newDO: {
            nomor: '',
            nim: '',
            nama: '',
            ekspedisi: '',
            paket: '',
            tanggalKirim: new Date().toISOString().substr(0, 10),
            total: 0
        },
        selectedPaketCode: '',
        searchDO: '',
        trackedDO: null
    },
    computed: {
        selectedPaket: function() {
            var code = this.selectedPaketCode;
            return this.paket.find(function(p) { return p.kode === code; });
        }
    },
    watch: {
        selectedPaket: function(newVal) {
            if (newVal) {
                this.newDO.paket = newVal.kode;
                this.newDO.total = newVal.harga;
            } else {
                this.newDO.paket = '';
                this.newDO.total = 0;
            }
        },
        searchDO: function(newVal) {
            if (newVal && this.tracking[newVal]) {
                this.trackedDO = this.tracking[newVal];
            } else {
                this.trackedDO = null;
            }
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
        
        this.generateDONumber();
        
        // Add Escape key listener for modal
        document.addEventListener('keydown', this.handleKeydown);
    },
    beforeDestroy: function() {
        // Clean up listener
        document.removeEventListener('keydown', this.handleKeydown);
    },
    methods: {
        handleKeydown: function(e) {
            if (e.key === 'Escape') {
                this.closeValidationModal();
            }
        },
        closeValidationModal: function() {
            this.showValidationModal = false;
            this.validationMessage = '';
        },
        generateDONumber: function() {
            var year = new Date().getFullYear();
            var keys = Object.keys(this.tracking);
            var maxSeq = 0;
            
            keys.forEach(function(key) {
                if (key.startsWith('DO' + year)) {
                    var seqPart = key.split('-')[1];
                    var seq = parseInt(seqPart);
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                }
            });
            
            var nextSeq = (maxSeq + 1).toString().padStart(4, '0');
            this.newDO.nomor = 'DO' + year + '-' + nextSeq;
        },
        addDO: function() {
            if (!this.newDO.nim || !this.newDO.nama || !this.newDO.ekspedisi || !this.selectedPaketCode) {
                this.validationMessage = 'Mohon lengkapi semua data pengiriman.';
                this.showValidationModal = true;
                return;
            }

            var doNum = this.newDO.nomor;
            var entry = {
                nim: this.newDO.nim,
                nama: this.newDO.nama,
                status: 'Menunggu Pengemasan',
                ekspedisi: this.newDO.ekspedisi,
                tanggalKirim: this.newDO.tanggalKirim,
                paket: this.newDO.paket,
                total: this.newDO.total,
                perjalanan: [
                    { 
                        waktu: new Date().toLocaleString('sv-SE').replace('T', ' '), 
                        keterangan: 'Order dibuat: Menunggu pengemasan di gudang pusat' 
                    }
                ]
            };

            Vue.set(this.tracking, doNum, entry);
            this.searchDO = doNum;
            
            // Success Notification Logic
            this.successMessage = 'Data Delivery Order ' + doNum + ' berhasil disimpan!';
            setTimeout(function() {
                this.successMessage = '';
            }.bind(this), 4000);

            this.resetForm();
        },
        resetForm: function() {
            this.newDO = {
                nomor: '',
                nim: '',
                nama: '',
                ekspedisi: '',
                paket: '',
                tanggalKirim: new Date().toISOString().substr(0, 10),
                total: 0
            };
            this.selectedPaketCode = '';
            this.generateDONumber();
        }
    }
});
