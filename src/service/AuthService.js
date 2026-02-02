/**
 * Authentication Service
 * จัดการการ login และ authentication
 */
export default class AuthService {
    /**
     * Login ผ่าน API
     * @param {Object} credentials - ข้อมูล login
     * @param {string} credentials.provider_name - ชื่อ provider
     * @param {string} credentials.database_name - ชื่อ database
     * @param {string} credentials.user_code - รหัสผู้ใช้
     * @param {string} credentials.password - รหัสผ่าน
     * @returns {Promise<Object>} ผลลัพธ์จาก API
     */
    static async login(credentials) {
        const { provider_name, database_name, user_code, password } = credentials;

        try {
            // สร้าง URL parameters
            const params = new URLSearchParams({
                provider_name,
                database_name,
                user_code,
                password
            });

            const baseUrl = import.meta.env.VITE_SERVICE_API_URL;
            const url = `${baseUrl}authentication?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // ตรวจสอบว่า login สำเร็จหรือไม่
            if (result.success && result.data && result.data.length > 0) {
                // Login สำเร็จ
                return {
                    success: true,
                    user: result.data[0]
                };
            } else {
                // Login ไม่สำเร็จ
                return {
                    success: false,
                    message: 'Invalid username or password'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'An error occurred during login'
            };
        }
    }

    /**
     * บันทึกข้อมูลผู้ใช้ลง localStorage
     */
    static saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * บันทึก provider และ database ลง localStorage
     */
    static saveLoginContext(provider_name, database_name) {
        localStorage.setItem('provider_name', provider_name);
        localStorage.setItem('database_name', database_name);
    }

    /**
     * ดึง provider_name จาก localStorage
     */
    static getProviderName() {
        return localStorage.getItem('provider_name');
    }

    /**
     * ดึง database_name จาก localStorage
     */
    static getDatabaseName() {
        return localStorage.getItem('database_name');
    }

    /**
     * ดึงข้อมูลผู้ใช้จาก localStorage
     */
    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    /**
     * ดึงสิทธิ์ผู้ใช้จาก API หลัง login สำเร็จ
     * @param {string} user_code - รหัสผู้ใช้
     * @param {string} provider_name - ชื่อ provider
     * @param {string} database_name - ชื่อ database
     * @returns {Promise<Object>} ผลลัพธ์สิทธิ์
     */
    static async fetchUserPermission(user_code, provider_name, database_name) {
        try {
            const baseUrl = import.meta.env.VITE_SERVICE_API_URL;

            const params = new URLSearchParams({
                provider: provider_name,
                dbname: database_name,
                usercode: user_code
            });

            const url = `${baseUrl}getUserPermission?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
                return {
                    success: true,
                    permissions: result.data[0]
                };
            } else {
                return {
                    success: false,
                    message: 'No permissions found'
                };
            }
        } catch (error) {
            console.error('Fetch permission error:', error);
            return {
                success: false,
                message: error.message || 'An error occurred while fetching permissions'
            };
        }
    }

    /**
     * บันทึกสิทธิ์ผู้ใช้ลง localStorage
     */
    static savePermissions(permissions) {
        localStorage.setItem('userPermissions', JSON.stringify(permissions));
    }

    /**
     * ดึงสิทธิ์ผู้ใช้จาก localStorage
     */
    static getPermissions() {
        const permissions = localStorage.getItem('userPermissions');
        return permissions ? JSON.parse(permissions) : null;
    }

    /**
     * ตรวจสอบว่าผู้ใช้มีสิทธิ์เข้าหน้าหรือไม่
     * @param {string} screen - ชื่อหน้า (receive_screen, admin_screen, history_screen)
     * @returns {boolean}
     */
    static hasPermission(screen) {
        const permissions = this.getPermissions();
        if (!permissions) return false;
        return permissions[screen] === '1';
    }

    /**
     * ตรวจสอบว่าเป็น SUPERADMIN หรือไม่
     * @returns {boolean}
     */
    static isSuperAdmin() {
        const user = this.getUser();
        return user && user.user_code && user.user_code.toUpperCase() === 'SUPERADMIN';
    }

    /**
     * ลบข้อมูลผู้ใช้ออกจาก localStorage (logout)
     */
    static logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('userPermissions');
        localStorage.removeItem('provider_name');
        localStorage.removeItem('database_name');
        localStorage.removeItem('branch_code');
        localStorage.removeItem('branch_name');
    }

    /**
     * ตรวจสอบว่ามีผู้ใช้ login อยู่หรือไม่
     */
    static isAuthenticated() {
        return this.getUser() !== null;
    }

    /**
     * ดึงรายการสาขาจาก API
     * @param {string} provider_name - ชื่อ provider
     * @param {string} database_name - ชื่อ database
     * @returns {Promise<Object>} ผลลัพธ์รายการสาขา
     */
    static async getBranchList(provider_name, database_name) {
        try {
            const baseUrl = import.meta.env.VITE_SERVICE_API_URL;

            const params = new URLSearchParams({
                provider: provider_name,
                dbname: database_name
            });

            const url = `${baseUrl}getBranchList?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                return {
                    success: true,
                    branches: result.data
                };
            } else {
                return {
                    success: false,
                    message: 'No branches found',
                    branches: []
                };
            }
        } catch (error) {
            console.error('Fetch branch list error:', error);
            return {
                success: false,
                message: error.message || 'An error occurred while fetching branches',
                branches: []
            };
        }
    }

    /**
     * บันทึกข้อมูลสาขาลง localStorage (รองรับหลายสาขา)
     * @param {Array} branches - array ของสาขา [{code, name}, ...]
     */
    static saveBranches(branches) {
        localStorage.setItem('selected_branches', JSON.stringify(branches));
        // เก็บ branch_code เป็น comma-separated สำหรับ backward compatibility
        const codes = branches.map((b) => b.code).join(',');
        const names = branches.map((b) => b.name).join(', ');
        localStorage.setItem('branch_code', codes);
        localStorage.setItem('branch_name', names);
    }

    /**
     * บันทึกข้อมูลสาขาเดียวลง localStorage (backward compatibility)
     * @param {string} code - รหัสสาขา
     * @param {string} name - ชื่อสาขา
     */
    static saveBranch(code, name) {
        this.saveBranches([{ code, name }]);
    }

    /**
     * ดึงรายการสาขาที่เลือกจาก localStorage
     * @returns {Array} array ของสาขา [{code, name}, ...]
     */
    static getSelectedBranches() {
        const branches = localStorage.getItem('selected_branches');
        if (branches) {
            return JSON.parse(branches);
        }
        // Backward compatibility: ถ้าไม่มี selected_branches ให้ใช้ branch_code/branch_name
        const code = localStorage.getItem('branch_code');
        const name = localStorage.getItem('branch_name');
        if (code && name) {
            return [{ code, name }];
        }
        return [];
    }

    /**
     * ดึง branch_code จาก localStorage ในรูปแบบ 'Branch01','Branch02' สำหรับ SQL IN clause
     * @returns {string} branch codes ในรูปแบบ 'code1','code2',...
     */
    static getBranchCode() {
        const branches = this.getSelectedBranches();
        if (branches.length === 0) {
            return '';
        }
        // แปลงเป็นรูปแบบ 'Branch01','Branch02'
        return branches.map((b) => `'${b.code}'`).join(',');
    }

    /**
     * ดึง branch_name จาก localStorage
     */
    static getBranchName() {
        return localStorage.getItem('branch_name');
    }
}
