package com.foo.bean.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.apache.commons.codec.binary.StringUtils;

/**
 * @Author bar 
 * @Description
 * @Date 2024/7/10 10:41
 **/
public interface InterfaceEnums {
    /**
     * 状态枚举
     */
    @Getter
    @AllArgsConstructor
    enum ITSoftStatus {
        Draft(0, "草稿", 0, 1),
        Analysis(1, "需求分析中", 0,2),
        Solution(2, "制定解决方案中", 1,3),
        DEV(3, "开发中", 2, 4),
        SIT(4, "SIT测试中", 3,5),
        UAT(5, "UAT测试中", 4,6),
        UAT_PASS(6, "UAT通过", 5,7),
        Wait_Publish(7, "待发布", 6,99),
        Completed(99, "已完成", 0,7),
        Close(11, "已结案", 0,0),
        ;

        private final Integer code;
        private final String name;
        //上一个状态
        private final Integer preCode ;
        //下一个状态
        private final Integer nextCode ;

        public static ITSoftStatus getByCode(Integer code) {
            for (ITSoftStatus value : values()) {
                if (code.equals(value.getCode())) {
                    return value;
                }
            }
            return ITSoftStatus.Draft;
        }
    }

    /**
     * 动作枚举
     **/
    @Getter
    @AllArgsConstructor
    enum ITSoftAction {
        Submit(0, "提交"),
        Reject(1, "驳回"),
        Close(2, "结案"),
        Transfer(3, "转办"),
        Publish(4, "发布上线"),
        OTHER(-1, "其他"),
        ;

        private final Integer code;
        private final String name;

        public static ITSoftAction getByCode(Integer code) {
            for (ITSoftAction value : values()) {
                if (code.equals(value.getCode())) {
                    return value;
                }
            }
            return ITSoftAction.Submit;
        }
    }


    @Getter
    @AllArgsConstructor
    enum LogType {
        SYSTEM(0, "系统"),
        USER(1, "用户"),
        ;

        private final Integer code;
        private final String name;

        public static LogType getByCode(Integer code) {
            for (LogType value : values()) {
                if (code.equals(value.getCode())) {
                    return value;
                }
            }
            return LogType.SYSTEM;
        }
    }

}
