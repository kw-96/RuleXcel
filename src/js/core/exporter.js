/**
 * 文件导出器
 * 支持Excel和CSV格式的数据导出
 */

import formatter from '../utils/formatter.js';
import logger from '../utils/logger.js';

class Exporter {
    constructor() {
        this.XLSX = window.XLSX;
        this.defaultExportOptions = {
            format: 'xlsx', // xlsx, csv
            sheetName: 'Sheet1',
            filename: null, // 自动生成
            includeHeaders: true,
            compression: false
        };
    }

    /**
     * 导出数据为Excel文件
     * @param {Array} data - 要导出的数据数组
     * @param {Object} options - 导出选项
     * @returns {Promise<void>}
     */
    async exportToExcel(data, options = {}) {
        try {
            const config = { ...this.defaultExportOptions, ...options };
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('没有可导出的数据');
            }

            logger.info('开始导出Excel文件', { 
                rows: data.length, 
                filename: config.filename 
            });
            
            logger.info('导出器配置检查', {
                config: config,
                dataType: Array.isArray(data) ? 'array' : typeof data,
                firstRowType: data.length > 0 ? typeof data[0] : 'undefined'
            });

            // 使用智能数据预处理，只对确定的日期列进行保护
            const processedData = this._intelligentPreprocessDataForExport(data);
            logger.info('智能数据预处理完成', { originalRows: data.length, finalRows: processedData.length });

            // 创建工作簿
            const wb = this.XLSX.utils.book_new();
            
            // 创建工作表，使用简化选项（调试模式）
            logger.info('准备创建工作表', {
                dataLength: processedData.length,
                firstRowSample: processedData[0],
                dataKeys: processedData.length > 0 ? Object.keys(processedData[0]) : [],
                dataValues: processedData.length > 0 ? Object.values(processedData[0]) : []
            });
            
            const ws = this.XLSX.utils.json_to_sheet(processedData);
            
            // 详细检查工作表内容
            const allKeys = Object.keys(ws);
            const cellKeys = allKeys.filter(key => key !== '!ref' && key !== '!margins');
            const sampleCells = {};
            ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].forEach(cell => {
                if (ws[cell]) {
                    sampleCells[cell] = ws[cell];
                }
            });
            
            logger.info('工作表创建完成', { 
                range: ws['!ref'],
                totalKeys: allKeys.length,
                cellCount: cellKeys.length,
                sampleCells: sampleCells,
                hasData: cellKeys.length > 0
            });

            // 智能设置工作表格式，只对日期列进行特殊处理
            this._intelligentSetWorksheetFormat(ws, processedData);

            // 添加工作表到工作簿
            this.XLSX.utils.book_append_sheet(wb, ws, config.sheetName);

            // 生成文件名
            const filename = config.filename || this._generateFilename('data', 'xlsx');

            // 改进的导出逻辑
            await this._downloadExcelFile(wb, filename);

