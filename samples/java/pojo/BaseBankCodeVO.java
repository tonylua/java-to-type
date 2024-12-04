package com.foo.base.core.pojo.vo;

import com.alibaba.fastjson.annotation.JSONField;
import java.io.Serializable;
import java.math.BigDecimal;
import com.foo.base.core.pojo.BaseVO;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;



/**
* Project Name：FOO V6.0
* Company Name：BAZ
* Program Name：BaseBankCodeVO.java
* @description：银行代码表 VO类
* <p>
* Update History
* ==============================================================================
* Version    Date           Updated By     Description
* -------    -----------    -----------    ---------------
* ==============================================================================
*/
@Data
@EqualsAndHashCode (callSuper = true)
@ApiModel(value = "银行代码表VO", description = "银行代码表")
public class BaseBankCodeVO extends BaseVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**<p>数据库主键</p>*/
    @ApiModelProperty(value = "数据库主键")
    private Long bankId;

    /**<p>银行代码</p>*/
    @ApiModelProperty(value = "银行代码")
    @NotEmpty(message = "银行代码不可为空")
    @NotNull(message = "银行代码不可为空")
    private String bankCode;

    /**<p>银行国家</p>*/
    @ApiModelProperty(value = "银行国家")
    @NotEmpty(message = "银行国家不可为空")
    @NotNull(message = "银行国家不可为空")
    private String bankCountry;

    /**<p>银行名称</p>*/
    @ApiModelProperty(value = "银行名称")
    @NotEmpty(message = "银行名称不可为空")
    @NotNull(message = "银行名称不可为空")
    private String bankName;

    /**<p>银行编号</p>*/
    @ApiModelProperty(value = "银行编号")
    private String bankNo;

    /**<p>分行</p>*/
    @ApiModelProperty(value = "分行")
    private String bankBranch;

}
