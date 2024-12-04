package com.foo.data.constant;

/**
 * Project Name：Foo
 * Company Name：Bar
 * Program Name：ExcelConstant.java
 * Description： Excel常量信息
 *
 * @author baz 
 * <p>
 * Update History
 * ==============================================================================
 * Version    Date           Updated By     Description
 * -------    -----------    -----------    ---------------
 * ==============================================================================
 */
public class ExcelConstant {

    public static final String VALUE_TYPE_FIELD = "valueType";
    public static final String LOOKUP_INFO_FIELD = "lookup";
    public static final String ERROR_FIELD_CODE = "importError";
    public static final String STATUS_FIELD_CODE = "importProcessStatus";
    public static final String STATUS_HEADER_FIELD_NAME = "处理状态";
    public static final String STATUS_SUCCESS_VALUE = "SUCCESS";
    public static final String STATUS_ERROR_VALUE = "ERROR";
    public static final String EXCEL_EXTENSION_XLS = ".xls";
    public static final String EXCEL_EXTENSION_XLSX = ".xlsx";

    public static final String BASE64_PREFIX_XLS = "data:application/vnd.ms-excel;base64,";
    public static final String BASE64_PREFIX_XLSX = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,";
}