            logger.info('Excel文件导出成功', { filename });
            return { success: true, filename };

        } catch (error) {
            logger.error('Excel导出失败', error);
            throw new Error(`Excel导出失败: ${error.message}`);
        }
    }

    /**
     * 导出数据为CSV文件
     * @param {Array} data - 要导出的数据数组
     * @param {Object} options - 导出选项
     * @returns {Promise<void>}
     */
    async exportToCSV(data, options = {}) {
        try {
            const config = { ...this.defaultExportOptions, ...options };
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error('没有可导出的数据');
            }

            logger.info('开始导出CSV文件', { 
                rows: data.length, 
                filename: config.filename 
            });

            // 转换为CSV格式
            const csvContent = this._convertToCSV(data, config);

            // 生成文件名
            const filename = config.filename || this._generateFilename('data', 'csv');

            // 使用新的下载方法，支持路径选择
            await this._downloadCSVFile(csvContent, filename);

            logger.info('CSV文件导出成功', { filename });
            return { success: true, filename };

        } catch (error) {
            logger.error('CSV导出失败', error);
            throw new Error(`CSV导出失败: ${error.message}`);
        }
    }

    /**
     * 批量导出多个数据集为多个工作表的Excel文件
     * @param {Array} datasets - 数据集数组 [{data: [], name: '', options: {}}]
     * @param {Object} options - 导出选项
     * @returns {Promise<void>}
     */
    async exportMultipleSheets(datasets, options = {}) {
        try {
            if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
                throw new Error('没有可导出的数据集');
            }

            logger.info('开始导出多工作表Excel文件', { 
                sheets: datasets.length,
                filename: options.filename 
            });

            // 创建工作簿
            const wb = this.XLSX.utils.book_new();

            // 添加每个数据集为工作表
            datasets.forEach((dataset, index) => {
                const { data, name, options: sheetOptions = {} } = dataset;
                
                if (!data || !Array.isArray(data) || data.length === 0) {
                    logger.warn(`数据集 ${index + 1} 为空，跳过`);
                    return;
                }

                // 预处理数据，防止自动日期转换
                const processedData = this._preprocessDataForExport(data);

                const sheetName = name || `Sheet${index + 1}`;
                const ws = this.XLSX.utils.json_to_sheet(processedData, {
                    header: sheetOptions.includeHeaders !== false ? Object.keys(processedData[0]) : undefined,
                    cellDates: false,  // 防止自动日期转换
                    dateNF: '@',       // 将日期格式设为文本
                    raw: false         // 禁用原始值处理，强制文本处理
                });

                // 为工作表设置列格式为文本（防止Excel自动转换）
                this._setWorksheetTextFormat(ws, processedData);
                
                // 额外保护：为整个工作表设置默认格式
                if (!ws['!cols']) ws['!cols'] = [];
                const headers = Object.keys(processedData[0]);
                headers.forEach((header, index) => {
                    if (!ws['!cols'][index]) ws['!cols'][index] = {};
                    ws['!cols'][index].z = '@'; // 设置列格式为文本
                });

                this.XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });

            // 生成文件名
            const filename = options.filename || this._generateFilename('多表数据', 'xlsx');

            // 改进的导出逻辑
            await this._downloadExcelFile(wb, filename);

            logger.info('多工作表Excel文件导出成功', { filename });
            return { success: true, filename };

        } catch (error) {
            logger.error('多工作表导出失败', error);
            throw new Error(`多工作表导出失败: ${error.message}`);
        }
    }

    /**
     * 导出处理前后的对比数据
     * @param {Array} originalData - 原始数据
     * @param {Array} processedData - 处理后数据
     * @param {Object} options - 导出选项
     * @returns {Promise<void>}
     */
    async exportComparison(originalData, processedData, options = {}) {
        try {
            const datasets = [
                {
                    data: originalData,
                    name: '原始数据',
                    options: { includeHeaders: true }
                },
                {
                    data: processedData,
                    name: '处理结果',
                    options: { includeHeaders: true }
                }
            ];

            const filename = options.filename || this._generateFilename('数据对比', 'xlsx');
            
            return await this.exportMultipleSheets(datasets, { ...options, filename });
        } catch (error) {
            logger.error('对比数据导出失败', error);
            throw new Error(`对比数据导出失败: ${error.message}`);
        }
    }

    /**
     * 将数据转换为CSV格式
     * @param {Array} data - 数据数组
     * @param {Object} options - 转换选项
     * @returns {string} CSV字符串
     */
    _convertToCSV(data, options = {}) {
        if (!data || data.length === 0) return '';

        const separator = options.separator || ',';
        const lineBreak = options.lineBreak || '\n';
        const quote = '"';
        
        // 获取列名
        const headers = Object.keys(data[0]);
        
        // 创建CSV内容
        let csvContent = '';
        
        // 添加标题行
        if (options.includeHeaders !== false) {
            csvContent += headers.map(header => this._escapeCSVField(header, quote, separator)).join(separator) + lineBreak;
        }
        
        // 添加数据行
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return this._escapeCSVField(value, quote, separator);
            });
            csvContent += values.join(separator) + lineBreak;
        });
        
        return csvContent;
    }

    /**
     * 转义CSV字段
     * @param {any} field - 字段值
     * @param {string} quote - 引号字符
     * @param {string} separator - 分隔符
     * @returns {string} 转义后的字段
     */
    _escapeCSVField(field, quote, separator) {
        if (field === null || field === undefined) {
            return '';
        }
        
        let value = String(field);
        
        // 如果包含分隔符、引号或换行符，需要用引号包围
        if (value.includes(separator) || value.includes(quote) || value.includes('\n') || value.includes('\r')) {
            // 转义引号（双引号）
            value = value.replace(new RegExp(quote, 'g'), quote + quote);
            // 用引号包围
            value = quote + value + quote;
        }
        
        return value;
    }

    /**
     * 下载文件
     * @param {string} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型
     */
    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * 下载Excel文件 - 改进版本
     * @param {Object} workbook - XLSX工作簿对象
     * @param {string} filename - 文件名
     * @returns {Promise<void>}
     */
    async _downloadExcelFile(workbook, filename) {
        try {
            // 检查浏览器支持
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            const isFirefox = /Firefox/.test(navigator.userAgent);
            const isEdge = /Edge/.test(navigator.userAgent);
            
            // 优先使用现代文件系统访问API（让用户选择保存路径）
            if (window.showSaveFilePicker) {
                try {
                    logger.info('使用文件系统访问API，用户可选择保存路径');
                    
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'Excel文件 (*.xlsx)',
                            accept: {
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                            }
                        }],
                        excludeAcceptAllOption: false
                    });
                    
                    // 生成二进制数据并检查
                    const buffer = this.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    logger.info('工作簿写入检查', {
                        bufferSize: buffer.byteLength,
                        bufferType: buffer.constructor.name,
                        isEmpty: buffer.byteLength === 0,
                        firstBytes: Array.from(buffer.slice(0, 10))
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(buffer);
                    await writable.close();
                    
                    // 获取保存的文件路径信息
                    const savedFileName = fileHandle.name;
                    logger.info('文件保存成功', { filename: savedFileName, method: 'FileSystemAPI' });
                    return;
                    
                } catch (error) {
                    if (error.name === 'AbortError') {
                        logger.info('用户取消了文件保存操作');
                        throw new Error('用户取消了保存操作');
                    } else {
                        logger.warn('文件系统访问API失败，回退到传统方法', error);
                        // 继续执行传统下载方法
                    }
                }
            } else {
                logger.info('浏览器不支持文件系统访问API，使用传统下载方法');
            }
            
            // 传统下载方法（回退方案）
            logger.info('使用传统下载方法', { filename });
            
            // 生成二进制数据
            const buffer = this.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            // 添加到DOM并触发下载
            document.body.appendChild(link);
            
            // 确保文件名正确设置
            link.setAttribute('download', filename);
            
            // 触发点击事件
            if (link.click) {
                link.click();
            } else {
                // 兼容旧版浏览器
                const event = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                link.dispatchEvent(event);
            }
            
            // 清理
            document.body.removeChild(link);
            
            // 延迟清理URL以确保下载完成
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            logger.info('Excel文件下载启动', { filename, method: 'traditional' });
            
        } catch (error) {
            logger.error('Excel文件下载失败', error);
            throw error;
        }
    }

    /**
     * 下载CSV文件 - 支持路径选择
     * @param {string} content - CSV内容
     * @param {string} filename - 文件名
     * @returns {Promise<void>}
     */
    async _downloadCSVFile(content, filename) {
        try {
            // 优先使用现代文件系统访问API（让用户选择保存路径）
            if (window.showSaveFilePicker) {
                try {
                    logger.info('使用文件系统访问API保存CSV文件，用户可选择保存路径');
                    
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'CSV文件 (*.csv)',
                            accept: {
                                'text/csv': ['.csv']
                            }
                        }],
                        excludeAcceptAllOption: false
                    });
                    
                    const writable = await fileHandle.createWritable();
                    // 添加BOM以确保中文正确显示
                    const bomContent = '\ufeff' + content;
                    await writable.write(bomContent);
                    await writable.close();
                    
                    // 获取保存的文件路径信息
                    const savedFileName = fileHandle.name;
                    logger.info('CSV文件保存成功', { filename: savedFileName, method: 'FileSystemAPI' });
                    return;
                    
                } catch (error) {
                    if (error.name === 'AbortError') {
                        logger.info('用户取消了CSV文件保存操作');
                        throw new Error('用户取消了保存操作');
                    } else {
                        logger.warn('文件系统访问API失败，回退到传统方法', error);
                        // 继续执行传统下载方法
                    }
                }
            } else {
                logger.info('浏览器不支持文件系统访问API，使用传统CSV下载方法');
            }
            
            // 传统下载方法（回退方案）
            this._downloadFile(content, filename, 'text/csv;charset=utf-8;');
            
        } catch (error) {
            logger.error('CSV文件下载失败', error);
            throw error;
        }
    }





    /**
     * 生成文件名
     * @param {string} baseName - 基础名称
     * @param {string} extension - 文件扩展名
     * @returns {string} 生成的文件名
     */
    _generateFilename(baseName, extension) {
        const timestamp = formatter.formatDate(new Date(), 'YYYY-MM-DD_HH-mm-ss');
        return `${baseName}_${timestamp}.${extension}`;
    }

    /**
     * 导出日志文件
     * @param {Array} logs - 日志数组
     * @param {Object} options - 导出选项
     * @returns {Promise<void>}
     */
    async exportLogs(logs, options = {}) {
        try {
            if (!logs || logs.length === 0) {
                throw new Error('没有可导出的日志');
            }

            // 格式化日志数据
            const logData = logs.map(log => ({
                时间: formatter.formatDate(log.timestamp, 'YYYY-MM-DD HH:mm:ss'),
                级别: log.level,
                消息: log.message,
                数据: log.data ? JSON.stringify(log.data) : '',
                堆栈: log.stack || ''
            }));

            const filename = options.filename || this._generateFilename('系统日志', 'xlsx');
            
            return await this.exportToExcel(logData, { 
                ...options, 
                filename,
                sheetName: '系统日志' 
            });
        } catch (error) {
            logger.error('日志导出失败', error);
            throw new Error(`日志导出失败: ${error.message}`);
        }
    }

    /**
     * 获取支持的导出格式
     * @returns {Array} 支持的格式列表
     */
    getSupportedFormats() {
        return [
            { value: 'xlsx', label: 'Excel文件 (.xlsx)', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            { value: 'csv', label: 'CSV文件 (.csv)', mimeType: 'text/csv' }
        ];
    }

    /**
     * 检查是否支持指定格式
     * @param {string} format - 文件格式
     * @returns {boolean} 是否支持
     */
    isFormatSupported(format) {
        const supportedFormats = ['xlsx', 'xls', 'csv'];
        return supportedFormats.includes(format.toLowerCase());
    }

    /**
     * 智能预处理数据，只对确定的日期列进行保护
     * @param {Array} data - 数据数组
     * @returns {Array} 预处理后的数据数组
     */
    _intelligentPreprocessDataForExport(data) {
        if (!data || data.length === 0) return data;
        
        const headers = Object.keys(data[0]);
        const dateColumns = this._identifyDateColumns(headers);
        
        return data.map(row => {
            const processedRow = {};
            for (const key in row) {
                // 只对确定的日期列进行日期保护处理
                if (dateColumns.includes(key)) {
                    processedRow[key] = this._preprocessDateValueForExport(row[key]);
                } else {
                    // 其他列保持原始格式
                    processedRow[key] = row[key];
                }
            }
            return processedRow;
        });
    }

    /**
     * 预处理数据，防止自动日期转换（旧版本，保留兼容性）
     * @param {Array} data - 数据数组
     * @returns {Array} 预处理后的数据数组
     */
    _preprocessDataForExport(data) {
        return data.map(row => {
            const processedRow = {};
            for (const key in row) {
                processedRow[key] = this._preprocessValueForExport(row[key]);
            }
            return processedRow;
        });
    }

    /**
     * 识别日期列
     * @param {Array} headers - 列名数组
     * @returns {Array} 日期列名数组
     */
    _identifyDateColumns(headers) {
        const dateKeywords = [
            '日期', '时间', '投放日期', '报告日期', '统计日期', '创建时间', '更新时间',
            'date', 'time', 'created', 'updated', 'report', 'stat'
        ];
        
        return headers.filter(header => {
            const lowerHeader = header.toLowerCase();
            return dateKeywords.some(keyword => lowerHeader.includes(keyword));
        });
    }

    /**
     * 预处理日期值，防止自动日期转换
     * @param {any} value - 日期值
     * @returns {any} 预处理后的值
     */
    _preprocessDateValueForExport(value) {
        if (value === null || value === undefined || value === '') {
            return value;
        }

        const stringValue = String(value);
        
        // 对于日期列，如果确实是日期格式，进行保护
        if (this._isActualDateFormat(stringValue)) {
            return `'${stringValue}`; // 单引号前缀，Excel传统的文本强制标记
        }
        
        return value;
    }

    /**
     * 检查是否为真正的日期格式（更严格的检查）
     * @param {string} value - 字符串值
     * @returns {boolean} 是否为真正的日期格式
     */
    _isActualDateFormat(value) {
        if (typeof value !== 'string') {
            return false;
        }
        
        // 只对标准日期格式进行保护，避免误伤分数和百分比
        const strictDatePatterns = [
            /^\d{4}-\d{1,2}-\d{1,2}$/,     // YYYY-MM-DD 格式
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,   // MM/DD/YYYY 格式（完整年份）
            /^\d{4}\/\d{1,2}\/\d{1,2}$/,   // YYYY/MM/DD 格式
            /^\d{1,2}-\d{1,2}-\d{4}$/      // MM-DD-YYYY 格式（完整年份）
        ];

        return strictDatePatterns.some(pattern => pattern.test(value));
    }

    /**
     * 智能设置工作表格式
     * @param {Object} worksheet - XLSX工作表对象
     * @param {Array} data - 数据数组
     */
    _intelligentSetWorksheetFormat(worksheet, data) {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const dateColumns = this._identifyDateColumns(headers);
        
        // 只对日期列设置文本格式保护
        if (!worksheet['!cols']) worksheet['!cols'] = [];
        
        headers.forEach((header, index) => {
            if (!worksheet['!cols'][index]) worksheet['!cols'][index] = {};
            
            if (dateColumns.includes(header)) {
                // 日期列：设置为文本格式以保护日期格式
                worksheet['!cols'][index].z = '@';
            } else {
                // 其他列：保持默认格式，让Excel自动识别
                // 不设置特殊格式，保持数据原始性
            }
        });
    }

    /**
     * 预处理单个值，防止自动日期转换
     * @param {any} value - 值
     * @returns {any} 预处理后的值
     */
    _preprocessValueForExport(value) {
        if (value === null || value === undefined || value === '') {
            return value;
        }

        const stringValue = String(value);
        
        // 检查是否可能被误认为日期的格式
        if (this._mightBeInterpretedAsDate(stringValue)) {
            // 使用多重保护机制：
            // 1. 添加制表符前缀，强制Excel识别为文本
            // 2. 或者添加单引号前缀（Excel的传统文本标记）
            return `'${stringValue}`; // 单引号前缀，Excel传统的文本强制标记
        }
        
        return value;
    }

    /**
     * 检查值是否可能被Excel误认为日期
     * @param {string} value - 字符串值
     * @returns {boolean} 是否可能被误认为日期
     */
    _mightBeInterpretedAsDate(value) {
        if (typeof value !== 'string') {
            return false;
        }
        
        // 常见的可能被误认为日期的格式
        const datePatterns = [
            /^\d{4}-\d{1,2}-\d{1,2}$/,     // YYYY-MM-DD 或 YYYY-M-D
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,   // MM/DD/YYYY 或 M/D/YYYY
            /^\d{1,2}-\d{1,2}-\d{4}$/,     // MM-DD-YYYY 或 M-D-YYYY
            /^\d{1,2}\.\d{1,2}\.\d{4}$/,   // MM.DD.YYYY 或 M.D.YYYY
            /^\d{1,2}\/\d{1,2}$/,          // MM/DD 或 M/D
            /^\d{1,2}-\d{1,2}$/,           // MM-DD 或 M-D
            /^\d{4}\/\d{1,2}\/\d{1,2}$/,   // YYYY/MM/DD 或 YYYY/M/D
            /^\d{1,2}:\d{1,2}$/,           // HH:MM 时间格式
            /^\d{1,2}:\d{1,2}:\d{1,2}$/    // HH:MM:SS 时间格式
        ];

        return datePatterns.some(pattern => pattern.test(value));
    }

    /**
     * 为工作表设置列格式为文本（防止Excel自动转换）
     * @param {Object} worksheet - XLSX工作表对象
     * @param {Array} data - 数据数组
     */
    _setWorksheetTextFormat(worksheet, data) {
        if (!data || data.length === 0) return;
        
        const range = this.XLSX.utils.decode_range(worksheet['!ref']);
        
        // 遍历每个单元格，强制设置为文本格式
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = this.XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellAddress];
                
                if (cell && cell.v !== undefined) {
                    const stringValue = String(cell.v);
                    
                    // 对所有可能被误认为日期的值进行强化保护
                    if (this._mightBeInterpretedAsDate(stringValue) || 
                        // 额外检查：任何包含连字符或斜杠的数字组合
                        /\d.*[-\/]\d/.test(stringValue)) {
                        
                        cell.t = 's'; // 强制设置为字符串类型
                        cell.z = '@'; // 强制设置数字格式为文本
                        
                        // 如果值没有单引号前缀，添加它
                        if (!stringValue.startsWith("'")) {
                            cell.v = `'${stringValue}`;
                        }
                    }
                }
            }
        }
    }
}

// 导出单例实例
const exporter = new Exporter();
export default exporter; 