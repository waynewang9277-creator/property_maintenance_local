// API服务层 - 对接物业维保服务器
const API = {
    // 服务器地址
    BASE_URL: 'http://47.82.88.236:3000',
    
    // API基础路径
    getPlans(category, yearMonth) {
        return `${this.BASE_URL}/api/plans/${category}/${yearMonth}`;
    },
    postPlans(category, yearMonth) {
        return `${this.BASE_URL}/api/plans/${category}/${yearMonth}`;
    },
    publishPlans(category, yearMonth) {
        return `${this.BASE_URL}/api/plans/${category}/${yearMonth}/publish`;
    },
    getPublishedPlans() {
        return `${this.BASE_URL}/api/plans/published`;
    },
    postReports() {
        return `${this.BASE_URL}/api/reports`;
    },
    getReports() {
        return `${this.BASE_URL}/api/reports`;
    },
    getTime() {
        return `${this.BASE_URL}/api/time`;
    },
    getHealth() {
        return `${this.BASE_URL}/api/health`;
    },
    
    // 存储键名
    SYNC_KEY: 'plan_sync_version',
    LAST_SYNC_KEY: 'plan_last_sync',
    
    // 获取本地同步版本
    getSyncVersion() {
        return localStorage.getItem(this.SYNC_KEY) || '0';
    },
    
    // 设置同步版本
    setSyncVersion(version) {
        localStorage.setItem(this.SYNC_KEY, version);
    },
    
    // 获取最后同步时间
    getLastSyncTime() {
        return localStorage.getItem(this.LAST_SYNC_KEY) || '';
    },
    
    // 设置最后同步时间
    setLastSyncTime(time) {
        localStorage.setItem(this.LAST_SYNC_KEY, time);
    }
};

// API调用封装
const ApiClient = {
    // 封装fetch，处理Android WebView的file://限制
    async fetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            // Android WebView不支持fetch(file://)，使用XMLHttpRequest
            if (typeof XMLHttpRequest !== 'undefined') {
                const xhr = new XMLHttpRequest();
                xhr.open(options.method || 'GET', url, true);
                
                // 设置请求头
                if (options.headers) {
                    Object.keys(options.headers).forEach(key => {
                        xhr.setRequestHeader(key, options.headers[key]);
                    });
                }
                
                // 设置超时
                xhr.timeout = 30000;
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                };
                
                xhr.onerror = function() {
                    reject(new Error('Network error'));
                };
                
                xhr.ontimeout = function() {
                    reject(new Error('Request timeout'));
                };
                
                if (options.body) {
                    xhr.send(options.body);
                } else {
                    xhr.send();
                }
            } else {
                // 降级到fetch
                fetch(url, options)
                    .then(res => {
                        if (res.ok) return res.json();
                        throw new Error(`HTTP ${res.status}`);
                    })
                    .then(resolve)
                    .catch(reject);
            }
        });
    },
    
    // GET请求
    async get(url) {
        return this.fetch(url, { method: 'GET' });
    },
    
    // POST请求
    async post(url, data) {
        const headers = { 'Content-Type': 'application/json' };
        return this.fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
    },
    
    // 上传文件（multipart/form-data）
    async upload(url, formData) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (e) {
                        resolve(xhr.responseText);
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.timeout = 60000; // 上传超时60秒
            
            xhr.send(formData);
        });
    },
    
    // 健康检查
    async checkHealth() {
        try {
            const res = await this.get(API.getHealth());
            return res.success === true;
        } catch (e) {
            return false;
        }
    },
    
    // 获取服务器时间
    async getServerTime() {
        try {
            const res = await this.get(API.getTime());
            if (res.success) {
                return new Date(res.serverTime);
            }
        } catch (e) {}
        return null;
    },
    
    // 获取计划数据
    async getPlan(category, yearMonth) {
        try {
            const res = await this.get(API.getPlans(category, yearMonth));
            if (res.success && res.data) {
                return res.data;
            }
        } catch (e) {
            console.error('获取计划失败:', e);
        }
        return null;
    },
    
    // 获取已下发的计划
    async getPublishedPlans() {
        try {
            const res = await this.get(API.getPublishedPlans());
            if (res.success) {
                return res.data || [];
            }
        } catch (e) {
            console.error('获取已下发计划失败:', e);
        }
        return [];
    },
    
    // 提交报告
    async submitReport(reportData) {
        try {
            const formData = new FormData();
            formData.append('category', reportData.category);
            formData.append('content', reportData.content || '');
            formData.append('executor', reportData.executor || '');
            if (reportData.plan_id) {
                formData.append('plan_id', reportData.plan_id);
            }
            
            // 添加照片
            if (reportData.photos && reportData.photos.length > 0) {
                reportData.photos.forEach((photo, index) => {
                    // photo 可以是 base64 或 File 对象
                    if (typeof photo === 'string' && photo.startsWith('data:')) {
                        // base64 转 Blob
                        const blob = dataURLtoBlob(photo);
                        formData.append('photos', blob, `photo_${index}.jpg`);
                    } else {
                        formData.append('photos', photo);
                    }
                });
            }
            
            const res = await this.upload(API.postReports(), formData);
            return res;
        } catch (e) {
            console.error('提交报告失败:', e);
            throw e;
        }
    }
};

// base64转Blob
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// 导出给全局使用
window.API = API;
window.ApiClient = ApiClient;
