<script setup>
import ReceiveDocService from '@/service/ReceiveDocService';
import ReceiveDocTable from '@/components/ReceiveDocTable.vue';
import ReceiveDetailDialog from '@/components/ReceiveDetailDialog.vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const confirmDialog = useConfirm();
const receiveDocs = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const fromDate = ref(firstDay);
const toDate = ref(lastDay);
const currentPage = ref(1);
const pageSize = ref(20);
const totalRecords = ref(0);
const totalPages = ref(0);

// Detail Dialog
const detailDialog = ref(false);
const detailLoading = ref(false);
const selectedDoc = ref(null);
const soDetails = ref([]);
const receiveDetails = ref([]);

onMounted(async () => {
    await loadReceiveDocs();
});

function formatDateForAPI(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadReceiveDocs() {
    loading.value = true;
    try {
        const result = await ReceiveDocService.getReceiveDocListByStatus(searchQuery.value, formatDateForAPI(fromDate.value), formatDateForAPI(toDate.value), 1, currentPage.value, pageSize.value);

        if (result.success) {
            receiveDocs.value = result.data;
            totalRecords.value = result.total;
            totalPages.value = result.totalPages;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Failed to load receive documents',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while loading receive documents',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function handleSearch() {
    currentPage.value = 1;
    await loadReceiveDocs();
}

function onPageChange(event) {
    currentPage.value = event.page;
    pageSize.value = event.rows;
    loadReceiveDocs();
}

async function confirmCloseJob(docData) {
    confirmDialog.require({
        message: `ต้องการปิดงานใบรับสินค้า ${docData.doc_no} หรือไม่?`,
        header: 'ยืนยันการปิดงาน',
        icon: 'pi pi-check-circle',
        acceptLabel: 'ยืนยัน',
        rejectLabel: 'ยกเลิก',
        acceptClass: 'p-button-success',
        rejectClass: 'p-button-secondary p-button-outlined',
        accept: async () => {
            await handleCloseJob(docData);
        }
    });
}

async function handleCloseJob(docData) {
    loading.value = true;
    try {
        const result = await ReceiveDocService.sendCloseJob(docData.doc_no);

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'ปิดงานสำเร็จ',
                life: 3000
            });
            await loadReceiveDocs();
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Failed to close job',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while closing job',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

async function viewDetail(docData) {
    selectedDoc.value = docData;
    detailDialog.value = true;
    detailLoading.value = true;

    try {
        const result = await ReceiveDocService.getReceiveDocDetail(docData.doc_no);

        if (result.success) {
            soDetails.value = result.details_so || [];
            receiveDetails.value = result.details_receive || [];
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Failed to load detail',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'An error occurred while loading detail',
            life: 3000
        });
    } finally {
        detailLoading.value = false;
    }
}

function closeDetailDialog() {
    detailDialog.value = false;
    selectedDoc.value = null;
    soDetails.value = [];
    receiveDetails.value = [];
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="card">
            <div class="font-semibold text-xl mb-2">ปิดงานใบรับ</div>
            <p class="text-muted-color m-0 mb-6">จัดการปิดงานใบรับสินค้าที่ได้รับอนุมัติแล้ว</p>

            <!-- Mobile Filters -->
            <div class="lg:hidden mb-4">
                <div class="flex flex-col gap-3">
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="searchQuery" placeholder="ค้นหาเลขที่เอกสาร, ลูกค้า..." fluid @keyup.enter="handleSearch" />
                    </IconField>
                    <div class="grid grid-cols-2 gap-2">
                        <DatePicker v-model="fromDate" dateFormat="dd-mm-yy" placeholder="จากวันที่" :showIcon="true" fluid />
                        <DatePicker v-model="toDate" dateFormat="dd-mm-yy" placeholder="ถึงวันที่" :showIcon="true" fluid />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <Button label="ค้นหา" icon="pi pi-search" @click="handleSearch" :loading="loading" fluid />
                        <Button label="รีเฟรช" icon="pi pi-refresh" severity="secondary" @click="loadReceiveDocs" :loading="loading" fluid />
                    </div>
                    <Button label="สร้างใบรับ" icon="pi pi-plus" @click="openCreateDialog" fluid severity="success" />
                </div>
            </div>

            <!-- Desktop Toolbar -->
            <div class="mb-6 hidden lg:block">
                <Toolbar>
                    <template #start>
                        <div class="flex flex-wrap items-center gap-2">
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="searchQuery" placeholder="ค้นหาเลขที่เอกสาร, ลูกค้า..." style="width: 18rem" @keyup.enter="handleSearch" />
                            </IconField>
                            <DatePicker v-model="fromDate" dateFormat="dd-mm-yy" placeholder="จากวันที่" :showIcon="true" style="width: 11rem" />
                            <DatePicker v-model="toDate" dateFormat="dd-mm-yy" placeholder="ถึงวันที่" :showIcon="true" style="width: 11rem" />
                            <Button label="ค้นหา" icon="pi pi-search" @click="handleSearch" :loading="loading" />
                        </div>
                    </template>

                    <template #end>
                        <div class="flex gap-2">
                            <Button icon="pi pi-refresh" severity="secondary" text rounded v-tooltip.top="'รีเฟรช'" @click="loadReceiveDocs" :loading="loading" />
                        </div>
                    </template>
                </Toolbar>
            </div>

            <ReceiveDocTable :data="receiveDocs" :loading="loading" :totalRecords="totalRecords" :currentPage="currentPage" :pageSize="pageSize" mode="close" @page-change="onPageChange" @view-detail="viewDetail" @close-job="confirmCloseJob" />
        </div>

        <!-- Dialog รายละเอียดการรับ -->
        <ReceiveDetailDialog v-model:visible="detailDialog" :loading="detailLoading" :document="selectedDoc" :soDetails="soDetails" :receiveDetails="receiveDetails" @close="closeDetailDialog" />
    </div>
</template>

<style scoped lang="scss"></style>
