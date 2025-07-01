/**
 * RuleXcel - 文件解析器
 * 负责解析Excel(.xlsx, .xls)和CSV文件
 * 使用SheetJS库进行文件解析
 * @author RuleXcel
 */

import validator from '../utils/validator.js';
import logger from '../utils/logger.js';

export class FileParser {
    constructor() {
        this.validator = validator;
        this.logger = logger;
        
        // 支持的文件类型
        this.supportedTypes = {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'application/vnd.ms-excel': 'xls',
            'text/csv': 'csv',
            'application/csv': 'csv'
        };
        
        // 文件大小限制 (10MB)
        this.maxFileSize = 10 * 1024 * 1024;
        
        // 检查必要的依赖库
        this.checkDependencies();
    }
    
    /**
     * 检查必要的依赖库是否已加载
     */
    checkDependencies() {
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX库未加载，请确保已正确引入libs/xlsx.min.js');
        }
        
        if (typeof aq === 'undefined') {
            console.warn('Arquero库未加载，部分功能可能受限');
        }
        
        this.logger.debug('依赖库检查完成', {
            XLSX: typeof XLSX !== 'undefined',
            Arquero: typeof aq !== 'undefined'
        });
    }

    /**
     * 解析文件
     * @param {File} file - 要解析的文件
     * @returns {Promise<Array>} 解析后的数据数组
     */
    async parseFile(file) {
        try {
            // 验证文件
            this.validateFile(file);
            
            // 读取文件
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            // 根据文件类型解析
            const fileType = this.getFileType(file);
            let data;
            
            switch (fileType) {
                case 'xlsx':
                case 'xls':
                    data = this.parseExcelFile(arrayBuffer);
                    break;
                case 'csv':
                    data = this.parseCsvFile(arrayBuffer);
                    break;
                default:
                    throw new Error(`不支持的文件类型: ${file.type}`);
            }
            
            // 验证解析结果
            this.validateParsedData(data);
            
            this.logger.info(`文件解析成功: ${file.name}`, {
                文件大小: `${(file.size / 1024).toFixed(2)}KB`,
                记录数: data.length,
                列数: data.length > 0 ? Object.keys(data[0]).length : 0
            });
            
            return data;
            
        } catch (error) {
            this.logger.error(`文件解析失败: ${file.name}`, error);
            throw new Error(`解析文件 "${file.name}" 时出错: ${error.message}`);
        }
    }

    /**
     * 验证文件
     * @param {File} file - 要验证的文件
     */
    validateFile(file) {
        // 检查文件是否存在
        if (!file) {
            throw new Error('文件不能为空');
        }

        // 检查文件大小
        if (file.size > this.maxFileSize) {
            throw new Error(`文件大小超过限制 (${this.maxFileSize / 1024 / 1024}MB)`);
        }

        // 检查文件类型
        const fileType = this.getFileType(file);
        if (!fileType) {
            throw new Error(`不支持的文件类型: ${file.type || '未知'}`);
        }

        // 检查文件扩展名
        const extension = this.getFileExtension(file.name);
        if (!['xlsx', 'xls', 'csv'].includes(extension)) {
            throw new Error(`不支持的文件扩展名: .${extension}`);
        }
    }

    /**
     * 获取文件类型
     * @param {File} file - 文件对象
     * @returns {string} 文件类型
     */
    getFileType(file) {
        // 优先使用MIME类型判断
        if (file.type && this.supportedTypes[file.type]) {
            return this.supportedTypes[file.type];
        }
        
        // fallback到文件扩展名判断
        const extension = this.getFileExtension(file.name);
        if (['xlsx', 'xls', 'csv'].includes(extension)) {
            return extension;
        }
        
        return null;
    }

    /**
     * 获取文件扩展名
     * @param {string} fileName - 文件名
     * @returns {string} 扩展名
     */
    getFileExtension(fileName) {
        return fileName.split('.').pop().toLowerCase();
    }

    /**
     * 读取文件为ArrayBuffer
     * @param {File} file - 文件对象
     * @returns {Promise<ArrayBuffer>} ArrayBuffer数据
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 解析Excel文件
     * @param {ArrayBuffer} arrayBuffer - 文件数据
     * @returns {Array} 解析后的数据
     */
    parseExcelFile(arrayBuffer) {
        try {
            // 使用SheetJS解析工作簿
            const workbook = XLSX.read(arrayBuffer, { 
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: false
            });
            
            // 获取第一个工作表
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                throw new Error('Excel文件中没有找到工作表');
            }
            
            const worksheet = workbook.Sheets[sheetName];
            
            // 转换为JSON格式
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1, // 使用数组格式
                raw: false, // 格式化数值
                dateNF: 'yyyy-mm-dd'
            });
            
            // 处理数据格式
            return this.processExcelData(jsonData);
            
        } catch (error) {
            throw new Error(`Excel文件解析失败: ${error.message}`);
        }
    }

    /**
     * 处理Excel数据格式
     * @param {Array} rawData - 原始数据
     * @returns {Array} 处理后的数据
     */
    processExcelData(rawData) {
        if (!rawData || rawData.length === 0) {
            return [];
        }
        
        // 获取表头
        const headers = rawData[0];
        if (!headers || headers.length === 0) {
            throw new Error('Excel文件没有有效的表头');
        }
        
        // 清理表头（去除空值和重复值）
        const cleanHeaders = this.cleanHeaders(headers);
        
        // 转换数据行
        const dataRows = rawData.slice(1);
        const processedData = [];
        
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            if (this.isEmptyRow(row)) {
                continue; // 跳过空行
            }
            
            const rowObject = {};
            for (let j = 0; j < cleanHeaders.length; j++) {
                const header = cleanHeaders[j];
                const value = row[j];
                rowObject[header] = this.formatCellValue(value);
            }
            
            processedData.push(rowObject);
        }
        
        return processedData;
    }

    /**
     * 解析CSV文件
     * @param {ArrayBuffer} arrayBuffer - 文件数据
     * @returns {Array} 解析后的数据
     */
    parseCsvFile(arrayBuffer) {
        try {
            // 将ArrayBuffer转换为字符串
            const decoder = new TextDecoder('utf-8');
            let csvText = decoder.decode(arrayBuffer);
            
            // 尝试检测编码，如果是乱码则尝试GBK
            if (this.containsGarbledText(csvText)) {
                const gbkDecoder = new TextDecoder('gbk');
                csvText = gbkDecoder.decode(arrayBuffer);
            }
            
            // 使用SheetJS解析CSV
            const workbook = XLSX.read(csvText, { 
                type: 'string',
                raw: false
            });
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: false
            });
            
            return this.processExcelData(jsonData); // 复用Excel的数据处理逻辑
            
        } catch (error) {
            throw new Error(`CSV文件解析失败: ${error.message}`);
        }
    }

    /**
     * 检测文本是否包含乱码
     * @param {string} text - 文本内容
     * @returns {boolean} 是否包含乱码
     */
    containsGarbledText(text) {
        // 简单的乱码检测：包含大量问号或特殊字符
        const garbledPattern = /[��]/g;
        const matches = text.match(garbledPattern);
        return matches && matches.length > 10;
    }

    /**
     * 清理表头
     * @param {Array} headers - 原始表头
     * @returns {Array} 清理后的表头
     */
    cleanHeaders(headers) {
        const cleanHeaders = [];
        const usedHeaders = new Set();
        
        for (let i = 0; i < headers.length; i++) {
            let header = headers[i];
            
            // 处理空表头
            if (!header || header.toString().trim() === '') {
                header = `Column_${i + 1}`;
            } else {
                header = header.toString().trim();
            }
            
            // 处理重复表头
            let finalHeader = header;
            let counter = 1;
            while (usedHeaders.has(finalHeader)) {
                finalHeader = `${header}_${counter}`;
                counter++;
            }
            
            usedHeaders.add(finalHeader);
            cleanHeaders.push(finalHeader);
        }
        
        return cleanHeaders;
    }

    /**
     * 检查是否为空行
     * @param {Array} row - 数据行
     * @returns {boolean} 是否为空行
     */
    isEmptyRow(row) {
        if (!row || row.length === 0) {
            return true;
        }
        
        return row.every(cell => 
            cell === null || 
            cell === undefined || 
            cell.toString().trim() === ''
        );
    }

    /**
     * 格式化单元格值
     * @param {any} value - 单元格值
     * @returns {any} 格式化后的值
     */
    formatCellValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        
        // 处理数字
        if (typeof value === 'number') {
            return value;
        }
        
        // 处理日期
        if (value instanceof Date) {
            return value.toISOString().split('T')[0]; // YYYY-MM-DD格式
        }
        
        // 处理字符串
        const stringValue = value.toString().trim();
        
        // 尝试转换为数字
        if (/^\d+\.?\d*$/.test(stringValue)) {
            const numValue = parseFloat(stringValue);
            if (!isNaN(numValue)) {
                return numValue;
            }
        }
        
        // 尝试转换为日期
        const dateValidation = this.validator.validateDate(stringValue);
        if (dateValidation.isValid) {
            return dateValidation.parsedDate.toISOString().split('T')[0];
        }
        
        return stringValue;
    }

    /**
     * 验证解析后的数据
     * @param {Array} data - 解析后的数据
     */
    validateParsedData(data) {
        if (!Array.isArray(data)) {
            throw new Error('解析结果必须是数组');
        }
        
        if (data.length === 0) {
            throw new Error('文件中没有有效数据');
        }
        
        // 检查数据量限制
        const maxRows = 100000; // 10万行限制
        if (data.length > maxRows) {
            throw new Error(`数据行数超过限制 (${maxRows.toLocaleString()}行)`);
        }
        
        // 检查第一行是否有有效字段
        const firstRow = data[0];
        if (!firstRow || typeof firstRow !== 'object') {
            throw new Error('数据格式不正确');
        }
        
        const validFields = Object.keys(firstRow).filter(key => 
            key && key.trim() !== ''
        );
        
        if (validFields.length === 0) {
            throw new Error('没有找到有效的数据字段');
        }
    }

    /**
     * 获取文件信息摘要
     * @param {File} file - 文件对象
     * @param {Array} data - 解析后的数据
     * @returns {Object} 文件信息摘要
     */
    getFileSummary(file, data) {
        const summary = {
            fileName: file.name,
            fileSize: file.size,
            fileType: this.getFileType(file),
            records: data.length,
            columns: data.length > 0 ? Object.keys(data[0]).length : 0,
            columnsNames: data.length > 0 ? Object.keys(data[0]) : [],
            lastModified: new Date(file.lastModified).toISOString()
        };
        
        return summary;
    }
} 