/**
* Project Name：Tco
* Company Name：GD
* Program Name：TcoBaseConfigMaterialTypeDto.java
* @description：成本主动管理
* @author jin
* <p>
* Update History
* ==============================================================================
* Version    Date           Updated By     Description
* -------    -----------    -----------    ---------------
* V1.0       2024-07-29      jin         创建
* ==============================================================================
*/
@Data
public class MyPojo {
	private Integer id;
	/**
    * BU
    * @xx xxds
    */
    private Integer foo;
	private String name;

	public Integer getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
}
