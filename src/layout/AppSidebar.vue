<script setup>
import AuthService from '@/service/AuthService';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import AppMenu from './AppMenu.vue';

const toast = useToast();

// Branch
const currentBranchName = ref('');
const selectedBranches = ref([]);
const showBranchDialog = ref(false);
const branches = ref([]);
const loadingBranches = ref(false);

// Temporary selection (ใช้ระหว่างที่ dialog เปิดอยู่)
const tempSelectedBranches = ref([]);

onMounted(() => {
    // โหลดข้อมูลสาขาที่เลือกไว้
    selectedBranches.value = AuthService.getSelectedBranches() || [];
    currentBranchName.value = AuthService.getBranchName() || '';
});

// คำนวณชื่อสาขาที่แสดง
const displayBranchName = computed(() => {
    if (selectedBranches.value.length === 0) {
        return 'เลือกสาขา';
    } else if (selectedBranches.value.length === 1) {
        return selectedBranches.value[0].name;
    } else {
        return `${selectedBranches.value.length} สาขา`;
    }
});

// เปิด dialog เลือกสาขา
async function openChangeBranchDialog() {
    loadingBranches.value = true;
    showBranchDialog.value = true;

    // คัดลอก selectedBranches ไปยัง tempSelectedBranches
    tempSelectedBranches.value = [...selectedBranches.value];

    try {
        const provider = AuthService.getProviderName();
        const database = AuthService.getDatabaseName();
        const result = await AuthService.getBranchList(provider, database);

        if (result.success && result.branches) {
            branches.value = result.branches;
        } else {
            branches.value = [];
            toast.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'ไม่พบข้อมูลสาขา',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error loading branches:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสาขา',
            life: 3000
        });
    } finally {
        loadingBranches.value = false;
    }
}

// ตรวจสอบว่าสาขานี้ถูกเลือกอยู่หรือไม่
function isBranchSelected(branch) {
    return tempSelectedBranches.value.some((b) => b.code === branch.code);
}

// Toggle เลือก/ไม่เลือกสาขา
function toggleBranch(branch) {
    const index = tempSelectedBranches.value.findIndex((b) => b.code === branch.code);
    if (index !== -1) {
        tempSelectedBranches.value.splice(index, 1);
    } else {
        tempSelectedBranches.value.push({ code: branch.code, name: branch.name });
    }
}

// เลือกทั้งหมด
function selectAll() {
    tempSelectedBranches.value = branches.value.map((b) => ({ code: b.code, name: b.name }));
}

// ไม่เลือกทั้งหมด
function deselectAll() {
    tempSelectedBranches.value = [];
}

// บันทึกการเลือกสาขา
function saveBranchSelection() {
    if (tempSelectedBranches.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'กรุณาเลือกอย่างน้อย 1 สาขา',
            life: 3000
        });
        return;
    }

    AuthService.saveBranches(tempSelectedBranches.value);
    selectedBranches.value = [...tempSelectedBranches.value];
    currentBranchName.value = AuthService.getBranchName();
    showBranchDialog.value = false;

    const branchNames = tempSelectedBranches.value.map((b) => b.name).join(', ');
    toast.add({
        severity: 'success',
        summary: 'สำเร็จ',
        detail: `เลือกสาขา: ${branchNames}`,
        life: 2000
    });

    // Reload page เพื่อให้ทุกหน้าโหลดข้อมูลใหม่
    window.location.reload();
}
</script>

<template>
    <div class="layout-sidebar">
        <!-- Branch Selector -->
        <div class="branch-selector" @click="openChangeBranchDialog">
            <div class="branch-icon">
                <i class="pi pi-building"></i>
            </div>
            <div class="branch-info">
                <span class="branch-label">สาขา</span>
                <span class="branch-name">{{ displayBranchName }}</span>
            </div>
            <i class="pi pi-chevron-down branch-arrow"></i>
        </div>

        <app-menu></app-menu>
    </div>

    <!-- Branch Selection Dialog -->
    <Dialog v-model:visible="showBranchDialog" :modal="true" header="เลือกสาขา" :style="{ width: '500px' }">
        <div class="flex flex-col gap-3">
            <p class="text-muted-color mb-2">กรุณาเลือกสาขาที่ต้องการใช้งาน (เลือกได้หลายสาขา):</p>

            <!-- Loading -->
            <div v-if="loadingBranches" class="flex items-center justify-center py-8">
                <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
            </div>

            <!-- Branch List -->
            <div v-else>
                <!-- Select All / Deselect All -->
                <div v-if="branches.length > 0" class="flex items-center justify-between mb-3 pb-2 border-b border-surface-200 dark:border-surface-700">
                    <span class="text-sm text-muted-color">เลือกแล้ว {{ tempSelectedBranches.length }} / {{ branches.length }} สาขา</span>
                    <div class="flex gap-2">
                        <Button label="เลือกทั้งหมด" size="small" text @click="selectAll" />
                        <Button label="ไม่เลือก" size="small" text severity="secondary" @click="deselectAll" />
                    </div>
                </div>

                <div class="flex flex-col gap-2 max-h-80 overflow-y-auto">
                    <div v-if="branches.length === 0" class="text-center py-8 text-muted-color">
                        <i class="pi pi-inbox text-4xl mb-2"></i>
                        <p>ไม่พบข้อมูลสาขา</p>
                    </div>
                    <div
                        v-for="branch in branches"
                        :key="branch.code"
                        @click="toggleBranch(branch)"
                        class="p-4 border border-surface-200 dark:border-surface-700 rounded-lg cursor-pointer hover:bg-primary/10 hover:border-primary transition-all duration-200"
                        :class="{ 'bg-primary/10 border-primary': isBranchSelected(branch) }"
                    >
                        <div class="flex items-center gap-3">
                            <Checkbox :modelValue="isBranchSelected(branch)" :binary="true" @click.stop="toggleBranch(branch)" />
                            <div class="flex-1">
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ branch.name }}</div>
                                <div class="text-sm text-muted-color">รหัส: {{ branch.code }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="ยกเลิก" severity="secondary" @click="showBranchDialog = false" />
            <Button label="บันทึก" icon="pi pi-check" @click="saveBranchSelection" :disabled="tempSelectedBranches.length === 0" />
        </template>
    </Dialog>
</template>

<style lang="scss" scoped>
.branch-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.8rem;
    margin: 0rem;
    background: var(--p-surface-100);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--p-surface-200);
    }

    .branch-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--p-primary-color);
        color: var(--p-primary-contrast-color);
        border-radius: 10px;
        font-size: 1.1rem;
    }

    .branch-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;

        .branch-label {
            font-size: 0.75rem;
            color: var(--p-text-muted-color);
        }

        .branch-name {
            font-weight: 600;
            color: var(--p-text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .branch-arrow {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
    }
}

:deep(.dark) .branch-selector {
    background: var(--p-surface-800);

    &:hover {
        background: var(--p-surface-700);
    }
}
</style>
